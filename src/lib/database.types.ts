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
      businesses: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          owner_id: string | null
          phone: string | null
          selling_policy: string
          status: string
          tax_rate: number
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          owner_id?: string | null
          phone?: string | null
          selling_policy?: string
          status?: string
          tax_rate?: number
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          phone?: string | null
          selling_policy?: string
          status?: string
          tax_rate?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          business_id: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          status: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          status?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      drawer_paid_outs: {
        Row: {
          amount: number
          business_id: string | null
          created_at: string | null
          drawer_session_id: string
          id: string
          reason: string
        }
        Insert: {
          amount: number
          business_id?: string | null
          created_at?: string | null
          drawer_session_id: string
          id?: string
          reason: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          created_at?: string | null
          drawer_session_id?: string
          id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "drawer_paid_outs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drawer_paid_outs_drawer_session_id_fkey"
            columns: ["drawer_session_id"]
            isOneToOne: false
            referencedRelation: "drawer_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      drawer_sessions: {
        Row: {
          business_id: string
          cashier_id: string | null
          closed_at: string | null
          closing_count: number | null
          created_at: string | null
          expected_cash: number | null
          id: string
          notes: string | null
          opened_at: string | null
          opening_float: number
          over_short: number | null
          status: string
        }
        Insert: {
          business_id: string
          cashier_id?: string | null
          closed_at?: string | null
          closing_count?: number | null
          created_at?: string | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string | null
          opening_float?: number
          over_short?: number | null
          status?: string
        }
        Update: {
          business_id?: string
          cashier_id?: string | null
          closed_at?: string | null
          closing_count?: number | null
          created_at?: string | null
          expected_cash?: number | null
          id?: string
          notes?: string | null
          opened_at?: string | null
          opening_float?: number
          over_short?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "drawer_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drawer_sessions_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          auth_user_id: string | null
          business_id: string
          created_at: string | null
          id: string
          invite_status: string | null
          invited_at: string | null
          name: string
          pin: string | null
          role: string
          status: string
        }
        Insert: {
          auth_user_id?: string | null
          business_id: string
          created_at?: string | null
          id?: string
          invite_status?: string | null
          invited_at?: string | null
          name: string
          pin?: string | null
          role?: string
          status?: string
        }
        Update: {
          auth_user_id?: string | null
          business_id?: string
          created_at?: string | null
          id?: string
          invite_status?: string | null
          invited_at?: string | null
          name?: string
          pin?: string | null
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          business_id: string
          id: string
          last_received_at: string | null
          product_id: string
          quantity_on_hand: number
          updated_at: string
        }
        Insert: {
          business_id: string
          id?: string
          last_received_at?: string | null
          product_id: string
          quantity_on_hand?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          id?: string
          last_received_at?: string | null
          product_id?: string
          quantity_on_hand?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          batch_number: string | null
          business_id: string
          created_at: string
          expiration_date: string | null
          id: string
          lot_number: string | null
          manufactured_date: string | null
          product_id: string
          quantity_received: number
          quantity_remaining: number
          receiving_session_id: string | null
          receiving_session_item_id: string | null
          status: string
          supplier_id: string | null
          supplier_name: string | null
          unit_cost: number | null
        }
        Insert: {
          batch_number?: string | null
          business_id: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          lot_number?: string | null
          manufactured_date?: string | null
          product_id: string
          quantity_received?: number
          quantity_remaining?: number
          receiving_session_id?: string | null
          receiving_session_item_id?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          unit_cost?: number | null
        }
        Update: {
          batch_number?: string | null
          business_id?: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          lot_number?: string | null
          manufactured_date?: string | null
          product_id?: string
          quantity_received?: number
          quantity_remaining?: number
          receiving_session_id?: string | null
          receiving_session_item_id?: string | null
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_receiving_session_id_fkey"
            columns: ["receiving_session_id"]
            isOneToOne: false
            referencedRelation: "receiving_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_receiving_session_item_id_fkey"
            columns: ["receiving_session_item_id"]
            isOneToOne: false
            referencedRelation: "receiving_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          product_id: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reason: string | null
          reference_id: string | null
          transaction_type: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          product_id: string
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reason?: string | null
          reference_id?: string | null
          transaction_type: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          product_id?: string
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          reason?: string | null
          reference_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          business_id: string | null
          created_at: string | null
          customer_id: string
          id: string
          points: number
          sale_id: string | null
          type: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          customer_id: string
          id?: string
          points: number
          sale_id?: string | null
          type: string
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          customer_id?: string
          id?: string
          points?: number
          sale_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          business_id: string | null
          created_at: string
          id: string
          payment_method: string
          payment_type: string
          reference: string | null
          sale_id: string
        }
        Insert: {
          amount: number
          business_id?: string | null
          created_at?: string
          id?: string
          payment_method: string
          payment_type?: string
          reference?: string | null
          sale_id: string
        }
        Update: {
          amount?: number
          business_id?: string | null
          created_at?: string
          id?: string
          payment_method?: string
          payment_type?: string
          reference?: string | null
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      po_email_log: {
        Row: {
          business_id: string
          email_count: number
          id: string
          last_emailed_at: string | null
          purchase_order_id: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          email_count?: number
          id?: string
          last_emailed_at?: string | null
          purchase_order_id: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          email_count?: number
          id?: string
          last_emailed_at?: string | null
          purchase_order_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_email_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_email_log_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: true
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      po_signatures: {
        Row: {
          business_id: string
          created_at: string | null
          data_url: string
          id: string
          purchase_order_id: string
          role: string
          signed_at: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          data_url: string
          id?: string
          purchase_order_id: string
          role: string
          signed_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          data_url?: string
          id?: string
          purchase_order_id?: string
          role?: string
          signed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "po_signatures_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_signatures_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reorder_preferences: {
        Row: {
          business_id: string
          id: string
          preferred_qty: number
          product_id: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          id?: string
          preferred_qty: number
          product_id: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          id?: string
          preferred_qty?: number
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_reorder_preferences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reorder_preferences_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          average_cost: number | null
          barcode: string | null
          business_id: string
          category_id: string | null
          cost_price: number
          created_at: string
          estimated_overhead_pct: number
          id: string
          minimum_margin_percent: number | null
          name: string
          reorder_level: number | null
          selling_price: number
          sku: string | null
          status: string
          supplier_id: string | null
          target_margin_percent: number | null
          updated_at: string
        }
        Insert: {
          average_cost?: number | null
          barcode?: string | null
          business_id: string
          category_id?: string | null
          cost_price?: number
          created_at?: string
          estimated_overhead_pct?: number
          id?: string
          minimum_margin_percent?: number | null
          name: string
          reorder_level?: number | null
          selling_price?: number
          sku?: string | null
          status?: string
          supplier_id?: string | null
          target_margin_percent?: number | null
          updated_at?: string
        }
        Update: {
          average_cost?: number | null
          barcode?: string | null
          business_id?: string
          category_id?: string | null
          cost_price?: number
          created_at?: string
          estimated_overhead_pct?: number
          id?: string
          minimum_margin_percent?: number | null
          name?: string
          reorder_level?: number | null
          selling_price?: number
          sku?: string | null
          status?: string
          supplier_id?: string | null
          target_margin_percent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: string
          status: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: string
          status?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          line_total: number | null
          product_id: string
          purchase_order_id: string
          quantity: number | null
          quantity_received: number
          receive_notes: string | null
          unit_cost: number | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          line_total?: number | null
          product_id: string
          purchase_order_id: string
          quantity?: number | null
          quantity_received?: number
          receive_notes?: string | null
          unit_cost?: number | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          line_total?: number | null
          product_id?: string
          purchase_order_id?: string
          quantity?: number | null
          quantity_received?: number
          receive_notes?: string | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          notes: string | null
          po_number: string
          status: string
          subtotal: number | null
          supplier_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          po_number: string
          status?: string
          subtotal?: number | null
          supplier_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          po_number?: string
          status?: string
          subtotal?: number | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      receiving_items: {
        Row: {
          business_id: string
          created_at: string
          id: string
          product_id: string
          quantity_received: number
          receiving_session_id: string
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity_received: number
          receiving_session_id: string
          total_cost?: number | null
          unit_cost?: number
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity_received?: number
          receiving_session_id?: string
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "receiving_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_items_receiving_session_id_fkey"
            columns: ["receiving_session_id"]
            isOneToOne: false
            referencedRelation: "receiving_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      receiving_sessions: {
        Row: {
          additional_cost: number
          approval_note: string | null
          approved_at: string | null
          approved_by: string | null
          business_id: string
          calculated_total: number
          created_at: string
          freight_cost: number
          id: string
          invoice_date: string | null
          invoice_number: string | null
          invoice_status: string
          invoice_total: number
          notes: string | null
          received_by: string | null
          received_date: string
          status: string
          supplier_id: string | null
          supplier_name: string | null
          variance_amount: number
        }
        Insert: {
          additional_cost?: number
          approval_note?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          calculated_total?: number
          created_at?: string
          freight_cost?: number
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_status?: string
          invoice_total?: number
          notes?: string | null
          received_by?: string | null
          received_date?: string
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          variance_amount?: number
        }
        Update: {
          additional_cost?: number
          approval_note?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          calculated_total?: number
          created_at?: string
          freight_cost?: number
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          invoice_status?: string
          invoice_total?: number
          notes?: string | null
          received_by?: string | null
          received_date?: string
          status?: string
          supplier_id?: string | null
          supplier_name?: string | null
          variance_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "receiving_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_sessions_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receiving_sessions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      return_items: {
        Row: {
          business_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          processed_by: string | null
          product_id: string
          quantity_returned: number
          reason: string | null
          return_number: string | null
          return_reason: string | null
          sale_id: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_by?: string | null
          product_id: string
          quantity_returned: number
          reason?: string | null
          return_number?: string | null
          return_reason?: string | null
          sale_id: string
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          processed_by?: string | null
          product_id?: string
          quantity_returned?: number
          reason?: string | null
          return_number?: string | null
          return_reason?: string | null
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_item_batches: {
        Row: {
          business_id: string
          created_at: string
          expiration_date: string | null
          id: string
          inventory_batch_id: string
          product_id: string
          quantity: number
          sale_id: string
          sale_item_id: string
          unit_cost: number | null
        }
        Insert: {
          business_id: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          inventory_batch_id: string
          product_id: string
          quantity: number
          sale_id: string
          sale_item_id: string
          unit_cost?: number | null
        }
        Update: {
          business_id?: string
          created_at?: string
          expiration_date?: string | null
          id?: string
          inventory_batch_id?: string
          product_id?: string
          quantity?: number
          sale_id?: string
          sale_item_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_item_batches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_item_batches_inventory_batch_id_fkey"
            columns: ["inventory_batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_item_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_item_batches_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_item_batches_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          business_id: string | null
          created_at: string
          id: string
          line_total: number
          negotiated_by: string | null
          negotiation_reason: string | null
          original_unit_price: number | null
          product_id: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          id?: string
          line_total: number
          negotiated_by?: string | null
          negotiation_reason?: string | null
          original_unit_price?: number | null
          product_id: string
          quantity: number
          sale_id: string
          unit_price: number
        }
        Update: {
          business_id?: string | null
          created_at?: string
          id?: string
          line_total?: number
          negotiated_by?: string | null
          negotiation_reason?: string | null
          original_unit_price?: number | null
          product_id?: string
          quantity?: number
          sale_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          business_id: string | null
          cashier_id: string | null
          created_at: string
          customer_id: string | null
          discount_amount: number
          id: string
          status: string
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          business_id?: string | null
          cashier_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Update: {
          business_id?: string | null
          cashier_id?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_cashier_id_fkey"
            columns: ["cashier_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_count_items: {
        Row: {
          business_id: string | null
          counted_qty: number
          created_at: string | null
          id: string
          product_id: string
          stock_count_id: string
          system_qty: number
          variance: number
        }
        Insert: {
          business_id?: string | null
          counted_qty?: number
          created_at?: string | null
          id?: string
          product_id: string
          stock_count_id: string
          system_qty?: number
          variance?: number
        }
        Update: {
          business_id?: string | null
          counted_qty?: number
          created_at?: string | null
          id?: string
          product_id?: string
          stock_count_id?: string
          system_qty?: number
          variance?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_count_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_count_items_stock_count_id_fkey"
            columns: ["stock_count_id"]
            isOneToOne: false
            referencedRelation: "stock_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_counts: {
        Row: {
          business_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          business_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string
        }
        Update: {
          business_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_counts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payments: {
        Row: {
          amount: number
          business_id: string
          created_at: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          receiving_session_id: string | null
          reference: string | null
          supplier_id: string
        }
        Insert: {
          amount?: number
          business_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date: string
          payment_method: string
          receiving_session_id?: string | null
          reference?: string | null
          supplier_id: string
        }
        Update: {
          amount?: number
          business_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receiving_session_id?: string | null
          reference?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_receiving_session_id_fkey"
            columns: ["receiving_session_id"]
            isOneToOne: false
            referencedRelation: "receiving_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          business_id: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
        }
        Insert: {
          address?: string | null
          business_id: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_business_id: { Args: never; Returns: string }
      auth_user_role: { Args: never; Returns: string }
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
