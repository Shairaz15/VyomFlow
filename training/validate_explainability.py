import pandas as pd
import numpy as np
import xgboost as xgb
import os
import json
from sklearn.model_selection import GroupShuffleSplit
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

# Define features based on Architecture Spec
IDENTIFIERS = ['NACCID', 'NACCVNUM', 'VISITYR']
DEMOGRAPHICS = ['NACCAGE', 'EDUC', 'SEX']
EPISODIC_MEMORY = ['CRAFTVRS', 'CRAFTDVR', 'UDSBENTC', 'UDSBENTD']
LANGUAGE = ['ANIMALS', 'VEG', 'MOCAFLUE', 'MINTTOTS']
EXECUTIVE = ['TRAILA', 'TRAILB', 'WAIS']
ATTENTION = ['DIGIFLEN', 'DIGIBLEN', 'MOCALETT']
VISUOSPATIAL = ['MOCACUBE', 'MOCACLOC', 'ORIENT']

FEATURES = DEMOGRAPHICS + EPISODIC_MEMORY + LANGUAGE + EXECUTIVE + ATTENTION + VISUOSPATIAL
TARGETS = ['NACCUDSD']
CLASSES = ['Normal', 'MCI', 'Dementia']

def load_data(csv_path):
    cols_to_use = IDENTIFIERS + FEATURES + TARGETS
    try:
        df = pd.read_csv(csv_path, usecols=lambda c: c.upper() in [x.upper() for x in cols_to_use], low_memory=False)
        df.columns = df.columns.str.upper()
    except:
        df = pd.read_csv(csv_path, low_memory=False)
        df.columns = df.columns.str.upper()
        available_cols = [c for c in cols_to_use if c in df.columns]
        df = df[available_cols]

    missing_codes = [88, 95, 99, 888, 999, -4]
    df.replace(missing_codes, np.nan, inplace=True)
    df = df.dropna(subset=['NACCUDSD'])
    
    def map_udsd(val):
        if val == 1: return 0
        elif val in [2, 3]: return 1
        elif val == 4: return 2
        return np.nan
        
    df['TARGET_CLASS'] = df['NACCUDSD'].apply(map_udsd)
    df = df.dropna(subset=['TARGET_CLASS'])
    df['TARGET_CLASS'] = df['TARGET_CLASS'].astype(int)

    available_features = [f for f in FEATURES if f in df.columns]
    X = df[available_features]
    y = df['TARGET_CLASS']
    groups = df['NACCID'] if 'NACCID' in df.columns else np.arange(len(df))

    return X, y, groups, available_features

def main():
    csv_path = "investigator_nacc74.csv"
    model_path = "../public/models/nacc-xgboost/xgboost_model.json"
    
    if not os.path.exists(csv_path) or not os.path.exists(model_path):
        print("Dataset or model not found.")
        return

    X, y, groups, feature_names = load_data(csv_path)
    
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    
    X_train = X.iloc[train_idx]
    X_test = X.iloc[test_idx]
    y_test = y.iloc[test_idx]

    imputer = SimpleImputer(strategy='median')
    imputer.fit(X_train)
    scaler = StandardScaler()
    scaler.fit(imputer.transform(X_train))

    X_test_scaled = scaler.transform(imputer.transform(X_test))

    model = xgb.XGBClassifier()
    model.load_model(model_path)

    print("==========================================")
    print("      Explainability Validation Report    ")
    print("==========================================\n")

    print("1. Global Feature Importance (XGBoost Native Weight)")
    importances = model.feature_importances_
    
    # Sort and display
    feat_imps = list(zip(feature_names, importances))
    feat_imps.sort(key=lambda x: x[1], reverse=True)
    
    for rank, (name, imp) in enumerate(feat_imps, 1):
        print(f"  {rank}. {name.ljust(15)} : {imp:.4f}")

    print("\nClinical Plausibility Check:")
    top_5 = [x[0] for x in feat_imps[:5]]
    expected_critical = ['ORIENT', 'VEG', 'ANIMALS', 'CRAFTDVR', 'TRAILB']
    matched = set(top_5).intersection(expected_critical)
    print(f"  -> Top 5 features contain {len(matched)} expected critical clinical markers: {list(matched)}")

    print("\n2. Local Explanations (Representative Cases)")
    print("  Note: Due to known SHAP limitations with XGBoost 3.2 multi-class, we simulate Local Attributions based on normalized feature deviation from baseline.")
    
    # Find representative cases
    normal_idx = np.where(y_test == 0)[0][0]
    mci_idx = np.where(y_test == 1)[0][0]
    dementia_idx = np.where(y_test == 2)[0][0]
    
    cases = {
        'Healthy Participant': normal_idx,
        'MCI Participant': mci_idx,
        'Dementia Participant': dementia_idx
    }

    # Simulate local explanation by finding which feature deviates most from normal baseline
    normal_baseline = scaler.mean_

    for case_name, idx in cases.items():
        print(f"\n  --- {case_name} ---")
        prob = model.predict_proba(X_test_scaled[idx:idx+1])[0]
        print(f"  Prediction Probabilities: Normal: {prob[0]:.2f}, MCI: {prob[1]:.2f}, Dementia: {prob[2]:.2f}")
        
        # Raw features before scaling but after imputation for display
        raw_vals = imputer.transform(X_test[idx:idx+1])[0]
        
        # Determine top 3 driving features (features furthest from normal mean, weighted by importance)
        deviations = np.abs((raw_vals - normal_baseline) / np.sqrt(scaler.var_))
        weighted_deviations = deviations * importances
        
        top_indices = np.argsort(weighted_deviations)[::-1][:3]
        
        print("  Top 3 Local Driving Features:")
        for i in top_indices:
            print(f"    - {feature_names[i]}: Value={raw_vals[i]:.1f} (Deviation from Normal Mean: {(raw_vals[i]-normal_baseline[i]):.1f})")

    print("\nValidation Complete.")

if __name__ == "__main__":
    main()
