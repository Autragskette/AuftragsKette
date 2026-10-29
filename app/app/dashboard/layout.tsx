import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseEingerichtet } from "@/lib/supabase/config";
import { abmelden } from "../anmelden/actions";
import Seitennavigation from "./Seitennavigation";
import MobilNavigation from "./MobilNavigation";
import Logo from "@/app/components/Logo";

export default async function MitgliederLayout({
  children,
}: LayoutProps<"/dashboard">) {
  if (!supabaseEingerichtet()) {
    return <NichtEingerichtet />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/anmelden");

  const [{ data: profil }] = await Promise.all([
    supabase.from("profile").select("vorname").eq("id", user.id).maybeSingle(),
    // Besuch für die Aktivitätsmessung merken (höchstens einmal pro Stunde)
    supabase.rpc("aktivitaet_merken"),
  ]);

  const initiale = (profil?.vorname?.trim() || user.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <main className="min-h-screen bg-papier text-gray-900">
      {/* Kopfzeile: auf dem Handy schlank und fest oben */}
      <header className="pt-safe sticky top-0 z-30 border-b border-linie bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-5">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-tinte md:text-xl">
            <Logo />
            AuftragsKette
          </Link>

          <div className="flex items-center gap-4">
            <form action={abmelden} className="hidden md:block">
              <button
                type="submit"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Abmelden
              </button>
            </form>

            <Link
              href="/dashboard/profil"
              aria-label="Mein Profil"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-papier text-sm font-semibold text-tinte ring-1 ring-linie md:h-10 md:w-10"
              title={user.email ?? undefined}
            >
              {initiale}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl md:grid md:grid-cols-[240px_1fr]">
        {/* Seitenleiste nur ab Tablet-Breite */}
        <aside className="hidden border-r border-linie bg-white px-4 py-8 md:block">
          <Seitennavigation />
        </aside>

        <section className="pb-tabs min-w-0 px-4 pt-5 md:px-8 md:pt-10">{children}</section>
      </div>

      <MobilNavigation />
    </main>
  );
}

function NichtEingerichtet() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md rounded-2xl border border-linie bg-white p-8 text-center">
        <h1 className="text-2xl font-bold">Noch nicht eingerichtet</h1>
        <p className="mt-3 leading-7 text-gray-600">
          Der Mitgliederbereich wird gerade vorbereitet. Die Verbindung zur
          Datenbank fehlt noch (siehe SETUP.md im Projekt).
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-tinte px-5 py-2.5 text-sm font-semibold text-white"
        >
          Zur Startseite
        </Link>
      </div>
    </main>
  );
}
