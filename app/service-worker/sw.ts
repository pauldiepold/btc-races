/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

// Kanonisches Muster aus der vite-pwa-Doku: workbox-build injiziert die
// Precache-Liste in `self.__WB_MANIFEST`. @vite-pwa/nuxt fügt drei Nuxt-Build-
// Metadaten hinzu (`_nuxt/builds/latest.json` etc.), die für den PWA-autoUpdate-
// Flow relevant sind — bewusst akzeptiert.
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
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
      icon: '/icons/icon-192x192.png',
      data: { url: data.url ?? '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data?.url as string | undefined) ?? '/'

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of allClients) {
        if ('focus' in client) {
          try {
            await client.navigate(url)
          }
          catch {
            // navigate kann bei cross-origin oder fehlender Same-Origin fehlschlagen
          }
          return client.focus()
        }
      }

      return self.clients.openWindow(url)
    })(),
  )
})
