-- AuftragsKette – Aktivität, Punkte, Rangliste, Nachfrist bei Ablehnung

-- ─────────────────────────────────────────────────────────────
-- Aktivität der Mitglieder
-- ─────────────────────────────────────────────────────────────
alter table public.profile
  add column zuletzt_aktiv_am timestamptz not null default now(),
  add column erinnerung_stufe smallint not null default 0,
  add column erinnert_am timestamptz;

-- Mitglieder dürfen nur ihre Stammdaten ändern, nicht die Aktivitätswerte
revoke update on public.profile from authenticated;
grant update (vorname, nachname, firma, branche, plz, ort, telefon)
  on public.profile to authenticated;

-- Ein Eintrag pro Tag, an dem ein Mitglied die App nutzt
create table public.aktivitaet_tage (
  mitglied_id uuid not null references public.profile (id) on delete cascade,
  tag         date not null,
  primary key (mitglied_id, tag)
);

alter table public.aktivitaet_tage enable row level security;

create policy "Eigene Aktivität sehen"
  on public.aktivitaet_tage for select
  to authenticated
  using ((select auth.uid()) = mitglied_id);

create function public.aktivitaet_merken()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into public.aktivitaet_tage (mitglied_id, tag)
  values (auth.uid(), (now() at time zone 'Europe/Berlin')::date)
  on conflict do nothing;

  update public.profile
     set zuletzt_aktiv_am = now()
   where id = auth.uid()
     and zuletzt_aktiv_am < now() - interval '1 hour';
end;
$$;

revoke execute on function public.aktivitaet_merken() from public, anon;
grant execute on function public.aktivitaet_merken() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Ablehnungen merken (für die 6-monatige Nachfrist)
-- ─────────────────────────────────────────────────────────────
alter table public.kontakte add column abgelehnt_am timestamptz;

create or replace function public.einladung_beantworten(
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
         abgelehnt_am = case when p_zustimmung then null else now() end,
         interesse_mitgliedschaft = p_zustimmung and coalesce(p_mitglied_interesse, false)
   where einladung_token = p_token
  returning status into neu;
  return neu;
end;
$$;

-- Automatische Nachfrage per E-Mail nur einmal
alter table public.kundenempfehlungen add column nachfrage_gesendet_am timestamptz;

-- ─────────────────────────────────────────────────────────────
-- Kennzahlen je Mitglied (letzte 12 Monate)
--
-- Punkte:
--   Empfehlung an Kunden gegeben      10
--   daraus Auftrag entstanden         20
--   Ergebnis zurückgemeldet            3
--   Kontakt bestätigt eingebracht     15
--   eigener Kontakt von anderen empfohlen  5
--   aktive Woche in der App            2
-- ─────────────────────────────────────────────────────────────
create function public.mitglieder_kennzahlen(p_id uuid default null)
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
      greatest(
        (select max(e.erstellt_am) from public.kundenempfehlungen e where e.von_id = b.mid),
        (select max(e.ergebnis_am) from public.kundenempfehlungen e where e.von_id = b.mid),
        (select max(k.erstellt_am) from public.kontakte k where k.besitzer_id = b.mid)
      ) as z_letzter
    from basis b
  )
  select z.mid, z.mname, z.mfirma, z.mbranche, z.mort, z.seit, z.aktiv,
         z.z_gegeben, z.z_auftraege, z.z_gemeldet, z.z_kontakte,
         z.z_kontakte_empfohlen, z.z_erhalten, z.z_wochen, z.z_letzter,
         (z.z_gegeben * 10 + z.z_auftraege * 20 + z.z_gemeldet * 3
          + z.z_kontakte * 15 + z.z_kontakte_empfohlen * 5 + z.z_wochen * 2)::int
    from zahlen z
   where exists (select 1 from public.profile ich where ich.id = auth.uid())
      or (select auth.role()) = 'service_role';
$$;

revoke execute on function public.mitglieder_kennzahlen(uuid) from public, anon;
grant execute on function public.mitglieder_kennzahlen(uuid) to authenticated, service_role;

-- Meistempfohlene Partner im Netzwerk (letzte 12 Monate)
create function public.top_partner(p_limit int default 10)
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
     and exists (select 1 from public.profile ich where ich.id = auth.uid())
   group by k.id
   order by 6 desc, 7 desc, k.name
   limit least(greatest(coalesce(p_limit, 10), 1), 50);
$$;

revoke execute on function public.top_partner(int) from public, anon;
grant execute on function public.top_partner(int) to authenticated;
