-- Umkreissuche: alle bestätigten Partner eines Gewerks laden,
-- die Entfernung berechnet die App anhand der Postleitzahl.
create function public.netzwerk_suchen_v2(p_suche text default '', p_limit int default 2000)
returns table (
  id uuid,
  name text,
  firma text,
  leistung text,
  plz text,
  ort text,
  telefon text,
  email text,
  empfohlen_von text,
  eigener boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select k.id, k.name, k.firma, k.leistung, k.plz, k.ort, k.telefon, k.email,
         trim(p.vorname || ' ' || p.nachname),
         k.besitzer_id = auth.uid()
    from public.kontakte k
    join public.profile p on p.id = k.besitzer_id
   where k.status = 'bestaetigt'
     and exists (select 1 from public.profile ich where ich.id = auth.uid())
     and (
       coalesce(trim(p_suche), '') = ''
       or k.leistung ilike '%' || trim(p_suche) || '%'
       or k.firma    ilike '%' || trim(p_suche) || '%'
       or k.name     ilike '%' || trim(p_suche) || '%'
     )
   limit least(greatest(coalesce(p_limit, 2000), 1), 5000);
$$;

revoke execute on function public.netzwerk_suchen_v2(text, int) from public, anon;
grant execute on function public.netzwerk_suchen_v2(text, int) to authenticated;
