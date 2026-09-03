import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pkkrxxjinpxctkoxltuy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBra3J4eGppbnB4Y3Rrb3hsdHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MTUxNjMsImV4cCI6MjEwMzM5MTE2M30.eZ2Oj7ym61xITHJZANeCSRPZwv12v39blnfayNqQ5uM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findRecentUserData() {
    console.log('🔍 Fetching all recent user activity from Supabase...\n');

    // 1. Users
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

    console.log('=== 👤 REGISTERED USERS ===');
    if (users && users.length > 0) {
        users.forEach((u, i) => {
            console.log(`[User ${i + 1}] Name: ${u.full_name || 'N/A'} | Email: ${u.email || 'N/A'} | UID: ${u.firebase_uid} | Age: ${u.age} | Updated: ${u.updated_at}`);
        });
    } else {
        console.log('No users found.');
    }

    // 2. Module Results
    const { data: moduleResults, error: mErr } = await supabase
        .from('module_results')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

    console.log('\n=== 🧪 RECENT MODULE RESULTS (All Tests Taken) ===');
    if (moduleResults && moduleResults.length > 0) {
        moduleResults.forEach((m, i) => {
            console.log(`\n[Test ${i + 1}] Module: ${m.module_type.toUpperCase()} | Score: ${m.score} | Time: ${m.timestamp}`);
            console.log('  Raw Metrics:', JSON.stringify(m.raw_metrics));
            console.log('  Derived Features:', JSON.stringify(m.derived_features));
        });
    } else {
        console.log('No module results found.');
    }

    // 3. Assessment Sessions
    const { data: sessions, error: sErr } = await supabase
        .from('assessment_sessions')
        .select('*')
        .order('session_date', { ascending: false })
        .limit(5);

    console.log('\n=== 📋 RECENT ASSESSMENT SESSIONS (75+ Biomarkers) ===');
    if (sessions && sessions.length > 0) {
        sessions.forEach((s, i) => {
            console.log(`\n[Session ${i + 1}] Date: ${s.session_date} | User UID: ${s.firebase_uid}`);
            console.log(`  Diagnosis: ${s.predicted_diagnosis} (Prob: Normal ${(s.p_normal * 100).toFixed(1)}%, MCI ${(s.p_mci * 100).toFixed(1)}%, Dem ${(s.p_dementia * 100).toFixed(1)}%)`);
            console.log(`  Estimated MoCA: ${s.estimated_moca} | Risk Score: ${s.impairment_risk_score} | Alert Tier: ${s.clinical_alert_tier}`);
            console.log(`  Battery Coverage: ${Math.round((s.battery_coverage || 0) * 100)}% | Trajectory: ${s.trajectory_tier}`);
            console.log(`  Domain Breakdown: Memory=${s.domain_memory}, Lang=${s.domain_language}, Speed=${s.domain_processing_speed}, Spatial=${s.domain_spatial_orientation}, Exec=${s.domain_executive}, Attn=${s.domain_attention}`);
            console.log(`  Core Biomarkers: RxMean=${s.reaction_mean_latency_ms}ms, LangWPM=${s.lang_wpm}, LangCSI=${s.lang_cognitive_speech_index}, VMRA_Acc=${s.vmra_recall_accuracy}, StoryAcc=${s.story_recall_accuracy}`);
            if (s.top_recommendations && s.top_recommendations.length > 0) {
                console.log(`  Top Recommendations: ${s.top_recommendations.length} items`);
                s.top_recommendations.slice(0, 2).forEach((r, idx) => {
                    console.log(`    ${idx + 1}. [${r.category}] ${r.title}`);
                });
            }
        });
    } else {
        console.log('No sessions found.');
    }
}

findRecentUserData();
