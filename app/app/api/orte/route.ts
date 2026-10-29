import { ortVorschlaege } from "@/lib/geo";

/** Vorschläge für die Ortseingabe: /api/orte?q=Mün */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json(ortVorschlaege(q.slice(0, 40)), {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
