import { supabase } from '@/lib/supabase'

export interface ProfileValidationResult {
  isComplete: boolean
  missingFields: string[]
}

/**
 * Validates if a user's profile is complete for program enrollment
 * @param userId - The user ID to validate
 * @returns Object containing validation status and missing fields
 */
export async function validateProfileCompleteness(userId: string): Promise<ProfileValidationResult> {
  try {
    // Read user profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name, email, phone, gender, address, provinsi')
      .eq('id', userId)
      .maybeSingle()

    // Read participant if exists
    const { data: participant } = await supabase
      .from('participants')
      .select('id, phone, address, gender, date_of_birth, education, education_status, employment_status, it_background, disability, program_source, provinsi')
      .eq('user_id', userId)
      .maybeSingle()

    // Check required fields
    const checks = {
      'Nama Lengkap': !!(userProfile as any)?.full_name,
      'Email': !!(userProfile as any)?.email,
      'Nomor Telepon': !!((userProfile as any)?.phone || (participant as any)?.phone),
      'Jenis Kelamin': !!((userProfile as any)?.gender || (participant as any)?.gender),
      'Alamat': !!((userProfile as any)?.address || (participant as any)?.address),
      'Provinsi': !!((userProfile as any)?.provinsi || (participant as any)?.provinsi),
      'Tanggal Lahir': !!(participant as any)?.date_of_birth,
      'Pendidikan': !!(participant as any)?.education,
      'Status Pendidikan': !!(participant as any)?.education_status,
      'Status Pekerjaan': !!(participant as any)?.employment_status,
      'Latar Belakang IT': !!(participant as any)?.it_background,
      'Status Disabilitas': !!(participant as any)?.disability,
      'Sumber Informasi Program': !!(participant as any)?.program_source
    }

    // Collect missing fields
    const missingFields = Object.entries(checks)
      .filter(([_, isValid]) => !isValid)
      .map(([field, _]) => field)

    const isComplete = missingFields.length === 0

    return {
      isComplete,
      missingFields
    }
  } catch (error) {
    console.error('Error validating profile completeness:', error)
    // In case of error, assume profile is incomplete
    return {
      isComplete: false,
      missingFields: ['Error validating profile']
    }
  }
}

