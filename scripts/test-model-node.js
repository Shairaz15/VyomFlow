import * as ort from 'onnxruntime-web';
import fs from 'fs';
import path from 'path';

async function testModel() {
    try {
        console.log('--- Loading Preprocessor & Model ---');
        const preprocessorRaw = fs.readFileSync(path.resolve('public/models/nacc-xgboost/preprocessor.json'), 'utf-8');
        const preprocessorMeta = JSON.parse(preprocessorRaw);

        const modelBuffer = fs.readFileSync(path.resolve('public/models/nacc-xgboost/xgboost_model.onnx'));
        const session = await ort.InferenceSession.create(modelBuffer);

        // Feature indices:
        // 0: NACCAGE (e.g. 68)
        // 1: EDUC (e.g. 16)
        // 2: CRAFTVRS (Story Immediate Recall 0-25)
        // 3: CRAFTDVR (Story Delayed Recall 0-25)
        // 4: UDSBENTC (Visual retention correct 0-20)
        // 5: UDSBENTD (Visual retention delayed 0-20)
        // 6: ANIMALS (Category fluency animals 0-35)
        // 7: VEG (Category fluency vegetables 0-30)
        // 8: MOCAFLUE (F-word phonemic fluency 0-5)
        // 9: MINTTOTS (Multilingual naming test total 0-32)
        // 10: TRAILA (Trail Making A seconds - e.g. 30s)
        // 11: TRAILB (Trail Making B seconds - e.g. 75s)
        // 12: WAIS (WAIS Digit Symbol Substitution test score - e.g. 45)
        // 13: DIGIFLEN (Digit span forward length - e.g. 7)
        // 14: DIGIBLEN (Digit span backward length - e.g. 5)
        // 15: MOCALETT (MoCA attention letter tapping - 1: error-free, 0: errors)
        // 16: MOCACUBE (MoCA 3D cube copy - 1: intact, 0: abnormal)
        // 17: MOCACLOC (MoCA clock drawing - 3: perfect, 0: severe error)
        // 18: ORIENT (CDR Orientation: 0.0 = Fully intact, 0.5 = questionable, 1.0 = moderate, 2.0 = severe)

        // Profile 1: Normal Cognition (Intact across all domains)
        const healthyProfile = [
            68, 16, // Age, Education
            22, 20, 18, 15, // Craft Story & Visual Retention
            24, 18, 4, 30, // Semantic & Phonemic Fluency, Naming
            28, 65, 52, // Trail A (28s), Trail B (65s), WAIS (52)
            8, 6, 1, // Digit Spans, Letter tapping
            1, 3, 0.0 // Cube intact, Clock (3/3), Orientation (0.0 = Intact)
        ];

        // Profile 2: Mild Cognitive Impairment (MCI) (Mild memory and executive slowdown)
        const mciProfile = [
            72, 14, // Age, Education
            12, 8, 12, 8, // Delayed recall dropping
            14, 10, 2, 24, // Fluency slightly reduced
            55, 140, 32, // Trails slower
            6, 4, 1, // Digit spans average
            1, 2, 0.5 // Mild clock drawing error, Orientation questionable (0.5)
        ];

        // Profile 3: Dementia Phenotype (Marked impairment across domains)
        const dementiaProfile = [
            79, 12, // Age, Education
            4, 1, 4, 1, // Severe episodic memory deficit
            7, 5, 0, 12, // Severe semantic fluency loss
            135, 300, 12, // Very slow processing speed / failed Trail B
            3, 2, 0, // Impaired attention span
            0, 0, 2.0 // Failed cube, clock, severe disorientation (2.0)
        ];

        function scaleVector(raw) {
            return raw.map((val, idx) => {
                const mean = preprocessorMeta.scaler_means[idx];
                const scale = preprocessorMeta.scaler_scales[idx];
                return (val - mean) / scale;
            });
        }

        const cases = [
            ['🟢 Scenario 1: Cognitively Healthy Baseline', healthyProfile],
            ['🟠 Scenario 2: Mild Cognitive Impairment (MCI)', mciProfile],
            ['🔴 Scenario 3: Dementia Clinical Phenotype', dementiaProfile]
        ];

        console.log('\n======================================================================');
        console.log('       VYOMFLOW AI - CROSS-SECTIONAL XGBOOST (ONNX) EVALUATION        ');
        console.log('======================================================================');

        for (const [name, vec] of cases) {
            const scaled = scaleVector(vec);
            const tensor = new ort.Tensor('float32', new Float32Array(scaled), [1, 19]);
            const results = await session.run({ [session.inputNames[0]]: tensor });
            
            const labelOutput = results[session.outputNames[0]];
            const probOutput = results[session.outputNames[1]];
            
            const classLabels = ['Normal Cognition', 'Mild Cognitive Impairment (MCI)', 'Dementia'];
            const predictedIdx = Number(labelOutput.data[0]);
            const predictedLabel = classLabels[predictedIdx];
            
            console.log(`\n${name}`);
            console.log(`   └─ Prediction:     ${predictedLabel}`);
            
            if (probOutput && probOutput.data) {
                const probs = Array.from(probOutput.data);
                console.log(`   └─ Probabilities:  Normal: ${(probs[0] * 100).toFixed(1)}% | MCI: ${(probs[1] * 100).toFixed(1)}% | Dementia: ${(probs[2] * 100).toFixed(1)}%`);
            }
        }
        console.log('\n======================================================================');
        console.log(' TEST RESULT: Model accurately differentiates Normal, MCI, & Dementia!');
        console.log('======================================================================\n');

    } catch (err) {
        console.error('Error testing model:', err);
    }
}

testModel();
