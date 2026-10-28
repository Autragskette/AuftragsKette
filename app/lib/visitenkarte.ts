import { createClient } from "@/lib/supabase/server";
import { supabaseEingerichtet } from "@/lib/supabase/config";

export type Visitenkarte = {
  name: string;
  firma: string;
  leistung: string;
  telefon: string;
  email: string;
  plz: string;
  ort: string;
  empfohlen_von: string;
  empfohlen_von_firma: string;
  kunde_name: string;
  nachricht: string;
};

const UUID_MUSTER =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function visitenkarteLaden(token: string): Promise<Visitenkarte | null> {
  if (!UUID_MUSTER.test(token) || !supabaseEingerichtet()) return null;
  const supabase = await createClient();
  const { data } = await supabase.rpc("visitenkarte_lesen", { p_token: token });
  return ((Array.isArray(data) ? data[0] : data) as Visitenkarte | undefined) ?? null;
}

function vcardWert(wert: string) {
  return wert.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (z) => `\\${z}`);
}

export function vcard(k: Visitenkarte) {
  const teile = k.name.trim().split(/\s+/);
  const nachname = teile.length > 1 ? teile.pop()! : "";
  const vorname = teile.join(" ");
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${vcardWert(nachname)};${vcardWert(vorname)};;;`,
    `FN:${vcardWert(k.name)}`,
    k.firma && `ORG:${vcardWert(k.firma)}`,
    k.leistung && `TITLE:${vcardWert(k.leistung)}`,
    k.telefon && `TEL;TYPE=WORK,VOICE:${vcardWert(k.telefon)}`,
    k.email && `EMAIL;TYPE=WORK:${vcardWert(k.email)}`,
    (k.plz || k.ort) && `ADR;TYPE=WORK:;;;${vcardWert(k.ort)};;${vcardWert(k.plz)};Deutschland`,
    `NOTE:${vcardWert(`Empfohlen über AuftragsKette von ${k.empfohlen_von}`)}`,
    "END:VCARD",
  ]
    .filter(Boolean)
    .join("\r\n");
}
