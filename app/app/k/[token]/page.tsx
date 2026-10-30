import type { Metadata } from "next";
import Link from "next/link";
import { visitenkarteLaden } from "@/lib/visitenkarte";
import { basisUrl } from "@/lib/url";
import VisitenkarteAnsicht from "@/app/components/VisitenkarteAnsicht";

/** Titel und Vorschaubild für WhatsApp & Co.: die Visitenkarte als Bild */
export async function generateMetadata(props: PageProps<"/k/[token]">): Promise<Metadata> {
  const { token } = await props.params;
  const k = await visitenkarteLaden(token);
  if (!k) return { title: "Empfehlung", robots: { index: false } };

  const titel = k.firma ? `${k.name} – ${k.firma}` : k.name;
  const beschreibung = [k.leistung, k.ort].filter(Boolean).join(" · ");
  const bild = `${await basisUrl()}/k/${token}/bild`;
  return {
    title: titel,
    description: beschreibung,
    robots: { index: false },
    openGraph: {
      type: "profile",
      title: titel,
      description: `${beschreibung}${beschreibung ? " · " : ""}Empfohlen von ${k.empfohlen_von}`,
      images: [{ url: bild, width: 1200, height: 630, alt: `Visitenkarte von ${k.name}` }],
    },
    twitter: { card: "summary_large_image", images: [bild] },
  };
}

export default async function Visitenkarte(props: PageProps<"/k/[token]">) {
  const { token } = await props.params;
  const k = await visitenkarteLaden(token);

  return (
    <main className="pt-safe pb-safe flex min-h-screen flex-col items-center bg-gray-50 px-4 py-6 text-gray-900 sm:px-6 sm:py-10">
      {!k ? (
        <div className="w-full max-w-md rounded-2xl border border-linie bg-white p-8 text-center">
          <h1 className="text-xl font-bold">Visitenkarte nicht verfügbar</h1>
          <p className="mt-3 text-gray-600">
            Dieser Link ist nicht (mehr) gültig.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md">
          <p className="text-center text-sm text-gray-500">
            {k.kunde_name ? `Für ${k.kunde_name}, ` : ""}empfohlen von{" "}
            <strong className="text-gray-700">
              {k.empfohlen_von}
              {k.empfohlen_von_firma ? `, ${k.empfohlen_von_firma}` : ""}
            </strong>
          </p>

          <VisitenkarteAnsicht k={k} vcardLink={`/k/${token}/vcard`} />

          <p className="mt-8 text-center text-xs leading-5 text-gray-400">
            Persönlich empfohlen über{" "}
            <Link href="/" className="font-semibold text-gray-500">
              AuftragsKette
            </Link>
            , dem geschlossenen Unternehmernetzwerk.
            <br />
            <Link href="/impressum" className="underline">Impressum</Link>
            {"  "}
            <Link href="/datenschutz" className="underline">Datenschutz</Link>
          </p>
        </div>
      )}
    </main>
  );
}
