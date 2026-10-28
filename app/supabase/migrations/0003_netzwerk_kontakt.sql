-- Einzelnen bestätigten Partner aus dem Netzwerk abrufen (ohne private Notiz)
create function public.netzwerk_kontakt(p_id uuid)
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
  where k.id = p_id
    and k.status = 'bestaetigt'
    and exists (select 1 from public.profile ich where ich.id = auth.uid());
$$;

revoke execute on function public.netzwerk_kontakt(uuid) from public, anon;
grant execute on function public.netzwerk_kontakt(uuid) to authenticated;
