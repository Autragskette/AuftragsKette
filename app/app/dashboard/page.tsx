import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseEingerichtet } from "@/lib/supabase/config";
import { abmelden } from "../anmelden/actions";

export const metadata: Metadata = {
  title: "Übersicht",
};

const MENUE = [
  { name: "Übersicht", href: "/dashboard" },
  { name: "Mein Netzwerk", href: null },
  { name: "Empfehlungen", href: null },
  { name: "Mitglieder", href: null },
  { name: "Veranstaltungen", href: null },
];

export default async function Dashboard() {
  if (!supabaseEingerichtet()) {
    return <NichtEingerichtet />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/anmelden");

  const [profilAntwort, kontakteAntwort, empfehlungenAntwort] =
    await Promise.all([
      supabase
        .from("profile")
        .select("vorname, nachname, firma")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("kontakte")
        .select("id", { count: "exact", head: true })
        .eq("besitzer_id", user.id),
      supabase
        .from("empfehlungen")
        .select("id", { count: "exact", head: true })
        .eq("an_id", user.id)
        .eq("status", "offen"),
    ]);

  const profil = profilAntwort.data;
  const anzahlKontakte = kontakteAntwort.count ?? 0;
  const offeneEmpfehlungen = empfehlungenAntwort.count ?? 0;

  const vorname = profil?.vorname?.trim();
  const initiale = (vorname || user.email || "?").charAt(0).toUpperCase();
  const fehlendeKontakte = Math.max(0, 3 - anzahlKontakte);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* Kopfzeile */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold text-blue-600">
            AuftragsKette
          </Link>

          <div className="flex items-center gap-4">
            <form action={abmelden}>
              <button
                type="submit"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Abmelden
              </button>
            </form>

            <div
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 font-semibold text-white"
              title={user.email ?? undefined}
            >
              {initiale}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl md:grid-cols-[240px_1fr]">
        {/* Seitennavigation */}
        <aside className="border-b border-gray-200 bg-white px-4 py-4 md:border-b-0 md:border-r md:py-8">
          <nav className="flex gap-2 overflow-x-auto md:block md:space-y-2">
            {MENUE.map((punkt) =>
              punkt.href ? (
                <Link
                  key={punkt.name}
                  href={punkt.href}
                  className="block shrink-0 rounded-lg bg-blue-50 px-4 py-3 font-semibold text-blue-700"
                >
                  {punkt.name}
                </Link>
              ) : (
                <span
                  key={punkt.name}
                  className="block shrink-0 cursor-default rounded-lg px-4 py-3 text-gray-400"
                  title="Kommt in Kürze"
                >
                  {punkt.name}
                </span>
              ),
            )}
          </nav>
        </aside>

        {/* Dashboard-Inhalt */}
        <section className="px-6 py-10 md:px-8">
          <p className="font-semibold text-blue-600">Übersicht</p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {vorname ? `Willkommen, ${vorname}` : "Willkommen bei AuftragsKette"}
          </h1>

          <p className="mt-3 text-gray-600">
            Hier siehst du dein Netzwerk, deine Empfehlungen und die
            wichtigsten Aktivitäten auf einen Blick.
          </p>

          {fehlendeKontakte > 0 && (
            <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
              Für die Aufnahme benennst du mindestens drei persönlich
              bekannte Geschäftskontakte. Dir fehlen noch{" "}
              <strong>{fehlendeKontakte}</strong>.
            </div>
          )}

          {/* Kennzahlen */}
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Kennzahl
              titel="Mein Netzwerk"
              wert={anzahlKontakte}
              text={anzahlKontakte === 1 ? "Kontakt" : "Kontakte"}
            />
            <Kennzahl
              titel="Empfehlungen"
              wert={offeneEmpfehlungen}
              text="an dich, noch offen"
            />
            <Kennzahl titel="Veranstaltungen" wert="–" text="kommt in Kürze" />
          </div>
        </section>
      </div>
    </main>
  );
}

function Kennzahl({
  titel,
  wert,
  text,
}: {
  titel: string;
  wert: number | string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-sm font-medium text-gray-500">{titel}</p>
      <p className="mt-3 text-3xl font-bold">{wert}</p>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
    </div>
  );
}

function NichtEingerichtet() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-bold">Noch nicht eingerichtet</h1>
        <p className="mt-3 leading-7 text-gray-600">
          Der Mitgliederbereich wird gerade vorbereitet. Die Verbindung zur
          Datenbank fehlt noch (siehe SETUP.md im Projekt).
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Zur Startseite
        </Link>
      </div>
    </main>
  );
}
