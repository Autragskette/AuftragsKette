-- Hinweise an Partner zum Ende der Testphase (1 = endet bald, 2 = beendet)
alter table public.profile
  add column test_hinweis_stufe smallint not null default 0;

-- Testphasen aller Partner-Konten, nur für den täglichen Lauf (Server-Schlüssel)
create function public.partner_testphasen()
returns table (
  nutzer_id uuid,
  email text,
  vorname text,
  empfehlungen int,
  frei_bis timestamptz,
  pausiert boolean,
  hinweis_stufe smallint
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, u.email, p.vorname, s.empfehlungen, s.frei_bis, s.pausiert, p.test_hinweis_stufe
    from public.profile p
    join auth.users u on u.id = p.id
    cross join lateral (
      select k.id from public.kontakte k
       where k.email <> '' and lower(k.email) = lower(u.email) and k.status = 'bestaetigt'
       order by k.bestaetigt_am
       limit 1
    ) k
    cross join lateral public.partner_kennenlernen(k.id) s
   where p.rolle = 'partner';
$$;

revoke execute on function public.partner_testphasen() from public, anon, authenticated;
grant execute on function public.partner_testphasen() to service_role;

-- Mitglied werden: Interesse vormerken (bis die Bezahlung eingerichtet ist)
alter table public.profile
  add column mitglied_anfrage_am timestamptz;

create function public.mitgliedschaft_anfragen()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  update public.profile
     set mitglied_anfrage_am = coalesce(mitglied_anfrage_am, now())
   where id = (select auth.uid());
$$;

revoke execute on function public.mitgliedschaft_anfragen() from public, anon;
grant execute on function public.mitgliedschaft_anfragen() to authenticated;
