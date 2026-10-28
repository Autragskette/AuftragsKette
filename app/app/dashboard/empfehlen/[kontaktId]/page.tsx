import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { aktuellesMitglied } from "@/lib/mitglied";
import EmpfehlungFormular from "./EmpfehlungFormular";

export const metadata: Metadata = {
  title: "An Kunden empfehlen",
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

  const { supabase } = await aktuellesMitglied();
  const { data } = await supabase.rpc("netzwerk_kontakt", { p_id: kontaktId });
  const partner = (Array.isArray(data) ? data[0] : data) as Partner | undefined;
  if (!partner) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/suche" className="text-sm font-medium text-gray-600 hover:text-gray-900">
        ← Zurück zur Suche
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">An Kunden empfehlen</h1>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5">
        <p className="font-bold">{partner.name}</p>
        {partner.firma && <p className="text-sm text-gray-600">{partner.firma}</p>}
        <p className="mt-2 text-sm text-gray-800">{partner.leistung}</p>
        <p className="mt-1 text-sm text-gray-600">{`${partner.plz} ${partner.ort}`.trim()}</p>
        {!partner.eigener && (
          <p className="mt-2 text-xs text-gray-500">
            Im Netzwerk empfohlen von {partner.empfohlen_von || "einem Mitglied"}
          </p>
        )}
      </div>

      <p className="mt-6 text-gray-600">
        Für wen ist die Empfehlung? Im nächsten Schritt schickst du sie per
        WhatsApp, E-Mail oder als digitale Visitenkarte.
      </p>

      <div className="mt-4">
        <EmpfehlungFormular kontaktId={partner.id} />
      </div>
    </div>
  );
}
