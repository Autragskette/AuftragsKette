"use client";

import { useActionState } from "react";
import { einchecken, type CheckinStatus } from "./actions";

export default function Einchecken({ id, punkte }: { id: string; punkte: number }) {
  const [status, aktion, laeuft] = useActionState(einchecken.bind(null, id), {
    fehler: null,
    ok: false,
  } as CheckinStatus);

  if (status.ok) {
    return (
      <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
        Teilnahme bestätigt, +{punkte} Punkte ✓
      </p>
    );
  }

  return (
    <form action={aktion} className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <label htmlFor={`code-${id}`} className="block text-sm font-semibold text-blue-900">
        Teilnahme bestätigen (+{punkte} Punkte)
      </label>
      <p className="mt-1 text-xs text-blue-900">
        Den Code nennt der Gastgeber während der Veranstaltung.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          id={`code-${id}`}
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="z. B. A1B2C3"
          className="w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-2.5 uppercase tracking-widest outline-none focus:border-blue-600"
        />
        <button
          type="submit"
          disabled={laeuft}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {laeuft ? "…" : "Einchecken"}
        </button>
      </div>
      {status.fehler && <p className="mt-2 text-sm text-red-700">{status.fehler}</p>}
    </form>
  );
}
