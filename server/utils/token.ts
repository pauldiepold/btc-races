import { randomUUID } from 'crypto'

export function generateToken(): string {
  return randomUUID()
}
