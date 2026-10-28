/** True, sobald die Supabase-Zugangsdaten in .env.local bzw. beim Hoster hinterlegt sind. */
export function supabaseEingerichtet() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
