import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseEingerichtet } from "@/lib/supabase/config";
import { abmelden } from "../anmelden/actions";
import Seitennavigation from "./Seitennavigation";

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
        <aside className="border-b border-gray-200 bg-white px-4 py-4 md:border-b-0 md:border-r md:py-8">
          <Seitennavigation />
        </aside>

        <section className="min-w-0 px-6 py-10 md:px-8">{children}</section>
      </div>
    </main>
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
