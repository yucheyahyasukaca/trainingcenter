
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local')
const envConfig = dotenv.parse(fs.readFileSync(envPath))

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTrainer() {
    const userId = 'd0954ef1-30c7-4360-be95-7207988c4b5a'
    console.log(`Checking trainer for user_id: ${userId}`)

    const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('user_id', userId)

    if (error) {
        console.error('Error fetching trainer:', error)
    } else {
        console.log('Trainer data:', data)
        if (data.length === 0) {
            console.log('No trainer record found for this user.')
        } else {
            console.log(`Found ${data.length} trainer record(s).`)
        }
    }
}

checkTrainer()
