import { vcard, visitenkarteLaden } from "@/lib/visitenkarte";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const karte = await visitenkarteLaden(token);
  if (!karte) return new Response("Nicht gefunden", { status: 404 });

  const dateiname = karte.name.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "kontakt";

  return new Response(vcard(karte), {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(dateiname)}.vcf"; filename*=UTF-8''${encodeURIComponent(dateiname)}.vcf`,
      "Cache-Control": "no-store",
    },
  });
}
