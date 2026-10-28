"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseEingerichtet } from "@/lib/supabase/config";

export type AnmeldeStatus = { fehler: string | null };

export async function anmelden(
  _vorher: AnmeldeStatus,
  formData: FormData,
): Promise<AnmeldeStatus> {
  if (!supabaseEingerichtet()) {
    return {
      fehler:
        "Die Anmeldung ist noch nicht eingerichtet. Bitte später erneut versuchen.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const passwort = String(formData.get("passwort") ?? "");

  if (!email || !passwort) {
    return { fehler: "Bitte E-Mail-Adresse und Passwort eingeben." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: passwort,
  });

  if (error) {
    return {
      fehler:
        error.code === "email_not_confirmed"
          ? "Bitte bestätige zuerst deine E-Mail-Adresse."
          : "E-Mail-Adresse oder Passwort ist falsch.",
    };
  }

  redirect("/dashboard");
}

export async function abmelden() {
  if (supabaseEingerichtet()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/anmelden");
}
