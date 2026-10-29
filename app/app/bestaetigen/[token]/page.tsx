import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/app/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { supabaseEingerichtet } from "@/lib/supabase/config";
import Footer from "@/app/components/Footer";
import { einladungBeantworten, type Angaben } from "./actions";
import AngabenFormular from "./AngabenFormular";
import { KENNENLERN_EMPFEHLUNGEN, KENNENLERN_MONATE, KENNENLERN_MONATE_MAX, TARIFE } from "@/lib/preise";

export const metadata: Metadata = {
  title: "Empfehlung bestätigen",
  robots: { index: false },
};

const UUID_MUSTER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Einladung = {
  kontakt_name: string;
  firma: string;
  leistung: string;
  status: "eingeladen" | "bestaetigt" | "abgelehnt";
  empfohlen_von: string;
  /** Nur der Name, ohne Firma (ab Migration 0004) */
  empfohlen_von_name?: string;
};

export default async function Bestaetigen(props: PageProps<"/bestaetigen/[token]">) {
  const { token } = await props.params;
  const { antwort, fehler, aendern, geaendert } = await props.searchParams;

  let einladung: Einladung | null = null;
  let ausNetzwerk = false;
  let angaben: Angaben = { firma: "", leistung: "", telefon: "", email: "", plz: "", ort: "" };
  if (UUID_MUSTER.test(token) && supabaseEingerichtet()) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("einladung_lesen_v2", { p_token: token });
    einladung = (Array.isArray(data) ? data[0] : data) ?? null;
    const { data: h } = await supabase.rpc("einladung_herkunft", { p_token: token });
    ausNetzwerk = h === "netzwerk";
    const { data: v } = await supabase.rpc("einladung_vorschau", { p_token: token });
    const vorschau = (Array.isArray(v) ? v[0] : v) as Partial<Angaben> | undefined;
    if (vorschau) {
      angaben = {
        firma: vorschau.firma ?? "",
        leistung: vorschau.leistung ?? "",
        telefon: vorschau.telefon ?? "",
        email: vorschau.email ?? "",
        plz: vorschau.plz ?? "",
        ort: vorschau.ort ?? "",
      };
    }
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
        {!einladung ? (
          <Karte>
            <h1 className="text-2xl font-bold">Link ungültig</h1>
            <p className="mt-3 leading-7 text-slate-600">
              Dieser Bestätigungslink ist nicht (mehr) gültig. Bitte frag bei
              der Person nach, die dich empfohlen hat.
            </p>
          </Karte>
        ) : einladung.status === "bestaetigt" && aendern ? (
          <Karte>
            <h1 className="text-2xl font-bold">Meine Angaben ändern</h1>
            <AngabenFormular token={token} anfangswerte={angaben} modus="aendern" />
            <Link href={`/bestaetigen/${token}`} className="mt-4 block text-center text-sm font-medium text-slate-500 underline">
              Abbrechen
            </Link>
          </Karte>
        ) : antwort === "ja" || (einladung.status === "bestaetigt" && !antwort) ? (
          <Karte>
            <p className="text-4xl">🤝</p>
            <h1 className="mt-4 text-2xl font-bold">Willkommen in der AuftragsKette</h1>
            <p className="mt-3 leading-7 text-slate-600">
              Danke, {einladung.kontakt_name.split(" ")[0]}! Du bist jetzt mit
              deinen Angaben als empfohlener Partner gelistet. Mitglieder können
              dich ab sofort an ihre Kunden weiterempfehlen.
            </p>
            {geaendert && (
              <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                Deine Angaben sind gespeichert.
              </p>
            )}
            <Link
              href={`/bestaetigen/${token}?aendern=1`}
              className="mt-4 inline-block text-sm font-semibold text-kette underline"
            >
              Meine Angaben ändern
            </Link>
            <div className="mt-6 rounded-xl bg-tinte p-5 text-white">
              <p className="font-semibold">Schau dich in der App um</p>
              <p className="mt-1 text-sm leading-6 text-blue-100">
                Mit deinem kostenlosen Zugang siehst du, wer dich empfohlen hat,
                und bekommst eine Nachricht aufs Handy, sobald es passiert.
              </p>
              <Link
                href={`/zugang/${token}`}
                className="mt-4 inline-block rounded-xl bg-white px-5 py-3 text-sm font-semibold text-tinte"
              >
                Kostenlosen Zugang anlegen
              </Link>
            </div>
            <Ansehen token={token} />
            <p className="mt-6 text-sm leading-6 text-slate-500">
              Möchtest du deine Zustimmung später zurückziehen, öffne einfach
              diesen Link erneut.
            </p>
            <Widerruf token={token} />
          </Karte>
        ) : antwort === "nein" || einladung.status === "abgelehnt" ? (
          <Karte>
            <h1 className="text-2xl font-bold">Schade, aber verstanden</h1>
            <p className="mt-3 leading-7 text-slate-600">
              Du wirst nicht im Netzwerk gelistet und nicht weiterempfohlen.
              Deine Daten sind für andere Mitglieder nicht sichtbar.
            </p>
            <p className="mt-3 leading-7 text-slate-600">
              Falls du es dir anders überlegst, kannst du hier jederzeit
              zustimmen:
            </p>
            <AngabenFormular token={token} anfangswerte={angaben} modus="zustimmen" />
          </Karte>
        ) : (
          <Karte>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">
              Hallo {einladung.kontakt_name.split(" ")[0]},
            </h1>
            <p className="mt-4 leading-7 text-slate-700">
              {ausNetzwerk ? (
                <>
                  <strong>{einladung.empfohlen_von}</strong> hat dich über die
                  AuftragsKette kennengelernt und möchte dich in das eigene
                  Netzwerk aufnehmen, um dich für{" "}
                  <strong>{einladung.leistung}</strong> an Kunden
                  weiterzuempfehlen.
                </>
              ) : (
                <>
                  <strong>{einladung.empfohlen_von}</strong> hat dich als
                  vertrauenswürdigen Geschäftskontakt für{" "}
                  <strong>{einladung.leistung}</strong> empfohlen und lädt dich
                  ein, Teil der AuftragsKette zu werden.
                </>
              )}
            </p>

            <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-5 text-sm leading-6 text-slate-700">
              <p className="font-semibold text-gray-900">So funktioniert AuftragsKette</p>
              <p>
                AuftragsKette ist ein geschlossenes Unternehmernetzwerk für
                Unternehmer und Selbstständige, mit Online-Meetings,
                Branchentreffen und Erfahrungsaustausch. Der besondere
                Mehrwert: Mitglieder empfehlen ihren Kunden Betriebe, die sie
                persönlich kennen und deren Arbeit sie einschätzen können.
              </p>
              <p>
                Fragt ein Kunde zum Beispiel einen Fotografen nach einem
                Floristen, sucht der Fotograf in AuftragsKette einen Floristen
                aus der Region und schickt dem Kunden die Kontaktdaten. So
                entstehen Aufträge über echte Empfehlungen, ohne Provision.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-linie p-5 text-sm leading-6 text-slate-700">
              <p className="font-semibold text-gray-900">Was kostet das?</p>
              <p className="mt-1">
                Für dich ist das zunächst ganz kostenlos: Die ersten
                Empfehlungen bzw. bis zu sechs Monate kannst du
                unverbindlich ausprobieren. Danach entscheidest du selbst, ob
                du Mitglied werden möchtest, im Jahresabo für {TARIFE[0].preis} € oder
                im Halbjahresabo für {TARIFE[1].preis} € im Monat (netto, zzgl.
                MwSt.). Ohne Mitgliedschaft wird deine Listung pausiert, es
                entstehen keine Kosten.
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Genau gilt: Die kostenlose Phase endet mit der {KENNENLERN_EMPFEHLUNGEN}. Empfehlung
                an einen Kunden, spätestens {KENNENLERN_MONATE} Monate nach deiner Zustimmung. Bekommst
                du in dieser Zeit noch keine Empfehlung, verlängert sie sich, bis
                die erste kommt, längstens auf {KENNENLERN_MONATE_MAX} Monate.
              </p>
            </div>

            <Ansehen token={token} />

            {fehler && (
              <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                Das hat leider nicht geklappt. Bitte versuche es erneut.
              </p>
            )}

            <AngabenFormular token={token} anfangswerte={angaben} modus="zustimmen" />

            <form action={einladungBeantworten.bind(null, token)} className="mt-3">
              <input type="hidden" name="antwort" value="nein" />
              <button
                type="submit"
                className="w-full rounded-lg px-6 py-3 text-sm font-semibold text-slate-600 hover:text-gray-900"
              >
                Nein, ich möchte nicht gelistet werden
              </button>
            </form>
          </Karte>
        )}
      </section>

      <Footer />
    </main>
  );
}

function Karte({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-linie bg-white p-5 shadow-sm sm:p-7">
      {children}
    </div>
  );
}

function Ansehen({ token }: { token: string }) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      <Link
        href={`/bestaetigen/${token}/vorschau`}
        className="rounded-xl border border-linie bg-white px-4 py-3 text-center text-sm font-semibold text-tinte hover:border-kette"
      >
        So sehen dich Kunden →
      </Link>
      <Link
        href="/"
        target="_blank"
        className="rounded-xl border border-linie bg-white px-4 py-3 text-center text-sm font-semibold text-tinte hover:border-kette"
      >
        Mehr über AuftragsKette →
      </Link>
    </div>
  );
}

function Widerruf({ token }: { token: string }) {
  return (
    <form action={einladungBeantworten.bind(null, token)} className="mt-6">
      <input type="hidden" name="antwort" value="nein" />
      <button type="submit" className="text-sm font-medium text-slate-500 underline">
        Zustimmung widerrufen
      </button>
    </form>
  );
}
