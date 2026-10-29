"use client";

import Link from "next/link";
import { useActionState, useState, useTransition, type FormEvent } from "react";
import {
  kontaktSpeichern,
  netzwerkKontaktEinladen,
  netzwerkSuchen,
  type KontaktFelder,
  type KontaktStatus,
  type NetzwerkTreffer,
} from "./actions";

const LEER: KontaktFelder = { name: "", leistung: "", notiz: "" };

/**
 * Kontakt einladen bzw. bearbeiten.
 * Der Einladende trägt nur Name, Leistung und eine eigene Notiz ein; Firma,
 * Telefon, E-Mail und Adresse ergänzt der Kontakt selbst bei der Zustimmung.
 */
export default function KontaktFormular({
  id = null,
  anfangswerte = LEER,
  herkunft = "persoenlich",
  nurNotiz = false,
}: {
  id?: string | null;
  anfangswerte?: KontaktFelder;
  /** Nur beim Anlegen wählbar */
  herkunft?: "persoenlich" | "netzwerk";
  /** Bestätigter Kontakt: seine Angaben gehören ihm, nur die Notiz ist änderbar */
  nurNotiz?: boolean;
}) {
  const [art, setArt] = useState(herkunft);

  return (
    <div className="space-y-5 rounded-2xl border border-linie bg-white p-4 sm:p-6">
      {!id && (
        <fieldset>
          <legend className="mb-2 block text-sm font-semibold text-gray-700">
            Woher kennst du den Betrieb?
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <Herkunft
              wert="persoenlich"
              aktiv={art}
              setzen={setArt}
              titel="Persönlich"
              text="Ich kenne die Arbeit aus eigener Erfahrung. Zählt als Startkontakt."
            />
            <Herkunft
              wert="netzwerk"
              aktiv={art}
              setzen={setArt}
              titel="Über die AuftragsKette"
              text="Kennengelernt bei einer Veranstaltung oder über eine Empfehlung."
            />
          </div>
        </fieldset>
      )}

      {!id && art === "netzwerk" ? (
        <NetzwerkSuche />
      ) : (
        <Formular id={id} anfangswerte={anfangswerte} nurNotiz={nurNotiz} />
      )}
    </div>
  );
}

function Formular({
  id,
  anfangswerte,
  nurNotiz,
}: {
  id: string | null;
  anfangswerte: KontaktFelder;
  nurNotiz: boolean;
}) {
  const [status, aktion, laeuft] = useActionState(kontaktSpeichern.bind(null, id), {
    fehler: null,
    feldFehler: {},
    werte: anfangswerte,
    versuch: 0,
  } as KontaktStatus);

  const w = status.werte;
  const f = status.feldFehler;
  const v = status.versuch;

  return (
    <form action={aktion} noValidate className="space-y-5">
      {!nurNotiz && (
        <>
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
            name="leistung"
            label="Wofür würdest du sie oder ihn empfehlen?"
            pflicht
            versuch={v}
            wert={w.leistung}
            fehler={f.leistung}
            placeholder="z. B. Elektroinstallation, Steuerberatung, Webdesign"
          />
        </>
      )}

      <div>
        <label htmlFor="notiz" className="mb-2 block text-sm font-semibold text-gray-700">
          Notiz <span className="font-normal text-gray-400">(nur für dich)</span>
        </label>
        <textarea
          key={`notiz-${v}`}
          id="notiz"
          name="notiz"
          rows={3}
          defaultValue={w.notiz}
          placeholder="Woher kennst du den Kontakt? Was macht ihn besonders gut?"
          aria-invalid={Boolean(f.notiz)}
          className={eingabeKlassen(Boolean(f.notiz))}
        />
        {f.notiz && <Fehlertext text={f.notiz} />}
      </div>

      {!id && (
        <p className="text-sm leading-6 text-slate-500">
          Mehr brauchst du nicht. Firma, Telefon und Adresse ergänzt der Kontakt
          selbst, wenn er zustimmt.
        </p>
      )}

      {status.fehler && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.fehler}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={laeuft}
          className="w-full rounded-xl bg-tinte px-6 py-3 font-semibold text-white disabled:opacity-60 sm:w-auto"
        >
          {laeuft ? "Wird gespeichert …" : id ? "Änderungen speichern" : "Weiter zur Einladung"}
        </button>
        <Link href="/dashboard/netzwerk" className="rounded-lg px-4 py-3 font-semibold text-gray-600 hover:text-gray-900">
          Abbrechen
        </Link>
      </div>
    </form>
  );
}

/** Über die AuftragsKette kennengelernt: Betrieb im Netzwerk suchen und einladen */
function NetzwerkSuche() {
  const [eingabe, setEingabe] = useState("");
  const [treffer, setTreffer] = useState<NetzwerkTreffer[] | null>(null);
  const [laeuft, starten] = useTransition();

  function suchen(e: FormEvent) {
    e.preventDefault();
    starten(async () => setTreffer(await netzwerkSuchen(eingabe)));
  }

  return (
    <div>
      <p className="text-sm leading-6 text-slate-600">
        Such den Betrieb, den du in der AuftragsKette kennengelernt hast. Er
        bekommt eine Einladung und bestätigt selbst.
      </p>
      <form onSubmit={suchen} className="mt-3 flex gap-2" role="search">
        <input
          type="search"
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          placeholder="Name, Firma oder Gewerk"
          className="min-w-0 flex-1 rounded-xl border border-linie px-4 py-3 outline-none focus:border-kette"
        />
        <button
          type="submit"
          disabled={laeuft || eingabe.trim().length < 2}
          className="shrink-0 rounded-xl bg-tinte px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {laeuft ? "…" : "Suchen"}
        </button>
      </form>

      {treffer && treffer.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">Niemanden gefunden. Versuch es mit einem anderen Begriff.</p>
      )}
      {treffer && treffer.length > 0 && (
        <ul className="mt-4 divide-y divide-linie overflow-hidden rounded-xl border border-linie">
          {treffer.map((t) => (
            <li key={t.id} className="flex items-center gap-3 p-3.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-tinte">{t.firma || t.name}</p>
                <p className="truncate text-sm text-slate-600">
                  {t.leistung}
                  {t.firma && <span className="text-slate-400">, {t.name}</span>}
                </p>
                <p className="text-xs text-slate-500">{t.ort || t.plz}</p>
              </div>
              {t.schonDrin ? (
                <span className="shrink-0 text-xs font-semibold text-slate-400">Schon in deinem Netzwerk</span>
              ) : (
                <form action={netzwerkKontaktEinladen.bind(null, t.id)}>
                  <button type="submit" className="shrink-0 rounded-xl bg-kette px-4 py-2.5 text-sm font-semibold text-white">
                    Einladen
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Herkunft({
  wert,
  aktiv,
  setzen,
  titel,
  text,
}: {
  wert: "persoenlich" | "netzwerk";
  aktiv: string;
  setzen: (w: "persoenlich" | "netzwerk") => void;
  titel: string;
  text: string;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-linie p-3.5 has-[:checked]:border-kette has-[:checked]:bg-blue-50/50">
      <input
        type="radio"
        name="herkunft_wahl"
        value={wert}
        checked={aktiv === wert}
        onChange={() => setzen(wert)}
        className="mt-1 h-4 w-4"
      />
      <span>
        <span className="block font-semibold text-tinte">{titel}</span>
        <span className="block text-sm leading-5 text-slate-600">{text}</span>
      </span>
    </label>
  );
}

function eingabeKlassen(fehler: boolean) {
  return `w-full rounded-lg border px-4 py-3 outline-none focus:border-kette ${
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
  placeholder,
  autoComplete,
}: {
  name: keyof KontaktFelder;
  label: string;
  wert: string;
  versuch: number;
  fehler?: string;
  pflicht?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
        {pflicht && <span className="text-red-500"> *</span>}
      </label>
      <input
        // Neuer key je Versuch: zeigt die Eingaben nach einem Fehler wieder an
        key={`${name}-${versuch}`}
        id={name}
        name={name}
        type="text"
        defaultValue={wert}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(fehler)}
        className={eingabeKlassen(Boolean(fehler))}
      />
      {fehler && <Fehlertext text={fehler} />}
    </div>
  );
}
