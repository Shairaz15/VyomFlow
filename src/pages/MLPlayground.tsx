import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { loadVyomFlowMLModel } from '../ml/modelLoader';
import { predictWithBundle, type AssessmentInputFeatures } from '../ml/vyomflowPredictor';
import type { VyomFlowMLModelBundle, VyomFlowMLPrediction } from '../ml/types';
import { Icon } from '../components/common/Icon';
import './MLPlayground.css';

// Pre-defined clinical test presets
const PRESETS = {
  healthyYoung: {
    name: '🟢 Healthy Young Adult',
    description: 'Optimal cognitive performance (Age 28, High Speed, Low Hesitation)',
    data: {
      age: 28,
      gender: 'Female',
      yearsOfEducation: 16,
      primaryLanguage: 'English',
      urbanRural: 'Urban',
      nav_navigationScore: 96,
      nav_navigationAccuracy: 0.98,
      nav_averageDecisionLatencyMs: 2150,
      nav_decisionLatencyVariance: 500,
      nav_landmarkRecognitionAccuracy: 0.98,
      nav_destinationRecallAccuracy: 1,
      lang_cognitiveSpeechIndex: 94,
      lang_wpm: 155,
      lang_phonationRatio: 0.96,
      lang_hesitationIndex: 0.02,
      story_storyRecallScore: 92,
      story_recallAccuracy: 0.90,
      story_mcqAccuracy: 1.0,
      vmra_compositeMemoryScore: 95,
      vmra_recallAccuracy: 0.95,
      savt_compositeSAVTScore: 96,
      savt_hitRate: 0.98,
      savt_falseAlarmRate: 0.02,
      savt_dPrime: 3.6,
      pat_patternScore: 94,
      pat_maxSequenceSpan: 8,
      rxn_meanReactionTime: 225,
      rxn_consistencyScore: 0.98,
      cross_previousMoCAEstimate: 29,
    },
  },
  healthySenior: {
    name: '🟢 Healthy Senior (Normal)',
    description: 'Age-appropriate healthy senior baseline with intact functional independence',
    data: {
      age: 72,
      gender: 'Male',
      yearsOfEducation: 14,
      primaryLanguage: 'Hindi',
      urbanRural: 'Urban',
      nav_navigationScore: 84,
      nav_navigationAccuracy: 0.86,
      nav_averageDecisionLatencyMs: 2850,
      nav_decisionLatencyVariance: 850,
      nav_landmarkRecognitionAccuracy: 0.88,
      nav_destinationRecallAccuracy: 1,
      lang_cognitiveSpeechIndex: 86,
      lang_wpm: 135,
      lang_phonationRatio: 0.92,
      lang_hesitationIndex: 0.06,
      story_storyRecallScore: 80,
      story_recallAccuracy: 0.78,
      story_mcqAccuracy: 0.85,
      vmra_compositeMemoryScore: 82,
      vmra_recallAccuracy: 0.82,
      savt_compositeSAVTScore: 84,
      savt_hitRate: 0.88,
      savt_falseAlarmRate: 0.08,
      savt_dPrime: 2.7,
      pat_patternScore: 80,
      pat_maxSequenceSpan: 6,
      rxn_meanReactionTime: 310,
      rxn_consistencyScore: 0.95,
      cross_previousMoCAEstimate: 28,
    },
  },
  earlyMci: {
    name: '🟡 Early MCI (Mild Impairment)',
    description: 'Subtle spatial disorientation, elevated speech pauses, and mild episodic decay',
    data: {
      age: 77,
      gender: 'Female',
      yearsOfEducation: 8,
      primaryLanguage: 'Tamil',
      urbanRural: 'Rural',
      nav_navigationScore: 63,
      nav_navigationAccuracy: 0.58,
      nav_averageDecisionLatencyMs: 4980,
      nav_decisionLatencyVariance: 3340,
      nav_landmarkRecognitionAccuracy: 0.66,
      nav_destinationRecallAccuracy: 1,
      lang_cognitiveSpeechIndex: 72,
      lang_wpm: 112,
      lang_phonationRatio: 0.86,
      lang_hesitationIndex: 0.16,
      story_storyRecallScore: 54,
      story_recallAccuracy: 0.58,
      story_mcqAccuracy: 0.60,
      vmra_compositeMemoryScore: 62,
      vmra_recallAccuracy: 0.65,
      savt_compositeSAVTScore: 72,
      savt_hitRate: 0.68,
      savt_falseAlarmRate: 0.22,
      savt_dPrime: 1.4,
      pat_patternScore: 68,
      pat_maxSequenceSpan: 4,
      rxn_meanReactionTime: 420,
      rxn_consistencyScore: 0.90,
      cross_previousMoCAEstimate: 23,
    },
  },
  dementia: {
    name: '🔴 Moderate-Severe Decline',
    description: 'Multi-domain impairment across spatial route, episodic recall, and attention span',
    data: {
      age: 82,
      gender: 'Male',
      yearsOfEducation: 6,
      primaryLanguage: 'Bengali',
      urbanRural: 'Rural',
      nav_navigationScore: 42,
      nav_navigationAccuracy: 0.38,
      nav_averageDecisionLatencyMs: 6800,
      nav_decisionLatencyVariance: 4800,
      nav_landmarkRecognitionAccuracy: 0.45,
      nav_destinationRecallAccuracy: 0,
      lang_cognitiveSpeechIndex: 48,
      lang_wpm: 78,
      lang_phonationRatio: 0.74,
      lang_hesitationIndex: 0.32,
      story_storyRecallScore: 36,
      story_recallAccuracy: 0.32,
      story_mcqAccuracy: 0.40,
      vmra_compositeMemoryScore: 38,
      vmra_recallAccuracy: 0.35,
      savt_compositeSAVTScore: 48,
      savt_hitRate: 0.45,
      savt_falseAlarmRate: 0.42,
      savt_dPrime: 0.5,
      pat_patternScore: 42,
      pat_maxSequenceSpan: 2,
      rxn_meanReactionTime: 590,
      rxn_consistencyScore: 0.82,
      cross_previousMoCAEstimate: 16,
    },
  },
};

export function MLPlayground() {
  const [bundle, setBundle] = useState<VyomFlowMLModelBundle | null>(null);
  const [activePreset, setActivePreset] = useState<string>('earlyMci');
  const [formData, setFormData] = useState<AssessmentInputFeatures>(PRESETS.earlyMci.data);
  const [showJsonPayload, setShowJsonPayload] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    demographics: true,
    navigation: true,
    language: true,
    story: true,
    vmra: true,
    savt: true,
    pattern: false,
    reaction: false,
  });

  // Load Model Bundle on Mount
  useEffect(() => {
    loadVyomFlowMLModel().then((loaded) => {
      setBundle(loaded);
    });
  }, []);

  // Handle Preset Switching
  const handleSelectPreset = (key: keyof typeof PRESETS) => {
    setActivePreset(key);
    setFormData({ ...PRESETS[key].data });
  };

  // Handle Field Value Changes
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setActivePreset('custom');
  };

  // Toggle Section Collapse
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Real-Time Inference
  const prediction: VyomFlowMLPrediction | null = useMemo(() => {
    if (!bundle) return null;
    return predictWithBundle(formData, bundle);
  }, [formData, bundle]);

  return (
    <div className="ml-playground-container">
      {/* Top Hero Navigation Header */}
      <header className="ml-hero-header">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4">
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
            >
              <Icon name="chevron-right" size={16} className="rotate-180" /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono text-emerald-400">In-Browser ML Engine v2.0</span>
            </div>
          </div>

          <div className="ml-badge-pill">
            <Icon name="brain-circuit" size={16} /> SaMD AI Model Testing Console
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            VyomFlow Cognitive AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-500">Live Predictor</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl text-center">
            Adjust individual digital micro-biomarkers from all 7 assessment modules to test real-time multi-task diagnosis, continuous MoCA scoring, and SHAP feature attributions.
          </p>

          {/* Quick Preset Selector */}
          <div className="ml-presets-bar">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectPreset(key as keyof typeof PRESETS)}
                className={`ml-preset-btn ${activePreset === key ? 'active' : ''}`}
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main 2-Column Responsive Layout */}
      <main className="ml-grid-layout">
        {/* LEFT COLUMN: Input Modulators (7 Modules + Demographics) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Icon name="assess" size={18} className="text-cyan-400" />
              Assessment Feature Modulators
            </h2>
            <button
              onClick={() => handleSelectPreset('earlyMci')}
              className="text-xs text-slate-400 hover:text-cyan-400 font-medium transition-colors"
            >
              Reset Inputs
            </button>
          </div>

          {/* 1. Demographics & Context */}
          <div className="ml-module-accordion">
            <div className="ml-module-header" onClick={() => toggleSection('demographics')}>
              <span className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                👤 Demographics & Covariates
              </span>
              <span className="text-xs text-slate-400">
                {expandedSections.demographics ? '▲' : '▼'}
              </span>
            </div>
            {expandedSections.demographics && (
              <div className="ml-module-body">
                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Age (Years)</span>
                    <span className="ml-slider-val">{formData.age ?? 65} yrs</span>
                  </div>
                  <input
                    type="range"
                    min="18"
                    max="95"
                    value={Number(formData.age ?? 65)}
                    onChange={(e) => handleChange('age', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>

                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Education (Years)</span>
                    <span className="ml-slider-val">{formData.yearsOfEducation ?? 12} yrs</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="22"
                    value={Number(formData.yearsOfEducation ?? 12)}
                    onChange={(e) => handleChange('yearsOfEducation', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>

                <div className="ml-control-field">
                  <label className="text-xs text-slate-400">Primary Language</label>
                  <select
                    value={String(formData.primaryLanguage ?? 'English')}
                    onChange={(e) => handleChange('primaryLanguage', e.target.value)}
                    className="ml-select-input"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Tamil">Tamil</option>
                    <option value="Telugu">Telugu</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Bengali">Bengali</option>
                    <option value="Marathi">Marathi</option>
                  </select>
                </div>

                <div className="ml-control-field">
                  <label className="text-xs text-slate-400">Setting</label>
                  <select
                    value={String(formData.urbanRural ?? 'Urban')}
                    onChange={(e) => handleChange('urbanRural', e.target.value)}
                    className="ml-select-input"
                  >
                    <option value="Urban">Urban</option>
                    <option value="Rural">Rural</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 2. Navigation Assessment */}
          <div className="ml-module-accordion">
            <div className="ml-module-header" onClick={() => toggleSection('navigation')}>
              <span className="font-semibold text-sm text-cyan-300 flex items-center gap-2">
                <Icon name="navigation" size={16} /> 1. Video Navigation & Spatial Orientation
              </span>
              <span className="text-xs text-slate-400">
                Score: {Math.round(Number(formData.nav_navigationScore ?? 80))}% {expandedSections.navigation ? '▲' : '▼'}
              </span>
            </div>
            {expandedSections.navigation && (
              <div className="ml-module-body">
                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Navigation Composite Score</span>
                    <span className="ml-slider-val">{Math.round(Number(formData.nav_navigationScore ?? 80))}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Number(formData.nav_navigationScore ?? 80)}
                    onChange={(e) => handleChange('nav_navigationScore', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>

                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Turn Decision Latency</span>
                    <span className="ml-slider-val">{formData.nav_averageDecisionLatencyMs ?? 2500} ms</span>
                  </div>
                  <input
                    type="range"
                    min="1500"
                    max="8000"
                    step="50"
                    value={Number(formData.nav_averageDecisionLatencyMs ?? 2500)}
                    onChange={(e) => handleChange('nav_averageDecisionLatencyMs', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>

                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Decision Latency Variance</span>
                    <span className="ml-slider-val">{formData.nav_decisionLatencyVariance ?? 1000} ms²</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="6000"
                    step="100"
                    value={Number(formData.nav_decisionLatencyVariance ?? 1000)}
                    onChange={(e) => handleChange('nav_decisionLatencyVariance', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>

                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Landmark Recognition</span>
                    <span className="ml-slider-val">{Math.round(Number(formData.nav_landmarkRecognitionAccuracy ?? 0.8) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={Number(formData.nav_landmarkRecognitionAccuracy ?? 0.8)}
                    onChange={(e) => handleChange('nav_landmarkRecognitionAccuracy', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Language & Speech */}
          <div className="ml-module-accordion">
            <div className="ml-module-header" onClick={() => toggleSection('language')}>
              <span className="font-semibold text-sm text-indigo-300 flex items-center gap-2">
                <Icon name="language" size={16} /> 2. Language & Acoustic Biomarkers
              </span>
              <span className="text-xs text-slate-400">
                CSI: {Math.round(Number(formData.lang_cognitiveSpeechIndex ?? 85))} {expandedSections.language ? '▲' : '▼'}
              </span>
            </div>
            {expandedSections.language && (
              <div className="ml-module-body">
                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Cognitive Speech Index (CSI)</span>
                    <span className="ml-slider-val">{Math.round(Number(formData.lang_cognitiveSpeechIndex ?? 85))}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Number(formData.lang_cognitiveSpeechIndex ?? 85)}
                    onChange={(e) => handleChange('lang_cognitiveSpeechIndex', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>

                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Hesitation Disfluency Index</span>
                    <span className="ml-slider-val">{Number(formData.lang_hesitationIndex ?? 0.05).toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.5"
                    step="0.01"
                    value={Number(formData.lang_hesitationIndex ?? 0.05)}
                    onChange={(e) => handleChange('lang_hesitationIndex', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>

                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Speech Phonation Ratio</span>
                    <span className="ml-slider-val">{Math.round(Number(formData.lang_phonationRatio ?? 0.9) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.0"
                    step="0.02"
                    value={Number(formData.lang_phonationRatio ?? 0.9)}
                    onChange={(e) => handleChange('lang_phonationRatio', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>

                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Speaking Rate (WPM)</span>
                    <span className="ml-slider-val">{Math.round(Number(formData.lang_wpm ?? 140))} wpm</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="220"
                    step="5"
                    value={Number(formData.lang_wpm ?? 140)}
                    onChange={(e) => handleChange('lang_wpm', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. Story Recall */}
          <div className="ml-module-accordion">
            <div className="ml-module-header" onClick={() => toggleSection('story')}>
              <span className="font-semibold text-sm text-purple-300 flex items-center gap-2">
                <Icon name="story" size={16} /> 3. Story Narration & Auditory Recall
              </span>
              <span className="text-xs text-slate-400">
                Score: {Math.round(Number(formData.story_storyRecallScore ?? 80))} {expandedSections.story ? '▲' : '▼'}
              </span>
            </div>
            {expandedSections.story && (
              <div className="ml-module-body">
                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Story Recall Score (25–100)</span>
                    <span className="ml-slider-val">{Math.round(Number(formData.story_storyRecallScore ?? 80))}</span>
                  </div>
                  <input
                    type="range"
                    min="25"
                    max="100"
                    value={Number(formData.story_storyRecallScore ?? 80)}
                    onChange={(e) => handleChange('story_storyRecallScore', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>

                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Information Units Recall Rate</span>
                    <span className="ml-slider-val">{Math.round(Number(formData.story_recallAccuracy ?? 0.8) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={Number(formData.story_recallAccuracy ?? 0.8)}
                    onChange={(e) => handleChange('story_recallAccuracy', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. VMRA (Visual Memory Recall) */}
          <div className="ml-module-accordion">
            <div className="ml-module-header" onClick={() => toggleSection('vmra')}>
              <span className="font-semibold text-sm text-emerald-300 flex items-center gap-2">
                <Icon name="memory" size={16} /> 4. Visual Memory Recall (VMRA)
              </span>
              <span className="text-xs text-slate-400">
                Score: {Math.round(Number(formData.vmra_compositeMemoryScore ?? 85))} {expandedSections.vmra ? '▲' : '▼'}
              </span>
            </div>
            {expandedSections.vmra && (
              <div className="ml-module-body">
                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Composite Memory Score</span>
                    <span className="ml-slider-val">{Math.round(Number(formData.vmra_compositeMemoryScore ?? 85))}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Number(formData.vmra_compositeMemoryScore ?? 85)}
                    onChange={(e) => handleChange('vmra_compositeMemoryScore', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>

                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Visual Recall Accuracy</span>
                    <span className="ml-slider-val">{Math.round(Number(formData.vmra_recallAccuracy ?? 0.85) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={Number(formData.vmra_recallAccuracy ?? 0.85)}
                    onChange={(e) => handleChange('vmra_recallAccuracy', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 6. SAVT (Attention & Vigilance) */}
          <div className="ml-module-accordion">
            <div className="ml-module-header" onClick={() => toggleSection('savt')}>
              <span className="font-semibold text-sm text-amber-300 flex items-center gap-2">
                <Icon name="attention" size={16} /> 5. Sustained Attention & Vigilance (SAVT)
              </span>
              <span className="text-xs text-slate-400">
                Score: {Math.round(Number(formData.savt_compositeSAVTScore ?? 88))} {expandedSections.savt ? '▲' : '▼'}
              </span>
            </div>
            {expandedSections.savt && (
              <div className="ml-module-body">
                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>SAVT Composite Score</span>
                    <span className="ml-slider-val">{Math.round(Number(formData.savt_compositeSAVTScore ?? 88))}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Number(formData.savt_compositeSAVTScore ?? 88)}
                    onChange={(e) => handleChange('savt_compositeSAVTScore', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>

                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Signal Sensitivity (d')</span>
                    <span className="ml-slider-val">{Number(formData.savt_dPrime ?? 2.8).toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="4.5"
                    step="0.1"
                    value={Number(formData.savt_dPrime ?? 2.8)}
                    onChange={(e) => handleChange('savt_dPrime', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 7. Pattern & Reaction */}
          <div className="ml-module-accordion">
            <div className="ml-module-header" onClick={() => toggleSection('pattern')}>
              <span className="font-semibold text-sm text-rose-300 flex items-center gap-2">
                <Icon name="pattern" size={16} /> 6 & 7. Pattern Span & Psychomotor Speed
              </span>
              <span className="text-xs text-slate-400">
                {expandedSections.pattern ? '▲' : '▼'}
              </span>
            </div>
            {expandedSections.pattern && (
              <div className="ml-module-body">
                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Pattern Sequence Span</span>
                    <span className="ml-slider-val">Level {formData.pat_maxSequenceSpan ?? 6}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="9"
                    value={Number(formData.pat_maxSequenceSpan ?? 6)}
                    onChange={(e) => handleChange('pat_maxSequenceSpan', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>

                <div className="ml-control-field">
                  <div className="ml-slider-header">
                    <span>Reaction Time (ms)</span>
                    <span className="ml-slider-val">{formData.rxn_meanReactionTime ?? 280} ms</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="750"
                    step="10"
                    value={Number(formData.rxn_meanReactionTime ?? 280)}
                    onChange={(e) => handleChange('rxn_meanReactionTime', Number(e.target.value))}
                    className="ml-range-slider"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Prediction Output & Explainability */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Icon name="insight" size={18} className="text-emerald-400" />
              Real-Time AI Clinical Estimation
            </h2>
            {prediction && (
              <span className="text-xs font-mono text-slate-400">
                Latency: {prediction.inferenceLatencyMs} ms
              </span>
            )}
          </div>

          {prediction ? (
            <>
              {/* Main Classification & Alert Banner */}
              <div
                className={`ml-status-hero ${
                  prediction.predictedDiagnosis === 'Normal'
                    ? 'status-normal'
                    : prediction.predictedDiagnosis === 'MCI'
                    ? 'status-mci'
                    : 'status-dementia'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
                    Predicted Cognitive Status
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      prediction.predictedRiskLevel === 'Low'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : prediction.predictedRiskLevel === 'Moderate'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {prediction.predictedRiskLevel} Risk
                  </span>
                </div>

                <div className="text-3xl font-extrabold text-white tracking-tight my-1">
                  {prediction.predictedDiagnosis === 'Normal' && 'Normal Healthy Cognition'}
                  {prediction.predictedDiagnosis === 'MCI' && 'Mild Cognitive Impairment (MCI)'}
                  {prediction.predictedDiagnosis === 'Dementia' && 'Significant Cognitive Decline'}
                </div>

                {/* Calibrated Probabilities */}
                <div className="grid grid-cols-3 gap-2 mt-4 text-xs font-medium">
                  <div className="bg-black/30 p-2 rounded border border-white/5">
                    <div className="text-slate-400">Normal</div>
                    <div className="text-emerald-400 font-bold text-sm">
                      {(prediction.diagnosisProbabilities.normal * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-black/30 p-2 rounded border border-white/5">
                    <div className="text-slate-400">MCI Stage</div>
                    <div className="text-amber-400 font-bold text-sm">
                      {(prediction.diagnosisProbabilities.mci * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-black/30 p-2 rounded border border-white/5">
                    <div className="text-slate-400">Dementia</div>
                    <div className="text-rose-400 font-bold text-sm">
                      {(prediction.diagnosisProbabilities.dementia * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* 4-Tier Clinical Alert Card */}
                <div className="mt-4 p-3 bg-black/40 rounded-lg border border-white/10 text-left">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-1">
                    <span className="text-base">
                      {prediction.clinicalAlertTier === 'Stable' && '🟢'}
                      {prediction.clinicalAlertTier === 'Continue Monitoring' && '🟡'}
                      {prediction.clinicalAlertTier === 'Recommend Earlier Re-Assessment' && '🟠'}
                      {prediction.clinicalAlertTier === 'Recommend Clinical Evaluation' && '🔴'}
                    </span>
                    Clinical Guidance: {prediction.clinicalAlertTier}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {prediction.clinicalAlertTier === 'Stable' &&
                      'Performance consistent with healthy normative baseline. Routine annual check-in suggested.'}
                    {prediction.clinicalAlertTier === 'Continue Monitoring' &&
                      'Minor score fluctuations observed within physiological range. Repeat test in 6–8 weeks.'}
                    {prediction.clinicalAlertTier === 'Recommend Earlier Re-Assessment' &&
                      'Noticeable variance observed in spatial/memory domains. Recommend re-assessment in 3–4 weeks.'}
                    {prediction.clinicalAlertTier === 'Recommend Clinical Evaluation' &&
                      'Marked multi-domain shift detected. Recommend sharing assessment summary with a healthcare provider.'}
                  </p>
                </div>
              </div>

              {/* MoCA Continuous Score & 4 Domains */}
              <div className="ml-card-panel">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <div className="text-xs text-slate-400 uppercase font-semibold">Continuous MoCA Equivalent</div>
                    <div className="text-2xl font-black text-white">
                      {prediction.predictedMoCAScore.toFixed(1)}{' '}
                      <span className="text-sm font-medium text-slate-400">/ 30.0</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400 uppercase font-semibold">Multi-Factor Confidence</div>
                    <div className="text-xl font-extrabold text-cyan-400">
                      {Math.round(prediction.confidenceScore * 100)}%
                    </div>
                  </div>
                </div>

                {/* 4 Cognitive Domains */}
                <div className="ml-domain-bars">
                  <div className="ml-domain-row">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">🧠 Episodic Memory</span>
                      <span className="text-cyan-400">{prediction.domainScores.memory} / 100</span>
                    </div>
                    <div className="ml-progress-track">
                      <div
                        className="ml-progress-fill bg-gradient-to-r from-cyan-500 to-blue-500"
                        style={{ width: `${prediction.domainScores.memory}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="ml-domain-row">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">🎯 Sustained Attention & Speed</span>
                      <span className="text-amber-400">{prediction.domainScores.attention} / 100</span>
                    </div>
                    <div className="ml-progress-track">
                      <div
                        className="ml-progress-fill bg-gradient-to-r from-amber-500 to-orange-500"
                        style={{ width: `${prediction.domainScores.attention}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="ml-domain-row">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">🗣️ Language & Speech Dynamics</span>
                      <span className="text-indigo-400">{prediction.domainScores.language} / 100</span>
                    </div>
                    <div className="ml-progress-track">
                      <div
                        className="ml-progress-fill bg-gradient-to-r from-indigo-500 to-purple-500"
                        style={{ width: `${prediction.domainScores.language}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="ml-domain-row">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">🧭 Executive & Visuospatial</span>
                      <span className="text-emerald-400">{prediction.domainScores.executive} / 100</span>
                    </div>
                    <div className="ml-progress-track">
                      <div
                        className="ml-progress-fill bg-gradient-to-r from-emerald-500 to-teal-500"
                        style={{ width: `${prediction.domainScores.executive}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TreeSHAP Local Biomarker Attributions */}
              <div className="ml-card-panel">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <Icon name="chart-trend" size={16} className="text-cyan-400" />
                    Top Contributing Biomarkers (TreeSHAP)
                  </h3>
                  <span className="text-[11px] text-slate-400">Directional Impact</span>
                </div>

                <div className="space-y-1.5">
                  {prediction.biomarkerAttributions.map((attr, idx) => (
                    <div
                      key={idx}
                      className={`ml-attribution-item ${
                        attr.direction === 'risk'
                          ? 'ml-attribution-risk'
                          : 'ml-attribution-protective'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{attr.biomarker}</div>
                        <div className="text-[10px] text-slate-400">{attr.domain}</div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono font-bold ${
                            attr.direction === 'risk' ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {attr.direction === 'risk' ? '+' : ''}
                          {attr.impactValue.toFixed(3)}
                        </span>
                        <div className="text-[10px] uppercase font-semibold text-slate-400">
                          {attr.direction === 'risk' ? 'Risk Factor' : 'Protective'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON Payload Toggle */}
              <div className="ml-card-panel">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Developer & Clinical Audit Payload
                  </span>
                  <button
                    onClick={() => setShowJsonPayload(!showJsonPayload)}
                    className="text-xs text-cyan-400 hover:underline font-mono"
                  >
                    {showJsonPayload ? 'Hide JSON' : 'Inspect JSON Payload'}
                  </button>
                </div>

                {showJsonPayload && (
                  <pre className="ml-code-box">
                    {JSON.stringify(prediction, null, 2)}
                  </pre>
                )}
              </div>
            </>
          ) : (
            <div className="ml-card-panel text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
              <div className="text-sm font-semibold text-slate-300">Loading AI Model Bundle...</div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
