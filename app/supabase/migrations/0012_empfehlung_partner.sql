-- Partnerdaten zu einer eigenen, bereits angelegten Empfehlung,
-- auch wenn der Partner inzwischen pausiert ist (z. B. nach seiner 2. Empfehlung)
create function public.empfehlung_partner(p_empfehlung_id uuid)
returns table (
  name text, firma text, leistung text, telefon text, email text, plz text, ort text
)
language sql
stable
security definer
set search_path = ''
as $$
  select k.name, k.firma, k.leistung, k.telefon, k.email, k.plz, k.ort
    from public.kundenempfehlungen e
    join public.kontakte k on k.id = e.kontakt_id
   where e.id = p_empfehlung_id
     and e.von_id = (select auth.uid())
     and k.status = 'bestaetigt';
$$;

revoke execute on function public.empfehlung_partner(uuid) from public, anon;
grant execute on function public.empfehlung_partner(uuid) to authenticated;
