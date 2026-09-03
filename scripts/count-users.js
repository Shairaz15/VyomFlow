import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pkkrxxjinpxctkoxltuy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBra3J4eGppbnB4Y3Rrb3hsdHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MTUxNjMsImV4cCI6MjEwMzM5MTE2M30.eZ2Oj7ym61xITHJZANeCSRPZwv12v39blnfayNqQ5uM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserStats() {
    console.log('📊 Fetching current user and session metrics from Supabase...\n');

    try {
        // 1. Users Count
        const { data: users, count: userCount, error: userError } = await supabase
            .from('users')
            .select('*', { count: 'exact' });

        if (userError) {
            console.error('Error querying users:', userError.message);
        } else {
            console.log(`👤 Total Registered Users: ${users ? users.length : 0}`);
            if (users && users.length > 0) {
                console.log('\nUser Records:');
                users.forEach((u, i) => {
                    console.log(`  ${i + 1}. UID: ${u.firebase_uid} | Email: ${u.email || 'N/A'} | Name: ${u.full_name || 'N/A'} | Age: ${u.age || 'N/A'} | Created: ${u.created_at}`);
                });
            }
        }

        // 2. Assessment Sessions Count
        const { data: sessions, error: sessionError } = await supabase
            .from('assessment_sessions')
            .select('id, firebase_uid, session_date, estimated_moca, predicted_diagnosis, clinical_alert_tier');

        if (sessionError) {
            console.error('Error querying sessions:', sessionError.message);
        } else {
            console.log(`\n📋 Total Assessment Sessions Logged: ${sessions ? sessions.length : 0}`);
            if (sessions && sessions.length > 0) {
                console.log('\nRecent Sessions:');
                sessions.slice(0, 5).forEach((s, i) => {
                    console.log(`  ${i + 1}. User: ${s.firebase_uid.slice(0, 8)}... | Date: ${s.session_date} | MoCA: ${s.estimated_moca} | Diagnosis: ${s.predicted_diagnosis} | Alert: ${s.clinical_alert_tier}`);
                });
            }
        }

        // 3. Module Results Count
        const { data: modules, error: modError } = await supabase
            .from('module_results')
            .select('id, module_type');

        if (modError) {
            console.error('Error querying module results:', modError.message);
        } else {
            console.log(`\n🧪 Total Individual Module Tests Saved: ${modules ? modules.length : 0}`);
        }

    } catch (e) {
        console.error('Failed to fetch stats:', e.message);
    }
}

checkUserStats();
