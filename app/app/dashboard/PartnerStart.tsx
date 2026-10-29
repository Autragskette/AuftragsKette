import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profil } from "@/lib/mitglied";
import { datum } from "@/lib/empfehlung";
import { ARTEN, zeitraum, type Veranstaltung } from "@/lib/veranstaltungen";
import { KENNENLERN_EMPFEHLUNGEN } from "@/lib/preise";
import PushSchalter from "@/app/components/PushSchalter";
import AppInstallieren from "@/app/components/AppInstallieren";
import NurFuerMitglieder from "@/app/components/NurFuerMitglieder";

type Stand = {
  gelistet: boolean;
  empfehlungen: number;
  frei_bis: string | null;
  pausiert: boolean;
  leistung: string;
};

/** Startseite im Schnupperzugang (Partner) */
export default async function PartnerStart({
  supabase,
  profil,
}: {
  supabase: SupabaseClient;
  profil: Profil;
}) {
  const [standAntwort, erhaltenAntwort, termineAntwort, netzAntwort] = await Promise.all([
    supabase.rpc("mein_partner_stand"),
    supabase.rpc("meine_erhaltenen_empfehlungen"),
    supabase
      .from("veranstaltungen")
      .select("id, titel, art, branche, region, beginn, ende")
      .gte("ende", new Date().toISOString())
      .order("beginn", { ascending: true })
      .limit(3),
    supabase.rpc("netzwerk_vorschau", { p_suche: "" }),
  ]);

  const stand = ((Array.isArray(standAntwort.data) ? standAntwort.data[0] : standAntwort.data) ?? null) as Stand | null;
  const erhalten = (erhaltenAntwort.data ?? []) as { erstellt_am: string; von: string }[];
  const termine = (termineAntwort.data ?? []) as Pick<
    Veranstaltung,
    "id" | "titel" | "art" | "branche" | "region" | "beginn" | "ende"
  >[];
  const betriebe = (netzAntwort.data ?? []).length;
  const rest = Math.max(0, KENNENLERN_EMPFEHLUNGEN - (stand?.empfehlungen ?? 0));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-tinte">
        {profil.vorname ? `Hallo ${profil.vorname}` : "Willkommen"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">Dein Zugang zur AuftragsKette</p>

      {/* Stand der Testphase */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-tinte text-white">
        <div className="p-5 sm:p-6">
          {!stand?.gelistet ? (
            <>
              <p className="font-semibold">Schau dich in Ruhe um</p>
              <p className="mt-1 text-sm leading-6 text-blue-100">
                Hier siehst du, wie die AuftragsKette funktioniert. Empfehlen,
                Kontakte einbringen und an Treffen teilnehmen können Mitglieder.
              </p>
            </>
          ) : stand.pausiert ? (
            <>
              <p className="font-semibold">Deine kostenlose Testphase ist beendet</p>
              <p className="mt-1 text-sm leading-6 text-blue-100">
                Dein Eintrag bleibt erhalten, ist aber pausiert. Sobald du
                Mitglied wirst, bist du wieder sichtbar und kannst empfohlen werden.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-blue-200">Kostenlose Testphase</p>
              <p className="mt-1 text-lg font-semibold">
                Du bist als {stand.leistung || "Partner"} gelistet und kannst empfohlen werden.
              </p>
              <p className="mt-2 text-sm leading-6 text-blue-100">
                Noch {rest} {rest === 1 ? "Empfehlung" : "Empfehlungen"} kostenlos
                {stand.frei_bis && <>, längstens bis {datum(stand.frei_bis)}</>}.
              </p>
            </>
          )}
        </div>
        <Link
          href="/dashboard/mitglied-werden"
          className="block border-t border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold sm:px-6"
        >
          Mitglied werden →
        </Link>
      </div>

      {/* Erhaltene Empfehlungen */}
      <section className="mt-7">
        <h2 className="mb-2.5 px-1 text-sm font-semibold text-slate-500">Deine Empfehlungen</h2>
        {erhalten.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm leading-6 text-slate-600">
            Noch keine. Sobald dich ein Mitglied an einen Kunden empfiehlt,
            siehst du es hier.
          </p>
        ) : (
          <ul className="divide-y divide-linie overflow-hidden rounded-2xl border border-linie bg-white">
            {erhalten.map((e, i) => (
              <li key={i} className="px-4 py-3.5">
                <span className="block font-medium text-tinte">Empfohlen von {e.von}</span>
                <span className="block text-sm text-slate-500">am {datum(e.erstellt_am)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-4">
        <PushSchalter />
      </div>

      {/* Das Netzwerk */}
      <section className="mt-7">
        <h2 className="mb-2.5 px-1 text-sm font-semibold text-slate-500">Das Netzwerk</h2>
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-linie bg-white text-center">
          <Link href="/dashboard/suche" className="px-2 py-4">
            <span className="block text-2xl font-semibold tabular-nums text-tinte">{betriebe}</span>
            <span className="block text-xs text-slate-500">empfohlene Betriebe</span>
          </Link>
          <Link href="/dashboard/veranstaltungen" className="border-l border-linie px-2 py-4">
            <span className="block text-2xl font-semibold tabular-nums text-tinte">{termine.length}</span>
            <span className="block text-xs text-slate-500">anstehende Termine</span>
          </Link>
        </div>
      </section>

      {termine.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-2.5 px-1 text-sm font-semibold text-slate-500">Nächste Termine</h2>
          <ul className="space-y-2">
            {termine.map((t) => (
              <li key={t.id}>
                <Link href={`/dashboard/veranstaltungen#v-${t.id}`} className="block rounded-2xl border border-linie bg-white px-5 py-4">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ARTEN[t.art].stil}`}>
                    {ARTEN[t.art].name}
                  </span>
                  <span className="mt-2 block font-semibold text-tinte">{t.titel}</span>
                  <span className="mt-0.5 block text-sm text-slate-500">{zeitraum(t.beginn, t.ende)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-7">
        <NurFuerMitglieder
          kompakt
          titel="Selbst empfehlen und Aufträge weitergeben"
          text="Als Mitglied findest du Betriebe aus deiner Region und empfiehlst sie deinen Kunden mit zwei Tipps. So empfehlen dich auch andere weiter."
        />
      </div>

      <div className="mt-4">
        <AppInstallieren />
      </div>
    </div>
  );
}
