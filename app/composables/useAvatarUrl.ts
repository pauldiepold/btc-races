export function useAvatarUrl(userId: number, size: 'small' | 'large' = 'small') {
  return `/api/avatar/${userId}?size=${size}`
}
