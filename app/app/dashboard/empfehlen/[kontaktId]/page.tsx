import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { aktuellesMitglied } from "@/lib/mitglied";
import ProfilFehlt from "@/app/components/ProfilFehlt";
import EmpfehlungFormular from "./EmpfehlungFormular";

export const metadata: Metadata = {
  title: "Empfehlen",
};

const UUID_MUSTER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Partner = {
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

export default async function Empfehlen(props: PageProps<"/dashboard/empfehlen/[kontaktId]">) {
  const { kontaktId } = await props.params;
  if (!UUID_MUSTER.test(kontaktId)) notFound();

  const { supabase, profilVollstaendig } = await aktuellesMitglied();
  const { data } = await supabase.rpc("netzwerk_kontakt", { p_id: kontaktId });
  const partner = (Array.isArray(data) ? data[0] : data) as Partner | undefined;
  if (!partner) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/dashboard/suche" className="text-sm font-medium text-slate-500">
        Zurück zur Suche
      </Link>

      <div className="mt-4 rounded-2xl bg-tinte p-5 text-white">
        <p className="text-sm text-slate-300">Du empfiehlst</p>
        <p className="mt-1 text-xl font-semibold">{partner.firma || partner.name}</p>
        <p className="mt-0.5 text-slate-200">
          {partner.leistung}
          {partner.firma && <span className="text-slate-400">, {partner.name}</span>}
        </p>
        <p className="mt-3 text-sm text-slate-300">
          {`${partner.plz} ${partner.ort}`.trim()}
          {partner.telefon && <span className="block">{partner.telefon}</span>}
        </p>
      </div>

      <div className="mt-5">
        {profilVollstaendig ? (
          <EmpfehlungFormular kontaktId={partner.id} />
        ) : (
          <ProfilFehlt zurueck={`/dashboard/empfehlen/${partner.id}`} was="der Empfehlung" />
        )}
      </div>
    </div>
  );
}
