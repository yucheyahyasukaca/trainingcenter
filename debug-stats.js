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

const PROGRAM_ID = '9712d177-5cf4-4ed2-8e66-f871affb0549';

async function debug() {
    console.log(`Debugging stats for program: ${PROGRAM_ID}`);

    // 1. Fetch enrollments
    const { data: enrollments, error: eError } = await supabase
        .from('enrollments')
        .select('id, participant_id, status')
        .eq('program_id', PROGRAM_ID);

    if (eError) {
        console.error('Error fetching enrollments:', eError);
        return;
    }

    console.log(`Found ${enrollments.length} enrollments.`);

    if (enrollments.length === 0) return;

    const participantIds = [...new Set(enrollments.map(e => e.participant_id).filter(Boolean))];
    console.log(`Unique Participant IDs: ${participantIds.length}`);

    // Helper to chunk array
    const chunkArray = (arr, size) => {
        return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
            arr.slice(i * size, i * size + size)
        );
    };

    // 2. Fetch participants with batching
    let participants = [];
    const participantIdChunks = chunkArray(participantIds, 50);

    for (const chunk of participantIdChunks) {
        const { data: chunkData, error: chunkError } = await supabase
            .from('participants')
            .select('id, user_id, name')
            .in('id', chunk);

        if (chunkError) {
            console.error('Error fetching participants chunk:', chunkError);
        } else if (chunkData) {
            participants = [...participants, ...chunkData];
        }
    }

    console.log(`Found ${participants.length} participants.`);

    const userIds = [...new Set(participants.map(p => p.user_id).filter(Boolean))];
    console.log(`Unique User IDs from participants: ${userIds.length}`);

    // 3. Fetch user_profiles with batching
    let profiles = [];
    const userIdChunks = chunkArray(userIds, 50);

    for (const chunk of userIdChunks) {
        const { data: chunkData, error: chunkError } = await supabase
            .from('user_profiles')
            .select('id, full_name, jenjang, provinsi, kabupaten')
            .in('id', chunk);

        if (chunkError) {
            console.error('Error fetching user_profiles chunk:', chunkError);
        } else if (chunkData) {
            profiles = [...profiles, ...chunkData];
        }
    }

    console.log(`Found ${profiles.length} user_profiles.`);

    // Analyze missing data
    let missingJenjang = 0;
    let missingProvinsi = 0;
    let missingKabupaten = 0;

    profiles.forEach(p => {
        if (!p.jenjang) missingJenjang++;
        if (!p.provinsi) missingProvinsi++;
        if (!p.kabupaten) missingKabupaten++;
    });

    console.log(`Stats Analysis:`);
    console.log(`- Profiles with missing Jenjang: ${missingJenjang}`);
    console.log(`- Profiles with missing Provinsi: ${missingProvinsi}`);
    console.log(`- Profiles with missing Kabupaten: ${missingKabupaten}`);

    // Sample check
    if (profiles.length > 0) {
        console.log('\nSample Profile:', profiles[0]);
    }
}

debug().catch(console.error);
