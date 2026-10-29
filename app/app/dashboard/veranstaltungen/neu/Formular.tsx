"use client";

import { useActionState, useState } from "react";
import { veranstaltungAnlegen, type AnlegenStatus } from "../actions";

const EINGABE =
  "w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600";

export default function Formular() {
  const [art, setArt] = useState("branche_online");
  const [status, aktion, laeuft] = useActionState(veranstaltungAnlegen, {
    fehler: null,
  } as AnlegenStatus);

  const online = art === "branche_online";

  return (
    <form action={aktion} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-gray-700">Art der Veranstaltung</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { wert: "branche_online", name: "Branchen-Call", text: "Online über Teams, für eine Branche" },
            { wert: "region_vor_ort", name: "Regionales Treffen", text: "Vor Ort, alle Branchen der Region" },
          ].map((o) => (
            <label
              key={o.wert}
              className={`cursor-pointer rounded-lg border p-4 ${art === o.wert ? "border-blue-600 bg-blue-50" : "border-gray-300"}`}
            >
              <input
                type="radio"
                name="art"
                value={o.wert}
                checked={art === o.wert}
                onChange={() => setArt(o.wert)}
                className="sr-only"
              />
              <span className="block font-semibold">{o.name}</span>
              <span className="block text-sm text-gray-600">{o.text}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="titel" className="mb-2 block text-sm font-semibold text-gray-700">Titel *</label>
        <input
          id="titel"
          name="titel"
          className={EINGABE}
          placeholder={online ? "z. B. Branchen-Call Handwerk: Fachkräfte finden" : "z. B. Community-Abend Münsterland"}
        />
      </div>

      {online ? (
        <div>
          <label htmlFor="branche" className="mb-2 block text-sm font-semibold text-gray-700">Branche *</label>
          <input id="branche" name="branche" className={EINGABE} placeholder="z. B. Handwerk, Hochzeit & Events, IT" />
        </div>
      ) : (
        <div>
          <label htmlFor="region" className="mb-2 block text-sm font-semibold text-gray-700">Region *</label>
          <input id="region" name="region" className={EINGABE} placeholder="z. B. Münsterland" />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="beginn" className="mb-2 block text-sm font-semibold text-gray-700">Beginn *</label>
          <input id="beginn" name="beginn" type="datetime-local" className={EINGABE} />
        </div>
        <div>
          <label htmlFor="ende" className="mb-2 block text-sm font-semibold text-gray-700">Ende *</label>
          <input id="ende" name="ende" type="datetime-local" className={EINGABE} />
        </div>
      </div>

      {online ? (
        <div>
          <label htmlFor="teams_link" className="mb-2 block text-sm font-semibold text-gray-700">Link zum Teams-Raum</label>
          <input id="teams_link" name="teams_link" type="url" className={EINGABE} placeholder="https://teams.microsoft.com/..." />
          <p className="mt-1 text-xs text-gray-500">Wird angemeldeten Mitgliedern in der App angezeigt.</p>
        </div>
      ) : (
        <div>
          <label htmlFor="ort" className="mb-2 block text-sm font-semibold text-gray-700">Ort / Adresse</label>
          <input id="ort" name="ort" className={EINGABE} placeholder="z. B. Café Central, Prinzipalmarkt 1, 48143 Münster" />
        </div>
      )}

      <div>
        <label htmlFor="beschreibung" className="mb-2 block text-sm font-semibold text-gray-700">Beschreibung</label>
        <textarea id="beschreibung" name="beschreibung" rows={4} className={EINGABE} placeholder="Ablauf, Thema, wer eingeladen ist …" />
      </div>

      {status.fehler && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{status.fehler}</p>
      )}

      <button
        type="submit"
        disabled={laeuft}
        className="rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {laeuft ? "Wird gespeichert …" : "Veranstaltung anlegen"}
      </button>
      <p className="text-xs text-gray-500">
        Nach dem Speichern bekommt die Veranstaltung automatisch einen
        Teilnahme-Code. Den nennst du während der Veranstaltung, damit die
        Teilnehmer einchecken und Punkte sammeln können.
      </p>
    </form>
  );
}
