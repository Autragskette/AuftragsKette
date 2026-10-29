"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { berlinZuIso } from "@/lib/veranstaltungen";

async function mitglied() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");
  return { supabase, user };
}

export async function anmelden(id: string) {
  const { supabase, user } = await mitglied();
  await supabase.from("teilnahmen").insert({ veranstaltung_id: id, mitglied_id: user.id });
  revalidatePath("/dashboard", "layout");
}

export async function abmelden(id: string) {
  const { supabase, user } = await mitglied();
  await supabase
    .from("teilnahmen")
    .delete()
    .eq("veranstaltung_id", id)
    .eq("mitglied_id", user.id);
  revalidatePath("/dashboard", "layout");
}

const MELDUNGEN: Record<string, string> = {
  falscher_code: "Der Code stimmt nicht. Bitte prüfe ihn noch einmal.",
  zu_frueh: "Einchecken ist erst 30 Minuten vor Beginn möglich.",
  zu_spaet: "Einchecken war nur bis 24 Stunden nach Ende möglich.",
  nur_mitglieder: "Einchecken und Punkte sammeln ist Mitgliedern vorbehalten.",
  unbekannt: "Diese Veranstaltung gibt es nicht mehr.",
};

export type CheckinStatus = { fehler: string | null; ok: boolean };

export async function einchecken(
  id: string,
  _vorher: CheckinStatus,
  formData: FormData,
): Promise<CheckinStatus> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { fehler: "Bitte den Code eingeben.", ok: false };

  const { supabase } = await mitglied();
  const { data, error } = await supabase.rpc("einchecken", { p_id: id, p_code: code });
  if (error) {
    console.error("Einchecken fehlgeschlagen:", error);
    return { fehler: "Das hat nicht geklappt. Bitte erneut versuchen.", ok: false };
  }
  if (data !== "ok") return { fehler: MELDUNGEN[data as string] ?? "Einchecken nicht möglich.", ok: false };

  revalidatePath("/dashboard", "layout");
  return { fehler: null, ok: true };
}

export type AnlegenStatus = { fehler: string | null };

export async function veranstaltungAnlegen(
  _vorher: AnlegenStatus,
  formData: FormData,
): Promise<AnlegenStatus> {
  const lies = (f: string, max = 200) => String(formData.get(f) ?? "").trim().slice(0, max);
  const art = lies("art");
  const titel = lies("titel", 150);
  const beginn = berlinZuIso(lies("beginn"));
  const ende = berlinZuIso(lies("ende"));
  const teams_link = lies("teams_link", 1000);

  if (art !== "branche_online" && art !== "region_vor_ort") return { fehler: "Bitte die Art wählen." };
  if (!titel) return { fehler: "Bitte einen Titel angeben." };
  if (!beginn || !ende) return { fehler: "Bitte Beginn und Ende angeben." };
  if (new Date(ende) <= new Date(beginn)) return { fehler: "Das Ende muss nach dem Beginn liegen." };
  if (art === "branche_online" && !lies("branche")) return { fehler: "Bitte die Branche angeben." };
  if (art === "region_vor_ort" && !lies("region")) return { fehler: "Bitte die Region angeben." };
  if (teams_link && !/^https:\/\//.test(teams_link)) return { fehler: "Der Teams-Link muss mit https:// beginnen." };

  const { supabase, user } = await mitglied();
  const { data, error } = await supabase
    .from("veranstaltungen")
    .insert({
      titel,
      art,
      branche: lies("branche", 100),
      region: lies("region", 100),
      beginn,
      ende,
      ort: lies("ort", 300),
      teams_link,
      beschreibung: lies("beschreibung", 2000),
      erstellt_von: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Veranstaltung anlegen fehlgeschlagen:", error);
    return { fehler: "Speichern nicht möglich. Nur Admins dürfen Veranstaltungen anlegen." };
  }

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/veranstaltungen#v-${data.id}`);
}

export async function veranstaltungLoeschen(id: string) {
  const { supabase } = await mitglied();
  await supabase.from("veranstaltungen").delete().eq("id", id);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/veranstaltungen");
}
