-- Kennenlernphase für eingeladene Partner:
-- kostenlos bis zu 2 erhaltene Empfehlungen oder 3 Monate ab Zustimmung,
-- je nachdem, was zuerst eintritt. Danach ist der Partner pausiert
-- (nicht mehr suchbar und empfehlbar), bis er selbst Mitglied wird.
-- Mitglieder (gleiche E-Mail wie ein Benutzerkonto) sind nie pausiert.
-- Mehrfach eingetragene Partner (gleiche E-Mail) werden zusammengezählt.

create function public.partner_kennenlernen(p_kontakt_id uuid)
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
      (select min(g.bestaetigt_am) from gleiche g) + interval '3 months' as bis,
      exists (
        select 1 from auth.users u, k
         where k.email <> '' and lower(u.email) = lower(k.email)
      ) as mitglied
  )
  select z.anzahl, z.bis, z.mitglied,
         (not z.mitglied) and (z.anzahl >= 2 or (z.bis is not null and z.bis < now()))
    from z
   where exists (select 1 from k);
$$;

revoke execute on function public.partner_kennenlernen(uuid) from public, anon;
grant execute on function public.partner_kennenlernen(uuid) to authenticated, service_role;

create function public.partner_pausiert(p_kontakt_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select pausiert from public.partner_kennenlernen(p_kontakt_id)), false);
$$;

revoke execute on function public.partner_pausiert(uuid) from public, anon;
grant execute on function public.partner_pausiert(uuid) to authenticated, service_role;

-- Nur bestätigte und nicht pausierte Partner können empfohlen werden
create or replace function public.kontakt_ist_bestaetigt(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.kontakte where id = p_id and status = 'bestaetigt'
  ) and not public.partner_pausiert(p_id);
$$;

-- Suche und Einzelabruf blenden pausierte Partner aus
create or replace function public.netzwerk_suchen_v2(p_suche text default '', p_limit int default 2000)
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
     and not public.partner_pausiert(k.id)
   limit least(greatest(coalesce(p_limit, 2000), 1), 5000);
$$;

create or replace function public.netzwerk_kontakt(p_id uuid)
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
     and exists (select 1 from public.profile ich where ich.id = auth.uid())
     and not public.partner_pausiert(k.id);
$$;
