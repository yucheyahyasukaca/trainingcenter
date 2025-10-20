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
          updated_at: string
          user_id: string | null
          name: string
          email: string
          phone: string
          specialization: string
          bio: string | null
          experience_years: number
          certification: string | null
          status: 'active' | 'inactive'
          avatar_url: string | null
          hourly_rate: number | null
          availability_schedule: Json | null
          skills: string[] | null
          languages: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string | null
          name: string
          email: string
          phone: string
          specialization: string
          bio?: string | null
          experience_years?: number
          certification?: string | null
          status?: 'active' | 'inactive'
          avatar_url?: string | null
          hourly_rate?: number | null
          availability_schedule?: Json | null
          skills?: string[] | null
          languages?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string | null
          name?: string
          email?: string
          phone?: string
          specialization?: string
          bio?: string | null
          experience_years?: number
          certification?: string | null
          status?: 'active' | 'inactive'
          avatar_url?: string | null
          hourly_rate?: number | null
          availability_schedule?: Json | null
          skills?: string[] | null
          languages?: string[] | null
        }
      }
      programs: {
        Row: {
          id: string
          created_at: string
          updated_at: string
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
          created_by: string | null
          requirements: string | null
          learning_objectives: string[] | null
          prerequisites: string[] | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
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
          created_by?: string | null
          requirements?: string | null
          learning_objectives?: string[] | null
          prerequisites?: string[] | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
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
          created_by?: string | null
          requirements?: string | null
          learning_objectives?: string[] | null
          prerequisites?: string[] | null
        }
      }
      participants: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string | null
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
          updated_at?: string
          user_id?: string | null
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
          updated_at?: string
          user_id?: string | null
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
          updated_at: string
          program_id: string
          participant_id: string
          class_id: string | null
          enrollment_date: string
          status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
          payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
          amount_paid: number
          notes: string | null
          completion_date: string | null
          certificate_issued: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          program_id: string
          participant_id: string
          class_id?: string | null
          enrollment_date?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
          payment_status?: 'unpaid' | 'partial' | 'paid' | 'refunded'
          amount_paid?: number
          notes?: string | null
          completion_date?: string | null
          certificate_issued?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          program_id?: string
          participant_id?: string
          class_id?: string | null
          enrollment_date?: string
          status?: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
          payment_status?: 'unpaid' | 'partial' | 'paid' | 'refunded'
          amount_paid?: number
          notes?: string | null
          completion_date?: string | null
          certificate_issued?: boolean
        }
      }
      classes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          program_id: string
          name: string
          description: string | null
          start_date: string
          end_date: string
          start_time: string | null
          end_time: string | null
          max_participants: number
          current_participants: number
          status: 'active' | 'inactive' | 'full' | 'completed' | 'scheduled' | 'ongoing' | 'cancelled'
          location: string | null
          room: string | null
          materials_needed: string[] | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          program_id: string
          name: string
          description?: string | null
          start_date: string
          end_date: string
          start_time?: string | null
          end_time?: string | null
          max_participants?: number
          current_participants?: number
          status?: 'active' | 'inactive' | 'full' | 'completed' | 'scheduled' | 'ongoing' | 'cancelled'
          location?: string | null
          room?: string | null
          materials_needed?: string[] | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          program_id?: string
          name?: string
          description?: string | null
          start_date?: string
          end_date?: string
          start_time?: string | null
          end_time?: string | null
          max_participants?: number
          current_participants?: number
          status?: 'active' | 'inactive' | 'full' | 'completed' | 'scheduled' | 'ongoing' | 'cancelled'
          location?: string | null
          room?: string | null
          materials_needed?: string[] | null
          notes?: string | null
        }
      }
      class_trainers: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          class_id: string
          trainer_id: string
          role: 'instructor' | 'assistant' | 'mentor' | 'coach'
          is_primary: boolean
          assigned_date: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          class_id: string
          trainer_id: string
          role?: 'instructor' | 'assistant' | 'mentor' | 'coach'
          is_primary?: boolean
          assigned_date?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          class_id?: string
          trainer_id?: string
          role?: 'instructor' | 'assistant' | 'mentor' | 'coach'
          is_primary?: boolean
          assigned_date?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          email: string
          full_name: string
          role: 'admin' | 'manager' | 'trainer' | 'user'
          is_active: boolean
          avatar_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          email: string
          full_name: string
          role?: 'admin' | 'manager' | 'trainer' | 'user'
          is_active?: boolean
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string
          role?: 'admin' | 'manager' | 'trainer' | 'user'
          is_active?: boolean
          avatar_url?: string | null
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

