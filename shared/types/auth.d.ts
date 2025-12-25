declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    role: string
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
