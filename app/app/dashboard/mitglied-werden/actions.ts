"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function mitgliedschaftAnfragen() {
  const supabase = await createClient();
  await supabase.rpc("mitgliedschaft_anfragen");
  redirect("/dashboard/mitglied-werden?angefragt=1");
}
