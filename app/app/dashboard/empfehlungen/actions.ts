"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendeEmail } from "@/lib/email";
import { anzeigeName, profilVollstaendig, type Profil } from "@/lib/mitglied";

export type EmpfehlungStatus = { fehler: string | null };

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Partner = { id: string; name: string; email: string; leistung: string };

export async function empfehlungAnlegen(
  kontaktId: string,
  _vorher: EmpfehlungStatus,
  formData: FormData,
): Promise<EmpfehlungStatus> {
  const lies = (f: string, max = 200) => String(formData.get(f) ?? "").trim().slice(0, max);
  const kunde_name = lies("kunde_name", 120);
  const kunde_telefon = lies("kunde_telefon", 50);
  const kunde_email = lies("kunde_email");
  const nachricht = lies("nachricht", 1000);
  const nachfrage_erlaubt = formData.get("nachfrage_erlaubt") === "on";

  if (!kunde_name) return { fehler: "Bitte den Namen des Kunden angeben." };
  if (kunde_email && !EMAIL_MUSTER.test(kunde_email))
    return { fehler: "Die E-Mail-Adresse des Kunden sieht nicht richtig aus." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const { data: ich } = await supabase
    .from("profile")
    .select("vorname, nachname, firma, branche, plz, ort, telefon, erstellt_am")
    .eq("id", user.id)
    .single();
  if (!ich || !profilVollstaendig(ich)) {
    return { fehler: "Bitte trage zuerst deinen Namen in deinem Profil ein, damit der Kunde sieht, wer empfiehlt." };
  }

  const { data: treffer } = await supabase.rpc("netzwerk_kontakt", { p_id: kontaktId });
  const partner = (Array.isArray(treffer) ? treffer[0] : treffer) as Partner | undefined;
  if (!partner) return { fehler: "Dieser Partner ist nicht (mehr) im Netzwerk verfügbar." };

  const { data, error } = await supabase
    .from("kundenempfehlungen")
    .insert({
      von_id: user.id,
      kontakt_id: partner.id,
      kontakt_name: partner.name,
      kunde_name,
      kunde_telefon,
      kunde_email,
      nachricht,
      nachfrage_erlaubt,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Empfehlung anlegen fehlgeschlagen:", error);
    return { fehler: "Die Empfehlung konnte nicht gespeichert werden. Bitte erneut versuchen." };
  }

  // Partner informieren (nur wenn automatischer E-Mail-Versand eingerichtet ist)
  if (partner.email) {
    const absender = anzeigeName(ich as Profil);
    await sendeEmail({
      an: partner.email,
      betreff: `Neue Empfehlung über AuftragsKette`,
      text: `Hallo ${partner.name.split(" ")[0]},

${absender} hat dich gerade über AuftragsKette an ${kunde_name} für ${partner.leistung} empfohlen. Der Kunde meldet sich bei dir oder hat deine Kontaktdaten erhalten.

Viel Erfolg!
AuftragsKette`,
    });
  }

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/empfehlungen/${data.id}?neu=1`);
}

const KANAELE = ["whatsapp", "email", "visitenkarte"] as const;

export async function kanalMerken(id: string, kanal: string) {
  if (!KANAELE.includes(kanal as (typeof KANAELE)[number])) return;
  const supabase = await createClient();
  await supabase.from("kundenempfehlungen").update({ kanal }).eq("id", id);
}

export async function ergebnisEintragen(id: string, ergebnis: "auftrag" | "kein_auftrag") {
  const supabase = await createClient();
  const { error } = await supabase
    .from("kundenempfehlungen")
    .update({ ergebnis, ergebnis_am: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("Ergebnis speichern fehlgeschlagen:", error);

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/empfehlungen/${id}`);
}

export async function erinnerungVermerken(id: string) {
  const supabase = await createClient();
  await supabase
    .from("kundenempfehlungen")
    .update({ erinnert_am: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/dashboard", "layout");
}

export async function empfehlungLoeschen(id: string) {
  const supabase = await createClient();
  await supabase.from("kundenempfehlungen").delete().eq("id", id);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/empfehlungen");
}
