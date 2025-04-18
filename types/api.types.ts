export interface ApiResponse<T = void> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  statusCode?: number
  imported?: number
  skipped?: string[]
  warnings?: string[]
}
