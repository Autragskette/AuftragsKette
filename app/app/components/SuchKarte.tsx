import Link from "next/link";
import { UMKREISE, UMKREIS_STANDARD } from "@/lib/geo/umkreis";
import OrtFeld from "./OrtFeld";

export const SCHNELLWAHL = ["Florist", "Fotograf", "Elektriker", "Maler", "Steuerberater", "Webdesign"];

const FELD =
  "w-full rounded-xl border-0 bg-white px-4 py-3.5 text-tinte placeholder:text-slate-400 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-sky-300";

/**
 * Die zentrale Suche „Wen sucht dein Kunde?“ – auf der Startseite und
 * auf der Suchseite. Schickt die Eingaben per GET an /dashboard/suche.
 */
export default function SuchKarte({
  suche = "",
  ort = "",
  km = UMKREIS_STANDARD,
  ueberschrift = "Wen sucht dein Kunde?",
}: {
  suche?: string;
  ort?: string;
  km?: number;
  ueberschrift?: string;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-tinte p-5 text-white sm:p-7">
      <Kettenglieder />

      <h2 className="relative text-xl font-semibold tracking-tight sm:text-2xl">{ueberschrift}</h2>
      <p className="relative mt-1 text-sm text-slate-300">
        Finde einen Partner aus dem Netzwerk und empfiehl ihn mit zwei Tipps.
      </p>

      <form action="/dashboard/suche" role="search" className="relative mt-5 space-y-3">
        <label htmlFor="sk-suche" className="sr-only">Gewerk oder Leistung</label>
        <input
          id="sk-suche"
          name="suche"
          type="search"
          defaultValue={suche}
          enterKeyHint="search"
          placeholder="Gewerk, z. B. Florist"
          className={FELD}
        />

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <label htmlFor="sk-ort" className="sr-only">PLZ oder Ort</label>
          <OrtFeld id="sk-ort" name="ort" standard={ort} className={FELD} />

          <label htmlFor="sk-km" className="sr-only">Umkreis</label>
          <select
            id="sk-km"
            name="km"
            defaultValue={String(km)}
            className="rounded-xl border-0 bg-white/10 px-3 py-3.5 font-semibold text-white outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-sky-300"
          >
            {UMKREISE.map((u) => (
              <option key={u} value={u} className="text-tinte">
                {u} km
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-kette px-5 py-3.5 font-semibold text-white shadow-[0_8px_24px_-8px_rgba(36,87,214,0.8)] active:translate-y-px"
        >
          Partner finden
        </button>
      </form>

      <div className="relative mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {SCHNELLWAHL.map((g) => (
          <Link
            key={g}
            href={`/dashboard/suche?suche=${encodeURIComponent(g)}${ort ? `&ort=${encodeURIComponent(ort)}` : ""}&km=${km}`}
            className="shrink-0 rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-medium text-slate-100 ring-1 ring-white/15"
          >
            {g}
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Zwei verschränkte Kettenglieder als Linienzeichnung, Markenzeichen der Karte */
function Kettenglieder() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 200 120"
      className="pointer-events-none absolute -right-10 -top-6 h-40 w-64 rotate-[-28deg] text-messing/40"
      fill="none"
      stroke="currentColor"
      strokeWidth="9"
    >
      <rect x="8" y="30" width="110" height="60" rx="30" />
      <rect x="82" y="30" width="110" height="60" rx="30" className="text-white/10" stroke="currentColor" />
    </svg>
  );
}
