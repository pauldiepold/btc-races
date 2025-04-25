import type { ApiResponse } from '~/types/api.types'
import { registrationSchema } from '~/composables/useRegistrationSchema'
import { useCompetitionRegistration } from '~/composables/useCompetitionRegistration'
import { RegistrationEmailsService } from '~/server/email/services'
import { createRegistrationsRepository } from '~/server/repositories/registrations.repository'
import { createCompetitionsRepository } from '~/server/repositories/competitions.repository'
import { createMembersRepository } from '~/server/repositories/members.repository'

export default defineEventHandler(async (event) => {
  // Repositories erstellen mit Service-Role für Schreibzugriff
  const registrationsRepo = await createRegistrationsRepository(
    event,
    'service_role'
  )
  const competitionsRepo = await createCompetitionsRepository(
    event,
    'service_role'
  )
  const membersRepo = await createMembersRepository(event, 'service_role')

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
    const competition = await competitionsRepo.findById(
      validationResult.data.competition_id
    )

    if (!competition) {
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
      const member = await membersRepo.findById(validationResult.data.member_id)

      if (!member) {
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

    // Prüfe, ob bereits eine aktive Anmeldung existiert
    const hasActiveRegistration = await registrationsRepo.hasActiveRegistration(
      validationResult.data.member_id,
      validationResult.data.competition_id
    )

    if (hasActiveRegistration) {
      // Hole den Namen des Mitglieds für eine personalisierte Fehlermeldung
      const member = await membersRepo.findById(validationResult.data.member_id)

      return {
        error: {
          message: `${member?.name || 'Ein Mitglied'} ist für diesen Wettkampf bereits angemeldet.`,
          code: 'DUPLICATE_REGISTRATION',
        },
        statusCode: 400,
      } as ApiResponse<null>
    }

    // Prüfe, ob bereits eine abgemeldete Registrierung existiert, die wiederverwendet werden kann
    const canceledRegistration =
      await registrationsRepo.findCanceledRegistration(
        validationResult.data.member_id,
        validationResult.data.competition_id
      )

    let data
    if (canceledRegistration) {
      // Reaktiviere die abgemeldete Registrierung
      const success = await registrationsRepo.updateStatus(
        canceledRegistration.id,
        'pending'
      )

      if (!success) {
        return {
          error: {
            message: 'Fehler beim Reaktivieren der vorherigen Anmeldung',
            code: 'DATABASE_ERROR',
          },
          statusCode: 500,
        } as ApiResponse<null>
      }

      // Aktualisiere die Notizen
      if (validationResult.data.notes !== canceledRegistration.notes) {
        await registrationsRepo.updateRegistration(canceledRegistration.id, {
          notes: validationResult.data.notes,
        })
      }

      data = canceledRegistration
      console.log(
        `Abgemeldete Registrierung ${canceledRegistration.id} wurde reaktiviert`
      )
    } else {
      // Erstelle eine neue Anmeldung, wenn keine abgemeldete existiert
      try {
        data = await registrationsRepo.create({
          member_id: validationResult.data.member_id,
          competition_id: validationResult.data.competition_id,
          notes: validationResult.data.notes,
          status: 'pending',
        })

        if (!data) {
          return {
            error: {
              message: 'Fehler beim Erstellen der Anmeldung.',
              code: 'DATABASE_ERROR',
            },
            statusCode: 500,
          } as ApiResponse<null>
        }
      } catch (error: any) {
        console.error('Supabase Fehler:', error)

        return {
          error: {
            message: 'Fehler beim Erstellen der Anmeldung.',
            code: 'DATABASE_ERROR',
            details: error.message,
          },
          statusCode: 500,
        } as ApiResponse<null>
      }
    }

    // Bestätigungsmail mit dem neuen E-Mail-Service senden
    try {
      const emailService = await RegistrationEmailsService.create(event)
      await emailService.sendRegistrationConfirmation(data.id)
      console.log(
        `Bestätigungsmail für Registrierung ${data.id} wurde gesendet`
      )
    } catch (emailError: any) {
      console.error('Fehler beim Senden der Bestätigungsmail:', emailError)
      // Wir geben trotzdem eine erfolgreiche Antwort zurück, da die Registrierung
      // erfolgreich erstellt wurde. Der E-Mail-Versand kann später wiederholt werden.
    }

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
