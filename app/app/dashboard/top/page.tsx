import type { Metadata } from "next";
import { aktuellesMitglied } from "@/lib/mitglied";
import { stufe, type Kennzahlen } from "@/lib/aktivitaet";
import StufenAbzeichen from "@/app/components/StufenAbzeichen";

export const metadata: Metadata = {
  title: "Top im Netzwerk",
};

type Partner = {
  id: string;
  name: string;
  firma: string;
  leistung: string;
  ort: string;
  empfehlungen: number;
  auftraege: number;
};

export default async function TopImNetzwerk() {
  const { supabase, user } = await aktuellesMitglied();

  const [mitgliederAntwort, partnerAntwort] = await Promise.all([
    supabase.rpc("mitglieder_kennzahlen_v2", { p_id: null }),
    supabase.rpc("top_partner", { p_limit: 10 }),
  ]);

  const mitglieder = ((mitgliederAntwort.data ?? []) as Kennzahlen[])
    .filter((m) => m.name)
    .sort((a, b) => b.punkte - a.punkte || b.auftraege - a.auftraege)
    .slice(0, 20);
  const partner = (partnerAntwort.data ?? []) as Partner[];

  return (
    <>
      <p className="font-semibold text-blue-600">Top im Netzwerk</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Wer ist voll dabei?</h1>
      <p className="mt-3 max-w-2xl text-gray-600">
        Die aktivsten Mitglieder und die meistempfohlenen Partner der letzten
        12 Monate. Top-Mitglieder sind mit ★ gekennzeichnet.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Mitglieder */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <h2 className="border-b border-gray-200 px-5 py-4 font-bold">Aktivste Mitglieder</h2>
          {mitglieder.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">Noch keine Aktivität.</p>
          ) : (
            <ol className="divide-y divide-gray-100">
              {mitglieder.map((m, i) => {
                const s = stufe(m);
                const ich = m.id === user.id;
                return (
                  <li key={m.id} className={`flex items-center gap-4 px-5 py-4 ${ich ? "bg-blue-50" : ""}`}>
                    <span className="w-6 shrink-0 text-center font-bold text-gray-400">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {m.name}
                        {ich && <span className="font-normal text-gray-500"> (du)</span>}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {[m.firma || m.branche, m.ort].filter(Boolean).join(" · ")}
                      </p>
                      <div className="mt-1.5">
                        <StufenAbzeichen name={s.name} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-bold">{m.punkte}</p>
                      <p className="text-xs text-gray-500">
                        {m.empfehlungen_gegeben} Empf. · {m.auftraege} Auftr.
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Partner */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <h2 className="border-b border-gray-200 px-5 py-4 font-bold">Meistempfohlene Partner</h2>
          {partner.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">Noch keine Empfehlungen.</p>
          ) : (
            <ol className="divide-y divide-gray-100">
              {partner.map((p, i) => (
                <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="w-6 shrink-0 text-center font-bold text-gray-400">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="truncate text-sm text-gray-500">
                      {[p.firma, p.leistung, p.ort].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold">{p.empfehlungen}×</p>
                    <p className="text-xs text-gray-500">{p.auftraege} Aufträge</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}
