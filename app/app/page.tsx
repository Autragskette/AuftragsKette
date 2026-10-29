import Link from "next/link";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold text-blue-600">
            AuftragsKette
          </Link>

          <nav className="flex items-center gap-7 text-sm font-medium">
            <a
              href="#netzwerk"
              className="hidden hover:text-blue-600 sm:inline"
            >
              Netzwerk
            </a>

            <a
              href="#mitgliedschaft"
              className="hidden hover:text-blue-600 sm:inline"
            >
              Mitgliedschaft
            </a>

            <Link
              href="/anmelden"
              className="rounded-lg bg-gray-900 px-5 py-2.5 text-white"
            >
              Anmelden
            </Link>
          </nav>
        </div>
      </header>

      {/* Startbereich */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="mb-4 text-lg font-semibold text-blue-600">
          AuftragsKette
        </p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Das Unternehmernetzwerk,
          <br />
          aus dem Aufträge entstehen.
        </h1>

        <p className="mt-8 max-w-2xl text-xl leading-8 text-gray-600">
          AuftragsKette ist in erster Linie ein großes, geschlossenes
          Netzwerk für Unternehmer und Selbstständige: Wir vernetzen uns in
          Online-Meetings und auf Branchentreffen, tauschen Erfahrungen aus
          und lernen voneinander.
        </p>

        <p className="mt-4 max-w-2xl text-xl leading-8 text-gray-600">
          Der besondere Mehrwert: Weil sich unsere Mitglieder persönlich
          kennen, empfehlen sie sich gegenseitig an ihre Kunden weiter. So
          entstehen aus echten Beziehungen neue Aufträge.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <a
            href="#netzwerk"
            className="rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white"
          >
            Was dich erwartet
          </a>

          <a
            href="#mitgliedschaft"
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold"
          >
            Mitglied werden
          </a>
        </div>
      </section>

      {/* Unternehmernetzwerk */}
      <section id="netzwerk" className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="mb-3 font-semibold text-blue-600">
            Mehr als Aufträge
          </p>

          <h2 className="max-w-2xl text-4xl font-bold tracking-tight">
            Ein Netzwerk, in dem Unternehmer zusammenwachsen.
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Bei AuftragsKette geht es nicht nur ums Geschäft. Hier triffst du
            Menschen, die vor den gleichen Herausforderungen stehen wie du,
            und baust Beziehungen auf, die über einzelne Aufträge hinaus
            tragen.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
              <div key={punkt.titel} className="rounded-xl border border-gray-200 bg-gray-50 p-7">
                <h3 className="text-lg font-bold">{punkt.titel}</h3>
                <p className="mt-3 leading-7 text-gray-600">{punkt.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* So funktioniert AuftragsKette */}
      <section
        id="so-funktionierts"
        className="border-t border-gray-100 bg-gray-50"
      >
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className="mb-3 font-semibold text-blue-600">
            So entstehen Aufträge
          </p>

          <h2 className="max-w-2xl text-4xl font-bold tracking-tight">
            Empfehlungen entstehen durch Vertrauen.
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            AuftragsKette verbindet Menschen, die sich persönlich kennen
            und die fachliche Qualität ihrer Kontakte einschätzen können.
            So entsteht Schritt für Schritt ein belastbares
            Empfehlungsnetzwerk.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-7">
              <div className="mb-5 text-sm font-bold text-blue-600">
                01
              </div>
              <h3 className="text-xl font-bold">
                Persönlich verbunden
              </h3>
              <p className="mt-3 leading-7 text-gray-600">
                Mitglieder bauen ihr Netzwerk mit Geschäftskontakten auf,
                die sie persönlich kennen und fachlich einschätzen können.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-7">
              <div className="mb-5 text-sm font-bold text-blue-600">
                02
              </div>
              <h3 className="text-xl font-bold">
                Gezielt empfehlen
              </h3>
              <p className="mt-3 leading-7 text-gray-600">
                Wird eine passende Leistung gesucht, kann ein geeigneter
                Kontakt persönlich weiterempfohlen werden.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-7">
              <div className="mb-5 text-sm font-bold text-blue-600">
                03
              </div>
              <h3 className="text-xl font-bold">
                Aufträge ermöglichen
              </h3>
              <p className="mt-3 leading-7 text-gray-600">
                Aus vertrauensvollen Empfehlungen entstehen neue
                Geschäftskontakte und konkrete Auftragschancen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mitgliedschaft */}
      <section id="mitgliedschaft" className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid items-start gap-12 md:grid-cols-2">
            
            <div>
              <p className="mb-3 font-semibold text-blue-600">
                Mitgliedschaft
              </p>

              <h2 className="text-4xl font-bold tracking-tight">
                Ein Netzwerk, das von echten Beziehungen lebt.
              </h2>

              <p className="mt-6 text-lg leading-8 text-gray-600">
                AuftragsKette ist kein öffentliches Kontaktverzeichnis.
                Mitglieder werden persönlich empfohlen oder eingeladen
                und bringen Geschäftskontakte ein, deren Arbeit sie
                tatsächlich einschätzen können.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-8 shadow-sm">
              <p className="text-sm font-semibold text-blue-600">
                AuftragsKette Mitgliedschaft
              </p>

              <div className="mt-4 flex items-end gap-2">
                <span className="text-5xl font-bold">69 €</span>
                <span className="pb-1 text-gray-500">/ Monat</span>
              </div>

              <div className="mt-8 space-y-4 text-gray-700">
                <p>✓ Zugang zum geschlossenen Unternehmernetzwerk</p>
                <p>✓ Online-Meetings zum Netzwerken</p>
                <p>✓ Branchentreffen und Veranstaltungen für Mitglieder</p>
                <p>✓ Persönliche Empfehlungen an Kunden und neue Aufträge</p>
                <p>✓ Eigenes Mitglieder- und Unternehmensprofil</p>
                <p>✓ Keine Empfehlungsprovision</p>
              </div>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <p className="font-semibold">
                  Voraussetzung für die Aufnahme
                </p>

                <p className="mt-2 leading-7 text-gray-600">
                  Die Aufnahme erfolgt über persönliche Empfehlung oder
                  Einladung. Mitglieder benennen mindestens drei
                  persönlich bekannte und fachlich einschätzbare
                  Geschäftskontakte oder bauen diese innerhalb der
                  vorgesehenen Anfangsfrist auf.
                </p>
              </div>

              <Link
                href="/anmelden"
                className="mt-8 block rounded-lg bg-gray-900 px-6 py-3 text-center font-semibold text-white"
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
