import type { EventType } from '~~/shared/utils/registration'
import type { RoomSlug } from '~~/shared/types/threads'

/**
 * Ordnet einen Event-Typ dem zugehörigen Forum-Raum zu.
 * Der Event-Typ ist unveränderlich, das Mapping ist statisch:
 * Wettkämpfe (manuell oder LADV) landen in „Races", Trainings im
 * Training-Raum, Social-Events im Social-Raum.
 */
export function eventTypeToRoom(type: EventType): RoomSlug {
  switch (type) {
    case 'training':
      return 'training'
    case 'social':
      return 'social'
    case 'competition':
    case 'ladv':
    case 'ladv_external':
      return 'races'
  }
}
