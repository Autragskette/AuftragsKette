import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profil = {
  vorname: string;
  nachname: string;
  firma: string;
  branche: string;
  plz: string;
  ort: string;
  telefon: string;
  erstellt_am: string;
  rolle?: "mitglied" | "partner";
};

/** Angemeldetes Mitglied samt Profil; leitet sonst zur Anmeldung um. */
export async function aktuellesMitglied() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const { data } = await supabase
    .from("profile")
    .select("vorname, nachname, firma, branche, plz, ort, telefon, erstellt_am, rolle")
    .eq("id", user.id)
    .maybeSingle();

  const profil = (data ?? {
    vorname: "",
    nachname: "",
    firma: "",
    branche: "",
    plz: "",
    ort: "",
    telefon: "",
    erstellt_am: new Date().toISOString(),
    rolle: "partner",
  }) as Profil;

  return {
    supabase,
    user,
    profil,
    anzeigeName: anzeigeName(profil),
    signatur: signatur(profil),
    profilVollstaendig: profilVollstaendig(profil),
    /** Schnupperzugang: sieht die App, kann aber nur Mitgliedern Vorbehaltenes nicht nutzen */
    istPartner: profil.rolle !== "mitglied",
  };
}

/** Vor- und Nachname sind Pflicht, bevor man Einladungen oder Empfehlungen verschickt. */
export function profilVollstaendig(profil: Partial<Profil>) {
  return Boolean(profil.vorname?.trim() && profil.nachname?.trim());
}

/**
 * Wer schreibt? Z. B. "Max Muster von Lichtblick Fotografie"
 * oder "Max Muster (Freelancer Webdesign)", wenn keine Firma angegeben ist.
 */
export function anzeigeName(profil: Partial<Profil>) {
  const name = `${profil.vorname ?? ""} ${profil.nachname ?? ""}`.trim();
  const firma = profil.firma?.trim();
  const branche = profil.branche?.trim();
  if (!name) return firma || "Ein Mitglied von AuftragsKette";
  if (firma) return `${name} von ${firma}`;
  if (branche) return `${name} (${branche})`;
  return name;
}

/** Grußzeilen unter Nachrichten: Name, darunter Firma bzw. Tätigkeit und Telefon. */
export function signatur(profil: Partial<Profil>) {
  const name = `${profil.vorname ?? ""} ${profil.nachname ?? ""}`.trim();
  return [name, profil.firma?.trim() || profil.branche?.trim(), profil.telefon?.trim()]
    .filter(Boolean)
    .join("\n");
}

/**
 * Regeln für Startkontakte (bestätigte Kontakte):
 *   1. Kontakt zum Start, 2. innerhalb von 2 Monaten, 3. innerhalb von 3 Monaten.
 * Lehnen vorgeschlagene Kontakte ab, bleibt man trotzdem Mitglied und hat
 * ab der letzten Ablehnung 6 Monate Nachfrist für die fehlenden Kontakte.
 */
export const PFLICHT_GESAMT = 3;
export const PFLICHT_MONATE = [0, 2, 3] as const;
export const NACHFRIST_MONATE = 6;

export type PflichtSchritt = {
  nr: number;
  frist: Date;
  sofort: boolean;
  erfuellt: boolean;
  ueberfaellig: boolean;
  tageRest: number;
};

function plusMonate(datum: Date, monate: number) {
  const neu = new Date(datum);
  neu.setMonth(neu.getMonth() + monate);
  return neu;
}

export function pflichtStand(
  bestaetigt: number,
  aufgenommenAm: string,
  letzteAblehnung?: string | null,
) {
  const start = new Date(aufgenommenAm);
  const nachfristBis = letzteAblehnung
    ? plusMonate(new Date(letzteAblehnung), NACHFRIST_MONATE)
    : null;

  const schritte: PflichtSchritt[] = PFLICHT_MONATE.map((monate, i) => {
    let frist = plusMonate(start, monate);
    if (nachfristBis && nachfristBis > frist) frist = nachfristBis;
    const erfuellt = bestaetigt > i;
    const tageRest = Math.ceil((frist.getTime() - Date.now()) / 86_400_000);
    return {
      nr: i + 1,
      frist,
      sofort: monate === 0 && !nachfristBis,
      erfuellt,
      ueberfaellig: !erfuellt && tageRest < 0,
      tageRest,
    };
  });

  const naechster = schritte.find((s) => !s.erfuellt) ?? null;

  return {
    schritte,
    naechster,
    fehlen: Math.max(0, PFLICHT_GESAMT - bestaetigt),
    nachfrist: Boolean(nachfristBis && schritte.some((s) => !s.erfuellt)),
    nachfristBis,
    ueberfaellig: schritte.some((s) => s.ueberfaellig),
  };
}
