"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ProfilStatus = { fehler: string | null; gespeichert: boolean };

const FELDER = ["vorname", "nachname", "firma", "branche", "plz", "ort", "telefon"] as const;

export async function profilSpeichern(
  _vorher: ProfilStatus,
  formData: FormData,
): Promise<ProfilStatus> {
  const werte = Object.fromEntries(
    FELDER.map((f) => [f, String(formData.get(f) ?? "").trim().slice(0, 120)]),
  ) as Record<(typeof FELDER)[number], string>;

  if (!werte.vorname || !werte.nachname) {
    return { fehler: "Bitte Vor- und Nachname angeben.", gespeichert: false };
  }
  if (werte.plz && !/^\d{5}$/.test(werte.plz)) {
    return { fehler: "Bitte eine fünfstellige Postleitzahl angeben.", gespeichert: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const { error } = await supabase.from("profile").update(werte).eq("id", user.id);
  if (error) {
    console.error("Profil speichern fehlgeschlagen:", error);
    return { fehler: "Speichern hat nicht geklappt. Bitte erneut versuchen.", gespeichert: false };
  }

  revalidatePath("/dashboard", "layout");
  return { fehler: null, gespeichert: true };
}
