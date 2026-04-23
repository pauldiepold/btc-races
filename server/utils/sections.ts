const ADMIN_SECTIONS = ['Coaches', 'App-Admin']
const SUPERUSER_EMAILS = ['paul@diepold.de']

export function resolveRole(email: string, sections: string[]): 'member' | 'admin' | 'superuser' {
  if (SUPERUSER_EMAILS.includes(email)) return 'superuser'
  if (sections.some(s => ADMIN_SECTIONS.includes(s))) return 'admin'
  return 'member'
}
