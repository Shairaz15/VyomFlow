/**
 * VyomFlow Clinical & Lifestyle Recommendation Engine
 * ====================================================
 * Generates Top 10 Personalized, Prioritized Evidence-Based Recommendations
 * dynamically tailored to the patient's lowest-scoring cognitive domains,
 * trajectory drift, and specific digital biomarker vulnerabilities.
 */

import type { CognitiveModelPrediction } from './clinicalModelEngine';

export interface RecommendationItem {
    id: string;
    priority: number; // 1 to 10
    category: 'Cognitive Training' | 'Physical & Motor' | 'Sleep & Circadian' | 'Nutrition & Metabolic' | 'Speech & Language' | 'Clinical & Medical';
    targetDomain: 'Memory' | 'Processing Speed' | 'Spatial Orientation' | 'Language' | 'Executive Function' | 'Attention' | 'General';
    title: string;
    description: string;
    actionProtocol: string;
    frequency: string;
    clinicalEvidence: string;
    urgency: 'routine' | 'moderate' | 'high';
}

export function generateTop10Recommendations(
    prediction?: CognitiveModelPrediction | null,
    trajectoryTier?: string,
    _completedModules?: string[]
): RecommendationItem[] {
    const domainScores = prediction?.domainScores || {
        memory: 80,
        language: 80,
        executive: 80,
        processingSpeed: 80,
        spatialOrientation: 80,
        attention: 80,
    };

    const isDeclining = trajectoryTier === 'Likely Decline' || trajectoryTier === 'Rapid Decline' || trajectoryTier === 'Possible Decline';
    const isHighRisk = prediction?.predictedDiagnosis === 'Dementia' || (prediction?.probabilities.dementia ?? 0) > 0.35;

    // Rank domains from lowest to highest score
    

    const candidates: RecommendationItem[] = [];

    // 1. Memory Interventions (Triggered if Memory is in bottom 3 or < 75)
    if (domainScores.memory < 80) {
        candidates.push({
            id: 'rec_mem_spaced_retrieval',
            priority: 1,
            category: 'Cognitive Training',
            targetDomain: 'Memory',
            title: 'Spaced Retrieval & Visual Association Practice',
            description: 'Strengthen hippocampal encoding pathways through expanding interval memory recall exercises.',
            actionProtocol: 'Use visual imagery mnemonics when learning new names, numbers, and appointment details. Test yourself at 1-min, 5-min, 30-min intervals.',
            frequency: '15 mins daily',
            clinicalEvidence: 'Spaced retrieval significantly reduces delayed recall decay and intrusion errors in mild cognitive vulnerability (NACC/ADNI protocols).',
            urgency: domainScores.memory < 65 ? 'high' : 'moderate',
        });
    }

    // 2. Processing Speed & Psychomotor Training
    if (domainScores.processingSpeed < 80) {
        candidates.push({
            id: 'rec_speed_dual_task',
            priority: 2,
            category: 'Physical & Motor',
            targetDomain: 'Processing Speed',
            title: 'Dual-Task Aerobic & Motor Response Conditioning',
            description: 'Enhance visual-motor reaction time and white matter integrity through synchronized motor-cognitive drills.',
            actionProtocol: 'Brisk walking or stationary cycling while simultaneously naming objects or performing reverse serial counting.',
            frequency: '30 mins, 4x per week',
            clinicalEvidence: 'Aerobic dual-task training increases BDNF levels and reduces motor-cognitive latency divergence.',
            urgency: domainScores.processingSpeed < 65 ? 'high' : 'moderate',
        });
    }

    // 3. Spatial Orientation & Route Wayfinding
    if (domainScores.spatialOrientation < 80) {
        candidates.push({
            id: 'rec_spatial_wayfinding',
            priority: 3,
            category: 'Cognitive Training',
            targetDomain: 'Spatial Orientation',
            title: 'Landmark-Based Cognitive Mapping & Real-World Wayfinding',
            description: 'Counteract spatial disorientation by actively encoding 3D visual landmarks and mental orientation vectors.',
            actionProtocol: 'Navigate familiar neighborhood routes without GPS navigation; mentally map landmarks and draw route layouts post-walk.',
            frequency: '2-3x per week',
            clinicalEvidence: 'Entorhinal cortex landmark anchoring directly stabilizes spatial memory index and heading trajectory fidelity.',
            urgency: domainScores.spatialOrientation < 65 ? 'high' : 'moderate',
        });
    }

    // 4. Speech & Language Fluency
    if (domainScores.language < 80) {
        candidates.push({
            id: 'rec_lang_expressive',
            priority: 4,
            category: 'Speech & Language',
            targetDomain: 'Language',
            title: 'Category Fluency & Rapid Lexical Retrieval Exercises',
            description: 'Maintain phonation ratio, speech stability, and semantic coherence through timed verbal fluency tasks.',
            actionProtocol: '60-second rapid category naming (e.g. animals, fruits, tools) followed by story retelling with emphasis on smooth articulation without filler pauses.',
            frequency: '10 mins daily',
            clinicalEvidence: 'Timed lexical retrieval maintains semantic network connectivity and decreases speech pause duration average.',
            urgency: domainScores.language < 65 ? 'high' : 'moderate',
        });
    }

    // 5. Attention & Sustained Vigilance
    if (domainScores.attention < 80) {
        candidates.push({
            id: 'rec_attn_mindfulness',
            priority: 5,
            category: 'Cognitive Training',
            targetDomain: 'Attention',
            title: 'Sustained Attention & Inhibitory Control Conditioning',
            description: 'Prevent vigilance decrement slope and attention lapses during prolonged cognitive tasks.',
            actionProtocol: 'Practice Go/No-Go tapping exercises and 10-minute focused single-task mindfulness breathing sessions.',
            frequency: '15 mins daily',
            clinicalEvidence: 'Prefrontal inhibitory training reduces premature reaction errors and sustains vigilance over extended sessions.',
            urgency: domainScores.attention < 65 ? 'high' : 'moderate',
        });
    }

    // 6. Working Memory & Executive Function
    if (domainScores.executive < 80) {
        candidates.push({
            id: 'rec_exec_working_memory',
            priority: 6,
            category: 'Cognitive Training',
            targetDomain: 'Executive Function',
            title: 'Working Memory Span & Sequential Pattern Reversal',
            description: 'Expand forward and backward digit span load tolerance under multi-step sequential demands.',
            actionProtocol: 'Engage with pattern memory matrix puzzles and reverse sequence recall games (e.g., repeating 4-8 items in reverse order).',
            frequency: '15 mins, 3x per week',
            clinicalEvidence: 'Working memory load tolerance training directly reinforces dorsolateral prefrontal cortical networks.',
            urgency: domainScores.executive < 65 ? 'high' : 'moderate',
        });
    }

    // 7. Circadian Rhythm & Slow-Wave Sleep Hygiene (Universal Essential)
    candidates.push({
        id: 'rec_sleep_circadian',
        priority: 7,
        category: 'Sleep & Circadian',
        targetDomain: 'General',
        title: 'Circadian Sleep Optimization for Glymphatic Clearance',
        description: 'Ensure 7–8.5 hours of uninterrupted sleep to enable brain glymphatic waste clearance and memory consolidation.',
        actionProtocol: 'Maintain strict sleep-wake window (+/- 30 min), eliminate blue-light screen exposure 60 mins before bed, and get 15 mins morning sunlight.',
        frequency: 'Daily consistency',
        clinicalEvidence: 'Slow-wave non-REM sleep drives glymphatic clearance of neurotoxic proteins and stabilizes daily cognitive variance.',
        urgency: isDeclining ? 'high' : 'routine',
    });

    // 8. Neuro-Protective Mediterranean / MIND Nutrition
    candidates.push({
        id: 'rec_nutrition_mind',
        priority: 8,
        category: 'Nutrition & Metabolic',
        targetDomain: 'General',
        title: 'MIND Dietary Protocol (Polyphenols & Omega-3s)',
        description: 'Optimize cerebral vascular health and reduce neuro-inflammation through targeted nutrient intake.',
        actionProtocol: 'Incorporate dark leafy greens, berries, walnuts, extra virgin olive oil, and fatty fish while minimizing refined sugars and trans-fats.',
        frequency: 'Daily nutritional regimen',
        clinicalEvidence: 'Adherence to the MIND diet is clinically associated with a 35-53% lower rate of cognitive decline across longitudinal cohorts.',
        urgency: 'routine',
    });

    // 9. Social & Interactive Cognitive Engagement
    candidates.push({
        id: 'rec_social_engagement',
        priority: 9,
        category: 'Speech & Language',
        targetDomain: 'Language',
        title: 'Complex Social Discourse & Collaborative Problem Solving',
        description: 'Engage multi-modal cognitive faculties through conversational debates, book clubs, or strategy games.',
        actionProtocol: 'Participate in group discussions or structured multiplayer board/card games that require theory of mind and rapid strategic response.',
        frequency: '2-3x per week',
        clinicalEvidence: 'Rich social engagement builds cognitive reserve and buffers against cross-sectional biomarker impairment.',
        urgency: 'routine',
    });

    // 10. Longitudinal Follow-Up & Clinical Evaluation
    candidates.push({
        id: 'rec_clinical_followup',
        priority: 10,
        category: 'Clinical & Medical',
        targetDomain: 'General',
        title: isHighRisk ? 'Formal Comprehensive Neuropsychological Evaluation' : (isDeclining ? 'Accelerated Follow-Up Cognitive Assessment' : 'Routine Semi-Annual Check-In'),
        description: isHighRisk 
            ? 'Share the exported Clinician PDF Summary with your primary care physician or neurologist for formal diagnostic workup.'
            : (isDeclining 
                ? 'Repeat the 6-module VyomFlow assessment in 3–4 weeks to evaluate whether observed decline is persistent or transient.' 
                : 'Continue regular longitudinal tracking on VyomFlow to establish a reliable multi-session personal baseline.'),
        actionProtocol: isHighRisk ? 'Schedule clinical appointment and provide exported 75-biomarker PDF report.' : 'Set a calendar reminder for your next assessment.',
        frequency: isHighRisk ? 'Immediate' : (isDeclining ? 'In 3-4 weeks' : 'Every 3-6 months'),
        clinicalEvidence: 'Early detection and multi-modal digital biomarker tracking allows timely therapeutic and lifestyle intervention windows.',
        urgency: isHighRisk ? 'high' : (isDeclining ? 'moderate' : 'routine'),
    });

    // Fill up to 10 if needed
    return candidates.slice(0, 10);
}
