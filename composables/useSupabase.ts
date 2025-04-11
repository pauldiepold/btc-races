import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

export interface Member {
  id: string
  first_name: string
  last_name: string
  email: string
  created_at: string
  updated_at: string
}

export interface Competition {
  id: string
  name: string
  date: string
  location: string
  registration_deadline: string
  announcement_link: string
  description?: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Registration {
  id: string
  member_id: string
  competition_id: string
  status: 'pending' | 'confirmed' | 'cancelled'
  notes?: string
  verification_token: string
  is_verified: boolean
  created_at: string
  updated_at: string
  member?: Member
  competition?: Competition
}

export function useSupabase() {
  const config = useRuntimeConfig()

  // Supabase Client wird nur einmal erstellt und dann wiederverwendet
  const supabase = ref<SupabaseClient | null>(null)

  // Initialisiere den Supabase-Client, falls noch nicht geschehen
  const initSupabase = () => {
    if (!supabase.value) {
      const supabaseUrl = config.public.supabaseUrl
      const supabaseKey = config.public.supabaseKey

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL und Key müssen in der Umgebungskonfiguration definiert sein')
      }

      supabase.value = createClient(supabaseUrl, supabaseKey)
    }

    return supabase.value
  }

  // Wettkampf-Funktionen
  const getCompetitions = async (archived = false) => {
    const client = initSupabase()

    const query = client
      .from('competitions')
      .select('*')

    if (!archived) {
      query.eq('is_archived', false)
    }

    query.order('date', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Fehler beim Abrufen der Wettkämpfe:', error)
      throw error
    }

    return data as Competition[]
  }

  const getCompetition = async (id: string) => {
    const client = initSupabase()

    const { data, error } = await client
      .from('competitions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`Fehler beim Abrufen des Wettkampfs ${id}:`, error)
      throw error
    }

    return data as Competition
  }

  // Mitglieder-Funktionen
  const getMembers = async () => {
    const client = initSupabase()

    const { data, error } = await client
      .from('members')
      .select('*')
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Fehler beim Abrufen der Mitglieder:', error)
      throw error
    }

    return data as Member[]
  }

  // Anmeldungs-Funktionen
  const createRegistration = async (registration: Partial<Registration>) => {
    const client = initSupabase()

    const { data, error } = await client
      .from('registrations')
      .insert(registration)
      .select()
      .single()

    if (error) {
      console.error('Fehler beim Erstellen der Anmeldung:', error)
      throw error
    }

    return data as Registration
  }

  const getRegistrationsForCompetition = async (competitionId: string) => {
    const client = initSupabase()

    const { data, error } = await client
      .from('registrations')
      .select(`
        *,
        member:member_id (*)
      `)
      .eq('competition_id', competitionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(`Fehler beim Abrufen der Anmeldungen für Wettkampf ${competitionId}:`, error)
      throw error
    }

    return data as Registration[]
  }

  const verifyRegistration = async (verificationToken: string) => {
    const client = initSupabase()

    const { data, error } = await client
      .from('registrations')
      .update({
        is_verified: true,
        status: 'confirmed',
      })
      .eq('verification_token', verificationToken)
      .select()
      .single()

    if (error) {
      console.error('Fehler bei der Verifizierung der Anmeldung:', error)
      throw error
    }

    return data as Registration
  }

  return {
    initSupabase,
    getCompetitions,
    getCompetition,
    getMembers,
    createRegistration,
    getRegistrationsForCompetition,
    verifyRegistration,
  }
}
