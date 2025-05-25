export default defineEventHandler(async (event) => {
  // Prüfe Authorization Header mit NUXT_CRON_SECRET
  const authHeader = getHeader(event, 'authorization')
  if (authHeader !== `Bearer ${process.env.NUXT_CRON_SECRET}`) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  console.log('Cron job ausgeführt um:', new Date().toISOString())
    
  return {
    message: 'Cron job erfolgreich ausgeführt',
    timestamp: new Date().toISOString(),
    statusCode: 200
  }
})
