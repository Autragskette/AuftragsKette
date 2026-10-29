import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { aktuellesMitglied, pflichtStand } from "@/lib/mitglied";
import { datum, nachfrageFaellig } from "@/lib/empfehlung";
import { aktivStatus, stufe, STUFE_AKTIV, STUFE_TOP, type Kennzahlen } from "@/lib/aktivitaet";
import PflichtKontakte from "@/app/components/PflichtKontakte";
import StufenAbzeichen from "@/app/components/StufenAbzeichen";
import { ARTEN, zeitraum, type Veranstaltung } from "@/lib/veranstaltungen";

export const metadata: Metadata = {
  title: "Übersicht",
};

export default async function Dashboard() {
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
      .limit(3),
  ]);
  const termine = (terminAntwort.data ?? []) as Pick<
    Veranstaltung,
    "id" | "titel" | "art" | "branche" | "region" | "beginn" | "ende"
  >[];

  const kontakte = kontakteAntwort.data ?? [];
  const bestaetigt = kontakte.filter((k) => k.status === "bestaetigt").length;
  const wartend = kontakte.filter((k) => k.status === "eingeladen").length;
  const letzteAblehnung =
    kontakte.map((k) => k.abgelehnt_am as string | null).filter(Boolean).sort().pop() ?? null;

  const empfehlungen = empfehlungenAntwort.data ?? [];
  const faellig = empfehlungen.filter(nachfrageFaellig);

  const pflicht = pflichtStand(bestaetigt, profil.erstellt_am, letzteAblehnung);
  const profilUnvollstaendig = !profil.vorname || !profil.nachname;

  const kennzahlen = (Array.isArray(kennzahlenAntwort.data)
    ? kennzahlenAntwort.data[0]
    : kennzahlenAntwort.data) as Kennzahlen | undefined;
  const meineStufe = kennzahlen ? stufe(kennzahlen) : null;
  const status = kennzahlen ? aktivStatus(kennzahlen) : null;

  return (
    <>
      <p className="font-semibold text-blue-600">Übersicht</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">
          {profil.vorname ? `Willkommen, ${profil.vorname}` : "Willkommen bei AuftragsKette"}
        </h1>
        {meineStufe && <StufenAbzeichen name={meineStufe.name} />}
      </div>

      {profilUnvollstaendig && (
        <Hinweis farbe="blau">
          Bitte vervollständige zuerst{" "}
          <Link href="/dashboard/profil" className="font-semibold underline">dein Profil</Link>
          . Dein Name steht in jeder Einladung und Empfehlung.
        </Hinweis>
      )}

      {/* Inaktivität */}
      {status && status.lage !== "aktiv" && (
        <Hinweis farbe={status.lage === "warnung" ? "rot" : "gelb"}>
          <p className="font-semibold">
            {status.lage === "warnung"
              ? "Deine Verlängerung ist gefährdet"
              : "Wir vermissen dich in der AuftragsKette"}
          </p>
          {status.gruende.map((g) => (
            <p key={g} className="mt-1">{g}</p>
          ))}
          <p className="mt-1">
            Die Community lebt davon, dass alle mitmachen. Gib eine Empfehlung
            oder bring einen Kontakt ein, dann bist du wieder dabei.
          </p>
          <Link href="/dashboard/suche" className="mt-2 inline-block font-semibold underline">
            Jetzt jemanden empfehlen
          </Link>
        </Hinweis>
      )}

      {status?.gibUndNimm && (
        <Hinweis farbe="gelb">
          Du wurdest im letzten Jahr {kennzahlen!.empfehlungen_erhalten}-mal
          empfohlen, hast selbst aber erst {kennzahlen!.empfehlungen_gegeben}{" "}
          Empfehlung{kennzahlen!.empfehlungen_gegeben === 1 ? "" : "en"} gegeben. Gib
          etwas zurück, davon lebt die AuftragsKette.
        </Hinweis>
      )}

      <PflichtKontakte stand={pflicht} wartend={wartend} />

      {/* Fällige Nachfragen */}
      {faellig.length > 0 && (
        <Hinweis farbe="gelb">
          <p className="font-semibold">Kam es zum Auftrag? {faellig.length} Nachfrage{faellig.length === 1 ? "" : "n"} fällig</p>
          <ul className="mt-2 space-y-1">
            {faellig.slice(0, 5).map((e) => (
              <li key={e.id}>
                <Link href={`/dashboard/empfehlungen/${e.id}`} className="underline">
                  {e.kontakt_name} → {e.kunde_name} ({datum(e.erstellt_am)})
                </Link>
              </li>
            ))}
          </ul>
        </Hinweis>
      )}

      {/* Aktivität */}
      {kennzahlen && meineStufe && status && (
        <Link
          href="/dashboard/aktivitaet"
          className="mt-8 block rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-bold">Deine Aktivität</h2>
            <span className="text-sm text-gray-500">letzte 12 Monate</span>
          </div>
          <p className="mt-3 text-3xl font-bold">
            {kennzahlen.punkte} <span className="text-base font-medium text-gray-500">Punkte</span>
          </p>
          <Fortschritt punkte={kennzahlen.punkte} />
          <p className="mt-3 text-sm text-gray-600">
            {meineStufe.top
              ? "Du bist Top-Mitglied. Danke, dass du die AuftragsKette stark machst!"
              : `Noch ${meineStufe.fehlendePunkte} Punkte bis ${meineStufe.naechste}.`}
          </p>
          <p className={`mt-2 text-sm ${status.verlaengerungGesichert ? "text-green-700" : "text-amber-700"}`}>
            Verlängerung am {datum(status.verlaengerungAm.toISOString())}:{" "}
            {status.verlaengerungGesichert ? "gesichert ✓" : `noch nicht gesichert (ab ${STUFE_AKTIV} Punkten)`}
          </p>
        </Link>
      )}

      {/* Nächste Veranstaltungen */}
      {termine.length > 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="font-bold">Nächste Veranstaltungen</h2>
            <Link href="/dashboard/veranstaltungen" className="text-sm font-semibold text-blue-700">Alle ansehen →</Link>
          </div>
          <ul className="mt-3 divide-y divide-gray-100">
            {termine.map((v) => (
              <li key={v.id}>
                <Link href={`/dashboard/veranstaltungen#v-${v.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ARTEN[v.art].stil}`}>
                    {ARTEN[v.art].name}
                  </span>
                  <span className="font-semibold">{v.titel}</span>
                  <span className="text-sm text-gray-500">{zeitraum(v.beginn, v.ende)}</span>
                  <span className="text-xs text-gray-400">+{ARTEN[v.art].punkte} Punkte</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Kennzahlen */}
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <Kennzahl titel="Mein Netzwerk" wert={bestaetigt} text="bestätigte Partner" href="/dashboard/netzwerk" />
        <Kennzahl titel="Empfehlungen" wert={empfehlungen.length} text="an Kunden gegeben" href="/dashboard/empfehlungen" />
        <Kennzahl
          titel="Aufträge"
          wert={empfehlungen.filter((e) => e.ergebnis === "auftrag").length}
          text="aus Empfehlungen"
          href="/dashboard/empfehlungen"
        />
      </div>

      {/* Schnellzugriff */}
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Link href="/dashboard/suche" className="rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300">
          <h2 className="font-bold">Kunde sucht jemanden?</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Finde einen passenden Partner aus der Region und schick die
            Empfehlung per WhatsApp, E-Mail oder Visitenkarte.
          </p>
          <span className="mt-4 inline-block text-sm font-semibold text-blue-700">Netzwerk durchsuchen →</span>
        </Link>
        <Link href="/dashboard/top" className="rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300">
          <h2 className="font-bold">Top im Netzwerk</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Wer ist voll dabei? Die aktivsten Mitglieder und die
            meistempfohlenen Partner der AuftragsKette.
          </p>
          <span className="mt-4 inline-block text-sm font-semibold text-blue-700">Zur Rangliste →</span>
        </Link>
      </div>
    </>
  );
}

function Fortschritt({ punkte }: { punkte: number }) {
  const prozent = Math.min(100, Math.round((punkte / STUFE_TOP) * 100));
  const markeAktiv = Math.round((STUFE_AKTIV / STUFE_TOP) * 100);
  return (
    <div className="relative mt-4 h-2.5 rounded-full bg-gray-100">
      <div className="h-2.5 rounded-full bg-blue-600" style={{ width: `${prozent}%` }} />
      <div
        className="absolute -top-1 h-4.5 w-0.5 bg-gray-400"
        style={{ left: `${markeAktiv}%` }}
        title={`Aktives Mitglied ab ${STUFE_AKTIV} Punkten`}
      />
    </div>
  );
}

function Hinweis({ farbe, children }: { farbe: "blau" | "gelb" | "rot"; children: ReactNode }) {
  const klassen =
    farbe === "rot"
      ? "border-red-200 bg-red-50 text-red-900"
      : farbe === "gelb"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-blue-200 bg-blue-50 text-blue-900";
  return <div className={`mt-6 rounded-xl border p-5 text-sm leading-6 ${klassen}`}>{children}</div>;
}

function Kennzahl({ titel, wert, text, href }: { titel: string; wert: number; text: string; href: string }) {
  return (
    <Link href={href} className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300">
      <p className="text-sm font-medium text-gray-500">{titel}</p>
      <p className="mt-3 text-3xl font-bold">{wert}</p>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
    </Link>
  );
}
