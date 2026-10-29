create or replace function public.netzwerk_suchen(p_suche text default '', p_region text default '')
returns table (
  id uuid, name text, firma text, leistung text, plz text, ort text,
  telefon text, email text, empfohlen_von text, eigener boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select k.id, k.name, k.firma, k.leistung, k.plz, k.ort, k.telefon, k.email,
         trim(p.vorname || ' ' || p.nachname) as empfohlen_von,
         k.besitzer_id = auth.uid() as eigener
  from public.kontakte k
  join public.profile p on p.id = k.besitzer_id
  where k.status = 'bestaetigt'
    and public.ist_mitglied()
    and not public.partner_pausiert(k.id)
    and (
      coalesce(trim(p_suche), '') = ''
      or k.leistung ilike '%' || trim(p_suche) || '%'
      or k.firma    ilike '%' || trim(p_suche) || '%'
      or k.name     ilike '%' || trim(p_suche) || '%'
    )
    and (
      coalesce(trim(p_region), '') = ''
      or (trim(p_region) ~ '^[0-9]+$' and k.plz like trim(p_region) || '%')
      or (trim(p_region) !~ '^[0-9]+$' and k.ort ilike '%' || trim(p_region) || '%')
    )
  order by k.plz, k.name
  limit 100;
$$;
