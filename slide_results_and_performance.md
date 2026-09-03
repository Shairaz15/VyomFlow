# Results & Performance Analysis

## Experimental Setup
- Tested across **4 cognitive domains**: Reaction Time, Memory Recall, Pattern Recognition, Language Processing
- Simulated **3 user profiles**: Stable, Declining, Improving (5 sessions each)
- **AI Pipeline**: Feature Extraction â†’ Trend Analysis (Linear Regression) â†’ Anomaly Detection (Z-score, 2Ïƒ threshold) â†’ Risk Engine (Rule + ML Ensemble)

## Performance Metrics
| Metric                        | Result                                      |
|-------------------------------|---------------------------------------------|
| Trend Detection               | Accurately classifies Stable, Declining & Improving trends |
| Anomaly Detection             | Flags outliers using Z-score (2Ïƒ threshold)  |
| Risk Classification           | 3-tier: Stable â†’ Change Detected â†’ Possible Risk |
| ML Inference                  | TensorFlow.js LSTM (in-browser, privacy-first) |
| Ensemble Confidence           | 50% â†’ 95% (scales with more sessions)        |
| Heuristic Fallback            | Activates when ML model is unavailable       |

## Comparison with Existing Systems
| Feature             | Traditional (MoCA/MMSE)         | VyomFlow (Ours)                       |
|---------------------|---------------------------------|------------------------------------------|
| Mode                | Paper-based, clinic visits      | Digital, browser-based, 24/7 accessible  |
| Frequency           | Annual / Biannual               | Weekly self-assessments                  |
| Trend Analysis      | Manual doctor interpretation    | Automated ML + rule-based ensemble       |
| Anomaly Detection   | âŒ Not available                | âœ… Statistical outlier detection          |
| Real-time Feedback  | âŒ No                           | âœ… Instant dashboard & risk assessment   |
| Cost                | High (clinical setting)         | Free / Low-cost (web-based)              |
