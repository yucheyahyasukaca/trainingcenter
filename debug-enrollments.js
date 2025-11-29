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
    console.log('Debugging enrollments...');

    // 1. Get recent enrollments
    const { data: enrollments, error: eError } = await supabase
        .from('enrollments')
        .select('id, participant_id, created_at')
        .limit(5);

    if (eError) {
        console.error('Error fetching enrollments:', eError);
        return;
    }

    console.log(`Found ${enrollments.length} enrollments`);
    if (enrollments.length === 0) return;

    const participantIds = enrollments.map(e => e.participant_id);
    console.log('Participant IDs:', participantIds);

    // 2. Check participants table
    const { data: participants, error: pError } = await supabase
        .from('participants')
        .select('id, name, email')
        .in('id', participantIds);

    if (pError) {
        console.error('Error fetching participants:', pError);
    } else {
        console.log(`Found ${participants.length} in 'participants' table`);
        participants.forEach(p => console.log(` - ${p.id}: ${p.name}`));
    }

    // 3. Check user_profiles table
    const { data: profiles, error: upError } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .in('id', participantIds);

    if (upError) {
        console.error('Error fetching user_profiles:', upError);
    } else {
        console.log(`Found ${profiles.length} in 'user_profiles' table`);
        profiles.forEach(p => console.log(` - ${p.id}: ${p.full_name}`));
    }
}

debug().catch(console.error);
