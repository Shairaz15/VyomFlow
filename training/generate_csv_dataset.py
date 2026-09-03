import numpy as np
import pandas as pd
import random
from datetime import datetime, timedelta

# Configuration
NUM_SUBJECTS = 1000
SESSIONS_PER_SUBJECT = 6
OUTPUT_FILE = "cognitive_population_data.csv"

# Patterns
PATTERNS = {
    'stable': 0.6,    # 60% of population
    'declining': 0.2, # 20%
    'improving': 0.1, # 10%
    'volatile': 0.1   # 10%
}

def generate_timestamps(start_date, n):
    return [start_date + timedelta(days=i*14 + random.randint(-2, 2)) for i in range(n)]

def simulate_subject(subject_id):
    # Assign a pattern profile
    pattern_type = np.random.choice(
        ['stable', 'declining', 'improving', 'volatile'], 
        p=[0.6, 0.2, 0.1, 0.1]
    )
    
    # Baseline capabilities (randomized per subject)
    baseline_memory = np.random.normal(0.7, 0.1) # 0-1
    baseline_reaction = np.random.normal(350, 50) # ms
    baseline_pattern = np.random.normal(6.0, 1.5) # Level
    baseline_language = np.random.normal(140, 20) # WPM
    
    # Generate Trends
    records = []
    start_date = datetime.now() - timedelta(days=SESSIONS_PER_SUBJECT * 14)
    timestamps = generate_timestamps(start_date, SESSIONS_PER_SUBJECT)
    
    for i in range(SESSIONS_PER_SUBJECT):
        t = i / (SESSIONS_PER_SUBJECT - 1) # 0 to 1 progress
        
        # Apply trend modifiers
        mem_mod = 0
        react_mod = 0
        
        if pattern_type == 'declining':
            mem_mod = -0.2 * t # Drops 20%
            react_mod = 50 * t # Slows down 50ms
        elif pattern_type == 'improving':
            mem_mod = 0.15 * t
            react_mod = -30 * t
        elif pattern_type == 'volatile':
            mem_mod = np.random.normal(0, 0.15)
            react_mod = np.random.normal(0, 40)
            
        # Add session noise
        noise_mem = np.random.normal(0, 0.05)
        noise_react = np.random.normal(0, 15)
        
        # Calculate final metrics
        memory_acc = np.clip(baseline_memory + mem_mod + noise_mem, 0.1, 1.0)
        reaction_time = np.clip(baseline_reaction + react_mod + noise_react, 150, 1000)
        pattern_score = np.clip(baseline_pattern + (mem_mod * 5) + np.random.normal(0, 1), 1, 10)
        language_wpm = np.clip(baseline_language + (mem_mod * 50) + np.random.normal(0, 10), 50, 250)
        
        # Derived Analysis (True Label for this subject)
        
        records.append({
            'subject_id': subject_id,
            'session_id': i + 1,
            'date': timestamps[i].strftime('%Y-%m-%d'),
            'memory_accuracy': round(memory_acc, 3),
            'reaction_time_ms': round(reaction_time, 1),
            'pattern_level': round(pattern_score, 1),
            'language_wpm': round(language_wpm, 1),
            'pattern_type': pattern_type  # The "Ground Truth"
        })
        
    return records

def generate_csv():
    all_records = []
    print(f"Generating data for {NUM_SUBJECTS} subjects...")
    
    for s in range(NUM_SUBJECTS):
        all_records.extend(simulate_subject(f"SUB_{s+1:04d}"))
        
    df = pd.DataFrame(all_records)
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"Successfully saved {len(df)} rows to {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_csv()
