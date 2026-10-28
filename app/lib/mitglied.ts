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

  return { supabase, user, profil, anzeigeName: anzeigeName(profil, user.email) };
}

export function anzeigeName(profil: Profil, email?: string | null) {
  const name = `${profil.vorname} ${profil.nachname}`.trim();
  if (name && profil.firma) return `${name} (${profil.firma})`;
  return name || profil.firma || email || "Ein Mitglied";
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
