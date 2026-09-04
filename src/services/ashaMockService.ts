/**
 * ASHA Field Mock Data Service
 * Provides isolated, realistic village caseload simulation for ASHA health workers.
 * Seeds 12 diverse rural elders across all clinical tiers (Stable, Review Needed, Pending)
 * with pre-computed longitudinal MoCA histories, domain scores, and vitals.
 */

import type { AshaBeneficiary } from './supabaseService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logger } from '../utils/logger';

export const ASHA_MOCK_ACTIVE_KEY = 'vyomflow_asha_mock_active';
export const ASHA_MOCK_STORAGE_KEY = 'vyomflow_asha_mock_beneficiaries';
const ASHA_LOCAL_SESSIONS_KEY = 'vyomflow_asha_local_sessions';

export interface MockSessionRecord {
    id: string;
    firebase_uid: string;
    session_id: string;
    session_number: number;
    is_mock: boolean;
    session_date: string;
    duration_seconds: number;
    timezone: string;
    estimated_moca: number;
    moca_ci_95: [number, number];
    predicted_diagnosis: string;
    p_normal: number;
    p_mci: number;
    p_dementia: number;
    impairment_risk_score: number;
    clinical_alert_tier: 'STABLE' | 'CLINICAL_REVIEW' | 'MONITORED';
    model_confidence: number;
    battery_coverage: number;
    completed_modules: string[];
    domain_memory: number;
    domain_language: number;
    domain_executive: number;
    domain_processing_speed: number;
    domain_spatial_orientation: number;
    domain_attention: number;
}

/**
 * Generates the predefined 12-patient realistic Indian village caseload.
 */
export function generateMockAshaCaseload(workerId: string): {
    beneficiaries: AshaBeneficiary[];
    sessions: MockSessionRecord[];
} {
    const now = Date.now();
    const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

    const beneficiaries: AshaBeneficiary[] = [
        {
            id: 'mock_ben_01',
            firebase_uid: 'asha_mock_ben_01',
            full_name: 'Anandi Devi',
            age: 64,
            gender: 'Female',
            education_years: 0,
            village_name: 'Chandpur',
            phone_number: '9876543210',
            abha_id: '91-4920-1123-8890',
            preferred_language: 'hi',
            has_hypertension: true,
            has_diabetes: false,
            asha_worker_id: workerId,
            is_beneficiary: true,
            assessments_count: 2,
            latest_moca: 24,
            latest_alert_tier: 'STABLE',
            last_assessed_at: daysAgo(5),
            created_at: daysAgo(60),
            updated_at: daysAgo(5)
        },
        {
            id: 'mock_ben_02',
            firebase_uid: 'asha_mock_ben_02',
            full_name: 'Rameshwar Yadav',
            age: 72,
            gender: 'Male',
            education_years: 5,
            village_name: 'Rampur',
            phone_number: '9812345678',
            abha_id: '91-3819-4451-2201',
            preferred_language: 'hi',
            has_hypertension: true,
            has_diabetes: true,
            asha_worker_id: workerId,
            is_beneficiary: true,
            assessments_count: 2,
            latest_moca: 19,
            latest_alert_tier: 'CLINICAL_REVIEW',
            last_assessed_at: daysAgo(3),
            created_at: daysAgo(75),
            updated_at: daysAgo(3)
        },
        {
            id: 'mock_ben_03',
            firebase_uid: 'asha_mock_ben_03',
            full_name: 'Kamala Bai',
            age: 68,
            gender: 'Female',
            education_years: 2,
            village_name: 'Sonapur',
            phone_number: '9890123456',
            abha_id: '91-8821-3312-9904',
            preferred_language: 'mr',
            has_hypertension: false,
            has_diabetes: false,
            asha_worker_id: workerId,
            is_beneficiary: true,
            assessments_count: 2,
            latest_moca: 27,
            latest_alert_tier: 'STABLE',
            last_assessed_at: daysAgo(8),
            created_at: daysAgo(90),
            updated_at: daysAgo(8)
        },
        {
            id: 'mock_ben_04',
            firebase_uid: 'asha_mock_ben_04',
            full_name: 'Sundar Murugan',
            age: 76,
            gender: 'Male',
            education_years: 7,
            village_name: 'Chandpur',
            phone_number: '9789012345',
            abha_id: '91-7712-4491-1123',
            preferred_language: 'ta',
            has_hypertension: true,
            has_diabetes: false,
            asha_worker_id: workerId,
            is_beneficiary: true,
            assessments_count: 2,
            latest_moca: 18,
            latest_alert_tier: 'CLINICAL_REVIEW',
            last_assessed_at: daysAgo(2),
            created_at: daysAgo(45),
            updated_at: daysAgo(2)
        },
        {
            id: 'mock_ben_05',
            firebase_uid: 'asha_mock_ben_05',
            full_name: 'Fatima Begum',
            age: 59,
            gender: 'Female',
            education_years: 8,
            village_name: 'Rampur',
            phone_number: '9830123456',
            abha_id: '91-6651-8892-3341',
            preferred_language: 'bn',
            has_hypertension: false,
            has_diabetes: false,
            asha_worker_id: workerId,
            is_beneficiary: true,
            assessments_count: 2,
            latest_moca: 28,
            latest_alert_tier: 'STABLE',
            last_assessed_at: daysAgo(12),
            created_at: daysAgo(50),
            updated_at: daysAgo(12)
        },
        {
            id: 'mock_ben_06',
            firebase_uid: 'asha_mock_ben_06',
            full_name: 'Harbhajan Singh',
            age: 74,
            gender: 'Male',
            education_years: 4,
            village_name: 'Sonapur',
            phone_number: '9814012345',
            abha_id: '91-5542-1193-4452',
            preferred_language: 'hi',
            has_hypertension: false,
            has_diabetes: true,
            asha_worker_id: workerId,
            is_beneficiary: true,
            assessments_count: 2,
            latest_moca: 20,
            latest_alert_tier: 'CLINICAL_REVIEW',
            last_assessed_at: daysAgo(4),
            created_at: daysAgo(80),
            updated_at: daysAgo(4)
        },
        {
            id: 'mock_ben_07',
            firebase_uid: 'asha_mock_ben_07',
            full_name: 'Ganga Ram',
            age: 65,
            gender: 'Male',
            education_years: 6,
            village_name: 'Rampur',
            phone_number: '9415012345',
            abha_id: '91-4431-7782-5563',
            preferred_language: 'hi',
            has_hypertension: true,
            has_diabetes: false,
            asha_worker_id: workerId,
            is_beneficiary: true,
            assessments_count: 1,
            latest_moca: 26,
            latest_alert_tier: 'STABLE',
            last_assessed_at: daysAgo(15),
            created_at: daysAgo(30),
            updated_at: daysAgo(15)
        },
        {
            id: 'mock_ben_08',
            firebase_uid: 'asha_mock_ben_08',
            full_name: 'Meenakshi Ammal',
            age: 71,
            gender: 'Female',
            education_years: 10,
            village_name: 'Chandpur',
            phone_number: '9444012345',
            abha_id: '91-3321-9971-6674',
            preferred_language: 'ta',
            has_hypertension: false,
            has_diabetes: false,
            asha_worker_id: workerId,
            is_beneficiary: true,
            assessments_count: 1,
            latest_moca: 21,
            latest_alert_tier: 'CLINICAL_REVIEW',
            last_assessed_at: daysAgo(1),
            created_at: daysAgo(20),
            updated_at: daysAgo(1)
        },
        {
            id: 'mock_ben_09',
            firebase_uid: 'asha_mock_ben_09',
            full_name: 'Shanti Soren',
            age: 60,
            gender: 'Female',
            education_years: 0,
            village_name: 'Sonapur',
            phone_number: '9431012345',
            abha_id: '91-2211-8861-7785',
            preferred_language: 'hi',
            has_hypertension: false,
            has_diabetes: false,
            asha_worker_id: workerId,
            is_beneficiary: true,
            assessments_count: 0,
            latest_moca: null,
            latest_alert_tier: 'PENDING',
            last_assessed_at: null,
            created_at: daysAgo(10),
            updated_at: daysAgo(10)
        },
        {
            id: 'mock_ben_10',
            firebase_uid: 'asha_mock_ben_10',
            full_name: 'Baldev Raj',
            age: 67,
            gender: 'Male',
            education_years: 3,
            village_name: 'Rampur',
            phone_number: '9419012345',
            abha_id: '91-1101-7751-8896',
            preferred_language: 'hi',
            has_hypertension: true,
            has_diabetes: false,
            asha_worker_id: workerId,
            is_beneficiary: true,
            assessments_count: 0,
            latest_moca: null,
            latest_alert_tier: 'PENDING',
            last_assessed_at: null,
            created_at: daysAgo(14),
            updated_at: daysAgo(14)
        },
        {
            id: 'mock_ben_11',
            firebase_uid: 'asha_mock_ben_11',
            full_name: 'Parvati Devi',
            age: 75,
            gender: 'Female',
            education_years: 1,
            village_name: 'Chandpur',
            phone_number: '9450012345',
            abha_id: '91-9981-6641-9907',
            preferred_language: 'hi',
            has_hypertension: false,
            has_diabetes: true,
            asha_worker_id: workerId,
            is_beneficiary: true,
            assessments_count: 0,
            latest_moca: null,
            latest_alert_tier: 'PENDING',
            last_assessed_at: null,
            created_at: daysAgo(18),
            updated_at: daysAgo(18)
        },
        {
            id: 'mock_ben_12',
            firebase_uid: 'asha_mock_ben_12',
            full_name: 'Keshava Rao',
            age: 70,
            gender: 'Male',
            education_years: 12,
            village_name: 'Sonapur',
            phone_number: '9440012345',
            abha_id: '91-8871-5531-1018',
            preferred_language: 'te',
            has_hypertension: false,
            has_diabetes: false,
            asha_worker_id: workerId,
            is_beneficiary: true,
            assessments_count: 0,
            latest_moca: null,
            latest_alert_tier: 'PENDING',
            last_assessed_at: null,
            created_at: daysAgo(25),
            updated_at: daysAgo(25)
        }
    ];

    // Longitudinal Session Histories for Screened Beneficiaries (Patients 1 to 8)
    const sessions: MockSessionRecord[] = [
        // Ben 01: Anandi Devi (Stable)
        {
            id: 'mock_sess_01_1',
            firebase_uid: 'asha_mock_ben_01',
            session_id: 'sess_mock_01_1',
            session_number: 1,
            is_mock: true,
            session_date: daysAgo(60),
            duration_seconds: 320,
            timezone: 'Asia/Kolkata',
            estimated_moca: 23.6,
            moca_ci_95: [22.2, 25.0],
            predicted_diagnosis: 'Normal Cognition',
            p_normal: 0.88,
            p_mci: 0.10,
            p_dementia: 0.02,
            impairment_risk_score: 0.14,
            clinical_alert_tier: 'STABLE',
            model_confidence: 0.91,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 78,
            domain_language: 82,
            domain_executive: 75,
            domain_processing_speed: 80,
            domain_spatial_orientation: 76,
            domain_attention: 84
        },
        {
            id: 'mock_sess_01_2',
            firebase_uid: 'asha_mock_ben_01',
            session_id: 'sess_mock_01_2',
            session_number: 2,
            is_mock: true,
            session_date: daysAgo(5),
            duration_seconds: 295,
            timezone: 'Asia/Kolkata',
            estimated_moca: 24.2,
            moca_ci_95: [23.0, 25.4],
            predicted_diagnosis: 'Normal Cognition',
            p_normal: 0.91,
            p_mci: 0.08,
            p_dementia: 0.01,
            impairment_risk_score: 0.11,
            clinical_alert_tier: 'STABLE',
            model_confidence: 0.93,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 80,
            domain_language: 85,
            domain_executive: 78,
            domain_processing_speed: 82,
            domain_spatial_orientation: 79,
            domain_attention: 86
        },

        // Ben 02: Rameshwar Yadav (Review Needed / MCI)
        {
            id: 'mock_sess_02_1',
            firebase_uid: 'asha_mock_ben_02',
            session_id: 'sess_mock_02_1',
            session_number: 1,
            is_mock: true,
            session_date: daysAgo(75),
            duration_seconds: 380,
            timezone: 'Asia/Kolkata',
            estimated_moca: 21.0,
            moca_ci_95: [19.5, 22.5],
            predicted_diagnosis: 'Mild Cognitive Impairment',
            p_normal: 0.32,
            p_mci: 0.58,
            p_dementia: 0.10,
            impairment_risk_score: 0.62,
            clinical_alert_tier: 'CLINICAL_REVIEW',
            model_confidence: 0.86,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 58,
            domain_language: 65,
            domain_executive: 54,
            domain_processing_speed: 60,
            domain_spatial_orientation: 55,
            domain_attention: 62
        },
        {
            id: 'mock_sess_02_2',
            firebase_uid: 'asha_mock_ben_02',
            session_id: 'sess_mock_02_2',
            session_number: 2,
            is_mock: true,
            session_date: daysAgo(3),
            duration_seconds: 410,
            timezone: 'Asia/Kolkata',
            estimated_moca: 19.2,
            moca_ci_95: [17.8, 20.6],
            predicted_diagnosis: 'Mild Cognitive Impairment',
            p_normal: 0.18,
            p_mci: 0.69,
            p_dementia: 0.13,
            impairment_risk_score: 0.74,
            clinical_alert_tier: 'CLINICAL_REVIEW',
            model_confidence: 0.88,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 50,
            domain_language: 60,
            domain_executive: 46,
            domain_processing_speed: 52,
            domain_spatial_orientation: 48,
            domain_attention: 55
        },

        // Ben 03: Kamala Bai (Stable)
        {
            id: 'mock_sess_03_1',
            firebase_uid: 'asha_mock_ben_03',
            session_id: 'sess_mock_03_1',
            session_number: 1,
            is_mock: true,
            session_date: daysAgo(90),
            duration_seconds: 280,
            timezone: 'Asia/Kolkata',
            estimated_moca: 26.8,
            moca_ci_95: [25.5, 28.0],
            predicted_diagnosis: 'Normal Cognition',
            p_normal: 0.94,
            p_mci: 0.05,
            p_dementia: 0.01,
            impairment_risk_score: 0.08,
            clinical_alert_tier: 'STABLE',
            model_confidence: 0.95,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 88,
            domain_language: 90,
            domain_executive: 85,
            domain_processing_speed: 86,
            domain_spatial_orientation: 84,
            domain_attention: 91
        },
        {
            id: 'mock_sess_03_2',
            firebase_uid: 'asha_mock_ben_03',
            session_id: 'sess_mock_03_2',
            session_number: 2,
            is_mock: true,
            session_date: daysAgo(8),
            duration_seconds: 270,
            timezone: 'Asia/Kolkata',
            estimated_moca: 27.1,
            moca_ci_95: [26.0, 28.2],
            predicted_diagnosis: 'Normal Cognition',
            p_normal: 0.95,
            p_mci: 0.04,
            p_dementia: 0.01,
            impairment_risk_score: 0.06,
            clinical_alert_tier: 'STABLE',
            model_confidence: 0.96,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 90,
            domain_language: 92,
            domain_executive: 88,
            domain_processing_speed: 88,
            domain_spatial_orientation: 86,
            domain_attention: 93
        },

        // Ben 04: Sundar Murugan (Review Needed / Latency Deficit)
        {
            id: 'mock_sess_04_1',
            firebase_uid: 'asha_mock_ben_04',
            session_id: 'sess_mock_04_1',
            session_number: 1,
            is_mock: true,
            session_date: daysAgo(45),
            duration_seconds: 430,
            timezone: 'Asia/Kolkata',
            estimated_moca: 19.5,
            moca_ci_95: [18.0, 21.0],
            predicted_diagnosis: 'Mild Cognitive Impairment',
            p_normal: 0.24,
            p_mci: 0.65,
            p_dementia: 0.11,
            impairment_risk_score: 0.70,
            clinical_alert_tier: 'CLINICAL_REVIEW',
            model_confidence: 0.85,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 48,
            domain_language: 58,
            domain_executive: 44,
            domain_processing_speed: 46,
            domain_spatial_orientation: 50,
            domain_attention: 52
        },
        {
            id: 'mock_sess_04_2',
            firebase_uid: 'asha_mock_ben_04',
            session_id: 'sess_mock_04_2',
            session_number: 2,
            is_mock: true,
            session_date: daysAgo(2),
            duration_seconds: 445,
            timezone: 'Asia/Kolkata',
            estimated_moca: 18.2,
            moca_ci_95: [16.8, 19.6],
            predicted_diagnosis: 'Mild Cognitive Impairment',
            p_normal: 0.15,
            p_mci: 0.71,
            p_dementia: 0.14,
            impairment_risk_score: 0.78,
            clinical_alert_tier: 'CLINICAL_REVIEW',
            model_confidence: 0.87,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 44,
            domain_language: 55,
            domain_executive: 40,
            domain_processing_speed: 42,
            domain_spatial_orientation: 45,
            domain_attention: 48
        },

        // Ben 05: Fatima Begum (Stable)
        {
            id: 'mock_sess_05_1',
            firebase_uid: 'asha_mock_ben_05',
            session_id: 'sess_mock_05_1',
            session_number: 1,
            is_mock: true,
            session_date: daysAgo(50),
            duration_seconds: 260,
            timezone: 'Asia/Kolkata',
            estimated_moca: 27.5,
            moca_ci_95: [26.2, 28.8],
            predicted_diagnosis: 'Normal Cognition',
            p_normal: 0.96,
            p_mci: 0.03,
            p_dementia: 0.01,
            impairment_risk_score: 0.05,
            clinical_alert_tier: 'STABLE',
            model_confidence: 0.96,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 92,
            domain_language: 94,
            domain_executive: 90,
            domain_processing_speed: 91,
            domain_spatial_orientation: 88,
            domain_attention: 95
        },
        {
            id: 'mock_sess_05_2',
            firebase_uid: 'asha_mock_ben_05',
            session_id: 'sess_mock_05_2',
            session_number: 2,
            is_mock: true,
            session_date: daysAgo(12),
            duration_seconds: 250,
            timezone: 'Asia/Kolkata',
            estimated_moca: 28.0,
            moca_ci_95: [26.8, 29.2],
            predicted_diagnosis: 'Normal Cognition',
            p_normal: 0.97,
            p_mci: 0.02,
            p_dementia: 0.01,
            impairment_risk_score: 0.04,
            clinical_alert_tier: 'STABLE',
            model_confidence: 0.97,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 94,
            domain_language: 95,
            domain_executive: 92,
            domain_processing_speed: 93,
            domain_spatial_orientation: 90,
            domain_attention: 96
        },

        // Ben 06: Harbhajan Singh (Review Needed)
        {
            id: 'mock_sess_06_1',
            firebase_uid: 'asha_mock_ben_06',
            session_id: 'sess_mock_06_1',
            session_number: 1,
            is_mock: true,
            session_date: daysAgo(80),
            duration_seconds: 370,
            timezone: 'Asia/Kolkata',
            estimated_moca: 21.4,
            moca_ci_95: [19.8, 23.0],
            predicted_diagnosis: 'Mild Cognitive Impairment',
            p_normal: 0.35,
            p_mci: 0.55,
            p_dementia: 0.10,
            impairment_risk_score: 0.58,
            clinical_alert_tier: 'CLINICAL_REVIEW',
            model_confidence: 0.84,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 55,
            domain_language: 68,
            domain_executive: 50,
            domain_processing_speed: 56,
            domain_spatial_orientation: 58,
            domain_attention: 60
        },
        {
            id: 'mock_sess_06_2',
            firebase_uid: 'asha_mock_ben_06',
            session_id: 'sess_mock_06_2',
            session_number: 2,
            is_mock: true,
            session_date: daysAgo(4),
            duration_seconds: 390,
            timezone: 'Asia/Kolkata',
            estimated_moca: 20.1,
            moca_ci_95: [18.5, 21.7],
            predicted_diagnosis: 'Mild Cognitive Impairment',
            p_normal: 0.22,
            p_mci: 0.67,
            p_dementia: 0.11,
            impairment_risk_score: 0.68,
            clinical_alert_tier: 'CLINICAL_REVIEW',
            model_confidence: 0.86,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 52,
            domain_language: 64,
            domain_executive: 48,
            domain_processing_speed: 52,
            domain_spatial_orientation: 54,
            domain_attention: 56
        },

        // Ben 07: Ganga Ram (Stable)
        {
            id: 'mock_sess_07_1',
            firebase_uid: 'asha_mock_ben_07',
            session_id: 'sess_mock_07_1',
            session_number: 1,
            is_mock: true,
            session_date: daysAgo(15),
            duration_seconds: 310,
            timezone: 'Asia/Kolkata',
            estimated_moca: 26.2,
            moca_ci_95: [24.8, 27.5],
            predicted_diagnosis: 'Normal Cognition',
            p_normal: 0.92,
            p_mci: 0.07,
            p_dementia: 0.01,
            impairment_risk_score: 0.10,
            clinical_alert_tier: 'STABLE',
            model_confidence: 0.92,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 85,
            domain_language: 88,
            domain_executive: 82,
            domain_processing_speed: 84,
            domain_spatial_orientation: 83,
            domain_attention: 89
        },

        // Ben 08: Meenakshi Ammal (Review Needed)
        {
            id: 'mock_sess_08_1',
            firebase_uid: 'asha_mock_ben_08',
            session_id: 'sess_mock_08_1',
            session_number: 1,
            is_mock: true,
            session_date: daysAgo(1),
            duration_seconds: 385,
            timezone: 'Asia/Kolkata',
            estimated_moca: 21.0,
            moca_ci_95: [19.5, 22.5],
            predicted_diagnosis: 'Mild Cognitive Impairment',
            p_normal: 0.30,
            p_mci: 0.60,
            p_dementia: 0.10,
            impairment_risk_score: 0.65,
            clinical_alert_tier: 'CLINICAL_REVIEW',
            model_confidence: 0.85,
            battery_coverage: 1.0,
            completed_modules: ['reaction', 'story', 'pattern'],
            domain_memory: 56,
            domain_language: 70,
            domain_executive: 52,
            domain_processing_speed: 58,
            domain_spatial_orientation: 54,
            domain_attention: 60
        }
    ];

    return { beneficiaries, sessions };
}

/**
 * Checks if the mock caseload is currently active.
 */
export function isAshaMockCaseloadActive(): boolean {
    try {
        return localStorage.getItem(ASHA_MOCK_ACTIVE_KEY) === 'true';
    } catch {
        return false;
    }
}

/**
 * Gets the locally stored mock beneficiaries.
 */
export function getLocalMockBeneficiaries(): AshaBeneficiary[] {
    try {
        const raw = localStorage.getItem(ASHA_MOCK_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

/**
 * Seeds the mock village caseload into local cache and Supabase (if connected).
 */
export async function seedAshaMockCaseload(workerId: string): Promise<boolean> {
    try {
        const { beneficiaries, sessions } = generateMockAshaCaseload(workerId);

        // 1. Save to LocalStorage under isolated mock keys
        localStorage.setItem(ASHA_MOCK_STORAGE_KEY, JSON.stringify(beneficiaries));
        localStorage.setItem(ASHA_MOCK_ACTIVE_KEY, 'true');

        // 2. Merge mock sessions into local sessions cache
        try {
            const existingRaw = localStorage.getItem(ASHA_LOCAL_SESSIONS_KEY);
            const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
            // Remove previous mock sessions
            const nonMock = existing.filter(s => !s.is_mock && !s.firebase_uid?.startsWith('asha_mock_'));
            const merged = [...nonMock, ...sessions];
            localStorage.setItem(ASHA_LOCAL_SESSIONS_KEY, JSON.stringify(merged));
        } catch (e) {
            logger.warn('Failed to merge mock sessions into local cache:', e);
        }

        // 3. Save to Supabase if connected
        if (isSupabaseConfigured() && navigator.onLine) {
            try {
                // Remove previous mock rows
                await supabase.from('assessment_sessions')
                    .delete()
                    .like('firebase_uid', 'asha_mock_%');

                await supabase.from('users')
                    .delete()
                    .like('firebase_uid', 'asha_mock_%');

                // Insert mock beneficiaries into users table
                const userInserts = beneficiaries.map(b => ({
                    firebase_uid: b.firebase_uid,
                    full_name: b.full_name,
                    age: b.age,
                    gender: b.gender,
                    education_years: b.education_years,
                    village_name: b.village_name,
                    phone_number: b.phone_number,
                    abha_id: b.abha_id,
                    preferred_language: b.preferred_language,
                    has_hypertension: b.has_hypertension,
                    has_diabetes: b.has_diabetes,
                    asha_worker_id: workerId,
                    is_beneficiary: true,
                    created_at: b.created_at,
                    updated_at: b.updated_at
                }));

                await supabase.from('users').upsert(userInserts, { onConflict: 'firebase_uid' });

                // Insert sessions
                await supabase.from('assessment_sessions').insert(sessions);
                logger.info('Seeded ASHA mock caseload to Supabase successfully.');
            } catch (err) {
                logger.warn('Failed to seed mock data to Supabase (offline mode active):', err);
            }
        }

        return true;
    } catch (err) {
        logger.error('Failed to seed ASHA mock caseload:', err);
        return false;
    }
}

/**
 * Clears the mock village caseload, leaving real records 100% untouched.
 */
export async function clearAshaMockCaseload(_workerId?: string): Promise<boolean> {
    try {
        // 1. Remove mock keys from LocalStorage
        localStorage.removeItem(ASHA_MOCK_STORAGE_KEY);
        localStorage.removeItem(ASHA_MOCK_ACTIVE_KEY);

        // 2. Remove mock sessions from local sessions cache
        try {
            const existingRaw = localStorage.getItem(ASHA_LOCAL_SESSIONS_KEY);
            if (existingRaw) {
                const existing: any[] = JSON.parse(existingRaw);
                const nonMock = existing.filter(s => !s.is_mock && !s.firebase_uid?.startsWith('asha_mock_'));
                localStorage.setItem(ASHA_LOCAL_SESSIONS_KEY, JSON.stringify(nonMock));
            }
        } catch (e) {
            logger.warn('Failed to clean local mock sessions:', e);
        }

        // 3. Purge from Supabase if connected
        if (isSupabaseConfigured() && navigator.onLine) {
            try {
                await supabase.from('assessment_sessions')
                    .delete()
                    .like('firebase_uid', 'asha_mock_%');

                await supabase.from('users')
                    .delete()
                    .like('firebase_uid', 'asha_mock_%');

                logger.info('Purged ASHA mock records from Supabase.');
            } catch (err) {
                logger.warn('Failed to delete mock rows from Supabase:', err);
            }
        }

        return true;
    } catch (err) {
        logger.error('Failed to clear ASHA mock caseload:', err);
        return false;
    }
}
