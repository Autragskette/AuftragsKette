import { createClient } from "@supabase/supabase-js";
import { emailVersandAktiv, sendeEmail } from "@/lib/email";
import { aktivStatus, erinnerungsStufe, type Kennzahlen } from "@/lib/aktivitaet";
import { datum, NACHFRAGE_TAGE } from "@/lib/empfehlung";
import { pushAktiv, sendePush, type PushAbo } from "@/lib/push";
import { testHinweis } from "@/lib/texte";

/**
 * Täglicher Lauf (Vercel Cron, siehe vercel.json):
 *  - Erinnerung an inaktive Mitglieder (Stufe 1) und Warnung (Stufe 2)
 *  - Nachfrage „Kam es zum Auftrag?“ 7 Tage nach einer Empfehlung
 *  - Partner: Hinweis 7 Tage vor Ende und am Ende der Testphase
 *    (Push-Nachricht, zusätzlich E-Mail, sobald der Versand aktiv ist)
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

  if (!url || !schluessel) {
    return Response.json({ uebersprungen: "Server-Schlüssel nicht eingerichtet" });
  }

  const admin = createClient(url, schluessel, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 0) Testphase der Partner
  let partnerHinweise = 0;
  {
    const { data: phasen } = await admin.rpc("partner_testphasen");
    const liste = (phasen ?? []) as {
      nutzer_id: string;
      email: string;
      vorname: string;
      empfehlungen: number;
      frei_bis: string | null;
      pausiert: boolean;
      hinweis_stufe: number;
    }[];
    const ids = liste.map((p) => p.nutzer_id);
    const { data: abos } = ids.length
      ? await admin.from("push_abos").select("nutzer_id, endpoint, p256dh, auth").in("nutzer_id", ids)
      : { data: [] };

    for (const p of liste) {
      const baldBis = p.frei_bis ? new Date(p.frei_bis).getTime() - Date.now() : Infinity;
      const soll = p.pausiert ? 2 : baldBis <= 7 * 86_400_000 ? 1 : 0;
      if (soll <= p.hinweis_stufe) continue;

      const hinweis = testHinweis({
        art: soll === 2 ? "beendet" : "bald",
        vorname: p.vorname,
        bis: p.frei_bis,
        link: `${seite}/dashboard/mitglied-werden`,
      });

      let erreicht = false;
      if (pushAktiv()) {
        for (const a of (abos ?? []).filter((a) => a.nutzer_id === p.nutzer_id)) {
          const r = await sendePush(a as PushAbo, { titel: hinweis.titel, text: hinweis.kurz, url: "/dashboard/mitglied-werden" });
          if (r === "ok") erreicht = true;
          if (r === "abgelaufen") await admin.rpc("push_abo_entfernen", { p_endpoint: a.endpoint });
        }
      }
      if (emailVersandAktiv() && p.email) {
        erreicht = (await sendeEmail({ an: p.email, betreff: hinweis.titel, text: hinweis.lang })) || erreicht;
      }
      if (erreicht) {
        partnerHinweise++;
        await admin.from("profile").update({ test_hinweis_stufe: soll }).eq("id", p.nutzer_id);
      }
    }
  }

  if (!emailVersandAktiv()) {
    return Response.json({ partnerHinweise, uebersprungen: "E-Mail-Versand nicht eingerichtet" });
  }

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
    admin.rpc("mitglieder_kennzahlen_v2", { p_id: null }),
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
    : "Die AuftragsKette lebt davon, dass alle mitmachen: Empfehlungen geben, Kontakte einladen, dabei sein."
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

  return Response.json({ partnerHinweise, erinnerungen, nachfragen });
}
