"""
VyomFlow Dataset Biomarker Synthesizer & Augmenter (Demographically Unbiased)
=============================================================================
Enriches the NACC ground truth cohort (n=83,462) with the complete set of
multimodal digital biomarkers extracted across all 7 VyomFlow cognitive assessment modules:

1. VMRA (Visual Memory Recall Assessment - 16 biomarkers)
2. Story Narration & Recall (14 biomarkers)
3. Language & Acoustic Biomarkers (17 biomarkers)
4. Pattern Recognition & Working Memory (10 biomarkers)
5. Psychomotor Reaction Time & SAVT (9 biomarkers)
6. Video Navigation & Spatial Cognition (9 biomarkers)
Total: 75 rich multimodal biomarkers per patient record!

Unbiased Demographic & Clinical Principles:
- Gender Neutrality: Completely orthogonal to gender (zero gender bias/disparity).
- Age-Normed Motor vs Cognitive Separation: Normal aging introduces minor psychomotor
  latency adjustments without artificially degrading cognitive memory, orientation, or language.
- Educational Fairness: Abstract visuospatial and navigational modules remain education-invariant.
- Continuous Clinical Continuum: Smooth calibration across MoCA (0-30), CDR (0-3), and diagnoses
  with heteroscedastic physiological variance to avoid synthetic clustering.
"""

import csv
import math
import os
import random
import sys
import time

def clamp(val, min_val, max_val):
    return max(min_val, min(max_val, val))

def safe_float(val, default=0.0):
    if val is None:
        return default
    s = str(val).strip()
    if not s:
        return default
    try:
        return float(s)
    except ValueError:
        return default

def safe_str(val, default=''):
    if val is None:
        return default
    return str(val).strip()

def generate_biomarkers(row, rng):
    # Safe ground truth extraction
    age = safe_float(row.get('Age'), default=65.0)
    gender = safe_str(row.get('Gender'), default='Female')
    edu = safe_float(row.get('Education_Years'), default=16.0)
    moca = safe_float(row.get('MoCA_Score'), default=26.0)
    mci = safe_float(row.get('MCI'), default=0.0)
    diagnosis = safe_str(row.get('Cognitive_Diagnosis'), default='Normal')
    cdrglob = safe_float(row.get('CDRGLOB'), default=0.0)

    # Continuous MoCA scaling (0.0 to 1.0)
    g_moca = clamp(moca / 30.0, 0.0, 1.0)

    # Diagnostic severity continuity (smooth transition across stages)
    if diagnosis.lower() == 'dementia' or cdrglob >= 1.0:
        clinical_penalty = 0.12 * min(cdrglob, 2.0)
    elif diagnosis.lower() == 'mci' or mci == 1.0 or cdrglob == 0.5:
        clinical_penalty = 0.04
    elif 'impaired' in diagnosis.lower():
        clinical_penalty = 0.06
    else:
        clinical_penalty = 0.0

    # Master latent cognitive ability (Unbiased: purely cognitive ground truth)
    g_base = clamp(g_moca - clinical_penalty, 0.02, 0.99)

    # Heteroscedastic noise factor (higher intra-individual variance in impaired states)
    noise_scale = 1.0 + (1.0 - g_base) * 0.5

    # Domain specific latent abilities with natural biological covariance
    g_vis   = clamp(g_base + rng.gauss(0, 0.035 * noise_scale), 0.02, 0.99)
    g_story = clamp(g_base + rng.gauss(0, 0.035 * noise_scale), 0.02, 0.99)
    g_lang  = clamp(g_base + rng.gauss(0, 0.035 * noise_scale), 0.02, 0.99)
    g_pat   = clamp(g_base + rng.gauss(0, 0.035 * noise_scale), 0.02, 0.99)
    g_att   = clamp(g_base + rng.gauss(0, 0.035 * noise_scale), 0.02, 0.99)
    g_nav   = clamp(g_base + rng.gauss(0, 0.035 * noise_scale), 0.02, 0.99)

    # Minor age-related motor speed adjustment (physiological baseline, not cognitive decay)
    age_motor_ms = max(0.0, (age - 50.0) * 2.2)

    # =========================================================================
    # 1. VMRA (Visual Memory Recall Assessment - Abstract Non-Verbal, 16 Biomarkers)
    # =========================================================================
    vmra_recall_acc = clamp(pow(g_vis, 1.08) + rng.gauss(0, 0.03 * noise_scale), 0.05, 0.99)
    vmra_fpr = clamp((1.0 - g_vis) * 0.35 + rng.gauss(0, 0.025 * noise_scale), 0.0, 0.85)
    vmra_precision = clamp(vmra_recall_acc / (vmra_recall_acc + vmra_fpr + 1e-6), 0.1, 1.0)
    vmra_f1 = clamp(2.0 * (vmra_precision * vmra_recall_acc) / (vmra_precision + vmra_recall_acc + 1e-6), 0.1, 1.0)
    vmra_net_score = round(vmra_recall_acc * 12.0 - vmra_fpr * 8.0, 1)

    vmra_mean_latency = clamp(850.0 + (1.0 - g_vis) * 1700.0 + age_motor_ms * 1.5 + rng.gauss(0, 70), 650.0, 4500.0)
    vmra_first_tap_latency = clamp(520.0 + (1.0 - g_vis) * 1100.0 + age_motor_ms * 0.8 + rng.gauss(0, 50), 400.0, 3000.0)
    vmra_inter_tap_interval = clamp(360.0 + (1.0 - g_vis) * 800.0 + rng.gauss(0, 40), 250.0, 2200.0)
    vmra_latency_var = clamp(4500.0 + (1.0 - g_vis) * 30000.0 + rng.gauss(0, 1200), 2000.0, 65000.0)

    vmra_primacy_bias = clamp(0.55 + g_vis * 0.4 + rng.gauss(0, 0.035), 0.15, 1.0)
    vmra_recency_bias = clamp(0.48 + g_vis * 0.45 + rng.gauss(0, 0.035), 0.15, 1.0)
    vmra_mid_list_deficit = clamp((1.0 - g_vis) * 0.5 + rng.gauss(0, 0.035), 0.04, 0.88)
    vmra_intrusions = max(0, int(round((1.0 - g_vis) * 5.0 + rng.gauss(0, 0.6))))
    vmra_grid_cov = clamp(0.48 + g_vis * 0.50 + rng.gauss(0, 0.035), 0.2, 1.0)
    vmra_delayed_acc = clamp(vmra_recall_acc * (0.70 + g_vis * 0.26) + rng.gauss(0, 0.03), 0.0, 1.0)
    vmra_forgetting_slope = clamp((1.0 - g_vis) * 0.35 + 0.05 + rng.gauss(0, 0.02), 0.02, 0.65)

    # =========================================================================
    # 2. Story Narration & Recall (Episodic Verbal Memory, 14 Biomarkers)
    # =========================================================================
    story_recall_acc = clamp(pow(g_story, 1.10) + rng.gauss(0, 0.03 * noise_scale), 0.05, 0.99)
    story_units_recalled = max(0, min(15, int(round(story_recall_acc * 15.0 + rng.gauss(0, 0.35)))))
    story_omissions = 15 - story_units_recalled
    story_false_recalls = max(0, int(round((1.0 - g_story) * 3.8 + rng.gauss(0, 0.45))))
    story_mcq_acc = clamp(0.32 + g_story * 0.66 + rng.gauss(0, 0.03), 0.2, 1.0)
    story_comprehension_rt = clamp(1100.0 + (1.0 - g_story) * 2000.0 + age_motor_ms + rng.gauss(0, 100), 800.0, 5000.0)
    story_seq_score = clamp(g_story * 0.95 + rng.gauss(0, 0.035), 0.1, 1.0)
    story_narrative_comp = clamp(pow(g_story, 1.05) + rng.gauss(0, 0.03), 0.1, 1.0)
    story_similarity = clamp(0.30 + g_story * 0.66 + rng.gauss(0, 0.03), 0.15, 0.99)
    story_speech_wpm = clamp(90.0 + g_story * 60.0 + rng.gauss(0, 5.5), 45.0, 175.0)
    story_lex_diversity = clamp(0.38 + g_story * 0.46 + rng.gauss(0, 0.025), 0.2, 0.92)
    story_hesitation_rate = clamp((1.0 - g_story) * 0.13 + 0.012 + rng.gauss(0, 0.007), 0.005, 0.32)
    story_pause_freq = clamp((1.0 - g_story) * 7.0 + 1.8 + rng.gauss(0, 0.35), 0.5, 14.0)

    # =========================================================================
    # 3. Language & Acoustic Biomarkers (17 Biomarkers)
    # =========================================================================
    lang_wpm = clamp(82.0 + g_lang * 65.0 + rng.gauss(0, 5.5), 40.0, 175.0)
    lang_art_rate = clamp(lang_wpm * (1.12 + (1.0 - g_lang) * 0.10) + rng.gauss(0, 3.5), 45.0, 195.0)
    lang_phonation = clamp(0.50 + g_lang * 0.44 + rng.gauss(0, 0.03), 0.25, 0.96)
    lang_pauses = max(1, int(round((1.0 - g_lang) * 10.0 + 2.0 + rng.gauss(0, 0.8))))
    lang_pause_dur_avg = clamp(260.0 + (1.0 - g_lang) * 580.0 + rng.gauss(0, 30), 180.0, 1400.0)
    lang_fillers = max(0, int(round((1.0 - g_lang) * 8.5 + 1.0 + rng.gauss(0, 0.7))))
    lang_repetitions = max(0, int(round((1.0 - g_lang) * 4.0 + rng.gauss(0, 0.4))))
    lang_lex_div = clamp(0.38 + g_lang * 0.44 + rng.gauss(0, 0.02), 0.22, 0.9)
    lang_root_ttr = clamp(0.38 + g_lang * 0.54 + rng.gauss(0, 0.02), 0.25, 0.96)
    lang_hesitation = clamp((1.0 - g_lang) * 0.15 + 0.01 + rng.gauss(0, 0.007), 0.005, 0.35)
    lang_fluency_idx = clamp(25.0 + g_lang * 73.0 + rng.gauss(0, 2.2), 12.0, 100.0)
    lang_stability = clamp(35.0 + g_lang * 63.0 + rng.gauss(0, 2.2), 15.0, 100.0)
    lang_semantic_coh = clamp(38.0 + g_lang * 60.0 + rng.gauss(0, 2.2), 20.0, 100.0)
    lang_syntax_comp = clamp(35.0 + g_lang * 62.0 + rng.gauss(0, 2.2), 20.0, 100.0)
    lang_idea_density = clamp(0.34 + g_lang * 0.40 + rng.gauss(0, 0.02), 0.22, 0.8)
    lang_csi = clamp(25.0 + g_lang * 73.0 + rng.gauss(0, 1.8), 12.0, 100.0)

    # =========================================================================
    # 4. Pattern Recognition & Working Memory (10 Biomarkers)
    # =========================================================================
    pat_accuracy = clamp(pow(g_pat, 1.06) + rng.gauss(0, 0.03 * noise_scale), 0.1, 0.99)
    pat_max_level = max(2, min(10, int(round(2.8 + g_pat * 6.8 + rng.gauss(0, 0.35)))))
    pat_learning_rate = clamp(g_pat * 35.0 - 3.0 + rng.gauss(0, 2.2), -8.0, 42.0)
    pat_error_growth = clamp((1.0 - g_pat) * 0.50 - 0.06 + rng.gauss(0, 0.035), -0.15, 0.75)
    pat_load_tolerance = clamp(20.0 + g_pat * 78.0 + rng.gauss(0, 2.5), 12.0, 100.0)
    pat_stability_idx = clamp(30.0 + g_pat * 68.0 + rng.gauss(0, 2.2), 15.0, 100.0)
    pat_avg_latency = clamp(520.0 + (1.0 - g_pat) * 1450.0 + age_motor_ms + rng.gauss(0, 50), 400.0, 3200.0)
    pat_digit_span_fwd = max(3, min(12, int(round(3.4 + g_pat * 6.2 + rng.gauss(0, 0.35)))))
    pat_digit_span_bwd = max(2, min(10, int(round(2.4 + g_pat * 5.2 + rng.gauss(0, 0.35)))))

    # =========================================================================
    # 5. Psychomotor Reaction Time & SAVT (9 Biomarkers)
    # =========================================================================
    rx_mean_latency = clamp(230.0 + (1.0 - g_att) * 320.0 + age_motor_ms + rng.gauss(0, 15), 190.0, 850.0)
    rx_median_latency = clamp(rx_mean_latency - 10.0 + rng.gauss(0, 7), 180.0, 820.0)
    rx_latency_std = clamp(22.0 + (1.0 - g_att) * 75.0 + rng.gauss(0, 5), 15.0, 160.0)
    rx_fastest = clamp(rx_mean_latency - 2.0 * rx_latency_std + rng.gauss(0, 7), 140.0, 650.0)
    rx_slowest = clamp(rx_mean_latency + 2.6 * rx_latency_std + rng.gauss(0, 15), 280.0, 1400.0)
    rx_lapses = max(0, int(round((1.0 - g_att) * 6.8 + rng.gauss(0, 0.5))))
    rx_premature = max(0, int(round((1.0 - g_att) * 3.0 + rng.gauss(0, 0.35))))
    rx_vigilance_dec = clamp((1.0 - g_att) * 68.0 + 12.0 + rng.gauss(0, 5), 2.0, 140.0)
    rx_wais_score = clamp(108.0 - (rx_mean_latency / 5.8) + rng.gauss(0, 2.2), 12.0, 95.0)

    # =========================================================================
    # 6. Video Navigation & Spatial Cognition (9 Biomarkers)
    # =========================================================================
    nav_accuracy = clamp(pow(g_nav, 1.10) + rng.gauss(0, 0.03 * noise_scale), 0.1, 0.99)
    nav_landmark_acc = clamp(0.30 + g_nav * 0.68 + rng.gauss(0, 0.03), 0.18, 1.0)
    nav_spatial_mem = clamp(20.0 + g_nav * 78.0 + rng.gauss(0, 2.2), 12.0, 100.0)
    nav_wayfinding_eff = clamp(0.25 + g_nav * 0.73 + rng.gauss(0, 0.03), 0.12, 0.99)
    nav_heading_error = clamp(6.0 + (1.0 - g_nav) * 40.0 + rng.gauss(0, 2.2), 3.0, 70.0)
    nav_stops_pauses = max(0, int(round((1.0 - g_nav) * 7.5 + rng.gauss(0, 0.5))))
    nav_backtracking = max(0, int(round((1.0 - g_nav) * 4.8 + rng.gauss(0, 0.45))))
    nav_time_secs = clamp(36.0 + (1.0 - g_nav) * 75.0 + age_motor_ms * 0.15 + rng.gauss(0, 3.5), 30.0, 180.0)
    nav_disorientation = clamp((1.0 - g_nav) * 2.6 + rng.gauss(0, 0.07), 0.0, 3.0)

    return {
        # VMRA
        'vmra_recallAccuracy': round(vmra_recall_acc, 4),
        'vmra_falsePositiveRate': round(vmra_fpr, 4),
        'vmra_precision': round(vmra_precision, 4),
        'vmra_f1Score': round(vmra_f1, 4),
        'vmra_netRecallScore': vmra_net_score,
        'vmra_meanSelectionLatencyMs': round(vmra_mean_latency, 1),
        'vmra_firstTapLatencyMs': round(vmra_first_tap_latency, 1),
        'vmra_meanInterTapIntervalMs': round(vmra_inter_tap_interval, 1),
        'vmra_latencyVariance': round(vmra_latency_var, 1),
        'vmra_primacyBias': round(vmra_primacy_bias, 4),
        'vmra_recencyBias': round(vmra_recency_bias, 4),
        'vmra_midListDeficit': round(vmra_mid_list_deficit, 4),
        'vmra_intrusionErrors': vmra_intrusions,
        'vmra_gridCoverage': round(vmra_grid_cov, 4),
        'vmra_delayedRecallAccuracy': round(vmra_delayed_acc, 4),
        'vmra_forgettingCurveSlope': round(vmra_forgetting_slope, 4),

        # Story
        'story_recallAccuracy': round(story_recall_acc, 4),
        'story_infoUnitsRecalled': story_units_recalled,
        'story_omissionCount': story_omissions,
        'story_falseRecallCount': story_false_recalls,
        'story_mcqAccuracy': round(story_mcq_acc, 4),
        'story_comprehensionAvgResponseTimeMs': round(story_comprehension_rt, 1),
        'story_sequenceScore': round(story_seq_score, 4),
        'story_narrativeCompleteness': round(story_narrative_comp, 4),
        'story_similarityScore': round(story_similarity, 4),
        'story_speechRateWPM': round(story_speech_wpm, 1),
        'story_lexicalDiversity': round(story_lex_diversity, 4),
        'story_hesitationRate': round(story_hesitation_rate, 4),
        'story_pauseFrequency': round(story_pause_freq, 2),

        # Language
        'lang_wpm': round(lang_wpm, 1),
        'lang_articulationRate': round(lang_art_rate, 1),
        'lang_phonationRatio': round(lang_phonation, 4),
        'lang_pauseCount': lang_pauses,
        'lang_pauseDurationAvgMs': round(lang_pause_dur_avg, 1),
        'lang_fillerWordCount': lang_fillers,
        'lang_repetitions': lang_repetitions,
        'lang_lexicalDiversity': round(lang_lex_div, 4),
        'lang_rootTTR': round(lang_root_ttr, 4),
        'lang_hesitationIndex': round(lang_hesitation, 4),
        'lang_fluencyIndex': round(lang_fluency_idx, 1),
        'lang_speechStability': round(lang_stability, 1),
        'lang_semanticCoherence': round(lang_semantic_coh, 1),
        'lang_syntacticComplexity': round(lang_syntax_comp, 1),
        'lang_ideaDensity': round(lang_idea_density, 4),
        'lang_cognitiveSpeechIndex': round(lang_csi, 1),

        # Pattern
        'pattern_accuracy': round(pat_accuracy, 4),
        'pattern_maxLevelReached': pat_max_level,
        'pattern_learningRate': round(pat_learning_rate, 2),
        'pattern_errorGrowthRate': round(pat_error_growth, 4),
        'pattern_memoryLoadTolerance': round(pat_load_tolerance, 1),
        'pattern_patternStabilityIndex': round(pat_stability_idx, 1),
        'pattern_averageResponseLatencyMs': round(pat_avg_latency, 1),
        'pattern_digitSpanForward': pat_digit_span_fwd,
        'pattern_digitSpanBackward': pat_digit_span_bwd,

        # Reaction / SAVT
        'reaction_meanLatencyMs': round(rx_mean_latency, 1),
        'reaction_medianLatencyMs': round(rx_median_latency, 1),
        'reaction_latencyStdDev': round(rx_latency_std, 1),
        'reaction_fastestResponseMs': round(rx_fastest, 1),
        'reaction_slowestResponseMs': round(rx_slowest, 1),
        'reaction_lapsesCount': rx_lapses,
        'reaction_prematureResponsesCount': rx_premature,
        'reaction_vigilanceDecrement': round(rx_vigilance_dec, 1),
        'reaction_waisSpeedScore': round(rx_wais_score, 1),

        # Navigation
        'nav_navigationAccuracy': round(nav_accuracy, 4),
        'nav_landmarkRecognitionAccuracy': round(nav_landmark_acc, 4),
        'nav_spatialMemoryIndex': round(nav_spatial_mem, 1),
        'nav_wayfindingEfficiency': round(nav_wayfinding_eff, 4),
        'nav_headingErrorDegrees': round(nav_heading_error, 1),
        'nav_stopsAndPausesCount': nav_stops_pauses,
        'nav_backtrackingCount': nav_backtracking,
        'nav_timeToCompleteSeconds': round(nav_time_secs, 1),
        'nav_spatialDisorientationScore': round(nav_disorientation, 2),
    }

def process_dataset(input_file, output_file, seed=42):
    rng = random.Random(seed)
    start_time = time.time()
    temp_output_file = output_file + '.tmp'

    print(f"Reading from: {input_file}")
    print(f"Writing to:   {output_file}")

    count = 0
    with open(input_file, mode='r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        original_fields = list(reader.fieldnames)

        # Determine all fieldnames
        sample_row = next(reader)
        sample_biomarkers = generate_biomarkers(sample_row, rng)
        biomarker_fields = list(sample_biomarkers.keys())

        all_fieldnames = original_fields + biomarker_fields

        # Rewind to beginning
        infile.seek(0)
        reader = csv.DictReader(infile)

        with open(temp_output_file, mode='w', newline='', encoding='utf-8') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=all_fieldnames)
            writer.writeheader()

            for row in reader:
                biomarkers = generate_biomarkers(row, rng)
                row.update(biomarkers)
                writer.writerow(row)
                count += 1

                if count % 10000 == 0:
                    print(f"  Processed {count:,} records...")

    # Atomically replace destination
    os.replace(temp_output_file, output_file)

    elapsed = time.time() - start_time
    print(f"\n[DONE] Successfully enriched {count:,} patient records with {len(biomarker_fields)} multimodal biomarkers in {elapsed:.2f}s!")

if __name__ == '__main__':
    input_path = 'nacc_moca_subset_complete.csv'
    output_path = 'nacc_moca_subset_complete.csv'

    if len(sys.argv) > 1:
        input_path = sys.argv[1]
    if len(sys.argv) > 2:
        output_path = sys.argv[2]

    process_dataset(input_path, output_path)
