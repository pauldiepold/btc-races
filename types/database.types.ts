export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  pgbouncer: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth: {
        Args: { p_usename: string }
        Returns: {
          username: string
          password: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      competition_distances: {
        Row: {
          competition_id: number
          created_at: string | null
          distance: string
          id: number
          updated_at: string | null
        }
        Insert: {
          competition_id: number
          created_at?: string | null
          distance: string
          id?: number
          updated_at?: string | null
        }
        Update: {
          competition_id?: number
          created_at?: string | null
          distance?: string
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'competition_distances_competition_id_fkey'
            columns: ['competition_id']
            referencedRelation: 'competitions'
            referencedColumns: ['id']
          },
        ]
      }
      competitions: {
        Row: {
          announcement_link: string | null
          ausrichter: string | null
          championship_type: Database['public']['Enums']['championship_type']
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          id: number
          ladv_data: Json | null
          ladv_description: string | null
          ladv_id: number | null
          ladv_last_sync: string | null
          location: string | null
          name: string
          race_type: Database['public']['Enums']['race_type']
          registration_deadline: string
          registration_type: Database['public']['Enums']['registration_type']
          sportstaette: string | null
          updated_at: string | null
          veranstalter: string | null
        }
        Insert: {
          announcement_link?: string | null
          ausrichter?: string | null
          championship_type?: Database['public']['Enums']['championship_type']
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          id?: number
          ladv_data?: Json | null
          ladv_description?: string | null
          ladv_id?: number | null
          ladv_last_sync?: string | null
          location?: string | null
          name: string
          race_type?: Database['public']['Enums']['race_type']
          registration_deadline: string
          registration_type?: Database['public']['Enums']['registration_type']
          sportstaette?: string | null
          updated_at?: string | null
          veranstalter?: string | null
        }
        Update: {
          announcement_link?: string | null
          ausrichter?: string | null
          championship_type?: Database['public']['Enums']['championship_type']
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: number
          ladv_data?: Json | null
          ladv_description?: string | null
          ladv_id?: number | null
          ladv_last_sync?: string | null
          location?: string | null
          name?: string
          race_type?: Database['public']['Enums']['race_type']
          registration_deadline?: string
          registration_type?: Database['public']['Enums']['registration_type']
          sportstaette?: string | null
          updated_at?: string | null
          veranstalter?: string | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          created_at: string
          email: string
          id: number
          member_id: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: number
          member_id: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          member_id?: number
        }
        Relationships: [
          {
            foreignKeyName: 'emails_member_id_fkey'
            columns: ['member_id']
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'emails_member_id_fkey'
            columns: ['member_id']
            referencedRelation: 'members_with_emails'
            referencedColumns: ['id']
          },
        ]
      }
      members: {
        Row: {
          created_at: string
          has_ladv_startpass: boolean
          has_left: boolean
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_ladv_startpass?: boolean
          has_left?: boolean
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_ladv_startpass?: boolean
          has_left?: boolean
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          competition_id: number
          created_at: string
          id: number
          member_id: number
          notes: string | null
          status: Database['public']['Enums']['registration_status'] | null
          updated_at: string | null
        }
        Insert: {
          competition_id: number
          created_at?: string
          id?: number
          member_id: number
          notes?: string | null
          status?: Database['public']['Enums']['registration_status'] | null
          updated_at?: string | null
        }
        Update: {
          competition_id?: number
          created_at?: string
          id?: number
          member_id?: number
          notes?: string | null
          status?: Database['public']['Enums']['registration_status'] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'registrations_competition_id_fkey'
            columns: ['competition_id']
            referencedRelation: 'competitions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registrations_member_id_fkey'
            columns: ['member_id']
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registrations_member_id_fkey'
            columns: ['member_id']
            referencedRelation: 'members_with_emails'
            referencedColumns: ['id']
          },
        ]
      }
      sent_emails: {
        Row: {
          created_at: string | null
          email_type: string
          error: string | null
          id: number
          registration_id: number | null
          retry_count: number | null
          sent_at: string | null
          status: string
          subject: string
          token: string | null
          token_expires_at: string | null
          token_verified_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          error?: string | null
          id?: number
          registration_id?: number | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          subject: string
          token?: string | null
          token_expires_at?: string | null
          token_verified_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error?: string | null
          id?: number
          registration_id?: number | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          subject?: string
          token?: string | null
          token_expires_at?: string | null
          token_verified_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'sent_emails_registration_id_fkey'
            columns: ['registration_id']
            referencedRelation: 'public_registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sent_emails_registration_id_fkey'
            columns: ['registration_id']
            referencedRelation: 'registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sent_emails_registration_id_fkey'
            columns: ['registration_id']
            referencedRelation: 'registrations_with_details'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      members_with_emails: {
        Row: {
          created_at: string | null
          email: string | null
          has_ladv_startpass: boolean | null
          has_left: boolean | null
          id: number | null
          name: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      public_registrations: {
        Row: {
          competition_date: string | null
          competition_name: string | null
          created_at: string | null
          id: number | null
          member_name: string | null
          status: Database['public']['Enums']['registration_status'] | null
        }
        Relationships: []
      }
      registrations_with_details: {
        Row: {
          ausrichter: string | null
          championship_type:
            | Database['public']['Enums']['championship_type']
            | null
          competition_date: string | null
          competition_id: number | null
          competition_location: string | null
          competition_name: string | null
          created_at: string | null
          has_ladv_startpass: boolean | null
          id: number | null
          ladv_description: string | null
          ladv_id: number | null
          ladv_last_sync: string | null
          member_email: string | null
          member_id: number | null
          member_name: string | null
          notes: string | null
          race_type: Database['public']['Enums']['race_type'] | null
          registration_deadline: string | null
          sportstaette: string | null
          status: Database['public']['Enums']['registration_status'] | null
          updated_at: string | null
          veranstalter: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'registrations_competition_id_fkey'
            columns: ['competition_id']
            referencedRelation: 'competitions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registrations_member_id_fkey'
            columns: ['member_id']
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registrations_member_id_fkey'
            columns: ['member_id']
            referencedRelation: 'members_with_emails'
            referencedColumns: ['id']
          },
        ]
      }
      sent_emails_with_details: {
        Row: {
          competition_date: string | null
          competition_name: string | null
          created_at: string | null
          email_type: string | null
          error: string | null
          id: number | null
          member_id: number | null
          member_name: string | null
          recipient_email: string | null
          registration_id: number | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
          subject: string | null
          token: string | null
          token_expires_at: string | null
          token_verified_at: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'registrations_member_id_fkey'
            columns: ['member_id']
            referencedRelation: 'members'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'registrations_member_id_fkey'
            columns: ['member_id']
            referencedRelation: 'members_with_emails'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sent_emails_registration_id_fkey'
            columns: ['registration_id']
            referencedRelation: 'public_registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sent_emails_registration_id_fkey'
            columns: ['registration_id']
            referencedRelation: 'registrations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'sent_emails_registration_id_fkey'
            columns: ['registration_id']
            referencedRelation: 'registrations_with_details'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      championship_type: 'NO_CHAMPIONSHIP' | 'BBM' | 'NDM' | 'DM'
      race_type: 'TRACK' | 'ROAD'
      registration_status:
        | 'pending'
        | 'confirmed'
        | 'canceled'
        | 'pending_cancellation'
      registration_type: 'INDEPENDENT' | 'LADV' | 'CLUB'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'objects_bucketId_fkey'
            columns: ['bucket_id']
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'prefixes_bucketId_fkey'
            columns: ['bucket_id']
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_bucket_id_fkey'
            columns: ['bucket_id']
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: 's3_multipart_uploads_parts_bucket_id_fkey'
            columns: ['bucket_id']
            referencedRelation: 'buckets'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 's3_multipart_uploads_parts_upload_id_fkey'
            columns: ['upload_id']
            referencedRelation: 's3_multipart_uploads'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; name: string; owner: string; metadata: Json }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: {
        Args: { name: string }
        Returns: string
      }
      filename: {
        Args: { name: string }
        Returns: string
      }
      foldername: {
        Args: { name: string }
        Returns: string[]
      }
      get_level: {
        Args: { name: string }
        Returns: number
      }
      get_prefix: {
        Args: { name: string }
        Returns: string
      }
      get_prefixes: {
        Args: { name: string }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
      search_legacy_v1: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
      search_v1_optimised: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
      search_v2: {
        Args: {
          prefix: string
          bucket_name: string
          limits?: number
          levels?: number
          start_after?: string
        }
        Returns: {
          key: string
          name: string
          id: string
          updated_at: string
          created_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  pgbouncer: {
    Enums: {},
  },
  public: {
    Enums: {
      championship_type: ['NO_CHAMPIONSHIP', 'BBM', 'NDM', 'DM'],
      race_type: ['TRACK', 'ROAD'],
      registration_status: [
        'pending',
        'confirmed',
        'canceled',
        'pending_cancellation',
      ],
      registration_type: ['INDEPENDENT', 'LADV', 'CLUB'],
    },
  },
  storage: {
    Enums: {},
  },
} as const
