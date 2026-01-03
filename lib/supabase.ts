import { createClient } from "@supabase/supabase-js"

// Check if Supabase environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create Supabase client if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// Flag to check if Supabase is available
export const isSupabaseAvailable = supabase !== null

// Database types (for when Supabase is available)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          password_hash: string
          role: "admin" | "user"
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          password_hash: string
          role: "admin" | "user"
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          password_hash?: string
          role?: "admin" | "user"
          created_at?: string
        }
      }
      printer_groups: {
        Row: {
          id: string
          name: string
          printer_ids: string[]
          image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          printer_ids?: string[]
          image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          printer_ids?: string[]
          image_url?: string | null
          created_at?: string
        }
      }
      printers: {
        Row: {
          id: string
          name: string
          ip_address: string
          status: "online" | "offline" | "printing" | "error"
          queue: any[]
          completed_jobs: any[]
          image_url: string | null
          progress: number
          eta: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          ip_address: string
          status?: "online" | "offline" | "printing" | "error"
          queue?: any[]
          completed_jobs?: any[]
          image_url?: string | null
          progress?: number
          eta?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          ip_address?: string
          status?: "online" | "offline" | "printing" | "error"
          queue?: any[]
          completed_jobs?: any[]
          image_url?: string | null
          progress?: number
          eta?: number | null
          created_at?: string
        }
      }
      error_logs: {
        Row: {
          id: string
          timestamp: number
          title: string
          description: string | null
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          timestamp: number
          title: string
          description?: string | null
          details?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          timestamp?: number
          title?: string
          description?: string | null
          details?: string | null
          created_at?: string
        }
      }
    }
  }
}
