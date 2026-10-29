"use client";

import Link from "next/link";
import { useActionState } from "react";
import { zugangAnlegen, type ZugangStatus } from "./actions";

const start: ZugangStatus = { fehler: null };

export default function ZugangFormular({ token, email }: { token: string; email: string }) {
  const [status, aktion, laeuft] = useActionState(zugangAnlegen.bind(null, token), start);

  if (status.gesendetAn) {
    return (
      <div className="mt-6 rounded-xl bg-green-50 p-5 text-sm leading-6 text-green-900">
        <p className="font-semibold">Fast geschafft</p>
        <p className="mt-1">
          Wir haben dir eine E-Mail an <strong>{status.gesendetAn}</strong> geschickt.
          Tippe auf den Link darin, um deinen Zugang zu bestätigen. Danach bist
          du direkt angemeldet.
        </p>
      </div>
    );
  }

  return (
    <form action={aktion} className="mt-6 space-y-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">E-Mail-Adresse</label>
        <p className="rounded-xl border border-linie bg-papier px-4 py-3 text-slate-700">{email}</p>
      </div>
      <div>
        <label htmlFor="passwort" className="mb-2 block text-sm font-semibold text-gray-700">
          Passwort wählen
        </label>
        <input
          id="passwort"
          name="passwort"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          placeholder="Mindestens 8 Zeichen"
          className="w-full rounded-xl border border-linie px-4 py-3 outline-none focus:border-kette"
        />
      </div>

      {status.fehler && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.fehler}{" "}
          {status.fehler.includes("Melde dich") && (
            <Link href="/anmelden" className="font-semibold underline">Zur Anmeldung</Link>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={laeuft}
        className="w-full rounded-xl bg-tinte px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {laeuft ? "Einen Moment …" : "Zugang anlegen"}
      </button>
    </form>
  );
}
