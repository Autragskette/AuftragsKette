import type { Metadata } from "next";
import Link from "next/link";
import { aktuellesMitglied } from "@/lib/mitglied";
import { datum, nachfrageFaellig } from "@/lib/empfehlung";
import StatusPlakette from "@/app/components/StatusPlakette";

export const metadata: Metadata = {
  title: "Meine Empfehlungen",
};

type Eintrag = {
  id: string;
  kontakt_name: string;
  kunde_name: string;
  ergebnis: string;
  erstellt_am: string;
};

export default async function MeineEmpfehlungen() {
  const { supabase } = await aktuellesMitglied();

  const { data, error } = await supabase
    .from("kundenempfehlungen")
    .select("id, kontakt_name, kunde_name, ergebnis, erstellt_am")
    .order("erstellt_am", { ascending: false })
    .limit(200);

  const alle = (data ?? []) as Eintrag[];
  const faellig = alle.filter(nachfrageFaellig);
  const auftraege = alle.filter((e) => e.ergebnis === "auftrag").length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-semibold text-blue-600">Meine Empfehlungen</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Empfehlungen an Kunden
          </h1>
          <p className="mt-3 text-gray-600">
            {alle.length} {alle.length === 1 ? "Empfehlung" : "Empfehlungen"} gegeben,
            daraus {auftraege} {auftraege === 1 ? "Auftrag" : "Aufträge"} entstanden.
          </p>
        </div>
        <Link
          href="/dashboard/suche"
          className="w-full rounded-lg bg-gray-900 px-5 py-3 text-center font-semibold text-white sm:w-auto"
        >
          + Neue Empfehlung
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Die Empfehlungen konnten nicht geladen werden.
        </p>
      )}

      {faellig.length > 0 && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-bold text-amber-900">
            Nachfrage fällig: {faellig.length}
          </h2>
          <p className="mt-1 text-sm text-amber-900">
            Diese Empfehlungen sind über eine Woche alt. Kam es zum Auftrag?
          </p>
          <ul className="mt-3 space-y-2">
            {faellig.map((e) => (
              <li key={e.id}>
                <Link href={`/dashboard/empfehlungen/${e.id}`} className="text-sm font-semibold text-amber-900 underline">
                  {e.kontakt_name} → {e.kunde_name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!error && alle.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-bold">Noch keine Empfehlungen</h2>
          <p className="mx-auto mt-2 max-w-md text-gray-600">
            Fragt dich ein Kunde nach einem Handwerker oder Dienstleister?
            Such im Netzwerk und schick die Empfehlung direkt aufs Handy.
          </p>
          <Link
            href="/dashboard/suche"
            className="mt-6 inline-block rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white"
          >
            Netzwerk durchsuchen
          </Link>
        </div>
      )}

      {alle.length > 0 && (
        <ul className="mt-6 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
          {alle.map((e) => (
            <li key={e.id}>
              <Link
                href={`/dashboard/empfehlungen/${e.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {e.kontakt_name} → {e.kunde_name}
                  </p>
                  <p className="text-sm text-gray-500">{datum(e.erstellt_am)}</p>
                </div>
                <StatusPlakette status={nachfrageFaellig(e) ? "faellig" : e.ergebnis} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
