-- AuftragsKette – Grundschema
-- Im Supabase-Dashboard unter "SQL Editor" komplett einfügen und ausführen.

-- ─────────────────────────────────────────────────────────────
-- Mitgliederprofile (eine Zeile pro angemeldetem Mitglied)
-- ─────────────────────────────────────────────────────────────
create table public.profile (
  id          uuid primary key references auth.users (id) on delete cascade,
  vorname     text not null default '',
  nachname    text not null default '',
  firma       text not null default '',
  branche     text not null default '',
  ort         text not null default '',
  telefon     text not null default '',
  erstellt_am timestamptz not null default now()
);

alter table public.profile enable row level security;

-- Mitglieder sehen die Profile anderer Mitglieder (geschlossenes Netzwerk)
create policy "Mitglieder sehen Profile"
  on public.profile for select
  to authenticated
  using (true);

-- Jedes Mitglied bearbeitet nur das eigene Profil
create policy "Eigenes Profil bearbeiten"
  on public.profile for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Profil automatisch anlegen, sobald ein Konto erstellt wird
create function public.profil_anlegen()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile (id, vorname, nachname)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'vorname', ''),
    coalesce(new.raw_user_meta_data ->> 'nachname', '')
  );
  return new;
end;
$$;

create trigger nach_konto_erstellt
  after insert on auth.users
  for each row execute function public.profil_anlegen();

-- ─────────────────────────────────────────────────────────────
-- Kontakte: Geschäftskontakte, die ein Mitglied persönlich kennt
-- und fachlich einschätzen kann ("Mein Netzwerk")
-- ─────────────────────────────────────────────────────────────
create table public.kontakte (
  id          uuid primary key default gen_random_uuid(),
  besitzer_id uuid not null references public.profile (id) on delete cascade,
  name        text not null,
  firma       text not null default '',
  leistung    text not null default '',
  email       text not null default '',
  telefon     text not null default '',
  notiz       text not null default '',
  erstellt_am timestamptz not null default now()
);

create index kontakte_besitzer_idx on public.kontakte (besitzer_id);

alter table public.kontakte enable row level security;

-- Kontakte sind privat: nur der Besitzer sieht und verwaltet sie
create policy "Eigene Kontakte verwalten"
  on public.kontakte for all
  to authenticated
  using ((select auth.uid()) = besitzer_id)
  with check ((select auth.uid()) = besitzer_id);

-- ─────────────────────────────────────────────────────────────
-- Empfehlungen: Mitglied A empfiehlt Mitglied B einen Kontakt
-- ─────────────────────────────────────────────────────────────
create type public.empfehlung_status as enum (
  'offen', 'angenommen', 'abgelehnt', 'auftrag_erhalten'
);

create table public.empfehlungen (
  id          uuid primary key default gen_random_uuid(),
  von_id      uuid not null references public.profile (id) on delete cascade,
  an_id       uuid not null references public.profile (id) on delete cascade,
  kontakt_id  uuid references public.kontakte (id) on delete set null,
  -- Kopie der Kontaktdaten zum Zeitpunkt der Empfehlung, damit der
  -- Empfänger sie sieht, ohne Zugriff auf die privaten Kontakte zu haben
  kontakt_name     text not null,
  kontakt_firma    text not null default '',
  kontakt_leistung text not null default '',
  kontakt_email    text not null default '',
  kontakt_telefon  text not null default '',
  nachricht   text not null default '',
  status      public.empfehlung_status not null default 'offen',
  erstellt_am timestamptz not null default now(),
  constraint nicht_an_sich_selbst check (von_id <> an_id)
);

create index empfehlungen_von_idx on public.empfehlungen (von_id);
create index empfehlungen_an_idx  on public.empfehlungen (an_id);

alter table public.empfehlungen enable row level security;

-- Absender und Empfänger sehen die Empfehlung
create policy "Beteiligte sehen Empfehlungen"
  on public.empfehlungen for select
  to authenticated
  using ((select auth.uid()) in (von_id, an_id));

-- Nur im eigenen Namen empfehlen
create policy "Empfehlung erstellen"
  on public.empfehlungen for insert
  to authenticated
  with check ((select auth.uid()) = von_id);

-- Empfänger aktualisiert den Status
create policy "Empfänger aktualisiert Status"
  on public.empfehlungen for update
  to authenticated
  using ((select auth.uid()) = an_id)
  with check ((select auth.uid()) = an_id);

-- Der Empfänger darf ausschließlich den Status ändern, nicht den Inhalt
revoke update on public.empfehlungen from authenticated;
grant update (status) on public.empfehlungen to authenticated;
