import type { Metadata } from "next";
import Link from "next/link";
import { aktuellesMitglied } from "@/lib/mitglied";
import { ARTEN, eincheckenMoeglich, zeitraum, type Veranstaltung } from "@/lib/veranstaltungen";
import { abmelden, anmelden, veranstaltungLoeschen } from "./actions";
import Einchecken from "./Einchecken";

export const metadata: Metadata = {
  title: "Veranstaltungen",
};

const FILTER = [
  { wert: "", name: "Alle" },
  { wert: "branche_online", name: "Branchen-Calls" },
  { wert: "region_vor_ort", name: "Regionale Treffen" },
];

type Teilnahme = { veranstaltung_id: string; teilgenommen_am: string | null };
type Zahl = { veranstaltung_id: string; angemeldet: number; teilgenommen: number };

export default async function Veranstaltungen(props: PageProps<"/dashboard/veranstaltungen">) {
  const { art } = await props.searchParams;
  const filter = art === "branche_online" || art === "region_vor_ort" ? art : "";

  const { supabase, user } = await aktuellesMitglied();
  const grenze = new Date(Date.now() - 24 * 3_600_000).toISOString();

  let anfrage = supabase
    .from("veranstaltungen")
    .select("id, titel, art, branche, region, beginn, ende, ort, teams_link, beschreibung")
    .gte("ende", grenze)
    .order("beginn", { ascending: true })
    .limit(100);
  if (filter) anfrage = anfrage.eq("art", filter);

  const [veranstaltungenAntwort, teilnahmenAntwort, zahlenAntwort, adminAntwort] = await Promise.all([
    anfrage,
    supabase.from("teilnahmen").select("veranstaltung_id, teilgenommen_am").eq("mitglied_id", user.id),
    supabase.rpc("veranstaltung_zahlen"),
    supabase.rpc("ist_admin"),
  ]);

  const liste = (veranstaltungenAntwort.data ?? []) as Veranstaltung[];
  const meine = new Map(
    ((teilnahmenAntwort.data ?? []) as Teilnahme[]).map((t) => [t.veranstaltung_id, t]),
  );
  const zahlen = new Map(((zahlenAntwort.data ?? []) as Zahl[]).map((z) => [z.veranstaltung_id, z]));
  const istAdmin = adminAntwort.data === true;

  const codes = new Map<string, string>();
  if (istAdmin) {
    const ergebnisse = await Promise.all(
      liste.map((v) => supabase.rpc("veranstaltung_code", { p_id: v.id })),
    );
    liste.forEach((v, i) => codes.set(v.id, (ergebnisse[i].data as string) ?? ""));
  }

  const teilgenommen = [...meine.values()].filter((t) => t.teilgenommen_am).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-semibold text-blue-600">Veranstaltungen</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Gemeinsam netzwerken</h1>
          <p className="mt-3 max-w-2xl text-gray-600">
            Online-Branchen-Calls über Teams und regionale Community-Treffen, bei
            denen sich alle Branchen begegnen. Für jede Teilnahme gibt es Punkte:
            {" "}{ARTEN.branche_online.punkte} für einen Branchen-Call,{" "}
            {ARTEN.region_vor_ort.punkte} für ein regionales Treffen.
          </p>
          {teilgenommen > 0 && (
            <p className="mt-2 text-sm text-gray-500">Du warst schon bei {teilgenommen} Veranstaltung{teilgenommen === 1 ? "" : "en"} dabei.</p>
          )}
        </div>
        {istAdmin && (
          <Link
            href="/dashboard/veranstaltungen/neu"
            className="w-full rounded-lg bg-gray-900 px-5 py-3 text-center font-semibold text-white sm:w-auto"
          >
            + Veranstaltung anlegen
          </Link>
        )}
      </div>

      <nav className="mt-6 flex flex-wrap gap-2">
        {FILTER.map((f) => (
          <Link
            key={f.wert}
            href={f.wert ? `/dashboard/veranstaltungen?art=${f.wert}` : "/dashboard/veranstaltungen"}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              filter === f.wert ? "bg-gray-900 text-white" : "border border-gray-300 bg-white text-gray-700"
            }`}
          >
            {f.name}
          </Link>
        ))}
      </nav>

      {liste.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-bold">Noch keine Termine</h2>
          <p className="mx-auto mt-2 max-w-md text-gray-600">
            Sobald neue Branchen-Calls oder regionale Treffen geplant sind,
            erscheinen sie hier.
          </p>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {liste.map((v) => {
          const a = ARTEN[v.art];
          const t = meine.get(v.id);
          const angemeldet = Boolean(t);
          const dabei = Boolean(t?.teilgenommen_am);
          const z = zahlen.get(v.id);
          const laeuft = eincheckenMoeglich(v);
          const vorbei = new Date(v.ende).getTime() < Date.now();

          return (
            <li key={v.id} id={`v-${v.id}`} className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${a.stil}`}>{a.name}</span>
                {(v.branche || v.region) && (
                  <span className="text-sm text-gray-500">{v.art === "branche_online" ? v.branche : v.region}</span>
                )}
                {dabei && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
                    Teilgenommen ✓
                  </span>
                )}
              </div>

              <h2 className="mt-3 text-xl font-bold">{v.titel}</h2>
              <p className="mt-1 text-sm font-medium text-gray-700">{zeitraum(v.beginn, v.ende)}</p>
              {v.ort && <p className="mt-1 text-sm text-gray-500">{v.ort}</p>}
              {v.beschreibung && (
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-600">{v.beschreibung}</p>
              )}
              <p className="mt-3 text-xs text-gray-400">
                {z?.angemeldet ?? 0} angemeldet
                {(z?.teilgenommen ?? 0) > 0 && ` · ${z!.teilgenommen} teilgenommen`}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                {!vorbei && !dabei && (
                  <form action={(angemeldet ? abmelden : anmelden).bind(null, v.id)}>
                    <button
                      className={
                        angemeldet
                          ? "rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold"
                          : "rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white"
                      }
                    >
                      {angemeldet ? "Abmelden" : "Ich bin dabei"}
                    </button>
                  </form>
                )}
                {v.art === "branche_online" && v.teams_link && (angemeldet || laeuft) && (
                  <a
                    href={v.teams_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-[#5059C9] px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Teams-Raum öffnen
                  </a>
                )}
              </div>

              {laeuft && !dabei && (
                <div className="mt-4 max-w-md">
                  <Einchecken id={v.id} punkte={a.punkte} />
                </div>
              )}

              {istAdmin && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm">
                  <p className="text-gray-600">
                    Teilnahme-Code für die Teilnehmer:{" "}
                    <strong className="font-mono text-base tracking-widest text-gray-900">{codes.get(v.id)}</strong>
                  </p>
                  <form action={veranstaltungLoeschen.bind(null, v.id)}>
                    <button className="text-gray-400 hover:text-red-600">Löschen</button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
