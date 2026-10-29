-- AuftragsKette – Veranstaltungen (Online-Branchen-Calls und regionale Treffen)

-- ─────────────────────────────────────────────────────────────
-- Admin-Rolle (darf Veranstaltungen anlegen); nur per SQL setzbar
-- ─────────────────────────────────────────────────────────────
alter table public.profile add column ist_admin boolean not null default false;

create function public.ist_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select ist_admin from public.profile where id = auth.uid()), false);
$$;

revoke execute on function public.ist_admin() from public, anon;
grant execute on function public.ist_admin() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Veranstaltungen
-- ─────────────────────────────────────────────────────────────
create type public.veranstaltung_art as enum ('branche_online', 'region_vor_ort');

create table public.veranstaltungen (
  id           uuid primary key default gen_random_uuid(),
  titel        text not null,
  art          public.veranstaltung_art not null,
  branche      text not null default '',
  region       text not null default '',
  beginn       timestamptz not null,
  ende         timestamptz not null,
  ort          text not null default '',
  teams_link   text not null default '',
  beschreibung text not null default '',
  checkin_code text not null default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  erstellt_von uuid references public.profile (id) on delete set null,
  erstellt_am  timestamptz not null default now(),
  constraint ende_nach_beginn check (ende > beginn)
);

create index veranstaltungen_beginn_idx on public.veranstaltungen (beginn);
create index veranstaltungen_erstellt_von_idx on public.veranstaltungen (erstellt_von);

alter table public.veranstaltungen enable row level security;

create policy "Mitglieder sehen Veranstaltungen"
  on public.veranstaltungen for select
  to authenticated
  using (exists (select 1 from public.profile ich where ich.id = (select auth.uid())));

create policy "Admins legen Veranstaltungen an"
  on public.veranstaltungen for insert
  to authenticated
  with check (public.ist_admin());

create policy "Admins bearbeiten Veranstaltungen"
  on public.veranstaltungen for update
  to authenticated
  using (public.ist_admin())
  with check (public.ist_admin());

create policy "Admins löschen Veranstaltungen"
  on public.veranstaltungen for delete
  to authenticated
  using (public.ist_admin());

-- Der Teilnahme-Code bleibt für normale Mitglieder unsichtbar
revoke select on public.veranstaltungen from authenticated;
grant select (id, titel, art, branche, region, beginn, ende, ort, teams_link,
              beschreibung, erstellt_von, erstellt_am)
  on public.veranstaltungen to authenticated;

create function public.veranstaltung_code(p_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select checkin_code from public.veranstaltungen
   where id = p_id and public.ist_admin();
$$;

revoke execute on function public.veranstaltung_code(uuid) from public, anon;
grant execute on function public.veranstaltung_code(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Anmeldungen und Teilnahmen
-- ─────────────────────────────────────────────────────────────
create table public.teilnahmen (
  veranstaltung_id uuid not null references public.veranstaltungen (id) on delete cascade,
  mitglied_id      uuid not null references public.profile (id) on delete cascade,
  angemeldet_am    timestamptz not null default now(),
  teilgenommen_am  timestamptz,
  primary key (veranstaltung_id, mitglied_id)
);

create index teilnahmen_mitglied_idx on public.teilnahmen (mitglied_id);

alter table public.teilnahmen enable row level security;

create policy "Eigene Teilnahmen sehen"
  on public.teilnahmen for select
  to authenticated
  using ((select auth.uid()) = mitglied_id or public.ist_admin());

create policy "Selbst anmelden"
  on public.teilnahmen for insert
  to authenticated
  with check ((select auth.uid()) = mitglied_id);

create policy "Selbst abmelden, solange nicht teilgenommen"
  on public.teilnahmen for delete
  to authenticated
  using ((select auth.uid()) = mitglied_id and teilgenommen_am is null);

-- Teilnahme kann nur über den Code bestätigt werden, nicht direkt
revoke insert, update on public.teilnahmen from authenticated;
grant insert (veranstaltung_id, mitglied_id) on public.teilnahmen to authenticated;

-- Einchecken: ab 30 Minuten vor Beginn bis 24 Stunden nach Ende
create function public.einchecken(p_id uuid, p_code text)
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

revoke execute on function public.einchecken(uuid, text) from public, anon;
grant execute on function public.einchecken(uuid, text) to authenticated;

-- Anzahl Anmeldungen und Teilnahmen je Veranstaltung (für alle Mitglieder)
create function public.veranstaltung_zahlen()
returns table (veranstaltung_id uuid, angemeldet int, teilgenommen int)
language sql
stable
security definer
set search_path = ''
as $$
  select t.veranstaltung_id,
         count(*)::int,
         count(*) filter (where t.teilgenommen_am is not null)::int
    from public.teilnahmen t
   where exists (select 1 from public.profile ich where ich.id = auth.uid())
   group by t.veranstaltung_id;
$$;

revoke execute on function public.veranstaltung_zahlen() from public, anon;
grant execute on function public.veranstaltung_zahlen() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Kennzahlen mit Veranstaltungen (Fassung 2)
--   Teilnahme Online-Branchen-Call      8
--   Teilnahme regionales Treffen       12
-- ─────────────────────────────────────────────────────────────
create function public.mitglieder_kennzahlen_v2(p_id uuid default null)
returns table (
  id uuid,
  name text,
  firma text,
  branche text,
  ort text,
  mitglied_seit timestamptz,
  zuletzt_aktiv_am timestamptz,
  empfehlungen_gegeben int,
  auftraege int,
  ergebnisse_gemeldet int,
  kontakte_bestaetigt int,
  kontakte_empfohlen int,
  empfehlungen_erhalten int,
  aktive_wochen int,
  teilnahmen_online int,
  teilnahmen_vor_ort int,
  letzter_beitrag timestamptz,
  punkte int
)
language sql
stable
security definer
set search_path = ''
as $$
  with basis as (
    select p.id as mid,
           trim(p.vorname || ' ' || p.nachname) as mname,
           p.firma as mfirma, p.branche as mbranche, p.ort as mort,
           p.erstellt_am as seit, p.zuletzt_aktiv_am as aktiv,
           lower(u.email) as mail
      from public.profile p
      join auth.users u on u.id = p.id
     where p_id is null or p.id = p_id
  ),
  zahlen as (
    select b.*,
      (select count(*) from public.kundenempfehlungen e
        where e.von_id = b.mid and e.erstellt_am > now() - interval '12 months')::int as z_gegeben,
      (select count(*) from public.kundenempfehlungen e
        where e.von_id = b.mid and e.ergebnis = 'auftrag'
          and e.erstellt_am > now() - interval '12 months')::int as z_auftraege,
      (select count(*) from public.kundenempfehlungen e
        where e.von_id = b.mid and e.ergebnis <> 'offen'
          and e.erstellt_am > now() - interval '12 months')::int as z_gemeldet,
      (select count(*) from public.kontakte k
        where k.besitzer_id = b.mid and k.status = 'bestaetigt'
          and k.bestaetigt_am > now() - interval '12 months')::int as z_kontakte,
      (select count(*) from public.kundenempfehlungen e
         join public.kontakte k on k.id = e.kontakt_id
        where k.besitzer_id = b.mid and e.von_id <> b.mid
          and e.erstellt_am > now() - interval '12 months')::int as z_kontakte_empfohlen,
      (select count(*) from public.kundenempfehlungen e
         join public.kontakte k on k.id = e.kontakt_id
        where k.email <> '' and lower(k.email) = b.mail and e.von_id <> b.mid
          and e.erstellt_am > now() - interval '12 months')::int as z_erhalten,
      (select count(distinct date_trunc('week', t.tag)) from public.aktivitaet_tage t
        where t.mitglied_id = b.mid
          and t.tag > (now() - interval '12 months')::date)::int as z_wochen,
      (select count(*) from public.teilnahmen t
         join public.veranstaltungen v on v.id = t.veranstaltung_id
        where t.mitglied_id = b.mid and v.art = 'branche_online'
          and t.teilgenommen_am > now() - interval '12 months')::int as z_online,
      (select count(*) from public.teilnahmen t
         join public.veranstaltungen v on v.id = t.veranstaltung_id
        where t.mitglied_id = b.mid and v.art = 'region_vor_ort'
          and t.teilgenommen_am > now() - interval '12 months')::int as z_vor_ort,
      greatest(
        (select max(e.erstellt_am) from public.kundenempfehlungen e where e.von_id = b.mid),
        (select max(e.ergebnis_am) from public.kundenempfehlungen e where e.von_id = b.mid),
        (select max(k.erstellt_am) from public.kontakte k where k.besitzer_id = b.mid),
        (select max(t.teilgenommen_am) from public.teilnahmen t where t.mitglied_id = b.mid)
      ) as z_letzter
    from basis b
  )
  select z.mid, z.mname, z.mfirma, z.mbranche, z.mort, z.seit, z.aktiv,
         z.z_gegeben, z.z_auftraege, z.z_gemeldet, z.z_kontakte,
         z.z_kontakte_empfohlen, z.z_erhalten, z.z_wochen, z.z_online, z.z_vor_ort,
         z.z_letzter,
         (z.z_gegeben * 10 + z.z_auftraege * 20 + z.z_gemeldet * 3
          + z.z_kontakte * 15 + z.z_kontakte_empfohlen * 5 + z.z_wochen * 2
          + z.z_online * 8 + z.z_vor_ort * 12)::int
    from zahlen z
   where exists (select 1 from public.profile ich where ich.id = auth.uid())
      or (select auth.role()) = 'service_role';
$$;

revoke execute on function public.mitglieder_kennzahlen_v2(uuid) from public, anon;
grant execute on function public.mitglieder_kennzahlen_v2(uuid) to authenticated, service_role;
