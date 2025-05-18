import { z } from 'zod'
import { useZodLocalization } from './useZodLocalization'

// Initialisiere Lokalisierung
useZodLocalization()

export const ladvUrlSchema = z.object({
  url: z.string().regex(
    /^https:\/\/ladv\.de\/ausschreibung\/detail\/\d+\/.*$/,
    'Die URL muss dem Format https://ladv.de/ausschreibung/detail/[ID]/[Titel] entsprechen'
  )
})

export type LadvUrlSchema = z.infer<typeof ladvUrlSchema>

export function useLadvUrlSchema() {
  return {
    schema: ladvUrlSchema
  }
}
