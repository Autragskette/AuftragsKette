import type { Metadata } from "next";
import Link from "next/link";
import { visitenkarteLaden } from "@/lib/visitenkarte";
import { telefonInternational } from "@/lib/teilen";

export const metadata: Metadata = {
  title: "Empfehlung",
  robots: { index: false },
};

export default async function Visitenkarte(props: PageProps<"/k/[token]">) {
  const { token } = await props.params;
  const k = await visitenkarteLaden(token);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 px-6 py-10 text-gray-900">
      {!k ? (
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <h1 className="text-xl font-bold">Visitenkarte nicht verfügbar</h1>
          <p className="mt-3 text-gray-600">
            Dieser Link ist nicht (mehr) gültig.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <p className="text-center text-sm text-gray-500">
            {k.kunde_name ? `Für ${k.kunde_name} · ` : ""}empfohlen von{" "}
            <strong className="text-gray-700">
              {k.empfohlen_von}
              {k.empfohlen_von_firma ? `, ${k.empfohlen_von_firma}` : ""}
            </strong>
          </p>

          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="bg-gray-900 px-7 py-8 text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-bold text-gray-900">
                {k.name.charAt(0).toUpperCase()}
              </div>
              <h1 className="mt-5 text-2xl font-bold">{k.name}</h1>
              {k.firma && <p className="mt-1 text-gray-300">{k.firma}</p>}
              <p className="mt-3 text-sm text-blue-200">{k.leistung}</p>
            </div>

            <div className="space-y-4 px-7 py-6">
              {k.nachricht && (
                <p className="rounded-lg bg-gray-50 p-4 text-sm italic leading-6 text-gray-700">
                  „{k.nachricht}“
                </p>
              )}

              {k.telefon && (
                <a href={`tel:${k.telefon.replace(/\s/g, "")}`} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                  <span className="text-sm text-gray-500">Anrufen</span>
                  <span className="font-semibold">{k.telefon}</span>
                </a>
              )}
              {k.telefon && (
                <a
                  href={`https://wa.me/${telefonInternational(k.telefon)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                >
                  <span className="text-sm text-gray-500">WhatsApp</span>
                  <span className="font-semibold">Nachricht schreiben</span>
                </a>
              )}
              {k.email && (
                <a href={`mailto:${k.email}`} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3">
                  <span className="text-sm text-gray-500">E-Mail</span>
                  <span className="truncate font-semibold">{k.email}</span>
                </a>
              )}
              {(k.plz || k.ort) && (
                <p className="px-1 text-sm text-gray-500">{`${k.plz} ${k.ort}`.trim()}</p>
              )}

              <a
                href={`/k/${token}/vcard`}
                className="block rounded-lg bg-blue-600 px-6 py-3 text-center font-semibold text-white"
              >
                In Kontakte speichern
              </a>
            </div>
          </div>

          <p className="mt-8 text-center text-xs leading-5 text-gray-400">
            Persönlich empfohlen über{" "}
            <Link href="/" className="font-semibold text-gray-500">
              AuftragsKette
            </Link>
            , das geschlossene Empfehlungsnetzwerk.
            <br />
            <Link href="/impressum" className="underline">Impressum</Link>
            {" · "}
            <Link href="/datenschutz" className="underline">Datenschutz</Link>
          </p>
        </div>
      )}
    </main>
  );
}
