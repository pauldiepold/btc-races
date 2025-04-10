# BTC Wettkampfanmeldung

Eine moderne Anwendung zur Verwaltung von Wettkampfanmeldungen für Vereinsmitglieder.

## Funktionen


- **Authentifizierung**: Microsoft Entra ID Integration für Admins
- **Mitgliederverwaltung**: Excel-Import und Mitgliederverwaltung
- **Wettkampfverwaltung**: Erstellen, Bearbeiten und Löschen von Wettkämpfen
- **Anmeldungsprozess**: Einfacher Anmeldeprozess mit E-Mail-Bestätigung
- **Benachrichtigungssystem**: Automatisierte E-Mail-Benachrichtigungen

## Technologie-Stack

- **Frontend**: Nuxt 3 mit Vue 3
- **UI-Framework**: Nuxt UI mit Vereinsfarben (Schwarz und #ffb700)
- **Backend-Datenbank**: Supabase (PostgreSQL)
- **Hosting**: Vercel (kostenloser Tier)

## Einrichtung

### Voraussetzungen

- Node.js 18 oder höher
- PNPM
- Supabase-Konto (kostenloser Tier ausreichend)

### Installation

1. Repository klonen
   ```bash
   git clone <repository-url>
   cd btc-races
   ```

2. Abhängigkeiten installieren
   ```bash
   pnpm install
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
   pnpm run dev
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

1. **Supabase einrichten**
   - Erstelle ein Supabase-Projekt
   - Führe das Datenbankschema aus
   - Konfiguriere die Umgebungsvariablen

2. **Authentifizierung implementieren**
   - Microsoft Entra ID Integration für Admin-Bereich
   - Geschützte Routen im Admin-Bereich

3. **Datenbankanbindung**
   - Mitgliederdaten-Import
   - CRUD-Operationen für Wettkämpfe

4. **E-Mail-System**
   - Bestätigungsmails
   - Erinnerungsmails
   - E-Mail-Vorlagen

5. **Filterfunktionen**
   - Filter für Wettkämpfe implementieren
   - Sortierung und Suche hinzufügen

6. **Deployment**
   - CI/CD-Pipeline auf Vercel einrichten
   - Produktions-Deployment

## Lizenz

Dieses Projekt ist intern für den BTC (Berliner Triathlon Club) entwickelt und nicht öffentlich lizenziert.
