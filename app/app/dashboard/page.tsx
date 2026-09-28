export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* Kopfzeile */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="text-xl font-bold text-blue-600">
            AuftragsKette
          </a>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Mitgliederbereich</span>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 font-semibold text-white">
              M
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl md:grid-cols-[240px_1fr]">
        {/* Seitennavigation */}
        <aside className="border-r border-gray-200 bg-white px-4 py-8">
          <nav className="space-y-2">
            <a
              href="/dashboard"
              className="block rounded-lg bg-blue-50 px-4 py-3 font-semibold text-blue-700"
            >
              Übersicht
            </a>

            <a
              href="#"
              className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50"
            >
              Mein Netzwerk
            </a>

            <a
              href="#"
              className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50"
            >
              Empfehlungen
            </a>

            <a
              href="#"
              className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50"
            >
              Mitglieder
            </a>

            <a
              href="#"
              className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-50"
            >
              Veranstaltungen
            </a>
          </nav>
        </aside>

        {/* Dashboard-Inhalt */}
        <section className="px-8 py-10">
          <p className="font-semibold text-blue-600">Übersicht</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Willkommen bei AuftragsKette
          </h1>

          <p className="mt-3 text-gray-600">
            Hier siehst du dein Netzwerk, deine Empfehlungen und die
            wichtigsten Aktivitäten auf einen Blick.
          </p>

          {/* Kennzahlen */}
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-sm font-medium text-gray-500">
                Mein Netzwerk
              </p>
              <p className="mt-3 text-3xl font-bold">3</p>
              <p className="mt-1 text-sm text-gray-500">
                bestätigte Kontakte
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-sm font-medium text-gray-500">
                Empfehlungen
              </p>
              <p className="mt-3 text-3xl font-bold">0</p>
              <p className="mt-1 text-sm text-gray-500">
                aktuell offen
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-sm font-medium text-gray-500">
                Veranstaltungen
              </p>
              <p className="mt-3 text-3xl font-bold">0</p>
              <p className="mt-1 text-sm text-gray-500">
                demnächst
              </p>
            </div>
          </div>

          {/* Aktionen */}
          <div className="mt-10">
            <h2 className="text-xl font-bold">Schnellzugriff</h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="font-bold">Mein Netzwerk</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Verwalte die Geschäftskontakte, die du persönlich kennst
                  und fachlich einschätzen kannst.
                </p>

                <button className="mt-5 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white">
                  Netzwerk öffnen
                </button>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h3 className="font-bold">Empfehlung erstellen</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Empfehle einen passenden Kontakt aus deinem persönlichen
                  Netzwerk weiter.
                </p>

                <button className="mt-5 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold">
                  Empfehlung starten
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}