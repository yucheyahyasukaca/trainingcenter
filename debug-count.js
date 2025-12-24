
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

async function main() {
    console.log('🔍 Debugging Participant Count (Broader Scope)...');

    // 1. Check Global Counts
    const { count: userCount, error: userError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

    if (userError) console.error('Error counting user_profiles:', userError);
    console.log(`\n🔹 Total User Profiles: ${userCount}`);

    const { count: partCount, error: partError } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true });

    if (partError) {
        // Table might not exist or permission error
        console.log('Error counting participants (may not exist):', partError.message);
    } else {
        console.log(`🔹 Total Participants Table: ${partCount}`);
    }

    // 2. Check Enrollment Count again for "Gemini"
    const { data: programs } = await supabase
        .from('programs')
        .select('id, title')
        .ilike('title', '%Gemini%');

    if (programs && programs.length > 0) {
        const prog = programs[0];
        console.log(`\nProgram: ${prog.title}`);
        const { data: classes } = await supabase.from('classes').select('id').eq('program_id', prog.id);
        if (classes && classes.length > 0) {
            const classIds = classes.map(c => c.id);
            const { count: enrollIds } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .in('class_id', classIds);
            console.log(`🔹 Enrollments for this program: ${enrollIds}`);
        }
    }

    // 3. Check for any other relevant tables or data
    // e.g. "registrations"?
}

main().catch(console.error);
