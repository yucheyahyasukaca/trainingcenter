import { Database } from './database'

export type Trainer = Database['public']['Tables']['trainers']['Row']
export type TrainerInsert = Database['public']['Tables']['trainers']['Insert']
export type TrainerUpdate = Database['public']['Tables']['trainers']['Update']

export type Program = Database['public']['Tables']['programs']['Row']
export type ProgramInsert = Database['public']['Tables']['programs']['Insert']
export type ProgramUpdate = Database['public']['Tables']['programs']['Update']

export type ProgramCategory = Database['public']['Tables']['program_categories']['Row']
export type ProgramCategoryInsert = Database['public']['Tables']['program_categories']['Insert']
export type ProgramCategoryUpdate = Database['public']['Tables']['program_categories']['Update']

export type Participant = Database['public']['Tables']['participants']['Row']
export type ParticipantInsert = Database['public']['Tables']['participants']['Insert']
export type ParticipantUpdate = Database['public']['Tables']['participants']['Update']

export type Enrollment = Database['public']['Tables']['enrollments']['Row']
export type EnrollmentInsert = Database['public']['Tables']['enrollments']['Insert']
export type EnrollmentUpdate = Database['public']['Tables']['enrollments']['Update']

export interface ProgramWithTrainer extends Program {
  trainer?: Trainer | null
  classes?: ClassWithTrainers[]
  total_enrollments?: number
}

export interface EnrollmentWithDetails extends Enrollment {
  program?: Program
  participant?: Participant
  class?: Class
}

export type Class = Database['public']['Tables']['classes']['Row']
export type ClassInsert = Database['public']['Tables']['classes']['Insert']
export type ClassUpdate = Database['public']['Tables']['classes']['Update']

export type ClassTrainer = Database['public']['Tables']['class_trainers']['Row']
export type ClassTrainerInsert = Database['public']['Tables']['class_trainers']['Insert']
export type ClassTrainerUpdate = Database['public']['Tables']['class_trainers']['Update']

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']

export interface ClassWithTrainers extends Class {
  trainers?: (ClassTrainer & { trainer?: Trainer })[]
  program?: Program
  enrolled_participants?: number
}

export interface ProgramWithClasses extends Program {
  classes?: ClassWithTrainers[]
  trainer?: Trainer | null
}

export interface TrainerWithStats extends Trainer {
  total_classes?: number
  total_programs?: number
  total_enrollments?: number
  avg_hourly_rate?: number
}

export interface TrainerWithClasses extends Trainer {
  classes?: ClassWithTrainers[]
  programs?: Program[]
}

export interface Statistics {
  totalPrograms: number
  totalParticipants: number
  totalTrainers: number
  totalEnrollments: number
  totalClasses: number
  recentEnrollments: EnrollmentWithDetails[]
  programsByCategory: { category: string; count: number }[]
  enrollmentsByStatus: { status: string; count: number }[]
  monthlyEnrollments: { month: string; count: number }[]
  trainerPerformance: { trainer_id: string; trainer_name: string; total_classes: number; total_enrollments: number }[]
}

export interface TrainerAvailability {
  trainer_id: string
  date: string
  available_slots: string[]
  is_available: boolean
}

export interface ClassSchedule {
  class_id: string
  class_name: string
  program_title: string
  trainer_name: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  location: string
  room: string
  status: string
  enrolled_count: number
  max_participants: number
}

