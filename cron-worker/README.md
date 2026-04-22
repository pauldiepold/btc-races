# btc-races Cron-Worker

Cloudflare Worker, der zeitgesteuert Cron-Endpoints der Nuxt-App pingt.
Separat vom Haupt-Projekt, weil Cloudflare Pages keine nativen Cron Triggers unterstützt.

## Schedules

| Cron (UTC)      | Endpoint                               | Zweck                                |
| --------------- | -------------------------------------- | ------------------------------------ |
| `* * * * *`     | `POST /api/cron/process-notifications` | Queue abarbeiten (pending + failed)  |
| `0 7 * * *`     | `POST /api/cron/send-reminders`        | Reminder-Jobs anlegen (N-06/07/08)   |
| `0 2 * * 0`     | `POST /api/cron/cleanup-notifications` | Alte Done-Jobs entfernen (90 Tage)   |

Preview-Environment verwendet `*/5 * * * *` und zeigt auf die develop-URL.

## Setup

```bash
cd cron-worker
pnpm install

# Secret setzen (muss zum NUXT_CRON_TOKEN der Nuxt-App passen)
pnpm secret:set           # Prod
pnpm secret:set:preview   # Preview
```

## Deploy

```bash
pnpm deploy           # Production (btc-races-cron)
pnpm deploy:preview   # Preview (btc-races-cron-preview)
```

## Logs live mitlesen

```bash
pnpm tail
pnpm tail:preview
```

## Lokal testen

```bash
pnpm dev
# Dann im zweiten Terminal:
curl -X POST http://localhost:8787/__scheduled?cron=*+*+*+*+*
```
