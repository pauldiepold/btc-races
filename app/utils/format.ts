export function toDate(val: Date | string | null | undefined): Date | null {
  if (!val) return null
  return val instanceof Date ? val : new Date(val as string)
}

export function formatDate(val: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions): string | null {
  const d = toDate(val)
  if (!d) return null
  return d.toLocaleDateString('de-DE', opts ?? { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(val: Date | string | null | undefined): string | null {
  const d = toDate(val)
  if (!d) return null
  return d.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
