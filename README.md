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

## Nächste Schritte für die Entwicklung

### Notwendig:

- ✅ Competitions bearbeiten können
- ✅ Neue Felder auf Competitions + Filter auf Übersicht:
  - ✅meldepflichtig
  - ✅ Meisterschaft
  - ✅ Track / Road
- ✅ Favicon hinzugefügt, Metadaten angepasst, Navbar und Footer aufgeräumt
- ✅ Layout anpassen + Transitions hinzufügen
- ✅ E-Mails:
  - ✅ mit Microsoft Azure verbunden
  - ✅ Templating hinzugefügt, noch nicht getestet
  - ✅ Bestätigungsmail nach Anmeldung mit Verifizierungslink
  - ✅ Von Wettkämpfen wieder abmelden können
- ✅ nicht bei Events anmelden können, bei denen die Anmeldefrist vergangen ist
- ✅ Startpass importieren aus Campai
  - ✅ Anmeldung bei meldepflichtigen Events sperren
- ❌ Echte Daten zu den Wettkämpfen importieren --> von LADV importieren
- ✅ Beschreibungen überall anpassen:
  - ✅ Register: Falls du keinen Startpass hast... --> rechts in der Sidebar evt. noch die Kurzinfos zum Wettkampf anzeigen
  - ✅ Ist die Startseite ausreichend?

### Bonus:

- ❌ User können selbst Wettkämpfe einstellen --> Freischaltung durch Admins notwendig?
- ❌ Light-Mode wieder aktivieren und Design etwas verbessern
- ❌ Nach Anmeldung sofort ohne Timeout weiterleiten und zur neuen Anmeldung scrollen + grün aufblinken lassen (bzw. sowieso die neusten oben anzeigen)
- ❌Admin: Nachrichten an alle Teilnehmer:innen senden können
- ❌Datum für Erinnerungs-Mails einstellen können?
- Daten zu den Wettkämpfen erweitern:
  - 🟡 Distanzen --> Tabelle angelegt, noch nirgendwo verwendet --> Disziplincodes aus LADV verwenden
- E-Mail Ergänzungen:
  - ❌ Erinnerungsmail an Mitglieder 5 Tage vor Meldefrist mit Abmeldelink
  - ❌ Erinnerungsmail an Admins 3 Tage vor Meldefrist
  - ❌ Erinnerungsmail an teilnehmende Mitglieder 3 Tage vor dem Wettkampf
  - ❌ Nachfrage-E-Mail nach 3 Tagen bei nicht bestätigten Anmeldungen
  - ❌ Cronjobs für Erinerungsmails

### Code-Qualität:

- ✅ Typen sortieren, gerade bei den Api Responses und Models ist etwas Chaos
- ✅ Alle Supabase Abfragen in einen Service auslagern, Client + Serverseitig trennen?

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

# Repository-System

## Struktur

Das Repository-System bietet eine konsistente API für den Zugriff auf Datenbanktabellen. Es umfasst:

### Basisklassen

- **BaseRepository**: Grundfunktionalität für alle Repositories
- **ClientRepository**: Für Client-seitige Verwendung (im Browser)
- **ServerRepository**: Für Server-seitige Verwendung (API-Routen)
- **ServiceRoleRepository**: Für Server-seitige Verwendung mit administrativen Rechten

### Konkrete Implementierungen

Jede Tabelle hat in der Regel drei spezialisierte Repository-Klassen:

- **[Name]ClientRepository**: Für Browser-Zugriff
- **[Name]ServerRepository**: Für normalen Server-Zugriff
- **[Name]ServiceRepository**: Für Server-Zugriff mit erhöhten Rechten

### Factory-Funktionen

Anstatt statische Methoden für jede Klasse zu implementieren, verwenden wir spezialisierte Factory-Funktionen:

```typescript
// Erstellen eines Server-Repositories
const sentEmails = await createSentEmailsServerRepository(event)

// Erstellen eines ServiceRole-Repositories
const sentEmails = await createSentEmailsServiceRepository(event)
```

## Verwendung

### Client-seitig

Mit dem `useRepositories` Composable:

```typescript
// In einer Vue-Komponente
const { sentEmails } = useRepositories()

// Daten abfragen
const email = await sentEmails.findByToken('token123')
```

### Server-seitig

Mit dem `createServerRepositories` Helfer:

```typescript
// In einem API-Handler
export default defineEventHandler(async (event) => {
  const { sentEmails } = await createServerRepositories(event)

  // Mit normalen Nutzerrechten arbeiten
  const emails = await sentEmails.findAll()

  return { emails }
})
```

### Mit administrativen Rechten

```typescript
// In einem API-Handler
export default defineEventHandler(async (event) => {
  const { sentEmails } = await createServerRepositories(event, true)

  // Mit administrativen Rechten arbeiten
  await sentEmails.createWithoutRLS({ ... })

  return { success: true }
})
```

## LADV-Integration

Die Anwendung unterstützt die Integration mit dem [LADV-System](https://ladv.de/entwickler) (Leichtathletik-Verband Baden-Württemberg). Dies ermöglicht das automatische Importieren von Wettkampfdaten aus dem LADV-System.

### Funktionalität

- **Automatischer Import**: Wettkämpfe können über ihre LADV-ID importiert werden
- **Daten-Synchronisation**: Automatische Aktualisierung der Wettkampfdaten
- **Mock-Modus**: Entwicklung und Tests ohne API-Zugriff möglich

### Konfiguration

Die Integration wird über Umgebungsvariablen konfiguriert:

```env
NUXT_LADV_PROVIDER=mock|api  # Standard: mock
NUXT_LADV_API_KEY=your-key   # Nur für API-Modus erforderlich
```

### Technische Details

- **API-Dokumentation**: [LADV API V2 Dokumentation](https://html.ladv.de/api/2024-07-17-LADVAPIDokumentation-V2-014.pdf)
- **Datenmodell**: Erweiterung der `competitions`-Tabelle um LADV-spezifische Felder
- **Mock-Daten**: Realistische Testdaten für Entwicklung und Tests

### Verwendung

```typescript
import { LadvService } from '~/server/ladv'

const ladvService = new LadvService()

// Wettkampfdetails abrufen
const competition = await ladvService.getCompetitionDetails(123)

// Nach Wettkämpfen suchen
const competitions = await ladvService.searchCompetitions('Stuttgart')
```
