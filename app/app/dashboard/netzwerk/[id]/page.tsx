import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import KontaktFormular from "../KontaktFormular";
import LoeschenKnopf from "./LoeschenKnopf";

export const metadata: Metadata = {
  title: "Kontakt bearbeiten",
};

const UUID_MUSTER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function KontaktBearbeiten(
  props: PageProps<"/dashboard/netzwerk/[id]">,
) {
  const { id } = await props.params;
  if (!UUID_MUSTER.test(id)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: kontakt } = await supabase
    .from("kontakte")
    .select("name, firma, leistung, email, telefon, notiz")
    .eq("id", id)
    .eq("besitzer_id", user.id)
    .maybeSingle();

  if (!kontakt) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/netzwerk"
        className="text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        ← Zurück zu Mein Netzwerk
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        {kontakt.name}
      </h1>
      <p className="mt-3 text-gray-600">Kontaktdaten bearbeiten</p>

      <div className="mt-8">
        <KontaktFormular id={id} anfangswerte={kontakt} />
      </div>

      <div className="mt-10 rounded-xl border border-red-200 bg-white p-6">
        <h2 className="font-bold">Kontakt entfernen</h2>
        <p className="mt-2 text-sm text-gray-600">
          Der Kontakt wird aus deinem Netzwerk gelöscht. Bereits
          ausgesprochene Empfehlungen bleiben erhalten.
        </p>
        <LoeschenKnopf id={id} name={kontakt.name} />
      </div>
    </div>
  );
}
