/** Vorformulierte Texte für Einladungen, Empfehlungen und Erinnerungen. */

export function einladungsText({
  kontaktName,
  absender,
  link,
}: {
  kontaktName: string;
  absender: string;
  link: string;
}) {
  const vorname = kontaktName.split(" ")[0] || kontaktName;
  return `Hallo ${vorname},

${absender} hat dich bei AuftragsKette als vertrauenswürdigen Geschäftskontakt empfohlen.

AuftragsKette ist ein geschlossenes Empfehlungsnetzwerk für Unternehmer und Selbstständige. Mitglieder empfehlen ihren Kunden nur Betriebe, die sie persönlich kennen und deren Arbeit sie einschätzen können. So entstehen neue Aufträge über echte Empfehlungen, ohne Provision.

Damit wir dich im Netzwerk listen und weiterempfehlen dürfen, brauchen wir kurz deine Zustimmung:
${link}

Viele Grüße
AuftragsKette`;
}

export function empfehlungsText({
  kundeName,
  kontakt,
  absender,
  karte,
  nachricht,
}: {
  kundeName: string;
  kontakt: { name: string; firma: string; leistung: string; telefon: string; email: string };
  absender: string;
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
    absender,
  ];
  return zeilen.filter((z, i, alle) => z !== "" || alle[i - 1] !== "").join("\n");
}

export function erinnerungsText({
  kundeName,
  kontaktName,
  absender,
  karte,
}: {
  kundeName: string;
  kontaktName: string;
  absender: string;
  karte: string;
}) {
  const anrede = kundeName ? `Hallo ${kundeName.split(" ")[0]},` : "Hallo,";
  return `${anrede}

kurze Erinnerung an meine Empfehlung: ${kontaktName}. Falls du noch Bedarf hast, findest du die Kontaktdaten hier:
${karte}

Viele Grüße
${absender}`;
}
