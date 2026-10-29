-- Der eingeladene Kontakt ergänzt seine Angaben selbst. Nach der Zustimmung
-- gehören die Kontaktdaten ihm: der Einladende kann sie nicht mehr ändern.
create or replace function public.kontakt_email_geaendert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Nur Änderungen durch den Einladenden selbst (über die API) prüfen;
  -- die Bestätigungsfunktion des Kontakts läuft mit eigenen Rechten.
  if current_user in ('authenticated', 'anon') then
    if old.status = 'bestaetigt' and (
         new.name is distinct from old.name
      or new.firma is distinct from old.firma
      or new.leistung is distinct from old.leistung
      or new.email is distinct from old.email
      or new.telefon is distinct from old.telefon
      or new.plz is distinct from old.plz
      or new.ort is distinct from old.ort
    ) then
      raise exception 'Die Angaben eines bestätigten Kontakts kann nur der Kontakt selbst ändern.';
    end if;
    if new.email is distinct from old.email then
      new.status := 'eingeladen';
      new.einladung_token := gen_random_uuid();
      new.bestaetigt_am := null;
    end if;
  end if;
  return new;
end;
$$;

-- Zustimmen bzw. Angaben ändern, mit den eigenen Angaben des Kontakts
create function public.einladung_beantworten_v2(
  p_token uuid,
  p_zustimmung boolean,
  p_mitglied_interesse boolean default false,
  p_firma text default '',
  p_leistung text default '',
  p_telefon text default '',
  p_email text default '',
  p_plz text default '',
  p_ort text default ''
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  neu public.kontakt_status;
  v_firma text := left(trim(coalesce(p_firma, '')), 120);
  v_leistung text := left(trim(coalesce(p_leistung, '')), 200);
  v_telefon text := left(trim(coalesce(p_telefon, '')), 50);
  v_email text := left(trim(coalesce(p_email, '')), 200);
  v_plz text := trim(coalesce(p_plz, ''));
  v_ort text := left(trim(coalesce(p_ort, '')), 80);
begin
  if not p_zustimmung then
    update public.kontakte
       set status = 'abgelehnt', bestaetigt_am = null, abgelehnt_am = now(),
           interesse_mitgliedschaft = false
     where einladung_token = p_token
    returning status into neu;
    return coalesce(neu::text, 'unbekannt');
  end if;

  if v_leistung = '' then return 'leistung_fehlt'; end if;
  if v_telefon = '' and v_email = '' then return 'erreichbarkeit_fehlt'; end if;
  if v_email <> '' and v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then return 'email_ungueltig'; end if;
  if v_plz !~ '^\d{5}$' then return 'plz_ungueltig'; end if;
  if v_ort = '' then return 'ort_fehlt'; end if;

  update public.kontakte
     set firma = v_firma, leistung = v_leistung, telefon = v_telefon,
         email = v_email, plz = v_plz, ort = v_ort,
         status = 'bestaetigt',
         bestaetigt_am = coalesce(bestaetigt_am, now()),
         abgelehnt_am = null,
         interesse_mitgliedschaft = interesse_mitgliedschaft or coalesce(p_mitglied_interesse, false)
   where einladung_token = p_token
  returning status into neu;
  return coalesce(neu::text, 'unbekannt');
end;
$$;

revoke execute on function public.einladung_beantworten_v2(uuid, boolean, boolean, text, text, text, text, text, text) from public;
grant execute on function public.einladung_beantworten_v2(uuid, boolean, boolean, text, text, text, text, text, text) to anon, authenticated;
