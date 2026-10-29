import type { Metadata } from "next";
import Link from "next/link";
import KontaktFormular from "../KontaktFormular";
import { aktuellesMitglied } from "@/lib/mitglied";
import NurFuerMitglieder from "@/app/components/NurFuerMitglieder";

export const metadata: Metadata = {
  title: "Kontakt einladen",
};

export default async function NeuerKontakt(props: PageProps<"/dashboard/netzwerk/neu">) {
  const { von } = await props.searchParams;
  const { istPartner } = await aktuellesMitglied();
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
        Lade einen Geschäftskontakt ein, dessen Arbeit du kennst und den du
        deinen Kunden guten Gewissens empfehlen würdest.
      </p>

      <div className="mt-8">
        <KontaktFormular herkunft={von === "netzwerk" ? "netzwerk" : "persoenlich"} />
      </div>
    </div>
  );
}
