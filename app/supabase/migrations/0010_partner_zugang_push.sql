-- Schnupperzugang für Partner, neue Testregel und Push-Nachrichten.
--
-- Rollen: 'mitglied' (volle Nutzung) und 'partner' (Schnupperzugang:
-- sieht die App, kann aber nichts nutzen, was anderen Daten zeigt oder
-- anlegt). Neue Konten sind Partner, bis sie als Mitglied freigeschaltet
-- werden. Bestehende Konten werden Mitglieder.

create type public.rolle as enum ('mitglied', 'partner');

alter table public.profile
  add column rolle public.rolle not null default 'mitglied';
alter table public.profile
  alter column rolle set default 'partner';

create function public.ist_mitglied()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profile
     where id = (select auth.uid()) and rolle = 'mitglied'
  );
$$;

revoke execute on function public.ist_mitglied() from public, anon;
grant execute on function public.ist_mitglied() to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- Sperren für Partner (in der Datenbank, nicht nur in der App)
-- ─────────────────────────────────────────────────────────────

-- Profile anderer sehen nur Mitglieder, das eigene sieht jeder
alter policy "Mitglieder sehen Profile"
  on public.profile
  using ((select auth.uid()) = id or public.ist_mitglied());

-- Kontakte einbringen nur als Mitglied
create policy "Nur Mitglieder bringen Kontakte ein"
  on public.kontakte as restrictive for insert
  to authenticated
  with check (public.ist_mitglied());

-- Kunden empfehlen nur als Mitglied
create policy "Nur Mitglieder empfehlen"
  on public.kundenempfehlungen as restrictive for insert
  to authenticated
  with check (public.ist_mitglied());

-- An Veranstaltungen teilnehmen nur als Mitglied
create policy "Nur Mitglieder nehmen teil"
  on public.teilnahmen as restrictive for insert
  to authenticated
  with check (public.ist_mitglied());

-- Einchecken nur als Mitglied
create or replace function public.einchecken(p_id uuid, p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.veranstaltungen;
begin
  if auth.uid() is null then
    return 'nicht_angemeldet';
  end if;
  if not public.ist_mitglied() then
    return 'nur_mitglieder';
  end if;

  select * into v from public.veranstaltungen where id = p_id;
  if not found then
    return 'unbekannt';
  end if;
  if now() < v.beginn - interval '30 minutes' then
    return 'zu_frueh';
  end if;
  if now() > v.ende + interval '24 hours' then
    return 'zu_spaet';
  end if;
  if upper(trim(coalesce(p_code, ''))) <> upper(v.checkin_code) then
    return 'falscher_code';
  end if;

  insert into public.teilnahmen (veranstaltung_id, mitglied_id, teilgenommen_am)
  values (p_id, auth.uid(), now())
  on conflict (veranstaltung_id, mitglied_id)
  do update set teilgenommen_am = coalesce(public.teilnahmen.teilgenommen_am, now());

  return 'ok';
end;
$$;

-- Alte Suchfunktion (ersetzt durch netzwerk_suchen_v2): ebenfalls nur für
-- Mitglieder; siehe 0010g_alte_suche_sperren.sql

-- ─────────────────────────────────────────────────────────────
-- Testregel:
--   endet mit der 2. erhaltenen Empfehlung,
--   nach 3 Monaten, wenn schon mindestens 1 Empfehlung kam,
--   ohne Empfehlung spätestens nach 6 Monaten.
-- Mitglied ist, wessen Konto (gleiche E-Mail) die Rolle 'mitglied' hat.
-- ─────────────────────────────────────────────────────────────
create or replace function public.partner_kennenlernen(p_kontakt_id uuid)
returns table (
  empfehlungen int,
  frei_bis timestamptz,
  ist_mitglied boolean,
  pausiert boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with k as (
    select id, email from public.kontakte where id = p_kontakt_id
  ),
  gleiche as (
    select k2.id, k2.bestaetigt_am
      from public.kontakte k2, k
     where k2.id = k.id
        or (k.email <> '' and lower(k2.email) = lower(k.email))
  ),
  z as (
    select
      (select count(*) from public.kundenempfehlungen e
        where e.kontakt_id in (select id from gleiche))::int as anzahl,
      (select min(g.bestaetigt_am) from gleiche g) as start,
      exists (
        select 1
          from auth.users u, k, public.profile p
         where k.email <> ''
           and lower(u.email) = lower(k.email)
           and p.id = u.id
           and p.rolle = 'mitglied'
      ) as mitglied
  ),
  b as (
    select z.*,
           z.start + case when z.anzahl = 0 then interval '6 months'
                          else interval '3 months' end as bis
      from z
  )
  select b.anzahl, b.bis, b.mitglied,
         (not b.mitglied) and (b.anzahl >= 2 or (b.bis is not null and b.bis < now()))
    from b
   where exists (select 1 from k);
$$;

-- Suche und Einzelabruf nur für Mitglieder
create or replace function public.netzwerk_suchen_v2(p_suche text default '', p_limit int default 2000)
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
         trim(p.vorname || ' ' || p.nachname),
         k.besitzer_id = auth.uid()
    from public.kontakte k
    join public.profile p on p.id = k.besitzer_id
   where k.status = 'bestaetigt'
     and public.ist_mitglied()
     and (
       coalesce(trim(p_suche), '') = ''
       or k.leistung ilike '%' || trim(p_suche) || '%'
       or k.firma    ilike '%' || trim(p_suche) || '%'
       or k.name     ilike '%' || trim(p_suche) || '%'
     )
     and not public.partner_pausiert(k.id)
   limit least(greatest(coalesce(p_limit, 2000), 1), 5000);
$$;

create or replace function public.netzwerk_kontakt(p_id uuid)
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
         trim(p.vorname || ' ' || p.nachname),
         k.besitzer_id = auth.uid()
    from public.kontakte k
    join public.profile p on p.id = k.besitzer_id
   where k.id = p_id
     and k.status = 'bestaetigt'
     and public.ist_mitglied()
     and not public.partner_pausiert(k.id);
$$;

-- Vorschau der Suche für Partner: nur Gewerk und Ort, keine Namen oder Kontaktdaten
create function public.netzwerk_vorschau(p_suche text default '')
returns table (leistung text, plz text, ort text)
language sql
stable
security definer
set search_path = ''
as $$
  select k.leistung, k.plz, k.ort
    from public.kontakte k
   where k.status = 'bestaetigt'
     and exists (select 1 from public.profile ich where ich.id = (select auth.uid()))
     and (
       coalesce(trim(p_suche), '') = ''
       or k.leistung ilike '%' || trim(p_suche) || '%'
     )
     and not public.partner_pausiert(k.id)
   limit 2000;
$$;

revoke execute on function public.netzwerk_vorschau(text) from public, anon;
grant execute on function public.netzwerk_vorschau(text) to authenticated;

-- Bestenliste nur für Mitglieder
create or replace function public.top_partner(p_limit int default 10)
returns table (
  id uuid,
  name text,
  firma text,
  leistung text,
  ort text,
  empfehlungen int,
  auftraege int
)
language sql
stable
security definer
set search_path = ''
as $$
  select k.id, k.name, k.firma, k.leistung, k.ort,
         count(e.id)::int,
         count(e.id) filter (where e.ergebnis = 'auftrag')::int
    from public.kontakte k
    join public.kundenempfehlungen e
      on e.kontakt_id = k.id and e.erstellt_am > now() - interval '12 months'
   where k.status = 'bestaetigt'
     and public.ist_mitglied()
   group by k.id
   order by 6 desc, 7 desc, k.name
   limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

-- ─────────────────────────────────────────────────────────────
-- Eigener Stand als Partner (über die E-Mail des Kontos)
-- ─────────────────────────────────────────────────────────────
create function public.mein_partner_stand()
returns table (
  gelistet boolean,
  empfehlungen int,
  frei_bis timestamptz,
  pausiert boolean,
  leistung text
)
language sql
stable
security definer
set search_path = ''
as $$
  with ich as (
    select lower(u.email) as email from auth.users u where u.id = (select auth.uid())
  ),
  erster as (
    select k.id, k.leistung
      from public.kontakte k, ich
     where lower(k.email) = ich.email and k.status = 'bestaetigt'
     order by k.bestaetigt_am
     limit 1
  )
  select true, s.empfehlungen, s.frei_bis, s.pausiert, erster.leistung
    from erster, lateral public.partner_kennenlernen(erster.id) s
  union all
  select false, 0, null, false, ''
   where not exists (select 1 from erster);
$$;

revoke execute on function public.mein_partner_stand() from public, anon;
grant execute on function public.mein_partner_stand() to authenticated;

-- Wann und von wem man empfohlen wurde (ohne Kundendaten)
create function public.meine_erhaltenen_empfehlungen()
returns table (erstellt_am timestamptz, von text)
language sql
stable
security definer
set search_path = ''
as $$
  select e.erstellt_am,
         public.absender_anzeige(p.vorname, p.nachname, p.firma, p.branche)
    from public.kundenempfehlungen e
    join public.kontakte k on k.id = e.kontakt_id
    join public.profile p on p.id = e.von_id
    join auth.users u on u.id = (select auth.uid())
   where k.email <> '' and lower(k.email) = lower(u.email)
   order by e.erstellt_am desc
   limit 100;
$$;

revoke execute on function public.meine_erhaltenen_empfehlungen() from public, anon;
grant execute on function public.meine_erhaltenen_empfehlungen() to authenticated;

-- Leeres Profil eines Partners einmalig aus seinem Kontakteintrag füllen
create function public.profil_aus_kontakt()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.profile p
     set vorname  = case when p.vorname  = '' then split_part(trim(k.name), ' ', 1) else p.vorname end,
         nachname = case when p.nachname = '' then trim(substr(trim(k.name), length(split_part(trim(k.name), ' ', 1)) + 1)) else p.nachname end,
         firma    = case when p.firma    = '' then k.firma else p.firma end,
         branche  = case when p.branche  = '' then k.leistung else p.branche end,
         telefon  = case when p.telefon  = '' then k.telefon else p.telefon end,
         plz      = case when p.plz      = '' then k.plz else p.plz end,
         ort      = case when p.ort      = '' then k.ort else p.ort end
    from (
      select k.* from public.kontakte k, auth.users u
       where u.id = (select auth.uid())
         and k.email <> '' and lower(k.email) = lower(u.email)
         and k.status = 'bestaetigt'
       order by k.bestaetigt_am
       limit 1
    ) k
   where p.id = (select auth.uid());
$$;

revoke execute on function public.profil_aus_kontakt() from public, anon;
grant execute on function public.profil_aus_kontakt() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Push-Nachrichten
-- ─────────────────────────────────────────────────────────────
create table public.push_abos (
  id         uuid primary key default gen_random_uuid(),
  nutzer_id  uuid not null references public.profile (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  erstellt_am timestamptz not null default now()
);

create index push_abos_nutzer_idx on public.push_abos (nutzer_id);

alter table public.push_abos enable row level security;

create policy "Eigene Push-Abos"
  on public.push_abos for all
  to authenticated
  using ((select auth.uid()) = nutzer_id)
  with check ((select auth.uid()) = nutzer_id);

-- Empfänger einer gerade erstellten Empfehlung: nur für den Absender
-- und nur in den ersten 10 Minuten
create function public.push_ziele_empfehlung(p_empfehlung_id uuid)
returns table (endpoint text, p256dh text, auth text, zweite boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select a.endpoint, a.p256dh, a.auth,
         coalesce((select s.empfehlungen >= 2 and not s.ist_mitglied
                     from public.partner_kennenlernen(e.kontakt_id) s), false)
    from public.kundenempfehlungen e
    join public.kontakte k on k.id = e.kontakt_id
    join auth.users u on k.email <> '' and lower(u.email) = lower(k.email)
    join public.push_abos a on a.nutzer_id = u.id
   where e.id = p_empfehlung_id
     and e.von_id = (select auth.uid())
     and e.erstellt_am > now() - interval '10 minutes';
$$;

revoke execute on function public.push_ziele_empfehlung(uuid) from public, anon;
grant execute on function public.push_ziele_empfehlung(uuid) to authenticated;

-- Abgelaufene Abos entfernen (der Push-Dienst meldet sie als ungültig)
create function public.push_abo_entfernen(p_endpoint text)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from public.push_abos where endpoint = p_endpoint;
$$;

revoke execute on function public.push_abo_entfernen(text) from public, anon;
grant execute on function public.push_abo_entfernen(text) to authenticated, service_role;
