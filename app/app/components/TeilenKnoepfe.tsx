"use client";

import { useEffect, useState } from "react";

/**
 * Knöpfe zum Teilen über WhatsApp, E-Mail-App und Zwischenablage.
 * onGeteilt wird nach dem Antippen aufgerufen (z. B. um den Kanal zu speichern).
 */
export default function TeilenKnoepfe({
  whatsapp,
  mailto,
  kopierText,
  kopierLabel = "Link kopieren",
  teilenText,
  teilenTitel,
  onGeteilt,
}: {
  whatsapp?: string;
  mailto?: string;
  kopierText?: string;
  kopierLabel?: string;
  /** Text für das Teilen-Menü des Handys (WhatsApp, SMS, Mail, …) */
  teilenText?: string;
  teilenTitel?: string;
  onGeteilt?: (kanal: "whatsapp" | "email" | "visitenkarte") => void;
}) {
  const [kopiert, setKopiert] = useState(false);
  const [kannTeilen, setKannTeilen] = useState(false);

  useEffect(() => {
    setKannTeilen(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  async function teilen() {
    if (!teilenText) return;
    try {
      await navigator.share({ title: teilenTitel, text: teilenText });
      onGeteilt?.("visitenkarte");
    } catch {
      // abgebrochen – nichts zu tun
    }
  }

  async function kopieren() {
    if (!kopierText) return;
    try {
      await navigator.clipboard.writeText(kopierText);
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2000);
      onGeteilt?.("visitenkarte");
    } catch {
      window.prompt("Zum Kopieren gedrückt halten:", kopierText);
    }
  }

  return (
    <div className="grid gap-3 sm:flex sm:flex-wrap">
      {kannTeilen && teilenText && (
        <button
          type="button"
          onClick={teilen}
          className="rounded-lg bg-blue-600 px-5 py-3 text-center text-sm font-semibold text-white"
        >
          Teilen …
        </button>
      )}

      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onGeteilt?.("whatsapp")}
          className="rounded-lg bg-[#25D366] px-5 py-3 text-center text-sm font-semibold text-white"
        >
          Per WhatsApp senden
        </a>
      )}

      {mailto && (
        <a
          href={mailto}
          onClick={() => onGeteilt?.("email")}
          className="rounded-lg bg-gray-900 px-5 py-3 text-center text-sm font-semibold text-white"
        >
          Per E-Mail senden
        </a>
      )}

      {kopierText && (
        <button
          type="button"
          onClick={kopieren}
          className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-center text-sm font-semibold"
        >
          {kopiert ? "Kopiert ✓" : kopierLabel}
        </button>
      )}
    </div>
  );
}
