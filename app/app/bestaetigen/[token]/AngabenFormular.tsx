"use client";

import { useActionState } from "react";
import { angabenSpeichern, type Angaben, type AngabenStatus } from "./actions";

/** Der eingeladene Kontakt ergänzt seine Angaben selbst und stimmt zu. */
export default function AngabenFormular({
  token,
  anfangswerte,
  modus,
}: {
  token: string;
  anfangswerte: Angaben;
  /** "zustimmen": erste Zustimmung, "aendern": Angaben später ändern */
  modus: "zustimmen" | "aendern";
}) {
  const [status, aktion, laeuft] = useActionState(angabenSpeichern.bind(null, token), {
    fehler: null,
    werte: anfangswerte,
    versuch: 0,
  } as AngabenStatus);
  const w = status.werte;
  const v = status.versuch;

  return (
    <form action={aktion} className="mt-6 space-y-4" noValidate>
      <input type="hidden" name="modus" value={modus} />

      <div>
        <p className="font-semibold text-gray-900">Deine Angaben</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Damit Kunden dich erreichen können, ergänze bitte deine Angaben. Sie
          sind nur für Mitglieder der AuftragsKette sichtbar und werden an
          Kunden weitergegeben, denen du empfohlen wirst. Ändern kannst du sie
          jederzeit über diesen Link.
        </p>
      </div>

      <Feld name="firma" label="Firma" wert={w.firma} versuch={v} fehler={status.feld === "firma"} autoComplete="organization" placeholder="z. B. Müller Elektrotechnik GmbH" />
      <Feld name="leistung" label="Wofür sollen wir dich empfehlen?" wert={w.leistung} versuch={v} fehler={status.feld === "leistung"} pflicht placeholder="z. B. Elektroinstallation" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Feld name="telefon" label="Telefon" type="tel" wert={w.telefon} versuch={v} fehler={status.feld === "telefon"} autoComplete="tel" placeholder="0170 1234567" />
        <Feld name="email" label="E-Mail" type="email" wert={w.email} versuch={v} fehler={status.feld === "email"} autoComplete="email" placeholder="name@unternehmen.de" />
      </div>
      <p className="-mt-2 text-xs text-slate-500">Mindestens Telefon oder E-Mail, damit Kunden dich erreichen.</p>
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <Feld name="plz" label="PLZ" wert={w.plz} versuch={v} fehler={status.feld === "plz"} pflicht autoComplete="postal-code" inputMode="numeric" placeholder="12345" />
        <Feld name="ort" label="Ort" wert={w.ort} versuch={v} fehler={status.feld === "ort"} pflicht autoComplete="address-level2" placeholder="z. B. Münster" />
      </div>

      {modus === "zustimmen" && (
        <>
          <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
            <input type="checkbox" name="einverstanden" required className="mt-1 h-4 w-4 shrink-0" />
            <span>
              Ich bin einverstanden, dass meine Angaben Mitgliedern der
              AuftragsKette angezeigt und an Kunden weitergegeben werden, denen
              ich empfohlen werde. Meine Zustimmung kann ich jederzeit über
              diesen Link widerrufen.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm leading-6 text-slate-700">
            <input type="checkbox" name="mitglied" className="mt-1 h-4 w-4 shrink-0" />
            <span>
              Ich interessiere mich auch dafür, selbst Mitglied zu werden und
              meine eigenen Kontakte einzuladen.
            </span>
          </label>
        </>
      )}

      {status.fehler && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.fehler}
        </p>
      )}

      <button
        type="submit"
        disabled={laeuft}
        className="w-full rounded-xl bg-tinte px-6 py-3 font-semibold text-white disabled:opacity-60"
      >
        {laeuft ? "Wird gespeichert …" : modus === "zustimmen" ? "Zustimmen und Angaben speichern" : "Angaben speichern"}
      </button>
    </form>
  );
}

function Feld({
  name,
  label,
  wert,
  versuch,
  fehler,
  pflicht,
  type = "text",
  ...rest
}: {
  name: keyof Angaben;
  label: string;
  wert: string;
  versuch: number;
  fehler: boolean;
  pflicht?: boolean;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={`a-${name}`} className="mb-1.5 block text-sm font-semibold text-gray-700">
        {label}
        {pflicht && <span className="text-red-500"> *</span>}
      </label>
      <input
        key={`${name}-${versuch}`}
        id={`a-${name}`}
        name={name}
        type={type}
        defaultValue={wert}
        aria-invalid={fehler}
        className={`w-full rounded-xl border px-4 py-3 outline-none focus:border-kette ${fehler ? "border-red-400" : "border-linie"}`}
        {...rest}
      />
    </div>
  );
}
