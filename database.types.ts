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
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          branch: string | null
          created_at: string | null
          id: string
          is_primary: boolean
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          branch?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          branch?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
            foreignKeyName: "bookings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
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
      coin_bonus_campaigns: {
        Row: {
          campaign_type: Database["public"]["Enums"]["campaign_type"]
          coin_amount: number
          conditions: Json | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean
          start_date: string
          target_trip_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          campaign_type: Database["public"]["Enums"]["campaign_type"]
          coin_amount: number
          conditions?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          start_date: string
          target_trip_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          campaign_type?: Database["public"]["Enums"]["campaign_type"]
          coin_amount?: number
          conditions?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          start_date?: string
          target_trip_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_bonus_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_bonus_campaigns_target_trip_id_fkey"
            columns: ["target_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_bonus_campaigns_target_trip_id_fkey"
            columns: ["target_trip_id"]
            isOneToOne: false
            referencedRelation: "trips_with_next_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_earning_rules: {
        Row: {
          calculation_type: Database["public"]["Enums"]["calculation_type"]
          coin_amount: number
          conditions: Json | null
          created_at: string
          id: string
          is_active: boolean
          priority: number
          rule_name: string
          rule_type: Database["public"]["Enums"]["rule_type"]
          updated_at: string
        }
        Insert: {
          calculation_type?: Database["public"]["Enums"]["calculation_type"]
          coin_amount: number
          conditions?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          rule_name: string
          rule_type: Database["public"]["Enums"]["rule_type"]
          updated_at?: string
        }
        Update: {
          calculation_type?: Database["public"]["Enums"]["calculation_type"]
          coin_amount?: number
          conditions?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          rule_name?: string
          rule_type?: Database["public"]["Enums"]["rule_type"]
          updated_at?: string
        }
        Relationships: []
      }
      coin_redemptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          bank_account_id: string
          cash_amount: number
          coin_amount: number
          conversion_rate: number
          id: string
          notes: string | null
          paid_at: string | null
          rejection_reason: string | null
          requested_at: string
          seller_id: string
          status: Database["public"]["Enums"]["redemption_status"]
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id: string
          cash_amount: number
          coin_amount: number
          conversion_rate?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          seller_id: string
          status?: Database["public"]["Enums"]["redemption_status"]
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          bank_account_id?: string
          cash_amount?: number
          coin_amount?: number
          conversion_rate?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          rejection_reason?: string | null
          requested_at?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["redemption_status"]
        }
        Relationships: [
          {
            foreignKeyName: "coin_redemptions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_redemptions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coin_redemptions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string
          id: string
          metadata: Json | null
          seller_id: string
          source_id: string | null
          source_type: Database["public"]["Enums"]["coin_source_type"]
          transaction_type: Database["public"]["Enums"]["coin_transaction_type"]
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          seller_id: string
          source_id?: string | null
          source_type: Database["public"]["Enums"]["coin_source_type"]
          transaction_type: Database["public"]["Enums"]["coin_transaction_type"]
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          seller_id?: string
          source_id?: string | null
          source_type?: Database["public"]["Enums"]["coin_source_type"]
          transaction_type?: Database["public"]["Enums"]["coin_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
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
          percentage: number | null
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
          percentage?: number | null
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
          percentage?: number | null
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
        Relationships: [
          {
            foreignKeyName: "customers_referred_by_seller_id_fkey"
            columns: ["referred_by_seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "sales_targets_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_coins: {
        Row: {
          balance: number
          created_at: string
          seller_id: string
          total_earned: number
          total_redeemed: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          seller_id: string
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          seller_id?: string
          total_earned?: number
          total_redeemed?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_coins_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
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
        Relationships: [
          {
            foreignKeyName: "user_profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          file_link: string | null
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
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_coin_transaction: {
        Args: {
          p_amount: number
          p_description: string
          p_metadata?: Json
          p_seller_id: string
          p_source_id: string
          p_source_type: Database["public"]["Enums"]["coin_source_type"]
          p_transaction_type: Database["public"]["Enums"]["coin_transaction_type"]
        }
        Returns: string
      }
      calculate_sales_target_bonus: {
        Args: { p_month: string; p_seller_id: string }
        Returns: number
      }
      get_active_campaigns: {
        Args: { p_seller_id?: string; p_trip_id?: string }
        Returns: {
          campaign_type: Database["public"]["Enums"]["campaign_type"]
          coin_amount: number
          description: string
          end_date: string
          id: string
          start_date: string
          target_trip_id: string
          title: string
        }[]
      }
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
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_storage_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_storage_file_owner: {
        Args: { file_path: string }
        Returns: boolean
      }
      refresh_seller_booking_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      calculation_type: "fixed" | "percentage" | "tier"
      campaign_type:
        | "trip_specific"
        | "date_specific"
        | "sales_milestone"
        | "general"
      coin_source_type:
        | "booking"
        | "sales_target"
        | "referral"
        | "campaign"
        | "admin"
      coin_transaction_type: "earn" | "redeem" | "bonus" | "adjustment"
      redemption_status: "pending" | "approved" | "rejected" | "paid"
      rule_type:
        | "booking_approved"
        | "sales_target_monthly"
        | "referral_first_sale"
        | "referral_signup"
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
      calculation_type: ["fixed", "percentage", "tier"],
      campaign_type: [
        "trip_specific",
        "date_specific",
        "sales_milestone",
        "general",
      ],
      coin_source_type: [
        "booking",
        "sales_target",
        "referral",
        "campaign",
        "admin",
      ],
      coin_transaction_type: ["earn", "redeem", "bonus", "adjustment"],
      redemption_status: ["pending", "approved", "rejected", "paid"],
      rule_type: [
        "booking_approved",
        "sales_target_monthly",
        "referral_first_sale",
        "referral_signup",
      ],
    },
  },
} as const
