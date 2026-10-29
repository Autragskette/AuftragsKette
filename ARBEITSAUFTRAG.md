# Arbeitsauftrag AuftragsKette

Auftraggeber: Inhaber von AuftragsKette
Stand: 29.10.2026

Dieses Dokument beschreibt, was die App am Ende können muss. Es ist die
verbindliche Grundlage für alle, die am Code arbeiten (Claude, ChatGPT,
Entwickler). Jede Ausbaustufe wird sofort auf
https://auftragskette.vercel.app veröffentlicht und dort getestet.

---

## Grundidee

AuftragsKette ist **in erster Linie ein großes, geschlossenes
Unternehmernetzwerk** für Unternehmer und Selbstständige: mit
Online-Meetings zum Netzwerken, Branchentreffen und Erfahrungsaustausch.
Der besondere Mehrwert ist, dass daraus Aufträge entstehen. So muss die App
nach außen auftreten (Startseite, Einladungen, Bestätigungsseite). Mitglieder bringen Geschäftskontakte ein, die sie
persönlich kennen und fachlich einschätzen können. Braucht ein Kunde eine
Leistung, empfiehlt ein Mitglied gezielt einen passenden Kontakt aus der
Region. Aus Empfehlungen entstehen Aufträge.

Beispiel: Ein Fotograf wird von seinem Kunden gefragt „Kennst du einen
Floristen?“. Er sucht in AuftragsKette einen Floristen aus der Region des
Kunden und schickt ihm die Empfehlung per WhatsApp, E-Mail oder als
Visitenkarte.

---

## 1. Aufnahme und Pflichtkontakte

- Aufnahme nur über persönliche Empfehlung oder Einladung, keine offene
  Registrierung.
- Mitglied ist man ab der Aufnahme.
- Pflichtkontakte (müssen der Listung zustimmen):
  - **1. Kontakt zum Start**
  - **2. Kontakt innerhalb von 2 Monaten**
  - **3. Kontakt innerhalb von 3 Monaten**
- Lehnen vorgeschlagene Kontakte ab, bleibt man trotzdem Mitglied und hat
  ab der letzten Ablehnung **6 Monate Nachfrist**, um neue Kontakte
  einzubringen.
- Später als Option: Kontakte, die man über das Netzwerk kennengelernt hat,
  als Pflichtkontakt zählen lassen.

## 2. Bestätigung durch den Kontakt (Double Opt-in)

- Wird ein Kontakt mit E-Mail-Adresse eingetragen, erhält er automatisch
  eine E-Mail:
  - wer ihn empfohlen hat,
  - was AuftragsKette ist und wie das Konzept funktioniert,
  - Bitte um Zustimmung, im Netzwerk gelistet zu werden.
- Der Kontakt bestätigt mit einem Klick (oder lehnt ab) und kann die
  Zustimmung jederzeit über denselben Link widerrufen.
- Ein bestätigter Kontakt ist **gelisteter Partner** (kein Login, keine
  Kosten). In der Bestätigung kann er zusätzlich Interesse an einer
  eigenen Mitgliedschaft angeben.
- **Erst nach Bestätigung** ist der Kontakt im Netzwerk sichtbar und
  empfehlbar, und erst dann zählt er als Pflichtkontakt.
- Ohne Bestätigung keine Veröffentlichung (DSGVO).
- Das Mitglied sieht pro Kontakt den Status: eingeladen, bestätigt,
  abgelehnt. Einladung kann erneut gesendet werden.

## 3. Regionale Suche im Netzwerk

- Mitglieder suchen bestätigte Kontakte nach **Gewerk/Leistung** und
  **Region** (PLZ bzw. Ort, Umkreis).
- Ergebnis zeigt auch, **wer** den Kontakt empfohlen hat.
- Ziel: Jede Region und jedes Gewerk abdecken, auch wenn man selbst dort
  niemanden kennt.
- Übersicht, in welchen Regionen welche Gewerke noch fehlen.

## 4. Empfehlung an Kunden senden

- Aus der Suche heraus einen Kontakt an einen Kunden empfehlen über:
  - **WhatsApp** (vorformulierte Nachricht),
  - **E-Mail**,
  - **digitale Visitenkarte** (Link bzw. vCard zum Speichern).
- Jede Empfehlung wird gespeichert: wer, an welchen Kunden, welcher
  Kontakt, wann.
- Der empfohlene Kontakt wird über die Empfehlung informiert.

## 5. Nachverfolgung nach 7 Tagen

- **7 Tage** nach einer Empfehlung fragt die App automatisch nach:
  „Kam es zu einem Auftrag?“
- Kam es nicht zu einem Auftrag, wird beim Kunden einmal mit einer
  **Erinnerung** nachgehakt (nur wenn der Kunde dem zugestimmt hat).
- Ergebnis wird an der Empfehlung gespeichert (Auftrag ja/nein).
- Statistik im Dashboard: Empfehlungen gegeben/erhalten, daraus
  entstandene Aufträge.

## 6. Aktivität, Punkte und Top-Mitglied

Ziel: eine aktive Community ohne Karteileichen. Wer nur Empfehlungen
bekommt, aber keine gibt, wird darauf hingewiesen.

Punkte (letzte 12 Monate), Regeln zentral in `app/lib/aktivitaet.ts`:

| Aktion | Punkte |
|---|---|
| Empfehlung an einen Kunden gegeben | 10 |
| Daraus Auftrag entstanden | 20 |
| Ergebnis zurückgemeldet | 3 |
| Kontakt eingebracht und bestätigt | 15 |
| Eigener Kontakt von anderen empfohlen | 5 |
| Aktive Woche in der App | 2 |
| Teilnahme an einem Online-Branchen-Call (Teams) | 8 |
| Teilnahme an einem regionalen Community-Treffen | 12 |

Stufen:
- **Mitglied**: unter 40 Punkten
- **Aktives Mitglied**: ab 40 Punkten
- **Top-Mitglied ★** (wie der Superhost bei Airbnb): ab 150 Punkten, mindestens
  5 gegebene Empfehlungen, 1 Auftrag daraus und aktiv in den letzten 30 Tagen

Rangliste „Top im Netzwerk“: aktivste Mitglieder und meistempfohlene Partner.

### Veranstaltungen

- **Online-Branchen-Calls**: innerhalb einer Branche, in Teams-Räumen
  (Link wird angemeldeten Mitgliedern angezeigt).
- **Regionale Community-Treffen**: vor Ort, alle Branchen einer Region.
- Mitglieder melden sich an („Ich bin dabei“) und checken während der
  Veranstaltung mit einem **Teilnahme-Code** ein, den der Gastgeber nennt.
  Erst dann gibt es Punkte (ab 30 Minuten vor Beginn bis 24 Stunden nach Ende).
- Veranstaltungen legen Admins an (Spalte `ist_admin` im Profil, nur per
  Datenbank setzbar). Admins sehen den Teilnahme-Code und die Zahl der
  Anmeldungen und Teilnahmen.
- Eine Teilnahme zählt auch als Beitrag gegen Inaktivität.

## 7. Inaktivität und Verlängerung

- Nach **30 Tagen ohne Besuch** oder **60 Tagen ohne Beitrag** (Empfehlung,
  Kontakt, Ergebnis, Teilnahme an einer Veranstaltung): Erinnerung in der App und per E-Mail.
- Nach **90 Tagen ohne Beitrag**: Warnung, Verlängerung gefährdet.
- Neue Mitglieder haben 30 Tage Schonfrist.
- Die Mitgliedschaft läuft ein Jahr. Sie wird **nur verlängert**, wenn man
  zum Stichtag Aktives Mitglied ist (mindestens 40 Punkte) und in den
  letzten 90 Tagen etwas beigetragen hat. Die automatische Umsetzung folgt
  mit der Zahlungsabwicklung.
- Gibt jemand deutlich weniger Empfehlungen, als er selbst bekommt, erscheint
  ein Hinweis „Gib etwas zurück“.

## 8. Weitere Bausteine (später)

- Mitgliederprofil (Firma, Gewerk, Region, Kontaktdaten)
- Einladung neuer Mitglieder durch bestehende Mitglieder
- Mitgliedschaft 69 €/Monat mit Zahlung (z. B. Stripe)
- Veranstaltungen für Mitglieder
- Impressum und Datenschutzerklärung mit echten Daten (Pflicht vor
  Livegang)

---

## Ausbaustufen

| Stufe | Inhalt | Status |
|---|---|---|
| 0 | Startseite, Anmeldung, Dashboard, Mein Netzwerk | fertig, online |
| 1 | Kontaktbestätigung, Pflichtkontakte mit Frist, Profil | fertig, online |
| 2 | Regionale Suche im Netzwerk (PLZ-Bereich oder Ort) | fertig, online |
| 3 | Empfehlung an Kunden (WhatsApp, E-Mail, Visitenkarte mit vCard) | fertig, online |
| 4 | Nachfrage nach 7 Tagen in der App, Erinnerung an Kunden, Statistik | fertig, online |
| 4b | Automatische E-Mails (Resend), täglicher Lauf für Nachfragen und Erinnerungen | vorbereitet, Resend-Konto und Server-Schlüssel fehlen |
| 5 | Neue Pflichtkontakt-Regeln, Aktivitätspunkte, Top-Mitglied, Rangliste, Inaktivität | fertig, online |
| 5b | Veranstaltungen (Branchen-Calls, regionale Treffen) mit Check-in und Punkten | fertig, online |
| 6 | Einladung neuer Mitglieder, Zahlung | geplant |

## Entscheidungen

- Bestätigter Kontakt = gelisteter Partner, Mitgliedschaft optional
- Pflichtkontakte: 1 zum Start, 2. nach 2 Monaten, 3. nach 3 Monaten;
  6 Monate Nachfrist bei Ablehnungen
- E-Mail-Dienst: Resend. Bis er eingerichtet ist, verschicken Mitglieder
  Einladungen, Empfehlungen und Erinnerungen über WhatsApp oder ihre
  eigene E-Mail-App direkt aus der App heraus.
- Nachfrage beim Kunden nur, wenn der Kunde zugestimmt hat (DSGVO)

## Offene Punkte

- Resend-Konto und eigene Domain (z. B. auftragskette.de) für den
  automatischen Versand; dann `RESEND_API_KEY` und `EMAIL_ABSENDER`
  bei Vercel eintragen
- Automatische tägliche Nachfrage per E-Mail (Vercel Cron), sobald Resend
  läuft
- Umkreissuche in km (aktuell PLZ-Bereich bzw. Ort)
- Übersicht, welche Gewerke in welchen Regionen fehlen

## Technik

- Next.js + Tailwind im Ordner `app/`
- Supabase (Datenbank, Anmeldung), Region EU (Irland)
- Hosting: Vercel, Funktionen in Dublin (`dub1`), automatische
  Veröffentlichung bei jedem Push auf `main`
- Datenbankänderungen als Datei in `app/supabase/migrations/`
