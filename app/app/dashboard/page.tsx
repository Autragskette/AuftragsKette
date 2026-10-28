import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { aktuellesMitglied, pflichtStand, PFLICHT_GESAMT, PFLICHT_START } from "@/lib/mitglied";
import { datum, nachfrageFaellig } from "@/lib/empfehlung";

export const metadata: Metadata = {
  title: "Übersicht",
};

export default async function Dashboard() {
  const { supabase, user, profil } = await aktuellesMitglied();

  const [kontakteAntwort, empfehlungenAntwort] = await Promise.all([
    supabase.from("kontakte").select("status").eq("besitzer_id", user.id),
    supabase
      .from("kundenempfehlungen")
      .select("id, kontakt_name, kunde_name, ergebnis, erstellt_am")
      .order("erstellt_am", { ascending: false })
      .limit(200),
  ]);

  const kontakte = kontakteAntwort.data ?? [];
  const bestaetigt = kontakte.filter((k) => k.status === "bestaetigt").length;
  const wartend = kontakte.filter((k) => k.status === "eingeladen").length;

  const empfehlungen = empfehlungenAntwort.data ?? [];
  const faellig = empfehlungen.filter(nachfrageFaellig);
  const auftraege = empfehlungen.filter((e) => e.ergebnis === "auftrag").length;

  const pflicht = pflichtStand(bestaetigt, profil.erstellt_am);
  const profilUnvollstaendig = !profil.vorname || !profil.nachname;

  return (
    <>
      <p className="font-semibold text-blue-600">Übersicht</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        {profil.vorname ? `Willkommen, ${profil.vorname}` : "Willkommen bei AuftragsKette"}
      </h1>

      {profilUnvollstaendig && (
        <Hinweis farbe="blau">
          Bitte vervollständige zuerst{" "}
          <Link href="/dashboard/profil" className="font-semibold underline">dein Profil</Link>
          . Dein Name steht in jeder Einladung und Empfehlung.
        </Hinweis>
      )}

      {/* Pflichtkontakte */}
      {pflicht.fehlenGesamt > 0 && (
        <Hinweis farbe={pflicht.fehlenStart > 0 || pflicht.fristAbgelaufen ? "gelb" : "blau"}>
          <p className="font-semibold">
            Pflichtkontakte: {bestaetigt} von {PFLICHT_GESAMT} bestätigt
            {wartend > 0 && `, ${wartend} ${wartend === 1 ? "wartet" : "warten"} auf Zustimmung`}
          </p>
          <p className="mt-1">
            {pflicht.fehlenStart > 0
              ? `Zum Start brauchst du ${PFLICHT_START} bestätigte Kontakte. Es fehlen noch ${pflicht.fehlenStart}.`
              : pflicht.fristAbgelaufen
                ? `Die Frist für den ${PFLICHT_GESAMT}. Kontakt ist am ${datum(pflicht.frist.toISOString())} abgelaufen.`
                : `Den ${PFLICHT_GESAMT}. Kontakt kannst du bis zum ${datum(pflicht.frist.toISOString())} ergänzen (noch ${pflicht.tageRest} Tage).`}
          </p>
          <Link href="/dashboard/netzwerk/neu" className="mt-2 inline-block font-semibold underline">
            Kontakt hinzufügen
          </Link>
        </Hinweis>
      )}

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

      {/* Kennzahlen */}
      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        <Kennzahl titel="Mein Netzwerk" wert={bestaetigt} text="bestätigte Partner" href="/dashboard/netzwerk" />
        <Kennzahl titel="Empfehlungen" wert={empfehlungen.length} text="an Kunden gegeben" href="/dashboard/empfehlungen" />
        <Kennzahl titel="Aufträge" wert={auftraege} text="aus Empfehlungen" href="/dashboard/empfehlungen" />
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
        <Link href="/dashboard/netzwerk/neu" className="rounded-xl border border-gray-200 bg-white p-6 hover:border-blue-300">
          <h2 className="font-bold">Kontakt einbringen</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Trag einen Betrieb ein, den du kennst. Er bekommt eine Einladung
            und wird nach seiner Zustimmung im Netzwerk gelistet.
          </p>
          <span className="mt-4 inline-block text-sm font-semibold text-blue-700">Kontakt hinzufügen →</span>
        </Link>
      </div>
    </>
  );
}

function Hinweis({ farbe, children }: { farbe: "blau" | "gelb"; children: ReactNode }) {
  const klassen =
    farbe === "gelb"
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
