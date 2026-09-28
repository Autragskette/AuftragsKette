export default function Anmelden() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Kopfbereich */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="/" className="text-xl font-bold text-blue-600">
            AuftragsKette
          </a>

          <a
            href="/"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Zurück zur Startseite
          </a>
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

          <form className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                E-Mail-Adresse
              </label>

              <input
                id="email"
                type="email"
                placeholder="name@unternehmen.de"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Passwort
              </label>

              <input
                id="password"
                type="password"
                placeholder="Passwort eingeben"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
              />
            </div>

            <button
              type="button"
              className="w-full rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white"
            >
              Anmelden
            </button>
          </form>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-sm leading-6 text-gray-600">
              Noch kein Zugang? Die Aufnahme in die AuftragsKette
              erfolgt ausschließlich über persönliche Empfehlung oder
              Einladung.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}