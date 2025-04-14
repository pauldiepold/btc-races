import type { Database } from './../types/database.types'

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
      color: 'text-(--ui-color-neutral-100) dark:text-(--ui-color-neutral-800) bg-(--ui-success)'
    }
  }

  if (now < date) {
    return {
      text: 'Meldefrist verstrichen',
      color: 'bg-(--ui-color-error-400) text-(--ui-color-neutral-900)'
    }
  }

  return {
    text: 'Vergangen',
    color: 'text-(--ui-color-neutral-700) dark:text-(--ui-color-neutral-800) bg-(--ui-warning)'
  }
} 