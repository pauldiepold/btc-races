declare module '#auth-utils' {
  interface User {
    id: string
    firstName: string
    lastName: string
    email: string
    role: 'member' | 'admin' | 'superuser'
    sections: string[]
    hasLadvStartpass: boolean
    birthYear: number | null
    gender: 'm' | 'w' | null
  }

  interface UserSession {
    // Session wird automatisch von nuxt-auth-utils verwaltet
    _placeholder?: never
  }

  interface SecureSessionData {
    // Hier können sensitive Daten gespeichert werden
    _placeholder?: never
  }
}

export {}
