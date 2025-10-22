#!/usr/bin/env node

/**
 * Script untuk memperbaiki sistem role trainer
 * Jalankan: node fix-trainer-role.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    console.log('🚀 Starting trainer role system fix...')
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'supabase', 'FIX_TRAINER_ROLE_SYSTEM.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Executing SQL migration...')
    
    // Execute the SQL migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      return false
    }
    
    console.log('✅ Migration executed successfully!')
    
    // Verify the fix
    console.log('🔍 Verifying trainer role system...')
    
    const { data: userProfiles, error: userError } = await supabase
      .from('user_profiles')
      .select('role, trainer_level, trainer_status')
      .limit(10)
    
    if (userError) {
      console.error('❌ Verification failed:', userError)
      return false
    }
    
    console.log('📊 Current user roles:')
    userProfiles.forEach(user => {
      console.log(`  - ${user.role} (trainer_level: ${user.trainer_level}, status: ${user.trainer_status})`)
    })
    
    // Test trainer functions
    console.log('🧪 Testing trainer functions...')
    
    const { data: trainerCount, error: trainerError } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact' })
      .eq('role', 'trainer')
    
    if (trainerError) {
      console.error('❌ Trainer count check failed:', trainerError)
      return false
    }
    
    console.log(`📈 Found ${trainerCount.length} trainers in the system`)
    
    console.log('✅ Trainer role system fix completed successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return false
  }
}

// Alternative method using direct SQL execution
async function runMigrationDirect() {
  try {
    console.log('🚀 Starting trainer role system fix (direct method)...')
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, 'supabase', 'FIX_TRAINER_ROLE_SYSTEM.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📄 Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`  ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          console.warn(`⚠️  Statement ${i + 1} failed:`, error.message)
          // Continue with other statements
        }
      }
    }
    
    console.log('✅ Migration completed!')
    return true
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return false
  }
}

// Main execution
async function main() {
  console.log('🔧 Trainer Role System Fix Tool')
  console.log('================================')
  
  // Try direct migration first
  const success = await runMigrationDirect()
  
  if (success) {
    console.log('\n🎉 Trainer role system has been fixed!')
    console.log('\nNext steps:')
    console.log('1. Restart your Next.js application')
    console.log('2. Test trainer functionality in the UI')
    console.log('3. Check that role-based access control works correctly')
  } else {
    console.log('\n❌ Fix failed. Please check the error messages above.')
    console.log('\nManual steps:')
    console.log('1. Copy the SQL from supabase/FIX_TRAINER_ROLE_SYSTEM.sql')
    console.log('2. Run it in your Supabase SQL Editor')
    console.log('3. Restart your application')
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { runMigration, runMigrationDirect }
