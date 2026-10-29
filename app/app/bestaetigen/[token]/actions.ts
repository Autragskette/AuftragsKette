"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Angaben = {
  firma: string;
  leistung: string;
  telefon: string;
  email: string;
  plz: string;
  ort: string;
};

export type AngabenStatus = {
  fehler: string | null;
  feld?: keyof Angaben;
  werte: Angaben;
  versuch: number;
};

const MELDUNGEN: Record<string, { text: string; feld?: keyof Angaben }> = {
  leistung_fehlt: { text: "Bitte gib an, wofür du empfohlen werden möchtest.", feld: "leistung" },
  erreichbarkeit_fehlt: { text: "Bitte gib mindestens Telefon oder E-Mail an, damit Kunden dich erreichen.", feld: "telefon" },
  email_ungueltig: { text: "Diese E-Mail-Adresse sieht nicht richtig aus.", feld: "email" },
  plz_ungueltig: { text: "Bitte eine fünfstellige Postleitzahl angeben.", feld: "plz" },
  ort_fehlt: { text: "Bitte den Ort angeben.", feld: "ort" },
};

/** Zustimmen mit den eigenen Angaben oder die Angaben später ändern */
export async function angabenSpeichern(
  token: string,
  vorher: AngabenStatus,
  formData: FormData,
): Promise<AngabenStatus> {
  const lies = (f: string) => String(formData.get(f) ?? "").trim();
  const werte: Angaben = {
    firma: lies("firma"),
    leistung: lies("leistung"),
    telefon: lies("telefon"),
    email: lies("email"),
    plz: lies("plz"),
    ort: lies("ort"),
  };
  const aendern = formData.get("modus") === "aendern";
  const versuch = vorher.versuch + 1;

  if (!aendern && formData.get("einverstanden") !== "on") {
    return { fehler: "Bitte bestätige dein Einverständnis.", werte, versuch };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("einladung_beantworten_v2", {
    p_token: token,
    p_zustimmung: true,
    p_mitglied_interesse: formData.get("mitglied") === "on",
    p_firma: werte.firma,
    p_leistung: werte.leistung,
    p_telefon: werte.telefon,
    p_email: werte.email,
    p_plz: werte.plz,
    p_ort: werte.ort,
  });

  if (error) {
    console.error("Angaben speichern fehlgeschlagen:", error);
    return { fehler: "Das hat leider nicht geklappt. Bitte versuche es erneut.", werte, versuch };
  }
  const meldung = MELDUNGEN[data as string];
  if (meldung) return { fehler: meldung.text, feld: meldung.feld, werte, versuch };
  if (data !== "bestaetigt") {
    return { fehler: "Dieser Link ist nicht (mehr) gültig.", werte, versuch };
  }

  redirect(`/bestaetigen/${token}?antwort=ja${aendern ? "&geaendert=1" : ""}`);
}

/** Ablehnen bzw. Zustimmung widerrufen */
export async function einladungBeantworten(token: string, formData: FormData) {
  if (formData.get("antwort") !== "nein") redirect(`/bestaetigen/${token}`);

  const supabase = await createClient();
  const { error } = await supabase.rpc("einladung_beantworten_v2", {
    p_token: token,
    p_zustimmung: false,
  });

  if (error) {
    console.error("Einladung beantworten fehlgeschlagen:", error);
    redirect(`/bestaetigen/${token}?fehler=1`);
  }

  redirect(`/bestaetigen/${token}?antwort=nein`);
}
