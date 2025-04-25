import { readExcelFile } from '~/server/utils/excel'
import { memberSchema } from '~/composables/useMemberSchema'
import type { H3Event } from 'h3'
import { writeFile, unlink } from 'fs/promises'
import { z } from 'zod'
import { createMembersRepository } from '~/server/repositories/members.repository'
import { createEmailsRepository } from '~/server/repositories/emails.repository'

export default defineEventHandler(async (event: H3Event) => {
  try {
    // Repositories erstellen mit Service-Role für administrative Operationen
    const membersRepo = await createMembersRepository(event, 'service_role')
    const emailsRepo = await createEmailsRepository(event, 'service_role')

    const formData = await readFormData(event)
    const file = formData.get('file') as File

    if (!file) {
      throw createError({
        statusCode: 400,
        message: 'Keine Datei hochgeladen',
      })
    }

    // Temporäre Datei erstellen
    const tempFilePath = `/tmp/${file.name}`
    const buffer = await file.arrayBuffer()
    await writeFile(tempFilePath, Buffer.from(buffer))

    // Excel-Datei einlesen
    const data = await readExcelFile(tempFilePath)
    console.log('Gelesene Excel-Daten:', JSON.stringify(data, null, 2))

    if (!data || data.length === 0) {
      throw new Error('Keine Daten in der Excel-Datei gefunden')
    }

    // Validierung der Daten
    const skippedRows: {
      row: number
      name: string
      email: string
      error: string
    }[] = []
    const validMembers: any[] = []

    for (const [index, row] of data.entries()) {
      try {
        console.log(
          `Verarbeite Zeile ${index + 2}:`,
          JSON.stringify(row, null, 2)
        )

        const memberData = memberSchema.parse({
          Vorname: row['Vorname']?.toString() || '',
          Nachname: row['Nachname']?.toString() || '',
          Mitgliedsnummer: row['Mitgliedsnummer']?.toString() || '',
          'E-Mail': row['E-Mail']?.toString() || '',
          'DLV Startpass': row['DLV Startpass']?.toString() || '',
        })

        validMembers.push(memberData)
      } catch (error: unknown) {
        console.error(`Fehler in Zeile ${index + 2}:`, error)
        if (error instanceof z.ZodError) {
          const errorDetails = error.errors.map((err) => err.message).join(', ')
          skippedRows.push({
            row: index + 2,
            name: `${row['Vorname']} ${row['Nachname']}`,
            email: row['E-Mail']?.toString() || '',
            error: errorDetails,
          })
        }
      }
    }

    // Prüfung auf doppelte E-Mail-Adressen
    const duplicateEmails: string[] = []
    const seenEmails = new Set<string>()

    for (const member of validMembers) {
      const email = member['E-Mail']
      if (seenEmails.has(email)) {
        duplicateEmails.push(email)
      } else {
        seenEmails.add(email)
      }
    }

    // Bestehende Mitglieder abrufen und als ausgetreten markieren
    const existingMembers = await membersRepo.findAllMembers()

    if (existingMembers.length > 0) {
      await membersRepo.markMembersAsLeft(existingMembers.map((m) => m.id))
    }

    // Neue Mitglieder vorbereiten
    const memberInserts = validMembers.map((member) => ({
      id: member.Mitgliedsnummer,
      name: `${member.Vorname} ${member.Nachname.charAt(0)}.`,
      has_left: false,
      has_ladv_startpass:
        member['DLV Startpass']?.trim().toLowerCase() === 'ja',
      updated_at: new Date().toISOString(),
    }))

    const emailInserts = validMembers.map((member) => ({
      member_id: member.Mitgliedsnummer,
      email: member['E-Mail'],
    }))

    // Mitglieder einfügen/aktualisieren
    const membersResult = await membersRepo.upsertMembers(memberInserts)
    if (!membersResult) {
      throw new Error('Fehler beim Speichern der Mitglieder')
    }

    // E-Mails einfügen/aktualisieren
    const emailsResult = await emailsRepo.upsertEmails(emailInserts)
    if (!emailsResult) {
      throw new Error('Fehler beim Speichern der E-Mail-Adressen')
    }

    // Temporäre Datei löschen
    await unlink(tempFilePath)

    return {
      success: true,
      imported: validMembers.length,
      skipped: skippedRows.map(
        (row) => `Zeile ${row.row}: ${row.name} (${row.email}) - ${row.error}`
      ),
      warnings:
        duplicateEmails.length > 0
          ? [`Doppelte E-Mail-Adressen gefunden: ${duplicateEmails.join(', ')}`]
          : [],
    }
  } catch (error) {
    console.error('Fehler beim Import:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Fehler beim Import',
    })
  }
})
