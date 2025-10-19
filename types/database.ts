export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      trainers: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          phone: string
          specialization: string
          bio: string | null
          experience_years: number
          certification: string | null
          status: 'active' | 'inactive'
          avatar_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          phone: string
          specialization: string
          bio?: string | null
          experience_years: number
          certification?: string | null
          status?: 'active' | 'inactive'
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          phone?: string
          specialization?: string
          bio?: string | null
          experience_years?: number
          certification?: string | null
          status?: 'active' | 'inactive'
          avatar_url?: string | null
        }
      }
      programs: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          category: string
          duration_days: number
          max_participants: number
          price: number
          status: 'draft' | 'published' | 'archived'
          start_date: string
          end_date: string
          trainer_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          category: string
          duration_days: number
          max_participants: number
          price: number
          status?: 'draft' | 'published' | 'archived'
          start_date: string
          end_date: string
          trainer_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          category?: string
          duration_days?: number
          max_participants?: number
          price?: number
          status?: 'draft' | 'published' | 'archived'
          start_date?: string
          end_date?: string
          trainer_id?: string | null
        }
      }
      participants: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string
          phone: string
          company: string | null
          position: string | null
          address: string | null
          date_of_birth: string | null
          gender: 'male' | 'female' | 'other'
          status: 'active' | 'inactive'
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email: string
          phone: string
          company?: string | null
          position?: string | null
          address?: string | null
          date_of_birth?: string | null
          gender: 'male' | 'female' | 'other'
          status?: 'active' | 'inactive'
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          phone?: string
          company?: string | null
          position?: string | null
          address?: string | null
          date_of_birth?: string | null
          gender?: 'male' | 'female' | 'other'
          status?: 'active' | 'inactive'
        }
      }
      enrollments: {
        Row: {
          id: string
          created_at: string
          program_id: string
          participant_id: string
          enrollment_date: string
          status: 'pending' | 'approved' | 'rejected' | 'completed'
          payment_status: 'unpaid' | 'partial' | 'paid'
          amount_paid: number
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          program_id: string
          participant_id: string
          enrollment_date?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          payment_status?: 'unpaid' | 'partial' | 'paid'
          amount_paid?: number
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          program_id?: string
          participant_id?: string
          enrollment_date?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed'
          payment_status?: 'unpaid' | 'partial' | 'paid'
          amount_paid?: number
          notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

