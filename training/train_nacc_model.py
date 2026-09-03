import pandas as pd
import numpy as np
import xgboost as xgb
import shap
import json
import os
import joblib
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import classification_report, accuracy_score, balanced_accuracy_score
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

# Define features based on Architecture Spec (Section 5.3)
IDENTIFIERS = ['NACCID', 'NACCVNUM', 'VISITYR']

DEMOGRAPHICS = ['NACCAGE', 'EDUC', 'SEX']
EPISODIC_MEMORY = ['CRAFTVRS', 'CRAFTDVR', 'UDSBENTC', 'UDSBENTD']
LANGUAGE = ['ANIMALS', 'VEG', 'MOCAFLUE', 'MINTTOTS']
EXECUTIVE = ['TRAILA', 'TRAILB', 'WAIS']
ATTENTION = ['DIGIFLEN', 'DIGIBLEN', 'MOCALETT']
VISUOSPATIAL = ['MOCACUBE', 'MOCACLOC', 'ORIENT']

FEATURES = DEMOGRAPHICS + EPISODIC_MEMORY + LANGUAGE + EXECUTIVE + ATTENTION + VISUOSPATIAL
TARGETS = ['NACCUDSD', 'CDRGLOB', 'CDRSUM', 'DEMENTED']

def load_and_preprocess_data(csv_path):
    print(f"Loading dataset from {csv_path}...")
    
    # Read only the required columns to save memory
    cols_to_use = IDENTIFIERS + FEATURES + TARGETS
    
    try:
        df = pd.read_csv(csv_path, usecols=lambda c: c.upper() in [x.upper() for x in cols_to_use], low_memory=False)
        df.columns = df.columns.str.upper()
    except ValueError as e:
        print(f"Column mismatch error: {e}")
        print("Falling back to reading all columns and filtering...")
        df = pd.read_csv(csv_path, low_memory=False)
        df.columns = df.columns.str.upper()
        available_cols = [c for c in cols_to_use if c in df.columns]
        df = df[available_cols]

    print(f"Initial shape: {df.shape}")

    # NACC missing codes
    missing_codes = [88, 95, 99, 888, 999, -4]
    df.replace(missing_codes, np.nan, inplace=True)

    if 'NACCUDSD' in df.columns:
        df = df.dropna(subset=['NACCUDSD'])
        def map_udsd(val):
            if val == 1: return 0 # Normal
            elif val in [2, 3]: return 1 # Impaired/MCI
            elif val == 4: return 2 # Dementia
            return np.nan
        df['TARGET_CLASS'] = df['NACCUDSD'].apply(map_udsd)
        df = df.dropna(subset=['TARGET_CLASS'])
        df['TARGET_CLASS'] = df['TARGET_CLASS'].astype(int)
    else:
        print("NACCUDSD column not found. Using CDRGLOB.")
        if 'CDRGLOB' in df.columns:
            df = df.dropna(subset=['CDRGLOB'])
            def map_cdr(val):
                if val == 0: return 0 # Normal
                elif val == 0.5: return 1 # MCI
                elif val >= 1.0: return 2 # Dementia
                return np.nan
            df['TARGET_CLASS'] = df['CDRGLOB'].apply(map_cdr)
            df = df.dropna(subset=['TARGET_CLASS'])
            df['TARGET_CLASS'] = df['TARGET_CLASS'].astype(int)
        else:
            raise ValueError("No viable target column found in dataset.")

    available_features = [f for f in FEATURES if f in df.columns]
    X = df[available_features]
    y = df['TARGET_CLASS']
    groups = df['NACCID'] if 'NACCID' in df.columns else np.arange(len(df))

    print(f"Final shape for modeling: X={X.shape}, y={y.shape}")
    return X, y, groups, available_features

def main():
    csv_path = "investigator_nacc74.csv"
    
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    X, y, groups, feature_names = load_and_preprocess_data(csv_path)

    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))

    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y.iloc[train_idx], y.iloc[test_idx]

    print("Imputing and scaling features...")
    imputer = SimpleImputer(strategy='median')
    scaler = StandardScaler()

    X_train_imp = imputer.fit_transform(X_train)
    X_train_scaled = scaler.fit_transform(X_train_imp)

    X_test_imp = imputer.transform(X_test)
    X_test_scaled = scaler.transform(X_test_imp)

    print("Training XGBoost Classifier...")
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        objective='multi:softprob',
        num_class=3,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train_scaled, y_train)

    print("Evaluating Model...")
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    bacc = balanced_accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}")
    print(f"Balanced Accuracy: {bacc:.4f}")
    print(classification_report(y_test, y_pred, target_names=['Normal', 'MCI', 'Dementia']))

    print("Calculating SHAP values for global attributions...")
    try:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_test_scaled[:500])
        print("SHAP calculation successful.")
    except Exception as e:
        print(f"SHAP failed (known XGBoost >2.0 multi-class bug): {e}")
        print("Falling back to XGBoost feature importances.")
        importances = model.feature_importances_
        for name, imp in zip(feature_names, importances):
            print(f"{name}: {imp:.4f}")
    
    output_dir = "../public/models/nacc-xgboost"
    os.makedirs(output_dir, exist_ok=True)

    model_json_path = os.path.join(output_dir, "xgboost_model.json")
    model.save_model(model_json_path)
    print(f"Model saved to {model_json_path}")

    preprocessor_meta = {
        "features": feature_names,
        "imputer_medians": imputer.statistics_.tolist(),
        "scaler_means": scaler.mean_.tolist(),
        "scaler_scales": scaler.scale_.tolist()
    }
    with open(os.path.join(output_dir, "preprocessor.json"), "w") as f:
        json.dump(preprocessor_meta, f, indent=2)

    print("Pipeline complete.")

if __name__ == "__main__":
    main()
