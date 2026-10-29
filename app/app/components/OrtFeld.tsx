"use client";

import { useEffect, useId, useRef, useState } from "react";

/** Eingabe für PLZ oder Ort mit Vorschlägen aus dem Ortsverzeichnis. */
export default function OrtFeld({
  name,
  standard,
  className,
  placeholder = "PLZ oder Ort",
  id,
}: {
  name: string;
  standard?: string;
  className?: string;
  placeholder?: string;
  id?: string;
}) {
  const listeId = useId();
  const [wert, setWert] = useState(standard ?? "");
  const [vorschlaege, setVorschlaege] = useState<string[]>([]);
  const zeit = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (zeit.current) clearTimeout(zeit.current);
    if (wert.trim().length < 2) {
      setVorschlaege([]);
      return;
    }
    zeit.current = setTimeout(async () => {
      try {
        const antwort = await fetch(`/api/orte?q=${encodeURIComponent(wert.trim())}`);
        if (antwort.ok) setVorschlaege(await antwort.json());
      } catch {
        // Vorschläge sind nur eine Hilfe
      }
    }, 200);
  }, [wert]);

  return (
    <>
      <input
        id={id}
        name={name}
        value={wert}
        onChange={(e) => setWert(e.target.value)}
        list={listeId}
        autoComplete="off"
        enterKeyHint="search"
        placeholder={placeholder}
        className={className}
      />
      <datalist id={listeId}>
        {vorschlaege.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
    </>
  );
}
