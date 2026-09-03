import pandas as pd
import numpy as np
import xgboost as xgb
import os
import json
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import (
    classification_report, accuracy_score, balanced_accuracy_score,
    confusion_matrix, roc_curve, auc, precision_recall_curve, brier_score_loss
)
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, label_binarize
from sklearn.calibration import calibration_curve

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
CLASSES = ['Normal', 'MCI', 'Dementia']

def load_and_preprocess_data(csv_path):
    cols_to_use = IDENTIFIERS + FEATURES + TARGETS
    
    try:
        df = pd.read_csv(csv_path, usecols=lambda c: c.upper() in [x.upper() for x in cols_to_use], low_memory=False)
        df.columns = df.columns.str.upper()
    except ValueError:
        df = pd.read_csv(csv_path, low_memory=False)
        df.columns = df.columns.str.upper()
        available_cols = [c for c in cols_to_use if c in df.columns]
        df = df[available_cols]

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
        raise ValueError("No viable target column found in dataset.")

    available_features = [f for f in FEATURES if f in df.columns]
    X = df[available_features]
    y = df['TARGET_CLASS']
    groups = df['NACCID'] if 'NACCID' in df.columns else np.arange(len(df))

    return X, y, groups, available_features

def plot_confusion_matrix(y_true, y_pred, output_dir):
    cm = confusion_matrix(y_true, y_pred)
    cm_norm = confusion_matrix(y_true, y_pred, normalize='true')

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=CLASSES, yticklabels=CLASSES, ax=axes[0])
    axes[0].set_title('Confusion Matrix (Raw Counts)')
    axes[0].set_xlabel('Predicted')
    axes[0].set_ylabel('True')

    sns.heatmap(cm_norm, annot=True, fmt='.2f', cmap='Blues', xticklabels=CLASSES, yticklabels=CLASSES, ax=axes[1])
    axes[1].set_title('Confusion Matrix (Normalized)')
    axes[1].set_xlabel('Predicted')
    axes[1].set_ylabel('True')

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'confusion_matrix.png'))
    plt.close()

def plot_roc_pr_curves(y_true, y_prob, output_dir):
    y_true_bin = label_binarize(y_true, classes=[0, 1, 2])
    n_classes = y_true_bin.shape[1]

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # ROC Curve
    for i in range(n_classes):
        fpr, tpr, _ = roc_curve(y_true_bin[:, i], y_prob[:, i])
        roc_auc = auc(fpr, tpr)
        axes[0].plot(fpr, tpr, lw=2, label=f'{CLASSES[i]} (AUC = {roc_auc:.2f})')

    axes[0].plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    axes[0].set_xlim([0.0, 1.0])
    axes[0].set_ylim([0.0, 1.05])
    axes[0].set_xlabel('False Positive Rate')
    axes[0].set_ylabel('True Positive Rate')
    axes[0].set_title('One-vs-Rest ROC Curve')
    axes[0].legend(loc="lower right")

    # PR Curve
    for i in range(n_classes):
        precision, recall, _ = precision_recall_curve(y_true_bin[:, i], y_prob[:, i])
        pr_auc = auc(recall, precision)
        axes[1].plot(recall, precision, lw=2, label=f'{CLASSES[i]} (AUC = {pr_auc:.2f})')

    axes[1].set_xlim([0.0, 1.0])
    axes[1].set_ylim([0.0, 1.05])
    axes[1].set_xlabel('Recall')
    axes[1].set_ylabel('Precision')
    axes[1].set_title('Precision-Recall Curve')
    axes[1].legend(loc="lower left")

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'roc_pr_curves.png'))
    plt.close()

def plot_calibration_curve(y_true, y_prob, output_dir):
    y_true_bin = label_binarize(y_true, classes=[0, 1, 2])
    
    plt.figure(figsize=(8, 8))
    ax1 = plt.subplot2grid((3, 1), (0, 0), rowspan=2)
    ax2 = plt.subplot2grid((3, 1), (2, 0))

    ax1.plot([0, 1], [0, 1], "k:", label="Perfectly calibrated")

    for i in range(len(CLASSES)):
        prob_true, prob_pred = calibration_curve(y_true_bin[:, i], y_prob[:, i], n_bins=10)
        brier = brier_score_loss(y_true_bin[:, i], y_prob[:, i])
        
        ax1.plot(prob_pred, prob_true, "s-", label=f"{CLASSES[i]} (Brier: {brier:.3f})")
        ax2.hist(y_prob[:, i], range=(0, 1), bins=10, histtype="step", lw=2, label=CLASSES[i])

    ax1.set_ylabel("Fraction of positives")
    ax1.set_ylim([-0.05, 1.05])
    ax1.legend(loc="lower right")
    ax1.set_title('Calibration Plots (Reliability Diagram)')

    ax2.set_xlabel("Mean predicted value")
    ax2.set_ylabel("Count")
    ax2.legend(loc="upper center", ncol=3)

    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, 'calibration_curves.png'))
    plt.close()

def main():
    csv_path = "investigator_nacc74.csv"
    model_path = "../public/models/nacc-xgboost/xgboost_model.json"
    meta_path = "../public/models/nacc-xgboost/preprocessor.json"
    output_dir = "validation_plots"
    
    os.makedirs(output_dir, exist_ok=True)

    if not os.path.exists(csv_path) or not os.path.exists(model_path):
        print("Required files not found. Ensure the dataset and model exist.")
        return

    print("Loading data for exact test split...")
    X, y, groups, feature_names = load_and_preprocess_data(csv_path)
    
    # Must use identical seed to get exact same test set
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups))
    
    X_test = X.iloc[test_idx]
    y_test = y.iloc[test_idx]

    X_train = X.iloc[train_idx]
    
    print("Fitting preprocessors on X_train to ensure identical internal state...")
    imputer = SimpleImputer(strategy='median')
    imputer.fit(X_train)
    
    scaler = StandardScaler()
    scaler.fit(imputer.transform(X_train))

    X_test_imp = imputer.transform(X_test)
    X_test_scaled = scaler.transform(X_test_imp)

    print("Loading XGBoost model...")
    model = xgb.XGBClassifier()
    model.load_model(model_path)

    print("Running Inference...")
    y_prob = model.predict_proba(X_test_scaled)
    y_pred = model.predict(X_test_scaled)

    # 1. Classification Metrics
    print("\nClassification Metrics:")
    acc = accuracy_score(y_test, y_pred)
    bacc = balanced_accuracy_score(y_test, y_pred)
    print(f"Overall Accuracy: {acc:.4f}")
    print(f"Balanced Accuracy: {bacc:.4f}")
    print(classification_report(y_test, y_pred, target_names=CLASSES))

    # 2. Confusion Matrix
    print("Generating Confusion Matrix...")
    plot_confusion_matrix(y_test, y_pred, output_dir)

    # 3. ROC and PR Curves
    print("Generating ROC & PR Curves...")
    plot_roc_pr_curves(y_test, y_prob, output_dir)

    # 4. Calibration
    print("Generating Calibration Curves...")
    plot_calibration_curve(y_test, y_prob, output_dir)

    print(f"Validation plots saved to {output_dir}/")

if __name__ == "__main__":
    main()
