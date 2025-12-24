
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
            }
        });
    }
} catch (e) { console.error(e); }

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
    console.log('🔍 Verifying Migration...');

    // 1. Check Schema
    const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, name, auto_enroll') // Try selecting the new column
        .limit(1);

    if (classError) {
        console.error('❌ Error selecting auto_enroll:', classError.message);
    } else {
        console.log('✅ Column `auto_enroll` exists accessible.');
    }

    // 2. Check TOT Gemini Class
    const CLASS_ID = 'd97d8dd6-ced6-4c67-b076-216f2acf6094';
    const { data: totClass, error: totError } = await supabase
        .from('classes')
        .select('name, auto_enroll')
        .eq('id', CLASS_ID)
        .single();

    if (totError) {
        console.error('❌ Error fetching TOT Gemini class:', totError.message);
    } else {
        console.log(`\nClass: ${totClass.name}`);
        console.log(`Auto Enroll Status: ${totClass.auto_enroll}`);
        if (totClass.auto_enroll === true) {
            console.log('✅ TOT Gemini is set to Auto Enroll.');
        } else {
            console.error('❌ TOT Gemini is NOT set to Auto Enroll.');
        }
    }
}

main();
