
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
          transaction_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debt_plans: {
        Row: {
          budget_percentage: number
          created_at: string
          id: string
          is_active: boolean
          monthly_budget: number | null
          monthly_income: number
          name: string
          payment_strategy: string
          user_id: string
        }
        Insert: {
          budget_percentage: number
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_budget?: number | null
          monthly_income: number
          name: string
          payment_strategy: string
          user_id: string
        }
        Update: {
          budget_percentage?: number
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_budget?: number | null
          monthly_income?: number
          name?: string
          payment_strategy?: string
          user_id?: string
        }
        Relationships: []
      }
      debts: {
        Row: {
          balance: number
          created_at: string
          id: string
          interest_rate: number
          minimum_payment: number
          name: string
          user_id: string
        }
        Insert: {
          balance: number
          created_at?: string
          id?: string
          interest_rate: number
          minimum_payment: number
          name: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          interest_rate?: number
          minimum_payment?: number
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          completed: boolean
          created_at: string
          current_amount: number
          id: string
          monthly_contribution: number
          months_to_achieve: number
          name: string
          progress: number
          target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          current_amount?: number
          id?: string
          monthly_contribution: number
          months_to_achieve: number
          name: string
          progress?: number
          target: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          current_amount?: number
          id?: string
          monthly_contribution?: number
          months_to_achieve?: number
          name?: string
          progress?: number
          target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_name?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          category_id: string | null
          category_name: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          transaction_date: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          transaction_date: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          category_id?: string | null
          category_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          transaction_date?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      transaction_type: "expense" | "income"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      transaction_type: ["expense", "income"],
    },
  },
} as const
