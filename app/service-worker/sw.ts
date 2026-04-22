/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching'
import { setCatchHandler } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

setCatchHandler(async ({ event }) => {
  if ((event as FetchEvent).request.destination === 'document') {
    return new Response(
      '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline – BTC Races</title><style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100dvh;margin:0;background:#18181b;color:#fff}div{text-align:center}h1{color:#ffb700;font-size:1.5rem;margin-bottom:.5rem}p{color:#a1a1aa}</style></head><body><div><h1>Du bist offline</h1><p>Bitte überprüfe deine Internetverbindung.</p></div></body></html>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }
  return Response.error()
})

interface PushPayload {
  title?: string
  body?: string
  url?: string
}

self.addEventListener('push', (event) => {
  let data: PushPayload = {}
  try {
    data = event.data?.json() ?? {}
  }
  catch {
    data = { body: event.data?.text() }
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'BTC Races', {
      body: data.body,
      icon: '/pwa-192x192.png',
      data: { url: data.url ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string | undefined) ?? '/'
  const target = new URL(url, self.location.origin)

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      // Tab mit identischem Pfad fokussieren, sonst neues Fenster öffnen.
      // (client.navigate() vermeiden — wirft "The client is inactive".)
      for (const client of allClients) {
        const clientUrl = new URL(client.url)
        if (clientUrl.pathname === target.pathname && 'focus' in client) {
          return client.focus()
        }
      }

      return self.clients.openWindow(target.href)
    })(),
  )
})
