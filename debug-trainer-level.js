// ========================================
// DEBUG TRAINER LEVEL
// GARUDA-21 Training Center
// ========================================
// Tujuan: Debug trainer level di frontend
// ========================================

import { supabase } from './lib/supabase'

async function debugTrainerLevel() {
  console.log('🔍 Debugging Trainer Level...')
  
  try {
    // 1. Cek current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    
    console.log('👤 Current user:', user?.email)
    
    // 2. Cek user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user?.id)
      .single()
    
    if (profileError) throw profileError
    
    console.log('📋 User profile:', {
      email: profile?.email,
      full_name: profile?.full_name,
      role: profile?.role,
      trainer_level: profile?.trainer_level,
      trainer_status: profile?.trainer_status,
      trainer_specializations: profile?.trainer_specializations,
      trainer_experience_years: profile?.trainer_experience_years
    })
    
    // 3. Cek programs dengan min_trainer_level
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select('id, title, category, min_trainer_level, status')
      .limit(5)
    
    if (programsError) throw programsError
    
    console.log('📚 Programs with min_trainer_level:', programs)
    
    // 4. Cek trainers table
    const { data: trainers, error: trainersError } = await supabase
      .from('trainers')
      .select('*')
      .limit(5)
    
    if (trainersError) throw trainersError
    
    console.log('👨‍🏫 Trainers:', trainers)
    
    // 5. Test trainer level function
    if (profile?.role === 'trainer' && programs?.length > 0) {
      const { data: canCreate, error: canCreateError } = await supabase
        .rpc('can_trainer_create_class', {
          p_trainer_id: profile.id,
          p_program_id: programs[0].id
        })
      
      if (canCreateError) {
        console.log('⚠️ can_trainer_create_class function not available:', canCreateError.message)
      } else {
        console.log('✅ Can create class for first program:', canCreate)
      }
    }
    
    // 6. Summary
    console.log('📊 Summary:')
    console.log('- User role:', profile?.role)
    console.log('- Trainer level:', profile?.trainer_level || 'Not set')
    console.log('- Trainer status:', profile?.trainer_status || 'Not set')
    console.log('- Programs count:', programs?.length || 0)
    console.log('- Trainers count:', trainers?.length || 0)
    
    if (profile?.role === 'trainer') {
      console.log('🎯 Trainer dashboard should show:', {
        level: profile?.trainer_level === 'master_trainer' ? 'Master Trainer' :
               profile?.trainer_level === 'trainer_l2' ? 'Trainer L2' :
               profile?.trainer_level === 'trainer_l1' ? 'Trainer L1' : 'User',
        status: profile?.trainer_status
      })
    }
    
  } catch (error) {
    console.error('❌ Error debugging trainer level:', error)
  }
}

// Export untuk digunakan di browser console
if (typeof window !== 'undefined') {
  window.debugTrainerLevel = debugTrainerLevel
}

export default debugTrainerLevel
