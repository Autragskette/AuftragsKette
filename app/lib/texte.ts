/** Vorformulierte Texte für Einladungen, Empfehlungen und Erinnerungen. */

/**
 * Einladung an einen Kontakt, persönlich in der Ich-Form des Mitglieds.
 * Bausteine: Vorname des Kontakts, Leistung, voller Name und Firma
 * (ersatzweise Tätigkeit) des Mitglieds, Bestätigungslink.
 */
export function einladungsText({
  kontaktName,
  leistung,
  absenderName,
  absenderFirma,
  link,
}: {
  kontaktName: string;
  leistung: string;
  absenderName: string;
  absenderFirma: string;
  link: string;
}) {
  const vorname = kontaktName.trim().split(/\s+/)[0] || kontaktName;
  const unterschrift = [absenderName, absenderFirma, "Mitglied der AuftragsKette"]
    .filter((z) => z && z.trim())
    .join("\n");

  return `Hallo ${vorname},

wenn mich Kunden nach ${leistung.trim() || "deinem Fachgebiet"} fragen, empfehle ich gern Betriebe, deren Arbeit ich persönlich kenne und schätze. Dabei habe ich an dich gedacht.

Ich empfehle meine Kontakte über ein Netzwerk von Unternehmern und Selbstständigen aus der Region, in dem wir uns gegenseitig an Kunden weitervermitteln. Wenn du einverstanden bist, würde ich dich dort als Kontakt eintragen. So können ich und die anderen Mitglieder dich bei passender Gelegenheit weiterempfehlen. Für dich ist das zunächst ganz kostenlos: Die ersten Empfehlungen bzw. die ersten drei Monate kannst du unverbindlich ausprobieren. Danach entscheidest du selbst, ob du Mitglied werden möchtest. Deine Zustimmung kannst du jederzeit zurückziehen.

Hier kannst du dir alles in Ruhe ansehen und zustimmen:
${link}

Viele Grüße
${unterschrift}`;
}

/** Betreff der Einladung, wenn sie per E-Mail verschickt wird */
export function einladungsBetreff(absenderName: string) {
  return `Weiterempfehlung an meine Kunden – ${absenderName}`;
}

export function empfehlungsText({
  kundeName,
  kontakt,
  signatur,
  karte,
  nachricht,
}: {
  kundeName: string;
  kontakt: { name: string; firma: string; leistung: string; telefon: string; email: string };
  signatur: string;
  karte: string;
  nachricht: string;
}) {
  const anrede = kundeName ? `Hallo ${kundeName.split(" ")[0]},` : "Hallo,";
  const firma = kontakt.firma ? ` (${kontakt.firma})` : "";
  const zeilen = [
    anrede,
    "",
    nachricht ||
      `wie besprochen empfehle ich dir ${kontakt.name}${firma} für ${kontakt.leistung}. Ich kenne die Arbeit persönlich und kann sie guten Gewissens weiterempfehlen.`,
    "",
    `${kontakt.name}${firma}`,
    kontakt.telefon ? `Telefon: ${kontakt.telefon}` : "",
    kontakt.email ? `E-Mail: ${kontakt.email}` : "",
    "",
    `Digitale Visitenkarte: ${karte}`,
    "",
    "Viele Grüße",
    signatur,
  ];
  return zeilen.filter((z, i, alle) => z !== "" || alle[i - 1] !== "").join("\n");
}

export function erinnerungsText({
  kundeName,
  kontaktName,
  signatur,
  karte,
}: {
  kundeName: string;
  kontaktName: string;
  signatur: string;
  karte: string;
}) {
  const anrede = kundeName ? `Hallo ${kundeName.split(" ")[0]},` : "Hallo,";
  return `${anrede}

kurze Erinnerung an meine Empfehlung: ${kontaktName}. Falls du noch Bedarf hast, findest du die Kontaktdaten hier:
${karte}

Viele Grüße
${signatur}`;
}
