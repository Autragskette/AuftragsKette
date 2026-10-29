import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseEingerichtet } from "@/lib/supabase/config";
import VisitenkarteAnsicht from "@/app/components/VisitenkarteAnsicht";

export const metadata: Metadata = {
  title: "Vorschau deiner Visitenkarte",
  robots: { index: false },
};

const UUID_MUSTER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Vorschau = {
  name: string;
  firma: string;
  leistung: string;
  telefon: string;
  email: string;
  plz: string;
  ort: string;
  status: "eingeladen" | "bestaetigt" | "abgelehnt";
  empfohlen_von: string;
  empfohlen_von_firma: string;
};

export default async function VorschauSeite(
  props: PageProps<"/bestaetigen/[token]/vorschau">,
) {
  const { token } = await props.params;
  if (!UUID_MUSTER.test(token) || !supabaseEingerichtet()) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("einladung_vorschau", { p_token: token });
  const v: Vorschau | null = (Array.isArray(data) ? data[0] : data) ?? null;
  if (!v) notFound();

  return (
    <main className="pt-safe pb-safe flex min-h-screen flex-col items-center bg-gray-50 px-4 py-6 text-gray-900 sm:px-6 sm:py-10">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-kette/30 bg-white p-4 text-sm leading-6 text-slate-700">
          <p className="font-semibold text-tinte">Vorschau: So sehen dich Kunden</p>
          <p className="mt-1">
            Empfiehlt dich ein Mitglied, bekommt der Kunde per WhatsApp oder
            E-Mail einen Link zu dieser Visitenkarte. Mehr sieht der Kunde
            nicht. Er ruft dich direkt an oder schreibt dir.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Für Familie Muster, empfohlen von{" "}
          <strong className="text-gray-700">
            {v.empfohlen_von}
            {v.empfohlen_von_firma ? `, ${v.empfohlen_von_firma}` : ""}
          </strong>
        </p>

        <VisitenkarteAnsicht k={v} />

        <div className="mt-6 rounded-xl border border-linie bg-white p-4 text-sm leading-6 text-slate-700">
          <p className="font-semibold text-gray-900">Stimmt etwas nicht?</p>
          <p className="mt-1">
            Die Angaben hat {v.empfohlen_von} eingetragen. Gib einfach kurz
            Bescheid, wenn etwas geändert werden soll.
          </p>
        </div>

        <Link
          href={`/bestaetigen/${token}`}
          className="mt-6 block rounded-xl bg-tinte px-6 py-3 text-center font-semibold text-white"
        >
          {v.status === "eingeladen" ? "Zurück zur Zustimmung" : "Zurück"}
        </Link>
        <Link
          href="/"
          className="mt-3 block text-center text-sm font-medium text-slate-600 underline"
        >
          Mehr über AuftragsKette erfahren
        </Link>
      </div>
    </main>
  );
}
