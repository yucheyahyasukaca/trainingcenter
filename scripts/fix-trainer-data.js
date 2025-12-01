
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

async function fixTrainerData() {
    const userId = 'd0954ef1-30c7-4360-be95-7207988c4b5a';
    console.log(`Fixing trainer data for user_id: ${userId}`);

    // 1. Get user profile
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
    }

    if (!profile) {
        console.error('User profile not found!');
        return;
    }

    console.log('Found profile:', profile.full_name);

    // 2. Check if trainer exists (double check)
    const { data: trainer, error: trainerError } = await supabase
        .from('trainers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (trainer) {
        console.log('Trainer already exists:', trainer.id);
        return;
    }

    // 3. Insert trainer
    const { data: newTrainer, error: insertError } = await supabase
        .from('trainers')
        .insert({
            user_id: userId,
            name: profile.full_name,
            email: profile.email,
            phone: '-',
            specialization: 'General'
        })
        .select()
        .single();

    if (insertError) {
        console.error('Error creating trainer:', JSON.stringify(insertError, null, 2));
    } else {
        console.log('Successfully created trainer record:', newTrainer.id);
    }
}

fixTrainerData();
