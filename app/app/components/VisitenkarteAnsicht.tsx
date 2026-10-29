import { telefonInternational } from "@/lib/teilen";

export type VisitenkarteDaten = {
  name: string;
  firma: string;
  leistung: string;
  telefon: string;
  email: string;
  plz: string;
  ort: string;
  nachricht?: string | null;
};

/** Die digitale Visitenkarte, wie Kunden sie sehen (auch für die Vorschau). */
export default function VisitenkarteAnsicht({
  k,
  vcardLink,
}: {
  k: VisitenkarteDaten;
  /** Ohne Link wird der Knopf nur angezeigt (Vorschau) */
  vcardLink?: string;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-linie bg-white shadow-sm">
      <div className="bg-tinte px-7 py-8 text-white">
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
          <a href={`tel:${k.telefon.replace(/\s/g, "")}`} className="flex items-center justify-between rounded-lg border border-linie px-4 py-3">
            <span className="text-sm text-gray-500">Anrufen</span>
            <span className="font-semibold">{k.telefon}</span>
          </a>
        )}
        {k.telefon && (
          <a
            href={`https://wa.me/${telefonInternational(k.telefon)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-lg border border-linie px-4 py-3"
          >
            <span className="text-sm text-gray-500">WhatsApp</span>
            <span className="font-semibold">Nachricht schreiben</span>
          </a>
        )}
        {k.email && (
          <a href={`mailto:${k.email}`} className="flex items-center justify-between gap-3 rounded-lg border border-linie px-4 py-3">
            <span className="text-sm text-gray-500">E-Mail</span>
            <span className="truncate font-semibold">{k.email}</span>
          </a>
        )}
        {(k.plz || k.ort) && (
          <p className="px-1 text-sm text-gray-500">{`${k.plz} ${k.ort}`.trim()}</p>
        )}

        {vcardLink ? (
          <a href={vcardLink} className="block rounded-xl bg-kette px-6 py-3 text-center font-semibold text-white">
            In Kontakte speichern
          </a>
        ) : (
          <span className="block rounded-xl bg-kette px-6 py-3 text-center font-semibold text-white opacity-90">
            In Kontakte speichern
          </span>
        )}
      </div>
    </div>
  );
}
