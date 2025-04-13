import type { ValidationResult } from './base.schemas'
import { z } from 'zod'
import { baseSchemas, validateSchema } from './base.schemas'

export const CompetitionSchema = z
    .object({
        name: baseSchemas.string('Name').required(),
        date: baseSchemas.date('Veranstaltungsdatum').required(),
        registration_deadline: baseSchemas.date('Meldeschluss').required(),
        location: baseSchemas.string('Standort').optional(),
        announcement_link: baseSchemas.url('Link zur Ausschreibung').optional(),
        description: baseSchemas.string('Beschreibung').optional(),
    })
    .superRefine((data, ctx) => {
        if (data.registration_deadline && data.date) {
            const deadlineDate = new Date(
                `${data.registration_deadline}T00:00:00Z`
            )
            const eventDate = new Date(`${data.date}T00:00:00Z`)

            if (deadlineDate > eventDate) {
                ctx.addIssue({
                    path: ['registration_deadline'],
                    code: z.ZodIssueCode.custom,
                    message:
                        'Meldeschluss kann nicht nach dem Veranstaltungsdatum liegen',
                })
            }
        }
    })

export type CompetitionInput = z.input<typeof CompetitionSchema>
export type CompetitionOutput = z.output<typeof CompetitionSchema>

export function validateCompetition(
    data: unknown
): Promise<ValidationResult<CompetitionOutput>> {
    return validateSchema<CompetitionOutput>(CompetitionSchema, data)
}
