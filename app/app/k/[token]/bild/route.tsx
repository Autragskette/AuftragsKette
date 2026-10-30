import { ImageResponse } from "next/og";
import { visitenkarteLaden } from "@/lib/visitenkarte";

/**
 * Die Visitenkarte als Bild (1200 × 630). WhatsApp zeigt es als Vorschau,
 * wenn der Link zur Visitenkarte in einer Nachricht steht.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const k = await visitenkarteLaden(token);
  if (!k) return new Response("Nicht gefunden", { status: 404 });

  const empfohlen = [k.empfohlen_von, k.empfohlen_von_firma].filter(Boolean).join(", ");
  const ort = `${k.plz} ${k.ort}`.trim();

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#f3f5f8", padding: 40 }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            borderRadius: 32,
            overflow: "hidden",
            background: "#ffffff",
            boxShadow: "0 8px 30px rgba(19,41,75,0.12)",
          }}
        >
          {/* Linke Seite: Name, Firma, Leistung */}
          <div
            style={{
              width: 640,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              background: "#13294b",
              color: "#ffffff",
              padding: "48px 56px",
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                background: "#ffffff",
                color: "#13294b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                fontWeight: 700,
              }}
            >
              {k.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ marginTop: 32, fontSize: 56, fontWeight: 700, lineHeight: 1.1, display: "flex" }}>
              {k.name}
            </div>
            {k.firma && (
              <div style={{ marginTop: 12, fontSize: 34, color: "#cbd5e1", display: "flex" }}>{k.firma}</div>
            )}
            <div style={{ marginTop: 20, fontSize: 30, color: "#bfdbfe", display: "flex" }}>{k.leistung}</div>
          </div>

          {/* Rechte Seite: Erreichbarkeit */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "48px 44px",
              color: "#13294b",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {k.telefon && <Zeile titel="Telefon" wert={k.telefon} />}
              {k.email && <Zeile titel="E-Mail" wert={k.email} />}
              {ort && <Zeile titel="Ort" wert={ort} />}
            </div>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 22, color: "#64748b" }}>
              <div style={{ display: "flex" }}>Persönlich empfohlen von</div>
              <div style={{ display: "flex", fontWeight: 700, color: "#13294b", marginTop: 4 }}>{empfohlen}</div>
              <div style={{ display: "flex", marginTop: 14, color: "#2457d6", fontWeight: 700 }}>AuftragsKette</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=3600" },
    },
  );
}

function Zeile({ titel, wert }: { titel: string; wert: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", fontSize: 20, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 2 }}>
        {titel}
      </div>
      <div style={{ display: "flex", fontSize: 32, fontWeight: 600, marginTop: 4 }}>{wert}</div>
    </div>
  );
}
