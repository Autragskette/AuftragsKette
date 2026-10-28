"use client";

import { useActionState } from "react";
import {
  empfehlungAnlegen,
  type EmpfehlungStatus,
} from "../../empfehlungen/actions";

const EINGABE =
  "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600";

export default function EmpfehlungFormular({ kontaktId }: { kontaktId: string }) {
  const [status, aktion, laeuft] = useActionState(
    empfehlungAnlegen.bind(null, kontaktId),
    { fehler: null } as EmpfehlungStatus,
  );

  return (
    <form action={aktion} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
      <div>
        <label htmlFor="kunde_name" className="mb-2 block text-sm font-semibold text-gray-700">
          Name des Kunden <span className="text-red-500">*</span>
        </label>
        <input id="kunde_name" name="kunde_name" required className={EINGABE} placeholder="z. B. Anna Schmidt" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="kunde_telefon" className="mb-2 block text-sm font-semibold text-gray-700">
            Handynummer (für WhatsApp)
          </label>
          <input id="kunde_telefon" name="kunde_telefon" type="tel" className={EINGABE} placeholder="0170 1234567" />
        </div>
        <div>
          <label htmlFor="kunde_email" className="mb-2 block text-sm font-semibold text-gray-700">
            E-Mail-Adresse
          </label>
          <input id="kunde_email" name="kunde_email" type="email" className={EINGABE} placeholder="kunde@beispiel.de" />
        </div>
      </div>

      <div>
        <label htmlFor="nachricht" className="mb-2 block text-sm font-semibold text-gray-700">
          Persönliche Nachricht <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="nachricht"
          name="nachricht"
          rows={3}
          className={EINGABE}
          placeholder="Leer lassen für einen passenden Standardtext"
        />
      </div>

      <label className="flex items-start gap-3 text-sm leading-6 text-gray-700">
        <input type="checkbox" name="nachfrage_erlaubt" className="mt-1 h-4 w-4" />
        <span>
          Der Kunde ist einverstanden, dass ich nach einer Woche einmal
          nachfrage, falls es noch nicht zum Auftrag gekommen ist.
        </span>
      </label>

      {status.fehler && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.fehler}
        </p>
      )}

      <button
        type="submit"
        disabled={laeuft}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {laeuft ? "Wird vorbereitet …" : "Weiter zum Versenden"}
      </button>
    </form>
  );
}
