
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

const CLASS_ID = 'd97d8dd6-ced6-4c67-b076-216f2acf6094'; // TOT Gemini untuk Pendidik

async function main() {
    console.log('🚀 Starting Comprehensive Backfill...');
    console.log(`Target Class ID: ${CLASS_ID}`);

    // 1. Get Class Details to find Program ID
    const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('program_id')
        .eq('id', CLASS_ID)
        .single();

    if (classError || !classData) {
        console.error('❌ Error fetching class details:', classError);
        return;
    }

    const PROGRAM_ID = classData.program_id;
    console.log(`📋 Found Program ID: ${PROGRAM_ID}`);

    // 2. Fetch all enrollments for this program
    const { data: allEnrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('id, participant_id, user_id, class_id, status')
        .eq('program_id', PROGRAM_ID);

    if (enrollError) {
        console.error('❌ Error fetching enrollments:', enrollError);
        return;
    }

    const enrollmentMap = new Map(); // participant_id -> enrollment
    allEnrollments.forEach(e => enrollmentMap.set(e.participant_id, e));
    console.log(`📋 Found ${allEnrollments.length} existing enrollments for program.`);

    // 3. Get all candidates (users with role 'user') AND their participant_id
    const { data: users, error: userError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name');

    if (userError) {
        console.error('❌ Error fetching users:', userError);
        return;
    }

    // Need to fetch participants manually to map user -> participant
    const { data: participants, error: partError } = await supabase
        .from('participants')
        .select('id, user_id');

    if (partError) {
        console.error('❌ Error fetching participants:', partError);
        return;
    }
    const userToParticipantMap = new Map();
    participants.forEach(p => {
        if (p.user_id) userToParticipantMap.set(p.user_id, p.id);
    });

    const validUsers = users.filter(u => userToParticipantMap.has(u.id));
    console.log(`📋 Found ${validUsers.length} valid users (with participant records).`);

    // 4. Categorize Actions
    const toInsert = [];
    const toUpdate = []; // { id, updates }

    validUsers.forEach(u => {
        const participantId = userToParticipantMap.get(u.id);
        const enrollment = enrollmentMap.get(participantId);

        if (enrollment) {
            // Check if needs update
            const needsUpdate = !enrollment.class_id || !enrollment.user_id || enrollment.status !== 'approved';

            if (needsUpdate) {
                toUpdate.push({
                    id: enrollment.id,
                    updates: {
                        class_id: CLASS_ID,
                        user_id: u.id,
                        status: 'approved'
                    }
                });
            }
        } else {
            // Needs insert
            toInsert.push({
                class_id: CLASS_ID,
                program_id: PROGRAM_ID,
                participant_id: participantId,
                user_id: u.id,
                status: 'approved'
            });
        }
    });

    console.log(`🎯 Actions Plan:`);
    console.log(`   - To Insert: ${toInsert.length}`);
    console.log(`   - To Update: ${toUpdate.length}`);
    console.log(`   - Skipped (Already correct): ${validUsers.length - toInsert.length - toUpdate.length}`);

    // 5. Execute Updates
    if (toUpdate.length > 0) {
        console.log(`\n🔄 Executing Updates...`);
        let updateSuccess = 0;
        let updateFail = 0;

        // Update one by one or batch if possible (can't batch different updates easily)
        for (let i = 0; i < toUpdate.length; i++) {
            const item = toUpdate[i];
            const { error } = await supabase.from('enrollments').update(item.updates).eq('id', item.id);

            if (error) {
                console.error(`❌ Update failed for ${item.id}:`, error.message);
                updateFail++;
            } else {
                updateSuccess++;
            }
            if (i % 50 === 0) process.stdout.write('.');
        }
        console.log(`\n✅ Updates Done: ${updateSuccess} success, ${updateFail} failed`);
    }

    // 6. Execute Inserts
    if (toInsert.length > 0) {
        console.log(`\n➕ Executing Inserts...`);
        const batchSize = 100;
        let insertSuccess = 0;
        let insertFail = 0;

        for (let i = 0; i < toInsert.length; i += batchSize) {
            const batch = toInsert.slice(i, i + batchSize);
            const { error } = await supabase.from('enrollments').insert(batch);

            if (error) {
                console.error(`❌ Insert Batch failed:`, error.message);
                insertFail += batch.length;
            } else {
                insertSuccess += batch.length;
            }
            process.stdout.write('.');
        }
        console.log(`\n✅ Inserts Done: ${insertSuccess} success, ${insertFail} failed`);
    }

    console.log('\n========================================');
    console.log(`🎉 Backfill Complete`);
}

main().catch(console.error);
