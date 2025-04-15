import { AzureEmailService } from '../../email/services/azure'
import type { EmailOptions } from '../../email/types'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const emailService = new AzureEmailService()

    const options: EmailOptions = {
      to: body.to,
      subject: body.subject,
      template: body.template,
      data: body.data,
    }

    await emailService.sendEmail(options)

    return {
      success: true,
      message: 'E-Mail wurde erfolgreich gesendet',
    }
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Ein unbekannter Fehler ist aufgetreten',
    }
  }
})
