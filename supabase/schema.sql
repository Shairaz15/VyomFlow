-- ============================================================================
-- VYOMFLOW AI DIGITAL BIOMARKER & COGNITIVE HEALTH DATABASE SCHEMA (V2.1 PRO)
-- PostgreSQL / Supabase
-- ============================================================================

-- Enable UUID & PG_TRGM extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE (Linked to Firebase Auth UID)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    age DOUBLE PRECISION,
    gender VARCHAR(32),
    education_years DOUBLE PRECISION,
    preferred_language VARCHAR(32) DEFAULT 'en-IN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Auto-Updating updated_at Trigger
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at 
BEFORE UPDATE ON users FOR EACH ROW 
EXECUTE FUNCTION update_timestamp_column();

-- ----------------------------------------------------------------------------
-- 2. ASSESSMENT SESSIONS TABLE (Master 75+ Biomarkers Record)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assessment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    firebase_uid VARCHAR(128) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    session_number INT DEFAULT 1,
    is_mock BOOLEAN NOT NULL DEFAULT false,
    
    -- Precise Timestamps & Duration Tracking
    session_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    session_start_time TIMESTAMPTZ,
    session_end_time TIMESTAMPTZ,
    duration_seconds DOUBLE PRECISION,
    timezone VARCHAR(64) DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- AI Diagnostic & Severity Predictions
    estimated_moca DOUBLE PRECISION,
    moca_ci_95 DOUBLE PRECISION DEFAULT 0.73,
    predicted_diagnosis VARCHAR(32), -- 'Normal' | 'MCI' | 'Dementia'
    p_normal DOUBLE PRECISION,
    p_mci DOUBLE PRECISION,
    p_dementia DOUBLE PRECISION,
    impairment_risk_score DOUBLE PRECISION,
    clinical_alert_tier VARCHAR(64), -- 'STABLE' | 'CONTINUE_MONITORING' | 'RECOMMEND_EARLIER_REASSESSMENT' | 'RECOMMEND_CLINICAL_EVALUATION'
    model_confidence DOUBLE PRECISION,
    battery_coverage DOUBLE PRECISION,
    completed_modules TEXT[],

    -- 6 Cognitive Domain Breakdown (0-100)
    domain_memory DOUBLE PRECISION,
    domain_language DOUBLE PRECISION,
    domain_executive DOUBLE PRECISION,
    domain_processing_speed DOUBLE PRECISION,
    domain_spatial_orientation DOUBLE PRECISION,
    domain_attention DOUBLE PRECISION,

    -- Longitudinal Statistical Drift Metrics
    trajectory_tier VARCHAR(32), -- 'Stable' | 'Possible Decline' | 'Likely Decline' | 'Rapid Decline' | 'Improving'
    rci DOUBLE PRECISION,
    theil_sen_slope DOUBLE PRECISION,
    z_drift DOUBLE PRECISION,
    cv_percent DOUBLE PRECISION,

    -- Top 10 Personalized Clinical & Lifestyle Recommendations
    top_recommendations JSONB DEFAULT '[]'::jsonb,

    -- Local Biomarker Attributions (SHAP)
    top_attributions JSONB DEFAULT '[]'::jsonb,

    -- ------------------------------------------------------------------------
    -- 75+ INDIVIDUAL RELATIONAL BIOMARKERS
    -- ------------------------------------------------------------------------
    
    -- Demographics Covariates
    covariate_age DOUBLE PRECISION,
    covariate_gender DOUBLE PRECISION,
    covariate_education_years DOUBLE PRECISION,

    -- 1. Visual Memory (VMRA) Biomarkers (16)
    vmra_recall_accuracy DOUBLE PRECISION,
    vmra_false_positive_rate DOUBLE PRECISION,
    vmra_precision DOUBLE PRECISION,
    vmra_f1_score DOUBLE PRECISION,
    vmra_net_recall_score DOUBLE PRECISION,
    vmra_mean_selection_latency_ms DOUBLE PRECISION,
    vmra_first_tap_latency_ms DOUBLE PRECISION,
    vmra_mean_inter_tap_interval_ms DOUBLE PRECISION,
    vmra_latency_variance DOUBLE PRECISION,
    vmra_primacy_bias DOUBLE PRECISION,
    vmra_recency_bias DOUBLE PRECISION,
    vmra_mid_list_deficit DOUBLE PRECISION,
    vmra_intrusion_errors DOUBLE PRECISION,
    vmra_grid_coverage DOUBLE PRECISION,
    vmra_delayed_recall_accuracy DOUBLE PRECISION,
    vmra_forgetting_curve_slope DOUBLE PRECISION,

    -- 2. Story Narration Recall Biomarkers (13)
    story_recall_accuracy DOUBLE PRECISION,
    story_info_units_recalled DOUBLE PRECISION,
    story_omission_count DOUBLE PRECISION,
    story_false_recall_count DOUBLE PRECISION,
    story_mcq_accuracy DOUBLE PRECISION,
    story_comprehension_avg_response_time_ms DOUBLE PRECISION,
    story_sequence_score DOUBLE PRECISION,
    story_narrative_completeness DOUBLE PRECISION,
    story_similarity_score DOUBLE PRECISION,
    story_speech_rate_wpm DOUBLE PRECISION,
    story_lexical_diversity DOUBLE PRECISION,
    story_hesitation_rate DOUBLE PRECISION,
    story_pause_frequency DOUBLE PRECISION,

    -- 3. Language & Speech Fluency Biomarkers (16)
    lang_wpm DOUBLE PRECISION,
    lang_articulation_rate DOUBLE PRECISION,
    lang_phonation_ratio DOUBLE PRECISION,
    lang_pause_count DOUBLE PRECISION,
    lang_pause_duration_avg_ms DOUBLE PRECISION,
    lang_filler_word_count DOUBLE PRECISION,
    lang_repetitions DOUBLE PRECISION,
    lang_lexical_diversity DOUBLE PRECISION,
    lang_root_ttr DOUBLE PRECISION,
    lang_hesitation_index DOUBLE PRECISION,
    lang_fluency_index DOUBLE PRECISION,
    lang_speech_stability DOUBLE PRECISION,
    lang_semantic_coherence DOUBLE PRECISION,
    lang_syntactic_complexity DOUBLE PRECISION,
    lang_idea_density DOUBLE PRECISION,
    lang_cognitive_speech_index DOUBLE PRECISION,

    -- 4. Pattern Working Memory Biomarkers (9)
    pattern_accuracy DOUBLE PRECISION,
    pattern_max_level_reached DOUBLE PRECISION,
    pattern_learning_rate DOUBLE PRECISION,
    pattern_error_growth_rate DOUBLE PRECISION,
    pattern_memory_load_tolerance DOUBLE PRECISION,
    pattern_pattern_stability_index DOUBLE PRECISION,
    pattern_average_response_latency_ms DOUBLE PRECISION,
    pattern_digit_span_forward DOUBLE PRECISION,
    pattern_digit_span_backward DOUBLE PRECISION,

    -- 5. Reaction Time & SAVT Attention Biomarkers (9)
    reaction_mean_latency_ms DOUBLE PRECISION,
    reaction_median_latency_ms DOUBLE PRECISION,
    reaction_latency_std_dev DOUBLE PRECISION,
    reaction_fastest_response_ms DOUBLE PRECISION,
    reaction_slowest_response_ms DOUBLE PRECISION,
    reaction_lapses_count DOUBLE PRECISION,
    reaction_premature_responses_count DOUBLE PRECISION,
    reaction_vigilance_decrement DOUBLE PRECISION,
    reaction_wais_speed_score DOUBLE PRECISION,

    -- 6. Video Navigation & Spatial Memory Biomarkers (9)
    nav_navigation_accuracy DOUBLE PRECISION,
    nav_landmark_recognition_accuracy DOUBLE PRECISION,
    nav_spatial_memory_index DOUBLE PRECISION,
    nav_wayfinding_efficiency DOUBLE PRECISION,
    nav_heading_error_degrees DOUBLE PRECISION,
    nav_stops_and_pauses_count DOUBLE PRECISION,
    nav_backtracking_count DOUBLE PRECISION,
    nav_time_to_complete_seconds DOUBLE PRECISION,
    nav_spatial_disorientation_score DOUBLE PRECISION,

    -- 7. Cross-Domain Interaction Biomarkers (5)
    inter_memory_speed_decay DOUBLE PRECISION,
    inter_intrusion_disorientation DOUBLE PRECISION,
    inter_speech_memory_synergy DOUBLE PRECISION,
    inter_attention_span_load DOUBLE PRECISION,
    inter_motor_cognitive_divergence DOUBLE PRECISION
);

-- Ensure is_mock column exists on existing table instances
ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS is_mock BOOLEAN NOT NULL DEFAULT false;

-- ----------------------------------------------------------------------------
-- PERFORMANCE INDEXES (High-Speed Covering & GIN Indexes)
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_sessions_patient_dashboard 
ON assessment_sessions (firebase_uid, is_mock, session_date DESC) 
INCLUDE (
    estimated_moca, 
    predicted_diagnosis, 
    impairment_risk_score, 
    clinical_alert_tier,
    domain_memory, 
    domain_language, 
    domain_executive, 
    domain_processing_speed, 
    domain_spatial_orientation, 
    domain_attention
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON assessment_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_firebase_uid ON assessment_sessions(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_sessions_is_mock ON assessment_sessions(is_mock);
CREATE INDEX IF NOT EXISTS idx_sessions_session_date ON assessment_sessions(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_diagnosis ON assessment_sessions(predicted_diagnosis);

-- JSONB GIN Indexes for Deep Analytics & Fast Filters
CREATE INDEX IF NOT EXISTS idx_sessions_recommendations_gin ON assessment_sessions USING GIN (top_recommendations);
CREATE INDEX IF NOT EXISTS idx_sessions_attributions_gin ON assessment_sessions USING GIN (top_attributions);

-- ----------------------------------------------------------------------------
-- 3. MODULE RESULTS TABLE (Detailed Sub-Task Telemetry & Raw Trial Logs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS module_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    firebase_uid VARCHAR(128) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    module_type VARCHAR(64) NOT NULL, -- 'vmra' | 'story' | 'language' | 'pattern' | 'reaction' | 'navigation' | 'savt'
    score DOUBLE PRECISION,
    is_mock BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamp & Duration
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration_ms INT,

    -- Detailed JSONB Payloads
    raw_metrics JSONB DEFAULT '{}'::jsonb,
    derived_features JSONB DEFAULT '{}'::jsonb,
    biomarkers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE module_results ADD COLUMN IF NOT EXISTS is_mock BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_module_results_user_id ON module_results(user_id);
CREATE INDEX IF NOT EXISTS idx_module_results_firebase_uid ON module_results(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_module_results_is_mock ON module_results(is_mock);
CREATE INDEX IF NOT EXISTS idx_module_results_session_id ON module_results(session_id);
CREATE INDEX IF NOT EXISTS idx_module_results_module_type ON module_results(module_type);
CREATE INDEX IF NOT EXISTS idx_module_results_timestamp ON module_results(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_module_results_raw_metrics_gin ON module_results USING GIN (raw_metrics);

-- ----------------------------------------------------------------------------
-- 4. ATOMIC RPC STORED PROCEDURE FOR SINGLE-TRIP ASSESSMENT SAVES
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_complete_assessment_bundle(bundle JSONB)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_user_id UUID;
    v_session_id VARCHAR(64);
    v_firebase_uid VARCHAR(128);
    v_is_mock BOOLEAN;
BEGIN
    v_firebase_uid := bundle->>'firebase_uid';
    v_session_id := bundle->>'session_id';
    v_is_mock := COALESCE((bundle->>'is_mock')::BOOLEAN, false);

    IF v_firebase_uid IS NULL THEN
        RAISE EXCEPTION 'firebase_uid is required in assessment bundle';
    END IF;

    -- 1. Atomic Upsert User Profile
    INSERT INTO users (
        firebase_uid, 
        email, 
        full_name, 
        age, 
        gender, 
        education_years,
        updated_at
    )
    VALUES (
        v_firebase_uid,
        bundle->>'email',
        COALESCE(bundle->>'full_name', 'VyomFlow User'),
        (bundle->>'age')::DOUBLE PRECISION,
        bundle->>'gender',
        (bundle->>'education_years')::DOUBLE PRECISION,
        NOW()
    )
    ON CONFLICT (firebase_uid) DO UPDATE SET
        age = COALESCE(EXCLUDED.age, users.age),
        gender = COALESCE(EXCLUDED.gender, users.gender),
        education_years = COALESCE(EXCLUDED.education_years, users.education_years),
        updated_at = NOW()
    RETURNING id INTO v_user_id;

    -- 2. Insert Master Assessment Session (75 Biomarkers Record)
    INSERT INTO assessment_sessions (
        user_id,
        firebase_uid,
        session_id,
        session_number,
        is_mock,
        session_date,
        session_start_time,
        session_end_time,
        duration_seconds,
        timezone,
        estimated_moca,
        moca_ci_95,
        predicted_diagnosis,
        p_normal,
        p_mci,
        p_dementia,
        impairment_risk_score,
        clinical_alert_tier,
        model_confidence,
        battery_coverage,
        domain_memory,
        domain_language,
        domain_executive,
        domain_processing_speed,
        domain_spatial_orientation,
        domain_attention,
        trajectory_tier,
        rci,
        theil_sen_slope,
        z_drift,
        cv_percent,
        top_recommendations,
        top_attributions,
        covariate_age,
        covariate_gender,
        covariate_education_years,
        vmra_recall_accuracy,
        vmra_delayed_recall_accuracy,
        story_recall_accuracy,
        story_speech_rate_wpm,
        lang_cognitive_speech_index,
        lang_wpm,
        pattern_accuracy,
        reaction_mean_latency_ms,
        nav_navigation_accuracy
    )
    VALUES (
        v_user_id,
        v_firebase_uid,
        v_session_id,
        COALESCE((bundle->>'session_number')::INT, 1),
        v_is_mock,
        COALESCE((bundle->>'session_date')::TIMESTAMPTZ, NOW()),
        (bundle->>'session_start_time')::TIMESTAMPTZ,
        (bundle->>'session_end_time')::TIMESTAMPTZ,
        (bundle->>'duration_seconds')::DOUBLE PRECISION,
        COALESCE(bundle->>'timezone', 'UTC'),
        (bundle->>'estimated_moca')::DOUBLE PRECISION,
        COALESCE((bundle->>'moca_ci_95')::DOUBLE PRECISION, 0.73),
        bundle->>'predicted_diagnosis',
        (bundle->>'p_normal')::DOUBLE PRECISION,
        (bundle->>'p_mci')::DOUBLE PRECISION,
        (bundle->>'p_dementia')::DOUBLE PRECISION,
        (bundle->>'impairment_risk_score')::DOUBLE PRECISION,
        bundle->>'clinical_alert_tier',
        (bundle->>'model_confidence')::DOUBLE PRECISION,
        (bundle->>'battery_coverage')::DOUBLE PRECISION,
        (bundle->>'domain_memory')::DOUBLE PRECISION,
        (bundle->>'domain_language')::DOUBLE PRECISION,
        (bundle->>'domain_executive')::DOUBLE PRECISION,
        (bundle->>'domain_processing_speed')::DOUBLE PRECISION,
        (bundle->>'domain_spatial_orientation')::DOUBLE PRECISION,
        (bundle->>'domain_attention')::DOUBLE PRECISION,
        bundle->>'trajectory_tier',
        (bundle->>'rci')::DOUBLE PRECISION,
        (bundle->>'theil_sen_slope')::DOUBLE PRECISION,
        (bundle->>'z_drift')::DOUBLE PRECISION,
        (bundle->>'cv_percent')::DOUBLE PRECISION,
        COALESCE(bundle->'top_recommendations', '[]'::jsonb),
        COALESCE(bundle->'top_attributions', '[]'::jsonb),
        (bundle->>'covariate_age')::DOUBLE PRECISION,
        (bundle->>'covariate_gender')::DOUBLE PRECISION,
        (bundle->>'covariate_education_years')::DOUBLE PRECISION,
        (bundle->>'vmra_recall_accuracy')::DOUBLE PRECISION,
        (bundle->>'vmra_delayed_recall_accuracy')::DOUBLE PRECISION,
        (bundle->>'story_recall_accuracy')::DOUBLE PRECISION,
        (bundle->>'story_speech_rate_wpm')::DOUBLE PRECISION,
        (bundle->>'lang_cognitive_speech_index')::DOUBLE PRECISION,
        (bundle->>'lang_wpm')::DOUBLE PRECISION,
        (bundle->>'pattern_accuracy')::DOUBLE PRECISION,
        (bundle->>'reaction_mean_latency_ms')::DOUBLE PRECISION,
        (bundle->>'nav_navigation_accuracy')::DOUBLE PRECISION
    );

    RETURN jsonb_build_object('success', true, 'session_id', v_session_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. ANALYTICAL SQL VIEWS
-- ----------------------------------------------------------------------------

DROP VIEW IF EXISTS v_patient_longitudinal_biomarkers CASCADE;
DROP VIEW IF EXISTS v_clinician_overview CASCADE;

CREATE OR REPLACE VIEW v_patient_longitudinal_biomarkers AS
SELECT 
    s.id AS session_db_id,
    s.firebase_uid,
    s.is_mock,
    u.email,
    u.full_name,
    u.age,
    u.gender,
    u.education_years,
    s.session_id,
    s.session_number,
    s.session_date,
    s.duration_seconds,
    s.estimated_moca,
    s.predicted_diagnosis,
    s.p_normal,
    s.p_mci,
    s.p_dementia,
    s.impairment_risk_score,
    s.clinical_alert_tier,
    s.model_confidence,
    s.battery_coverage,
    s.domain_memory,
    s.domain_language,
    s.domain_executive,
    s.domain_processing_speed,
    s.domain_spatial_orientation,
    s.domain_attention,
    s.trajectory_tier,
    s.rci,
    s.theil_sen_slope,
    s.z_drift,
    s.vmra_recall_accuracy,
    s.vmra_delayed_recall_accuracy,
    s.story_recall_accuracy,
    s.story_speech_rate_wpm,
    s.lang_cognitive_speech_index,
    s.lang_wpm,
    s.pattern_accuracy,
    s.reaction_mean_latency_ms,
    s.nav_navigation_accuracy,
    s.top_recommendations,
    s.top_attributions
FROM assessment_sessions s
LEFT JOIN users u ON s.firebase_uid = u.firebase_uid
ORDER BY s.firebase_uid, s.is_mock, s.session_date DESC;

CREATE OR REPLACE VIEW v_clinician_overview AS
WITH ranked_sessions AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY firebase_uid, is_mock ORDER BY session_date DESC) as rn
    FROM assessment_sessions
)
SELECT 
    r.firebase_uid,
    r.is_mock,
    u.email,
    u.full_name,
    u.age,
    u.gender,
    u.education_years,
    r.session_date AS latest_assessment_date,
    r.session_number AS total_sessions_completed,
    r.estimated_moca AS latest_moca,
    r.predicted_diagnosis AS latest_diagnosis,
    r.impairment_risk_score,
    r.clinical_alert_tier,
    r.model_confidence,
    r.trajectory_tier,
    r.domain_memory,
    r.domain_language,
    r.domain_executive,
    r.domain_processing_speed,
    r.domain_spatial_orientation,
    r.domain_attention,
    r.top_recommendations
FROM ranked_sessions r
LEFT JOIN users u ON r.firebase_uid = u.firebase_uid
WHERE r.rn = 1;

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES (Idempotent)
-- ----------------------------------------------------------------------------

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read users" ON users;
DROP POLICY IF EXISTS "Allow public insert users" ON users;
DROP POLICY IF EXISTS "Allow public update users" ON users;
CREATE POLICY "Allow public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read sessions" ON assessment_sessions;
DROP POLICY IF EXISTS "Allow public insert sessions" ON assessment_sessions;
DROP POLICY IF EXISTS "Allow public update sessions" ON assessment_sessions;
CREATE POLICY "Allow public read sessions" ON assessment_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert sessions" ON assessment_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update sessions" ON assessment_sessions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read module_results" ON module_results;
DROP POLICY IF EXISTS "Allow public insert module_results" ON module_results;
DROP POLICY IF EXISTS "Allow public update module_results" ON module_results;
CREATE POLICY "Allow public read module_results" ON module_results FOR SELECT USING (true);
CREATE POLICY "Allow public insert module_results" ON module_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update module_results" ON module_results FOR UPDATE USING (true);
