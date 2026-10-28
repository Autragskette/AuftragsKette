# Arbeitsauftrag AuftragsKette

Auftraggeber: Inhaber von AuftragsKette
Stand: 29.10.2026

Dieses Dokument beschreibt, was die App am Ende können muss. Es ist die
verbindliche Grundlage für alle, die am Code arbeiten (Claude, ChatGPT,
Entwickler). Jede Ausbaustufe wird sofort auf
https://auftragskette.vercel.app veröffentlicht und dort getestet.

---

## Grundidee

AuftragsKette ist ein **geschlossenes Empfehlungsnetzwerk** für Unternehmer
und Selbstständige. Mitglieder bringen Geschäftskontakte ein, die sie
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
- Mitglied ist man ab der Aufnahme. Die Pflichtkontakte müssen **nicht**
  vorher vollständig sein.
- Ein neues Mitglied gibt **zu Beginn mindestens 2 Kontakte** an.
- Der 3. Kontakt muss innerhalb einer **Anfangsfrist** folgen
  (Frist: siehe offene Fragen).
- Das Dashboard zeigt jederzeit an, wie viele bestätigte Kontakte noch
  fehlen und wie lange die Frist noch läuft.

## 2. Bestätigung durch den Kontakt (Double Opt-in)

- Wird ein Kontakt mit E-Mail-Adresse eingetragen, erhält er automatisch
  eine E-Mail:
  - wer ihn empfohlen hat,
  - was AuftragsKette ist und wie das Konzept funktioniert,
  - Bitte um Zustimmung, im Netzwerk gelistet zu werden.
- Der Kontakt bestätigt mit einem Klick (oder lehnt ab).
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

## 6. Weitere Bausteine (später)

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
| 1 | E-Mail-Versand, Kontaktbestätigung, Pflichtkontakte mit Frist | in Arbeit |
| 2 | Regionale Suche im Netzwerk | geplant |
| 3 | Empfehlung an Kunden (WhatsApp, E-Mail, Visitenkarte) | geplant |
| 4 | Nachverfolgung nach 7 Tagen, Erinnerung, Statistik | geplant |
| 5 | Profile, Einladungen, Zahlung, Veranstaltungen | geplant |

## Offene Fragen

Werden mit dem Auftraggeber geklärt und hier eingetragen.

## Technik

- Next.js + Tailwind im Ordner `app/`
- Supabase (Datenbank, Anmeldung), Region EU (Irland)
- Hosting: Vercel, Funktionen in Dublin (`dub1`), automatische
  Veröffentlichung bei jedem Push auf `main`
- Datenbankänderungen als Datei in `app/supabase/migrations/`
