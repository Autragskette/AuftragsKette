-- AuftragsKette – Stufe 1 bis 4:
-- Kontaktbestätigung, regionale Suche, Kundenempfehlungen, Nachverfolgung

-- ─────────────────────────────────────────────────────────────
-- Profile: Region des Mitglieds
-- ─────────────────────────────────────────────────────────────
alter table public.profile add column plz text not null default '';

-- ─────────────────────────────────────────────────────────────
-- Kontakte: Region und Bestätigungsstatus
-- ─────────────────────────────────────────────────────────────
create type public.kontakt_status as enum ('eingeladen', 'bestaetigt', 'abgelehnt');

alter table public.kontakte
  add column plz text not null default '',
  add column ort text not null default '',
  add column status public.kontakt_status not null default 'eingeladen',
  add column einladung_token uuid not null default gen_random_uuid() unique,
  add column bestaetigt_am timestamptz,
  add column interesse_mitgliedschaft boolean not null default false;

create index kontakte_status_idx on public.kontakte (status);
create index kontakte_plz_idx on public.kontakte (plz);

-- Mitglieder dürfen den Status nicht selbst setzen: nur diese Spalten sind schreibbar
revoke insert, update on public.kontakte from authenticated;
grant insert (besitzer_id, name, firma, leistung, email, telefon, notiz, plz, ort)
  on public.kontakte to authenticated;
grant update (name, firma, leistung, email, telefon, notiz, plz, ort)
  on public.kontakte to authenticated;

-- Ändert sich die E-Mail-Adresse, muss der Kontakt neu bestätigen
create function public.kontakt_email_geaendert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    new.status := 'eingeladen';
    new.einladung_token := gen_random_uuid();
    new.bestaetigt_am := null;
  end if;
  return new;
end;
$$;

create trigger vor_kontakt_aenderung
  before update on public.kontakte
  for each row execute function public.kontakt_email_geaendert();

revoke execute on function public.kontakt_email_geaendert() from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Öffentliche Bestätigungsseite (ohne Anmeldung, nur mit Token)
-- ─────────────────────────────────────────────────────────────
create function public.einladung_lesen(p_token uuid)
returns table (
  kontakt_name text,
  firma text,
  leistung text,
  status public.kontakt_status,
  empfohlen_von text
)
language sql
stable
security definer
set search_path = ''
as $$
  select k.name, k.firma, k.leistung, k.status,
         trim(p.vorname || ' ' || p.nachname) ||
           case when p.firma <> '' then ' (' || p.firma || ')' else '' end
  from public.kontakte k
  join public.profile p on p.id = k.besitzer_id
  where k.einladung_token = p_token;
$$;

create function public.einladung_beantworten(
  p_token uuid,
  p_zustimmung boolean,
  p_mitglied_interesse boolean default false
)
returns public.kontakt_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  neu public.kontakt_status;
begin
  update public.kontakte
     set status = case when p_zustimmung then 'bestaetigt'::public.kontakt_status
                       else 'abgelehnt'::public.kontakt_status end,
         bestaetigt_am = case when p_zustimmung then now() else null end,
         interesse_mitgliedschaft = p_zustimmung and coalesce(p_mitglied_interesse, false)
   where einladung_token = p_token
  returning status into neu;
  return neu;
end;
$$;

revoke execute on function public.einladung_lesen(uuid) from public;
revoke execute on function public.einladung_beantworten(uuid, boolean, boolean) from public;
grant execute on function public.einladung_lesen(uuid) to anon, authenticated;
grant execute on function public.einladung_beantworten(uuid, boolean, boolean) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Regionale Suche über alle bestätigten Kontakte im Netzwerk
-- (ohne private Notizen)
-- ─────────────────────────────────────────────────────────────
create function public.netzwerk_suchen(p_suche text default '', p_region text default '')
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
         trim(p.vorname || ' ' || p.nachname) as empfohlen_von,
         k.besitzer_id = auth.uid() as eigener
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
    and (
      coalesce(trim(p_region), '') = ''
      or (trim(p_region) ~ '^[0-9]+$' and k.plz like trim(p_region) || '%')
      or (trim(p_region) !~ '^[0-9]+$' and k.ort ilike '%' || trim(p_region) || '%')
    )
  order by k.plz, k.name
  limit 100;
$$;

revoke execute on function public.netzwerk_suchen(text, text) from public, anon;
grant execute on function public.netzwerk_suchen(text, text) to authenticated;

-- Hilfsfunktion für Zugriffsregeln
create function public.kontakt_ist_bestaetigt(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.kontakte where id = p_id and status = 'bestaetigt'
  );
$$;

revoke execute on function public.kontakt_ist_bestaetigt(uuid) from public, anon;
grant execute on function public.kontakt_ist_bestaetigt(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Kundenempfehlungen: Mitglied empfiehlt einem Kunden einen Kontakt
-- ─────────────────────────────────────────────────────────────
create type public.empfehlung_kanal as enum ('whatsapp', 'email', 'visitenkarte');
create type public.empfehlung_ergebnis as enum ('offen', 'auftrag', 'kein_auftrag');

create table public.kundenempfehlungen (
  id                uuid primary key default gen_random_uuid(),
  von_id            uuid not null references public.profile (id) on delete cascade,
  kontakt_id        uuid references public.kontakte (id) on delete set null,
  kontakt_name      text not null,
  kunde_name        text not null default '',
  kunde_email       text not null default '',
  kunde_telefon     text not null default '',
  nachricht         text not null default '',
  kanal             public.empfehlung_kanal not null default 'whatsapp',
  nachfrage_erlaubt boolean not null default false,
  ergebnis          public.empfehlung_ergebnis not null default 'offen',
  ergebnis_am       timestamptz,
  erinnert_am       timestamptz,
  karten_token      uuid not null default gen_random_uuid() unique,
  erstellt_am       timestamptz not null default now()
);

create index kundenempfehlungen_von_idx on public.kundenempfehlungen (von_id);
create index kundenempfehlungen_kontakt_idx on public.kundenempfehlungen (kontakt_id);

alter table public.kundenempfehlungen enable row level security;

create policy "Eigene Kundenempfehlungen sehen"
  on public.kundenempfehlungen for select
  to authenticated
  using ((select auth.uid()) = von_id);

create policy "Kundenempfehlung erstellen"
  on public.kundenempfehlungen for insert
  to authenticated
  with check (
    (select auth.uid()) = von_id
    and public.kontakt_ist_bestaetigt(kontakt_id)
  );

create policy "Ergebnis eintragen"
  on public.kundenempfehlungen for update
  to authenticated
  using ((select auth.uid()) = von_id)
  with check ((select auth.uid()) = von_id);

create policy "Eigene Kundenempfehlung löschen"
  on public.kundenempfehlungen for delete
  to authenticated
  using ((select auth.uid()) = von_id);

revoke insert, update on public.kundenempfehlungen from authenticated;
grant insert (von_id, kontakt_id, kontakt_name, kunde_name, kunde_email,
              kunde_telefon, nachricht, kanal, nachfrage_erlaubt)
  on public.kundenempfehlungen to authenticated;
grant update (kanal, ergebnis, ergebnis_am, erinnert_am)
  on public.kundenempfehlungen to authenticated;

-- Öffentliche digitale Visitenkarte für den Kunden
create function public.visitenkarte_lesen(p_token uuid)
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
         trim(p.vorname || ' ' || p.nachname), p.firma,
         e.kunde_name, e.nachricht
  from public.kundenempfehlungen e
  join public.kontakte k on k.id = e.kontakt_id and k.status = 'bestaetigt'
  join public.profile p on p.id = e.von_id
  where e.karten_token = p_token;
$$;

revoke execute on function public.visitenkarte_lesen(uuid) from public;
grant execute on function public.visitenkarte_lesen(uuid) to anon, authenticated;
