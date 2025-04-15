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

- TODO: Competitions bearbeiten können
- TODO: Neue Felder auf Competitions + Filter auf Übersicht:
  - meldepflichtig
  - Distanzen (enum in der Datenbank?)
  - Track / Road
  - Datum für Erinnerungs-Mails einstellen können?
- TODO: E-Mails:
  - Bestätigungsmail nach Anmeldung mit Verifizierungslink
  - Erinnerungsmail an Mitglieder 5 Tage vor Meldefrist mit Abmeldelink
  - Erinnerungsmail an Admins 3 Tage vor Meldefrist
  - Erinnerungsmail an teilnehmende Mitglieder 3 Tage vor dem Wettkampf
  - Nachfrage-E-Mail nach 3 Tagen bei nicht bestätigten Anmeldungen
  - TODO: Cronjobs für Erinerungsmails
  - TODO: E-Mail mit Token für Bestätigung senden bei Registrierung
- TODO: nicht bei Events anmelden können, bei denen die Anmeldefrist vergangen ist
- TODO: Hat Startpass importieren aus Campai + Anmeldung bei meldepflichtigen Events sperren
- TODO: Abmeldung ermöglichen

### Bonus:

- TODO: Typen sortieren, gerade bei den Requests ist etwas Chaos
- TODO: Admin: Nachrichten an alle Teilnehmer senden können
