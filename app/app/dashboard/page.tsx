import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { aktuellesMitglied, pflichtStand } from "@/lib/mitglied";
import { datum, nachfrageFaellig } from "@/lib/empfehlung";
import { aktivStatus, stufe, type Kennzahlen } from "@/lib/aktivitaet";
import { ARTEN, zeitraum, type Veranstaltung } from "@/lib/veranstaltungen";
import SuchKarte from "@/app/components/SuchKarte";
import StufenAbzeichen from "@/app/components/StufenAbzeichen";

export const metadata: Metadata = {
  title: "Start",
};

type Aufgabe = { text: string; hinweis?: string; href: string; dringend?: boolean };

export default async function Start() {
  const { supabase, user, profil } = await aktuellesMitglied();

  const [kontakteAntwort, empfehlungenAntwort, kennzahlenAntwort, terminAntwort] = await Promise.all([
    supabase.from("kontakte").select("status, abgelehnt_am").eq("besitzer_id", user.id),
    supabase
      .from("kundenempfehlungen")
      .select("id, kontakt_name, kunde_name, ergebnis, erstellt_am")
      .order("erstellt_am", { ascending: false })
      .limit(200),
    supabase.rpc("mitglieder_kennzahlen_v2", { p_id: user.id }),
    supabase
      .from("veranstaltungen")
      .select("id, titel, art, branche, region, beginn, ende")
      .gte("ende", new Date().toISOString())
      .order("beginn", { ascending: true })
      .limit(1),
  ]);

  const kontakte = kontakteAntwort.data ?? [];
  const bestaetigt = kontakte.filter((k) => k.status === "bestaetigt").length;
  const wartend = kontakte.filter((k) => k.status === "eingeladen").length;
  const letzteAblehnung =
    kontakte.map((k) => k.abgelehnt_am as string | null).filter(Boolean).sort().pop() ?? null;
  const pflicht = pflichtStand(bestaetigt, profil.erstellt_am, letzteAblehnung);

  const empfehlungen = empfehlungenAntwort.data ?? [];
  const faellig = empfehlungen.filter(nachfrageFaellig);
  const auftraege = empfehlungen.filter((e) => e.ergebnis === "auftrag").length;

  const k = (Array.isArray(kennzahlenAntwort.data)
    ? kennzahlenAntwort.data[0]
    : kennzahlenAntwort.data) as Kennzahlen | undefined;
  const meineStufe = k ? stufe(k) : null;
  const status = k ? aktivStatus(k) : null;

  const termin = ((terminAntwort.data ?? []) as Pick<
    Veranstaltung,
    "id" | "titel" | "art" | "branche" | "region" | "beginn" | "ende"
  >[])[0];

  // Was gerade zu tun ist, wichtigstes zuerst
  const aufgaben: Aufgabe[] = [];
  if (!profil.vorname || !profil.nachname) {
    aufgaben.push({
      text: "Profil vervollständigen",
      hinweis: "Dein Name steht in jeder Empfehlung",
      href: "/dashboard/profil",
      dringend: true,
    });
  }
  if (status && status.lage !== "aktiv") {
    aufgaben.push({
      text: status.lage === "warnung" ? "Verlängerung gefährdet" : "Wieder aktiv werden",
      hinweis: "Gib eine Empfehlung oder bring einen Kontakt ein",
      href: "/dashboard/aktivitaet",
      dringend: status.lage === "warnung",
    });
  }
  if (pflicht.naechster) {
    const s = pflicht.naechster;
    aufgaben.push({
      text: `${s.nr}. Pflichtkontakt einbringen`,
      hinweis: s.sofort
        ? "Zum Start"
        : s.ueberfaellig
          ? `Überfällig seit ${datum(s.frist.toISOString())}`
          : `Bis ${datum(s.frist.toISOString())}${wartend ? `, ${wartend} wartet auf Zustimmung` : ""}`,
      href: "/dashboard/netzwerk/neu",
      dringend: s.sofort || s.ueberfaellig,
    });
  }
  if (faellig.length) {
    aufgaben.push({
      text: faellig.length === 1 ? "Kam es zum Auftrag?" : `${faellig.length} Empfehlungen nachfassen`,
      hinweis: faellig.length === 1 ? `${faellig[0].kontakt_name}${faellig[0].kunde_name ? ` für ${faellig[0].kunde_name}` : ""}` : "Älter als eine Woche",
      href: faellig.length === 1 ? `/dashboard/empfehlungen/${faellig[0].id}` : "/dashboard/empfehlungen",
    });
  }
  if (status?.gibUndNimm) {
    aufgaben.push({
      text: "Gib etwas zurück",
      hinweis: `Du wurdest ${k!.empfehlungen_erhalten}-mal empfohlen`,
      href: "/dashboard/suche",
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-tinte">
          {profil.vorname ? `Hallo ${profil.vorname}` : "Willkommen"}
        </h1>
        {meineStufe && (
          <Link href="/dashboard/aktivitaet" aria-label="Meine Aktivität">
            <StufenAbzeichen name={meineStufe.name} />
          </Link>
        )}
      </div>

      <div className="mt-4">
        <SuchKarte ort={profil.plz || profil.ort} />
      </div>

      <Link
        href="/dashboard/netzwerk/neu"
        className="mt-3 flex items-center justify-between rounded-2xl border border-linie bg-white px-5 py-4"
      >
        <span>
          <span className="block font-semibold text-tinte">Kontakt einbringen</span>
          <span className="block text-sm text-slate-500">Einen Betrieb eintragen, den du empfehlen würdest</span>
        </span>
        <Plus />
      </Link>

      {aufgaben.length > 0 && (
        <Abschnitt titel="Zu erledigen">
          <ul className="divide-y divide-linie overflow-hidden rounded-2xl border border-linie bg-white">
            {aufgaben.map((a) => (
              <li key={a.text}>
                <Link href={a.href} className="flex items-center gap-3 px-4 py-3.5 active:bg-slate-50">
                  <span
                    aria-hidden
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${a.dringend ? "bg-amber-500" : "bg-kette"}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-tinte">{a.text}</span>
                    {a.hinweis && <span className="block truncate text-sm text-slate-500">{a.hinweis}</span>}
                  </span>
                  <Pfeil />
                </Link>
              </li>
            ))}
          </ul>
        </Abschnitt>
      )}

      <Abschnitt titel="Deine AuftragsKette">
        <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-linie bg-white text-center">
          <Zahl wert={bestaetigt} text={bestaetigt === 1 ? "Partner" : "Partner"} href="/dashboard/netzwerk" />
          <Zahl wert={empfehlungen.length} text={empfehlungen.length === 1 ? "Empfehlung" : "Empfehlungen"} href="/dashboard/empfehlungen" mitte />
          <Zahl wert={auftraege} text={auftraege === 1 ? "Auftrag" : "Aufträge"} href="/dashboard/empfehlungen" />
        </div>
        {k && (
          <Link href="/dashboard/aktivitaet" className="mt-2 block px-1 text-sm text-slate-500">
            {k.punkte} Aktivitätspunkte
            {meineStufe && !meineStufe.top && `, noch ${meineStufe.fehlendePunkte} bis ${meineStufe.naechste}`}
          </Link>
        )}
      </Abschnitt>

      {termin && (
        <Abschnitt titel="Nächster Termin">
          <Link
            href={`/dashboard/veranstaltungen#v-${termin.id}`}
            className="block rounded-2xl border border-linie bg-white px-5 py-4"
          >
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ARTEN[termin.art].stil}`}>
              {ARTEN[termin.art].name}
            </span>
            <span className="mt-2 block font-semibold text-tinte">{termin.titel}</span>
            <span className="mt-0.5 block text-sm text-slate-500">{zeitraum(termin.beginn, termin.ende)}</span>
          </Link>
        </Abschnitt>
      )}
    </div>
  );
}

function Abschnitt({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-2.5 px-1 text-sm font-semibold text-slate-500">{titel}</h2>
      {children}
    </section>
  );
}

function Zahl({ wert, text, href, mitte }: { wert: number; text: string; href: string; mitte?: boolean }) {
  return (
    <Link href={href} className={`px-2 py-4 ${mitte ? "border-x border-linie" : ""}`}>
      <span className="block text-2xl font-semibold tabular-nums text-tinte">{wert}</span>
      <span className="block text-xs text-slate-500">{text}</span>
    </Link>
  );
}

function Pfeil() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Plus() {
  return (
    <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-papier text-tinte">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    </span>
  );
}
