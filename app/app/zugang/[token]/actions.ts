"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { basisUrl } from "@/lib/url";

export type ZugangStatus = { fehler: string | null; gesendetAn?: string };

const UUID_MUSTER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Schnupperzugang für einen bestätigten Partner anlegen (E-Mail aus seinem Eintrag) */
export async function zugangAnlegen(
  token: string,
  _vorher: ZugangStatus,
  formData: FormData,
): Promise<ZugangStatus> {
  if (!UUID_MUSTER.test(token)) return { fehler: "Dieser Link ist ungültig." };

  const passwort = String(formData.get("passwort") ?? "");
  if (passwort.length < 8) return { fehler: "Das Passwort braucht mindestens 8 Zeichen." };

  const supabase = await createClient();
  const { data } = await supabase.rpc("einladung_vorschau", { p_token: token });
  const v = (Array.isArray(data) ? data[0] : data) as
    | { name: string; email: string; status: string }
    | undefined;

  if (!v || v.status !== "bestaetigt") {
    return { fehler: "Bitte stimme zuerst der Empfehlung zu." };
  }
  if (!v.email) {
    return { fehler: "Für dich ist keine E-Mail-Adresse hinterlegt. Bitte gib der Person Bescheid, die dich empfohlen hat." };
  }

  const [vorname, ...rest] = v.name.trim().split(/\s+/);
  const { data: konto, error } = await supabase.auth.signUp({
    email: v.email,
    password: passwort,
    options: {
      data: { vorname: vorname ?? "", nachname: rest.join(" ") },
      emailRedirectTo: `${await basisUrl()}/auth/callback`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { fehler: "Für deine E-Mail-Adresse gibt es schon einen Zugang. Melde dich einfach an." };
    }
    if (error.code === "weak_password") {
      return { fehler: "Bitte wähle ein sichereres Passwort." };
    }
    console.error("Zugang anlegen fehlgeschlagen:", error);
    return { fehler: "Das hat leider nicht geklappt. Bitte versuche es später noch einmal." };
  }

  // Ohne Identität: Konto existiert bereits (Supabase verrät das aus Datenschutzgründen nicht direkt)
  if (konto.user && konto.user.identities?.length === 0) {
    return { fehler: "Für deine E-Mail-Adresse gibt es schon einen Zugang. Melde dich einfach an." };
  }

  if (konto.session) redirect("/dashboard");
  return { fehler: null, gesendetAn: v.email };
}
