"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendeEmail } from "@/lib/email";
import { einladungsBetreff, einladungsText, einladungsTextNetzwerk } from "@/lib/texte";
import { profilVollstaendig, type Profil } from "@/lib/mitglied";
import { basisUrl } from "@/lib/url";

/** Was der Einladende einträgt. Alles Weitere ergänzt der Kontakt selbst. */
export type KontaktFelder = {
  name: string;
  leistung: string;
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
  leistung: 200,
  notiz: 2000,
};

function felderAuslesen(formData: FormData): KontaktFelder {
  const lies = (name: keyof KontaktFelder) => String(formData.get(name) ?? "").trim();
  return { name: lies("name"), leistung: lies("leistung"), notiz: lies("notiz") };
}

function pruefen(werte: KontaktFelder, nurNotiz: boolean): KontaktStatus["feldFehler"] {
  const fehler: KontaktStatus["feldFehler"] = {};
  if (!nurNotiz) {
    if (!werte.name) fehler.name = "Bitte einen Namen eingeben.";
    if (!werte.leistung) fehler.leistung = "Bitte angeben, wofür du den Kontakt empfehlen würdest.";
  }
  (Object.keys(MAX_LAENGE) as (keyof KontaktFelder)[]).forEach((feld) => {
    if (!fehler[feld] && werte[feld].length > MAX_LAENGE[feld]) {
      fehler[feld] = `Höchstens ${MAX_LAENGE[feld]} Zeichen.`;
    }
  });
  return fehler;
}

/**
 * Legt einen neuen persönlichen Kontakt an (ohne id) oder aktualisiert einen
 * bestehenden (mit id). Nach der Zustimmung ist nur noch die Notiz änderbar.
 */
export async function kontaktSpeichern(
  id: string | null,
  vorher: KontaktStatus,
  formData: FormData,
): Promise<KontaktStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  let nurNotiz = false;
  if (id) {
    const { data: alt } = await supabase
      .from("kontakte")
      .select("status")
      .eq("id", id)
      .eq("besitzer_id", user.id)
      .maybeSingle();
    nurNotiz = alt?.status === "bestaetigt";
  }

  const werte = felderAuslesen(formData);
  const feldFehler = pruefen(werte, nurNotiz);
  if (Object.keys(feldFehler).length > 0) {
    return { fehler: "Bitte prüfe die markierten Felder.", feldFehler, werte, versuch: vorher.versuch + 1 };
  }

  let kontaktId = id;
  let error;

  if (id) {
    ({ error } = await supabase
      .from("kontakte")
      .update(nurNotiz ? { notiz: werte.notiz } : werte)
      .eq("id", id)
      .eq("besitzer_id", user.id));
  } else {
    const antwort = await supabase
      .from("kontakte")
      .insert({ ...werte, besitzer_id: user.id, herkunft: "persoenlich" })
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

export type NetzwerkTreffer = {
  id: string;
  name: string;
  firma: string;
  leistung: string;
  plz: string;
  ort: string;
  /** Schon im eigenen Netzwerk (gleiche E-Mail oder eigener Eintrag) */
  schonDrin: boolean;
};

/** Betriebe im Netzwerk suchen, um sie in das eigene Netzwerk aufzunehmen */
export async function netzwerkSuchen(eingabe: string): Promise<NetzwerkTreffer[]> {
  const suche = eingabe.trim().slice(0, 80);
  if (suche.length < 2) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data }, { data: meine }] = await Promise.all([
    supabase.rpc("netzwerk_suchen_v2", { p_suche: suche, p_limit: 200 }),
    supabase.from("kontakte").select("email").eq("besitzer_id", user.id),
  ]);
  const eigeneMails = new Set(
    ((meine ?? []) as { email: string }[]).map((k) => k.email.toLowerCase()).filter(Boolean),
  );

  const gesehen = new Map<string, NetzwerkTreffer>();
  for (const t of (data ?? []) as (NetzwerkTreffer & { email: string; eigener: boolean })[]) {
    const mail = t.email?.toLowerCase() ?? "";
    const schluessel = mail || `${t.name.toLowerCase()}|${t.plz}`;
    const schonDrin = t.eigener || (mail !== "" && eigeneMails.has(mail));
    const vorhanden = gesehen.get(schluessel);
    if (!vorhanden || (schonDrin && !vorhanden.schonDrin)) {
      gesehen.set(schluessel, {
        id: t.id,
        name: t.name,
        firma: t.firma,
        leistung: t.leistung,
        plz: t.plz,
        ort: t.ort,
        schonDrin,
      });
    }
  }
  return [...gesehen.values()].slice(0, 30);
}

/**
 * Einen Betrieb aus dem Netzwerk in das eigene Netzwerk aufnehmen. Seine
 * Angaben hat er selbst eingegeben und freigegeben; er bestätigt erneut.
 */
export async function netzwerkKontaktEinladen(quelleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/anmelden");

  const { data } = await supabase.rpc("netzwerk_kontakt", { p_id: quelleId });
  const q = (Array.isArray(data) ? data[0] : data) as
    | { name: string; firma: string; leistung: string; email: string; telefon: string; plz: string; ort: string; eigener: boolean }
    | undefined;
  if (!q || q.eigener) redirect("/dashboard/netzwerk");

  // Schon im eigenen Netzwerk? Dann dorthin
  if (q.email) {
    const { data: vorhanden } = await supabase
      .from("kontakte")
      .select("id")
      .eq("besitzer_id", user.id)
      .ilike("email", q.email)
      .limit(1)
      .maybeSingle();
    if (vorhanden) redirect(`/dashboard/netzwerk/${vorhanden.id}`);
  }

  const { data: neu, error } = await supabase
    .from("kontakte")
    .insert({
      besitzer_id: user.id,
      herkunft: "netzwerk",
      name: q.name,
      firma: q.firma,
      leistung: q.leistung,
      email: q.email,
      telefon: q.telefon,
      plz: q.plz,
      ort: q.ort,
    })
    .select("id")
    .single();
  if (error || !neu) {
    console.error("Netzwerkkontakt anlegen fehlgeschlagen:", error);
    redirect("/dashboard/netzwerk/neu?fehler=1");
  }

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/netzwerk/${neu.id}?gespeichert=1`);
}
