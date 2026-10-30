"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { empfehlungAnlegen } from "@/app/dashboard/empfehlungen/actions";

const EINGABE =
  "w-full rounded-xl border border-linie bg-white px-4 py-3.5 text-tinte placeholder:text-slate-400 outline-none focus:border-kette";

/**
 * Empfehlen mit einem Tipp: öffnet ein kleines Fenster für Name und
 * Handynummer des Kunden. „Per WhatsApp senden“ legt die Empfehlung an und
 * öffnet WhatsApp direkt im Chat mit dieser Nummer, auch wenn der Kunde
 * nicht im Telefonbuch gespeichert ist.
 */
export default function SchnellEmpfehlen({
  kontaktId,
  partnerName,
  breit = false,
}: {
  kontaktId: string;
  /** Für die Überschrift im Fenster */
  partnerName?: string;
  /** Volle Breite (z. B. auf der Kontaktseite) */
  breit?: boolean;
}) {
  const router = useRouter();
  const [offen, setOffen] = useState(false);
  const [laeuft, starten] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);
  const nameFeld = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!offen) return;
    nameFeld.current?.focus();
    const schliessen = (e: KeyboardEvent) => e.key === "Escape" && setOffen(false);
    window.addEventListener("keydown", schliessen);
    return () => window.removeEventListener("keydown", schliessen);
  }, [offen]);

  function senden(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFehler(null);
    const daten = new FormData(e.currentTarget);
    daten.set("kanal", "whatsapp");
    starten(async () => {
      const status = await empfehlungAnlegen(kontaktId, { fehler: null }, daten);
      if (status.fehler || !status.weiter) {
        setFehler(status.fehler ?? "Das hat nicht geklappt. Bitte erneut versuchen.");
        return;
      }
      const ziel = `/dashboard/empfehlungen/${status.weiter.id}?neu=1`;
      setOffen(false);
      if (status.weiter.whatsapp) {
        window.location.href = status.weiter.whatsapp;
        setTimeout(() => router.push(ziel), 900);
      } else {
        router.push(ziel);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOffen(true)}
        className={`flex items-center justify-center gap-1.5 rounded-xl bg-[#1fa855] font-semibold text-white ${
          breit ? "w-full px-5 py-3.5" : "px-3.5 py-2.5 text-sm"
        }`}
      >
        <WhatsAppZeichen />
        {breit ? "Per WhatsApp empfehlen" : "Empfehlen"}
      </button>

      {offen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setOffen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`empfehlen-${kontaktId}`}
            className="pb-safe w-full max-w-md rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={`empfehlen-${kontaktId}`} className="text-lg font-semibold text-tinte">
                {partnerName ? `${partnerName} empfehlen` : "Empfehlen"}
              </h2>
              <button
                type="button"
                onClick={() => setOffen(false)}
                aria-label="Schließen"
                className="-mr-1 -mt-1 rounded-full p-1.5 text-slate-400 hover:text-slate-700"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-500">An wen geht die Empfehlung?</p>

            <form onSubmit={senden} className="mt-4 space-y-3">
              <label htmlFor={`kn-${kontaktId}`} className="sr-only">Name des Kunden</label>
              <input
                ref={nameFeld}
                id={`kn-${kontaktId}`}
                name="kunde_name"
                autoComplete="off"
                className={EINGABE}
                placeholder="Name des Kunden, z. B. Familie Schmidt"
              />
              <label htmlFor={`kt-${kontaktId}`} className="sr-only">Handynummer des Kunden</label>
              <input
                id={`kt-${kontaktId}`}
                name="kunde_telefon"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                className={EINGABE}
                placeholder="Handynummer des Kunden"
              />
              <p className="text-xs leading-5 text-slate-500">
                Mit Nummer öffnet WhatsApp direkt den Chat mit dem Kunden, auch
                wenn er nicht in deinen Kontakten gespeichert ist.
              </p>

              {fehler && (
                <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                  {fehler}
                </p>
              )}

              <button
                type="submit"
                disabled={laeuft}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1fa855] px-5 py-4 text-base font-semibold text-white disabled:opacity-60"
              >
                <WhatsAppZeichen />
                {laeuft ? "Wird vorbereitet …" : "Per WhatsApp senden"}
              </button>
              <Link
                href={`/dashboard/empfehlen/${kontaktId}`}
                className="block py-1 text-center text-sm font-semibold text-slate-500"
              >
                Anders senden (E-Mail, SMS, Link)
              </Link>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function WhatsAppZeichen() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5 0a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}
