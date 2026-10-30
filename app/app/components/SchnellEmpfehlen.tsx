"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { empfehlungAnlegen } from "@/app/dashboard/empfehlungen/actions";

/**
 * Empfehlen mit einem Tipp: legt die Empfehlung an und öffnet WhatsApp
 * mit dem fertigen Text. Den Kunden wählt man in WhatsApp selbst aus.
 */
export default function SchnellEmpfehlen({
  kontaktId,
  breit = false,
}: {
  kontaktId: string;
  /** Volle Breite (z. B. auf der Kontaktseite) */
  breit?: boolean;
}) {
  const router = useRouter();
  const [laeuft, starten] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);

  function empfehlen() {
    setFehler(null);
    starten(async () => {
      const daten = new FormData();
      daten.set("kanal", "whatsapp");
      const status = await empfehlungAnlegen(kontaktId, { fehler: null }, daten);
      if (status.fehler || !status.weiter) {
        setFehler(status.fehler ?? "Das hat nicht geklappt. Bitte erneut versuchen.");
        return;
      }
      const ziel = `/dashboard/empfehlungen/${status.weiter.id}?neu=1`;
      if (status.weiter.whatsapp) {
        window.location.href = status.weiter.whatsapp;
        setTimeout(() => router.push(ziel), 900);
      } else {
        router.push(ziel);
      }
    });
  }

  return (
    <div className={breit ? "w-full" : undefined}>
      <button
        type="button"
        onClick={empfehlen}
        disabled={laeuft}
        className={`flex items-center justify-center gap-1.5 rounded-xl bg-[#1fa855] font-semibold text-white disabled:opacity-60 ${
          breit ? "w-full px-5 py-3.5" : "px-3.5 py-2.5 text-sm"
        }`}
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5 0a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3a.5.5 0 0 0 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
        </svg>
        {laeuft ? "…" : breit ? "Per WhatsApp empfehlen" : "Empfehlen"}
      </button>
      {fehler && <p className="mt-1.5 max-w-56 text-xs text-red-700">{fehler}</p>}
    </div>
  );
}
