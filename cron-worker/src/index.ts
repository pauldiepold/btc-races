/**
 * btc-races Cron-Worker
 *
 * Löst zeitgesteuert HTTP-Requests auf die Nuxt-API aus.
 * Cloudflare Pages unterstützt keine nativen Cron Triggers — dieser Worker
 * übernimmt das Scheduling und verhält sich wie ein externer Ping-Dienst.
 */

export interface Env {
  API_BASE_URL: string
  CRON_TOKEN: string
}

interface CronTarget {
  path: string
  description: string
}

function routeSchedule(cron: string): CronTarget | null {
  switch (cron) {
    case '* * * * *':
    case '*/5 * * * *':
      return { path: '/api/cron/process-notifications', description: 'process queue' }
    case '0 7 * * *':
      return { path: '/api/cron/send-reminders', description: 'send reminders' }
    case '0 2 * * 0':
      return { path: '/api/cron/cleanup-notifications', description: 'cleanup notifications' }
    default:
      return null
  }
}

async function triggerEndpoint(env: Env, target: CronTarget): Promise<void> {
  const url = `${env.API_BASE_URL}${target.path}`
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.CRON_TOKEN}` },
    })
    if (!response.ok) {
      console.error(`[cron-worker] ${target.description} → ${response.status} ${response.statusText}`)
    }
    else {
      console.log(`[cron-worker] ${target.description} → OK`)
    }
  }
  catch (err) {
    console.error(`[cron-worker] ${target.description} → fetch failed:`, err)
  }
}

export default {
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const target = routeSchedule(event.cron)
    if (!target) {
      console.warn(`[cron-worker] unknown cron expression: ${event.cron}`)
      return
    }
    ctx.waitUntil(triggerEndpoint(env, target))
  },
}
