export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      job_applications: {
        Row: {
          applied_at: string
          id: string
          job_id: string
          message: string | null
          status: Database["public"]["Enums"]["application_status"]
          worker_id: string
        }
        Insert: {
          applied_at?: string
          id?: string
          job_id: string
          message?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          worker_id: string
        }
        Update: {
          applied_at?: string
          id?: string
          job_id?: string
          message?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "admin_user_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_applications_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string
          description: string
          id: string
          job_date: string
          job_provider_id: string
          job_time: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          notification_scope: string
          pincode: string | null
          required_skills: string[] | null
          selected_worker_id: string | null
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
          wage: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          job_date: string
          job_provider_id: string
          job_time?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          notification_scope?: string
          pincode?: string | null
          required_skills?: string[] | null
          selected_worker_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
          wage: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          job_date?: string
          job_provider_id?: string
          job_time?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          notification_scope?: string
          pincode?: string | null
          required_skills?: string[] | null
          selected_worker_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
          wage?: number
        }
        Relationships: [
          {
            foreignKeyName: "jobs_job_provider_id_fkey"
            columns: ["job_provider_id"]
            isOneToOne: false
            referencedRelation: "admin_user_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_job_provider_id_fkey"
            columns: ["job_provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_selected_worker_id_fkey"
            columns: ["selected_worker_id"]
            isOneToOne: false
            referencedRelation: "admin_user_details"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "jobs_selected_worker_id_fkey"
            columns: ["selected_worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          job_id: string | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          message: string
          metadata?: Json | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_type: string | null
          company_name: string | null
          created_at: string
          email: string
          experience_level: string | null
          first_name: string | null
          id: string
          last_name: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          notification_preferences: Json | null
          phone: string | null
          pincode: string | null
          profile_completion_percentage: number | null
          profile_photo_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          skills: string[] | null
          updated_at: string
          user_id: string
          worker_category: Database["public"]["Enums"]["worker_category"] | null
        }
        Insert: {
          business_type?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          experience_level?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          notification_preferences?: Json | null
          phone?: string | null
          pincode?: string | null
          profile_completion_percentage?: number | null
          profile_photo_url?: string | null
          role: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          updated_at?: string
          user_id: string
          worker_category?:
            | Database["public"]["Enums"]["worker_category"]
            | null
        }
        Update: {
          business_type?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          experience_level?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          notification_preferences?: Json | null
          phone?: string | null
          pincode?: string | null
          profile_completion_percentage?: number | null
          profile_photo_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          skills?: string[] | null
          updated_at?: string
          user_id?: string
          worker_category?:
            | Database["public"]["Enums"]["worker_category"]
            | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_user_details: {
        Row: {
          auth_created_at: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          email_confirmed_at: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          last_sign_in_at: string | null
          location: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          skills: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_profile_completion: {
        Args: { profile_id: string }
        Returns: number
      }
      find_nearby_jobs: {
        Args: { radius_km?: number; worker_lat: number; worker_lng: number }
        Returns: {
          distance_km: number
          job_id: string
          title: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      application_status: "pending" | "accepted" | "rejected"
      job_status: "posted" | "assigned" | "completed" | "cancelled"
      user_role: "worker" | "job_provider" | "admin"
      worker_category:
        | "general_laborer"
        | "construction_worker"
        | "mechanic"
        | "plumber"
        | "electrician"
        | "carpenter"
        | "painter"
        | "watchman"
        | "cleaner"
        | "gardener"
        | "driver"
        | "welder"
        | "mason"
        | "helper"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: ["pending", "accepted", "rejected"],
      job_status: ["posted", "assigned", "completed", "cancelled"],
      user_role: ["worker", "job_provider", "admin"],
      worker_category: [
        "general_laborer",
        "construction_worker",
        "mechanic",
        "plumber",
        "electrician",
        "carpenter",
        "painter",
        "watchman",
        "cleaner",
        "gardener",
        "driver",
        "welder",
        "mason",
        "helper",
      ],
    },
  },
} as const
