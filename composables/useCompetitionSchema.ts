import { z } from 'zod'
import { useZodLocalization } from './useZodLocalization'

// Initialisiere Lokalisierung
useZodLocalization()

const baseSchema = z.object({
  name: z.string(),
  location: z.string().optional(),
  registration_deadline: z.string().date(),
  date: z.string().date(),
  announcement_link: z.string().url('Ungültige URL').optional(),
  description: z.string().optional(),
})

export const competitionSchema = baseSchema.superRefine((data, ctx) => {
  if (data.registration_deadline && data.date) {
    const deadline = new Date(data.registration_deadline)
    const eventDate = new Date(data.date)
    
    if (deadline > eventDate) {
      ctx.addIssue({
        path: ['registration_deadline'],
        code: z.ZodIssueCode.custom,
        message: 'Die Meldefrist muss vor dem Veranstaltungsdatum liegen'
      })
    }
  }
})

export type CompetitionSchema = z.infer<typeof competitionSchema>

export function useCompetitionSchema() {
  const createFormState = () => {
    return Object.keys(baseSchema.shape).reduce((acc, key) => {
      acc[key as keyof CompetitionSchema] = undefined
      return acc
    }, {} as Partial<CompetitionSchema>)
  }

  return {
    schema: competitionSchema,
    createFormState,
  }
} 