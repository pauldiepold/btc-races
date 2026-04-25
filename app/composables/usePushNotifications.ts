const BANNER_DISMISSED_KEY = 'push-banner-dismissed'

const isSupported = ref(false)
const permission = ref<NotificationPermission>('default')
const isSubscribed = ref(false)
const isIos = ref(false)
const isInstalledPwa = ref(false)
const bannerDismissed = ref(false)
const initialized = ref(false)

/** idle = kein lokalen Sub / noch nicht re-synct; pending = Reconcile läuft; synced = POST ok; failed = Reconcile gescheitert */
type PushServerSyncStatus = 'idle' | 'pending' | 'synced' | 'failed'
const serverSyncStatus = ref<PushServerSyncStatus>('idle')

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

async function postSubscriptionToServer(sub: PushSubscription) {
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
}

/** Einmalig POST, mit optionalem einmaligem Retry (transiente Netz/SW-Fälle) */
async function postSubscriptionWithRetry(sub: PushSubscription) {
  try {
    await postSubscriptionToServer(sub)
  }
  catch {
    await new Promise(r => setTimeout(r, 400))
    await postSubscriptionToServer(sub)
  }
}

async function refreshState() {
  if (!isSupported.value) return
  permission.value = Notification.permission
  const sub = await getCurrentSubscription()
  isSubscribed.value = !!sub
  if (!sub) {
    serverSyncStatus.value = 'idle'
  }
}

export function usePushNotifications() {
  const toast = import.meta.client ? useToast() : null
  const { loggedIn } = useUserSession()

  const isGranted = computed(() => permission.value === 'granted')
  const isDenied = computed(() => permission.value === 'denied')
  const needsInstallFirst = computed(() => isIos.value && !isInstalledPwa.value)

  /**
   * Stellt die aktuelle Browser-`PushSubscription` in D1 wieder her.
   * Nur aufrufen, wenn lokal sinnvoll (Support, Session, iOS-PWA, lokaler Sub).
   */
  async function reconcileWithServer() {
    if (!import.meta.client || !isSupported.value) return
    if (!loggedIn.value) return
    if (needsInstallFirst.value) return

    if (!isSubscribed.value) {
      serverSyncStatus.value = 'idle'
      return
    }

    const sub = await getCurrentSubscription()
    if (!sub) {
      isSubscribed.value = false
      serverSyncStatus.value = 'idle'
      return
    }

    serverSyncStatus.value = 'pending'
    try {
      await postSubscriptionWithRetry(sub)
      serverSyncStatus.value = 'synced'
    }
    catch {
      serverSyncStatus.value = 'failed'
    }
  }

  async function init(options?: { reconcile?: boolean }) {
    if (!import.meta.client) return
    if (!initialized.value) {
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
    }

    await refreshState()

    if (options?.reconcile) {
      await reconcileWithServer()
    }
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

      await postSubscriptionWithRetry(sub)

      permission.value = Notification.permission
      isSubscribed.value = true
      serverSyncStatus.value = 'synced'
      toast?.add({ title: 'Push-Benachrichtigungen aktiviert', color: 'success' })
      return true
    }
    catch (err) {
      permission.value = Notification.permission
      serverSyncStatus.value = 'failed'
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
        serverSyncStatus.value = 'idle'
        return true
      }
      const endpoint = sub.endpoint
      await sub.unsubscribe()
      await $fetch('/api/push/subscribe', { method: 'DELETE', body: { endpoint } })
      isSubscribed.value = false
      serverSyncStatus.value = 'idle'
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

  /** Nutzbar, wenn lokal alles grün aussieht, die Subscription aber auf dem Server fehlt oder das Reconcile fehlschlug. */
  const isPushChannelAvailable = computed(
    () =>
      isSupported.value
      && isGranted.value
      && isSubscribed.value
      && !needsInstallFirst.value
      && serverSyncStatus.value === 'synced',
  )

  return {
    isSupported: readonly(isSupported),
    isGranted,
    isDenied,
    isSubscribed: readonly(isSubscribed),
    isIos: readonly(isIos),
    isInstalledPwa: readonly(isInstalledPwa),
    needsInstallFirst,
    bannerDismissed: readonly(bannerDismissed),
    serverSyncStatus: readonly(serverSyncStatus),
    isPushChannelAvailable,
    init,
    subscribe,
    unsubscribe,
    dismissBanner,
    reconcileWithServer,
  }
}
