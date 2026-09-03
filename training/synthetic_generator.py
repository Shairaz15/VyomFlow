import numpy as np
import pandas as pd
import json

# Configuration
NUM_SAMPLES = 5000
WINDOW_SIZE = 6
FEATURE_COUNT = 8

# Patterns
# 0: Stable
# 1: Declining
# 2: Improving

def generate_stable(length):
    base = 0.7
    noise = np.random.normal(0, 0.05, length)
    return np.clip(base + noise, 0, 1)

def generate_declining(length):
    start = 0.8
    end = 0.4
    trend = np.linspace(start, end, length)
    noise = np.random.normal(0, 0.03, length)
    return np.clip(trend + noise, 0, 1)

def generate_improving(length):
    start = 0.4
    end = 0.8
    trend = np.linspace(start, end, length)
    noise = np.random.normal(0, 0.03, length)
    return np.clip(trend + noise, 0, 1)

def generate_dataset():
    X = []
    y = [] # 0: Stable, 1: Declining, 2: Improving
    
    for _ in range(NUM_SAMPLES):
        pattern_type = np.random.choice([0, 1, 2])
        
        # Core metric simulation (Memory)
        if pattern_type == 0:
            memory = generate_stable(WINDOW_SIZE)
        elif pattern_type == 1:
            memory = generate_declining(WINDOW_SIZE)
        else:
            memory = generate_improving(WINDOW_SIZE)
            
        # Other features loosely correlated
        reaction = memory * 0.8 + np.random.normal(0, 0.1, WINDOW_SIZE)
        pattern = memory * 0.9 + np.random.normal(0, 0.1, WINDOW_SIZE)
        language = memory * 0.7 + np.random.normal(0, 0.1, WINDOW_SIZE)
        
        # Stability features
        stability = np.random.uniform(0.8, 1.0, WINDOW_SIZE)
        
        # Combined score
        combined = (memory + reaction + pattern + language) / 4
        
        # Time features
        days = np.linspace(0, 1, WINDOW_SIZE)
        slopes = np.gradient(memory) + 0.5
        
        # [memory, reaction, pattern, language, stability, combined, temporal, slope]
        features = np.stack([
            memory, reaction, pattern, language, 
            stability, combined, days, slopes
        ], axis=1)
        
        X.append(features)
        y.append(pattern_type)
        
    return np.array(X), np.array(y)

if __name__ == "__main__":
    X, y = generate_dataset()
    print(f"Generated {len(X)} samples. Shape: {X.shape}")
    
    np.savez("training_data.npz", X=X, y=y)
    print("Saved to training_data.npz")
