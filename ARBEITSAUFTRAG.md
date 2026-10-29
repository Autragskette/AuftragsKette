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

## 1. Aufnahme und Startkontakte

Wortwahl in der App: „Startkontakte“ (nicht „Pflichtkontakte“) und Kontakte „einladen“ (nicht „einbringen“).

- Aufnahme nur über persönliche Empfehlung oder Einladung, keine offene
  Registrierung.
- Mitglied ist man ab der Aufnahme.
- Startkontakte (müssen der Listung zustimmen):
  - **1. Kontakt zum Start**
  - **2. Kontakt innerhalb von 2 Monaten**
  - **3. Kontakt innerhalb von 3 Monaten**
- Lehnen vorgeschlagene Kontakte ab, bleibt man trotzdem Mitglied und hat
  ab der letzten Ablehnung **6 Monate Nachfrist**, um neue Kontakte
  einzubringen.
- Später als Option: Kontakte, die man über das Netzwerk kennengelernt hat,
  als Startkontakt zählen lassen.

### Netzwerkkontakte

- Mitglieder können auch Betriebe in ihr Netzwerk aufnehmen, die sie **über die
  AuftragsKette kennengelernt** haben (Veranstaltung, Empfehlung). Beim Einladen
  wählt man „Persönlich“ oder „Über die AuftragsKette“; aus der Suche geht das
  mit „+ In mein Netzwerk“.
- Auch Netzwerkkontakte müssen zustimmen (eigener Einladungstext).
- Sie sind in der App markiert, zählen **nicht** als Startkontakte und bringen
  **3 Punkte** (höchstens 5 pro Jahr), persönliche Kontakte weiterhin 15.
- Der Kunde bekommt bei ihnen den Text „Teil meines persönlichen
  Unternehmernetzwerks …“, nicht „Ich kenne die Arbeit persönlich“.
- Ab 3 Monaten Mitgliedschaft kann man erklären, keine weiteren eigenen
  Kontakte zu haben. Danach zählen Netzwerkkontakte als Startkontakte.

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
  empfehlbar, und erst dann zählt er als Startkontakt.
- Ohne Bestätigung keine Veröffentlichung (DSGVO).
- Das Mitglied sieht pro Kontakt den Status: eingeladen, bestätigt,
  abgelehnt. Einladung kann erneut gesendet werden.

## 3. Regionale Suche im Netzwerk (Umkreis)

- Mitglieder suchen bestätigte Kontakte nach **Gewerk/Leistung** und
  **Ort oder PLZ** im **Umkreis** (Standard 20 km, wählbar 10/20/30/50 km),
  damit auch Nachbarorte gefunden werden. Ortsdaten: GeoNames (CC BY 4.0),
  `app/lib/geo/plz-de.json`.
- Ohne Treffer im Umkreis: Hinweis, Erweiterung auf 50 km und die
  nächstgelegenen Partner außerhalb.
- Empfehlen in zwei Schritten: „Empfehlen“ beim Partner, dann
  „Per WhatsApp senden“ (Name und Nummer des Kunden optional).
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

## 7a. Preise und Kennenlernphase für Partner

- Mitgliedschaft: **Jahresabo 69 € netto/Monat** (12 Monate Laufzeit,
  monatliche Zahlung) oder **Halbjahresabo 89 € netto/Monat** (6 Monate).
- Eingeladene Partner sind zunächst ganz kostenlos dabei. Testregel:
  - endet mit der **2. erhaltenen Empfehlung**,
  - nach **3 Monaten**, wenn bis dahin mindestens eine Empfehlung kam,
  - ohne Empfehlung läuft der Test weiter, **spätestens 6 Monate**.
- Danach ist der Partner **pausiert**: nicht mehr in der Suche, nicht mehr
  empfehlbar, aber nicht gelöscht. Wird er Mitglied, ist er sofort wieder
  sichtbar. Für das einladende Mitglied zählt er weiter als Startkontakt.
  Bereits angelegte Empfehlungen (auch die 2.) kann das Mitglied weiter senden.
- Ist ein Partner von mehreren Mitgliedern eingetragen (gleiche E-Mail),
  werden seine Empfehlungen zusammengezählt.

### Schnupperzugang

- Nach der Zustimmung kann sich der Partner einen kostenlosen Zugang anlegen
  (E-Mail aus seinem Eintrag, eigenes Passwort, Bestätigung per E-Mail).
- Rolle **Partner**: sieht seinen Teststand, wer ihn empfohlen hat (ohne
  Kundendaten), Termine und wie viele Betriebe im Netzwerk sind. Die Suche
  zeigt nur Gewerk, Ort und Entfernung, keine Namen.
- Gesperrt (in der Datenbank, nicht nur in der App): Kontakte einbringen,
  empfehlen, Namen und Kontaktdaten anderer, Teilnahme und Einchecken,
  Punkte und Bestenliste.
- „Mitglied werden“ merkt den Wunsch vor; freigeschaltet wird von Hand,
  bis die Zahlung (Stripe) eingerichtet ist.

### Benachrichtigungen an Partner

- **Kostenlos, keine WhatsApp-Business-Schnittstelle.**
- Nach jeder Empfehlung bietet die App dem Mitglied an, den Partner **aus
  dem eigenen WhatsApp** zu informieren (vorformulierte Nachricht).
- **Push-Nachricht** aufs Handy des Partners, sofort bei jeder Empfehlung,
  sobald er sie in seinem Zugang einschaltet (iPhone: App auf dem
  Home-Bildschirm nötig).
- Täglicher Lauf: Hinweis 7 Tage vor Ende und am Ende der Testphase per Push,
  zusätzlich per E-Mail, sobald Resend eingerichtet ist.
- Umsetzung: Migrationen 0008 bis 0012, `app/lib/push.ts`, `public/sw.js`,
  Werte in `app/lib/preise.ts`, Texte in `app/lib/texte.ts`.

## 8. Weitere Bausteine (später)

- Mitgliederprofil (Firma, Gewerk, Region, Kontaktdaten)
- Einladung neuer Mitglieder durch bestehende Mitglieder
- Zahlung der Mitgliedschaft (z. B. Stripe) und Mitteilung an Partner, wenn die Kennenlernphase endet
- Veranstaltungen für Mitglieder
- Impressum und Datenschutzerklärung mit echten Daten (Pflicht vor
  Livegang)

---

## Ausbaustufen

| Stufe | Inhalt | Status |
|---|---|---|
| 0 | Startseite, Anmeldung, Dashboard, Mein Netzwerk | fertig, online |
| 1 | Kontaktbestätigung, Startkontakte mit Frist, Profil | fertig, online |
| 2 | Regionale Suche im Netzwerk (PLZ-Bereich oder Ort) | fertig, online |
| 3 | Empfehlung an Kunden (WhatsApp, E-Mail, Visitenkarte mit vCard) | fertig, online |
| 4 | Nachfrage nach 7 Tagen in der App, Erinnerung an Kunden, Statistik | fertig, online |
| 4b | Automatische E-Mails (Resend), täglicher Lauf für Nachfragen und Erinnerungen | vorbereitet, Resend-Konto und Server-Schlüssel fehlen |
| 5 | Neue Startkontakt-Regeln, Aktivitätspunkte, Top-Mitglied, Rangliste, Inaktivität | fertig, online |
| 5b | Veranstaltungen (Branchen-Calls, regionale Treffen) mit Check-in und Punkten | fertig, online |
| 6 | Einladung neuer Mitglieder, Zahlung | geplant |

## Entscheidungen

- Bestätigter Kontakt = gelisteter Partner, Mitgliedschaft optional
- Startkontakte: 1 zum Start, 2. nach 2 Monaten, 3. nach 3 Monaten;
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

- **Gestaltung**: Marineblau (`tinte` #13294B) als Hauptfarbe, Ketten-Blau
  (`kette` #2457D6) als Akzent, Messing (`messing` #B8862B) nur für
  Top-Mitglieder, Hintergrund `papier` #F3F5F8, Schrift Instrument Sans.
  Die Suchkarte „Wen sucht dein Kunde?“ ist das zentrale Element der Startseite.

- **Mobile first**: Mitglieder nutzen die App fast nur am Handy. Jede neue
  Seite zuerst für Handybreite gestalten (untere Navigationsleiste, große
  Tippflächen, Eingabefelder mind. 16px). Die App ist als Web-App auf dem
  Startbildschirm installierbar (`app/manifest.ts`).

- Next.js + Tailwind im Ordner `app/`
- Supabase (Datenbank, Anmeldung), Region EU (Irland)
- Hosting: Vercel, Funktionen in Dublin (`dub1`), automatische
  Veröffentlichung bei jedem Push auf `main`
- Datenbankänderungen als Datei in `app/supabase/migrations/`
