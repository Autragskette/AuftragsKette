"use client";

import { useState } from "react";

/**
 * Knöpfe zum Teilen über WhatsApp, E-Mail-App und Zwischenablage.
 * onGeteilt wird nach dem Antippen aufgerufen (z. B. um den Kanal zu speichern).
 */
export default function TeilenKnoepfe({
  whatsapp,
  mailto,
  kopierText,
  kopierLabel = "Link kopieren",
  onGeteilt,
}: {
  whatsapp?: string;
  mailto?: string;
  kopierText?: string;
  kopierLabel?: string;
  onGeteilt?: (kanal: "whatsapp" | "email" | "visitenkarte") => void;
}) {
  const [kopiert, setKopiert] = useState(false);

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
    <div className="flex flex-wrap gap-3">
      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onGeteilt?.("whatsapp")}
          className="rounded-lg bg-[#25D366] px-5 py-3 text-sm font-semibold text-white"
        >
          Per WhatsApp senden
        </a>
      )}

      {mailto && (
        <a
          href={mailto}
          onClick={() => onGeteilt?.("email")}
          className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
        >
          Per E-Mail senden
        </a>
      )}

      {kopierText && (
        <button
          type="button"
          onClick={kopieren}
          className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold"
        >
          {kopiert ? "Kopiert ✓" : kopierLabel}
        </button>
      )}
    </div>
  );
}
