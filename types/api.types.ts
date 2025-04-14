export type ImportResponse = {
  success: boolean
  error?: string
  imported?: number
  skipped?: string[]
  warnings?: string[]
} 