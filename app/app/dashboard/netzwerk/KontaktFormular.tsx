"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  kontaktSpeichern,
  type KontaktFelder,
  type KontaktStatus,
} from "./actions";

const LEER: KontaktFelder = {
  name: "",
  firma: "",
  leistung: "",
  email: "",
  telefon: "",
  plz: "",
  ort: "",
  notiz: "",
};

export default function KontaktFormular({
  id = null,
  anfangswerte = LEER,
}: {
  id?: string | null;
  anfangswerte?: KontaktFelder;
}) {
  const [status, aktion, laeuft] = useActionState(
    kontaktSpeichern.bind(null, id),
    { fehler: null, feldFehler: {}, werte: anfangswerte, versuch: 0 } as KontaktStatus,
  );

  const w = status.werte;
  const f = status.feldFehler;
  const v = status.versuch;

  return (
    <form
      action={aktion}
      noValidate
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-6"
    >
      <Feld
        name="name"
        label="Name"
        pflicht
        versuch={v}
        wert={w.name}
        fehler={f.name}
        placeholder="Vor- und Nachname"
        autoComplete="name"
      />

      <Feld
        name="firma"
        label="Firma"
        versuch={v}
        wert={w.firma}
        fehler={f.firma}
        placeholder="z. B. Müller Elektrotechnik GmbH"
        autoComplete="organization"
      />

      <Feld
        name="leistung"
        label="Wofür würdest du sie oder ihn empfehlen?"
        pflicht
        versuch={v}
        wert={w.leistung}
        fehler={f.leistung}
        placeholder="z. B. Elektroinstallation, Steuerberatung, Webdesign"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Feld
          name="email"
          label="E-Mail-Adresse"
          type="email"
          versuch={v}
        wert={w.email}
          fehler={f.email}
          placeholder="name@unternehmen.de"
          autoComplete="email"
        />

        <Feld
          name="telefon"
          label="Telefon"
          type="tel"
          versuch={v}
        wert={w.telefon}
          fehler={f.telefon}
          placeholder="0170 1234567"
          autoComplete="tel"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
        <Feld
          name="plz"
          label="PLZ"
          pflicht
          versuch={v}
          wert={w.plz}
          fehler={f.plz}
          placeholder="12345"
          autoComplete="postal-code"
          inputMode="numeric"
        />

        <Feld
          name="ort"
          label="Ort"
          pflicht
          versuch={v}
          wert={w.ort}
          fehler={f.ort}
          placeholder="z. B. Münster"
          autoComplete="address-level2"
        />
      </div>

      <div>
        <label
          htmlFor="notiz"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Notiz <span className="font-normal text-gray-400">(nur für dich)</span>
        </label>
        <textarea
          key={`notiz-${v}`}
          id="notiz"
          name="notiz"
          rows={4}
          defaultValue={w.notiz}
          placeholder="Woher kennst du den Kontakt? Was macht ihn besonders gut?"
          aria-invalid={Boolean(f.notiz)}
          className={eingabeKlassen(Boolean(f.notiz))}
        />
        {f.notiz && <Fehlertext text={f.notiz} />}
      </div>

      {status.fehler && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {status.fehler}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={laeuft}
          className="rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white disabled:opacity-60"
        >
          {laeuft ? "Wird gespeichert …" : id ? "Änderungen speichern" : "Kontakt speichern"}
        </button>

        <Link
          href="/dashboard/netzwerk"
          className="rounded-lg px-4 py-3 font-semibold text-gray-600 hover:text-gray-900"
        >
          Abbrechen
        </Link>
      </div>
    </form>
  );
}

function eingabeKlassen(fehler: boolean) {
  return `w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-600 ${
    fehler ? "border-red-400" : "border-gray-300"
  }`;
}

function Fehlertext({ text }: { text: string }) {
  return <p className="mt-1.5 text-sm text-red-600">{text}</p>;
}

function Feld({
  name,
  label,
  wert,
  versuch,
  fehler,
  pflicht = false,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
}: {
  name: keyof KontaktFelder;
  label: string;
  wert: string;
  versuch: number;
  fehler?: string;
  pflicht?: boolean;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-gray-700"
      >
        {label}
        {pflicht && <span className="text-red-500"> *</span>}
      </label>
      <input
        // Neuer key je Versuch: zeigt die Eingaben nach einem Fehler wieder an
        key={`${name}-${versuch}`}
        id={name}
        name={name}
        type={type}
        defaultValue={wert}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={Boolean(fehler)}
        className={eingabeKlassen(Boolean(fehler))}
      />
      {fehler && <Fehlertext text={fehler} />}
    </div>
  );
}
