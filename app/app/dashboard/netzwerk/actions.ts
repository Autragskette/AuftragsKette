"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendeEmail } from "@/lib/email";
import { einladungsBetreff, einladungsText, einladungsTextNetzwerk } from "@/lib/texte";
import { profilVollstaendig, type Profil } from "@/lib/mitglied";
import { basisUrl } from "@/lib/url";

export type KontaktFelder = {
  name: string;
  firma: string;
  leistung: string;
  email: string;
  telefon: string;
  plz: string;
  ort: string;
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
  plz: 5,
  ort: 80,
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
    plz: lies("plz"),
    ort: lies("ort"),
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
  if (!/^\d{5}$/.test(werte.plz))
    fehler.plz = "Bitte eine fünfstellige Postleitzahl angeben.";
  if (!werte.ort) fehler.ort = "Bitte den Ort angeben.";

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

  let kontaktId = id;
  let error;

  if (id) {
    ({ error } = await supabase
      .from("kontakte")
      .update(werte)
      .eq("id", id)
      .eq("besitzer_id", user.id));
  } else {
    const herkunft = formData.get("herkunft") === "netzwerk" ? "netzwerk" : "persoenlich";
    const antwort = await supabase
      .from("kontakte")
      .insert({ ...werte, besitzer_id: user.id, herkunft })
      .select("id")
      .single();
    error = antwort.error;
    kontaktId = antwort.data?.id ?? null;
  }

  if (error || !kontaktId) {
    console.error("Kontakt speichern fehlgeschlagen:", error);
    return {
      fehler: "Der Kontakt konnte nicht gespeichert werden. Bitte erneut versuchen.",
      feldFehler: {},
      werte,
      versuch: vorher.versuch + 1,
    };
  }

  // Bei neuem Kontakt (oder geänderter E-Mail) automatisch einladen, falls möglich
  const { data: stand } = await supabase
    .from("kontakte")
    .select("status, email, name, leistung, einladung_token, herkunft")
    .eq("id", kontaktId)
    .single();

  let versendet = false;
  if (stand && stand.status === "eingeladen" && stand.email) {
    versendet = await einladungVersenden(user.id, stand);
  }

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/netzwerk/${kontaktId}?gespeichert=1${versendet ? "&versendet=1" : ""}`);
}

async function einladungVersenden(
  userId: string,
  kontakt: { email: string; name: string; leistung: string; einladung_token: string; herkunft?: string },
) {
  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("profile")
    .select("vorname, nachname, firma, branche, plz, ort, telefon, erstellt_am")
    .eq("id", userId)
    .single();

  // Ohne Namen keine Einladung: der Kontakt soll sehen, wer ihn empfohlen hat
  if (!profil || !profilVollstaendig(profil)) return false;
  const ich = profil as Profil;
  const absenderName = `${ich.vorname} ${ich.nachname}`.trim();
  const link = `${await basisUrl()}/bestaetigen/${kontakt.einladung_token}`;

  return sendeEmail({
    an: kontakt.email,
    betreff: einladungsBetreff(absenderName),
    text: (kontakt.herkunft === "netzwerk" ? einladungsTextNetzwerk : einladungsText)({
      kontaktName: kontakt.name,
      leistung: kontakt.leistung,
      absenderName,
      absenderFirma: ich.firma || ich.branche,
      link,
    }),
  });
}

/** Einladung erneut per E-Mail senden (nur wenn E-Mail-Versand eingerichtet ist). */
export async function einladungErneutSenden(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const { data: kontakt } = await supabase
    .from("kontakte")
    .select("email, name, leistung, einladung_token, status, herkunft")
    .eq("id", id)
    .eq("besitzer_id", user.id)
    .single();

  const versendet =
    kontakt && kontakt.status !== "bestaetigt" && kontakt.email
      ? await einladungVersenden(user.id, kontakt)
      : false;

  redirect(`/dashboard/netzwerk/${id}?${versendet ? "versendet=1" : "nichtversendet=1"}`);
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

/** Erklärung: keine (weiteren) eigenen Kontakte, Netzwerkkontakte zählen als Startkontakte */
export async function ohneStartkontakteErklaeren() {
  const supabase = await createClient();
  await supabase.rpc("ohne_startkontakte_erklaeren");
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/netzwerk");
}
