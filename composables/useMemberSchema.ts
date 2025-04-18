import { z } from 'zod'
import { useZodLocalization } from './useZodLocalization'

// Initialisiere Lokalisierung
useZodLocalization()

const baseSchema = z.object({
  Vorname: z.string().min(1, 'Vorname ist erforderlich'),
  Nachname: z.string().min(1, 'Nachname ist erforderlich'),
  Mitgliedsnummer: z
    .string()
    .min(1, 'Mitgliedsnummer ist erforderlich')
    .transform((val) => parseInt(val))
    .refine((val) => !isNaN(val), 'Mitgliedsnummer muss eine Zahl sein')
    .refine((val) => val > 0, 'Mitgliedsnummer muss positiv sein'),
  'E-Mail': z.string().email('Ungültige E-Mail-Adresse'),
  'DLV Startpass': z.string().optional(),
})

export const memberSchema = baseSchema

export type MemberSchema = z.infer<typeof memberSchema>

export function useMemberSchema() {
  const createFormState = () => {
    return Object.keys(baseSchema.shape).reduce((acc, key) => {
      acc[key as keyof MemberSchema] = undefined
      return acc
    }, {} as Partial<MemberSchema>)
  }

  return {
    schema: memberSchema,
    createFormState,
  }
}
