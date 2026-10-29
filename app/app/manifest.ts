import type { MetadataRoute } from "next";

/** Macht AuftragsKette als App auf dem Startbildschirm installierbar. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AuftragsKette",
    short_name: "AuftragsKette",
    description:
      "Das Unternehmernetzwerk, aus dem Aufträge entstehen: Kontakte, Empfehlungen und Veranstaltungen.",
    lang: "de",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f9fafb",
    theme_color: "#2563eb",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Empfehlen", url: "/dashboard/suche" },
      { name: "Kontakt hinzufügen", url: "/dashboard/netzwerk/neu" },
      { name: "Veranstaltungen", url: "/dashboard/veranstaltungen" },
    ],
  };
}
