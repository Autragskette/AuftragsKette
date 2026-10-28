import { headers } from "next/headers";

/** Basis-Adresse der App, z. B. https://auftragskette.vercel.app */
export async function basisUrl() {
  const fest = process.env.NEXT_PUBLIC_SITE_URL;
  if (fest) return fest.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
