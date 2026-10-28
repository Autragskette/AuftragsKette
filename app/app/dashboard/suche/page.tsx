import type { Metadata } from "next";
import Link from "next/link";
import { aktuellesMitglied } from "@/lib/mitglied";

export const metadata: Metadata = {
  title: "Suchen & Empfehlen",
};

type Treffer = {
  id: string;
  name: string;
  firma: string;
  leistung: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  empfohlen_von: string;
  eigener: boolean;
};

export default async function Suche(props: PageProps<"/dashboard/suche">) {
  const parameter = await props.searchParams;
  const suche = String(parameter.suche ?? "").trim().slice(0, 80);
  const region = String(parameter.region ?? "").trim().slice(0, 40);
  const gesucht = "suche" in parameter || "region" in parameter;

  const { supabase, profil } = await aktuellesMitglied();

  let treffer: Treffer[] = [];
  let fehler = false;
  if (gesucht) {
    const { data, error } = await supabase.rpc("netzwerk_suchen", {
      p_suche: suche,
      p_region: region,
    });
    treffer = (data ?? []) as Treffer[];
    fehler = Boolean(error);
    if (error) console.error("Netzwerksuche fehlgeschlagen:", error);
  }

  const regionVorschlag = profil.plz ? profil.plz.slice(0, 2) : "";

  return (
    <>
      <p className="font-semibold text-blue-600">Suchen & Empfehlen</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        Wen kennt das Netzwerk?
      </h1>
      <p className="mt-3 max-w-2xl text-gray-600">
        Finde bestätigte Partner aus dem ganzen Netzwerk nach Gewerk und
        Region, auch dort, wo du selbst niemanden kennst, und empfiehl sie
        direkt an deinen Kunden.
      </p>

      <form className="mt-8 grid gap-4 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-[1fr_200px_auto]" role="search">
        <div>
          <label htmlFor="suche" className="mb-2 block text-sm font-semibold text-gray-700">
            Gewerk oder Leistung
          </label>
          <input
            id="suche"
            name="suche"
            type="search"
            defaultValue={suche}
            placeholder="z. B. Florist, Elektriker, Steuerberatung"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
          />
        </div>
        <div>
          <label htmlFor="region" className="mb-2 block text-sm font-semibold text-gray-700">
            PLZ-Bereich oder Ort
          </label>
          <input
            id="region"
            name="region"
            defaultValue={gesucht ? region : regionVorschlag}
            placeholder="z. B. 48 oder Münster"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white"
          >
            Suchen
          </button>
        </div>
        <p className="text-xs text-gray-500 sm:col-span-3">
          Tipp: Die ersten zwei Ziffern der PLZ (z. B. „48“) finden die ganze
          Region. Leer lassen findet alle.
        </p>
      </form>

      {fehler && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Die Suche hat nicht geklappt. Bitte erneut versuchen.
        </p>
      )}

      {gesucht && !fehler && (
        <p className="mt-6 text-sm text-gray-500">
          {treffer.length === 0
            ? "Keine Treffer."
            : `${treffer.length} ${treffer.length === 1 ? "Partner" : "Partner"} gefunden${treffer.length === 100 ? " (die ersten 100)" : ""}.`}
        </p>
      )}

      {gesucht && !fehler && treffer.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <h2 className="font-bold">Hier fehlt noch jemand</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
            Für diese Suche gibt es im Netzwerk noch keinen bestätigten
            Partner. Kennst du jemanden? Dann schließ die Lücke.
          </p>
          <Link
            href="/dashboard/netzwerk/neu"
            className="mt-5 inline-block rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Kontakt hinzufügen
          </Link>
        </div>
      )}

      {treffer.length > 0 && (
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          {treffer.map((t) => (
            <li
              key={t.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5"
            >
              <div className="min-w-0">
                <p className="truncate font-bold">{t.name}</p>
                {t.firma && <p className="truncate text-sm text-gray-500">{t.firma}</p>}
              </div>
              <p className="mt-3 text-sm text-gray-800">{t.leistung}</p>
              <p className="mt-2 text-sm text-gray-500">
                {`${t.plz} ${t.ort}`.trim()}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {t.eigener ? "Dein Kontakt" : `Empfohlen von ${t.empfohlen_von || "einem Mitglied"}`}
              </p>
              <div className="mt-4 flex-1" />
              <Link
                href={`/dashboard/empfehlen/${t.id}`}
                className="block rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white"
              >
                An Kunden empfehlen
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
