/**
 * Links zum Teilen über WhatsApp und die E-Mail-App des Geräts.
 * So funktioniert der Versand auch ohne eigenen E-Mail-Dienst.
 */

/** Wandelt deutsche Nummern in das internationale Format für WhatsApp um. */
export function telefonInternational(telefon: string) {
  let ziffern = telefon.replace(/[^\d+]/g, "");
  if (ziffern.startsWith("+")) ziffern = ziffern.slice(1);
  else if (ziffern.startsWith("00")) ziffern = ziffern.slice(2);
  else if (ziffern.startsWith("0")) ziffern = "49" + ziffern.slice(1);
  return ziffern;
}

export function whatsappLink(text: string, telefon?: string) {
  const nummer = telefon ? telefonInternational(telefon) : "";
  return `https://wa.me/${nummer}?text=${encodeURIComponent(text)}`;
}

export function mailtoLink(an: string, betreff: string, text: string) {
  return `mailto:${encodeURIComponent(an)}?subject=${encodeURIComponent(
    betreff,
  )}&body=${encodeURIComponent(text)}`;
}
