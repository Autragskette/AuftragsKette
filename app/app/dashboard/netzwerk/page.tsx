import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import StatusPlakette from "@/app/components/StatusPlakette";

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
    .select("id, name, firma, leistung, email, telefon, plz, ort, status")
    .eq("besitzer_id", user.id)
    .order("name", { ascending: true });

  const alle = (data ?? []) as Kontakt[];
  const kontakte = suche ? alle.filter((k) => passt(k, suche)) : alle;
  const bestaetigt = alle.filter((k) => k.status === "bestaetigt").length;
  const wartend = alle.filter((k) => k.status === "eingeladen").length;
  const fehlend = Math.max(0, 3 - bestaetigt);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-semibold text-blue-600">Mein Netzwerk</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Deine Geschäftskontakte
          </h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Kontakte, die du persönlich kennst und fachlich einschätzen
            kannst. Nur du siehst diese Liste.
          </p>
        </div>

        <Link
          href="/dashboard/netzwerk/neu"
          className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white"
        >
          + Kontakt hinzufügen
        </Link>
      </div>

      {fehlend > 0 && (
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
          <strong>{bestaetigt} von 3</strong> Pflichtkontakten bestätigt.
          {wartend > 0 && <> {wartend} {wartend === 1 ? "wartet" : "warten"} noch auf Zustimmung.</>}
          {" "}Zum Start brauchst du 2 bestätigte Kontakte, den 3. innerhalb von 3 Monaten.
        </div>
      )}

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
            className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
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
            className="mt-6 inline-block rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white"
          >
            Ersten Kontakt hinzufügen
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
            <li key={k.id}>
              <Link
                href={`/dashboard/netzwerk/${k.id}`}
                className="block h-full rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300"
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

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                  {(k.plz || k.ort) && <span>{`${k.plz} ${k.ort}`.trim()}</span>}
                  {k.email && <span className="truncate">{k.email}</span>}
                  {k.telefon && <span>{k.telefon}</span>}
                </div>
              </Link>
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
