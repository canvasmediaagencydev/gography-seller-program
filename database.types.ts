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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          booking_date: string | null
          cancelled_at: string | null
          commission_amount: number
          created_at: string | null
          customer_id: string | null
          deposit_amount: number | null
          deposit_paid_at: string | null
          full_payment_at: string | null
          id: string
          notes: string | null
          payment_status: string | null
          remaining_amount: number | null
          seller_id: string | null
          status: string | null
          total_amount: number
          trip_schedule_id: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          booking_date?: string | null
          cancelled_at?: string | null
          commission_amount: number
          created_at?: string | null
          customer_id?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          full_payment_at?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          remaining_amount?: number | null
          seller_id?: string | null
          status?: string | null
          total_amount: number
          trip_schedule_id?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          booking_date?: string | null
          cancelled_at?: string | null
          commission_amount?: number
          created_at?: string | null
          customer_id?: string | null
          deposit_amount?: number | null
          deposit_paid_at?: string | null
          full_payment_at?: string | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          remaining_amount?: number | null
          seller_id?: string | null
          status?: string | null
          total_amount?: number
          trip_schedule_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_schedule_id_fkey"
            columns: ["trip_schedule_id"]
            isOneToOne: false
            referencedRelation: "trip_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_schedule_id_fkey"
            columns: ["trip_schedule_id"]
            isOneToOne: false
            referencedRelation: "trips_with_next_schedule"
            referencedColumns: ["next_schedule_id"]
          },
        ]
      }
      commission_payments: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_type: string
          percentage: number
          seller_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_type: string
          percentage?: number
          seller_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_type?: string
          percentage?: number
          seller_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_payments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          flag_emoji: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string | null
          flag_emoji?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string | null
          flag_emoji?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          email: string
          full_name: string
          id: string
          id_card: string | null
          passport_number: string | null
          phone: string | null
          referred_by_code: string | null
          referred_by_seller_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          full_name: string
          id?: string
          id_card?: string | null
          passport_number?: string | null
          phone?: string | null
          referred_by_code?: string | null
          referred_by_seller_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          full_name?: string
          id?: string
          id_card?: string | null
          passport_number?: string | null
          phone?: string | null
          referred_by_code?: string | null
          referred_by_seller_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_targets: {
        Row: {
          commission_target: number
          created_at: string | null
          id: string
          seller_id: string | null
          target_month: string
          updated_at: string | null
        }
        Insert: {
          commission_target: number
          created_at?: string | null
          id?: string
          seller_id?: string | null
          target_month: string
          updated_at?: string | null
        }
        Update: {
          commission_target?: number
          created_at?: string | null
          id?: string
          seller_id?: string | null
          target_month?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_schedules: {
        Row: {
          available_seats: number
          created_at: string | null
          departure_date: string
          id: string
          is_active: boolean | null
          registration_deadline: string
          return_date: string
          trip_id: string | null
        }
        Insert: {
          available_seats: number
          created_at?: string | null
          departure_date: string
          id?: string
          is_active?: boolean | null
          registration_deadline: string
          return_date: string
          trip_id?: string | null
        }
        Update: {
          available_seats?: number
          created_at?: string | null
          departure_date?: string
          id?: string
          is_active?: boolean | null
          registration_deadline?: string
          return_date?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_schedules_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_schedules_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips_with_next_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          commission_type: string | null
          commission_value: number
          country_id: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_days: number
          duration_nights: number
          file_link: string | null
          id: string
          is_active: boolean | null
          price_per_person: number
          title: string
          total_seats: number
          updated_at: string | null
        }
        Insert: {
          commission_type?: string | null
          commission_value: number
          country_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_days: number
          duration_nights: number
          file_link?: string | null
          id?: string
          is_active?: boolean | null
          price_per_person: number
          title: string
          total_seats: number
          updated_at?: string | null
        }
        Update: {
          commission_type?: string | null
          commission_value?: number
          country_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duration_days?: number
          duration_nights?: number
          file_link?: string | null
          id?: string
          is_active?: boolean | null
          price_per_person?: number
          title?: string
          total_seats?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          avatar_uploaded_at: string | null
          avatar_url: string | null
          commission_goal: number | null
          created_at: string | null
          document_uploaded_at: string | null
          documents_urls: string[] | null
          email: string | null
          full_name: string | null
          id: string
          id_card_uploaded_at: string | null
          id_card_url: string | null
          phone: string | null
          referral_code: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_uploaded_at?: string | null
          avatar_url?: string | null
          commission_goal?: number | null
          created_at?: string | null
          document_uploaded_at?: string | null
          documents_urls?: string[] | null
          email?: string | null
          full_name?: string | null
          id: string
          id_card_uploaded_at?: string | null
          id_card_url?: string | null
          phone?: string | null
          referral_code?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          avatar_uploaded_at?: string | null
          avatar_url?: string | null
          commission_goal?: number | null
          created_at?: string | null
          document_uploaded_at?: string | null
          documents_urls?: string[] | null
          email?: string | null
          full_name?: string | null
          id?: string
          id_card_uploaded_at?: string | null
          id_card_url?: string | null
          phone?: string | null
          referral_code?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      seller_booking_stats: {
        Row: {
          booking_count: number | null
          seller_id: string | null
          total_amount: number | null
          total_commission: number | null
          trip_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_schedules_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_schedules_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips_with_next_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      trips_with_next_schedule: {
        Row: {
          commission_type: string | null
          commission_value: number | null
          country_flag: string | null
          country_id: string | null
          country_name: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duration_days: number | null
          duration_nights: number | null
          geography_link: string | null
          id: string | null
          is_active: boolean | null
          next_available_seats: number | null
          next_departure_date: string | null
          next_registration_deadline: string | null
          next_return_date: string | null
          next_schedule_id: string | null
          price_per_person: number | null
          title: string | null
          total_seats: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_available_countries: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_available_seats: {
        Args: { schedule_id: string }
        Returns: number
      }
      get_booking_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          approved_bookings: number
          cancelled_bookings: number
          inprogress_bookings: number
          pending_bookings: number
          rejected_bookings: number
          total_bookings: number
        }[]
      }
      get_sellers_with_emails: {
        Args: Record<PropertyKey, never>
        Returns: {
          approved_at: string
          approved_by: string
          avatar_uploaded_at: string
          avatar_url: string
          commission_goal: number
          created_at: string
          document_uploaded_at: string
          documents_urls: string[]
          email: string
          full_name: string
          id: string
          id_card_uploaded_at: string
          id_card_url: string
          phone: string
          referral_code: string
          role: string
          status: string
          updated_at: string
        }[]
      }
      get_trip_stats: {
        Args: { p_user_id: string; p_user_role: string }
        Returns: Json
      }
      get_trips_with_seller_data: {
        Args: {
          p_countries?: string[]
          p_filter?: string
          p_page?: number
          p_page_size?: number
          p_user_id: string
          p_user_role: string
        }
        Returns: Json
      }
      refresh_seller_booking_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
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
    Enums: {},
  },
} as const
