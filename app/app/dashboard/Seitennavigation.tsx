"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENUE: { name: string; href: string | null }[] = [
  { name: "Übersicht", href: "/dashboard" },
  { name: "Mein Netzwerk", href: "/dashboard/netzwerk" },
  { name: "Suchen & Empfehlen", href: "/dashboard/suche" },
  { name: "Meine Empfehlungen", href: "/dashboard/empfehlungen" },
  { name: "Veranstaltungen", href: "/dashboard/veranstaltungen" },
  { name: "Meine Aktivität", href: "/dashboard/aktivitaet" },
  { name: "Top im Netzwerk", href: "/dashboard/top" },
  { name: "Mein Profil", href: "/dashboard/profil" },
];

export default function Seitennavigation() {
  const pfad = usePathname();

  return (
    <nav className="space-y-1">
      {MENUE.map((punkt) => {
        if (!punkt.href) {
          return (
            <span
              key={punkt.name}
              className="block shrink-0 cursor-default rounded-lg px-4 py-3 text-gray-400"
              title="Kommt in Kürze"
            >
              {punkt.name}
            </span>
          );
        }

        const aktiv =
          punkt.href === "/dashboard"
            ? pfad === "/dashboard"
            : pfad.startsWith(punkt.href);

        return (
          <Link
            key={punkt.name}
            href={punkt.href}
            aria-current={aktiv ? "page" : undefined}
            className={
              aktiv
                ? "block rounded-lg bg-blue-50 px-4 py-2.5 font-semibold text-kette"
                : "block rounded-lg px-4 py-2.5 text-gray-600 hover:bg-gray-50"
            }
          >
            {punkt.name}
          </Link>
        );
      })}
    </nav>
  );
}
