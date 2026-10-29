/** Vorformulierte Texte für Einladungen, Empfehlungen und Erinnerungen. */

export function einladungsText({
  kontaktName,
  absender,
  signatur,
  link,
}: {
  kontaktName: string;
  absender: string;
  signatur: string;
  link: string;
}) {
  const vorname = kontaktName.split(" ")[0] || kontaktName;
  return `Hallo ${vorname},

${absender} hat dich als vertrauenswürdigen Geschäftskontakt empfohlen und lädt dich ein, Teil der AuftragsKette zu werden.

AuftragsKette ist ein geschlossenes Empfehlungsnetzwerk für Unternehmer und Selbstständige. Mitglieder empfehlen ihren Kunden nur Betriebe, die sie persönlich kennen und deren Arbeit sie einschätzen können. So entstehen neue Aufträge über echte Empfehlungen, ohne Provision.

Damit du im Netzwerk gelistet und weiterempfohlen werden darfst, brauchen wir kurz deine Zustimmung:
${link}

Viele Grüße
${signatur}
über AuftragsKette`;
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
