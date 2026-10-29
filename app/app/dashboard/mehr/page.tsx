import type { Metadata } from "next";
import Link from "next/link";
import { aktuellesMitglied } from "@/lib/mitglied";
import { abmelden } from "../../anmelden/actions";
import AppInstallieren from "@/app/components/AppInstallieren";
import PushSchalter from "@/app/components/PushSchalter";

export const metadata: Metadata = {
  title: "Mehr",
};

const PARTNER_EINTRAEGE = [
  { name: "Mitglied werden", text: "Jahres- oder Halbjahresabo", href: "/dashboard/mitglied-werden" },
  { name: "Mein Profil", text: "Name, Firma und Kontaktdaten", href: "/dashboard/profil" },
];

const EINTRAEGE = [
  { name: "Meine Empfehlungen", text: "Gegebene Empfehlungen und Nachfragen", href: "/dashboard/empfehlungen" },
  { name: "Meine Aktivität", text: "Punkte, Stufe und Verlängerung", href: "/dashboard/aktivitaet" },
  { name: "Top im Netzwerk", text: "Aktivste Mitglieder und Partner", href: "/dashboard/top" },
  { name: "Mein Profil", text: "Name, Firma und Kontaktdaten", href: "/dashboard/profil" },
];

export default async function Mehr() {
  const { user, anzeigeName, istPartner } = await aktuellesMitglied();
  const eintraege = istPartner ? PARTNER_EINTRAEGE : EINTRAEGE;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-tinte">Mehr</h1>
      <p className="mt-1 truncate text-sm text-slate-500">{anzeigeName}</p>
      <p className="truncate text-sm text-slate-400">{user.email}</p>

      <ul className="mt-6 divide-y divide-linie overflow-hidden rounded-2xl border border-linie bg-white">
        {eintraege.map((e) => (
          <li key={e.href}>
            <Link href={e.href} className="flex items-center justify-between gap-4 px-5 py-4 active:bg-gray-50">
              <span className="min-w-0">
                <span className="block font-semibold">{e.name}</span>
                <span className="block truncate text-sm text-gray-500">{e.text}</span>
              </span>
              <span aria-hidden className="text-xl text-gray-300">›</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <PushSchalter />
      </div>

      <div className="mt-4">
        <AppInstallieren />
      </div>

      <form action={abmelden} className="mt-6">
        <button
          type="submit"
          className="w-full rounded-2xl border border-linie bg-white px-5 py-4 text-left font-semibold text-red-600 active:bg-gray-50"
        >
          Abmelden
        </button>
      </form>

      <p className="mt-8 flex gap-6 text-sm text-gray-500">
        <Link href="/impressum" className="underline">Impressum</Link>
        <Link href="/datenschutz" className="underline">Datenschutz</Link>
      </p>
    </div>
  );
}
