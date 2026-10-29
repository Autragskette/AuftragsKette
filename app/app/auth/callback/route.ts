import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** Ziel des Bestätigungslinks aus der E-Mail: Sitzung anlegen und in die App */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const typ = url.searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && typ) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type: typ })).error;
  }

  // Auf einem anderen Gerät geöffnet: E-Mail ist bestätigt, einfach anmelden
  const ziel = ok ? "/dashboard" : "/anmelden?bestaetigt=1";
  return NextResponse.redirect(new URL(ziel, url.origin));
}
