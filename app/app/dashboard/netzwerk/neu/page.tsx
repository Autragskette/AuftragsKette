import type { Metadata } from "next";
import Link from "next/link";
import KontaktFormular from "../KontaktFormular";

export const metadata: Metadata = {
  title: "Kontakt hinzufügen",
};

export default function NeuerKontakt() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/netzwerk"
        className="text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        ← Zurück zu Mein Netzwerk
      </Link>

      <h1 className="mt-4 text-3xl font-bold tracking-tight">
        Kontakt hinzufügen
      </h1>
      <p className="mt-3 text-gray-600">
        Trage einen Geschäftskontakt ein, den du persönlich kennst und
        dessen Arbeit du einschätzen kannst.
      </p>

      <div className="mt-8">
        <KontaktFormular />
      </div>
    </div>
  );
}
