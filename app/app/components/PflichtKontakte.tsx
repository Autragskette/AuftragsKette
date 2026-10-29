import Link from "next/link";
import { datum } from "@/lib/empfehlung";
import { NACHFRIST_MONATE, type pflichtStand } from "@/lib/mitglied";

type Stand = ReturnType<typeof pflichtStand>;

export default function PflichtKontakte({
  stand,
  wartend,
}: {
  stand: Stand;
  wartend: number;
}) {
  if (stand.fehlen === 0) return null;

  const dringend = stand.ueberfaellig || (stand.naechster?.sofort ?? false);
  const farbe = dringend
    ? "border-amber-200 bg-amber-50 text-amber-900"
    : "border-blue-200 bg-blue-50 text-blue-900";

  return (
    <div className={`mt-6 rounded-xl border p-5 text-sm leading-6 ${farbe}`}>
      <p className="font-semibold">
        Deine Startkontakte: {3 - stand.fehlen} von 3 bestätigt
        {wartend > 0 && `, ${wartend} ${wartend === 1 ? "wartet" : "warten"} auf Zustimmung`}
      </p>

      <ol className="mt-3 space-y-1.5">
        {stand.schritte.map((s) => (
          <li key={s.nr} className="flex items-start gap-2">
            <span aria-hidden className="w-5 shrink-0 text-center">
              {s.erfuellt ? "✓" : s.ueberfaellig ? "!" : "○"}
            </span>
            <span className={s.erfuellt ? "line-through opacity-60" : ""}>
              {s.nr}. Kontakt{" "}
              {s.erfuellt
                ? "bestätigt"
                : s.sofort
                  ? "zum Start"
                  : s.ueberfaellig
                    ? `überfällig seit ${datum(s.frist.toISOString())}`
                    : `bis ${datum(s.frist.toISOString())} (noch ${s.tageRest} Tage)`}
            </span>
          </li>
        ))}
      </ol>

      {stand.nachfrist && stand.nachfristBis && (
        <p className="mt-3">
          Einige deiner Kontakte haben abgelehnt. Kein Problem: Du bleibst
          Mitglied und hast {NACHFRIST_MONATE} Monate Zeit, bis zum{" "}
          {datum(stand.nachfristBis.toISOString())} neue Kontakte einzuladen.
        </p>
      )}

      <p className="mt-3">
        Lade Betriebe ein, deren Arbeit du kennst und die du deinen Kunden
        guten Gewissens empfehlen würdest. Sie zählen, sobald sie zugestimmt haben.
      </p>

      <Link href="/dashboard/netzwerk/neu" className="mt-2 inline-block font-semibold underline">
        Kontakt einladen
      </Link>
    </div>
  );
}
