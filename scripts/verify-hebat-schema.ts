
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local')
let envContent = ''
try {
    envContent = fs.readFileSync(envPath, 'utf-8')
} catch (e) {
    console.error('Could not read .env.local')
    process.exit(1)
}

const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
        const key = match[1].trim()
        const value = match[2].trim().replace(/^["']|["']$/g, '') // Remove quotes
        env[key] = value
    }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

if (env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('🔑 Using Service Role Key (Bypassing RLS)')
} else {
    console.log('⚠️ Using Anon Key (Subject to RLS)')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySchema() {
    console.log('Verifying hebat_modules schema...')

    try {
        // Try to select the new columns
        const { data, error } = await supabase
            .from('hebat_modules')
            .select('id, title, parent_id, material_type, order_index, is_published')
            .order('created_at', { ascending: false })


        if (error) {
            console.error('❌ Error selecting columns:', error.message)
            console.error('This suggests the migration 20251201_hebat_modules_update.sql might not have been applied.')
        } else {
            console.log('✅ Columns exist! Sample data:', data)
        }

    } catch (err) {
        console.error('Unexpected error:', err)
    }
}

verifySchema()
