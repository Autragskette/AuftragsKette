import Link from "next/link";

/** Hinweis statt Senden-Knöpfen, solange Name im Profil fehlt. */
export default function ProfilFehlt({ zurueck, was }: { zurueck: string; was: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
      <p className="font-semibold">Erst dein Profil ausfüllen</p>
      <p className="mt-1">
        In {was} steht, wer empfiehlt, also dein Name und deine Firma. Bitte
        trag beides kurz in deinem Profil ein, danach geht es hier weiter.
      </p>
      <Link
        href={`/dashboard/profil?zurueck=${encodeURIComponent(zurueck)}`}
        className="mt-3 inline-block rounded-lg bg-gray-900 px-5 py-2.5 font-semibold text-white"
      >
        Profil ausfüllen
      </Link>
    </div>
  );
}
