"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function einladungBeantworten(token: string, formData: FormData) {
  const zustimmung = formData.get("antwort") === "ja";
  const mitglied = formData.get("mitglied") === "on";

  const supabase = await createClient();
  const { error } = await supabase.rpc("einladung_beantworten", {
    p_token: token,
    p_zustimmung: zustimmung,
    p_mitglied_interesse: mitglied,
  });

  if (error) {
    console.error("Einladung beantworten fehlgeschlagen:", error);
    redirect(`/bestaetigen/${token}?fehler=1`);
  }

  redirect(`/bestaetigen/${token}?antwort=${zustimmung ? "ja" : "nein"}`);
}
