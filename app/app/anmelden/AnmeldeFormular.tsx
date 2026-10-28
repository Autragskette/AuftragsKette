"use client";

import { useActionState } from "react";
import { anmelden, type AnmeldeStatus } from "./actions";

const start: AnmeldeStatus = { fehler: null };

export default function AnmeldeFormular() {
  const [status, aktion, laeuft] = useActionState(anmelden, start);

  return (
    <form action={aktion} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          E-Mail-Adresse
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="name@unternehmen.de"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
        />
      </div>

      <div>
        <label
          htmlFor="passwort"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Passwort
        </label>

        <input
          id="passwort"
          name="passwort"
          type="password"
          autoComplete="current-password"
          required
          placeholder="Passwort eingeben"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
        />
      </div>

      {status.fehler && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {status.fehler}
        </p>
      )}

      <button
        type="submit"
        disabled={laeuft}
        className="w-full rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {laeuft ? "Wird angemeldet …" : "Anmelden"}
      </button>
    </form>
  );
}
