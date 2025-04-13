import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)

  try {
    const { data: competitions, error } = await client
      .from('competitions')
      .select('id, name, date, location, registration_deadline')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(3)

    if (error) {
      throw error
    }

    return competitions.map((comp) => ({
      ...comp,
      registrationDeadline: comp.registration_deadline,
    }))
  } catch (error) {
    console.error('Fehler beim Laden der Wettkämpfe:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Interner Serverfehler beim Laden der Wettkämpfe',
    })
  }
})
