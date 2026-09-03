"""
VyomFlow Synthetic Cognitive Assessment Dataset Generator
=========================================================
Generates ~10,000 assessment session rows for ~4,000-6,000 unique patients.
Each row contains:
  - 11 demographic/metadata columns
  - 16 Navigation biomarkers
  - 21 Language biomarkers
  - 16 Story Recall biomarkers
  - 19 VMRA biomarkers
  - 20 SAVT biomarkers
  - 12 Pattern Recognition biomarkers
  - 13 Reaction Time biomarkers
  - 10 Cross-Session features
  - 5 Target variables
  = ~143 total columns

Clinical realism is achieved via a latent "cognitive health" factor (0.0 = severe
dementia, 1.0 = peak healthy) that is driven by age, education, and assigned
diagnosis.  All biomarkers are then sampled conditional on this factor so that
inter-module correlations are preserved.

Author: VyomFlow ML Pipeline
"""

import csv
import math
import os
import random
import statistics
import uuid
from collections import defaultdict
from datetime import datetime, timedelta

# ─── Configuration ─────────────────────────────────────────────────
NUM_PATIENTS = 5700          # Unique patients
TARGET_ROWS  = 10000         # Total session rows (patients × sessions)
SEED         = 42
OUTPUT_DIR   = os.path.dirname(os.path.abspath(__file__))
CSV_PATH     = os.path.join(OUTPUT_DIR, "vyomflow_synthetic_10k.csv")
REPORT_PATH  = os.path.join(OUTPUT_DIR, "dataset_summary_report.md")

random.seed(SEED)

# ─── Helpers ───────────────────────────────────────────────────────

def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))

def gauss(mu, sigma):
    return random.gauss(mu, sigma)

def gauss_clamped(mu, sigma, lo=0.0, hi=1.0):
    return clamp(gauss(mu, sigma), lo, hi)

def gauss_int(mu, sigma, lo=0, hi=9999):
    return int(clamp(round(gauss(mu, sigma)), lo, hi))

def z_score(p):
    """Approximate inverse normal CDF (probit) – mirrors VyomFlow's savtScoring.ts."""
    c = max(0.001, min(0.999, p))
    if c == 0.5:
        return 0.0
    a = c if c < 0.5 else 1 - c
    t = math.sqrt(-2 * math.log(a))
    c0, c1, c2 = 2.515517, 0.802853, 0.010328
    d1, d2, d3 = 1.432788, 0.189269, 0.001308
    z = t - (c0 + c1*t + c2*t*t) / (1 + d1*t + d2*t*t + d3*t*t*t)
    return -z if c < 0.5 else z

# ─── Demographic Constants ─────────────────────────────────────────

LANGUAGES = [
    "Hindi", "English", "Tamil", "Telugu", "Kannada",
    "Bengali", "Marathi", "Gujarati", "Malayalam", "Punjabi",
    "Odia", "Assamese", "Urdu"
]
LANGUAGE_WEIGHTS = [25, 20, 8, 8, 5, 8, 7, 4, 4, 3, 3, 2, 3]

REGIONS = [
    "Delhi NCR", "Maharashtra", "Tamil Nadu", "Karnataka",
    "West Bengal", "Uttar Pradesh", "Gujarat", "Rajasthan",
    "Kerala", "Telangana", "Madhya Pradesh", "Andhra Pradesh",
    "Punjab", "Assam", "Odisha", "Bihar", "Jharkhand",
    "Chhattisgarh", "Uttarakhand", "Goa"
]

OCCUPATIONS = [
    "Professional/IT", "Government", "Business/Trade",
    "Agriculture", "Healthcare", "Education", "Homemaker",
    "Retired", "Student", "Manual Labour", "Self-employed"
]

DEVICES = ["Android Phone", "iPhone", "Android Tablet", "iPad", "Desktop/Laptop"]
DEVICE_WEIGHTS = [45, 20, 10, 8, 17]

GENDERS = ["Male", "Female", "Other"]
GENDER_WEIGHTS = [48, 50, 2]

DIAGNOSES = ["Normal", "MCI", "Dementia"]
DIAGNOSIS_WEIGHTS = [65, 25, 10]  # Realistic prevalence

# ─── Latent Cognitive Health Factor ────────────────────────────────

def compute_cognitive_health(age, education, diagnosis):
    """
    Returns a latent health factor h ∈ [0, 1].
    h = 1.0  → peak cognitive performance
    h = 0.0  → severe impairment
    """
    # Age effect: gentle decline after 50, steeper after 70
    if age < 30:
        age_factor = 1.0
    elif age < 50:
        age_factor = 1.0 - (age - 30) * 0.003
    elif age < 70:
        age_factor = 0.94 - (age - 50) * 0.008
    else:
        age_factor = 0.78 - (age - 70) * 0.015

    # Education protective effect (0-20 years)
    edu_factor = 0.85 + (education / 20) * 0.15

    # Diagnosis-driven shift
    if diagnosis == "Normal":
        diag_shift = gauss(0.0, 0.04)
    elif diagnosis == "MCI":
        diag_shift = gauss(-0.20, 0.06)
    else:  # Dementia
        diag_shift = gauss(-0.45, 0.08)

    h = age_factor * edu_factor + diag_shift
    return clamp(h, 0.05, 1.0)


# ─── Module Generators ────────────────────────────────────────────
# Each takes cognitive health h ∈ [0,1] and returns a dict of biomarkers.

def gen_navigation(h):
    """Immersive Navigation & Spatial Memory (16 biomarkers)."""
    dest_recall = 1 if random.random() < (0.55 + 0.45 * h) else 0
    nav_acc = gauss_clamped(0.35 + 0.60 * h, 0.12)
    wrong_turns = max(0, round(6 * (1 - nav_acc)))
    correct_rate = nav_acc

    avg_latency = gauss_int(2000 + 4500 * (1 - h), 800 * (1.3 - h), 500, 15000)
    max_latency = gauss_int(avg_latency * (1.3 + 0.7 * (1 - h)), avg_latency * 0.3, avg_latency, 25000)
    lat_variance = gauss_int(avg_latency * (0.2 + 0.6 * (1 - h)), avg_latency * 0.1, 0, 50000000)
    hesitation = gauss_int(1.5 + 4 * (1 - h), 1.2, 0, 6)

    landmark_rec = gauss_clamped(0.40 + 0.55 * h, 0.12)
    false_lm = gauss_clamped(0.05 + 0.35 * (1 - h), 0.08, 0, 1)
    landmark_seq = gauss_clamped(0.25 + 0.65 * h, 0.14)
    chrono = 0.70 * landmark_seq + 0.30 * landmark_rec
    route_mem = 0.70 * nav_acc + 0.30 * dest_recall
    vis_attn = max(0, landmark_rec * (1 - 0.5 * false_lm))
    episodic = 0.60 * chrono + 0.40 * dest_recall

    # Final navigation score (mirrors BiomarkerEngine.ts)
    norm_lat = clamp(1 - (avg_latency - 2000) / 6000)
    false_ret = max(0, 1 - false_lm)
    raw = (nav_acc * 0.30 + landmark_rec * 0.20 + chrono * 0.20 +
           norm_lat * 0.15 + dest_recall * 0.10 + false_ret * 0.05)
    nav_score = round(clamp(raw * 100, 0, 100))

    return {
        "nav_destinationRecallAccuracy": dest_recall,
        "nav_navigationAccuracy": round(nav_acc, 3),
        "nav_wrongTurnCount": wrong_turns,
        "nav_correctDecisionRate": round(correct_rate, 3),
        "nav_averageDecisionLatencyMs": avg_latency,
        "nav_maxDecisionLatencyMs": max_latency,
        "nav_decisionLatencyVariance": lat_variance,
        "nav_hesitationCount": hesitation,
        "nav_landmarkRecognitionAccuracy": round(landmark_rec, 3),
        "nav_falseLandmarkRate": round(false_lm, 3),
        "nav_landmarkSequenceAccuracy": round(landmark_seq, 3),
        "nav_chronologicalRecallScore": round(chrono, 3),
        "nav_routeMemoryScore": round(route_mem, 3),
        "nav_visualAttentionScore": round(vis_attn, 3),
        "nav_episodicMemoryScore": round(episodic, 3),
        "nav_navigationScore": nav_score,
    }


def gen_language(h):
    """Multilingual Spontaneous Language Assessment (21 biomarkers)."""
    duration_ms = gauss_int(45000 + 15000 * h, 12000, 15000, 180000)
    duration_min = duration_ms / 60000

    wpm = gauss(90 + 70 * h, 18)
    wpm = max(20, min(220, wpm))
    word_count = max(5, round(wpm * duration_min))

    pause_count = gauss_int(3 + 15 * (1 - h), 4, 0, 50)
    pause_total_ms = gauss_int(pause_count * (350 + 400 * (1 - h)), pause_count * 100, 0, duration_ms * 0.6)
    avg_pause = round(pause_total_ms / max(1, pause_count))

    active_speech_ms = max(5000, duration_ms - pause_total_ms)
    active_speech_min = active_speech_ms / 60000

    filler_count = gauss_int(2 + 12 * (1 - h), 3, 0, 40)
    repetitions = gauss_int(0.5 + 5 * (1 - h), 1.5, 0, 20)
    unique_words = max(3, round(word_count * gauss_clamped(0.45 + 0.30 * h, 0.08, 0.2, 0.95)))

    art_rate = word_count / max(0.05, active_speech_min)
    phonation_ratio = clamp(active_speech_ms / max(1, duration_ms), 0.1, 1.0)
    lex_div = unique_words / max(1, word_count)
    root_ttr = min(1.0, (unique_words / max(1, math.sqrt(word_count))) / 6.5)

    hes_events = filler_count + 1.5 * repetitions + 0.5 * pause_count
    hes_index = hes_events / max(1, word_count)

    # Fluency score (mirrors languageFeatures.ts)
    fluency = 100
    fluency -= min(60, hes_index * 150)
    if 0 < wpm < 110:
        fluency -= (110 - wpm) * 0.45
    elif wpm > 175:
        fluency -= (wpm - 175) * 0.35
    fluency_index = max(10, min(100, round(fluency)))

    speech_stability = max(10, min(100, round(phonation_ratio * 60 + max(0, 1 - hes_index) * 40)))

    semantic_coh = gauss_int(50 + 45 * h, 12, 30, 100)
    syntactic_cx = gauss_int(50 + 40 * h, 12, 20, 100)
    idea_density = gauss_clamped(0.35 + 0.30 * h, 0.08, 0.1, 0.85)

    # CSI composite (mirrors languageFeatures.ts)
    acoustic_sc = min(100, phonation_ratio * 85 + (15 if pause_count <= 4 else max(0, 15 - (pause_count - 4) * 3)))
    lexical_sc = min(100, root_ttr * 70 + lex_div * 30)
    csi_raw = (fluency_index * 0.30 + acoustic_sc * 0.25 + lexical_sc * 0.20 +
               semantic_coh * 0.15 + syntactic_cx * 0.10)
    csi = max(10, min(100, round(csi_raw)))

    return {
        "lang_wordCount": word_count,
        "lang_speechDurationMs": duration_ms,
        "lang_activeSpeechDurationMs": active_speech_ms,
        "lang_pauseCount": pause_count,
        "lang_pauseDurationTotalMs": pause_total_ms,
        "lang_averagePauseDuration": avg_pause,
        "lang_fillerWordCount": filler_count,
        "lang_repetitions": repetitions,
        "lang_uniqueWordCount": unique_words,
        "lang_WPM": round(wpm, 1),
        "lang_articulationRate": round(art_rate, 1),
        "lang_phonationRatio": round(phonation_ratio, 2),
        "lang_lexicalDiversity": round(lex_div, 3),
        "lang_rootTTR": round(root_ttr, 3),
        "lang_hesitationIndex": round(hes_index, 3),
        "lang_fluencyIndex": fluency_index,
        "lang_speechStability": speech_stability,
        "lang_semanticCoherence": semantic_coh,
        "lang_syntacticComplexity": syntactic_cx,
        "lang_ideaDensity": round(idea_density, 2),
        "lang_cognitiveSpeechIndex": csi,
    }


def gen_story(h):
    """Story Narration & Auditory Recall (16 biomarkers)."""
    total_units = random.choice([8, 10, 12])
    recalled = gauss_int(total_units * (0.25 + 0.65 * h), total_units * 0.12, 0, total_units)
    recall_acc = recalled / total_units
    omissions = total_units - recalled
    false_recalls = gauss_int(0.5 + 3 * (1 - h), 1, 0, 8)

    total_q = random.choice([3, 4, 5])
    correct_q = gauss_int(total_q * (0.3 + 0.65 * h), total_q * 0.12, 0, total_q)
    mcq_acc = correct_q / total_q
    avg_resp_ms = gauss_int(3000 + 5000 * (1 - h), 1500, 1000, 20000)

    seq_score = gauss_clamped(0.30 + 0.60 * h, 0.14)
    narr_complete = (recall_acc + gauss_clamped(0.30 + 0.55 * h, 0.10)) / 2

    jaccard = gauss_clamped(0.15 + 0.50 * h, 0.10, 0, 1)
    levenshtein = gauss_clamped(0.10 + 0.55 * h, 0.12, 0, 1)
    similarity = (jaccard + levenshtein) / 2

    speech_wpm = gauss(80 + 60 * h, 18)
    speech_wpm = max(15, min(200, speech_wpm))
    lex_div = gauss_clamped(0.40 + 0.30 * h, 0.08, 0.15, 0.95)
    hes_rate = gauss_clamped(0.05 + 0.25 * (1 - h), 0.06, 0, 0.8)
    pause_freq = gauss(3 + 10 * (1 - h), 3)
    pause_freq = max(0, min(30, pause_freq))

    # Story recall score (mirrors StoryScoring.ts)
    wpm_sc = min(1.0, speech_wpm / 120)
    div_sc = min(1.0, lex_div)
    flu_sc = max(0, 1 - hes_rate)
    speech_bio = wpm_sc * 0.40 + div_sc * 0.30 + flu_sc * 0.30

    info_units_score = recall_acc  # simplified weight
    raw = (mcq_acc * 0.40 + recall_acc * 0.20 + info_units_score * 0.15 +
           speech_bio * 0.15 + seq_score * 0.05 + similarity * 0.05)
    base = mcq_acc * 50
    bonus = raw * 50
    story_score = round(clamp(base + bonus, 25, 100))

    return {
        "story_recallAccuracy": round(recall_acc, 3),
        "story_informationUnitsRecalled": recalled,
        "story_omissionCount": omissions,
        "story_falseRecallCount": false_recalls,
        "story_mcqAccuracy": round(mcq_acc, 3),
        "story_averageResponseTimeMs": avg_resp_ms,
        "story_storySequenceScore": round(seq_score, 3),
        "story_narrativeCompleteness": round(narr_complete, 3),
        "story_semanticSimilarity": round(similarity, 3),
        "story_JaccardSimilarity": round(jaccard, 3),
        "story_LevenshteinSimilarity": round(levenshtein, 3),
        "story_speechRateWPM": round(speech_wpm, 1),
        "story_lexicalDiversity": round(lex_div, 3),
        "story_hesitationRate": round(hes_rate, 3),
        "story_pauseFrequency": round(pause_freq, 1),
        "story_storyRecallScore": story_score,
    }


def gen_vmra(h):
    """Visual Memory Recall Assessment (19 biomarkers)."""
    n_targets = random.choice([5, 6, 7, 8])
    n_distractors = n_targets
    total_grid = n_targets + n_distractors

    correct_hits = gauss_int(n_targets * (0.25 + 0.65 * h), n_targets * 0.12, 0, n_targets)
    false_pos = gauss_int(n_distractors * (0.05 + 0.30 * (1 - h)), n_distractors * 0.08, 0, n_distractors)
    misses = n_targets - correct_hits
    correct_rej = n_distractors - false_pos

    recall_acc = correct_hits / n_targets
    fp_rate = false_pos / n_distractors
    prec = correct_hits / max(1, correct_hits + false_pos)
    f1 = (2 * prec * recall_acc / max(0.001, prec + recall_acc)) if (prec + recall_acc) > 0 else 0
    net_recall = max(0, correct_hits - false_pos)

    first_tap = gauss_int(1500 + 4000 * (1 - h), 1000, 300, 15000)
    mean_sel_lat = gauss_int(first_tap * 1.5 + 2000 * (1 - h), 800, 400, 20000)
    inter_tap = gauss_int(800 + 2500 * (1 - h), 500, 200, 10000)
    lat_var = gauss_int(mean_sel_lat * (0.2 + 0.5 * (1 - h)), mean_sel_lat * 0.1, 0, 15000)

    primacy = gauss_clamped(0.50 + 0.40 * h, 0.18)
    recency = gauss_clamped(0.55 + 0.35 * h, 0.18)
    mid_deficit = gauss_clamped(0.20 + 0.50 * (1 - h), 0.15)

    intrusions = gauss_int(0.3 + 3 * (1 - h), 1, 0, 8)
    confusion_pairs = gauss_int(0.2 + 2.5 * (1 - h), 0.8, 0, 6)

    # Spatial bias: proportion in dominant quadrant
    spatial_bias = gauss_clamped(0.25 + 0.15 * random.random(), 0.08, 0, 1)
    grid_cov = gauss_clamped(0.40 + 0.40 * h, 0.12, 0.1, 1)

    delayed_ratio = gauss_clamped(0.60 + 0.35 * h, 0.12, 0.1, 1.2)
    forgetting_slope = gauss(-0.005 - 0.025 * (1 - h), 0.008)
    forgetting_slope = max(-0.15, min(0.02, forgetting_slope))

    # Composite (mirrors vmraScoring.ts)
    norm_lat = clamp(1 - (mean_sel_lat - 500) / 4500)
    composite = round(clamp((recall_acc * 0.50 + norm_lat * 0.25 + 1.0 * 0.25) * 100, 0, 100))

    return {
        "vmra_recallAccuracy": round(recall_acc, 3),
        "vmra_falsePositiveRate": round(fp_rate, 3),
        "vmra_precision": round(prec, 3),
        "vmra_F1Score": round(f1, 3),
        "vmra_netRecallScore": net_recall,
        "vmra_firstTapLatency": first_tap,
        "vmra_meanSelectionLatency": mean_sel_lat,
        "vmra_interTapInterval": inter_tap,
        "vmra_latencyVariance": lat_var,
        "vmra_primacyBias": round(primacy, 3),
        "vmra_recencyBias": round(recency, 3),
        "vmra_midListDeficit": round(mid_deficit, 3),
        "vmra_intrusionErrors": intrusions,
        "vmra_confusionPairs": confusion_pairs,
        "vmra_spatialBias": round(spatial_bias, 3),
        "vmra_gridCoverage": round(grid_cov, 3),
        "vmra_delayedRecallRatio": round(delayed_ratio, 3),
        "vmra_forgettingCurveSlope": round(forgetting_slope, 4),
        "vmra_compositeMemoryScore": composite,
    }


def gen_savt(h):
    """Sustained Attention & Vigilance Task – Go/No-Go (20 biomarkers)."""
    total_trials = 40
    go_ratio = 0.70
    total_go = round(total_trials * go_ratio)
    total_nogo = total_trials - total_go

    hit_prob = gauss_clamped(0.45 + 0.50 * h, 0.10)
    fa_prob = gauss_clamped(0.05 + 0.30 * (1 - h), 0.08)

    hits = gauss_int(total_go * hit_prob, total_go * 0.08, 0, total_go)
    misses = total_go - hits
    false_alarms = gauss_int(total_nogo * fa_prob, total_nogo * 0.06, 0, total_nogo)
    correct_rej = total_nogo - false_alarms

    # Log-linear corrected rates (mirrors savtScoring.ts)
    hit_rate = (hits + 0.5) / (total_go + 1)
    fa_rate = (false_alarms + 0.5) / (total_nogo + 1)

    d_prime = z_score(hit_rate) - z_score(fa_rate)
    resp_bias = math.exp(-0.5 * (z_score(hit_rate)**2 - z_score(fa_rate)**2))

    omission_rate = misses / max(1, total_go)
    commission_rate = false_alarms / max(1, total_nogo)

    mean_rt = gauss_int(350 + 400 * (1 - h), 80, 150, 1400)
    median_rt = gauss_int(mean_rt * 0.95, 40, 150, 1400)
    rt_sd = gauss_int(mean_rt * (0.15 + 0.25 * (1 - h)), 20, 10, 500)
    rt_cv = round(rt_sd / max(1, mean_rt), 2)

    # Block-level vigilance
    block_hit_rates = []
    base_hr = hit_rate
    for b in range(4):
        decay = b * gauss(-0.03 * (1 - h), 0.015)
        block_hit_rates.append(clamp(base_hr + decay, 0.1, 1.0))

    # Vigilance decrement (slope of block hit rates)
    if len(block_hit_rates) >= 2:
        n = len(block_hit_rates)
        indices = list(range(n))
        sum_x = sum(indices)
        sum_y = sum(block_hit_rates)
        sum_xy = sum(i * block_hit_rates[i] for i in range(n))
        sum_x2 = sum(i * i for i in range(n))
        denom = n * sum_x2 - sum_x * sum_x
        vig_dec = (n * sum_xy - sum_x * sum_y) / denom if denom != 0 else 0
    else:
        vig_dec = 0

    if len(block_hit_rates) > 1:
        bhr_mean = sum(block_hit_rates) / len(block_hit_rates)
        bhr_var = sum((v - bhr_mean)**2 for v in block_hit_rates) / (len(block_hit_rates) - 1)
    else:
        bhr_var = 0
    vig_stab = clamp(1 - bhr_var * 4)

    # Profile scores (mirrors savtFeatures.ts)
    attn_score = round(((1 - omission_rate) * 0.60 + hit_rate * 0.40) * 100)
    inhib_score = round(((1 - commission_rate) * 0.60 + (1 - fa_rate) * 0.40) * 100)
    dec_penalty = max(0, -vig_dec * 200)
    vig_score = round(clamp(vig_stab * 100 - dec_penalty, 0, 100))
    composite = round(attn_score * 0.35 + inhib_score * 0.35 + vig_score * 0.30)

    return {
        "savt_hits": hits,
        "savt_misses": misses,
        "savt_falseAlarms": false_alarms,
        "savt_correctRejections": correct_rej,
        "savt_hitRate": round(hit_rate, 3),
        "savt_falseAlarmRate": round(fa_rate, 3),
        "savt_dPrime": round(d_prime, 2),
        "savt_responseBias": round(resp_bias, 2),
        "savt_omissionErrorRate": round(omission_rate, 3),
        "savt_commissionErrorRate": round(commission_rate, 3),
        "savt_meanResponseTime": mean_rt,
        "savt_medianResponseTime": median_rt,
        "savt_rtVariability": rt_sd,
        "savt_coefficientOfVariation": rt_cv,
        "savt_vigilanceDecrement": round(vig_dec, 4),
        "savt_vigilanceStability": round(vig_stab, 3),
        "savt_attentionScore": clamp(attn_score, 0, 100),
        "savt_inhibitionScore": clamp(inhib_score, 0, 100),
        "savt_vigilanceScore": clamp(vig_score, 0, 100),
        "savt_compositeSAVTScore": clamp(composite, 0, 100),
    }


def gen_pattern(h):
    """Visual Sequence Memory & Pattern Recognition (12 biomarkers)."""
    max_level = gauss_int(2 + 6 * h, 1.2, 1, 10)
    total_rounds = gauss_int(max_level + 2 + random.randint(0, 3), 1, max_level, 15)
    correct_rounds = gauss_int(total_rounds * (0.3 + 0.6 * h), total_rounds * 0.1, 1, total_rounds)
    resp_lat = gauss_int(800 + 2000 * (1 - h), 400, 200, 8000)
    comp_time = gauss_int(resp_lat * (1.5 + 1.5 * (1 - h)), 500, 500, 15000)
    input_errors = total_rounds - correct_rounds

    learning_rate = gauss(5 + 30 * h, 8)
    learning_rate = max(-20, min(60, learning_rate))
    mem_load_tol = gauss_clamped(20 + 70 * h, 15, 0, 100)
    pat_stab = gauss(40 + 50 * h, 12)
    pat_stab = max(0, min(100, pat_stab))
    error_growth = gauss(-0.1 + 0.6 * (1 - h), 0.15)
    error_growth = max(-0.5, min(2.0, error_growth))
    seq_acc_trend = gauss(0.1 * h - 0.05 * (1 - h), 0.03)

    # Normative pattern score
    if max_level >= 6:
        pat_score = gauss_int(90, 5, 80, 100)
    elif max_level >= 4:
        pat_score = gauss_int(75, 8, 55, 90)
    elif max_level >= 2:
        pat_score = gauss_int(58, 8, 35, 75)
    else:
        pat_score = gauss_int(38, 8, 15, 55)

    return {
        "pat_maxSequenceSpan": max_level,
        "pat_totalRounds": total_rounds,
        "pat_correctRounds": correct_rounds,
        "pat_responseLatency": resp_lat,
        "pat_completionTime": comp_time,
        "pat_inputErrors": input_errors,
        "pat_learningRate": round(learning_rate, 1),
        "pat_memoryLoadTolerance": round(mem_load_tol, 1),
        "pat_patternStability": round(pat_stab, 1),
        "pat_errorGrowthRate": round(error_growth, 3),
        "pat_sequenceAccuracyTrend": round(seq_acc_trend, 4),
        "pat_patternScore": pat_score,
    }


def gen_reaction(h):
    """Psychomotor Simple Reaction Time (13 biomarkers)."""
    mean_rt = gauss_int(220 + 280 * (1 - h), 45, 150, 800)
    median_rt = gauss_int(mean_rt * 0.95, 25, 130, 780)
    min_rt = gauss_int(mean_rt * 0.65, 20, 100, mean_rt)
    max_rt = gauss_int(mean_rt * 1.45 + 100 * (1 - h), 50, mean_rt, 1500)

    variance = gauss_int(mean_rt * (0.1 + 0.4 * (1 - h)), mean_rt * 0.05, 50, 80000)
    sd = math.sqrt(max(1, variance))
    cv = sd / max(1, mean_rt)
    consistency = clamp(1 - cv)

    fatigue_slope = gauss(2 + 12 * (1 - h), 4)
    fatigue_slope = max(-5, min(40, fatigue_slope))

    false_starts = gauss_int(0.3 + 2 * (1 - h), 0.8, 0, 5)
    missed = gauss_int(0.2 + 2.5 * (1 - h), 0.7, 0, 5)

    stability = clamp(1 - cv)
    attn_var = (false_starts + missed) / 5 + cv / 2

    baseline_dev = gauss(0.05 * (1 - h), 0.08)
    baseline_dev = max(-0.3, min(0.5, baseline_dev))

    anom = 0
    if baseline_dev > 0.2: anom += 0.3
    if fatigue_slope > 10: anom += 0.2
    if attn_var > 0.3: anom += 0.2
    if stability < 0.5: anom += 0.3
    anom = min(1, anom)

    return {
        "rxn_meanReactionTime": mean_rt,
        "rxn_medianReactionTime": median_rt,
        "rxn_minimumReactionTime": min_rt,
        "rxn_maximumReactionTime": max_rt,
        "rxn_reactionVariance": variance,
        "rxn_consistencyScore": round(consistency, 2),
        "rxn_fatigueSlope": round(fatigue_slope, 2),
        "rxn_falseStarts": false_starts,
        "rxn_missedStimuli": missed,
        "rxn_stabilityIndex": round(stability, 2),
        "rxn_attentionVariability": round(attn_var, 3),
        "rxn_baselineDeviation": round(baseline_dev, 3),
        "rxn_anomalyScore": round(anom, 2),
    }


# ─── Target Variable Generation ───────────────────────────────────

def gen_moca(h, diagnosis):
    """
    Simulated Montreal Cognitive Assessment score (0-30).
    Normal: 26-30, MCI: 18-25, Dementia: 0-17
    """
    if diagnosis == "Normal":
        moca = gauss_int(27 + 2 * h, 1.5, 24, 30)
    elif diagnosis == "MCI":
        moca = gauss_int(21 + 3 * h, 2, 14, 26)
    else:
        moca = gauss_int(10 + 5 * h, 3, 0, 18)
    return moca


def gen_domain_scores(h):
    """Generate domain-level composite scores (0-100)."""
    return {
        "target_memoryDomain": gauss_int(40 + 55 * h, 10, 5, 100),
        "target_attentionDomain": gauss_int(45 + 50 * h, 10, 5, 100),
        "target_languageDomain": gauss_int(45 + 50 * h, 10, 5, 100),
        "target_executiveFunctionDomain": gauss_int(40 + 55 * h, 10, 5, 100),
    }


def gen_risk_level(moca, diagnosis):
    """Map to risk level."""
    if diagnosis == "Dementia" or moca < 18:
        return "High"
    elif diagnosis == "MCI" or moca < 24:
        return "Moderate"
    else:
        return "Low"


# ─── Cross-Session Feature Generation ─────────────────────────────

def gen_cross_session(session_idx, prev_scores, h, diagnosis):
    """Generate longitudinal/cross-session features."""
    if session_idx == 1 or not prev_scores:
        return {
            "cross_previousSessionScore": -1,     # sentinel for first session
            "cross_previousMoCAEstimate": -1,
            "cross_memoryTrend": 0.0,
            "cross_reactionTrend": 0.0,
            "cross_languageTrend": 0.0,
            "cross_navigationTrend": 0.0,
            "cross_patternTrend": 0.0,
            "cross_savtTrend": 0.0,
            "cross_zScoreFromBaseline": 0.0,
            "cross_anomalyScore": 0.0,
        }

    prev = prev_scores[-1]
    trend_noise = 0.02 if diagnosis == "Normal" else (0.04 if diagnosis == "MCI" else 0.06)
    decline = 0 if diagnosis == "Normal" else (-0.02 if diagnosis == "MCI" else -0.05)

    return {
        "cross_previousSessionScore": prev.get("nav_score", 50),
        "cross_previousMoCAEstimate": prev.get("moca", 25),
        "cross_memoryTrend": round(gauss(decline, trend_noise), 3),
        "cross_reactionTrend": round(gauss(decline * 50, trend_noise * 50), 2),
        "cross_languageTrend": round(gauss(decline, trend_noise), 3),
        "cross_navigationTrend": round(gauss(decline, trend_noise), 3),
        "cross_patternTrend": round(gauss(decline, trend_noise), 3),
        "cross_savtTrend": round(gauss(decline, trend_noise), 3),
        "cross_zScoreFromBaseline": round(gauss(0 + 0.5 * (1 - h), 0.4), 2),
        "cross_anomalyScore": round(gauss_clamped(0.1 + 0.4 * (1 - h), 0.15), 2),
    }


# ─── Main Generation Loop ─────────────────────────────────────────

def generate_dataset():
    print(f"[VyomFlow Synthetic Generator] Seed={SEED}")
    print(f"[VyomFlow Synthetic Generator] Target: {NUM_PATIENTS} patients, ~{TARGET_ROWS} rows")

    # Decide how many sessions each patient gets
    session_counts = []
    remaining = TARGET_ROWS
    for i in range(NUM_PATIENTS):
        if remaining <= 0:
            break
        # ~55% single, ~25% two, ~12% three, ~5% four, ~3% five
        r = random.random()
        if r < 0.55:
            n = 1
        elif r < 0.80:
            n = 2
        elif r < 0.92:
            n = 3
        elif r < 0.97:
            n = 4
        else:
            n = 5
        n = min(n, remaining)
        session_counts.append(n)
        remaining -= n

    actual_patients = len(session_counts)
    actual_rows = sum(session_counts)
    print(f"[VyomFlow Synthetic Generator] Actual: {actual_patients} patients, {actual_rows} rows")

    all_rows = []
    col_stats = defaultdict(list)

    for patient_idx in range(actual_patients):
        pid = f"VF-{patient_idx+1:05d}"

        # Demographics (stable per patient)
        age = gauss_int(55, 16, 18, 90)
        gender = random.choices(GENDERS, weights=GENDER_WEIGHTS, k=1)[0]
        education = gauss_int(12, 4, 0, 22)
        language = random.choices(LANGUAGES, weights=LANGUAGE_WEIGHTS, k=1)[0]
        region = random.choice(REGIONS)
        urban_rural = "Urban" if random.random() < 0.62 else "Rural"

        # Adjust occupation by age
        if age < 25:
            occupation = random.choices(
                ["Student", "Professional/IT", "Manual Labour"],
                weights=[60, 25, 15], k=1
            )[0]
        elif age > 65:
            occupation = random.choices(
                ["Retired", "Homemaker", "Agriculture", "Self-employed"],
                weights=[50, 20, 15, 15], k=1
            )[0]
        else:
            occupation = random.choice(OCCUPATIONS)

        device = random.choices(DEVICES, weights=DEVICE_WEIGHTS, k=1)[0]

        # Diagnosis (stable per patient)
        diagnosis = random.choices(DIAGNOSES, weights=DIAGNOSIS_WEIGHTS, k=1)[0]

        # Skew diagnosis by age
        if age < 40 and diagnosis != "Normal":
            if random.random() < 0.85:
                diagnosis = "Normal"
        elif age > 75 and diagnosis == "Normal":
            if random.random() < 0.25:
                diagnosis = "MCI"

        n_sessions = session_counts[patient_idx]
        base_date = datetime(2025, 1, 1) + timedelta(days=random.randint(0, 500))
        prev_scores = []

        for sess in range(1, n_sessions + 1):
            days_since_first = 0 if sess == 1 else (sess - 1) * random.randint(14, 90)

            # Cognitive health (slight drift across sessions for MCI/Dementia)
            session_decay = 0 if diagnosis == "Normal" else -0.01 * (sess - 1)
            h = compute_cognitive_health(age, education, diagnosis) + session_decay
            h = clamp(h, 0.05, 1.0)

            # Generate all module biomarkers
            nav = gen_navigation(h)
            lang = gen_language(h)
            story = gen_story(h)
            vmra = gen_vmra(h)
            savt = gen_savt(h)
            pat = gen_pattern(h)
            rxn = gen_reaction(h)

            # Cross-session
            cross = gen_cross_session(sess, prev_scores, h, diagnosis)

            # Targets
            moca = gen_moca(h, diagnosis)
            risk = gen_risk_level(moca, diagnosis)
            domains = gen_domain_scores(h)
            confidence = round(gauss_clamped(0.5 + 0.4 * h, 0.12, 0.2, 0.98), 2)

            # Store for next session's cross-session features
            prev_scores.append({
                "nav_score": nav["nav_navigationScore"],
                "moca": moca,
            })

            # Assemble row
            row = {}

            # 1. Metadata
            row["patientId"] = pid
            row["age"] = age
            row["gender"] = gender
            row["yearsOfEducation"] = education
            row["primaryLanguage"] = language
            row["region"] = region
            row["urbanRural"] = urban_rural
            row["occupationCategory"] = occupation
            row["deviceType"] = device
            row["assessmentSessionNumber"] = sess
            row["daysSinceFirstAssessment"] = days_since_first

            # 2-8. Module biomarkers
            row.update(nav)
            row.update(lang)
            row.update(story)
            row.update(vmra)
            row.update(savt)
            row.update(pat)
            row.update(rxn)

            # 9. Cross-session
            row.update(cross)

            # 10. Targets
            row["target_mocaScore"] = moca
            row["target_diagnosis"] = diagnosis
            row["target_cognitiveRiskLevel"] = risk
            row.update(domains)
            row["target_confidenceScore"] = confidence

            all_rows.append(row)

            # Collect stats for numeric columns
            for k, v in row.items():
                if isinstance(v, (int, float)):
                    col_stats[k].append(v)

    return all_rows, col_stats


def write_csv(rows):
    """Write all rows to CSV."""
    os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
    if not rows:
        print("ERROR: No rows to write!")
        return

    fieldnames = list(rows[0].keys())
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"[VyomFlow] CSV written: {CSV_PATH}")
    print(f"[VyomFlow] Rows: {len(rows)} | Columns: {len(fieldnames)}")


def write_report(rows, col_stats):
    """Generate a markdown summary report."""
    n_rows = len(rows)
    n_cols = len(rows[0]) if rows else 0

    # Count unique patients
    patients = set(r["patientId"] for r in rows)

    # Diagnosis distribution
    diag_counts = defaultdict(int)
    for r in rows:
        diag_counts[r["target_diagnosis"]] += 1

    # Risk distribution
    risk_counts = defaultdict(int)
    for r in rows:
        risk_counts[r["target_cognitiveRiskLevel"]] += 1

    # Session distribution
    sess_counts = defaultdict(int)
    for r in rows:
        sess_counts[r["assessmentSessionNumber"]] += 1

    lines = []
    lines.append("# VyomFlow Synthetic Dataset – Summary Report")
    lines.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"**Seed:** {SEED}")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Overview")
    lines.append(f"| Metric | Value |")
    lines.append(f"| :--- | :--- |")
    lines.append(f"| **Total Rows** | {n_rows:,} |")
    lines.append(f"| **Total Columns** | {n_cols} |")
    lines.append(f"| **Unique Patients** | {len(patients):,} |")
    lines.append(f"| **File** | `{os.path.basename(CSV_PATH)}` |")
    lines.append("")

    lines.append("## Diagnosis Distribution")
    lines.append("| Diagnosis | Count | Percentage |")
    lines.append("| :--- | ---: | ---: |")
    for d in ["Normal", "MCI", "Dementia"]:
        c = diag_counts.get(d, 0)
        lines.append(f"| {d} | {c:,} | {c/n_rows*100:.1f}% |")
    lines.append("")

    lines.append("## Cognitive Risk Level Distribution")
    lines.append("| Risk Level | Count | Percentage |")
    lines.append("| :--- | ---: | ---: |")
    for r in ["Low", "Moderate", "High"]:
        c = risk_counts.get(r, 0)
        lines.append(f"| {r} | {c:,} | {c/n_rows*100:.1f}% |")
    lines.append("")

    lines.append("## Session Distribution")
    lines.append("| Session # | Count |")
    lines.append("| :--- | ---: |")
    for s in sorted(sess_counts.keys()):
        lines.append(f"| Session {s} | {sess_counts[s]:,} |")
    lines.append("")

    # Column statistics for numeric columns
    lines.append("## Numeric Column Statistics")
    lines.append("")
    lines.append("| Column | Min | Median | Mean | Max | Std Dev |")
    lines.append("| :--- | ---: | ---: | ---: | ---: | ---: |")

    for col_name in sorted(col_stats.keys()):
        vals = col_stats[col_name]
        if not vals:
            continue
        mn = min(vals)
        mx = max(vals)
        mean_v = sum(vals) / len(vals)
        sorted_v = sorted(vals)
        mid = len(sorted_v) // 2
        median_v = sorted_v[mid] if len(sorted_v) % 2 else (sorted_v[mid-1] + sorted_v[mid]) / 2
        if len(vals) > 1:
            sd = statistics.stdev(vals)
        else:
            sd = 0
        lines.append(f"| `{col_name}` | {mn:.2f} | {median_v:.2f} | {mean_v:.2f} | {mx:.2f} | {sd:.2f} |")

    lines.append("")
    lines.append("## Column Groups")
    lines.append("")

    groups = {
        "Metadata": [k for k in rows[0].keys() if not k.startswith(("nav_","lang_","story_","vmra_","savt_","pat_","rxn_","cross_","target_"))],
        "Navigation (nav_)": [k for k in rows[0].keys() if k.startswith("nav_")],
        "Language (lang_)": [k for k in rows[0].keys() if k.startswith("lang_")],
        "Story Recall (story_)": [k for k in rows[0].keys() if k.startswith("story_")],
        "VMRA (vmra_)": [k for k in rows[0].keys() if k.startswith("vmra_")],
        "SAVT (savt_)": [k for k in rows[0].keys() if k.startswith("savt_")],
        "Pattern (pat_)": [k for k in rows[0].keys() if k.startswith("pat_")],
        "Reaction (rxn_)": [k for k in rows[0].keys() if k.startswith("rxn_")],
        "Cross-Session (cross_)": [k for k in rows[0].keys() if k.startswith("cross_")],
        "Targets (target_)": [k for k in rows[0].keys() if k.startswith("target_")],
    }

    for grp_name, cols in groups.items():
        lines.append(f"### {grp_name} ({len(cols)} columns)")
        lines.append(f"`{'`, `'.join(cols)}`")
        lines.append("")

    lines.append("---")
    lines.append("*This dataset is synthetically generated for ML pipeline development and does not represent real patient data.*")

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"[VyomFlow] Report written: {REPORT_PATH}")


# ─── Entry Point ───────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  VyomFlow Synthetic Dataset Generator v1.0")
    print("=" * 60)
    rows, stats = generate_dataset()
    write_csv(rows)
    write_report(rows, stats)
    print("=" * 60)
    print("  DONE")
    print("=" * 60)
