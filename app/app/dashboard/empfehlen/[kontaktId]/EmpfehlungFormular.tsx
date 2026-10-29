"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  empfehlungAnlegen,
  type EmpfehlungStatus,
} from "../../empfehlungen/actions";

const EINGABE =
  "w-full rounded-xl border border-linie bg-white px-4 py-3.5 text-tinte placeholder:text-slate-400 outline-none focus:border-kette";

/**
 * Empfehlen in einem Schritt: optional Name und Handynummer des Kunden,
 * dann „Per WhatsApp senden“ (öffnet WhatsApp mit fertigem Text)
 * oder „Anders senden“ (E-Mail, Teilen-Menü, Visitenkarte).
 */
export default function EmpfehlungFormular({ kontaktId }: { kontaktId: string }) {
  const router = useRouter();
  const [mehr, setMehr] = useState(false);
  const [status, aktion, laeuft] = useActionState(
    empfehlungAnlegen.bind(null, kontaktId),
    { fehler: null } as EmpfehlungStatus,
  );

  useEffect(() => {
    const weiter = status.weiter;
    if (!weiter) return;
    const ziel = `/dashboard/empfehlungen/${weiter.id}?neu=1`;
    if (weiter.whatsapp) {
      window.location.href = weiter.whatsapp;
      const t = setTimeout(() => router.replace(ziel), 900);
      return () => clearTimeout(t);
    }
    router.replace(ziel);
  }, [status.weiter, router]);

  return (
    <form action={aktion} className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-linie bg-white p-4">
        <p className="text-sm font-semibold text-tinte">An wen geht die Empfehlung?</p>
        <label htmlFor="kunde_name" className="sr-only">Name des Kunden</label>
        <input
          id="kunde_name"
          name="kunde_name"
          autoComplete="off"
          className={EINGABE}
          placeholder="Name des Kunden (optional)"
        />
        <label htmlFor="kunde_telefon" className="sr-only">Handynummer des Kunden</label>
        <input
          id="kunde_telefon"
          name="kunde_telefon"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          className={EINGABE}
          placeholder="Handynummer (optional, für WhatsApp)"
        />

        {mehr ? (
          <>
            <label htmlFor="kunde_email" className="sr-only">E-Mail des Kunden</label>
            <input id="kunde_email" name="kunde_email" type="email" className={EINGABE} placeholder="E-Mail des Kunden (optional)" />
            <label htmlFor="nachricht" className="sr-only">Persönliche Nachricht</label>
            <textarea
              id="nachricht"
              name="nachricht"
              rows={3}
              className={EINGABE}
              placeholder="Eigene Nachricht (sonst passender Standardtext)"
            />
          </>
        ) : (
          <button
            type="button"
            onClick={() => setMehr(true)}
            className="text-sm font-semibold text-kette"
          >
            E-Mail oder eigene Nachricht hinzufügen
          </button>
        )}

        <label className="flex items-start gap-3 pt-1 text-sm leading-6 text-slate-600">
          <input type="checkbox" name="nachfrage_erlaubt" className="mt-1 h-4 w-4 accent-kette" />
          <span>Der Kunde ist einverstanden, dass ich nach einer Woche einmal nachfrage.</span>
        </label>
      </div>

      {status.fehler && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.fehler}
        </p>
      )}

      <button
        type="submit"
        name="kanal"
        value="whatsapp"
        disabled={laeuft || Boolean(status.weiter)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1fa855] px-5 py-4 text-base font-semibold text-white disabled:opacity-60"
      >
        <WhatsAppZeichen />
        {laeuft ? "Wird vorbereitet …" : "Per WhatsApp senden"}
      </button>
      <button
        type="submit"
        name="kanal"
        value="andere"
        disabled={laeuft || Boolean(status.weiter)}
        className="w-full rounded-xl border border-linie bg-white px-5 py-3.5 font-semibold text-tinte disabled:opacity-60"
      >
        Anders senden (E-Mail, SMS, Link)
      </button>
    </form>
  );
}

function WhatsAppZeichen() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5 0a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}
