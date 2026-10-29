-- Vorschau für den eingeladenen Kontakt: seine eigenen Angaben, so wie
-- Kunden sie auf der digitalen Visitenkarte sehen. Zugang nur über
-- den persönlichen Einladungslink.
create function public.einladung_vorschau(p_token uuid)
returns table (
  name text,
  firma text,
  leistung text,
  telefon text,
  email text,
  plz text,
  ort text,
  status public.kontakt_status,
  empfohlen_von text,
  empfohlen_von_firma text
)
language sql
stable
security definer
set search_path = ''
as $$
  select k.name, k.firma, k.leistung, k.telefon, k.email, k.plz, k.ort, k.status,
         coalesce(nullif(trim(p.vorname || ' ' || p.nachname), ''), 'einem Mitglied'),
         coalesce(nullif(trim(p.firma), ''), trim(p.branche))
    from public.kontakte k
    join public.profile p on p.id = k.besitzer_id
   where k.einladung_token = p_token;
$$;

revoke execute on function public.einladung_vorschau(uuid) from public;
grant execute on function public.einladung_vorschau(uuid) to anon, authenticated;
