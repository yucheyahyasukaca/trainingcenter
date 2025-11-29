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
    const targetId = '9225599f-cf5f-45c1-b75e-8f01e133d5a3';
    console.log(`Checking specific participant ID: ${targetId}`);

    // Check participants table
    const { data: pData, error: pError } = await supabase
        .from('participants')
        .select('id, name')
        .eq('id', targetId)
        .single();

    if (pData) {
        console.log(`  -> Found in 'participants': ${pData.name}`);
    } else {
        console.log(`  -> NOT found in 'participants'`);
        if (pError) console.error(pError);
    }

    // Check user_profiles table
    const { data: uData, error: uError } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('id', targetId)
        .single();

    if (uData) {
        console.log(`  -> Found in 'user_profiles': ${uData.full_name}`);
    } else {
        console.log(`  -> NOT found in 'user_profiles'`);
        if (uError) console.error(uError);
    }
}

debug().catch(console.error);
