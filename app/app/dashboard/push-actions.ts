"use server";

import { createClient } from "@/lib/supabase/server";

/** Push-Abo dieses Geräts für das angemeldete Konto speichern */
export async function pushSpeichern(abo: { endpoint: string; p256dh: string; auth: string }) {
  if (!/^https:\/\//.test(abo.endpoint) || !abo.p256dh || !abo.auth) return false;
  if (abo.endpoint.length > 1000 || abo.p256dh.length > 200 || abo.auth.length > 100) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Ein Gerät gehört immer nur zu einem Konto
  await supabase.rpc("push_abo_entfernen", { p_endpoint: abo.endpoint });
  const { error } = await supabase.from("push_abos").insert({
    nutzer_id: user.id,
    endpoint: abo.endpoint,
    p256dh: abo.p256dh,
    auth: abo.auth,
  });
  if (error) console.error("Push-Abo speichern fehlgeschlagen:", error);
  return !error;
}

export async function pushAbmelden(endpoint: string) {
  const supabase = await createClient();
  await supabase.from("push_abos").delete().eq("endpoint", endpoint);
}
