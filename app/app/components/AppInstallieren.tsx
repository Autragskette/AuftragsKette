"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void> };

/** Hinweis „Als App installieren“ – mit Knopf auf Android, Anleitung auf dem iPhone. */
export default function AppInstallieren() {
  const [installiert, setInstalliert] = useState(false);
  const [ios, setIos] = useState(false);
  const [angebot, setAngebot] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalliert(standalone);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const merken = (e: Event) => {
      e.preventDefault();
      setAngebot(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", merken);
    return () => window.removeEventListener("beforeinstallprompt", merken);
  }, []);

  if (installiert) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-900">
      <p className="font-semibold">AuftragsKette als App aufs Handy</p>
      {angebot ? (
        <>
          <p className="mt-1">Mit einem Tipp auf deinem Startbildschirm, wie jede andere App.</p>
          <button
            type="button"
            onClick={async () => {
              await angebot.prompt();
              setAngebot(null);
            }}
            className="mt-3 rounded-xl bg-kette px-5 py-2.5 font-semibold text-white"
          >
            App installieren
          </button>
        </>
      ) : ios ? (
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Unten in Safari auf das Teilen-Symbol tippen (Quadrat mit Pfeil).</li>
          <li>„Zum Home-Bildschirm“ wählen.</li>
          <li>Auf „Hinzufügen“ tippen. Fertig!</li>
        </ol>
      ) : (
        <ol className="mt-2 list-inside list-decimal space-y-1">
          <li>Im Browser oben rechts auf die drei Punkte tippen.</li>
          <li>„App installieren“ bzw. „Zum Startbildschirm hinzufügen“ wählen.</li>
        </ol>
      )}
    </div>
  );
}
