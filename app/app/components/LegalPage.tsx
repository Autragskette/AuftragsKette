import type { ReactNode } from "react";
import Link from "next/link";
import Footer from "./Footer";

export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6 sm:py-5">
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

      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <div className="mt-8 space-y-6 leading-7 text-gray-700">
          {children}
        </div>
      </section>

      <Footer />
    </main>
  );
}
