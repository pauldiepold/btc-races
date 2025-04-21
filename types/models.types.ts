import type { Database } from '~/types/database.types'

type Tables = Database['public']['Tables']

export type Competition = Tables['competitions']['Row']
export type CompetitionInsert = Tables['competitions']['Insert']
export type CompetitionUpdate = Tables['competitions']['Update']

export type Member = Tables['members']['Row']
export type MemberInsert = Tables['members']['Insert']
export type MemberUpdate = Tables['members']['Update']

export type Email = Tables['emails']['Row']
export type EmailInsert = Tables['emails']['Insert']
export type EmailUpdate = Tables['emails']['Update']

export type Registration = Tables['registrations']['Row']
export type RegistrationInsert = Tables['registrations']['Insert']
export type RegistrationUpdate = Tables['registrations']['Update']

export type SentEmail = Tables['sent_emails']['Row']
export type SentEmailInsert = Tables['sent_emails']['Insert']
export type SentEmailUpdate = Tables['sent_emails']['Update']
