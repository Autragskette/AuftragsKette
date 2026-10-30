import type { Metadata } from "next";
import NurFuerMitglieder from "@/app/components/NurFuerMitglieder";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StatusPlakette from "@/app/components/StatusPlakette";
import PflichtKontakte from "@/app/components/PflichtKontakte";
import SchnellEmpfehlen from "@/app/components/SchnellEmpfehlen";
import {
  aktuellesMitglied,
  ohneStartkontakteMoeglich,
  pflichtStand,
  startkontakteZaehlen,
} from "@/lib/mitglied";

export const metadata: Metadata = {
  title: "Mein Netzwerk",
};

type Kontakt = {
  id: string;
  name: string;
  firma: string;
  leistung: string;
  email: string;
  telefon: string;
  plz: string;
  ort: string;
  status: string;
  abgelehnt_am: string | null;
  herkunft: "persoenlich" | "netzwerk";
};

export default async function MeinNetzwerk(props: PageProps<"/dashboard/netzwerk">) {
  const suchParameter = await props.searchParams;
  const suche = String(suchParameter.suche ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("kontakte")
    .select("id, name, firma, leistung, email, telefon, plz, ort, status, abgelehnt_am, herkunft")
    .eq("besitzer_id", user.id)
    .order("name", { ascending: true });

  const alle = (data ?? []) as Kontakt[];
  const kontakte = suche ? alle.filter((k) => passt(k, suche)) : alle;
  const { profil, istPartner } = await aktuellesMitglied();
  const ohneEigene = Boolean(profil.ohne_startkontakte_am);
  const bestaetigt = startkontakteZaehlen(alle, ohneEigene);
  const wartend = alle.filter(
    (k) => k.status === "eingeladen" && (k.herkunft !== "netzwerk" || ohneEigene),
  ).length;
  if (istPartner) {
    return (
      <div className="mx-auto max-w-2xl">
        <NurFuerMitglieder
          titel="Dein eigenes Netzwerk"
          text="Als Mitglied lädst du Betriebe ein, deren Arbeit du kennst, und empfiehlst sie an deine Kunden weiter. Jeder Kontakt stimmt selbst zu, so wie du."
        />
      </div>
    );
  }
  const letzteAblehnung =
    alle.map((k) => k.abgelehnt_am).filter(Boolean).sort().pop() ?? null;
  const pflicht = pflichtStand(bestaetigt, profil.erstellt_am, letzteAblehnung);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-tinte sm:text-3xl">
            Deine Geschäftskontakte
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Betriebe, die du deinen Kunden guten Gewissens empfiehlst: persönlich
            bekannte und solche, die du über die AuftragsKette kennengelernt
            hast. Nur du siehst diese Liste.
          </p>
        </div>

        <Link
          href="/dashboard/netzwerk/neu"
          className="w-full rounded-xl bg-tinte px-5 py-3 text-center font-semibold text-white sm:w-auto"
        >
          + Kontakt einladen
        </Link>
      </div>

      <PflichtKontakte
        stand={pflicht}
        wartend={wartend}
        ohneEigene={ohneEigene}
        ohneMoeglich={ohneStartkontakteMoeglich(profil, pflicht.fehlen)}
      />

      {error && (
        <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Deine Kontakte konnten nicht geladen werden. Bitte lade die Seite neu.
        </p>
      )}

      {alle.length > 0 && (
        <form className="mt-8" role="search">
          <label htmlFor="suche" className="sr-only">
            Kontakte durchsuchen
          </label>
          <input
            id="suche"
            name="suche"
            type="search"
            defaultValue={suche}
            placeholder="Nach Name, Firma oder Leistung suchen …"
            className="w-full max-w-md rounded-xl border border-linie bg-white px-4 py-3 outline-none focus:border-kette"
          />
        </form>
      )}

      {!error && alle.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-bold">Noch keine Kontakte</h2>
          <p className="mx-auto mt-2 max-w-md text-gray-600">
            Füge Geschäftskontakte hinzu, die du guten Gewissens
            weiterempfehlen würdest.
          </p>
          <Link
            href="/dashboard/netzwerk/neu"
            className="mt-6 inline-block rounded-xl bg-tinte px-5 py-3 font-semibold text-white"
          >
            Ersten Kontakt einladen
          </Link>
        </div>
      )}

      {alle.length > 0 && kontakte.length === 0 && (
        <p className="mt-6 text-gray-600">
          Keine Kontakte zu „{suche}“ gefunden.{" "}
          <Link href="/dashboard/netzwerk" className="font-semibold underline">
            Suche zurücksetzen
          </Link>
        </p>
      )}

      {kontakte.length > 0 && (
        <ul className="mt-6 grid gap-4 lg:grid-cols-2">
          {kontakte.map((k) => (
            <li key={k.id} className="flex flex-col overflow-hidden rounded-2xl border border-linie bg-white hover:border-blue-300">
              <Link
                href={`/dashboard/netzwerk/${k.id}`}
                className="block flex-1 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{k.name}</p>
                    {k.firma && (
                      <p className="truncate text-sm text-gray-500">{k.firma}</p>
                    )}
                  </div>
                  <StatusPlakette status={k.status} />
                </div>

                <p className="mt-3 text-sm text-gray-700">{k.leistung}</p>
                {k.herkunft === "netzwerk" && (
                  <p className="mt-2 inline-block rounded-full bg-papier px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-linie">
                    Über die AuftragsKette kennengelernt
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                  {(k.plz || k.ort) && <span>{`${k.plz} ${k.ort}`.trim()}</span>}
                  {k.email && <span className="truncate">{k.email}</span>}
                  {k.telefon && <span>{k.telefon}</span>}
                </div>
              </Link>
              {k.status === "bestaetigt" && (
                <div className="flex items-center gap-3 border-t border-linie px-5 py-3">
                  <SchnellEmpfehlen kontaktId={k.id} />
                  <Link href={`/dashboard/empfehlen/${k.id}`} className="text-xs font-semibold text-slate-500">
                    mit Kundendaten
                  </Link>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function passt(k: Kontakt, suche: string) {
  const s = suche.toLocaleLowerCase("de");
  return [k.name, k.firma, k.leistung, k.ort, k.plz].some((wert) =>
    wert.toLocaleLowerCase("de").includes(s),
  );
}
