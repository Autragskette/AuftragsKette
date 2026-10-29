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

/**
 * WhatsApp vom Mitglied an den Partner, nachdem es ihn an einen Kunden
 * empfohlen hat. Geht aus dem eigenen WhatsApp des Mitglieds raus.
 */
export function partnerBescheidText({
  partnerName,
  kundeName,
  leistung,
  signatur,
}: {
  partnerName: string;
  kundeName: string;
  leistung: string;
  signatur: string;
}) {
  const vorname = partnerName.trim().split(/\s+/)[0] || partnerName;
  const kunde = kundeName.trim();
  return `Hallo ${vorname},

kurze Info: Ich habe dich gerade ${kunde ? `an ${kunde}` : "an einen Kunden"} für ${leistung.trim() || "deine Leistungen"} weiterempfohlen. ${kunde ? `${kunde.split(/\s+/)[0]} meldet` : "Der Kunde meldet"} sich in den nächsten Tagen bei dir.

Viele Grüße
${signatur}`;
}

/** Push an den Partner, sobald er empfohlen wurde */
export function pushEmpfohlen({ von, zweite }: { von: string; zweite: boolean }) {
  return {
    titel: "Du wurdest empfohlen",
    text: zweite
      ? `${von} hat dich an einen Kunden empfohlen. Das war die letzte Empfehlung deiner kostenlosen Testphase.`
      : `${von} hat dich gerade an einen Kunden empfohlen.`,
  };
}

/** Hinweis an den Partner kurz vor bzw. nach dem Ende der Testphase */
export function testHinweis({
  art,
  vorname,
  bis,
  link,
}: {
  art: "bald" | "beendet";
  vorname: string;
  bis: string | null;
  link: string;
}) {
  const anrede = vorname ? `Hallo ${vorname},` : "Hallo,";
  const datum = bis ? new Date(bis).toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" }) : "";
  if (art === "bald") {
    return {
      titel: "Deine kostenlose Testphase endet bald",
      kurz: `Am ${datum} endet deine Testphase. Werde Mitglied, damit du weiter empfohlen wirst.`,
      lang: `${anrede}

deine kostenlose Testphase in der AuftragsKette endet am ${datum}. Danach wirst du in der Suche nicht mehr angezeigt und kannst nicht mehr empfohlen werden.

Wenn du weiter dabei sein möchtest, kannst du hier Mitglied werden:
${link}

Viele Grüße
Dein AuftragsKette-Team`,
    };
  }
  return {
    titel: "Deine kostenlose Testphase ist beendet",
    kurz: "Werde Mitglied, damit dich andere Unternehmer weiter empfehlen können.",
    lang: `${anrede}

deine kostenlose Testphase in der AuftragsKette ist beendet. Dein Eintrag bleibt erhalten, ist aber pausiert: Du wirst in der Suche nicht mehr angezeigt und kannst nicht mehr empfohlen werden.

Sobald du Mitglied wirst, bist du sofort wieder sichtbar:
${link}

Viele Grüße
Dein AuftragsKette-Team`,
  };
}
