export type Veranstaltung = {
  id: string;
  titel: string;
  art: "branche_online" | "region_vor_ort";
  branche: string;
  region: string;
  beginn: string;
  ende: string;
  ort: string;
  teams_link: string;
  beschreibung: string;
};

export const ARTEN = {
  branche_online: {
    name: "Branchen-Call",
    lang: "Online-Branchen-Call (Teams)",
    punkte: 8,
    stil: "bg-violet-50 text-violet-800",
  },
  region_vor_ort: {
    name: "Regionales Treffen",
    lang: "Regionales Community-Treffen (alle Branchen)",
    punkte: 12,
    stil: "bg-emerald-50 text-emerald-800",
  },
} as const;

/** Einchecken ab 30 Minuten vor Beginn bis 24 Stunden nach Ende (wie in der Datenbank) */
export function eincheckenMoeglich(v: Pick<Veranstaltung, "beginn" | "ende">) {
  const jetzt = Date.now();
  return (
    jetzt >= new Date(v.beginn).getTime() - 30 * 60_000 &&
    jetzt <= new Date(v.ende).getTime() + 24 * 3_600_000
  );
}

const ZEITZONE = "Europe/Berlin";

export function zeitraum(beginn: string, ende: string) {
  const b = new Date(beginn);
  const e = new Date(ende);
  const tag = b.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: ZEITZONE,
  });
  const uhr = (d: Date) =>
    d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: ZEITZONE });
  return `${tag}, ${uhr(b)}–${uhr(e)} Uhr`;
}

/** Wandelt "2026-11-05T18:30" (deutsche Ortszeit) in einen ISO-Zeitpunkt um. */
export function berlinZuIso(wert: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(wert);
  if (!m) return null;
  const [, j, mo, t, h, mi] = m.map(Number);
  const alsUtc = Date.UTC(j, mo - 1, t, h, mi);
  // Abstand der Berliner Zeit zu UTC an diesem Tag (1 oder 2 Stunden)
  const teile = new Intl.DateTimeFormat("en-US", {
    timeZone: ZEITZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(alsUtc));
  const wert2 = (typ: string) => Number(teile.find((p) => p.type === typ)?.value);
  const berlinAlsUtc = Date.UTC(wert2("year"), wert2("month") - 1, wert2("day"), wert2("hour"), wert2("minute"));
  const versatz = berlinAlsUtc - alsUtc;
  return new Date(alsUtc - versatz).toISOString();
}
