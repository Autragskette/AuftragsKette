-- Wie empfehlung_partner, zusätzlich: Ist es ein eigener Kontakt des Mitglieds?
create function public.empfehlung_partner_v2(p_empfehlung_id uuid)
returns table (
  name text, firma text, leistung text, telefon text, email text, plz text, ort text,
  eigener boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select k.name, k.firma, k.leistung, k.telefon, k.email, k.plz, k.ort,
         k.besitzer_id = e.von_id
    from public.kundenempfehlungen e
    join public.kontakte k on k.id = e.kontakt_id
   where e.id = p_empfehlung_id
     and e.von_id = (select auth.uid())
     and k.status = 'bestaetigt';
$$;

revoke execute on function public.empfehlung_partner_v2(uuid) from public, anon;
grant execute on function public.empfehlung_partner_v2(uuid) to authenticated;
