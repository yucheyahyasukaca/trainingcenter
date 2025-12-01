
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables from .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'))

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251201_fix_hebat_rls_v2.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log('Applying migration...')

    // Split by semicolon to run statements individually if needed, but Postgres can handle blocks.
    // Supabase JS client doesn't support running raw SQL directly via public API usually, 
    // but we can try via rpc if there is a function, or just use the fact that we have service role.
    // Actually, supabase-js doesn't have a `query` method.
    // We usually need a postgres client for this.

    // Since I cannot easily run SQL without a postgres client or an RPC function,
    // I will just print the instructions for the user.
    console.log('Cannot run raw SQL via supabase-js client directly without an RPC function.')
    console.log('Please run the following SQL in your Supabase SQL Editor:')
    console.log(sql)
}

applyMigration()
