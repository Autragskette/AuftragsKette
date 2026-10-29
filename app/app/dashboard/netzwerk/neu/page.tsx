import type { Metadata } from "next";
import Link from "next/link";
import KontaktFormular from "../KontaktFormular";
import { aktuellesMitglied } from "@/lib/mitglied";
import NurFuerMitglieder from "@/app/components/NurFuerMitglieder";

export const metadata: Metadata = {
  title: "Kontakt einladen",
};

const UUID_MUSTER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function NeuerKontakt(props: PageProps<"/dashboard/netzwerk/neu">) {
  const { von } = await props.searchParams;
  const { supabase, istPartner } = await aktuellesMitglied();
  if (istPartner) {
    return (
      <div className="mx-auto max-w-2xl">
        <NurFuerMitglieder
          titel="Kontakte einladen"
          text="Als Mitglied lädst du Betriebe ein, deren Arbeit du kennst. Sie werden gefragt, ob sie zustimmen, und können dann von allen Mitgliedern empfohlen werden."
        />
      </div>
    );
  }

  // Aus der Suche: Betrieb aus dem Netzwerk in das eigene Netzwerk aufnehmen
  type Vorlage = { name: string; firma: string; leistung: string; email: string; telefon: string; plz: string; ort: string };
  let vorlage: Vorlage | null = null;
  if (typeof von === "string" && UUID_MUSTER.test(von)) {
    const { data } = await supabase.rpc("netzwerk_kontakt", { p_id: von });
    vorlage = ((Array.isArray(data) ? data[0] : data) as Vorlage | undefined) ?? null;
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/netzwerk"
        className="text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        ← Zurück zu Mein Netzwerk
      </Link>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-tinte sm:text-3xl">
        Kontakt einladen
      </h1>
      <p className="mt-3 text-gray-600">
        {vorlage
          ? `Nimm ${vorlage.name} in dein Netzwerk auf. ${vorlage.name.split(" ")[0]} bekommt eine Einladung und bestätigt selbst.`
          : "Lade einen Geschäftskontakt ein, dessen Arbeit du kennst und den du deinen Kunden guten Gewissens empfehlen würdest."}
      </p>

      <div className="mt-8">
        <KontaktFormular
          herkunft={vorlage ? "netzwerk" : "persoenlich"}
          anfangswerte={
            vorlage
              ? {
                  name: vorlage.name,
                  firma: vorlage.firma,
                  leistung: vorlage.leistung,
                  email: vorlage.email,
                  telefon: vorlage.telefon,
                  plz: vorlage.plz,
                  ort: vorlage.ort,
                  notiz: "",
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
