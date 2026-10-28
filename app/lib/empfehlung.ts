/** Nach so vielen Tagen fragt die App nach, ob es zum Auftrag kam. */
export const NACHFRAGE_TAGE = 7;

export function nachfrageFaellig(e: { erstellt_am: string; ergebnis: string }) {
  if (e.ergebnis !== "offen") return false;
  const alter = Date.now() - new Date(e.erstellt_am).getTime();
  return alter >= NACHFRAGE_TAGE * 86_400_000;
}

export function tageBisNachfrage(erstelltAm: string) {
  const faellig = new Date(erstelltAm).getTime() + NACHFRAGE_TAGE * 86_400_000;
  return Math.max(0, Math.ceil((faellig - Date.now()) / 86_400_000));
}

export function datum(wert: string) {
  return new Date(wert).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Berlin",
  });
}
