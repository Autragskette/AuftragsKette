/**
 * Automatischer E-Mail-Versand über Resend (https://resend.com).
 *
 * Aktiv, sobald beim Hoster RESEND_API_KEY und EMAIL_ABSENDER
 * (z. B. "AuftragsKette <hallo@auftragskette.de>") hinterlegt sind.
 * Ohne diese Angaben wird nichts verschickt, und die App bietet
 * stattdessen das Teilen über WhatsApp oder die eigene E-Mail-App an.
 */

export function emailVersandAktiv() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_ABSENDER);
}

export async function sendeEmail({
  an,
  betreff,
  text,
}: {
  an: string;
  betreff: string;
  text: string;
}): Promise<boolean> {
  if (!emailVersandAktiv() || !an) return false;

  try {
    const antwort = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_ABSENDER,
        to: [an],
        subject: betreff,
        text,
      }),
    });

    if (!antwort.ok) {
      console.error("E-Mail-Versand fehlgeschlagen:", await antwort.text());
      return false;
    }
    return true;
  } catch (fehler) {
    console.error("E-Mail-Versand fehlgeschlagen:", fehler);
    return false;
  }
}
