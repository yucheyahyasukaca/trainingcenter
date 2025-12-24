
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

async function main() {
    console.log('🔍 Debugging Program Enrollments...');
    console.log(`Program ID: ${PROGRAM_ID}`);

    // 1. Total enrollments for this program (raw count)
    const { count, error } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('program_id', PROGRAM_ID);

    if (error) {
        console.error('Error counting enrollments:', error);
        return;
    }
    console.log(`\n🔹 Total Enrollments for Program (by program_id): ${count}`);

    // 2. Breakdown by class_id
    const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id')
        .eq('program_id', PROGRAM_ID);

    const byClass = {};
    enrollments.forEach(e => {
        const cid = e.class_id || 'null';
        byClass[cid] = (byClass[cid] || 0) + 1;
    });
    console.log('🔹 Breakdown by class_id:', byClass);
}

main().catch(console.error);
