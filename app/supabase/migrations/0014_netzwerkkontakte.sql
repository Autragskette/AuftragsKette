-- Netzwerkkontakte: Kontakte, die man über die AuftragsKette kennengelernt hat
-- (Veranstaltung, Empfehlung). Sie zählen nicht als Startkontakte (außer nach
-- der Erklärung "keine eigenen Kontakte") und bringen weniger Punkte.
create type public.kontakt_herkunft as enum ('persoenlich', 'netzwerk');

alter table public.kontakte
  add column herkunft public.kontakt_herkunft not null default 'persoenlich';

-- Herkunft nur beim Anlegen festlegen, später nicht mehr änderbar
grant insert (herkunft) on public.kontakte to authenticated;

alter table public.profile
  add column ohne_startkontakte_am timestamptz;

create function public.ohne_startkontakte_erklaeren()
returns boolean
language sql
volatile
security definer
set search_path = ''
as $$
  update public.profile
     set ohne_startkontakte_am = coalesce(ohne_startkontakte_am, now())
   where id = (select auth.uid())
     and rolle = 'mitglied'
     and erstellt_am < now() - interval '3 months'
  returning true;
$$;

revoke execute on function public.ohne_startkontakte_erklaeren() from public, anon;
grant execute on function public.ohne_startkontakte_erklaeren() to authenticated;

create function public.einladung_herkunft(p_token uuid)
returns public.kontakt_herkunft
language sql
stable
security definer
set search_path = ''
as $$
  select herkunft from public.kontakte where einladung_token = p_token;
$$;

revoke execute on function public.einladung_herkunft(uuid) from public;
grant execute on function public.einladung_herkunft(uuid) to anon, authenticated;

create or replace function public.empfehlung_partner_v2(p_empfehlung_id uuid)
returns table (
  name text, firma text, leistung text, telefon text, email text, plz text, ort text,
  eigener boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select k.name, k.firma, k.leistung, k.telefon, k.email, k.plz, k.ort,
         k.besitzer_id = e.von_id and k.herkunft = 'persoenlich'
    from public.kundenempfehlungen e
    join public.kontakte k on k.id = e.kontakt_id
   where e.id = p_empfehlung_id
     and e.von_id = (select auth.uid())
     and k.status = 'bestaetigt';
$$;

-- Kennzahlen v3: persönliche Kontakte 15 Punkte, Netzwerkkontakte 3 Punkte (höchstens 5 pro 12 Monate)
create function public.mitglieder_kennzahlen_v3(p_id uuid default null)
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
  kontakte_netzwerk int,
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
     where (p_id is null or p.id = p_id)
       and p.rolle = 'mitglied'
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
        where k.besitzer_id = b.mid and k.status = 'bestaetigt' and k.herkunft = 'persoenlich'
          and k.bestaetigt_am > now() - interval '12 months')::int as z_kontakte,
      least(5, (select count(*) from public.kontakte k
        where k.besitzer_id = b.mid and k.status = 'bestaetigt' and k.herkunft = 'netzwerk'
          and k.bestaetigt_am > now() - interval '12 months'))::int as z_netzwerk,
      (select count(*) from public.kundenempfehlungen e
         join public.kontakte k on k.id = e.kontakt_id
        where k.besitzer_id = b.mid and k.herkunft = 'persoenlich' and e.von_id <> b.mid
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
         z.z_gegeben, z.z_auftraege, z.z_gemeldet, z.z_kontakte, z.z_netzwerk,
         z.z_kontakte_empfohlen, z.z_erhalten, z.z_wochen, z.z_online, z.z_vor_ort,
         z.z_letzter,
         (z.z_gegeben * 10 + z.z_auftraege * 20 + z.z_gemeldet * 3
          + z.z_kontakte * 15 + z.z_netzwerk * 3 + z.z_kontakte_empfohlen * 5 + z.z_wochen * 2
          + z.z_online * 8 + z.z_vor_ort * 12)::int
    from zahlen z
   where p_id = (select auth.uid())
      or public.ist_mitglied()
      or (select auth.role()) = 'service_role';
$$;

revoke execute on function public.mitglieder_kennzahlen_v3(uuid) from public, anon;
grant execute on function public.mitglieder_kennzahlen_v3(uuid) to authenticated, service_role;
