import { z } from 'zod'

// Fehlermeldungen
const messages = {
    required: (field: string) => `${field} ist erforderlich`,
    email: 'Ungültige E-Mail-Adresse',
    url: 'Ungültige URL',
    date: 'Ungültiges Datumsformat',
    empty: (field: string) => `${field} darf nicht leer sein`,
} as const

// Basis-Schemas für häufig verwendete Felder
export const baseSchemas = {
    // String-Felder
    string: (fieldName: string) => ({
        required: () =>
            z
                .string({
                    required_error: messages.required(fieldName),
                })
                .min(1, messages.empty(fieldName)),
        optional: () =>
            z
                .string()
                .transform((val) => (val === '' ? undefined : val))
                .optional(),
    }),

    // E-Mail
    email: (fieldName: string) => ({
        required: () =>
            z
                .string({
                    required_error: messages.required(fieldName),
                })
                .min(1, messages.empty(fieldName))
                .email(messages.email),
        optional: () =>
            z
                .string()
                .transform((val) => (val === '' ? undefined : val))
                .pipe(z.string().email(messages.email).optional()),
    }),

    // URL
    url: (fieldName: string) => ({
        required: () =>
            z
                .string({
                    required_error: messages.required(fieldName),
                })
                .min(1, messages.empty(fieldName))
                .url(messages.url),
        optional: () =>
            z
                .string()
                .transform((val) => (val === '' ? undefined : val))
                .pipe(z.string().url(messages.url).optional()),
    }),

    // Datum
    date: (fieldName: string) => ({
        required: () =>
            z
                .string({
                    required_error: messages.required(fieldName),
                })
                .min(1, messages.empty(fieldName))
                .regex(/^\d{4}-\d{2}-\d{2}$/, messages.date),
        optional: () =>
            z
                .string()
                .transform((val) => (val === '' ? undefined : val))
                .pipe(
                    z
                        .string()
                        .regex(/^\d{4}-\d{2}-\d{2}$/, messages.date)
                        .optional()
                ),
    }),

    // Boolean
    boolean: () => z.boolean().default(false),
}

// Typen für Validierungsergebnisse
export interface ValidationError {
    field: string
    message: string
}

export interface ValidationResult<T> {
    data: T | null
    error: {
        message: string
        details?: ValidationError[]
    } | null
}

// Fehlerbehandlung
export function handleZodError<T>(error: z.ZodError): ValidationResult<T> {
    return {
        data: null,
        error: {
            message: error.errors[0].message,
            details: error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            })),
        },
    }
}

// Generische Validierungsfunktion
export async function validateSchema<T>(
    schema: z.ZodSchema,
    data: unknown
): Promise<ValidationResult<T>> {
    try {
        const validated = await schema.parseAsync(data)
        return { data: validated, error: null }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return handleZodError<T>(error)
        }
        return {
            data: null,
            error: { message: 'Ein unerwarteter Fehler ist aufgetreten' },
        }
    }
}
