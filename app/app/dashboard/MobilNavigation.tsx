"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type Tab = {
  name: string;
  href: string;
  aktivBei: (pfad: string) => boolean;
  icon: ReactNode;
  hervorgehoben?: boolean;
};

const strich = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const TABS: Tab[] = [
  {
    name: "Start",
    href: "/dashboard",
    aktivBei: (p) => p === "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden {...strich}>
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    name: "Netzwerk",
    href: "/dashboard/netzwerk",
    aktivBei: (p) => p.startsWith("/dashboard/netzwerk"),
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden {...strich}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" />
        <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.1 2.4 3.5 5.2" />
      </svg>
    ),
  },
  {
    name: "Empfehlen",
    href: "/dashboard/suche",
    aktivBei: (p) => p.startsWith("/dashboard/suche") || p.startsWith("/dashboard/empfehlen/"),
    hervorgehoben: true,
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden {...strich}>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m20 20-4.6-4.6" />
      </svg>
    ),
  },
  {
    name: "Termine",
    href: "/dashboard/veranstaltungen",
    aktivBei: (p) => p.startsWith("/dashboard/veranstaltungen"),
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden {...strich}>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    name: "Mehr",
    href: "/dashboard/mehr",
    aktivBei: (p) =>
      ["/dashboard/mehr", "/dashboard/empfehlungen", "/dashboard/aktivitaet", "/dashboard/top", "/dashboard/profil"].some(
        (z) => p.startsWith(z),
      ),
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden {...strich}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    ),
  },
];

/** Untere Navigationsleiste auf dem Handy (ab Tablet-Breite ausgeblendet). */
export default function MobilNavigation() {
  const pfad = usePathname();

  return (
    <nav
      aria-label="Hauptnavigation"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-linie bg-white/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid h-[var(--tab-hoehe)] max-w-lg grid-cols-5">
        {TABS.map((tab) => {
          const aktiv = tab.aktivBei(pfad);
          return (
            <li key={tab.name} className="flex">
              <Link
                href={tab.href}
                aria-current={aktiv ? "page" : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                  aktiv ? "text-tinte" : "text-slate-400"
                }`}
              >
                {tab.hervorgehoben ? (
                  <span
                    className={`-mt-5 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg ${
                      aktiv ? "bg-tinte" : "bg-kette"
                    }`}
                  >
                    {tab.icon}
                  </span>
                ) : (
                  tab.icon
                )}
                <span>{tab.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
