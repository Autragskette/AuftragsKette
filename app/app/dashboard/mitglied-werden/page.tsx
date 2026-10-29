import type { Metadata } from "next";
import { aktuellesMitglied } from "@/lib/mitglied";
import { TARIFE } from "@/lib/preise";
import { mitgliedschaftAnfragen } from "./actions";

export const metadata: Metadata = {
  title: "Mitglied werden",
};

const VORTEILE = [
  "Du bleibst in der Suche sichtbar und wirst weiter empfohlen",
  "Du empfiehlst selbst Betriebe aus deinem Netzwerk an deine Kunden",
  "Online-Meetings, Branchentreffen und regionale Veranstaltungen",
  "Aktivitätspunkte sammeln und Top-Mitglied werden",
  "Keine Provision auf Aufträge",
];

export default async function MitgliedWerden(props: PageProps<"/dashboard/mitglied-werden">) {
  const { angefragt } = await props.searchParams;
  const { supabase, user, istPartner } = await aktuellesMitglied();

  const { data: ich } = await supabase.from("profile").select("mitglied_anfrage_am").eq("id", user.id).maybeSingle();
  const schonAngefragt = Boolean(angefragt || ich?.mitglied_anfrage_am);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-tinte">Mitglied werden</h1>

      {!istPartner ? (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          Du bist bereits Mitglied der AuftragsKette.
        </p>
      ) : (
        <>
          <p className="mt-2 leading-7 text-slate-600">
            Als Mitglied nutzt du die AuftragsKette voll: als Unternehmernetzwerk
            und als Weg zu neuen Aufträgen über persönliche Empfehlungen.
          </p>

          <ul className="mt-6 space-y-2 rounded-2xl border border-linie bg-white p-5 text-sm leading-6 text-slate-700">
            {VORTEILE.map((v) => (
              <li key={v} className="flex gap-2">
                <span aria-hidden className="text-kette">✓</span>
                {v}
              </li>
            ))}
          </ul>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {TARIFE.map((t) => (
              <div key={t.name} className="rounded-2xl border border-linie bg-white p-4">
                <p className="text-sm font-semibold text-gray-700">{t.name}</p>
                <p className="mt-1 flex items-end gap-1">
                  <span className="text-3xl font-bold text-tinte">{t.preis} €</span>
                  <span className="pb-1 text-sm text-gray-500">/ Monat</span>
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">{t.laufzeit}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">Alle Preise netto zzgl. MwSt.</p>

          {schonAngefragt ? (
            <p className="mt-6 rounded-xl bg-green-50 px-4 py-3 text-sm leading-6 text-green-800">
              Danke! Dein Wunsch ist vorgemerkt. Wir melden uns bei dir, um die
              Mitgliedschaft freizuschalten.
            </p>
          ) : (
            <form action={mitgliedschaftAnfragen} className="mt-6">
              <button type="submit" className="w-full rounded-xl bg-tinte px-6 py-4 font-semibold text-white">
                Ich möchte Mitglied werden
              </button>
              <p className="mt-2 text-center text-xs text-gray-500">
                Noch unverbindlich. Wir melden uns bei dir zur Freischaltung.
              </p>
            </form>
          )}
        </>
      )}
    </div>
  );
}
