/**
 * Aktivitätsregeln von AuftragsKette.
 * Alle Zahlen stehen hier zentral und können jederzeit angepasst werden.
 */

export type Kennzahlen = {
  id: string;
  name: string;
  firma: string;
  branche: string;
  ort: string;
  mitglied_seit: string;
  zuletzt_aktiv_am: string;
  empfehlungen_gegeben: number;
  auftraege: number;
  ergebnisse_gemeldet: number;
  kontakte_bestaetigt: number;
  kontakte_empfohlen: number;
  empfehlungen_erhalten: number;
  aktive_wochen: number;
  letzter_beitrag: string | null;
  punkte: number;
};

/** Punkte je Aktion (müssen zur Datenbankfunktion mitglieder_kennzahlen passen). */
export const PUNKTE = [
  { aktion: "Empfehlung an einen Kunden gegeben", punkte: 10, feld: "empfehlungen_gegeben" },
  { aktion: "Daraus ist ein Auftrag entstanden", punkte: 20, feld: "auftraege" },
  { aktion: "Ergebnis einer Empfehlung zurückgemeldet", punkte: 3, feld: "ergebnisse_gemeldet" },
  { aktion: "Kontakt eingebracht und bestätigt", punkte: 15, feld: "kontakte_bestaetigt" },
  { aktion: "Dein Kontakt wurde von anderen empfohlen", punkte: 5, feld: "kontakte_empfohlen" },
  { aktion: "Aktive Woche in der App", punkte: 2, feld: "aktive_wochen" },
] as const;

/** Stufen nach Punkten der letzten 12 Monate */
export const STUFE_AKTIV = 40;
export const STUFE_TOP = 150;
/** Zusätzliche Bedingungen für Top-Mitglied */
export const TOP_MIN_EMPFEHLUNGEN = 5;
export const TOP_MIN_AUFTRAEGE = 1;
export const TOP_MAX_TAGE_INAKTIV = 30;

/** Inaktivität */
export const ERINNERUNG_LOGIN_TAGE = 30; // so lange nicht in der App
export const ERINNERUNG_BEITRAG_TAGE = 60; // so lange nichts beigetragen
export const WARNUNG_BEITRAG_TAGE = 90; // Verlängerung gefährdet
/** Neue Mitglieder: erste Wochen ohne Erinnerungen */
export const SCHONFRIST_TAGE = 30;

const TAG = 86_400_000;
const tageSeit = (wert: string | null | undefined) =>
  wert ? Math.floor((Date.now() - new Date(wert).getTime()) / TAG) : Infinity;

export type Stufe = {
  name: "Mitglied" | "Aktives Mitglied" | "Top-Mitglied";
  top: boolean;
  naechste: string | null;
  fehlendePunkte: number;
  fehlt: string[];
};

export function stufe(k: Kennzahlen): Stufe {
  const tageInaktiv = tageSeit(k.zuletzt_aktiv_am);
  const fehltTop: string[] = [];
  if (k.punkte < STUFE_TOP) fehltTop.push(`${STUFE_TOP - k.punkte} Punkte`);
  if (k.empfehlungen_gegeben < TOP_MIN_EMPFEHLUNGEN)
    fehltTop.push(`${TOP_MIN_EMPFEHLUNGEN - k.empfehlungen_gegeben} weitere Empfehlungen`);
  if (k.auftraege < TOP_MIN_AUFTRAEGE) fehltTop.push("mindestens 1 Auftrag aus deinen Empfehlungen");
  if (tageInaktiv > TOP_MAX_TAGE_INAKTIV) fehltTop.push("Aktivität in den letzten 30 Tagen");

  if (fehltTop.length === 0) {
    return { name: "Top-Mitglied", top: true, naechste: null, fehlendePunkte: 0, fehlt: [] };
  }
  if (k.punkte >= STUFE_AKTIV) {
    return {
      name: "Aktives Mitglied",
      top: false,
      naechste: "Top-Mitglied",
      fehlendePunkte: Math.max(0, STUFE_TOP - k.punkte),
      fehlt: fehltTop,
    };
  }
  return {
    name: "Mitglied",
    top: false,
    naechste: "Aktives Mitglied",
    fehlendePunkte: STUFE_AKTIV - k.punkte,
    fehlt: [`${STUFE_AKTIV - k.punkte} Punkte`],
  };
}

export type AktivStatus = {
  lage: "aktiv" | "erinnerung" | "warnung";
  tageSeitLogin: number;
  tageSeitBeitrag: number;
  verlaengerungAm: Date;
  verlaengerungGesichert: boolean;
  gibUndNimm: boolean;
  gruende: string[];
};

/**
 * Nächster Jahrestag der Mitgliedschaft = Verlängerung des Abos.
 * Verlängert wird nur, wer zum Stichtag Aktives Mitglied ist (≥ 40 Punkte)
 * und in den letzten 90 Tagen etwas beigetragen hat.
 */
export function aktivStatus(k: Kennzahlen): AktivStatus {
  const seit = new Date(k.mitglied_seit);
  const tageMitglied = tageSeit(k.mitglied_seit);
  const tageSeitLogin = tageSeit(k.zuletzt_aktiv_am);
  // Neue Mitglieder ohne Beitrag werden ab Aufnahme gemessen
  const tageSeitBeitrag = Math.min(tageSeit(k.letzter_beitrag), tageMitglied);

  const verlaengerungAm = new Date(seit);
  while (verlaengerungAm.getTime() <= Date.now()) {
    verlaengerungAm.setFullYear(verlaengerungAm.getFullYear() + 1);
  }

  const gruende: string[] = [];
  if (tageSeitLogin > ERINNERUNG_LOGIN_TAGE)
    gruende.push(`Du warst seit ${tageSeitLogin} Tagen nicht mehr in der App.`);
  if (tageSeitBeitrag > ERINNERUNG_BEITRAG_TAGE)
    gruende.push(
      `Seit ${tageSeitBeitrag} Tagen hast du keine Empfehlung gegeben und keinen Kontakt eingebracht.`,
    );

  const schonfrist = tageMitglied < SCHONFRIST_TAGE;
  let lage: AktivStatus["lage"] = "aktiv";
  if (!schonfrist && tageSeitBeitrag > WARNUNG_BEITRAG_TAGE) lage = "warnung";
  else if (!schonfrist && gruende.length > 0) lage = "erinnerung";

  const verlaengerungGesichert =
    k.punkte >= STUFE_AKTIV && tageSeitBeitrag <= WARNUNG_BEITRAG_TAGE;

  // Erhält viele Empfehlungen, gibt aber kaum welche
  const gibUndNimm =
    k.empfehlungen_erhalten >= 3 && k.empfehlungen_gegeben * 2 < k.empfehlungen_erhalten;

  return {
    lage,
    tageSeitLogin,
    tageSeitBeitrag,
    verlaengerungAm,
    verlaengerungGesichert,
    gibUndNimm,
    gruende,
  };
}

/** Erinnerungsstufe für automatische E-Mails: 0 = keine, 1 = Erinnerung, 2 = Warnung */
export function erinnerungsStufe(k: Kennzahlen) {
  const lage = aktivStatus(k).lage;
  return lage === "warnung" ? 2 : lage === "erinnerung" ? 1 : 0;
}
