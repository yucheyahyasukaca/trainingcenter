
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvValue = (key) => {
    const match = envContent.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvValue('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = getEnvValue('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTrainer() {
    const userId = 'd0954ef1-30c7-4360-be95-7207988c4b5a';
    console.log(`Checking trainer for user_id: ${userId}`);

    const { data, error } = await supabase
        .from('trainers')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Trainer data:', data);
    }
}

checkTrainer();
