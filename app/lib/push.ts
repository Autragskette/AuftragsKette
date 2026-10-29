import {
  createCipheriv,
  createECDH,
  createPrivateKey,
  createSign,
  hkdfSync,
  randomBytes,
} from "node:crypto";

/**
 * Web-Push nach RFC 8291 (Verschlüsselung aes128gcm) und RFC 8292 (VAPID),
 * ohne Zusatzpaket. Schlüssel kommen aus den Umgebungsvariablen:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  (öffentlich, base64url, 65 Byte)
 *   VAPID_PRIVATE_KEY             (geheim, base64url, 32 Byte)
 */

export type PushAbo = { endpoint: string; p256dh: string; auth: string };
export type PushInhalt = { titel: string; text: string; url?: string };

export function pushAktiv() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export const b64u = {
  dekodieren: (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64"),
  kodieren: (b: Buffer) =>
    b.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
};

/** Nutzdaten für ein Abo verschlüsseln (ein einziger Datensatz, aes128gcm) */
export function verschluesseln(
  abo: PushAbo,
  klartext: Buffer,
  salz: Buffer = randomBytes(16),
  senderPrivat?: Buffer,
) {
  const empfaengerPublic = b64u.dekodieren(abo.p256dh);
  const authGeheimnis = b64u.dekodieren(abo.auth);

  const ecdh = createECDH("prime256v1");
  if (senderPrivat) ecdh.setPrivateKey(senderPrivat);
  else ecdh.generateKeys();
  const senderPublic = ecdh.getPublicKey();
  const gemeinsam = ecdh.computeSecret(empfaengerPublic);

  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\0"), empfaengerPublic, senderPublic]);
  const ikm = Buffer.from(hkdfSync("sha256", gemeinsam, authGeheimnis, keyInfo, 32));
  const cek = Buffer.from(hkdfSync("sha256", ikm, salz, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salz, Buffer.from("Content-Encoding: nonce\0"), 12));

  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const verschluesselt = Buffer.concat([
    cipher.update(Buffer.concat([klartext, Buffer.from([2])])),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  const kopf = Buffer.alloc(21);
  salz.copy(kopf, 0);
  kopf.writeUInt32BE(4096, 16);
  kopf.writeUInt8(senderPublic.length, 20);
  return Buffer.concat([kopf, senderPublic, verschluesselt]);
}

/** VAPID-Kopfzeile (JWT, ES256) für den Push-Dienst */
function vapidKopf(endpoint: string) {
  const oeffentlich = b64u.dekodieren(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!);
  const privat = b64u.dekodieren(process.env.VAPID_PRIVATE_KEY!);
  const schluessel = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      d: b64u.kodieren(privat),
      x: b64u.kodieren(oeffentlich.subarray(1, 33)),
      y: b64u.kodieren(oeffentlich.subarray(33, 65)),
    },
    format: "jwk",
  });

  const kopf = b64u.kodieren(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const inhalt = b64u.kodieren(
    Buffer.from(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        exp: Math.floor(Date.now() / 1000) + 12 * 3600,
        sub: process.env.VAPID_SUBJECT || "https://auftragskette.vercel.app",
      }),
    ),
  );
  const signierer = createSign("SHA256");
  signierer.update(`${kopf}.${inhalt}`);
  const signatur = b64u.kodieren(signierer.sign({ key: schluessel, dsaEncoding: "ieee-p1363" }));
  return `vapid t=${kopf}.${inhalt}.${signatur}, k=${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}`;
}

/**
 * Sendet eine Push-Nachricht. Gibt "abgelaufen" zurück, wenn der
 * Push-Dienst das Abo nicht mehr kennt (dann sollte es gelöscht werden).
 */
export async function sendePush(abo: PushAbo, inhalt: PushInhalt): Promise<"ok" | "abgelaufen" | "fehler"> {
  if (!pushAktiv()) return "fehler";
  try {
    const body = verschluesseln(abo, Buffer.from(JSON.stringify(inhalt)));
    const antwort = await fetch(abo.endpoint, {
      method: "POST",
      headers: {
        Authorization: vapidKopf(abo.endpoint),
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        TTL: String(4 * 7 * 24 * 3600),
        Urgency: "normal",
      },
      body: new Uint8Array(body),
      signal: AbortSignal.timeout(5000),
    });
    if (antwort.status === 404 || antwort.status === 410) return "abgelaufen";
    if (!antwort.ok) {
      console.error("Push abgelehnt:", antwort.status, await antwort.text().catch(() => ""));
      return "fehler";
    }
    return "ok";
  } catch (fehler) {
    console.error("Push fehlgeschlagen:", fehler);
    return "fehler";
  }
}
