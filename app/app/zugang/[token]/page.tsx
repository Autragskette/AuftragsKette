import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import Footer from "@/app/components/Footer";
import { createClient } from "@/lib/supabase/server";
import { supabaseEingerichtet } from "@/lib/supabase/config";
import { KENNENLERN_MONATE_MAX } from "@/lib/preise";
import ZugangFormular from "./ZugangFormular";

export const metadata: Metadata = {
  title: "Dein Zugang",
  robots: { index: false },
};

const UUID_MUSTER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Zugang(props: PageProps<"/zugang/[token]">) {
  const { token } = await props.params;

  let v: { name: string; email: string; status: string } | null = null;
  if (UUID_MUSTER.test(token) && supabaseEingerichtet()) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("einladung_vorschau", { p_token: token });
    v = (Array.isArray(data) ? data[0] : data) ?? null;
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <header className="border-b border-linie bg-white">
        <div className="mx-auto flex max-w-3xl items-center px-5 py-4 sm:px-6 sm:py-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-tinte">
            <Logo />
            AuftragsKette
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 sm:py-12">
        <Karte>
          {!v ? (
            <>
              <h1 className="text-2xl font-bold">Link ungültig</h1>
              <p className="mt-3 leading-7 text-slate-600">
                Dieser Link ist nicht (mehr) gültig. Bitte frag bei der Person
                nach, die dich empfohlen hat.
              </p>
            </>
          ) : v.status !== "bestaetigt" ? (
            <>
              <h1 className="text-2xl font-bold">Erst zustimmen</h1>
              <p className="mt-3 leading-7 text-slate-600">
                Bevor du dir einen Zugang anlegst, stimme bitte der Empfehlung zu.
              </p>
              <Link
                href={`/bestaetigen/${token}`}
                className="mt-6 block rounded-xl bg-tinte px-6 py-3 text-center font-semibold text-white"
              >
                Zur Zustimmung
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Schau dich in der App um</h1>
              <p className="mt-3 leading-7 text-slate-600">
                Mit deinem kostenlosen Zugang siehst du, wer dich empfohlen hat,
                wie lange deine Testphase läuft und was im Netzwerk passiert:
                Branchen-Calls, regionale Treffen und Betriebe aus deiner Region.
              </p>
              <ul className="mt-4 space-y-1.5 text-sm leading-6 text-slate-700">
                <li>✓ Benachrichtigung aufs Handy, sobald du empfohlen wirst</li>
                <li>✓ Die ersten Empfehlungen bzw. bis zu {KENNENLERN_MONATE_MAX} Monate ganz kostenlos, ohne Zahlungsdaten</li>
                <li>✓ Danach entscheidest du selbst, ob du Mitglied wirst</li>
              </ul>
              {v.email ? (
                <ZugangFormular token={token} email={v.email} />
              ) : (
                <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Für dich ist keine E-Mail-Adresse hinterlegt. Bitte gib der
                  Person Bescheid, die dich empfohlen hat.
                </p>
              )}
              <p className="mt-6 text-center text-sm text-slate-500">
                Schon einen Zugang?{" "}
                <Link href="/anmelden" className="font-semibold text-kette underline">
                  Anmelden
                </Link>
              </p>
            </>
          )}
        </Karte>
      </section>

      <Footer />
    </main>
  );
}

function Karte({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-linie bg-white p-5 shadow-sm sm:p-7">{children}</div>;
}
