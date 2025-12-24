
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                process.env[key] = value;
            }
        });
    }
} catch (e) {
    console.error('Error loading .env.local:', e);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
}

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey);

const PROGRAM_ID = '9712d177-5cf4-4ed2-8e66-f871affb0549';
const PARTICIPANT_ID = 'f9bfb247-e8df-470d-b7eb-24856494df2c'; // From error message

async function main() {
    console.log('🔍 Debugging Single Participant...');
    console.log(`Program ID: ${PROGRAM_ID}`);
    console.log(`Participant ID: ${PARTICIPANT_ID}`);

    // 1. Check existing enrollment for this participant and program
    const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('participant_id', PARTICIPANT_ID);

    if (error) {
        console.error('Error fetching enrollments:', error);
        return;
    }

    console.log(`\nFound ${enrollments.length} enrollments for this participant:`);
    enrollments.forEach(e => {
        console.log(`- ID: ${e.id}`);
        console.log(`  Program ID: ${e.program_id}`);
        console.log(`  Class ID: ${e.class_id}`);
        console.log(`  User ID: ${e.user_id}`);
        console.log(`  Status: ${e.status}`);
        console.log(`  Created At: ${e.created_at}`);
    });
}

main().catch(console.error);
