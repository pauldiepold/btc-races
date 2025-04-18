import type { ApiResponse } from '~/types/api.types'
import type { Database } from '~/types/database.types'
import { serverSupabaseServiceRole } from '#supabase/server'
import { registrationSchema } from '~/composables/useRegistrationSchema'
import { generateToken } from './../utils/token'
import { useCompetitionRegistration } from '~/composables/useCompetitionRegistration'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseServiceRole<Database>(event)
  const body = await readBody(event)

  // Validierung mit dem Schema
  const validationResult = registrationSchema.safeParse(body)
  if (!validationResult.success) {
    return {
      error: {
        message: 'Validierungsfehler',
        code: 'VALIDATION_ERROR',
        details: validationResult.error.errors,
      },
      statusCode: 400,
    } as ApiResponse<null>
  }

  try {
    // Hole den Wettkampf für die Statusprüfung
    const { data: competition, error: competitionError } = await client
      .from('competitions')
      .select('*')
      .eq('id', validationResult.data.competition_id)
      .single()

    if (competitionError) {
      return {
        error: {
          message: 'Wettkampf nicht gefunden',
          code: 'COMPETITION_NOT_FOUND',
        },
        statusCode: 404,
      } as ApiResponse<null>
    }

    // Prüfe, ob eine Anmeldung noch möglich ist
    const registrationStatus = useCompetitionRegistration(competition)
    if (registrationStatus !== 'REGISTRATION_OPEN') {
      return {
        error: {
          message: 'Eine Anmeldung zu diesem Wettkampf ist nicht mehr möglich',
          code: 'REGISTRATION_NOT_POSSIBLE',
        },
        statusCode: 400,
      } as ApiResponse<null>
    }

    // Prüfe, ob das Mitglied einen Startpass hat, wenn es sich um einen LADV-Wettkampf handelt
    if (competition.registration_type === 'LADV') {
      const { data: member, error: memberError } = await client
        .from('members')
        .select('has_ladv_startpass')
        .eq('id', validationResult.data.member_id)
        .single()

      if (memberError) {
        return {
          error: {
            message: 'Mitglied nicht gefunden',
            code: 'MEMBER_NOT_FOUND',
          },
          statusCode: 404,
        } as ApiResponse<null>
      }

      if (!member.has_ladv_startpass) {
        return {
          error: {
            message: 'Für diesen Wettkampf wird ein LADV-Startpass benötigt',
            code: 'STARTPASS_REQUIRED',
          },
          statusCode: 400,
        } as ApiResponse<null>
      }
    }

    // Generiere einen Verifizierungstoken
    const verificationToken = generateToken()

    // Erstelle die Anmeldung
    const { data, error } = await client
      .from('registrations')
      .insert({
        member_id: validationResult.data.member_id,
        competition_id: validationResult.data.competition_id,
        notes: validationResult.data.notes,
        verification_token: verificationToken,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase Fehler:', error)

      // Prüfe auf doppelte Registrierung
      if (error.code === '23505') {
        // Unique violation
        const { data: member } = await client
          .from('members')
          .select('name')
          .eq('id', validationResult.data.member_id)
          .single()

        return {
          error: {
            message: `${member?.name || 'Ein Mitglied'} ist für diesen Wettkampf bereits angemeldet.`,
            code: 'DUPLICATE_REGISTRATION',
          },
          statusCode: 400,
        } as ApiResponse<null>
      }

      return {
        error: {
          message: 'Fehler beim Erstellen der Anmeldung.',
          code: 'DATABASE_ERROR',
          details: error.message,
        },
        statusCode: 500,
      } as ApiResponse<null>
    }

    // TODO: Sende Bestätigungsmail mit Verifizierungslink

    return {
      data,
      statusCode: 201,
    } as ApiResponse<typeof data>
  } catch (error: any) {
    console.error('Fehler beim Erstellen der Anmeldung:', error)
    return {
      error: {
        message: 'Ein unerwarteter Fehler ist aufgetreten.',
        code: 'INTERNAL_ERROR',
        details: error.message,
      },
      statusCode: 500,
    } as ApiResponse<null>
  }
})
