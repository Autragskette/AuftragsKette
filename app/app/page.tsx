import Link from "next/link";
import Footer from "./components/Footer";
import Logo from "./components/Logo";
import { KENNENLERN_MONATE, TARIFE } from "@/lib/preise";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-tinte">
      {/* Navigation */}
      <header className="pt-safe sticky top-0 z-30 border-b border-linie bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6 sm:py-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-tinte sm:text-xl">
            <Logo />
            AuftragsKette
          </Link>

          <nav className="flex items-center gap-7 text-sm font-medium">
            <a
              href="#netzwerk"
              className="hidden hover:text-kette sm:inline"
            >
              Netzwerk
            </a>

            <a
              href="#mitgliedschaft"
              className="hidden hover:text-kette sm:inline"
            >
              Mitgliedschaft
            </a>

            <Link
              href="/anmelden"
              className="rounded-xl bg-tinte px-5 py-2.5 text-white"
            >
              Anmelden
            </Link>
          </nav>
        </div>
      </header>

      {/* Startbereich */}
      <section className="relative overflow-hidden bg-tinte text-white">
        <svg
          aria-hidden
          viewBox="0 0 200 120"
          className="pointer-events-none absolute -right-24 top-6 h-72 w-[30rem] rotate-[-28deg] text-messing/35 sm:-right-10 sm:top-10"
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
        >
          <rect x="8" y="30" width="110" height="60" rx="30" />
          <rect x="82" y="30" width="110" height="60" rx="30" className="text-white/10" stroke="currentColor" />
        </svg>

        <div className="relative mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-28">
          <h1 className="max-w-3xl text-[2.1rem] font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            Das Unternehmernetzwerk, aus dem Aufträge entstehen.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300 sm:mt-8">
            Ein geschlossener Kreis aus Unternehmern und Selbstständigen, die
            sich in Online-Meetings und auf Branchentreffen kennenlernen. Weil
            man sich kennt, empfiehlt man sich an Kunden weiter, und aus
            echten Beziehungen werden Aufträge.
          </p>

          <div className="mt-9 grid gap-3 sm:flex sm:gap-4">
            <Link
              href="/anmelden"
              className="rounded-xl bg-white px-6 py-3.5 text-center font-semibold text-tinte"
            >
              Anmelden
            </Link>
            <a
              href="#mitgliedschaft"
              className="rounded-xl px-6 py-3.5 text-center font-semibold text-white ring-1 ring-white/25"
            >
              Mitglied werden
            </a>
          </div>
        </div>
      </section>

      {/* Unternehmernetzwerk */}
      <section id="netzwerk" className="border-t border-linie bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-14 sm:py-24">

          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Ein Netzwerk, in dem Unternehmer zusammenwachsen.
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Bei AuftragsKette geht es nicht nur ums Geschäft. Hier triffst du
            Menschen, die vor den gleichen Herausforderungen stehen wie du,
            und baust Beziehungen auf, die über einzelne Aufträge hinaus
            tragen.
          </p>

          <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                titel: "Online-Meetings",
                text: "Regelmäßige virtuelle Treffen zum Netzwerken, Kennenlernen und Austauschen, bequem vom Büro oder unterwegs.",
              },
              {
                titel: "Branchentreffen",
                text: "Persönliche Treffen in deiner Region und branchenübergreifend, bei denen aus Kontakten echte Beziehungen werden.",
              },
              {
                titel: "Erfahrungsaustausch",
                text: "Von anderen Unternehmern lernen: Tipps, Kontakte und ehrliche Einschätzungen aus der Praxis.",
              },
              {
                titel: "Empfehlungen & Aufträge",
                text: "Der Mehrwert obendrauf: Mitglieder empfehlen sich gegenseitig an Kunden, ganz ohne Provision.",
              },
            ].map((punkt) => (
              <div key={punkt.titel} className="rounded-xl border border-linie bg-gray-50 p-7">
                <h3 className="text-lg font-bold">{punkt.titel}</h3>
                <p className="mt-3 leading-7 text-slate-600">{punkt.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* So funktioniert AuftragsKette */}
      <section
        id="so-funktionierts"
        className="border-t border-linie bg-gray-50"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-14 sm:py-24">

          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Empfehlungen entstehen durch Vertrauen.
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            AuftragsKette verbindet Menschen, die sich persönlich kennen
            und die fachliche Qualität ihrer Kontakte einschätzen können.
            So entsteht Schritt für Schritt ein belastbares
            Empfehlungsnetzwerk.
          </p>

          <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-linie bg-white p-7">
              <div className="mb-5 text-sm font-bold text-kette">
                01
              </div>
              <h3 className="text-xl font-bold">
                Persönlich verbunden
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Mitglieder bauen ihr Netzwerk mit Geschäftskontakten auf,
                die sie persönlich kennen und fachlich einschätzen können.
              </p>
            </div>

            <div className="rounded-2xl border border-linie bg-white p-7">
              <div className="mb-5 text-sm font-bold text-kette">
                02
              </div>
              <h3 className="text-xl font-bold">
                Gezielt empfehlen
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Wird eine passende Leistung gesucht, kann ein geeigneter
                Kontakt persönlich weiterempfohlen werden.
              </p>
            </div>

            <div className="rounded-2xl border border-linie bg-white p-7">
              <div className="mb-5 text-sm font-bold text-kette">
                03
              </div>
              <h3 className="text-xl font-bold">
                Aufträge ermöglichen
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Aus vertrauensvollen Empfehlungen entstehen neue
                Geschäftskontakte und konkrete Auftragschancen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mitgliedschaft */}
      <section id="mitgliedschaft" className="bg-white">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 py-14 sm:py-24">
          <div className="grid items-start gap-12 md:grid-cols-2">
            
            <div>

              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Ein Netzwerk, das von echten Beziehungen lebt.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                AuftragsKette ist kein öffentliches Kontaktverzeichnis.
                Mitglieder werden persönlich empfohlen oder eingeladen
                und bringen Geschäftskontakte ein, deren Arbeit sie
                tatsächlich einschätzen können.
              </p>
            </div>

            <div className="rounded-2xl border border-linie p-6 shadow-sm sm:p-8">
              <p className="text-sm font-semibold text-kette">
                AuftragsKette Mitgliedschaft
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {TARIFE.map((t) => (
                  <div key={t.name} className="rounded-xl bg-papier p-4">
                    <p className="text-sm font-semibold text-gray-700">{t.name}</p>
                    <p className="mt-1 flex items-end gap-1">
                      <span className="text-3xl font-bold sm:text-4xl">{t.preis} €</span>
                      <span className="pb-1 text-sm text-gray-500">/ Monat</span>
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">{t.laufzeit}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Alle Preise netto zzgl. MwSt. Empfohlene Partner testen die
                ersten Empfehlungen bzw. die ersten {KENNENLERN_MONATE} Monate kostenlos.
              </p>

              <div className="mt-8 space-y-4 text-gray-700">
                <p>✓ Zugang zum geschlossenen Unternehmernetzwerk</p>
                <p>✓ Online-Meetings zum Netzwerken</p>
                <p>✓ Branchentreffen und Veranstaltungen für Mitglieder</p>
                <p>✓ Persönliche Empfehlungen an Kunden und neue Aufträge</p>
                <p>✓ Eigenes Mitglieder- und Unternehmensprofil</p>
                <p>✓ Keine Empfehlungsprovision</p>
              </div>

              <div className="mt-8 border-t border-linie pt-6">
                <p className="font-semibold">
                  Voraussetzung für die Aufnahme
                </p>

                <p className="mt-2 leading-7 text-slate-600">
                  Die Aufnahme erfolgt über persönliche Empfehlung oder
                  Einladung. Mitglieder benennen mindestens drei
                  persönlich bekannte und fachlich einschätzbare
                  Geschäftskontakte oder bauen diese innerhalb der
                  vorgesehenen Anfangsfrist auf.
                </p>
              </div>

              <Link
                href="/anmelden"
                className="mt-8 block rounded-xl bg-tinte px-6 py-3 text-center font-semibold text-white"
              >
                Zugang zur AuftragsKette
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
