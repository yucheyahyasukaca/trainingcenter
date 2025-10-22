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
          duration_days: number | null
          max_participants: number | null
          price: number
          status: 'draft' | 'published' | 'archived'
          trainer_id: string | null
          created_by: string | null
          requirements: string | null
          learning_objectives: string[] | null
          prerequisites: string[] | null
          program_type: 'tot' | 'regular'
          is_free: boolean
          registration_type: 'lifetime' | 'limited'
          registration_start_date: string | null
          registration_end_date: string | null
          auto_approved: boolean
          min_trainer_level: 'trainer_l1' | 'trainer_l2' | 'master_trainer'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          title: string
          description: string
          category: string
          duration_days?: number | null
          max_participants?: number | null
          price: number
          status?: 'draft' | 'published' | 'archived'
          trainer_id?: string | null
          created_by?: string | null
          requirements?: string | null
          learning_objectives?: string[] | null
          prerequisites?: string[] | null
          program_type?: 'tot' | 'regular'
          is_free?: boolean
          registration_type?: 'lifetime' | 'limited'
          registration_start_date?: string | null
          registration_end_date?: string | null
          auto_approved?: boolean
          min_trainer_level?: 'trainer_l1' | 'trainer_l2' | 'master_trainer'
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          title?: string
          description?: string
          category?: string
          duration_days?: number | null
          max_participants?: number | null
          price?: number
          status?: 'draft' | 'published' | 'archived'
          trainer_id?: string | null
          created_by?: string | null
          requirements?: string | null
          learning_objectives?: string[] | null
          prerequisites?: string[] | null
          program_type?: 'tot' | 'regular'
          is_free?: boolean
          registration_type?: 'lifetime' | 'limited'
          registration_start_date?: string | null
          registration_end_date?: string | null
          auto_approved?: boolean
          min_trainer_level?: 'trainer_l1' | 'trainer_l2' | 'master_trainer'
        }
      }
      program_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
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
      learning_contents: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          class_id: string
          created_by: string | null
          title: string
          description: string | null
          content_type: 'video' | 'text' | 'quiz' | 'document' | 'assignment'
          content_data: Json | null
          order_index: number
          is_free: boolean
          status: 'draft' | 'published' | 'archived'
          is_required: boolean
          estimated_duration: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          class_id: string
          created_by?: string | null
          title: string
          description?: string | null
          content_type: 'video' | 'text' | 'quiz' | 'document' | 'assignment'
          content_data?: Json | null
          order_index?: number
          is_free?: boolean
          status?: 'draft' | 'published' | 'archived'
          is_required?: boolean
          estimated_duration?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          class_id?: string
          created_by?: string | null
          title?: string
          description?: string | null
          content_type?: 'video' | 'text' | 'quiz' | 'document' | 'assignment'
          content_data?: Json | null
          order_index?: number
          is_free?: boolean
          status?: 'draft' | 'published' | 'archived'
          is_required?: boolean
          estimated_duration?: number | null
        }
      }
      learning_progress: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          content_id: string
          enrollment_id: string | null
          status: 'not_started' | 'in_progress' | 'completed'
          progress_percentage: number
          time_spent: number
          last_position: number
          completed_at: string | null
          attempts: number
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          content_id: string
          enrollment_id?: string | null
          status?: 'not_started' | 'in_progress' | 'completed'
          progress_percentage?: number
          time_spent?: number
          last_position?: number
          completed_at?: string | null
          attempts?: number
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          content_id?: string
          enrollment_id?: string | null
          status?: 'not_started' | 'in_progress' | 'completed'
          progress_percentage?: number
          time_spent?: number
          last_position?: number
          completed_at?: string | null
          attempts?: number
          notes?: string | null
        }
      }
      quiz_questions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          content_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'essay' | 'short_answer'
          order_index: number
          points: number
          explanation: string | null
          correct_answer: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          content_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'essay' | 'short_answer'
          order_index?: number
          points?: number
          explanation?: string | null
          correct_answer?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          content_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false' | 'essay' | 'short_answer'
          order_index?: number
          points?: number
          explanation?: string | null
          correct_answer?: string | null
        }
      }
      quiz_options: {
        Row: {
          id: string
          created_at: string
          question_id: string
          option_text: string
          is_correct: boolean
          order_index: number
        }
        Insert: {
          id?: string
          created_at?: string
          question_id: string
          option_text: string
          is_correct?: boolean
          order_index?: number
        }
        Update: {
          id?: string
          created_at?: string
          question_id?: string
          option_text?: string
          is_correct?: boolean
          order_index?: number
        }
      }
      quiz_submissions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          content_id: string
          question_id: string
          selected_option_id: string | null
          answer_text: string | null
          is_correct: boolean | null
          points_earned: number
          graded_by: string | null
          graded_at: string | null
          feedback: string | null
          attempt_number: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          content_id: string
          question_id: string
          selected_option_id?: string | null
          answer_text?: string | null
          is_correct?: boolean | null
          points_earned?: number
          graded_by?: string | null
          graded_at?: string | null
          feedback?: string | null
          attempt_number?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          content_id?: string
          question_id?: string
          selected_option_id?: string | null
          answer_text?: string | null
          is_correct?: boolean | null
          points_earned?: number
          graded_by?: string | null
          graded_at?: string | null
          feedback?: string | null
          attempt_number?: number
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

