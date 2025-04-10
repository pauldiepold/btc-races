export interface Competition {
  id: string
  name: string
  date: string
  location: string
  registration_deadline: string
  announcement_link: string
  description: string | null
  max_participants: number | null
  categories: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      competitions: {
        Row: Competition
        Insert: Omit<Competition, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Competition, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
