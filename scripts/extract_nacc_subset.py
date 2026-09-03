#!/usr/bin/env python3
"""
Extract Age, Gender, MoCA Score, Education, and MCI status from NACC Dataset
"""

import os
import pandas as pd
import numpy as np

def extract_nacc_subset():
    input_csv = os.path.join(os.path.dirname(__file__), "..", "training", "investigator_nacc74.csv")
    output_csv = os.path.join(os.path.dirname(__file__), "..", "nacc_age_gender_moca_education_mci.csv")
    output_moca_only_csv = os.path.join(os.path.dirname(__file__), "..", "nacc_moca_subset_complete.csv")

    print(f"Reading NACC dataset from {input_csv}...")
    
    cols = ['NACCID', 'NACCVNUM', 'NACCAGE', 'NACCSEX', 'EDUC', 'NACCMOCA', 'MOCATOTS', 'NACCUDSD', 'MCI', 'CDRGLOB']
    
    df = pd.read_csv(input_csv, usecols=cols, low_memory=False)
    print(f"Total records loaded: {len(df):,}")

    # 1. Clean Age
    df['Age'] = df['NACCAGE']

    # 2. Clean Gender (1 = Male, 2 = Female)
    gender_map = {1: 'Male', 2: 'Female'}
    df['Gender'] = df['NACCSEX'].map(gender_map).fillna('Unknown')
    df['Gender_Code'] = df['NACCSEX'] # 1=Male, 2=Female

    # 3. Clean Education (Years of education, replace 99/missing with NaN)
    df['Education_Years'] = df['EDUC'].replace([99, -4, 88], np.nan)

    # 4. Clean MoCA Score (Replace negative missing codes -4, 88, 95, 99 with NaN)
    moca_clean = df['NACCMOCA'].copy()
    moca_clean[moca_clean < 0] = np.nan
    moca_clean[moca_clean > 30] = np.nan
    df['MoCA_Score'] = moca_clean

    # 5. Clean Cognitive Diagnosis & MCI Indicator
    # NACCUDSD: 1 = Normal, 2 = Impaired not MCI, 3 = MCI, 4 = Dementia
    diagnosis_map = {
        1: 'Normal',
        2: 'Impaired (Not MCI)',
        3: 'MCI',
        4: 'Dementia',
        8: 'Pending / Unknown'
    }
    df['Cognitive_Diagnosis'] = df['NACCUDSD'].map(diagnosis_map).fillna('Unknown')

    # Binary MCI indicator (1 = MCI diagnosed, 0 = Normal / Non-MCI, NaN if pending/missing)
    def compute_mci_flag(row):
        udsd = row['NACCUDSD']
        mci_val = row['MCI']
        if udsd == 3 or mci_val == 1:
            return 1 # MCI Positive
        elif udsd == 1:
            return 0 # Normal / No MCI
        elif udsd == 4:
            return 0 # Dementia (post-MCI stage)
        elif udsd == 2:
            return 0 # Impaired not MCI
        return np.nan

    df['MCI'] = df.apply(compute_mci_flag, axis=1)

    # Select user-specified core columns
    export_df = df[['Age', 'Gender', 'Education_Years', 'MoCA_Score', 'MCI', 'Cognitive_Diagnosis', 'CDRGLOB']].copy()

    # Save full dataset
    print(f"Saving full extracted dataset to {output_csv}...")
    export_df.to_csv(output_csv, index=False)
    print(f"Successfully saved {len(export_df):,} rows.")

    # Save subset with valid MoCA scores (UDS v3 cohort)
    moca_valid_df = export_df.dropna(subset=['MoCA_Score']).copy()
    print(f"Saving complete MoCA-assessed cohort ({len(moca_valid_df):,} rows) to {output_moca_only_csv}...")
    moca_valid_df.to_csv(output_moca_only_csv, index=False)
    print("Done!")

    # Print summary statistics
    print("\n--- Summary of Extracted Dataset ---")
    print(export_df.describe(include='all'))
    print("\nCognitive Diagnosis Breakdown:")
    print(export_df['Cognitive_Diagnosis'].value_counts())
    print("\nMCI Flag Breakdown (1=MCI, 0=Normal/Other):")
    print(export_df['MCI'].value_counts(dropna=False))

if __name__ == '__main__':
    extract_nacc_subset()
