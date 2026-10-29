/** Preise und Kennenlernphase (Regeln in der Datenbank: Migration 0008). */

/** Empfangene Empfehlungen, die ein eingeladener Partner kostenlos erhält */
export const KENNENLERN_EMPFEHLUNGEN = 2;
/** Dauer der Kennenlernphase ab Zustimmung, wenn mindestens eine Empfehlung kam */
export const KENNENLERN_MONATE = 3;
/** Längste Dauer, wenn bis dahin keine Empfehlung kam */
export const KENNENLERN_MONATE_MAX = 6;

export const TARIFE = [
  { name: "Jahresabo", preis: 69, laufzeit: "12 Monate Laufzeit, monatliche Zahlung" },
  { name: "Halbjahresabo", preis: 89, laufzeit: "6 Monate Laufzeit, monatliche Zahlung" },
] as const;
