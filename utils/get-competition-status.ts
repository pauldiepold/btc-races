import type { Database } from '~/types/database.types'

export default function (competition: Database['public']['Tables']['competitions']['Row']) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  const deadline = new Date(competition.registration_deadline)
  deadline.setHours(0, 0, 0, 0)
  
  const date = new Date(competition.date)
  date.setHours(0, 0, 0, 0)

  if (now < deadline) {
    return {
      text: 'Anmeldung möglich',
      color: 'text-green-900 bg-green-100'
    }
  }

  if (now < date) {
    return {
      text: 'Meldefrist verstrichen',
      color: 'text-yellow-800 bg-yellow-100'
    }
  }

  return {
    text: 'Vergangen',
    color: 'text-yellow-900 bg-yellow-100'
  }
} 