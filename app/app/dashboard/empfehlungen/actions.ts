"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendeEmail } from "@/lib/email";
import { anzeigeName, profilVollstaendig, signatur, type Profil } from "@/lib/mitglied";
import { empfehlungsText, pushEmpfohlen } from "@/lib/texte";
import { pushAktiv, sendePush, type PushAbo } from "@/lib/push";
import { whatsappLink } from "@/lib/teilen";
import { basisUrl } from "@/lib/url";

export type EmpfehlungStatus = {
  fehler: string | null;
  /** Nach dem Speichern: wohin es weitergeht */
  weiter?: { id: string; whatsapp: string | null };
};

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Partner = {
  id: string;
  name: string;
  firma: string;
  email: string;
  telefon: string;
  leistung: string;
  eigener: boolean;
};

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
  const kanal = formData.get("kanal") === "whatsapp" ? "whatsapp" : "visitenkarte";

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
      kanal,
    })
    .select("id, karten_token")
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

${absender} hat dich gerade über AuftragsKette${kunde_name ? ` an ${kunde_name}` : ""} für ${partner.leistung} empfohlen. Der Kunde meldet sich bei dir oder hat deine Kontaktdaten erhalten.

Viel Erfolg!
AuftragsKette`,
    });
  }

  // Push-Nachricht an den Partner, falls er sie in seinem Zugang aktiviert hat
  if (pushAktiv()) {
    const { data: ziele } = await supabase.rpc("push_ziele_empfehlung", { p_empfehlung_id: data.id });
    const absender = anzeigeName(ich as Profil);
    await Promise.all(
      ((ziele ?? []) as (PushAbo & { zweite: boolean })[]).map(async (z) => {
        const inhalt = pushEmpfohlen({ von: absender, zweite: z.zweite });
        const r = await sendePush(z, { titel: inhalt.titel, text: inhalt.text, url: "/dashboard" });
        if (r === "abgelaufen") await supabase.rpc("push_abo_entfernen", { p_endpoint: z.endpoint });
      }),
    );
  }

  revalidatePath("/dashboard", "layout");

  // Fertigen Text für WhatsApp vorbereiten
  let whatsapp: string | null = null;
  if (kanal === "whatsapp") {
    const karte = `${await basisUrl()}/k/${data.karten_token}`;
    const text = empfehlungsText({
      kundeName: kunde_name,
      kontakt: partner,
      signatur: signatur(ich as Profil),
      karte,
      nachricht,
      eigener: partner.eigener,
    });
    whatsapp = whatsappLink(text, kunde_telefon || undefined);
  }

  return { fehler: null, weiter: { id: data.id, whatsapp } };
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
