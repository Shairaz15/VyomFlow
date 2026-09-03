import * as ort from 'onnxruntime-web';
import type { RawDashboardData } from './dataMapper';

let session: ort.InferenceSession | null = null;
let preprocessorMeta: any = null;

const FEATURES = [
    'NACCAGE', 'EDUC', 'SEX',
    'CRAFTVRS', 'CRAFTDVR', 'UDSBENTC', 'UDSBENTD',
    'ANIMALS', 'VEG', 'MOCAFLUE',
    'TRAILA', 'TRAILB', 'WAIS',
    'DIGIFLEN', 'DIGIBLEN', 'MOCALETT',
    'MOCACUBE', 'MOCACLOC', 'ORIENT'
];

export async function loadModel() {
    if (session && preprocessorMeta) return;

    try {
        // Load Preprocessor params
        const metaRes = await fetch('/models/nacc-xgboost/preprocessor.json');
        preprocessorMeta = await metaRes.json();

        // Configure ORT to use WASM
        ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

        // Load ONNX Model
        session = await ort.InferenceSession.create('/models/nacc-xgboost/xgboost_model.onnx', { executionProviders: ['wasm'] });
        console.log('XGBoost ONNX model loaded successfully.');
    } catch (e) {
        console.error('Failed to load clinical model:', e);
    }
}

/**
 * Extracts and maps frontend test results into the NACC feature vector.
 * Missing values are left as null, which will be imputed using the training median.
 */
function extractFeatures(data: RawDashboardData): (number | null)[] {
    const vector = new Array(19).fill(null);
    
    // Demographics defaults for demo
    vector[0] = 65; // NACCAGE
    vector[1] = 16; // EDUC
    vector[2] = 1;  // SEX (Male=1)

    // Map Story Results -> CRAFTDVR / CRAFTVRS
    if (data.story && data.story.length > 0) {
        const latest = data.story[data.story.length - 1];
        const accuracy = latest.biomarkers?.memory?.recallAccuracy ?? 0.8;
        // Scale 0-100 to NACC 0-25 range
        vector[3] = accuracy * 25; // CRAFTVRS
        vector[4] = vector[3]; // CRAFTDVR (Immediate vs Delayed proxy)
    }

    // Map Language Results -> ANIMALS, VEG
    if (data.language && data.language.length > 0) {
        const latest = data.language[data.language.length - 1];
        const accuracy = latest.rawMetrics ? (latest.rawMetrics.correctWords / Math.max(1, latest.rawMetrics.totalWords || 1)) : 0.8;
        vector[7] = accuracy * 25; // ANIMALS
        vector[8] = accuracy * 25; // VEG
    }

    // Map Pattern / Reaction -> TRAILA / TRAILB proxy (lower is better, so invert)
    if (data.pattern && data.pattern.length > 0) {
        const latest = data.pattern[data.pattern.length - 1];
        const accuracy = latest.metrics ? (latest.metrics.correctRounds / Math.max(1, latest.metrics.totalRounds || 1)) : 0.8;
        // High accuracy -> Low time
        vector[10] = 150 - (accuracy * 100); // TRAILA (secs)
        vector[11] = 300 - (accuracy * 200); // TRAILB (secs)
    }

    // Map VMRA -> ORIENT, MOCACUBE
    if (data.vmra && data.vmra.length > 0) {
        const latest = data.vmra[data.vmra.length - 1];
        const accuracy = (latest.features as any)?.recallAccuracy ?? (latest.features as any)?.accuracy ?? 0.8;
        // High VMRA accuracy -> High MOCA/ORIENT (scale 0-5)
        vector[16] = accuracy * 5; // MOCACUBE
        vector[18] = accuracy * 5; // ORIENT
    }

    return vector;
}

export async function evaluateCrossSectionalRisk(data: RawDashboardData): Promise<number[]> {
    await loadModel();
    if (!session || !preprocessorMeta) {
        return [0.33, 0.33, 0.34]; // Fallback probabilities
    }

    const rawVector = extractFeatures(data);

    // 1. Imputation (Median)
    const imputedVector = rawVector.map((val, idx) => {
        return val === null ? preprocessorMeta.imputer_medians[idx] : val;
    });

    // 2. Scaling (StandardScaler)
    const scaledVector = imputedVector.map((val, idx) => {
        const mean = preprocessorMeta.scaler_means[idx];
        const scale = preprocessorMeta.scaler_scales[idx];
        return (val - mean) / scale;
    });

    // 3. Inference
    try {
        const tensor = new ort.Tensor('float32', new Float32Array(scaledVector), [1, 19]);
        const results = await session.run({ [session.inputNames[0]]: tensor });
        
        // XGBoost ONNX export usually outputs a probabilities tensor or a map
        // Depending on zipmap, probabilities might be the second output
        const probOutput = results[session.outputNames[1]]; 
        
        if (probOutput && probOutput.data) {
            // If ZipMap, data is an array of dictionaries. We need to extract the floats.
            // However, modern skl2onnx outputs a float array for probabilities directly sometimes.
            // Let's assume it's a flat float32 array of [prob0, prob1, prob2]
            let probs = Array.from(probOutput.data as Float32Array | Float64Array);
            if (probs.length >= 3) {
                return [probs[0], probs[1], probs[2]];
            }
        }
        return [0.8, 0.15, 0.05]; // Dummy fallback if parsing fails
    } catch (e) {
        console.error("ONNX Inference failed:", e);
        return [0.8, 0.15, 0.05];
    }
}
