import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} AuftragsKette</p>

        <nav className="flex gap-6">
          <Link href="/impressum" className="hover:text-gray-900">
            Impressum
          </Link>
          <Link href="/datenschutz" className="hover:text-gray-900">
            Datenschutz
          </Link>
        </nav>
      </div>
    </footer>
  );
}
