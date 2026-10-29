"use client";

import { useEffect, useState } from "react";
import { pushAbmelden, pushSpeichern } from "@/app/dashboard/push-actions";

type Zustand = "laedt" | "nicht_moeglich" | "ios_installieren" | "aus" | "an" | "blockiert";

function schluesselBytes(b64: string) {
  const rein = (b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const roh = atob(rein);
  return Uint8Array.from(roh, (z) => z.charCodeAt(0));
}

/** Push-Nachrichten auf diesem Gerät ein- oder ausschalten. */
export default function PushSchalter({ text }: { text?: string }) {
  const [zustand, setZustand] = useState<Zustand>("laedt");
  const [fehler, setFehler] = useState<string | null>(null);
  const oeffentlich = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    (async () => {
      const unterstuetzt = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;

      if (!unterstuetzt || !oeffentlich) {
        setZustand(ios && !standalone ? "ios_installieren" : "nicht_moeglich");
        return;
      }
      if (Notification.permission === "denied") {
        setZustand("blockiert");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const abo = await reg.pushManager.getSubscription();
      setZustand(abo ? "an" : "aus");
    })().catch(() => setZustand("nicht_moeglich"));
  }, [oeffentlich]);

  async function einschalten() {
    setFehler(null);
    try {
      const erlaubnis = await Notification.requestPermission();
      if (erlaubnis !== "granted") {
        setZustand(erlaubnis === "denied" ? "blockiert" : "aus");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const abo =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: schluesselBytes(oeffentlich!),
        }));
      const json = abo.toJSON();
      const ok = await pushSpeichern({
        endpoint: abo.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });
      if (!ok) throw new Error("speichern");
      setZustand("an");
    } catch {
      setFehler("Das hat nicht geklappt. Bitte versuche es noch einmal.");
    }
  }

  async function ausschalten() {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    const abo = await reg?.pushManager.getSubscription();
    if (abo) {
      await pushAbmelden(abo.endpoint);
      await abo.unsubscribe();
    }
    setZustand("aus");
  }

  if (zustand === "laedt") return null;

  return (
    <div className="rounded-2xl border border-linie bg-white p-5 text-sm leading-6">
      <p className="font-semibold text-tinte">Benachrichtigungen aufs Handy</p>
      {zustand === "an" && (
        <>
          <p className="mt-1 text-slate-600">Eingeschaltet. Du erfährst sofort, wenn du empfohlen wirst.</p>
          <button type="button" onClick={ausschalten} className="mt-3 text-sm font-medium text-slate-500 underline">
            Auf diesem Gerät ausschalten
          </button>
        </>
      )}
      {zustand === "aus" && (
        <>
          <p className="mt-1 text-slate-600">
            {text ?? "Erfahre sofort, wenn dich jemand an einen Kunden empfiehlt."}
          </p>
          <button
            type="button"
            onClick={einschalten}
            className="mt-3 rounded-xl bg-kette px-5 py-3 text-sm font-semibold text-white"
          >
            Benachrichtigungen einschalten
          </button>
        </>
      )}
      {zustand === "ios_installieren" && (
        <p className="mt-1 text-slate-600">
          Auf dem iPhone gehen Benachrichtigungen, sobald du AuftragsKette auf
          deinen Startbildschirm legst: In Safari auf Teilen tippen, dann
          „Zum Home-Bildschirm“. Danach die App öffnen und hier einschalten.
        </p>
      )}
      {zustand === "blockiert" && (
        <p className="mt-1 text-slate-600">
          Benachrichtigungen sind für AuftragsKette blockiert. Du kannst sie in
          den Einstellungen deines Browsers oder Handys wieder erlauben.
        </p>
      )}
      {zustand === "nicht_moeglich" && (
        <p className="mt-1 text-slate-600">Dieses Gerät oder dieser Browser unterstützt keine Benachrichtigungen.</p>
      )}
      {fehler && <p className="mt-2 text-red-700">{fehler}</p>}
    </div>
  );
}
