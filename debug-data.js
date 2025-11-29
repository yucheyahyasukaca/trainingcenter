const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error('Could not read .env.local', e);
    process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1]] = match[2].trim();
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debug() {
    console.log('Debugging enrollments data integrity...');

    // 1. Get recent enrollments
    const { data: enrollments, error: eError } = await supabase
        .from('enrollments')
        .select('id, participant_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

    if (eError) {
        console.error('Error fetching enrollments:', eError);
        return;
    }

    console.log(`Checking ${enrollments.length} most recent enrollments:`);

    for (const enrollment of enrollments) {
        const pid = enrollment.participant_id;
        console.log(`\nEnrollment ${enrollment.id}:`);
        console.log(`  Participant ID: ${pid}`);

        if (!pid) {
            console.log('  -> ID IS NULL');
            continue;
        }

        // Check participants table
        const { data: pData, error: pError } = await supabase
            .from('participants')
            .select('id, name')
            .eq('id', pid)
            .single();

        if (pData) {
            console.log(`  -> Found in 'participants': ${pData.name}`);
        } else {
            console.log(`  -> NOT found in 'participants'`);
        }

        // Check user_profiles table
        const { data: uData, error: uError } = await supabase
            .from('user_profiles')
            .select('id, full_name')
            .eq('id', pid)
            .single();

        if (uData) {
            console.log(`  -> Found in 'user_profiles': ${uData.full_name}`);
        } else {
            console.log(`  -> NOT found in 'user_profiles'`);
        }
    }
}

debug().catch(console.error);
