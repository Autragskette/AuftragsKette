"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type KontaktFelder = {
  name: string;
  firma: string;
  leistung: string;
  email: string;
  telefon: string;
  notiz: string;
};

export type KontaktStatus = {
  fehler: string | null;
  feldFehler: Partial<Record<keyof KontaktFelder, string>>;
  werte: KontaktFelder;
  /** Zählt Absendeversuche, damit das Formular die Werte neu anzeigt. */
  versuch: number;
};

const MAX_LAENGE: Record<keyof KontaktFelder, number> = {
  name: 120,
  firma: 120,
  leistung: 200,
  email: 200,
  telefon: 50,
  notiz: 2000,
};

const EMAIL_MUSTER = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function felderAuslesen(formData: FormData): KontaktFelder {
  const lies = (name: keyof KontaktFelder) =>
    String(formData.get(name) ?? "").trim();
  return {
    name: lies("name"),
    firma: lies("firma"),
    leistung: lies("leistung"),
    email: lies("email"),
    telefon: lies("telefon"),
    notiz: lies("notiz"),
  };
}

function pruefen(werte: KontaktFelder): KontaktStatus["feldFehler"] {
  const fehler: KontaktStatus["feldFehler"] = {};

  if (!werte.name) fehler.name = "Bitte einen Namen eingeben.";
  if (!werte.leistung)
    fehler.leistung = "Bitte angeben, wofür du den Kontakt empfehlen würdest.";
  if (werte.email && !EMAIL_MUSTER.test(werte.email))
    fehler.email = "Diese E-Mail-Adresse sieht nicht richtig aus.";
  if (!werte.email && !werte.telefon)
    fehler.telefon = "Bitte E-Mail-Adresse oder Telefonnummer angeben.";

  (Object.keys(MAX_LAENGE) as (keyof KontaktFelder)[]).forEach((feld) => {
    if (!fehler[feld] && werte[feld].length > MAX_LAENGE[feld]) {
      fehler[feld] = `Höchstens ${MAX_LAENGE[feld]} Zeichen.`;
    }
  });

  return fehler;
}

/**
 * Legt einen neuen Kontakt an (ohne id) oder aktualisiert einen
 * bestehenden (mit id). Wird mit .bind(null, id) verwendet.
 */
export async function kontaktSpeichern(
  id: string | null,
  vorher: KontaktStatus,
  formData: FormData,
): Promise<KontaktStatus> {
  const werte = felderAuslesen(formData);
  const feldFehler = pruefen(werte);

  if (Object.keys(feldFehler).length > 0) {
    return {
      fehler: "Bitte prüfe die markierten Felder.",
      feldFehler,
      werte,
      versuch: vorher.versuch + 1,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const { error } = id
    ? await supabase
        .from("kontakte")
        .update(werte)
        .eq("id", id)
        .eq("besitzer_id", user.id)
    : await supabase
        .from("kontakte")
        .insert({ ...werte, besitzer_id: user.id });

  if (error) {
    console.error("Kontakt speichern fehlgeschlagen:", error);
    return {
      fehler: "Der Kontakt konnte nicht gespeichert werden. Bitte erneut versuchen.",
      feldFehler: {},
      werte,
      versuch: vorher.versuch + 1,
    };
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/netzwerk");
}

export async function kontaktLoeschen(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const { error } = await supabase
    .from("kontakte")
    .delete()
    .eq("id", id)
    .eq("besitzer_id", user.id);

  if (error) {
    console.error("Kontakt löschen fehlgeschlagen:", error);
    throw new Error("Der Kontakt konnte nicht gelöscht werden.");
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/netzwerk");
}
