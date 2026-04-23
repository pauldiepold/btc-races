export interface ClaimPendingResponse {
  status: 'pending'
}

export interface ClaimReadyResponse {
  status: 'ready'
  redirect: string
}

export interface ClaimExpiredResponse {
  status: 'expired'
}

export type ClaimResponse = ClaimPendingResponse | ClaimReadyResponse | ClaimExpiredResponse

const POLL_INTERVAL_MS = 2000

export function useLoginClaim() {
  function isIosPwa(): boolean {
    if (!import.meta.client) return false
    const ua = navigator.userAgent
    const isIos = /iphone|ipad|ipod/i.test(ua)
    if (!isIos) return false
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true
    return standalone
  }

  function createClaimId(): string {
    return crypto.randomUUID()
  }

  function pollClaim(claimId: string, onResult: (res: ClaimResponse) => void | Promise<void>): () => void {
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const tick = async () => {
      if (stopped) return
      try {
        const res = await $fetch<ClaimResponse>(`/api/auth/claim/${claimId}`)
        if (stopped) return
        await onResult(res)
        if (res.status === 'pending') {
          timer = setTimeout(tick, POLL_INTERVAL_MS)
        }
      }
      catch {
        if (stopped) return
        timer = setTimeout(tick, POLL_INTERVAL_MS)
      }
    }

    tick()

    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
    }
  }

  return { isIosPwa, createClaimId, pollClaim }
}
