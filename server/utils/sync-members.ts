import { db, schema } from 'hub:db'
import { eq, and, isNotNull, notInArray } from 'drizzle-orm'
import { CampaiContactsService } from '../external-apis/campai-contacts/contacts.service'
import { resolveRole } from './sections'

export type SyncMembersResult = {
  result: string
  stats: {
    created: number
    updated: number
    skipped: number
    deactivated: number
    duration: string
  }
}

export async function runSyncMembers(): Promise<SyncMembersResult> {
  console.log('🔄 Starting member sync from Campai...')

  const startTime = Date.now()
  const service = new CampaiContactsService()

  const activeMembers = await service.getActiveMembers()
  console.log(`📥 Fetched ${activeMembers.length} active members from Campai`)

  const syncTimestamp = new Date()
  const activeCampaiIds: string[] = []
  let created = 0
  let updated = 0
  let skipped = 0

  for (const contact of activeMembers) {
    const campaiId = contact._id
    const email = contact.communication?.email || contact.personal.email

    if (!email) {
      console.warn(`⚠️  Skipping contact ${campaiId}: no email found`)
      skipped++
      continue
    }

    activeCampaiIds.push(campaiId)

    const sections = contact.membership.sections || []
    const role = resolveRole(email, sections)
    const avatarUrl = contact.personal?.avatar?.path !== null ? `https://api.campai.com/storage/download/${contact.personal?.avatar?.path}` : ''

    const userData = {
      email,
      firstName: contact.personal.personFirstName || '',
      lastName: contact.personal.personLastName || '',
      role,
      campaiId,
      membershipNumber: contact.membership.number || null,
      membershipStatus: 'active' as const,
      membershipEnterDate: contact.membership.enterDate ? new Date(contact.membership.enterDate) : null,
      membershipLeaveDate: contact.membership.leaveDate ? new Date(contact.membership.leaveDate) : null,
      sections,
      avatarUrl,
      hasLadvStartpass: contact.custom?.['1EAOnH99nXTTRrmreBYuF'] === true ? 1 : 0,
      gender: (contact.personal.type === 'malePerson' ? 'm' : contact.personal.type === 'femalePerson' ? 'w' : null) as 'm' | 'w' | null,
      age: contact.personal.personAge ?? null,
      birthday: contact.personal.personBirthday ? new Date(contact.personal.personBirthday) : null,
      lastSyncedAt: syncTimestamp,
    }

    const existing = await db.query.users.findFirst({
      where: eq(schema.users.campaiId, campaiId),
      columns: { id: true, avatarUrl: true },
    })

    if (existing) {
      const avatarUrlChanged = existing.avatarUrl !== avatarUrl
      await db.update(schema.users)
        .set({
          ...userData,
          ...(avatarUrlChanged ? { avatarNeedsResync: 1 } : {}),
        })
        .where(eq(schema.users.campaiId, campaiId))
      updated++
    }
    else {
      await db.insert(schema.users)
        .values({ id: crypto.randomUUID(), ...userData })
      created++
    }
  }

  let deactivatedCount = 0
  if (activeCampaiIds.length > 0) {
    const deactivated = await db
      .update(schema.users)
      .set({
        membershipStatus: 'inactive',
        lastSyncedAt: syncTimestamp,
      })
      .where(
        and(
          isNotNull(schema.users.campaiId),
          notInArray(schema.users.campaiId, activeCampaiIds),
        ),
      )
      .returning({ id: schema.users.id })

    deactivatedCount = deactivated.length
    console.log(`🔴 Deactivated ${deactivatedCount} inactive members`)
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`✅ Sync completed in ${duration}s`)
  console.log(`   Created: ${created} | Updated: ${updated} | Skipped: ${skipped}`)

  return {
    result: 'Member sync completed successfully',
    stats: { created, updated, skipped, deactivated: deactivatedCount, duration: `${duration}s` },
  }
}
