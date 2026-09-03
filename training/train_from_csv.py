import pandas as pd
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import tensorflowjs as tfjs
import os

# Configuration
CSV_FILE = "cognitive_population_data.csv"
MODEL_DIR = "../public/models/trend-cnn"
WINDOW_SIZE = 6
FEATURE_COUNT = 8

def preprocess_data(df):
    subjects = df['subject_id'].unique()
    X = []
    y = []
    
    label_map = {'stable': 0, 'declining': 1, 'improving': 2, 'volatile': 0} # Treat volatile as stable/noisy for now
    
    print(f"Processing {len(subjects)} subjects...")
    
    for sub in subjects:
        sub_data = df[df['subject_id'] == sub].sort_values('session_id')
        
        if len(sub_data) < WINDOW_SIZE:
            continue
            
        # Extract features
        # 1. Memory (0-1)
        memory = sub_data['memory_accuracy'].values
        
        # 2. Reaction (Normalized approx 0-1)
        # Invert: 200ms -> 1.0, 1000ms -> 0.0
        reaction_raw = sub_data['reaction_time_ms'].values
        reaction = np.clip(1 - (reaction_raw - 200) / 800, 0, 1)
        
        # 3. Pattern (Normalized 0-1)
        pattern = np.clip(sub_data['pattern_level'].values / 10, 0, 1)
        
        # 4. Language (Normalized 0-1)
        # 150wpm -> ~0.75
        language = np.clip(sub_data['language_wpm'].values / 200, 0, 1)
        
        # Derived Features
        
        # 5. Stability (Variance proxy)
        # Use diff from previous session
        diffs = np.zeros_like(reaction)
        diffs[1:] = np.abs(np.diff(reaction_raw)) / reaction_raw[:-1]
        stability = np.clip(1 - diffs * 2, 0, 1)
        
        # 6. Combined Score
        combined = (memory * 0.4 + reaction * 0.3 + pattern * 0.2 + language * 0.1)
        
        # 7. Temporal (Normalized days)
        dates = pd.to_datetime(sub_data['date'])
        days = (dates - dates.iloc[0]).dt.days.values
        days_norm = np.clip(days / 90, 0, 1)
        
        # 8. Slope (Gradient of memory)
        slopes = np.gradient(memory) + 0.5
        
        # Stack features [6, 8]
        # [memory, reaction, pattern, language, stability, combined, temporal, slope]
        features = np.stack([
            memory, reaction, pattern, language,
            stability, combined, days_norm, slopes
        ], axis=1)
        
        # Take last N sessions
        features = features[-WINDOW_SIZE:]
        
        # Get label (from the first row of subject, assuming constant pattern)
        label_str = sub_data['pattern_type'].iloc[0]
        label = label_map.get(label_str, 0)
        
        X.append(features)
        y.append(label)
        
    return np.array(X), np.array(y)

def train_model():
    print("Loading CSV...")
    df = pd.read_csv(CSV_FILE)
    
    X, y = preprocess_data(df)
    print(f"Training Data Shape: {X.shape}")
    
    # Model Architecture
    model = keras.Sequential([
        # Explicit InputLayer with batch_input_shape is most robust for TFJS
        layers.InputLayer(batch_input_shape=(None, WINDOW_SIZE, FEATURE_COUNT)),
        
        layers.Conv1D(filters=32, kernel_size=3, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Dropout(0.2),
        
        layers.Conv1D(filters=16, kernel_size=3, activation='relu', padding='same'),
        layers.GlobalAveragePooling1D(),
        
        layers.Dense(16, activation='relu'),
        layers.Dense(3, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    model.fit(
        X, y,
        epochs=30,
        batch_size=32,
        validation_split=0.2
    )
    
    # Export
    os.makedirs(MODEL_DIR, exist_ok=True)
    tfjs.converters.save_keras_model(model, MODEL_DIR)
    print(f"Model exported to {MODEL_DIR}")

if __name__ == "__main__":
    train_model()
