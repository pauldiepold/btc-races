const BANNER_DISMISSED_KEY = 'push-banner-dismissed'

const isSupported = ref(false)
const permission = ref<NotificationPermission>('default')
const isSubscribed = ref(false)
const isIos = ref(false)
const isInstalledPwa = ref(false)
const bannerDismissed = ref(false)
const initialized = ref(false)

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const output = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return ''
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!)
  return btoa(binary)
}

async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

async function refreshState() {
  if (!isSupported.value) return
  permission.value = Notification.permission
  const sub = await getCurrentSubscription()
  isSubscribed.value = !!sub
}

export function usePushNotifications() {
  const toast = import.meta.client ? useToast() : null

  const isGranted = computed(() => permission.value === 'granted')
  const isDenied = computed(() => permission.value === 'denied')
  const needsInstallFirst = computed(() => isIos.value && !isInstalledPwa.value)

  async function init() {
    if (!import.meta.client || initialized.value) return
    initialized.value = true

    isSupported.value
      = 'Notification' in window
        && 'serviceWorker' in navigator
        && 'PushManager' in window

    const ua = navigator.userAgent
    isIos.value = /iphone|ipad|ipod/i.test(ua)

    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true
    isInstalledPwa.value = standalone

    bannerDismissed.value = localStorage.getItem(BANNER_DISMISSED_KEY) === '1'

    await refreshState()
  }

  async function subscribe(): Promise<boolean> {
    if (!isSupported.value) return false
    try {
      const { publicKey } = await $fetch<{ publicKey: string }>('/api/push/vapid-public-key')
      if (!publicKey) throw new Error('Kein VAPID-Public-Key konfiguriert')

      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })

      await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: {
          endpoint: sub.endpoint,
          keys: {
            auth: arrayBufferToBase64(sub.getKey('auth')),
            p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
          },
        },
      })

      permission.value = Notification.permission
      isSubscribed.value = true
      toast?.add({ title: 'Push-Benachrichtigungen aktiviert', color: 'success' })
      return true
    }
    catch (err) {
      permission.value = Notification.permission
      if (permission.value !== 'denied') {
        const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
        toast?.add({ title: 'Aktivierung fehlgeschlagen', description: message, color: 'error' })
      }
      return false
    }
  }

  async function unsubscribe(): Promise<boolean> {
    try {
      const sub = await getCurrentSubscription()
      if (!sub) {
        isSubscribed.value = false
        return true
      }
      const endpoint = sub.endpoint
      await sub.unsubscribe()
      await $fetch('/api/push/subscribe', { method: 'DELETE', body: { endpoint } })
      isSubscribed.value = false
      toast?.add({ title: 'Push-Benachrichtigungen deaktiviert', color: 'success' })
      return true
    }
    catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
      toast?.add({ title: 'Deaktivierung fehlgeschlagen', description: message, color: 'error' })
      return false
    }
  }

  function dismissBanner() {
    if (!import.meta.client) return
    localStorage.setItem(BANNER_DISMISSED_KEY, '1')
    bannerDismissed.value = true
  }

  return {
    isSupported: readonly(isSupported),
    isGranted,
    isDenied,
    isSubscribed: readonly(isSubscribed),
    isIos: readonly(isIos),
    isInstalledPwa: readonly(isInstalledPwa),
    needsInstallFirst,
    bannerDismissed: readonly(bannerDismissed),
    init,
    subscribe,
    unsubscribe,
    dismissBanner,
  }
}
