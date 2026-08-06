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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      favorites: {
        Row: {
          id: string
          user_id: string
          shop_id: string
          shop_name: string
          shop_image: string | null
          shop_category: string
          shop_rating: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shop_id: string
          shop_name: string
          shop_image?: string | null
          shop_category: string
          shop_rating?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shop_id?: string
          shop_name?: string
          shop_image?: string | null
          shop_category?: string
          shop_rating?: number
          created_at?: string
        }
        Relationships: []
      }
      search_history: {
        Row: {
          id: string
          user_id: string
          query_text: string
          location_label: string | null
          result_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query_text: string
          location_label?: string | null
          result_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query_text?: string
          location_label?: string | null
          result_count?: number
          created_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          items: Json
          status: string
          total_cents: number
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          items?: Json
          status?: string
          total_cents: number
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          items?: Json
          status?: string
          total_cents?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          ai_summary: string | null
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          in_stock: number
          material: string | null
          price_cents: number
          seller_id: string | null
          seller_name: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          in_stock?: number
          material?: string | null
          price_cents: number
          seller_id?: string | null
          seller_name: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          in_stock?: number
          material?: string | null
          price_cents?: number
          seller_id?: string | null
          seller_name?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          ai_confidence: number | null
          ai_draft_answer: string | null
          buyer_id: string
          buyer_name: string
          created_at: string
          id: string
          product_id: string
          question: string
          seller_answer: string | null
          status: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_draft_answer?: string | null
          buyer_id: string
          buyer_name: string
          created_at?: string
          id?: string
          product_id: string
          question: string
          seller_answer?: string | null
          status?: string
        }
        Update: {
          ai_confidence?: number | null
          ai_draft_answer?: string | null
          buyer_id?: string
          buyer_name?: string
          created_at?: string
          id?: string
          product_id?: string
          question?: string
          seller_answer?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string
          created_at: string
          id: string
          product_id: string
          rating: number
          reviewer_id: string | null
          reviewer_name: string
          verified_purchase: boolean
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          reviewer_id?: string | null
          reviewer_name: string
          verified_purchase?: boolean
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          reviewer_id?: string | null
          reviewer_name?: string
          verified_purchase?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      shops: {
        Row: {
          address: string
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          keywords: string[]
          lat: number
          lng: number
          name: string
          open_now: boolean
          phone: string | null
          rating: number
          review_count: number
        }
        Insert: {
          address: string
          category: string
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          keywords?: string[]
          lat: number
          lng: number
          name: string
          open_now?: boolean
          phone?: string | null
          rating?: number
          review_count?: number
        }
        Update: {
          address?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          keywords?: string[]
          lat?: number
          lng?: number
          name?: string
          open_now?: boolean
          phone?: string | null
          rating?: number
          review_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "buyer" | "seller" | "admin"
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
      app_role: ["buyer", "seller", "admin"],
    },
  },
} as const
