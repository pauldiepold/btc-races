# BTC Wettkampfanmeldung

Eine moderne Anwendung zur Verwaltung von Wettkampfanmeldungen für die BTC-Vereinsmitglieder.

## Funktionen

- **Wettkampfverwaltung**: Erstellen, Bearbeiten und Löschen von Wettkämpfen
- **Anmeldungsprozess**: Einfacher Anmeldeprozess mit E-Mail-Bestätigung
- **Mitgliederverwaltung**: Excel-Import und Mitgliederverwaltung
- **Benachrichtigungssystem**: Automatisierte E-Mail-Benachrichtigungen
- **Authentifizierung**: Microsoft Entra ID Integration für Admins

## Technologie-Stack

- **Frontend**: Nuxt 3 mit Vue 3
- **UI-Framework**: Nuxt UI
- **Backend-Datenbank**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Auth**: Microsoft-Entra
- **E-Mail-Provider**: Microsoft Azure

## Einrichtung

### Voraussetzungen

- Node.js 18 oder höher
- npm
- Supabase-Konto (kostenloser Tier ausreichend)

### Installation

1. Repository klonen

2. Abhängigkeiten installieren

   ```bash
   npm install
   ```

3. Umgebungsvariablen konfigurieren

   ```bash
   cp .env.example .env
   ```

   Bearbeite die `.env`-Datei und füge deine Supabase-Zugangsdaten ein.

4. Supabase-Projekt einrichten

   - Erstelle ein neues Projekt auf [Supabase](https://supabase.com)
   - Führe das Schema aus `server/db/schema.sql` in der SQL-Konsole von Supabase aus
   - Kopiere die URL und den API-Key in deine `.env`-Datei

5. Entwicklungsserver starten
   ```bash
   npm run dev
   ```

## Projektstruktur

- `assets/`: Statische Assets wie CSS und Bilder
- `components/`: Wiederverwendbare Vue-Komponenten
- `composables/`: Kompositionsfunktionen (z.B. Supabase-Integration)
- `layouts/`: Seitenlayouts (Admin vs. Öffentlich)
- `pages/`: Seitenkomponenten (Routing basiert auf Dateistruktur)
- `public/`: Öffentliche Dateien
- `server/`: Serverseitige Dateien und Datenbankschema

## Nächste Schritte für die Entwicklung

### Notwendig:

- ✅ Competitions bearbeiten können
- ✅ Neue Felder auf Competitions + Filter auf Übersicht:
  - ✅meldepflichtig
  - ✅ Meisterschaft
  - ✅ Track / Road
  - 🟡 Distanzen --> Tabelle angelegt, noch nirgendwo verwendet
- ✅ Favicon hinzugefügt, Metadaten angepasst, Navbar und Footer aufgeräumt
- ✅ Layout anpassen + Transitions hinzufügen
- 🟡 E-Mails:
  - ✅ mit Microsoft Azure verbunden
  - ✅ Templating hinzugefügt, noch nicht getestet
  - ❌ Bestätigungsmail nach Anmeldung mit Verifizierungslink
  - ❌ Erinnerungsmail an Mitglieder 5 Tage vor Meldefrist mit Abmeldelink
  - ❌ Erinnerungsmail an Admins 3 Tage vor Meldefrist
  - ❌ Erinnerungsmail an teilnehmende Mitglieder 3 Tage vor dem Wettkampf
  - ❌ Nachfrage-E-Mail nach 3 Tagen bei nicht bestätigten Anmeldungen
  - ❌ Cronjobs für Erinerungsmails
  - ❌ E-Mail mit Token für Bestätigung senden bei Registrierung
- ❌ nicht bei Events anmelden können, bei denen die Anmeldefrist vergangen ist
- ✅ Startpass importieren aus Campai
  - ✅ Anmeldung bei meldepflichtigen Events sperren
- ❌ Abmeldung ermöglichen
- ❌ Echte Daten zu den Wettkämpfen importieren --> von Cindy holen

### Bonus:

- ❌ User können selbst Wettkämpfe einstellen --> Freischaltung durch Admins notwendig?
- ❌ Light-Mode wieder aktivieren und Design etwas verbessern
- ❌ Nach Anmeldung sofort ohne Timeout weiterleiten und zur neuen Anmeldung scrollen + grün aufblinken lassen (bzw. sowieso die neusten oben anzeigen)
- ❌Admin: Nachrichten an alle Teilnehmer senden können
- ❌Datum für Erinnerungs-Mails einstellen können?

### Code-Qualität:

- ❌ Typen sortieren, gerade bei den Requests ist etwas Chaos
- ❌ Alle Supabase Abfragen in einen Service auslagern, Client + Serverseitig trennen?

## Mit der Datenbank arbeiten

### Neue Datenfelder hinzufügen:

1. Neue Migration erstellen:

   ```bash
   npx supabase migration new migration_name
   ```

2. In die neue leere Datei die gewünschte Änderung schreiben

3. Lokale Datenbank zurücksetzen (löscht die Datenbank, führt alle Migrationen aus und führt das Seeding aus):

   ```bash
   npx supabase db reset
   ```

   Falls kein komplette Reset gewünscht ist, kann auch nurdie Migration ausgeführt werden:

   ```bash
   npx supabase migration up
   ```

4. Aus der lokalen Supabase-Konsole (http://127.0.0.1:54323/) müssen die Database.types erneut heruntergeladen werden: Unter API Docs / TABLES AND VIEWS / Introduction / Generate and download types kann die Datei heruntergeladen werden und muss `~/types/database.types.ts` ersetzen.

5. Zuletzt muss das Seeding angepasst werden. Am einfachsten per AI und die Änderung beschreiben.

6. Solange die Migration noch nicht in der Prod-Datenbank vorhanden ist, kann sie noch verändert werden und mit `npx supabase db reset` getestet werden. Sobald die Entwicklung abgeschlossen ist, kann sie auf die remote Datenbank gepusht werden:

   ```bash
   npx supabase db push
   ```

   Zuvor muss einmalig folgendes ausgeführt werden:

   ```bash
   npx supabase login
   npx supabase link
   ```
