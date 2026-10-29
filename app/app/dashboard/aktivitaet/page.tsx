import type { Metadata } from "next";
import NurFuerMitglieder from "@/app/components/NurFuerMitglieder";
import Link from "next/link";
import { aktuellesMitglied } from "@/lib/mitglied";
import { datum } from "@/lib/empfehlung";
import {
  aktivStatus,
  ERINNERUNG_BEITRAG_TAGE,
  ERINNERUNG_LOGIN_TAGE,
  PUNKTE,
  stufe,
  STUFE_AKTIV,
  STUFE_TOP,
  TOP_MIN_AUFTRAEGE,
  TOP_MIN_EMPFEHLUNGEN,
  WARNUNG_BEITRAG_TAGE,
  type Kennzahlen,
} from "@/lib/aktivitaet";
import StufenAbzeichen from "@/app/components/StufenAbzeichen";

export const metadata: Metadata = {
  title: "Meine Aktivität",
};

export default async function MeineAktivitaet() {
  const { supabase, user, istPartner } = await aktuellesMitglied();
  if (istPartner) {
    return (
      <div className="mx-auto max-w-2xl">
        <NurFuerMitglieder
          titel="Punkte sammeln und Top-Mitglied werden"
          text="Mitglieder sammeln Punkte für Empfehlungen, eingeladene Kontakte und die Teilnahme an Treffen. Die Aktivsten werden Top-Mitglied."
        />
      </div>
    );
  }
  const { data, error } = await supabase.rpc("mitglieder_kennzahlen_v3", { p_id: user.id });
  const k = (Array.isArray(data) ? data[0] : data) as Kennzahlen | undefined;

  if (error || !k) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        Deine Aktivität konnte nicht geladen werden. Bitte lade die Seite neu.
      </p>
    );
  }

  const s = stufe(k);
  const status = aktivStatus(k);

  return (
    <div className="max-w-3xl">
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-tinte sm:text-3xl">{k.punkte} Punkte</h1>
        <StufenAbzeichen name={s.name} />
      </div>
      <p className="mt-3 text-gray-600">
        Gezählt werden die letzten 12 Monate. Wer gibt, bekommt: Je mehr du
        empfiehlst und einlädst, desto sichtbarer wirst du im Netzwerk.
      </p>

      {/* Nächste Stufe */}
      <div className="mt-8 rounded-2xl border border-linie bg-white p-6">
        <h2 className="font-bold">
          {s.top ? "Du bist Top-Mitglied ★" : `Dein Weg zum ${s.naechste}`}
        </h2>
        {s.top ? (
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Du gehörst zu den aktivsten Mitgliedern der AuftragsKette und
            wirst in der Rangliste hervorgehoben. Bleib dran, die Stufe wird
            laufend neu berechnet.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-600">Dafür fehlt noch:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-700">
              {s.fehlt.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Aufschlüsselung */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-linie bg-white">
        <h2 className="border-b border-linie px-6 py-4 font-bold">So setzen sich deine Punkte zusammen</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-linie">
            {PUNKTE.map((p) => {
              const anzahl = k[p.feld];
              return (
                <tr key={p.feld}>
                  <td className="px-6 py-3 text-gray-700">
                    {p.aktion}
                    <span className="block text-xs text-gray-400">je {p.punkte} Punkte</span>
                  </td>
                  <td className="px-3 py-3 text-right text-gray-500">{anzahl}×</td>
                  <td className="px-6 py-3 text-right font-semibold">{anzahl * p.punkte}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-linie bg-gray-50">
              <td className="px-6 py-3 font-bold" colSpan={2}>Gesamt</td>
              <td className="px-6 py-3 text-right font-bold">{k.punkte}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Geben und Nehmen */}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-linie bg-white p-6">
          <p className="text-sm font-medium text-gray-500">Empfehlungen gegeben</p>
          <p className="mt-2 text-3xl font-bold">{k.empfehlungen_gegeben}</p>
        </div>
        <div className="rounded-2xl border border-linie bg-white p-6">
          <p className="text-sm font-medium text-gray-500">Du selbst wurdest empfohlen</p>
          <p className="mt-2 text-3xl font-bold">{k.empfehlungen_erhalten}</p>
          <p className="mt-1 text-xs text-gray-400">wenn dich jemand als Partner eingetragen hat</p>
        </div>
      </div>

      {/* Mitgliedschaft */}
      <div className="mt-6 rounded-2xl border border-linie bg-white p-6">
        <h2 className="font-bold">Deine Mitgliedschaft</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <dt className="text-gray-500">Mitglied seit</dt>
          <dd>{datum(k.mitglied_seit)}</dd>
          <dt className="text-gray-500">Zuletzt in der App</dt>
          <dd>{status.tageSeitLogin === 0 ? "heute" : `vor ${status.tageSeitLogin} Tagen`}</dd>
          <dt className="text-gray-500">Letzter Beitrag</dt>
          <dd>{k.letzter_beitrag ? datum(k.letzter_beitrag) : "noch keiner"}</dd>
          <dt className="text-gray-500">Nächste Verlängerung</dt>
          <dd className={status.verlaengerungGesichert ? "text-green-700" : "text-amber-700"}>
            {datum(status.verlaengerungAm.toISOString())}:{" "}
            {status.verlaengerungGesichert ? "gesichert ✓" : "noch nicht gesichert"}
          </dd>
        </dl>
      </div>

      {/* Regeln */}
      <div className="mt-6 rounded-xl bg-gray-100 p-6 text-sm leading-6 text-gray-700">
        <h2 className="font-bold text-gray-900">Die Regeln</h2>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li><strong>Aktives Mitglied</strong> ab {STUFE_AKTIV} Punkten.</li>
          <li>
            <strong>Top-Mitglied ★</strong> ab {STUFE_TOP} Punkten, mindestens{" "}
            {TOP_MIN_EMPFEHLUNGEN} gegebenen Empfehlungen, {TOP_MIN_AUFTRAEGE} Auftrag
            daraus und Aktivität in den letzten 30 Tagen.
          </li>
          <li>
            Nach {ERINNERUNG_LOGIN_TAGE} Tagen ohne Besuch oder{" "}
            {ERINNERUNG_BEITRAG_TAGE} Tagen ohne Beitrag (Empfehlung, Kontakt
            oder Teilnahme an einer Veranstaltung) bekommst du eine Erinnerung.
          </li>
          <li>
            Nach {WARNUNG_BEITRAG_TAGE} Tagen ohne Beitrag ist die Verlängerung gefährdet.
          </li>
          <li>
            Die Mitgliedschaft verlängert sich jährlich nur, wenn du zum
            Stichtag Aktives Mitglied bist und in den letzten{" "}
            {WARNUNG_BEITRAG_TAGE} Tagen etwas beigetragen hast. So bleibt die
            Community aktiv.
          </li>
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/suche" className="rounded-xl bg-tinte px-5 py-3 text-sm font-semibold text-white">
          Jemanden empfehlen
        </Link>
        <Link href="/dashboard/netzwerk/neu" className="rounded-xl border border-linie bg-white px-5 py-3 text-sm font-semibold">
          Kontakt einladen
        </Link>
        <Link href="/dashboard/veranstaltungen" className="rounded-xl border border-linie bg-white px-5 py-3 text-sm font-semibold">
          Zu den Veranstaltungen
        </Link>
      </div>
    </div>
  );
}
