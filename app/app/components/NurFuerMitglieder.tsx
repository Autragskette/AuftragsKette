import Link from "next/link";

/** Hinweis im Schnupperzugang: Diese Funktion ist Mitgliedern vorbehalten. */
export default function NurFuerMitglieder({
  titel,
  text,
  kompakt,
}: {
  titel: string;
  text: string;
  kompakt?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-linie bg-white ${kompakt ? "p-5" : "p-6 sm:p-8"}`}>
      <div className="flex items-start gap-4">
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-papier text-tinte ring-1 ring-linie">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-tinte">{titel}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
          <Link
            href="/dashboard/mitglied-werden"
            className="mt-4 inline-block rounded-xl bg-tinte px-5 py-3 text-sm font-semibold text-white"
          >
            Mitglied werden
          </Link>
        </div>
      </div>
    </div>
  );
}
