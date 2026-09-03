import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pkkrxxjinpxctkoxltuy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBra3J4eGppbnB4Y3Rrb3hsdHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MTUxNjMsImV4cCI6MjEwMzM5MTE2M30.eZ2Oj7ym61xITHJZANeCSRPZwv12v39blnfayNqQ5uM';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectLatestSession() {
    const { data: session } = await supabase
        .from('assessment_sessions')
        .select('*')
        .order('session_date', { ascending: false })
        .limit(1)
        .single();

    const { data: moduleResult } = await supabase
        .from('module_results')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

    console.log('=== LATEST MODULE RESULT (Reaction Test) ===');
    console.log('Module:', moduleResult?.module_type);
    console.log('Score:', moduleResult?.score);
    console.log('Timestamp:', moduleResult?.timestamp);
    console.log('Raw Telemetry:', JSON.stringify(moduleResult?.raw_metrics, null, 2));

    console.log('\n=== LATEST ASSESSMENT SESSION (75 Biomarkers Record) ===');
    console.log('Predicted Diagnosis:', session?.predicted_diagnosis);
    console.log('Estimated MoCA:', session?.estimated_moca);
    console.log('Alert Tier:', session?.clinical_alert_tier);
    console.log('Reaction Latency (ms):', session?.reaction_mean_latency_ms);
    console.log('Reaction Median (ms):', session?.reaction_median_latency_ms);
    console.log('Reaction StdDev (ms):', session?.reaction_latency_std_dev);
    console.log('Top Recommendations Count:', session?.top_recommendations?.length);
    if (session?.top_recommendations?.length > 0) {
        console.log('Top 3 Recommendations:');
        session.top_recommendations.slice(0, 3).forEach((r, i) => {
            console.log(`  ${i + 1}. [${r.category}] ${r.title}: ${r.actionProtocol}`);
        });
    }
}

inspectLatestSession();
