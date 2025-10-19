import { Database } from './database'

export type Trainer = Database['public']['Tables']['trainers']['Row']
export type TrainerInsert = Database['public']['Tables']['trainers']['Insert']
export type TrainerUpdate = Database['public']['Tables']['trainers']['Update']

export type Program = Database['public']['Tables']['programs']['Row']
export type ProgramInsert = Database['public']['Tables']['programs']['Insert']
export type ProgramUpdate = Database['public']['Tables']['programs']['Update']

export type Participant = Database['public']['Tables']['participants']['Row']
export type ParticipantInsert = Database['public']['Tables']['participants']['Insert']
export type ParticipantUpdate = Database['public']['Tables']['participants']['Update']

export type Enrollment = Database['public']['Tables']['enrollments']['Row']
export type EnrollmentInsert = Database['public']['Tables']['enrollments']['Insert']
export type EnrollmentUpdate = Database['public']['Tables']['enrollments']['Update']

export interface ProgramWithTrainer extends Program {
  trainer?: Trainer | null
}

export interface EnrollmentWithDetails extends Enrollment {
  program?: Program
  participant?: Participant
}

export interface Statistics {
  totalPrograms: number
  totalParticipants: number
  totalTrainers: number
  totalEnrollments: number
  recentEnrollments: EnrollmentWithDetails[]
  programsByCategory: { category: string; count: number }[]
  enrollmentsByStatus: { status: string; count: number }[]
  monthlyEnrollments: { month: string; count: number }[]
}

