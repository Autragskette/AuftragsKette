-- Absender einheitlich anzeigen: "Max Muster von Firma" bzw. "Max Muster (Tätigkeit)"

create function public.absender_anzeige(p_vorname text, p_nachname text, p_firma text, p_branche text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when trim(coalesce(p_vorname, '') || ' ' || coalesce(p_nachname, '')) = ''
      then coalesce(nullif(trim(p_firma), ''), 'Ein Mitglied von AuftragsKette')
    when coalesce(trim(p_firma), '') <> ''
      then trim(p_vorname || ' ' || p_nachname) || ' von ' || trim(p_firma)
    when coalesce(trim(p_branche), '') <> ''
      then trim(p_vorname || ' ' || p_nachname) || ' (' || trim(p_branche) || ')'
    else trim(p_vorname || ' ' || p_nachname)
  end;
$$;

-- Neue Fassung der Einladungsabfrage (die alte bleibt für ältere App-Versionen bestehen)
create function public.einladung_lesen_v2(p_token uuid)
returns table (
  kontakt_name text,
  firma text,
  leistung text,
  status public.kontakt_status,
  empfohlen_von text,
  empfohlen_von_name text
)
language sql
stable
security definer
set search_path = ''
as $$
  select k.name, k.firma, k.leistung, k.status,
         public.absender_anzeige(p.vorname, p.nachname, p.firma, p.branche),
         coalesce(nullif(trim(p.vorname || ' ' || p.nachname), ''), 'das Mitglied')
  from public.kontakte k
  join public.profile p on p.id = k.besitzer_id
  where k.einladung_token = p_token;
$$;

revoke execute on function public.einladung_lesen_v2(uuid) from public;
grant execute on function public.einladung_lesen_v2(uuid) to anon, authenticated;

-- Visitenkarte: Firma, ersatzweise Tätigkeit des Empfehlenden
create or replace function public.visitenkarte_lesen(p_token uuid)
returns table (
  name text,
  firma text,
  leistung text,
  telefon text,
  email text,
  plz text,
  ort text,
  empfohlen_von text,
  empfohlen_von_firma text,
  kunde_name text,
  nachricht text
)
language sql
stable
security definer
set search_path = ''
as $$
  select k.name, k.firma, k.leistung, k.telefon, k.email, k.plz, k.ort,
         coalesce(nullif(trim(p.vorname || ' ' || p.nachname), ''), 'einem Mitglied'),
         coalesce(nullif(trim(p.firma), ''), trim(p.branche)),
         e.kunde_name, e.nachricht
  from public.kundenempfehlungen e
  join public.kontakte k on k.id = e.kontakt_id and k.status = 'bestaetigt'
  join public.profile p on p.id = e.von_id
  where e.karten_token = p_token;
$$;
