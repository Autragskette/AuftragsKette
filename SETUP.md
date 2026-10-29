# AuftragsKette einrichten: Supabase

Supabase stellt die Benutzerkonten und die Datenbank bereit. Der Start ist kostenlos.

## 1. Projekt anlegen

1. Auf https://supabase.com mit deinem GitHub-Konto anmelden.
2. **New project** klicken.
3. Name: `auftragskette`, ein sicheres Datenbank-Passwort vergeben (gut aufbewahren).
4. Region: **Central EU (Frankfurt)** wählen, damit die Daten in Deutschland liegen.
5. Warten, bis das Projekt fertig ist (ca. 1–2 Minuten).

## 2. Datenbank-Tabellen anlegen

1. Links im Menü **SQL Editor** öffnen.
2. Den kompletten Inhalt von [`app/supabase/migrations/0001_grundschema.sql`](app/supabase/migrations/0001_grundschema.sql) einfügen.
3. **Run** klicken. Es sollte „Success“ erscheinen.

## 3. Öffentliche Registrierung abschalten

AuftragsKette nimmt Mitglieder nur auf Einladung auf.

1. **Authentication → Sign In / Providers** öffnen.
2. **Allow new users to sign up** ausschalten.

## 4. Erstes Mitglied anlegen (zum Testen)

1. **Authentication → Users → Add user → Create new user**.
2. E-Mail und Passwort eingeben, **Auto Confirm User** anhaken.

## 5. Zugangsdaten in die App eintragen

Unter **Project Settings → API Keys** bzw. **Data API** findest du:

- die **Project URL**
- den **Publishable key** (beginnt mit `sb_publishable_`)

Diese beiden Werte werden beim Hoster (z. B. Vercel) als Umgebungsvariablen hinterlegt:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

Für lokales Testen: `app/.env.example` nach `app/.env.local` kopieren und die Werte eintragen.

> **Nie** den `service_role`- bzw. `secret`-Key in die App oder ins Repo eintragen.

## 6. Automatische E-Mails und täglicher Lauf (optional, später)

Für automatische Einladungen, Nachfragen nach 7 Tagen und Erinnerungen bei
Inaktivität bei Vercel unter **Settings → Environment Variables** eintragen:

- `RESEND_API_KEY` und `EMAIL_ABSENDER` (Konto bei https://resend.com)
- `SUPABASE_SECRET_KEY`: Supabase **Project Settings → API Keys → Secret key**.
  Nur bei Vercel eintragen, niemals ins Repo oder in einen Chat.
- `CRON_SECRET`: ein beliebiges langes Zufallspasswort (schützt den täglichen Lauf)
- `NEXT_PUBLIC_SITE_URL` ist bereits gesetzt.

Der Lauf startet täglich um 8 Uhr (`app/vercel.json`).
