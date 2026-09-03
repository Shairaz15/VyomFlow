import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Icon } from '../components/common';
import { PageWrapper } from '../components/layout/PageWrapper';
import { CognitiveRadarChart } from '../components/dashboard/CognitiveRadarChart';
import { ClinicianReportModal } from '../components/dashboard/ClinicianReportModal';
import { predictCognitiveProfile, type CognitiveModelPrediction } from '../services/clinicalModelEngine';
import type { RawDashboardData } from '../services/dataMapper';
import './MLPlayground.css';

// Preset Personas
const PERSONAS = [
    {
        id: 'healthy',
        name: 'Healthy Aging Senior',
        badge: 'Normal Control',
        badgeClass: 'badge-success',
        description: '70yo female with intact episodic recall, rapid psychomotor speed, and high linguistic fluency.',
        demographics: { age: 70, gender: 'Female', educationYears: 16 },
        biomarkers: {
            vmraAcc: 0.94,
            vmraDelAcc: 0.90,
            vmraIntrusions: 0,
            vmraSlope: 0.05,
            storyAcc: 0.92,
            storyUnits: 14,
            langCsi: 92,
            langWpm: 145,
            langPauses: 2,
            patAcc: 0.92,
            patMaxLevel: 9,
            rxMeanLat: 240,
            rxLapses: 0,
            rxWais: 88,
            navAcc: 0.94,
            navSpatialMem: 92,
            navDisorient: 0.1,
        }
    },
    {
        id: 'early_mci',
        name: 'Early Amnestic MCI',
        badge: 'Mild Cognitive Impairment',
        badgeClass: 'badge-warning',
        description: '74yo male with delayed recall drop, moderate intrusions, and slight psychomotor latency slowing.',
        demographics: { age: 74, gender: 'Male', educationYears: 14 },
        biomarkers: {
            vmraAcc: 0.58,
            vmraDelAcc: 0.45,
            vmraIntrusions: 3,
            vmraSlope: 0.22,
            storyAcc: 0.60,
            storyUnits: 7,
            langCsi: 72,
            langWpm: 110,
            langPauses: 6,
            patAcc: 0.65,
            patMaxLevel: 5,
            rxMeanLat: 420,
            rxLapses: 3,
            rxWais: 55,
            navAcc: 0.68,
            navSpatialMem: 62,
            navDisorient: 0.8,
        }
    },
    {
        id: 'dementia',
        name: 'Moderate Alzheimer\'s / Dementia',
        badge: 'Elevated Dementia Risk',
        badgeClass: 'badge-danger',
        description: '79yo female with severe forgetting slope, frequent false recalls, linguistic hesitation, and spatial disorientation.',
        demographics: { age: 79, gender: 'Female', educationYears: 12 },
        biomarkers: {
            vmraAcc: 0.25,
            vmraDelAcc: 0.15,
            vmraIntrusions: 6,
            vmraSlope: 0.45,
            storyAcc: 0.28,
            storyUnits: 3,
            langCsi: 38,
            langWpm: 65,
            langPauses: 14,
            patAcc: 0.30,
            patMaxLevel: 3,
            rxMeanLat: 680,
            rxLapses: 7,
            rxWais: 28,
            navAcc: 0.32,
            navSpatialMem: 25,
            navDisorient: 2.2,
        }
    },
    {
        id: 'subcortical',
        name: 'Vascular / Psychomotor Slowed',
        badge: 'Executive / Speed Deficit',
        badgeClass: 'badge-info',
        description: '72yo male with preserved episodic memory but marked reaction time slowing and working memory lapses.',
        demographics: { age: 72, gender: 'Male', educationYears: 16 },
        biomarkers: {
            vmraAcc: 0.88,
            vmraDelAcc: 0.82,
            vmraIntrusions: 1,
            vmraSlope: 0.08,
            storyAcc: 0.84,
            storyUnits: 12,
            langCsi: 78,
            langWpm: 95,
            langPauses: 5,
            patAcc: 0.52,
            patMaxLevel: 4,
            rxMeanLat: 580,
            rxLapses: 6,
            rxWais: 36,
            navAcc: 0.78,
            navSpatialMem: 76,
            navDisorient: 0.5,
        }
    }
];

export function MLPlayground() {
    const navigate = useNavigate();
    const [selectedPersona, setSelectedPersona] = useState<string>('healthy');
    const [activeDomainTab, setActiveDomainTab] = useState<'memory' | 'speech' | 'speed' | 'executive' | 'spatial' | 'demographics'>('memory');
    const [copiedAlert, setCopiedAlert] = useState(false);

    // State for interactive sliders
    const [age, setAge] = useState(70);
    const [gender, setGender] = useState<'Female' | 'Male'>('Female');
    const [educationYears, setEducationYears] = useState(16);

    // Memory
    const [vmraAcc, setVmraAcc] = useState(0.94);
    const [vmraDelAcc, setVmraDelAcc] = useState(0.90);
    const [vmraIntrusions, setVmraIntrusions] = useState(0);
    const [vmraSlope, setVmraSlope] = useState(0.05);
    const [storyAcc, setStoryAcc] = useState(0.92);
    const [storyUnits, setStoryUnits] = useState(14);

    // Language
    const [langCsi, setLangCsi] = useState(92);
    const [langWpm, setLangWpm] = useState(145);
    const [langPauses, setLangPauses] = useState(2);

    // Executive / Pattern
    const [patAcc, setPatAcc] = useState(0.92);
    const [patMaxLevel, setPatMaxLevel] = useState(9);

    // Speed / Reaction
    const [rxMeanLat, setRxMeanLat] = useState(240);
    const [rxLapses, setRxLapses] = useState(0);
    const [rxWais, setRxWais] = useState(88);

    // Spatial / Navigation
    const [navAcc, setNavAcc] = useState(0.94);
    const [navSpatialMem, setNavSpatialMem] = useState(92);
    const [navDisorient, setNavDisorient] = useState(0.1);

    // Live Prediction Output State
    const [prediction, setPrediction] = useState<CognitiveModelPrediction | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [sessionLoadedAlert, setSessionLoadedAlert] = useState<string | null>(null);

    // Load Persona values
    const applyPersona = (personaId: string) => {
        const p = PERSONAS.find(x => x.id === personaId);
        if (!p) return;
        setSelectedPersona(personaId);
        setAge(p.demographics.age);
        setGender(p.demographics.gender as any);
        setEducationYears(p.demographics.educationYears);

        setVmraAcc(p.biomarkers.vmraAcc);
        setVmraDelAcc(p.biomarkers.vmraDelAcc);
        setVmraIntrusions(p.biomarkers.vmraIntrusions);
        setVmraSlope(p.biomarkers.vmraSlope);
        setStoryAcc(p.biomarkers.storyAcc);
        setStoryUnits(p.biomarkers.storyUnits);

        setLangCsi(p.biomarkers.langCsi);
        setLangWpm(p.biomarkers.langWpm);
        setLangPauses(p.biomarkers.langPauses);

        setPatAcc(p.biomarkers.patAcc);
        setPatMaxLevel(p.biomarkers.patMaxLevel);

        setRxMeanLat(p.biomarkers.rxMeanLat);
        setRxLapses(p.biomarkers.rxLapses);
        setRxWais(p.biomarkers.rxWais);

        setNavAcc(p.biomarkers.navAcc);
        setNavSpatialMem(p.biomarkers.navSpatialMem);
        setNavDisorient(p.biomarkers.navDisorient);
    };

    // Load Real Active Session Data from Device LocalStorage
    const loadActiveSessionData = () => {
        try {
            let loadedCount = 0;

            // Reaction Time
            const rxRaw = localStorage.getItem('reaction_test_results') || localStorage.getItem('vyomflow_reaction_data');
            if (rxRaw) {
                const parsed = JSON.parse(rxRaw);
                const avgVal = parsed.meanLatency || parsed.avg || (Array.isArray(parsed) && parsed[0]?.aggregates?.avg);
                if (avgVal) {
                    setRxMeanLat(Math.round(avgVal));
                    loadedCount++;
                }
            }

            // VMRA Visual Memory
            const vmraRaw = localStorage.getItem('vmra_sessions') || localStorage.getItem('vmra_results');
            if (vmraRaw) {
                const parsed = JSON.parse(vmraRaw);
                const last = Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
                if (last?.features?.recallAccuracy || last?.accuracy) {
                    setVmraAcc(last.features?.recallAccuracy ?? last.accuracy);
                    loadedCount++;
                }
            }

            // Story Verbal Recall
            const storyRaw = localStorage.getItem('story_recall_results') || localStorage.getItem('story_sessions');
            if (storyRaw) {
                const parsed = JSON.parse(storyRaw);
                const last = Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
                if (last?.biomarkers?.memory?.recallAccuracy) {
                    setStoryAcc(last.biomarkers.memory.recallAccuracy);
                    loadedCount++;
                }
            }

            // Language & Speech
            const langRaw = localStorage.getItem('language_analysis_results') || localStorage.getItem('language_sessions');
            if (langRaw) {
                const parsed = JSON.parse(langRaw);
                const last = Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
                if (last?.derivedFeatures?.cognitiveSpeechIndex) {
                    setLangCsi(Math.round(last.derivedFeatures.cognitiveSpeechIndex));
                    loadedCount++;
                }
            }

            // Pattern Working Memory
            const patRaw = localStorage.getItem('pattern_results') || localStorage.getItem('pattern_sessions');
            if (patRaw) {
                const parsed = JSON.parse(patRaw);
                const last = Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
                if (last?.features?.memoryLoadTolerance) {
                    setPatAcc((last.features.memoryLoadTolerance || 80) / 100);
                    loadedCount++;
                }
            }

            // Navigation
            const navRaw = localStorage.getItem('navigation_results') || localStorage.getItem('navigation_sessions');
            if (navRaw) {
                const parsed = JSON.parse(navRaw);
                const last = Array.isArray(parsed) ? parsed[parsed.length - 1] : parsed;
                if (last?.biomarkers?.navigationAccuracy) {
                    setNavAcc(last.biomarkers.navigationAccuracy);
                    loadedCount++;
                }
            }

            setSelectedPersona('');
            setSessionLoadedAlert(loadedCount > 0 ? `Loaded ${loadedCount} active assessment module(s) from your device!` : 'No prior session data found. Retaining current slider profile.');
            setTimeout(() => setSessionLoadedAlert(null), 4000);
        } catch (err) {
            console.error('Error loading session data:', err);
        }
    };

    // Recalculate prediction on slider change (<1ms instant execution)
    useEffect(() => {
        const rawData: RawDashboardData = {
            reaction: [{
                timestamp: new Date().toISOString(),
                aggregates: { avg: rxMeanLat, min: rxMeanLat - 40, max: rxMeanLat + 80, std: 30, lapses: rxLapses, premature: 0 },
                rounds: []
            } as any],
            memory: [],
            pattern: [{
                sessionId: 'p1',
                timestamp: new Date(),
                metrics: { correctRounds: Math.round(patAcc * 8), totalRounds: 8, maxLevelReached: patMaxLevel, averageResponseLatency: 750 } as any,
                features: { learningRate: 20, memoryLoadTolerance: patAcc * 100, patternStabilityIndex: 85 } as any,
                explainability: { keyFactors: [] }
            } as any],
            language: [{
                id: 'l1',
                sessionId: 's1',
                timestamp: new Date(),
                transcript: 'Live simulation speech sample',
                rawMetrics: { wordCount: langWpm, speechDuration: 60000, pauseDurationAvg: 300, pauseCount: langPauses, fillerWordCount: 2, repetitions: 0 } as any,
                derivedFeatures: {
                    wpm: langWpm,
                    lexicalDiversity: 0.74,
                    rootTTR: 0.80,
                    hesitationIndex: 0.03,
                    fluencyIndex: langCsi,
                    speechStability: langCsi,
                    semanticCoherence: langCsi,
                    syntacticComplexity: langCsi,
                    ideaDensity: 0.65,
                    cognitiveSpeechIndex: langCsi,
                    coherenceProxy: langCsi
                },
                explainability: { keyFactors: [] }
            }],
            vmra: [{
                sessionId: 'v1',
                timestamp: new Date(),
                config: {} as any,
                rawMetrics: {} as any,
                features: {
                    recallAccuracy: vmraAcc,
                    falsePositiveRate: 0.05,
                    precision: 0.92,
                    f1Score: vmraAcc,
                    netRecallScore: vmraAcc * 12,
                    meanSelectionLatencyMs: 1050,
                    gridCoverage: 0.90,
                    primacyBias: 0.90,
                    recencyBias: 0.85,
                    midListDeficit: 0.10,
                    intrusionErrors: vmraIntrusions
                } as any,
                delayedRecall: {
                    delayedFeatures: { recallAccuracy: vmraDelAcc } as any,
                    forgettingCurveSlope: vmraSlope
                } as any,
                profile: {} as any,
                explainability: { keyFactors: [] }
            }],
            story: [{
                id: 's1',
                sessionId: 'sess1',
                timestamp: new Date(),
                storyId: 'story-1',
                difficulty: 'medium',
                selectedLanguage: 'en-IN',
                nativeTranscript: '',
                englishTranslation: '',
                comprehensionResponses: [],
                matchResult: {} as any,
                biomarkers: {
                    memory: { recallAccuracy: storyAcc, infoUnitsRecalled: storyUnits, totalInfoUnits: 15, omissionCount: 15 - storyUnits, falseRecallCount: vmraIntrusions },
                    comprehension: { mcqAccuracy: storyAcc, correctCount: 10, totalQuestions: 10, avgResponseTimeMs: 1200 },
                    narrative: { storySequenceScore: storyAcc, narrativeCompleteness: storyAcc, similarityScore: storyAcc },
                    speech: { speechRateWPM: langWpm, lexicalDiversity: 0.72, hesitationRate: 0.03, pauseFrequency: langPauses }
                },
                storyRecallScore: Math.round(storyAcc * 100)
            }],
            navigation: [{
                sessionId: 'n1',
                timestamp: new Date(),
                scenarioId: 'city-1',
                difficulty: 'medium',
                routeChoices: [],
                biomarkers: {
                    navigationAccuracy: navAcc,
                    landmarkRecognitionAccuracy: navAcc,
                    spatialMemoryIndex: navSpatialMem,
                    wayfindingEfficiency: navAcc,
                    headingErrorDegrees: Math.round((1 - navAcc) * 40),
                    stopsAndPausesCount: 1,
                    backtrackingCount: 1,
                    timeToCompleteSeconds: Math.round(50 / Math.max(0.2, navAcc))
                } as any,
                navigationScore: navSpatialMem,
                explainability: { keyFactors: [] }
            } as any]
        };

        predictCognitiveProfile(rawData, { age, gender, educationYears }).then(res => {
            setPrediction(res);
        });
    }, [
        age, gender, educationYears,
        vmraAcc, vmraDelAcc, vmraIntrusions, vmraSlope, storyAcc, storyUnits,
        langCsi, langWpm, langPauses,
        patAcc, patMaxLevel,
        rxMeanLat, rxLapses, rxWais,
        navAcc, navSpatialMem, navDisorient
    ]);

    const copySummary = () => {
        if (!prediction) return;
        const summary = `VYOMFLOW CLINICAL ML REPORT
Diagnosis: ${prediction.predictedDiagnosis} (Confidence: ${prediction.modelConfidence}%)
Probabilities: Normal ${(prediction.probabilities.normal * 100).toFixed(1)}% | MCI ${(prediction.probabilities.mci * 100).toFixed(1)}% | Dementia ${(prediction.probabilities.dementia * 100).toFixed(1)}%
Estimated MoCA: ${prediction.estimatedMoCA} / 30
Cognitive Domains: Memory: ${prediction.domainScores.memory} | Language: ${prediction.domainScores.language} | Speed: ${prediction.domainScores.processingSpeed} | Executive: ${prediction.domainScores.executive} | Spatial: ${prediction.domainScores.spatialOrientation}
Alert Tier: ${prediction.clinicalAlertTier}`;

        navigator.clipboard.writeText(summary);
        setCopiedAlert(true);
        setTimeout(() => setCopiedAlert(false), 2500);
    };

    return (
        <PageWrapper>
            <div className="ml-playground-container">
                {/* Header */}
                <div className="playground-header">
                    <div>
                        <div className="model-tag">
                            <span className="live-pulse" />
                            <span>VyomFlow v2 Multi-Task AI Engine</span>
                            <span className="version-pill">83,461 Patient Cohort</span>
                        </div>
                        <h1 className="playground-title">Machine Learning Playground</h1>
                        <p className="playground-subtitle">
                            Simulate multimodal digital biomarkers in real-time and observe live diagnostic classification, MoCA estimation, and TreeSHAP attributions.
                        </p>
                    </div>

                    <div className="playground-header-actions">
                        <Button variant="secondary" onClick={loadActiveSessionData}>
                            <Icon name="shield-check" size={18} />
                            Load My Real Data
                        </Button>
                        <Button variant="secondary" onClick={() => setIsReportModalOpen(true)}>
                            <Icon name="chart-trend" size={18} />
                            Clinician PDF
                        </Button>
                        <Button variant="primary" onClick={copySummary}>
                            <Icon name="check" size={18} />
                            {copiedAlert ? 'Copied!' : 'Copy Summary'}
                        </Button>
                        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                            Dashboard
                        </Button>
                    </div>
                </div>

                {/* Session Load Alert Toast */}
                {sessionLoadedAlert && (
                    <div className="session-alert-banner">
                        <Icon name="check" size={16} />
                        <span>{sessionLoadedAlert}</span>
                    </div>
                )}

                {/* Persona Quick Selectors */}
                <div className="persona-selector-grid">
                    {PERSONAS.map(p => (
                        <div
                            key={p.id}
                            className={`persona-card ${selectedPersona === p.id ? 'active' : ''}`}
                            onClick={() => applyPersona(p.id)}
                        >
                            <div className="persona-card-header">
                                <span className="persona-name">{p.name}</span>
                                <span className={`persona-badge ${p.badgeClass}`}>{p.badge}</span>
                            </div>
                            <p className="persona-desc">{p.description}</p>
                        </div>
                    ))}
                </div>

                {/* Main Split Interface */}
                <div className="playground-workspace">
                    {/* LEFT: Biomarker Sliders */}
                    <div className="biomarker-controls-panel">
                        {/* Domain Tabs */}
                        <div className="domain-tabs">
                            <button
                                className={`domain-tab ${activeDomainTab === 'memory' ? 'active' : ''}`}
                                onClick={() => setActiveDomainTab('memory')}
                            >
                                🧠 Memory
                            </button>
                            <button
                                className={`domain-tab ${activeDomainTab === 'speech' ? 'active' : ''}`}
                                onClick={() => setActiveDomainTab('speech')}
                            >
                                🗣️ Speech
                            </button>
                            <button
                                className={`domain-tab ${activeDomainTab === 'speed' ? 'active' : ''}`}
                                onClick={() => setActiveDomainTab('speed')}
                            >
                                ⚡ Speed
                            </button>
                            <button
                                className={`domain-tab ${activeDomainTab === 'executive' ? 'active' : ''}`}
                                onClick={() => setActiveDomainTab('executive')}
                            >
                                🧩 Executive
                            </button>
                            <button
                                className={`domain-tab ${activeDomainTab === 'spatial' ? 'active' : ''}`}
                                onClick={() => setActiveDomainTab('spatial')}
                            >
                                🗺️ Spatial
                            </button>
                            <button
                                className={`domain-tab ${activeDomainTab === 'demographics' ? 'active' : ''}`}
                                onClick={() => setActiveDomainTab('demographics')}
                            >
                                👤 Demographics
                            </button>
                        </div>

                        <div className="tab-content-card">
                            {activeDomainTab === 'memory' && (
                                <div className="slider-group">
                                    <h3>Visual & Verbal Memory (VMRA + Story)</h3>
                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>VMRA Recall Accuracy</span>
                                            <span className="control-value">{Math.round(vmraAcc * 100)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0.1" max="1.0" step="0.01"
                                            value={vmraAcc} onChange={e => { setVmraAcc(parseFloat(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>

                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Delayed Recall Accuracy (30-min Delay)</span>
                                            <span className="control-value">{Math.round(vmraDelAcc * 100)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0.05" max="1.0" step="0.01"
                                            value={vmraDelAcc} onChange={e => { setVmraDelAcc(parseFloat(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>

                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Memory Intrusion Errors</span>
                                            <span className="control-value">{vmraIntrusions}</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="8" step="1"
                                            value={vmraIntrusions} onChange={e => { setVmraIntrusions(parseInt(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>

                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Forgetting Curve Slope (Decay Rate)</span>
                                            <span className="control-value">{vmraSlope.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range" min="0.01" max="0.5" step="0.01"
                                            value={vmraSlope} onChange={e => { setVmraSlope(parseFloat(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>

                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Story Units Recalled (out of 15)</span>
                                            <span className="control-value">{storyUnits} / 15</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="15" step="1"
                                            value={storyUnits} onChange={e => { setStoryUnits(parseInt(e.target.value)); setStoryAcc(parseInt(e.target.value) / 15); setSelectedPersona(''); }}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeDomainTab === 'speech' && (
                                <div className="slider-group">
                                    <h3>Language & Acoustic Biomarkers</h3>
                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Cognitive Speech Index (CSI)</span>
                                            <span className="control-value">{langCsi} / 100</span>
                                        </div>
                                        <input
                                            type="range" min="20" max="100" step="1"
                                            value={langCsi} onChange={e => { setLangCsi(parseInt(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>

                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Speech Rate (WPM)</span>
                                            <span className="control-value">{langWpm} WPM</span>
                                        </div>
                                        <input
                                            type="range" min="40" max="190" step="5"
                                            value={langWpm} onChange={e => { setLangWpm(parseInt(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>

                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Hesitation / Long Pause Count</span>
                                            <span className="control-value">{langPauses} pauses</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="18" step="1"
                                            value={langPauses} onChange={e => { setLangPauses(parseInt(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeDomainTab === 'speed' && (
                                <div className="slider-group">
                                    <h3>Psychomotor Latency & Attention (SAVT)</h3>
                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Mean Reaction Latency</span>
                                            <span className="control-value">{rxMeanLat} ms</span>
                                        </div>
                                        <input
                                            type="range" min="180" max="850" step="10"
                                            value={rxMeanLat} onChange={e => { setRxMeanLat(parseInt(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>

                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>WAIS Processing Speed Score</span>
                                            <span className="control-value">{rxWais} / 100</span>
                                        </div>
                                        <input
                                            type="range" min="15" max="100" step="1"
                                            value={rxWais} onChange={e => { setRxWais(parseInt(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>

                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Attention Lapses / Missed Targets</span>
                                            <span className="control-value">{rxLapses}</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="10" step="1"
                                            value={rxLapses} onChange={e => { setRxLapses(parseInt(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeDomainTab === 'executive' && (
                                <div className="slider-group">
                                    <h3>Executive Function & Working Memory (Pattern)</h3>
                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Pattern Recognition Accuracy</span>
                                            <span className="control-value">{Math.round(patAcc * 100)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0.1" max="1.0" step="0.02"
                                            value={patAcc} onChange={e => { setPatAcc(parseFloat(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>

                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Max Sequence Level Reached</span>
                                            <span className="control-value">Level {patMaxLevel}</span>
                                        </div>
                                        <input
                                            type="range" min="2" max="12" step="1"
                                            value={patMaxLevel} onChange={e => { setPatMaxLevel(parseInt(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeDomainTab === 'spatial' && (
                                <div className="slider-group">
                                    <h3>Visuospatial & Wayfinding (Navigation)</h3>
                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Navigation Accuracy</span>
                                            <span className="control-value">{Math.round(navAcc * 100)}%</span>
                                        </div>
                                        <input
                                            type="range" min="0.1" max="1.0" step="0.02"
                                            value={navAcc} onChange={e => { setNavAcc(parseFloat(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>

                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Spatial Memory Index</span>
                                            <span className="control-value">{navSpatialMem} / 100</span>
                                        </div>
                                        <input
                                            type="range" min="10" max="100" step="1"
                                            value={navSpatialMem} onChange={e => { setNavSpatialMem(parseInt(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>

                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Spatial Disorientation Score</span>
                                            <span className="control-value">{navDisorient.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range" min="0.0" max="3.0" step="0.1"
                                            value={navDisorient} onChange={e => { setNavDisorient(parseFloat(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>
                                </div>
                            )}

                            {activeDomainTab === 'demographics' && (
                                <div className="slider-group">
                                    <h3>Patient Demographic Adjustments</h3>
                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Patient Age</span>
                                            <span className="control-value">{age} years</span>
                                        </div>
                                        <input
                                            type="range" min="50" max="95" step="1"
                                            value={age} onChange={e => { setAge(parseInt(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>

                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Biological Gender</span>
                                            <span className="control-value">{gender}</span>
                                        </div>
                                        <div className="gender-btn-group">
                                            <button
                                                className={`toggle-btn ${gender === 'Female' ? 'active' : ''}`}
                                                onClick={() => { setGender('Female'); setSelectedPersona(''); }}
                                            >
                                                Female
                                            </button>
                                            <button
                                                className={`toggle-btn ${gender === 'Male' ? 'active' : ''}`}
                                                onClick={() => { setGender('Male'); setSelectedPersona(''); }}
                                            >
                                                Male
                                            </button>
                                        </div>
                                    </div>

                                    <div className="control-item">
                                        <div className="control-label">
                                            <span>Education (Years)</span>
                                            <span className="control-value">{educationYears} years</span>
                                        </div>
                                        <input
                                            type="range" min="6" max="22" step="1"
                                            value={educationYears} onChange={e => { setEducationYears(parseInt(e.target.value)); setSelectedPersona(''); }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Live Model Inference Output */}
                    <div className="inference-results-panel">
                        {prediction ? (
                            <>
                                {/* Primary Diagnosis Card */}
                                <div className={`prediction-hero-card diag-${prediction.predictedDiagnosis.toLowerCase()}`}>
                                    <div className="hero-top">
                                        <div>
                                            <span className="hero-sublabel">Diagnostic Classification</span>
                                            <h2 className="hero-diagnosis">{prediction.predictedDiagnosis}</h2>
                                        </div>
                                        <div className="confidence-pill">
                                            <span>{prediction.modelConfidence}%</span>
                                            <span className="conf-sub">Confidence</span>
                                        </div>
                                    </div>

                                    {/* Probability Distribution Bars */}
                                    <div className="prob-dist-section">
                                        <div className="prob-row">
                                            <span className="prob-name">P(Normal)</span>
                                            <div className="prob-bar-track">
                                                <div className="prob-bar-fill fill-normal" style={{ width: `${prediction.probabilities.normal * 100}%` }} />
                                            </div>
                                            <span className="prob-pct">{(prediction.probabilities.normal * 100).toFixed(1)}%</span>
                                        </div>

                                        <div className="prob-row">
                                            <span className="prob-name">P(MCI)</span>
                                            <div className="prob-bar-track">
                                                <div className="prob-bar-fill fill-mci" style={{ width: `${prediction.probabilities.mci * 100}%` }} />
                                            </div>
                                            <span className="prob-pct">{(prediction.probabilities.mci * 100).toFixed(1)}%</span>
                                        </div>

                                        <div className="prob-row">
                                            <span className="prob-name">P(Dementia)</span>
                                            <div className="prob-bar-track">
                                                <div className="prob-bar-fill fill-dementia" style={{ width: `${prediction.probabilities.dementia * 100}%` }} />
                                            </div>
                                            <span className="prob-pct">{(prediction.probabilities.dementia * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Continuous MoCA Score Card */}
                                <div className="moca-score-card">
                                    <div className="moca-header">
                                        <div>
                                            <span className="moca-label">Estimated Continuous MoCA Score</span>
                                            <div className="moca-value-row">
                                                <span className="moca-number">{prediction.estimatedMoCA.toFixed(1)}</span>
                                                <span className="moca-max">/ 30.0</span>
                                            </div>
                                        </div>

                                        <div className={`tier-badge tier-${prediction.clinicalAlertTier.toLowerCase().replace(/_/g, '-')}`}>
                                            {prediction.clinicalAlertTier.replace(/_/g, ' ')}
                                        </div>
                                    </div>

                                    <div className="moca-track">
                                        <div
                                            className="moca-marker"
                                            style={{ left: `${(prediction.estimatedMoCA / 30) * 100}%` }}
                                        />
                                        <div className="track-segment seg-dem" style={{ width: '60%' }}>Dementia (&lt;18)</div>
                                        <div className="track-segment seg-mci" style={{ width: '26.6%' }}>MCI (18-25)</div>
                                        <div className="track-segment seg-norm" style={{ width: '13.4%' }}>Normal (26+)</div>
                                    </div>
                                </div>

                                {/* 6-Domain Multimodal Radar Chart */}
                                <div className="radar-visualizer-card">
                                    <h4 className="card-section-title">Multimodal Cognitive Envelope (6 Domains)</h4>
                                    <CognitiveRadarChart
                                        scores={prediction.domainScores}
                                        size={280}
                                        showNormative={true}
                                    />
                                </div>

                                {/* 6 Cognitive Domains Grid */}
                                <div className="domain-breakdown-card">
                                    <h4 className="card-section-title">Domain Sub-Scores (0–100)</h4>
                                    <div className="domain-grid">
                                        <div className="domain-mini-card">
                                            <span className="d-icon">🧠</span>
                                            <span className="d-name">Memory</span>
                                            <span className="d-val">{prediction.domainScores.memory}</span>
                                        </div>
                                        <div className="domain-mini-card">
                                            <span className="d-icon">🗣️</span>
                                            <span className="d-name">Language</span>
                                            <span className="d-val">{prediction.domainScores.language}</span>
                                        </div>
                                        <div className="domain-mini-card">
                                            <span className="d-icon">⚡</span>
                                            <span className="d-name">Processing Speed</span>
                                            <span className="d-val">{prediction.domainScores.processingSpeed}</span>
                                        </div>
                                        <div className="domain-mini-card">
                                            <span className="d-icon">🧩</span>
                                            <span className="d-name">Executive</span>
                                            <span className="d-val">{prediction.domainScores.executive}</span>
                                        </div>
                                        <div className="domain-mini-card">
                                            <span className="d-icon">🗺️</span>
                                            <span className="d-name">Spatial Orientation</span>
                                            <span className="d-val">{prediction.domainScores.spatialOrientation}</span>
                                        </div>
                                        <div className="domain-mini-card">
                                            <span className="d-icon">🎯</span>
                                            <span className="d-name">Attention</span>
                                            <span className="d-val">{prediction.domainScores.attention}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* TreeSHAP Live Feature Attributions */}
                                <div className="shap-attributions-card">
                                    <h4 className="card-section-title">Top Biomarker Attributions (TreeSHAP)</h4>
                                    <div className="shap-list">
                                        {prediction.topAttributions.map((attr, idx) => (
                                            <div key={idx} className={`shap-item impact-${attr.impact}`}>
                                                <div className="shap-info">
                                                    <span className="shap-feat">{attr.featureName}</span>
                                                    <span className="shap-desc">{attr.domain} • Value: {attr.observedValue}</span>
                                                </div>
                                                <div className="shap-badge">
                                                    {attr.impact === 'risk' ? '⚠️ Elevated Risk' : '🛡️ Protective Factor'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="loading-state">Evaluating Multi-Task Model...</div>
                        )}
                    </div>
                </div>

                {/* Clinician PDF Briefing Modal */}
                {prediction && (
                    <ClinicianReportModal
                        isOpen={isReportModalOpen}
                        onClose={() => setIsReportModalOpen(false)}
                        prediction={prediction}
                        patientAge={age}
                        patientGender={gender}
                        educationYears={educationYears}
                    />
                )}
            </div>
        </PageWrapper>
    );
}
