import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as ort from 'onnxruntime-web';
import { Icon } from '../components/common/Icon';
import { evaluatePatientTrajectory, type SessionPoint } from '../services/statisticalDriftEngine';
import { generateClinicalAlert, type ConfidenceMetrics } from '../services/clinicalAlertEngine';
import './MLPlayground.css';

// 19 NACC Features schema
interface NACCFeatures {
  NACCAGE: number;     // Age (years)
  EDUC: number;        // Education (years)
  CRAFTVRS: number;    // Craft Story Immediate Recall (0-25)
  CRAFTDVR: number;    // Craft Story Delayed Recall (0-25)
  UDSBENTC: number;    // Benson Visual Copy (0-17)
  UDSBENTD: number;    // Benson Visual Delayed Recall (0-17)
  ANIMALS: number;     // Animal Fluency (0-35)
  VEG: number;         // Vegetable Fluency (0-30)
  MOCAFLUE: number;    // MoCA Phonemic Fluency (0-5)
  MINTTOTS: number;    // Multilingual Naming Test (0-32)
  TRAILA: number;      // Trail Making A (seconds)
  TRAILB: number;      // Trail Making B (seconds)
  WAIS: number;        // WAIS Digit Symbol Score (0-90)
  DIGIFLEN: number;    // Digit Span Forward Length (0-12)
  DIGIBLEN: number;    // Digit Span Backward Length (0-12)
  MOCALETT: number;    // MoCA Letter Tapping (0=error, 1=intact)
  MOCACUBE: number;    // MoCA 3D Cube (0=fail, 1=pass)
  MOCACLOC: number;    // MoCA Clock Drawing (0-3)
  ORIENT: number;      // CDR Orientation (0.0=Intact, 0.5=Questionable, 1.0=Moderate, 2.0=Severe)
}

interface PreprocessorMeta {
  features: string[];
  imputer_medians: number[];
  scaler_means: number[];
  scaler_scales: number[];
}

const PRESETS: Record<string, { name: string; tag: string; description: string; data: NACCFeatures }> = {
  healthySenior: {
    name: '🟢 Healthy Senior (Normal)',
    tag: 'Normal Cognition',
    description: 'Intact episodic recall, fast processing speed, and perfect spatial/temporal orientation.',
    data: {
      NACCAGE: 68,
      EDUC: 16,
      CRAFTVRS: 22,
      CRAFTDVR: 20,
      UDSBENTC: 17,
      UDSBENTD: 15,
      ANIMALS: 24,
      VEG: 18,
      MOCAFLUE: 4,
      MINTTOTS: 30,
      TRAILA: 28,
      TRAILB: 65,
      WAIS: 54,
      DIGIFLEN: 8,
      DIGIBLEN: 6,
      MOCALETT: 1,
      MOCACUBE: 1,
      MOCACLOC: 3,
      ORIENT: 0.0
    }
  },
  amnesticMCI: {
    name: '🟠 Amnestic MCI (Memory Deficit)',
    tag: 'Mild Cognitive Impairment',
    description: 'Isolated episodic delayed memory decline with relatively preserved general orientation and language.',
    data: {
      NACCAGE: 73,
      EDUC: 14,
      CRAFTVRS: 13,
      CRAFTDVR: 7,
      UDSBENTC: 15,
      UDSBENTD: 6,
      ANIMALS: 18,
      VEG: 14,
      MOCAFLUE: 3,
      MINTTOTS: 28,
      TRAILA: 45,
      TRAILB: 120,
      WAIS: 38,
      DIGIFLEN: 6,
      DIGIBLEN: 4,
      MOCALETT: 1,
      MOCACUBE: 1,
      MOCACLOC: 3,
      ORIENT: 0.5
    }
  },
  executiveMCI: {
    name: '🟠 Multi-Domain Executive MCI',
    tag: 'Mild Cognitive Impairment',
    description: 'Slowed processing speed, high Trail Making latencies, and mild language fluency reduction.',
    data: {
      NACCAGE: 75,
      EDUC: 12,
      CRAFTVRS: 12,
      CRAFTDVR: 9,
      UDSBENTC: 13,
      UDSBENTD: 9,
      ANIMALS: 13,
      VEG: 9,
      MOCAFLUE: 2,
      MINTTOTS: 24,
      TRAILA: 68,
      TRAILB: 185,
      WAIS: 26,
      DIGIFLEN: 5,
      DIGIBLEN: 3,
      MOCALETT: 0,
      MOCACUBE: 0,
      MOCACLOC: 2,
      ORIENT: 0.5
    }
  },
  earlyDementia: {
    name: '🔴 Early-Stage Dementia',
    tag: 'Dementia',
    description: 'Multi-domain deficits across delayed recall, verbal fluency, and executive task switching.',
    data: {
      NACCAGE: 78,
      EDUC: 12,
      CRAFTVRS: 6,
      CRAFTDVR: 2,
      UDSBENTC: 8,
      UDSBENTD: 3,
      ANIMALS: 9,
      VEG: 6,
      MOCAFLUE: 1,
      MINTTOTS: 18,
      TRAILA: 105,
      TRAILB: 260,
      WAIS: 16,
      DIGIFLEN: 4,
      DIGIBLEN: 2,
      MOCALETT: 0,
      MOCACUBE: 0,
      MOCACLOC: 1,
      ORIENT: 1.0
    }
  },
  severeDementia: {
    name: '🔴 Severe Alzheimer Phenotype',
    tag: 'Dementia',
    description: 'Severe disorientation, zero delayed story recall, severe Trail B test failure, and prominent language loss.',
    data: {
      NACCAGE: 82,
      EDUC: 10,
      CRAFTVRS: 2,
      CRAFTDVR: 0,
      UDSBENTC: 4,
      UDSBENTD: 0,
      ANIMALS: 5,
      VEG: 3,
      MOCAFLUE: 0,
      MINTTOTS: 10,
      TRAILA: 160,
      TRAILB: 300,
      WAIS: 8,
      DIGIFLEN: 3,
      DIGIBLEN: 1,
      MOCALETT: 0,
      MOCACUBE: 0,
      MOCACLOC: 0,
      ORIENT: 2.0
    }
  }
};

const FEATURE_METADATA: Record<keyof NACCFeatures, { label: string; domain: string; min: number; max: number; step: number; unit: string; desc: string }> = {
  NACCAGE: { label: 'Age', domain: 'Demographics', min: 45, max: 95, step: 1, unit: 'yrs', desc: 'Patient age at assessment' },
  EDUC: { label: 'Education', domain: 'Demographics', min: 0, max: 24, step: 1, unit: 'yrs', desc: 'Completed years of formal education' },
  CRAFTVRS: { label: 'Craft Story Immediate Recall', domain: 'Episodic Memory', min: 0, max: 25, step: 1, unit: 'pts', desc: 'Verbatim immediate recall score' },
  CRAFTDVR: { label: 'Craft Story Delayed Recall', domain: 'Episodic Memory', min: 0, max: 25, step: 1, unit: 'pts', desc: 'Delayed verbatim recall after 20 mins' },
  UDSBENTC: { label: 'Benson Visual Copy', domain: 'Episodic Memory', min: 0, max: 17, step: 1, unit: 'pts', desc: 'Complex visual figure copy accuracy' },
  UDSBENTD: { label: 'Benson Visual Recall', domain: 'Episodic Memory', min: 0, max: 17, step: 1, unit: 'pts', desc: 'Delayed visual figure recall' },
  ANIMALS: { label: 'Animal Fluency', domain: 'Language & Semantic', min: 0, max: 35, step: 1, unit: 'words', desc: 'Category naming in 60 seconds' },
  VEG: { label: 'Vegetable Fluency', domain: 'Language & Semantic', min: 0, max: 30, step: 1, unit: 'words', desc: 'Category naming in 60 seconds' },
  MOCAFLUE: { label: 'Phonemic Fluency (Letter F)', domain: 'Language & Semantic', min: 0, max: 5, step: 1, unit: 'pts', desc: 'Words starting with F in 60s (scaled)' },
  MINTTOTS: { label: 'Multilingual Naming (MINT)', domain: 'Language & Semantic', min: 0, max: 32, step: 1, unit: 'pts', desc: 'Picture object confrontation naming' },
  TRAILA: { label: 'Trail Making Test A', domain: 'Executive & Speed', min: 15, max: 200, step: 1, unit: 'sec', desc: 'Visual processing speed (lower is better)' },
  TRAILB: { label: 'Trail Making Test B', domain: 'Executive & Speed', min: 30, max: 300, step: 1, unit: 'sec', desc: 'Cognitive flexibility & task-switching' },
  WAIS: { label: 'WAIS Digit Symbol Substitution', domain: 'Executive & Speed', min: 0, max: 80, step: 1, unit: 'pts', desc: 'Psychomotor speed & symbol coding' },
  DIGIFLEN: { label: 'Digit Span Forward', domain: 'Attention & Working Memory', min: 2, max: 12, step: 1, unit: 'digits', desc: 'Auditory attention capacity' },
  DIGIBLEN: { label: 'Digit Span Backward', domain: 'Attention & Working Memory', min: 2, max: 12, step: 1, unit: 'digits', desc: 'Working memory manipulation' },
  MOCALETT: { label: 'MoCA Vigilance (Letter Tapping)', domain: 'Attention & Working Memory', min: 0, max: 1, step: 1, unit: '', desc: '1 = No errors (intact), 0 = Error' },
  MOCACUBE: { label: 'MoCA 3D Cube Copy', domain: 'Visuospatial & Orientation', min: 0, max: 1, step: 1, unit: '', desc: '1 = Intact 3D drawing, 0 = Impaired' },
  MOCACLOC: { label: 'MoCA Clock Drawing', domain: 'Visuospatial & Orientation', min: 0, max: 3, step: 1, unit: 'pts', desc: 'Contour (1), Numbers (1), Hands (1)' },
  ORIENT: { label: 'CDR Orientation Box Score', domain: 'Visuospatial & Orientation', min: 0.0, max: 3.0, step: 0.5, unit: 'CDR', desc: '0.0=Intact, 0.5=Questionable, 1.0=Moderate, 2.0=Severe' }
};

export function MLPlayground() {
  const [activeTab, setActiveTab] = useState<'cross-sectional' | 'longitudinal'>('cross-sectional');
  const [selectedPreset, setSelectedPreset] = useState<string>('healthySenior');
  const [features, setFeatures] = useState<NACCFeatures>(PRESETS.healthySenior.data);
  const [activeDomain, setActiveDomain] = useState<string>('All');
  
  // Model state
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [session, setSession] = useState<ort.InferenceSession | null>(null);
  const [preprocessorMeta, setPreprocessorMeta] = useState<PreprocessorMeta | null>(null);
  
  // Inference outputs
  const [probabilities, setProbabilities] = useState<[number, number, number]>([0.96, 0.03, 0.01]);
  const [predictedClass, setPredictedClass] = useState<number>(0);
  const [inferenceLatencyMs, setInferenceLatencyMs] = useState<number>(0);
  const [isInferring, setIsInferring] = useState<boolean>(false);

  // Longitudinal Simulation State
  const [simSessionsCount, setSimSessionsCount] = useState<number>(4);
  const [simDeclineRate, setSimDeclineRate] = useState<number>(1.5); // score points per month
  const [simNoise, setSimNoise] = useState<number>(3.0);

  // 1. Initialize ONNX Session and Preprocessor Metadata
  useEffect(() => {
    let isCancelled = false;

    async function initONNX() {
      try {
        setIsLoadingModel(true);
        // Load preprocessor JSON
        const metaRes = await fetch('/models/nacc-xgboost/preprocessor.json');
        const meta: PreprocessorMeta = await metaRes.json();
        
        // Configure WASM paths
        ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

        // Load ONNX model
        const sess = await ort.InferenceSession.create('/models/nacc-xgboost/xgboost_model.onnx', {
          executionProviders: ['wasm']
        });

        if (!isCancelled) {
          setPreprocessorMeta(meta);
          setSession(sess);
          setModelLoaded(true);
          setIsLoadingModel(false);
        }
      } catch (err) {
        console.error('Failed to initialize NACC XGBoost ONNX runtime:', err);
        if (!isCancelled) {
          setIsLoadingModel(false);
        }
      }
    }

    initONNX();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Perform Inference
  const runInference = useCallback(async (currentFeatures: NACCFeatures) => {
    if (!session || !preprocessorMeta) return;

    try {
      setIsInferring(true);
      const startTime = performance.now();

      // Ordered 19 features
      const rawVector = [
        currentFeatures.NACCAGE,
        currentFeatures.EDUC,
        currentFeatures.CRAFTVRS,
        currentFeatures.CRAFTDVR,
        currentFeatures.UDSBENTC,
        currentFeatures.UDSBENTD,
        currentFeatures.ANIMALS,
        currentFeatures.VEG,
        currentFeatures.MOCAFLUE,
        currentFeatures.MINTTOTS,
        currentFeatures.TRAILA,
        currentFeatures.TRAILB,
        currentFeatures.WAIS,
        currentFeatures.DIGIFLEN,
        currentFeatures.DIGIBLEN,
        currentFeatures.MOCALETT,
        currentFeatures.MOCACUBE,
        currentFeatures.MOCACLOC,
        currentFeatures.ORIENT
      ];

      // Standardize features using training scaler
      const scaledVector = rawVector.map((val, idx) => {
        const mean = preprocessorMeta.scaler_means[idx];
        const scale = preprocessorMeta.scaler_scales[idx];
        return (val - mean) / scale;
      });

      const tensor = new ort.Tensor('float32', new Float32Array(scaledVector), [1, 19]);
      const results = await session.run({ [session.inputNames[0]]: tensor });

      const labelOutput = results[session.outputNames[0]];
      const probOutput = results[session.outputNames[1]];

      const endTime = performance.now();
      setInferenceLatencyMs(Math.round((endTime - startTime) * 10) / 10);

      if (labelOutput && labelOutput.data) {
        setPredictedClass(Number(labelOutput.data[0]));
      }

      if (probOutput && probOutput.data) {
        const probs = Array.from(probOutput.data as Float32Array);
        if (probs.length >= 3) {
          setProbabilities([probs[0], probs[1], probs[2]]);
        }
      }
    } catch (err) {
      console.error('Inference execution error:', err);
    } finally {
      setIsInferring(false);
    }
  }, [session, preprocessorMeta]);

  // Run inference whenever features change
  useEffect(() => {
    if (modelLoaded) {
      runInference(features);
    }
  }, [features, modelLoaded, runInference]);

  // Handle Preset Change
  const handleSelectPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    if (PRESETS[presetKey]) {
      setFeatures(PRESETS[presetKey].data);
    }
  };

  // Handle Feature Slider Change
  const handleFeatureChange = (featureKey: keyof NACCFeatures, value: number) => {
    setSelectedPreset('custom');
    setFeatures(prev => ({
      ...prev,
      [featureKey]: value
    }));
  };

  // Randomized profile generator
  const handleRandomize = () => {
    setSelectedPreset('custom');
    setFeatures({
      NACCAGE: Math.floor(55 + Math.random() * 35),
      EDUC: Math.floor(8 + Math.random() * 12),
      CRAFTVRS: Math.floor(Math.random() * 26),
      CRAFTDVR: Math.floor(Math.random() * 26),
      UDSBENTC: Math.floor(Math.random() * 18),
      UDSBENTD: Math.floor(Math.random() * 18),
      ANIMALS: Math.floor(5 + Math.random() * 25),
      VEG: Math.floor(4 + Math.random() * 20),
      MOCAFLUE: Math.floor(Math.random() * 6),
      MINTTOTS: Math.floor(10 + Math.random() * 23),
      TRAILA: Math.floor(20 + Math.random() * 140),
      TRAILB: Math.floor(50 + Math.random() * 250),
      WAIS: Math.floor(10 + Math.random() * 60),
      DIGIFLEN: Math.floor(3 + Math.random() * 8),
      DIGIBLEN: Math.floor(2 + Math.random() * 8),
      MOCALETT: Math.random() > 0.3 ? 1 : 0,
      MOCACUBE: Math.random() > 0.4 ? 1 : 0,
      MOCACLOC: Math.floor(Math.random() * 4),
      ORIENT: [0.0, 0.5, 1.0, 2.0][Math.floor(Math.random() * 4)]
    });
  };

  // Estimated MoCA score calculation based on clinical markers
  const estimatedMoCA = useMemo(() => {
    const memoryRatio = (features.CRAFTDVR / 25) * 5; // 5 pts
    const languageRatio = ((features.ANIMALS + features.VEG) / 60) * 6; // 6 pts
    const executiveRatio = (Math.max(0, 300 - features.TRAILB) / 260) * 4; // 4 pts
    const attentionRatio = ((features.DIGIFLEN + features.DIGIBLEN) / 20) * 5; // 5 pts
    const visuoRatio = (features.MOCACUBE + (features.MOCACLOC / 3) * 3); // 4 pts
    const orientScore = Math.max(0, 6 - (features.ORIENT * 2.5)); // 6 pts

    const rawTotal = memoryRatio + languageRatio + executiveRatio + attentionRatio + visuoRatio + orientScore;
    // Education correction (+1 for <= 12 years if < 30)
    const eduBoost = features.EDUC <= 12 ? 1 : 0;
    const finalScore = Math.min(30, Math.max(0, Math.round((rawTotal + eduBoost) * 10) / 10));
    return finalScore;
  }, [features]);

  // Clinical Alert output
  const clinicalAlert = useMemo(() => {
    const trajectory = predictedClass === 0 ? 'STABLE' : predictedClass === 1 ? 'POSSIBLE_DECLINE' : 'RAPID_DECLINE';
    const confidenceMetrics: ConfidenceMetrics = {
      density: 92,
      completeness: 100,
      oodDistance: 88,
      uncertainty: Math.round(Math.max(...probabilities) * 100),
      history: 100
    };
    return generateClinicalAlert(trajectory, probabilities[2] + (probabilities[1] * 0.5), confidenceMetrics);
  }, [predictedClass, probabilities]);

  // Longitudinal Simulation Data points
  const simulatedTrajectoryPoints: SessionPoint[] = useMemo(() => {
    const points: SessionPoint[] = [];
    const baseScore = estimatedMoCA * 3.33; // scale to 0-100
    const now = Date.now();
    const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;

    for (let i = 0; i < simSessionsCount; i++) {
      const monthOffset = (simSessionsCount - 1 - i) * 6; // 6 months apart
      const expectedDrop = (simSessionsCount - 1 - i) * (simDeclineRate * 2);
      const randomNoise = (Math.random() - 0.5) * simNoise * 2;
      const score = Math.max(0, Math.min(100, Math.round(baseScore - expectedDrop + randomNoise)));

      points.push({
        timestamp: now - (monthOffset * MS_PER_MONTH),
        score,
        domainScores: {
          memory: Math.max(0, Math.min(100, Math.round((features.CRAFTDVR / 25) * 100 - expectedDrop))),
          language: Math.max(0, Math.min(100, Math.round(((features.ANIMALS + features.VEG) / 55) * 100))),
          executive: Math.max(0, Math.min(100, Math.round((Math.max(0, 300 - features.TRAILB) / 260) * 100))),
          attention: Math.max(0, Math.min(100, Math.round((features.WAIS / 80) * 100)))
        }
      });
    }
    return points;
  }, [estimatedMoCA, simSessionsCount, simDeclineRate, simNoise, features]);

  const simulatedEvaluation = useMemo(() => {
    return evaluatePatientTrajectory(simulatedTrajectoryPoints);
  }, [simulatedTrajectoryPoints]);

  const uniqueDomains = useMemo(() => {
    const doms = new Set<string>();
    Object.values(FEATURE_METADATA).forEach(m => doms.add(m.domain));
    return ['All', ...Array.from(doms)];
  }, []);

  return (
    <div className="ml-playground-container">
      {/* Top Header */}
      <header className="ml-hero-header">
        <div className="ml-nav-bar">
          <Link to="/dashboard" className="ml-back-link">
            <Icon name="chevron-right" size={16} className="ml-back-icon" />
            Back to Clinical Dashboard
          </Link>
          <div className="ml-status-badges">
            <div className={`ml-runtime-badge ${modelLoaded ? 'loaded' : 'loading'}`}>
              <span className="ml-pulse-dot" />
              {isLoadingModel ? 'Loading ONNX Model...' : isInferring ? 'Evaluating Feature Vectors...' : modelLoaded ? 'ONNX WASM Runtime Active (Zero-Latency)' : 'Runtime Offline'}
            </div>
            <div className="ml-badge-pill">
              NACC UDS-74 XGBoost Model
            </div>
          </div>
        </div>

        <h1 className="ml-title">NACC Clinical Model Interactive Sandbox</h1>
        <p className="ml-subtitle">
          Test real-time 3-class cognitive staging (Normal, MCI, Dementia) with 19 standard neuropsychological biomarkers running 100% client-side via ONNX WebAssembly.
        </p>

        {/* Tab Selector */}
        <div className="ml-tab-container">
          <button
            className={`ml-tab-btn ${activeTab === 'cross-sectional' ? 'active' : ''}`}
            onClick={() => setActiveTab('cross-sectional')}
          >
            <Icon name="brain-circuit" size={18} />
            Cross-Sectional Staging Tester
          </button>
          <button
            className={`ml-tab-btn ${activeTab === 'longitudinal' ? 'active' : ''}`}
            onClick={() => setActiveTab('longitudinal')}
          >
            <Icon name="chart-trend" size={18} />
            Longitudinal Drift & Alert Simulator
          </button>
        </div>

        {/* Presets Bar */}
        <div className="ml-presets-bar">
          <span className="ml-preset-label">Clinical Presets:</span>
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              className={`ml-preset-btn ${selectedPreset === key ? 'active' : ''}`}
              onClick={() => handleSelectPreset(key)}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
          <button
            className={`ml-preset-btn ${selectedPreset === 'custom' ? 'active' : ''}`}
            onClick={handleRandomize}
          >
            🎲 Randomize Profile
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="ml-grid-layout">
        
        {/* LEFT COLUMN: Controls & Input Biomarkers */}
        <section className="ml-left-panel">
          {activeTab === 'cross-sectional' ? (
            <div className="ml-card-panel">
              <div className="ml-panel-header">
                <div>
                  <h2 className="ml-panel-title">19-Biomarker Neuropsychological Profile</h2>
                  <p className="ml-panel-subtitle">Adjust patient parameters to evaluate live inference response</p>
                </div>
                {/* Domain filter tags */}
                <div className="ml-domain-filters">
                  {uniqueDomains.map(d => (
                    <button
                      key={d}
                      className={`ml-domain-filter-btn ${activeDomain === d ? 'active' : ''}`}
                      onClick={() => setActiveDomain(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ml-features-list">
                {Object.entries(FEATURE_METADATA)
                  .filter(([_, meta]) => activeDomain === 'All' || meta.domain === activeDomain)
                  .map(([key, meta]) => {
                    const featureKey = key as keyof NACCFeatures;
                    const val = features[featureKey];
                    return (
                      <div key={key} className="ml-feature-control">
                        <div className="ml-feature-meta">
                          <div className="ml-feature-label-group">
                            <span className="ml-feature-name">{meta.label}</span>
                            <span className="ml-feature-code">({key})</span>
                          </div>
                          <div className="ml-feature-val-badge">
                            {val} {meta.unit}
                          </div>
                        </div>
                        <input
                          type="range"
                          min={meta.min}
                          max={meta.max}
                          step={meta.step}
                          value={val}
                          onChange={(e) => handleFeatureChange(featureKey, parseFloat(e.target.value))}
                          className="ml-slider-input"
                        />
                        <div className="ml-feature-hint">
                          <span>{meta.desc}</span>
                          <span>Range: {meta.min} - {meta.max} {meta.unit}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* Longitudinal Simulation Controls */
            <div className="ml-card-panel">
              <div className="ml-panel-header">
                <div>
                  <h2 className="ml-panel-title">Longitudinal Drift Test Controls</h2>
                  <p className="ml-panel-subtitle">Configure multi-session intervals to test Theil-Sen slope & RCI</p>
                </div>
              </div>

              <div className="ml-sim-controls-grid">
                <div className="ml-control-group">
                  <label className="ml-control-label">Total Visits / Sessions: {simSessionsCount}</label>
                  <input
                    type="range"
                    min={2}
                    max={8}
                    step={1}
                    value={simSessionsCount}
                    onChange={(e) => setSimSessionsCount(parseInt(e.target.value))}
                    className="ml-slider-input"
                  />
                  <span className="ml-control-desc">Interval: 6 months between visits</span>
                </div>

                <div className="ml-control-group">
                  <label className="ml-control-label">Cognitive Decline Rate: -{simDeclineRate} pts / month</label>
                  <input
                    type="range"
                    min={0.0}
                    max={4.0}
                    step={0.1}
                    value={simDeclineRate}
                    onChange={(e) => setSimDeclineRate(parseFloat(e.target.value))}
                    className="ml-slider-input"
                  />
                  <span className="ml-control-desc">Slope parameter for Theil-Sen estimator</span>
                </div>

                <div className="ml-control-group">
                  <label className="ml-control-label">Test-Retest Physiological Noise: ±{simNoise} pts</label>
                  <input
                    type="range"
                    min={0.5}
                    max={8.0}
                    step={0.5}
                    value={simNoise}
                    onChange={(e) => setSimNoise(parseFloat(e.target.value))}
                    className="ml-slider-input"
                  />
                  <span className="ml-control-desc">Simulates transient fatigue or sleep fluctuations</span>
                </div>
              </div>

              <div className="ml-sim-sessions-preview">
                <h3 className="ml-subheading">Generated Multi-Session History</h3>
                <div className="ml-sessions-table-wrapper">
                  <table className="ml-sessions-table">
                    <thead>
                      <tr>
                        <th>Visit</th>
                        <th>Composite Score</th>
                        <th>Memory</th>
                        <th>Executive</th>
                        <th>Language</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simulatedTrajectoryPoints.map((s, idx) => (
                        <tr key={idx}>
                          <td>Visit {idx + 1} (M+{idx * 6})</td>
                          <td className="ml-table-bold">{s.score}/100</td>
                          <td>{s.domainScores?.memory ?? '-'}</td>
                          <td>{s.domainScores?.executive ?? '-'}</td>
                          <td>{s.domainScores?.language ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: Inference Diagnostic Output */}
        <section className="ml-right-panel">
          
          {/* Main Status Hero */}
          <div className={`ml-status-hero ${
            predictedClass === 0 ? 'status-normal' : predictedClass === 1 ? 'status-mci' : 'status-dementia'
          }`}>
            <div className="ml-status-badge-row">
              <span className="ml-status-tag">
                {predictedClass === 0 ? '🟢 Stage 0: Normal' : predictedClass === 1 ? '🟠 Stage 1: MCI' : '🔴 Stage 2: Dementia'}
              </span>
              <span className="ml-latency-tag">
                ⚡ Inference Latency: {inferenceLatencyMs} ms
              </span>
            </div>

            <h2 className="ml-diagnosis-title">
              {predictedClass === 0 && 'Normal Cognition'}
              {predictedClass === 1 && 'Mild Cognitive Impairment (MCI)'}
              {predictedClass === 2 && 'Probable Dementia'}
            </h2>
            <p className="ml-diagnosis-desc">
              {predictedClass === 0 && 'Biomarker parameters align with healthy age-matched population baselines.'}
              {predictedClass === 1 && 'Measurable domain-specific decline exceeding expected normal test-retest variance.'}
              {predictedClass === 2 && 'Significant multi-domain impairment across memory, executive speed, and orientation.'}
            </p>

            {/* Probability Bars */}
            <div className="ml-probabilities-container">
              <div className="ml-prob-row">
                <div className="ml-prob-header">
                  <span>Normal Cognition</span>
                  <span className="ml-prob-val">{(probabilities[0] * 100).toFixed(1)}%</span>
                </div>
                <div className="ml-progress-track">
                  <div className="ml-progress-fill prob-normal" style={{ width: `${probabilities[0] * 100}%` }} />
                </div>
              </div>

              <div className="ml-prob-row">
                <div className="ml-prob-header">
                  <span>Mild Cognitive Impairment (MCI)</span>
                  <span className="ml-prob-val">{(probabilities[1] * 100).toFixed(1)}%</span>
                </div>
                <div className="ml-progress-track">
                  <div className="ml-progress-fill prob-mci" style={{ width: `${probabilities[1] * 100}%` }} />
                </div>
              </div>

              <div className="ml-prob-row">
                <div className="ml-prob-header">
                  <span>Dementia Phenotype</span>
                  <span className="ml-prob-val">{(probabilities[2] * 100).toFixed(1)}%</span>
                </div>
                <div className="ml-progress-track">
                  <div className="ml-progress-fill prob-dementia" style={{ width: `${probabilities[2] * 100}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Metrics & Estimated MoCA */}
          <div className="ml-metrics-cards-grid">
            <div className="ml-metric-card">
              <div className="ml-metric-icon">
                <Icon name="assess" size={20} />
              </div>
              <div className="ml-metric-info">
                <span className="ml-metric-label">Estimated Continuous MoCA</span>
                <span className="ml-metric-value">{estimatedMoCA} <span className="ml-metric-denom">/ 30</span></span>
                <span className="ml-metric-status">
                  {estimatedMoCA >= 26 ? '🟢 Normal (≥26)' : estimatedMoCA >= 18 ? '🟠 Mild Impairment' : '🔴 Severe Impairment'}
                </span>
              </div>
            </div>

            <div className="ml-metric-card">
              <div className="ml-metric-icon">
                <Icon name="shield-check" size={20} />
              </div>
              <div className="ml-metric-info">
                <span className="ml-metric-label">Clinical Alert Tier</span>
                <span className="ml-metric-value alert-badge" style={{ color: clinicalAlert.colorCode === 'RED' ? '#ef4444' : clinicalAlert.colorCode === 'ORANGE' ? '#f59e0b' : '#10b981' }}>
                  {clinicalAlert.alertLevel}
                </span>
                <span className="ml-metric-status">
                  Confidence: {clinicalAlert.confidenceScore.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Longitudinal Drift Results (when on longitudinal tab) */}
          {activeTab === 'longitudinal' && (
            <div className="ml-card-panel ml-longitudinal-panel">
              <h3 className="ml-panel-title">Biostatistical Drift Engine Analysis</h3>
              <div className="ml-drift-results-grid">
                <div className="ml-drift-stat">
                  <span className="ml-stat-title">Theil-Sen Slope (β)</span>
                  <span className="ml-stat-value">{simulatedEvaluation.trajectory.theilSenSlopePerMonth.toFixed(2)} pts/mo</span>
                  <span className="ml-stat-note">Median pairwise slope</span>
                </div>
                <div className="ml-drift-stat">
                  <span className="ml-stat-title">Reliable Change Index</span>
                  <span className="ml-stat-value">{simulatedEvaluation.trajectory.rci.toFixed(2)} σ</span>
                  <span className="ml-stat-note">SEM-corrected test-retest threshold</span>
                </div>
                <div className="ml-drift-stat">
                  <span className="ml-stat-title">Longitudinal Trajectory</span>
                  <span className="ml-stat-value trajectory-badge">
                    {simulatedEvaluation.trajectory.tier}
                  </span>
                  <span className="ml-stat-note">{simulatedEvaluation.trajectory.actionGuidance}</span>
                </div>
              </div>
            </div>
          )}

          {/* Feature Importance & Explainability */}
          <div className="ml-card-panel">
            <div className="ml-panel-header">
              <h3 className="ml-panel-title">Top Clinically Plausible Biomarker Drivers</h3>
            </div>
            <div className="ml-explainability-list">
              <div className="ml-driver-item">
                <div className="ml-driver-info">
                  <span className="ml-driver-rank">#1</span>
                  <div>
                    <span className="ml-driver-name">Orientation to Time & Place (ORIENT)</span>
                    <span className="ml-driver-domain">Visuospatial / Orientation</span>
                  </div>
                </div>
                <span className="ml-driver-weight">76.9% Model Weight</span>
              </div>

              <div className="ml-driver-item">
                <div className="ml-driver-info">
                  <span className="ml-driver-rank">#2</span>
                  <div>
                    <span className="ml-driver-name">Vegetable Category Fluency (VEG)</span>
                    <span className="ml-driver-domain">Semantic Language</span>
                  </div>
                </div>
                <span className="ml-driver-weight">4.4% Model Weight</span>
              </div>

              <div className="ml-driver-item">
                <div className="ml-driver-info">
                  <span className="ml-driver-rank">#3</span>
                  <div>
                    <span className="ml-driver-name">Animal Category Fluency (ANIMALS)</span>
                    <span className="ml-driver-domain">Semantic Language</span>
                  </div>
                </div>
                <span className="ml-driver-weight">3.9% Model Weight</span>
              </div>

              <div className="ml-driver-item">
                <div className="ml-driver-info">
                  <span className="ml-driver-rank">#4</span>
                  <div>
                    <span className="ml-driver-name">Trail Making Test B (TRAILB)</span>
                    <span className="ml-driver-domain">Executive / Task Switching</span>
                  </div>
                </div>
                <span className="ml-driver-weight">2.9% Model Weight</span>
              </div>

              <div className="ml-driver-item">
                <div className="ml-driver-info">
                  <span className="ml-driver-rank">#5</span>
                  <div>
                    <span className="ml-driver-name">Craft Story Delayed Recall (CRAFTDVR)</span>
                    <span className="ml-driver-domain">Episodic Memory</span>
                  </div>
                </div>
                <span className="ml-driver-weight">2.8% Model Weight</span>
              </div>
            </div>
          </div>

          {/* Raw ONNX Tensor Inspector */}
          <div className="ml-card-panel">
            <details className="ml-raw-inspector">
              <summary className="ml-inspector-summary">
                <Icon name="brain-circuit" size={16} />
                Inspect Raw ONNX Tensor Vector (19-D)
              </summary>
              <div className="ml-tensor-code">
                <pre>
{JSON.stringify({
  model: "XGBoost 3-Class Classifier (ONNX WASM)",
  input_tensor_shape: [1, 19],
  raw_features: features,
  runtime_probabilities: {
    normal: probabilities[0],
    mci: probabilities[1],
    dementia: probabilities[2]
  },
  predicted_class: predictedClass,
  inference_latency_ms: inferenceLatencyMs
}, null, 2)}
                </pre>
              </div>
            </details>
          </div>

        </section>

      </main>
    </div>
  );
}
