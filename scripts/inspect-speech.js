import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pkkrxxjinpxctkoxltuy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBra3J4eGppbnB4Y3Rrb3hsdHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MTUxNjMsImV4cCI6MjEwMzM5MTE2M30.eZ2Oj7ym61xITHJZANeCSRPZwv12v39blnfayNqQ5uM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectSpeechTest() {
    console.log('🔍 Checking latest Language & Speech test in Supabase...\n');

    // 1. Check module_results for language
    const { data: moduleResults } = await supabase
        .from('module_results')
        .select('*')
        .eq('module_type', 'language')
        .order('timestamp', { ascending: false })
        .limit(1);

    if (moduleResults && moduleResults.length > 0) {
        const lang = moduleResults[0];
        console.log('=== 🗣️ LATEST SPEECH & LANGUAGE TEST RESULT ===');
        console.log('Module:', lang.module_type);
        console.log('Score:', lang.score);
        console.log('Timestamp:', lang.timestamp);
        console.log('Duration (ms):', lang.duration_ms);
        console.log('\n--- Derived Speech Biomarkers ---');
        console.log(JSON.stringify(lang.derived_features, null, 2));
        console.log('\n--- Raw Speech Metrics ---');
        console.log(JSON.stringify(lang.raw_metrics, null, 2));
    } else {
        console.log('No language test found yet in module_results.');
    }

    // 2. Check latest assessment session
    const { data: session } = await supabase
        .from('assessment_sessions')
        .select('id, session_date, estimated_moca, predicted_diagnosis, clinical_alert_tier, battery_coverage, lang_wpm, lang_cognitive_speech_index, lang_fluency_index, lang_pause_count, lang_hesitation_index, lang_speech_stability')
        .order('session_date', { ascending: false })
        .limit(1)
        .single();

    if (session) {
        console.log('\n=== 📋 UPDATED MASTER ASSESSMENT SESSION ===');
        console.log('Estimated MoCA:', session.estimated_moca);
        console.log('Diagnosis:', session.predicted_diagnosis);
        console.log('Battery Coverage:', Math.round((session.battery_coverage || 0) * 100) + '%');
        console.log('Language WPM:', session.lang_wpm);
        console.log('Cognitive Speech Index (CSI):', session.lang_cognitive_speech_index);
        console.log('Fluency Index:', session.lang_fluency_index);
        console.log('Pause Count:', session.lang_pause_count);
        console.log('Hesitation Index:', session.lang_hesitation_index);
        console.log('Speech Stability:', session.lang_speech_stability);
    }
}

inspectSpeechTest();
