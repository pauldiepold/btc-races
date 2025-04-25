import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export abstract class BaseRepository<
  T extends keyof Database['public']['Tables'],
  Row = Database['public']['Tables'][T]['Row'],
  Insert = Database['public']['Tables'][T]['Insert'],
  Update = Database['public']['Tables'][T]['Update'],
> {
  protected supabase: SupabaseClient<Database>
  protected tableName: T

  constructor(client: SupabaseClient<Database>, tableName: T) {
    this.supabase = client
    this.tableName = tableName
  }

  /**
   * Zentrale Fehlerbehandlung für Repository-Operationen
   * @param operation Name der Operation, die fehlgeschlagen ist
   * @param error Fehler-Objekt
   * @returns null für einheitliche Fehlerindikation
   */
  protected handleRepositoryError(operation: string, error: any): null {
    console.error(`Fehler bei ${operation} in ${this.tableName}:`, error)
    return null
  }

  // Gemeinsame Methoden für alle Repository-Typen
  async findById(id: number | string): Promise<Row | null> {
    try {
      // String ID in Number konvertieren, falls notwendig
      const numericId = typeof id === 'string' ? parseInt(id) : id

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', numericId as any)
        .single()

      if (error) {
        return this.handleRepositoryError('findById', error)
      }

      return data as Row
    } catch (err) {
      return this.handleRepositoryError('findById', err)
    }
  }

  async findAll(): Promise<Row[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('id', { ascending: false })

      if (error) {
        this.handleRepositoryError('findAll', error)
        return []
      }

      return (data || []) as Row[]
    } catch (err) {
      this.handleRepositoryError('findAll', err)
      return []
    }
  }

  async create(item: Insert): Promise<Row | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(item as any)
        .select()
        .single()

      if (error) {
        return this.handleRepositoryError('create', error)
      }

      return data as Row
    } catch (err) {
      return this.handleRepositoryError('create', err)
    }
  }

  async update(id: number, updates: Partial<Update>): Promise<Row | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updates as any)
        .eq('id', id as any)
        .select()
        .single()

      if (error) {
        return this.handleRepositoryError('update', error)
      }

      return data as Row
    } catch (err) {
      return this.handleRepositoryError('update', err)
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id as any)

      if (error) {
        this.handleRepositoryError('delete', error)
        return false
      }

      return true
    } catch (err) {
      this.handleRepositoryError('delete', err)
      return false
    }
  }

  /**
   * Anzahl der Einträge in der Tabelle zählen, mit optionalen Filtern
   * @param filters Objekt mit Feld/Wert-Paaren für die Filterung
   * @returns Anzahl der Einträge, die den Filtern entsprechen
   */
  async count(filters: Record<string, any> = {}): Promise<number> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })

      // Filter anwenden
      for (const [field, value] of Object.entries(filters)) {
        query = query.eq(field, value)
      }

      const { count, error } = await query

      if (error) {
        this.handleRepositoryError('count', error)
        return 0
      }

      return count || 0
    } catch (err) {
      this.handleRepositoryError('count', err)
      return 0
    }
  }
}
