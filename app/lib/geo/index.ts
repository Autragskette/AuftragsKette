import daten from "./plz-de.json";

/**
 * Postleitzahlen und Orte in Deutschland mit Koordinaten.
 * Quelle: GeoNames (www.geonames.org), Lizenz CC BY 4.0.
 */

type Roh = { o: string[]; p: Record<string, [number, number, number[]]> };
const D = daten as unknown as Roh;

export type Punkt = { lat: number; lon: number; bezeichnung: string };

export { UMKREIS_STANDARD, UMKREISE } from "./umkreis";

const normal = (s: string) =>
  s
    .toLocaleLowerCase("de")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Ortsname -> Postleitzahlen (einmalig beim Start aufgebaut)
let ortIndex: Map<string, string[]> | null = null;
function orte() {
  if (ortIndex) return ortIndex;
  ortIndex = new Map();
  for (const [plz, [, , namen]] of Object.entries(D.p)) {
    for (const i of namen) {
      const n = normal(D.o[i]);
      const liste = ortIndex.get(n);
      if (liste) liste.push(plz);
      else ortIndex.set(n, [plz]);
    }
  }
  return ortIndex;
}

export function ortName(plz: string) {
  const e = D.p[plz];
  return e && e[2].length ? D.o[e[2][0]] : "";
}

export function plzKoordinate(plz: string | null | undefined) {
  const e = plz ? D.p[plz.trim()] : undefined;
  return e ? { lat: e[0], lon: e[1] } : null;
}

function mitte(plzListe: string[]) {
  let lat = 0;
  let lon = 0;
  for (const p of plzListe) {
    lat += D.p[p][0];
    lon += D.p[p][1];
  }
  return { lat: lat / plzListe.length, lon: lon / plzListe.length };
}

/**
 * Wandelt eine Eingabe in einen Mittelpunkt um:
 * "48143" → PLZ, "48" → PLZ-Bereich, "Münster" oder "Hiltrup" → Ort/Ortsteil.
 */
export function punktFinden(eingabe: string): Punkt | null {
  const text = eingabe.trim();
  if (!text) return null;

  const plzTreffer = /^(\d{5})\b/.exec(text);
  if (plzTreffer) {
    const k = plzKoordinate(plzTreffer[1]);
    if (k) return { ...k, bezeichnung: `${plzTreffer[1]} ${ortName(plzTreffer[1])}`.trim() };
  }

  if (/^\d{1,4}$/.test(text)) {
    const liste = Object.keys(D.p).filter((p) => p.startsWith(text));
    if (liste.length) return { ...mitte(liste), bezeichnung: `PLZ-Bereich ${text}…` };
    return null;
  }

  const name = normal(text.replace(/^\d{5}\s*/, ""));
  const index = orte();
  let liste = index.get(name);
  if (!liste) {
    // "Frankfurt" → "Frankfurt am Main": Anfang des Namens genügt, größter Ort gewinnt
    for (const [n, plz] of index) {
      if (n.startsWith(name + " ") && (!liste || plz.length > liste.length)) liste = plz;
    }
  }
  if (!liste) return null;

  // Gleichnamige Orte (z. B. mehrere "Münster"): die größte Gruppe nehmen,
  // erkennbar an den gleichen ersten zwei PLZ-Ziffern
  const gruppen = new Map<string, string[]>();
  for (const p of liste) {
    const g = gruppen.get(p.slice(0, 2));
    if (g) g.push(p);
    else gruppen.set(p.slice(0, 2), [p]);
  }
  liste = [...gruppen.values()].sort((a, b) => b.length - a.length)[0];

  const original = D.o[D.p[liste[0]][2].find((i) => normal(D.o[i]).startsWith(name)) ?? D.p[liste[0]][2][0]];
  return { ...mitte(liste), bezeichnung: original };
}

/** Vorschläge für die Ortseingabe */
export function ortVorschlaege(eingabe: string, anzahl = 8) {
  const text = eingabe.trim();
  if (text.length < 2) return [];
  if (/^\d+$/.test(text)) {
    return Object.keys(D.p)
      .filter((p) => p.startsWith(text) && D.p[p][2].length > 0)
      .slice(0, anzahl)
      .map((p) => `${p} ${ortName(p)}`.trim());
  }
  const n = normal(text);
  const ergebnis: string[] = [];
  const gesehen = new Set<string>();
  for (const name of D.o) {
    const k = normal(name);
    if (gesehen.has(k)) continue;
    if (k.startsWith(n)) {
      gesehen.add(k);
      ergebnis.push(name);
      if (ergebnis.length >= anzahl) break;
    }
  }
  return ergebnis.sort((a, b) => a.length - b.length);
}

/** Alle Postleitzahlen eines Punktes im Umkreis (für die Anzeige „inkl. Nachbarorte“) */
export function orteImUmkreis(punkt: { lat: number; lon: number }, km: number, anzahl = 6) {
  const namen = new Map<string, number>();
  for (const [, [lat, lon, ids]] of Object.entries(D.p)) {
    if (!ids.length) continue;
    const d = entfernungKm(punkt, { lat, lon });
    if (d > km) continue;
    const name = D.o[ids[0]];
    if (!namen.has(name) || namen.get(name)! > d) namen.set(name, d);
  }
  return [...namen.entries()].sort((a, b) => a[1] - b[1]).slice(0, anzahl).map(([n]) => n);
}

/** Luftlinie in km */
export function entfernungKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const r = 6371;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}
