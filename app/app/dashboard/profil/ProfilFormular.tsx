"use client";

import { useActionState } from "react";
import { profilSpeichern, type ProfilStatus } from "./actions";

type Werte = {
  vorname: string;
  nachname: string;
  firma: string;
  branche: string;
  plz: string;
  ort: string;
  telefon: string;
};

const FELDER: { name: keyof Werte; label: string; placeholder?: string; breit?: boolean }[] = [
  { name: "vorname", label: "Vorname *" },
  { name: "nachname", label: "Nachname *" },
  { name: "firma", label: "Firma", placeholder: "z. B. Lichtblick Fotografie", breit: true },
  { name: "branche", label: "Tätigkeit / Gewerk", placeholder: "z. B. Fotograf, Freelancer Webdesign", breit: true },
  { name: "plz", label: "PLZ", placeholder: "12345" },
  { name: "ort", label: "Ort" },
  { name: "telefon", label: "Telefon", breit: true },
];

export default function ProfilFormular({ werte, zurueck }: { werte: Werte; zurueck?: string }) {
  const [status, aktion, laeuft] = useActionState(profilSpeichern, {
    fehler: null,
    gespeichert: false,
  } as ProfilStatus);

  return (
    <form action={aktion} className="grid gap-5 rounded-xl border border-gray-200 bg-white p-6 sm:grid-cols-2">
      {zurueck && <input type="hidden" name="zurueck" value={zurueck} />}
      {FELDER.map((feld) => (
        <div key={feld.name} className={feld.breit ? "sm:col-span-2" : ""}>
          <label htmlFor={feld.name} className="mb-2 block text-sm font-semibold text-gray-700">
            {feld.label}
          </label>
          <input
            id={feld.name}
            name={feld.name}
            defaultValue={werte[feld.name]}
            placeholder={feld.placeholder}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
          />
        </div>
      ))}

      {status.fehler && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
          {status.fehler}
        </p>
      )}
      {status.gespeichert && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 sm:col-span-2">
          Profil gespeichert.
        </p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={laeuft}
          className="rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {laeuft ? "Wird gespeichert …" : zurueck ? "Speichern und weiter" : "Profil speichern"}
        </button>
      </div>
    </form>
  );
}
