import type { Metadata } from "next";
import Link from "next/link";
import { aktuellesMitglied } from "@/lib/mitglied";
import { entfernungKm, orteImUmkreis, plzKoordinate, punktFinden } from "@/lib/geo";
import { UMKREISE, UMKREIS_STANDARD } from "@/lib/geo/umkreis";
import SuchKarte from "@/app/components/SuchKarte";

export const metadata: Metadata = {
  title: "Partner finden",
};

type Treffer = {
  id: string;
  name: string;
  firma: string;
  leistung: string;
  plz: string;
  ort: string;
  empfohlen_von: string;
  eigener: boolean;
};

type MitEntfernung = Treffer & { km: number | null };

export default async function Suche(props: PageProps<"/dashboard/suche">) {
  const p = await props.searchParams;
  const suche = String(p.suche ?? "").trim().slice(0, 80);
  const kmWunsch = Number(p.km);
  const km = (UMKREISE as readonly number[]).includes(kmWunsch) ? kmWunsch : UMKREIS_STANDARD;
  const gesucht = "suche" in p || "ort" in p;

  const { supabase, profil } = await aktuellesMitglied();

  // Ohne Ortsangabe: eigener Standort aus dem Profil
  const ortEingabe =
    typeof p.ort === "string" ? p.ort.trim().slice(0, 60) : profil.plz || profil.ort || "";
  const mitte = ortEingabe ? punktFinden(ortEingabe) : null;

  let imUmkreis: MitEntfernung[] = [];
  let ausserhalb: MitEntfernung[] = [];
  let fehler = false;

  if (gesucht) {
    const { data, error } = await supabase.rpc("netzwerk_suchen_v2", { p_suche: suche, p_limit: 2000 });
    fehler = Boolean(error);
    if (error) console.error("Netzwerksuche fehlgeschlagen:", error);

    const alle: MitEntfernung[] = ((data ?? []) as Treffer[]).map((t) => {
      const k = plzKoordinate(t.plz);
      return { ...t, km: mitte && k ? entfernungKm(mitte, k) : null };
    });

    if (mitte) {
      const sortiert = alle
        .filter((t) => t.km !== null)
        .sort((a, b) => (a.km ?? 0) - (b.km ?? 0));
      imUmkreis = sortiert.filter((t) => (t.km ?? 0) <= km);
      ausserhalb = sortiert.filter((t) => (t.km ?? 0) > km).slice(0, 3);
    } else {
      imUmkreis = alle.sort((a, b) => a.name.localeCompare(b.name, "de"));
    }
  }

  const nachbarorte = mitte ? orteImUmkreis(mitte, km, 5) : [];

  return (
    <div className="mx-auto max-w-2xl">
      <SuchKarte suche={suche} ort={ortEingabe} km={km} ueberschrift="Partner finden" />

      {gesucht && ortEingabe && !mitte && (
        <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          „{ortEingabe}“ haben wir nicht gefunden. Versuch es mit der
          Postleitzahl oder dem Namen der Stadt.
        </p>
      )}

      {fehler && (
        <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Die Suche hat nicht geklappt. Bitte erneut versuchen.
        </p>
      )}

      {gesucht && !fehler && (
        <>
          <div className="mt-7 flex items-baseline justify-between gap-3">
            <h1 className="text-lg font-semibold text-tinte">
              {imUmkreis.length === 0
                ? "Keine Partner im Umkreis"
                : `${imUmkreis.length} ${imUmkreis.length === 1 ? "Partner" : "Partner"}${suche ? ` für „${suche}“` : ""}`}
            </h1>
          </div>
          {mitte && (
            <p className="mt-1 text-sm text-slate-500">
              Bis {km} km um {mitte.bezeichnung}
              {nachbarorte.length > 1 && `, z. B. ${nachbarorte.filter((o) => o !== mitte.bezeichnung).slice(0, 4).join(", ")}`}
            </p>
          )}

          {imUmkreis.length > 0 && (
            <ul className="mt-4 divide-y divide-linie overflow-hidden rounded-2xl border border-linie bg-white">
              {imUmkreis.map((t) => (
                <TrefferZeile key={t.id} t={t} />
              ))}
            </ul>
          )}

          {imUmkreis.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-6">
              <p className="text-slate-600">
                Im Umkreis von {km} km kennt das Netzwerk noch niemanden
                {suche ? ` für „${suche}“` : ""}.
                {km < 50 && (
                  <>
                    {" "}
                    <Link
                      href={`/dashboard/suche?suche=${encodeURIComponent(suche)}&ort=${encodeURIComponent(ortEingabe)}&km=50`}
                      className="font-semibold text-kette underline underline-offset-2"
                    >
                      Auf 50 km erweitern
                    </Link>
                  </>
                )}
              </p>
              <p className="mt-3 text-sm text-slate-500">
                Kennst du jemanden? Mit jedem Kontakt, den du einbringst,
                wird die AuftragsKette in deiner Region stärker.
              </p>
              <Link
                href="/dashboard/netzwerk/neu"
                className="mt-4 inline-block rounded-xl bg-tinte px-5 py-3 text-sm font-semibold text-white"
              >
                Kontakt einbringen
              </Link>
            </div>
          )}

          {ausserhalb.length > 0 && (
            <>
              <h2 className="mt-8 text-sm font-semibold text-slate-500">Etwas weiter weg</h2>
              <ul className="mt-2 divide-y divide-linie overflow-hidden rounded-2xl border border-linie bg-white">
                {ausserhalb.map((t) => (
                  <TrefferZeile key={t.id} t={t} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

function TrefferZeile({ t }: { t: MitEntfernung }) {
  const entfernung =
    t.km === null ? "" : t.km < 1 ? "unter 1 km" : `${Math.round(t.km)} km`;
  return (
    <li className="flex items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-tinte">{t.firma || t.name}</p>
        <p className="truncate text-sm text-slate-600">
          {t.leistung}
          {t.firma && <span className="text-slate-400">, {t.name}</span>}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {t.ort || t.plz}
          {entfernung && <span className="font-semibold text-slate-700"> {entfernung}</span>}
          {!t.eigener && t.empfohlen_von && <span>, empfohlen von {t.empfohlen_von}</span>}
          {t.eigener && <span>, dein Kontakt</span>}
        </p>
      </div>
      <Link
        href={`/dashboard/empfehlen/${t.id}`}
        className="shrink-0 rounded-xl bg-kette px-4 py-2.5 text-sm font-semibold text-white"
      >
        Empfehlen
      </Link>
    </li>
  );
}
