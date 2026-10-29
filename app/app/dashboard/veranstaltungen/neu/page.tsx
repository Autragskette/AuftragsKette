import type { Metadata } from "next";
import Link from "next/link";
import { aktuellesMitglied } from "@/lib/mitglied";
import Formular from "./Formular";

export const metadata: Metadata = {
  title: "Veranstaltung anlegen",
};

export default async function NeueVeranstaltung() {
  const { supabase } = await aktuellesMitglied();
  const { data: istAdmin } = await supabase.rpc("ist_admin");

  return (
    <div className="max-w-2xl">
      <Link href="/dashboard/veranstaltungen" className="text-sm font-medium text-gray-600 hover:text-gray-900">
        ← Zurück zu Veranstaltungen
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Veranstaltung anlegen</h1>

      <div className="mt-8">
        {istAdmin === true ? (
          <Formular />
        ) : (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Veranstaltungen legen aktuell nur Admins an. Hast du eine Idee für
            ein Treffen? Sprich uns gern an.
          </p>
        )}
      </div>
    </div>
  );
}
