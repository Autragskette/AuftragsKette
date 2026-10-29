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
    .select("vorname, nachname, firma, branche, plz, ort, telefon, erstellt_am")
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
  }) as Profil;

  return {
    supabase,
    user,
    profil,
    anzeigeName: anzeigeName(profil),
    signatur: signatur(profil),
    profilVollstaendig: profilVollstaendig(profil),
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

/** Regeln für Pflichtkontakte: 2 zum Start, 3 innerhalb von 3 Monaten. */
export const PFLICHT_START = 2;
export const PFLICHT_GESAMT = 3;
export const FRIST_MONATE = 3;

export function pflichtStand(bestaetigt: number, aufgenommenAm: string) {
  const start = new Date(aufgenommenAm);
  const frist = new Date(start);
  frist.setMonth(frist.getMonth() + FRIST_MONATE);
  const tageRest = Math.ceil((frist.getTime() - Date.now()) / 86_400_000);

  return {
    fehlenStart: Math.max(0, PFLICHT_START - bestaetigt),
    fehlenGesamt: Math.max(0, PFLICHT_GESAMT - bestaetigt),
    frist,
    tageRest,
    fristAbgelaufen: tageRest < 0,
  };
}
