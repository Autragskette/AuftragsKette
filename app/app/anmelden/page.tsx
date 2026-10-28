import Link from "next/link";
import type { Metadata } from "next";
import Footer from "../components/Footer";
import AnmeldeFormular from "./AnmeldeFormular";

export const metadata: Metadata = {
  title: "Anmelden",
};

export default function Anmelden() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Kopfbereich */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold text-blue-600">
            AuftragsKette
          </Link>

          <Link
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Zurück zur Startseite
          </Link>
        </div>
      </header>

      {/* Anmeldung */}
      <section className="mx-auto flex max-w-6xl justify-center px-6 py-20">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <p className="font-semibold text-blue-600">
            Mitgliederbereich
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            Willkommen zurück
          </h1>

          <p className="mt-3 leading-7 text-gray-600">
            Melde dich mit deinen Zugangsdaten bei AuftragsKette an.
          </p>

          <AnmeldeFormular />

          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-sm leading-6 text-gray-600">
              Noch kein Zugang? Die Aufnahme in die AuftragsKette
              erfolgt ausschließlich über persönliche Empfehlung oder
              Einladung.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
