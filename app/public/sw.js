/* AuftragsKette: Push-Nachrichten */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let daten = {};
  try {
    daten = event.data ? event.data.json() : {};
  } catch {
    daten = { text: event.data ? event.data.text() : "" };
  }
  const titel = daten.titel || "AuftragsKette";
  event.waitUntil(
    self.registration.showNotification(titel, {
      body: daten.text || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: daten.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const ziel = new URL(event.notification.data?.url || "/dashboard", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenster) => {
      for (const f of fenster) {
        if (f.url.startsWith(self.location.origin) && "focus" in f) {
          f.navigate(ziel);
          return f.focus();
        }
      }
      return self.clients.openWindow(ziel);
    }),
  );
});
