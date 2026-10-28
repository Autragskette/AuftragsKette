import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Übersicht",
};

export default async function Dashboard() {
  // Anmeldung wird bereits im Layout geprüft.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [profilAntwort, kontakteAntwort, empfehlungenAntwort] =
    await Promise.all([
      supabase
        .from("profile")
        .select("vorname")
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

  const vorname = profilAntwort.data?.vorname?.trim();
  const anzahlKontakte = kontakteAntwort.count ?? 0;
  const offeneEmpfehlungen = empfehlungenAntwort.count ?? 0;
  const fehlendeKontakte = Math.max(0, 3 - anzahlKontakte);

  return (
    <>
      <p className="font-semibold text-blue-600">Übersicht</p>

      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        {vorname ? `Willkommen, ${vorname}` : "Willkommen bei AuftragsKette"}
      </h1>

      <p className="mt-3 text-gray-600">
        Hier siehst du dein Netzwerk, deine Empfehlungen und die wichtigsten
        Aktivitäten auf einen Blick.
      </p>

      {fehlendeKontakte > 0 && (
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
          Für die Aufnahme benennst du mindestens drei persönlich bekannte
          Geschäftskontakte. Dir fehlen noch <strong>{fehlendeKontakte}</strong>.{" "}
          <Link
            href="/dashboard/netzwerk/neu"
            className="font-semibold underline"
          >
            Kontakt hinzufügen
          </Link>
        </div>
      )}

      {/* Kennzahlen */}
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <Kennzahl
          titel="Mein Netzwerk"
          wert={anzahlKontakte}
          text={anzahlKontakte === 1 ? "Kontakt" : "Kontakte"}
          href="/dashboard/netzwerk"
        />
        <Kennzahl
          titel="Empfehlungen"
          wert={offeneEmpfehlungen}
          text="an dich, noch offen"
        />
        <Kennzahl titel="Veranstaltungen" wert="–" text="kommt in Kürze" />
      </div>
    </>
  );
}

function Kennzahl({
  titel,
  wert,
  text,
  href,
}: {
  titel: string;
  wert: number | string;
  text: string;
  href?: string;
}) {
  const inhalt = (
    <>
      <p className="text-sm font-medium text-gray-500">{titel}</p>
      <p className="mt-3 text-3xl font-bold">{wert}</p>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
    </>
  );

  const klassen = "block rounded-xl border border-gray-200 bg-white p-6";

  return href ? (
    <Link href={href} className={`${klassen} hover:border-blue-300`}>
      {inhalt}
    </Link>
  ) : (
    <div className={klassen}>{inhalt}</div>
  );
}
