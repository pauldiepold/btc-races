export function useAvatarUrl(userId: string, size: 'small' | 'large' = 'small') {
  return `/api/avatar/${userId}?size=${size}`
}
