
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error('Could not read .env.local');
    process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
        env[key] = value;
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRelationship() {
    console.log('Testing relationship...');

    // Test 1: Simple select
    const { data: simple, error: simpleError } = await supabase
        .from('enrollments')
        .select('id, participant_id')
        .limit(1);

    if (simpleError) {
        console.error('Simple select failed:', simpleError);
    } else {
        console.log('Simple select success. Found:', simple?.length);
    }

    // Test 2: Relationship with participants (no alias)
    console.log('\nTesting join with participants (no alias)...');
    const { data: join, error: joinError } = await supabase
        .from('enrollments')
        .select(`
      id,
      participants (
        id,
        email
      )
    `)
        .limit(1);

    if (joinError) {
        console.error('Join failed:', joinError);
    } else {
        console.log('Join success!');
    }

    // Test 3: Relationship with participants (with alias)
    console.log('\nTesting join with participants (with alias)...');
    const { data: joinAlias, error: joinAliasError } = await supabase
        .from('enrollments')
        .select(`
      id,
      participant:participants (
        id,
        email
      )
    `)
        .limit(1);

    if (joinAliasError) {
        console.error('Join with alias failed:', joinAliasError);
    } else {
        console.log('Join with alias success!');
    }
}

testRelationship();
