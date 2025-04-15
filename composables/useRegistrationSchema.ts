import { z } from 'zod'
import { useZodLocalization } from './useZodLocalization'

// Initialisiere Lokalisierung
useZodLocalization()

export const registrationSchema = z.object({
  member_id: z.number(),
  competition_id: z.number(),
  terms_accepted: z.boolean().refine((val) => val === true, {
    message: 'Du musst die Teilnahmebedingungen akzeptieren',
  }),
  notes: z.string().optional(),
})

export type RegistrationSchema = z.infer<typeof registrationSchema>

export function useRegistrationSchema() {
  const createFormState = (competitionId: number) => {
    return {
      member_id: undefined,
      competition_id: competitionId,
      terms_accepted: false,
      notes: undefined,
    } as Partial<RegistrationSchema>
  }

  return {
    schema: registrationSchema,
    createFormState,
  }
}
