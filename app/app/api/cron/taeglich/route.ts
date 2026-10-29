import { createClient } from "@supabase/supabase-js";
import { emailVersandAktiv, sendeEmail } from "@/lib/email";
import { aktivStatus, erinnerungsStufe, type Kennzahlen } from "@/lib/aktivitaet";
import { datum, NACHFRAGE_TAGE } from "@/lib/empfehlung";

/**
 * Täglicher Lauf (Vercel Cron, siehe vercel.json):
 *  - Erinnerung an inaktive Mitglieder (Stufe 1) und Warnung (Stufe 2)
 *  - Nachfrage „Kam es zum Auftrag?“ 7 Tage nach einer Empfehlung
 *
 * Benötigt beim Hoster: CRON_SECRET, SUPABASE_SECRET_KEY, RESEND_API_KEY,
 * EMAIL_ABSENDER und NEXT_PUBLIC_SITE_URL. Fehlt etwas, passiert nichts.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const geheim = process.env.CRON_SECRET;
  if (!geheim || request.headers.get("authorization") !== `Bearer ${geheim}`) {
    return Response.json({ fehler: "nicht erlaubt" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const schluessel = process.env.SUPABASE_SECRET_KEY;
  const seite = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://auftragskette.vercel.app").replace(/\/$/, "");

  if (!url || !schluessel || !emailVersandAktiv()) {
    return Response.json({ uebersprungen: "E-Mail-Versand oder Server-Schlüssel nicht eingerichtet" });
  }

  const admin = createClient(url, schluessel, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // E-Mail-Adressen der Mitglieder
  const emails = new Map<string, string>();
  for (let seiteNr = 1; seiteNr <= 20; seiteNr++) {
    const { data, error } = await admin.auth.admin.listUsers({ page: seiteNr, perPage: 200 });
    if (error) break;
    data.users.forEach((u) => u.email && emails.set(u.id, u.email));
    if (data.users.length < 200) break;
  }

  let erinnerungen = 0;
  let nachfragen = 0;

  // 1) Inaktivität
  const [{ data: kennzahlen }, { data: profile }] = await Promise.all([
    admin.rpc("mitglieder_kennzahlen", { p_id: null }),
    admin.from("profile").select("id, vorname, erinnerung_stufe"),
  ]);
  const stufen = new Map((profile ?? []).map((p) => [p.id as string, p]));

  for (const k of (kennzahlen ?? []) as Kennzahlen[]) {
    const soll = erinnerungsStufe(k);
    const profil = stufen.get(k.id);
    const ist = (profil?.erinnerung_stufe as number | undefined) ?? 0;

    if (soll === ist) continue;
    if (soll > ist) {
      const an = emails.get(k.id);
      const status = aktivStatus(k);
      const vorname = (profil?.vorname as string) || "";
      const gesendet =
        an &&
        (await sendeEmail({
          an,
          betreff:
            soll === 2
              ? "Deine AuftragsKette-Mitgliedschaft: Verlängerung gefährdet"
              : "Wir vermissen dich in der AuftragsKette",
          text: `Hallo${vorname ? " " + vorname : ""},

${status.gruende.join("\n")}

${
  soll === 2
    ? `Damit deine Mitgliedschaft am ${datum(status.verlaengerungAm.toISOString())} verlängert wird, brauchst du mindestens 40 Aktivitätspunkte und einen Beitrag in den letzten 90 Tagen.`
    : "Die AuftragsKette lebt davon, dass alle mitmachen: Empfehlungen geben, Kontakte einbringen, dabei sein."
}

Schau gleich vorbei und gib eine Empfehlung:
${seite}/dashboard/suche

Viele Grüße
Dein AuftragsKette-Team`,
        }));
      if (!gesendet) continue;
      erinnerungen++;
    }
    await admin
      .from("profile")
      .update({ erinnerung_stufe: soll, erinnert_am: soll > ist ? new Date().toISOString() : undefined })
      .eq("id", k.id);
  }

  // 2) Nachfrage nach 7 Tagen
  const grenze = new Date(Date.now() - NACHFRAGE_TAGE * 86_400_000).toISOString();
  const { data: offene } = await admin
    .from("kundenempfehlungen")
    .select("id, von_id, kontakt_name, kunde_name")
    .eq("ergebnis", "offen")
    .is("nachfrage_gesendet_am", null)
    .lt("erstellt_am", grenze)
    .limit(200);

  for (const e of offene ?? []) {
    const an = emails.get(e.von_id as string);
    if (!an) continue;
    const ok = await sendeEmail({
      an,
      betreff: `Kam es zum Auftrag? ${e.kontakt_name} → ${e.kunde_name}`,
      text: `Hallo,

vor einer Woche hast du ${e.kontakt_name} an ${e.kunde_name} empfohlen. Kam es zum Auftrag?

Trag das Ergebnis mit einem Klick ein:
${seite}/dashboard/empfehlungen/${e.id}

Falls nicht, kannst du dort auch einmal beim Kunden nachhaken.

Viele Grüße
Dein AuftragsKette-Team`,
    });
    if (ok) {
      nachfragen++;
      await admin
        .from("kundenempfehlungen")
        .update({ nachfrage_gesendet_am: new Date().toISOString() })
        .eq("id", e.id);
    }
  }

  return Response.json({ erinnerungen, nachfragen });
}
