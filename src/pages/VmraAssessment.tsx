/**
 * Visual Memory Recall Assessment (VMRA)
 * 
 * Image-based episodic memory test using culturally familiar Indian objects.
 * Language-independent, tap-based interaction for inclusive cognitive screening.
 * 
 * Flow: Onboarding → Encoding → Retention Gap → Recall → Scoring → Results
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button, Card, Icon, TutorialVideoPlaceholder, MotivationalQuoteBlock } from '../components/common';
import { PageWrapper } from '../components/layout';
import { VMRA_ICON_MAP } from '../components/vmra/vmraIcons';
import {
    selectTargetImages,
    selectDistractors,
    buildGrid,
    getSessionConfig,
} from '../data/vmraImageCatalog';
import { buildSessionResult } from '../utils/vmraScoring';
import { useVmraResults } from '../hooks/useTestResults';
import type {
    VmraPhase,
    ImageStimulus,
    TapEvent,
    VmraRawMetrics,
    VmraSessionConfig,
    VmraAssessmentResult,
} from '../types/vmraTypes';
import '../components/tests/story/StoryAssessment.css';
import './VmraAssessment.css';

// ─── Shape types for retention distractor task ────────────────────
type ShapeType = 'circle' | 'triangle' | 'square' | 'diamond';

interface RetentionRound {
    shapes: ShapeType[];
    oddIndex: number;
}

function generateRetentionRound(): RetentionRound {
    const allShapes: ShapeType[] = ['circle', 'triangle', 'square', 'diamond'];
    const mainShape = allShapes[Math.floor(Math.random() * allShapes.length)];
    const oddOptions = allShapes.filter(s => s !== mainShape);
    const oddShape = oddOptions[Math.floor(Math.random() * oddOptions.length)];
    const oddIndex = Math.floor(Math.random() * 3);

    const shapes: ShapeType[] = [mainShape, mainShape, mainShape];
    shapes[oddIndex] = oddShape;

    return { shapes, oddIndex };
}

// ─── Component ────────────────────────────────────────────────────

export function VmraAssessment() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { isAuthenticated } = useAuth(); // Ensures user is in auth context
    const { saveResult, getSessionCount, getPreviousAccuracies } = useVmraResults();

    // Custom tick renderer for Radar Chart
    const renderCustomAxisTick = ({ payload, x, y, cx, cy }: any) => {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const offsetX = dist > 0 ? x + (dx / dist) * 8 : x;
        const offsetY = dist > 0 ? y + (dy / dist) * 8 : y;

        let textAnchor: 'start' | 'middle' | 'end' = 'middle';
        if (dx > 12) {
            textAnchor = 'start';
        } else if (dx < -12) {
            textAnchor = 'end';
        }

        return (
            <text
                x={offsetX}
                y={offsetY}
                textAnchor={textAnchor}
                dominantBaseline="central"
                fill={isDark ? '#E2ECF2' : '#17324D'}
                fontSize={10}
                fontWeight={600}
                className="radar-axis-tick select-none"
            >
                {payload.value}
            </text>
        );
    };

    // Session config (based on how many sessions user has completed)
    const [config] = useState<VmraSessionConfig>(() => getSessionConfig(getSessionCount() + 1));

    // Phase management
    const [phase, setPhase] = useState<VmraPhase>('onboarding');

    // Encoding state
    const [targetImages, setTargetImages] = useState<ImageStimulus[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageVisible, setImageVisible] = useState(true);
    const encodingStartTime = useRef<number>(0);

    // Retention state
    const [retentionRound, setRetentionRound] = useState<RetentionRound>(generateRetentionRound);
    const [retentionRoundsCompleted, setRetentionRoundsCompleted] = useState(0);
    const [retentionTimeLeft, setRetentionTimeLeft] = useState(15);
    const [retentionCorrect, setRetentionCorrect] = useState(0);
    const [retentionTotal, setRetentionTotal] = useState(0);

    // Recall state
    const [gridImages, setGridImages] = useState<ImageStimulus[]>([]);
    const [distractorImages, setDistractorImages] = useState<ImageStimulus[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [tapEvents, setTapEvents] = useState<TapEvent[]>([]);
    const recallStartTime = useRef<number>(0);
    const lastTapTime = useRef<Map<string, number>>(new Map());

    // Results state
    const [rawMetrics, setRawMetrics] = useState<VmraRawMetrics | null>(null);
    const [sessionResult, setSessionResult] = useState<VmraAssessmentResult | null>(null);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Ref for the active stage card to support smooth auto-centering
    const activeStageRef = useRef<HTMLDivElement>(null);

    // Smoothly scroll and center the active stage card within the viewport
    const scrollToActiveStage = useCallback(() => {
        if (!activeStageRef.current) return;

        requestAnimationFrame(() => {
            if (!activeStageRef.current) return;
            const rect = activeStageRef.current.getBoundingClientRect();
            const topClearance = 80;
            const isComfortablyVisible = 
                rect.top >= topClearance && 
                rect.bottom <= window.innerHeight + 40;

            if (!isComfortablyVisible) {
                activeStageRef.current.scrollIntoView({
                    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                    block: "center",
                    inline: "nearest"
                });
            }
        });
    }, []);

    // Trigger auto-scroll on phase change
    useEffect(() => {
        scrollToActiveStage();
    }, [phase, scrollToActiveStage]);

    // Handle Exit / Back Navigation
    const handleExitClick = () => {
        if (phase === 'onboarding' || phase === 'results') {
            navigate('/tests');
            return;
        }
        setShowExitConfirm(true);
    };

    const handleConfirmExit = () => {
        setShowExitConfirm(false);
        navigate('/tests');
    };

    const handleCancelExit = () => {
        setShowExitConfirm(false);
    };

    // Delayed recall state
    const [delayedGridImages, setDelayedGridImages] = useState<ImageStimulus[]>([]);
    const [delayedDistractors, setDelayedDistractors] = useState<ImageStimulus[]>([]);
    const [delayedSelectedIds, setDelayedSelectedIds] = useState<Set<string>>(new Set());
    const [delayedTapEvents, setDelayedTapEvents] = useState<TapEvent[]>([]);
    const delayedRecallStartTime = useRef<number>(0);
    const immediateRecallEndTime = useRef<number>(0);

    // ─── Start Encoding ───────────────────────────────────────────

    const startEncoding = useCallback(() => {
        if (!isAuthenticated) return;
        const targets = selectTargetImages(config.targetCount);
        setTargetImages(targets);
        setCurrentImageIndex(0);
        setImageVisible(true);
        encodingStartTime.current = Date.now();
        setPhase('encoding');
    }, [config.targetCount, isAuthenticated]);

    // ─── Encoding: cycle through images ───────────────────────────

    useEffect(() => {
        if (phase !== 'encoding') return;

        if (currentImageIndex >= targetImages.length) {
            // Move to retention phase
            setRetentionRound(generateRetentionRound());
            setRetentionRoundsCompleted(0);
            setRetentionTimeLeft(config.retentionDuration / 1000);
            setRetentionCorrect(0);
            setRetentionTotal(0);
            setPhase('retention');
            return;
        }

        // Show image for encodingTimePerImage, with fade
        setImageVisible(true);
        const showTimer = setTimeout(() => {
            setImageVisible(false);
        }, config.encodingTimePerImage - config.fadeDuration);

        const nextTimer = setTimeout(() => {
            setCurrentImageIndex(prev => prev + 1);
        }, config.encodingTimePerImage);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(nextTimer);
        };
    }, [phase, currentImageIndex, targetImages.length, config]);

    // ─── Retention: countdown timer ───────────────────────────────

    useEffect(() => {
        if (phase !== 'retention') return;

        if (retentionTimeLeft <= 0) {
            startRecallPhase();
            return;
        }

        const timer = setInterval(() => {
            setRetentionTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, retentionTimeLeft]);

    const handleRetentionTap = (index: number) => {
        setRetentionTotal(prev => prev + 1);
        if (index === retentionRound.oddIndex) {
            setRetentionCorrect(prev => prev + 1);
        }
        setRetentionRoundsCompleted(prev => prev + 1);
        setRetentionRound(generateRetentionRound());
    };

    // ─── Start Recall Phase ───────────────────────────────────────

    const startRecallPhase = useCallback(() => {
        const distractors = selectDistractors(
            targetImages,
            config.distractorCount,
            config.similarityLevel
        );
        setDistractorImages(distractors);
        const grid = buildGrid(targetImages, distractors);
        setGridImages(grid);
        setSelectedIds(new Set());
        setTapEvents([]);
        recallStartTime.current = Date.now();
        lastTapTime.current = new Map();
        setPhase('recall');
    }, [targetImages, config]);

    // ─── Handle image tap in recall grid ──────────────────────────
    const MAX_SELECTABLE_IMAGES = 10;

    const handleImageTap = useCallback((imageId: string, gridPosition: number) => {
        const now = Date.now();

        // Double-tap prevention: ignore taps within 200ms on same image
        const lastTap = lastTapTime.current.get(imageId) || 0;
        if (now - lastTap < 200) return;
        lastTapTime.current.set(imageId, now);

        const isCurrentlySelected = selectedIds.has(imageId);

        // If trying to select a new image but already reached 10, prevent selection
        if (!isCurrentlySelected && selectedIds.size >= MAX_SELECTABLE_IMAGES) {
            return;
        }

        const isDeselection = isCurrentlySelected;

        // Record tap event
        const tapEvent: TapEvent = {
            imageId,
            timestamp: now,
            gridPosition,
            isDeselection,
        };
        setTapEvents(prev => [...prev, tapEvent]);

        // Toggle selection
        setSelectedIds(prev => {
            const updated = new Set(prev);
            if (isCurrentlySelected) {
                updated.delete(imageId);
            } else if (updated.size < MAX_SELECTABLE_IMAGES) {
                updated.add(imageId);
            }
            return updated;
        });
    }, [selectedIds]);

    // ─── Submit Recall ────────────────────────────────────────────

    const submitRecall = useCallback(() => {
        const now = Date.now();
        const targetIds = new Set(targetImages.map(t => t.id));
        const distractorIds = new Set(distractorImages.map(d => d.id));

        const selectedArray = Array.from(selectedIds);
        const correctHits = selectedArray.filter(id => targetIds.has(id)).length;
        const falsePositives = selectedArray.filter(id => distractorIds.has(id)).length;
        const misses = targetImages.length - correctHits;
        const correctRejections = distractorImages.length - falsePositives;

        const metrics: VmraRawMetrics = {
            targetImages: targetImages.map(t => t.id),
            distractorImages: distractorImages.map(d => d.id),
            gridLayout: gridImages.map(g => g.id),
            selectedImages: selectedArray,
            tapEvents,
            correctHits,
            falsePositives,
            misses,
            correctRejections,
            totalRecallDurationMs: now - recallStartTime.current,
            encodingDurationMs: config.encodingTimePerImage * config.targetCount,
            retentionDurationMs: config.retentionDuration,
            interferenceCorrect: retentionCorrect,
            interferenceTotal: retentionTotal,
        };

        setRawMetrics(metrics);
        setPhase('scoring');

        // Run scoring engine and save
        const result = buildSessionResult(
            metrics,
            config,
            recallStartTime.current,
            getPreviousAccuracies()
        );
        setSessionResult(result);

        // Save to Firestore/localStorage
        saveResult(result);
        immediateRecallEndTime.current = Date.now();

        // Show scoring briefly, then results
        setTimeout(() => {
            setPhase('results');
        }, 1500);
    }, [targetImages, distractorImages, gridImages, selectedIds, tapEvents, config, retentionCorrect, retentionTotal, saveResult, getPreviousAccuracies]);



    // ─── Handle delayed recall tap ────────────────────────────────

    const handleDelayedTap = useCallback((imageId: string, gridPosition: number) => {
        const now = Date.now();
        const lastTap = lastTapTime.current.get(imageId) || 0;
        if (now - lastTap < 200) return;
        lastTapTime.current.set(imageId, now);

        const isCurrentlySelected = delayedSelectedIds.has(imageId);

        const tapEvent: TapEvent = {
            imageId,
            timestamp: now,
            gridPosition,
            isDeselection: isCurrentlySelected,
        };
        setDelayedTapEvents(prev => [...prev, tapEvent]);

        setDelayedSelectedIds(prev => {
            const updated = new Set(prev);
            if (isCurrentlySelected) updated.delete(imageId);
            else updated.add(imageId);
            return updated;
        });
    }, [delayedSelectedIds]);

    // ─── Submit Delayed Recall ─────────────────────────────────────

    const submitDelayedRecall = useCallback(() => {
        if (!sessionResult) return;

        const now = Date.now();
        const targetIds = new Set(targetImages.map(t => t.id));
        const distractorIds = new Set(delayedDistractors.map(d => d.id));
        const selectedArray = Array.from(delayedSelectedIds);

        const correctHits = selectedArray.filter(id => targetIds.has(id)).length;
        const falsePositives = selectedArray.filter(id => distractorIds.has(id)).length;

        const delayedMetrics: VmraRawMetrics = {
            targetImages: targetImages.map(t => t.id),
            distractorImages: delayedDistractors.map(d => d.id),
            gridLayout: delayedGridImages.map(g => g.id),
            selectedImages: selectedArray,
            tapEvents: delayedTapEvents,
            correctHits,
            falsePositives,
            misses: targetImages.length - correctHits,
            correctRejections: delayedDistractors.length - falsePositives,
            totalRecallDurationMs: now - delayedRecallStartTime.current,
            encodingDurationMs: config.encodingTimePerImage * config.targetCount,
            retentionDurationMs: config.retentionDuration,
            interferenceCorrect: 0,
            interferenceTotal: 0,
        };

        // Compute delayed features via scoring engine
        const delayedResult = buildSessionResult(
            delayedMetrics,
            config,
            delayedRecallStartTime.current,
            getPreviousAccuracies()
        );

        const delayMinutes = (now - immediateRecallEndTime.current) / 60000;
        const immediateAccuracy = sessionResult.features.recallAccuracy;
        const delayedAccuracy = delayedResult.features.recallAccuracy;
        const forgettingCurveSlope = delayMinutes > 0
            ? (immediateAccuracy - delayedAccuracy) / delayMinutes
            : 0;

        // Update the session result with delayed data
        const updatedResult: VmraAssessmentResult = {
            ...sessionResult,
            delayedRecall: {
                delayMinutes,
                delayedRawMetrics: delayedMetrics,
                delayedFeatures: delayedResult.features,
                delayedRecallRatio: immediateAccuracy > 0 ? delayedAccuracy / immediateAccuracy : 0,
                forgettingCurveSlope,
            },
        };

        setSessionResult(updatedResult);
        saveResult(updatedResult); // Overwrite with delayed data
        setPhase('results');
    }, [sessionResult, targetImages, delayedDistractors, delayedGridImages, delayedSelectedIds, delayedTapEvents, config, saveResult, getPreviousAccuracies]);

    // Keep delayed recall helpers available for future protocol extensions
    void setDelayedGridImages;
    void setDelayedDistractors;
    void handleDelayedTap;
    void submitDelayedRecall;

    // ─── Render SVG icon for an image ─────────────────────────────

    const renderIcon = (image: ImageStimulus, size: number = 80) => {
        const IconComponent = VMRA_ICON_MAP[image.svgComponent];
        if (!IconComponent) return <div className="vmra-icon-placeholder">?</div>;
        return <IconComponent size={size} />;
    };    // ─── Render Phase ─────────────────────────────────────────────

    const renderPhase = () => {
        switch (phase) {

            // ── ONBOARDING ──
            case 'onboarding':
                return (
                    <div className="instructions-with-tutorial-layout animate-fadeIn">
                        <Card className="instructions-card">
                            <div className="instructions-content">
                                <div className="instructions-icon-wrapper" aria-hidden="true">
                                    <Icon name="memory" size={28} />
                                </div>
                                <h2 className="instructions-card-title vyom-serif">How this assessment works</h2>

                                <ol className="instructions-step-list">
                                    <li className="instruction-step-item">
                                        <div className="step-num-bubble">1</div>
                                        <div className="step-content">
                                            <strong>Observe Target Items:</strong>
                                            <span>Watch a sequence of {config.targetCount} visual objects shown one by one.</span>
                                        </div>
                                    </li>
                                    <li className="instruction-step-item">
                                        <div className="step-num-bubble">2</div>
                                        <div className="step-content">
                                            <strong>Brief Focus Gap:</strong>
                                            <span>Complete a quick 15-second visual shape distractor activity.</span>
                                        </div>
                                    </li>
                                    <li className="instruction-step-item">
                                        <div className="step-num-bubble">3</div>
                                        <div className="step-content">
                                            <strong>Immediate Grid Recall:</strong>
                                            <span>Tap the images you remember seeing from a mixed visual grid.</span>
                                        </div>
                                    </li>
                                    <li className="instruction-step-item">
                                        <div className="step-num-bubble">4</div>
                                        <div className="step-content">
                                            <strong>Delayed Recognition:</strong>
                                            <span>Measure short-term visual retention fidelity after a brief delay.</span>
                                        </div>
                                    </li>
                                </ol>

                                <div className="instructions-action-row">
                                    <Button
                                        variant="primary"
                                        className="story-primary-start-btn"
                                        onClick={startEncoding}
                                    >
                                        Start Test
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Tutorial Video Placeholder */}
                        <TutorialVideoPlaceholder />
                    </div>
                );

            // ── ENCODING ──
            case 'encoding':
                return (
                    <div className="vmra-phase vmra-encoding">
                        <p className="vmra-phase-label">Remember this image</p>
                        <div className={`vmra-image-display ${imageVisible ? 'visible' : 'fading'}`}>
                            {targetImages[currentImageIndex] && renderIcon(targetImages[currentImageIndex], 160)}
                        </div>
                        <div className="vmra-progress-dots">
                            {targetImages.map((_, i) => (
                                <span
                                    key={i}
                                    className={`vmra-dot ${i < currentImageIndex ? 'completed' : i === currentImageIndex ? 'current' : ''}`}
                                />
                            ))}
                        </div>
                    </div>
                );

            // ── RETENTION GAP ──
            case 'retention':
                return (
                    <div className="vmra-phase vmra-retention">
                        <p className="vmra-phase-label">Tap the different shape</p>
                        <div className="vmra-shape-grid">
                            {retentionRound.shapes.map((shape, i) => (
                                <button
                                    key={`${retentionRoundsCompleted}-${i}`}
                                    className="vmra-shape-btn"
                                    onClick={() => handleRetentionTap(i)}
                                    aria-label={`Shape ${i + 1}: ${shape}`}
                                >
                                    <div className={`vmra-shape vmra-shape-${shape}`} />
                                </button>
                            ))}
                        </div>
                        <p className="vmra-time-remaining">{retentionTimeLeft}s</p>
                    </div>
                );

            // ── RECALL ──
            case 'recall': {
                const totalGridCells = gridImages.length;
                const selectionRatio = totalGridCells > 0 ? selectedIds.size / totalGridCells : 0;
                const showGuessingWarning = selectionRatio > 0.7;

                return (
                    <div className="vmra-phase vmra-recall" role="region" aria-label="Recall Phase">
                        <p className="vmra-phase-label">Tap the images you remember</p>

                        <div
                            className="vmra-recall-grid"
                            style={{
                                gridTemplateColumns: `repeat(${config.gridColumns}, 1fr)`,
                            }}
                            role="grid"
                            aria-label="Image selection grid"
                        >
                            {gridImages.map((image, i) => {
                                const isSelected = selectedIds.has(image.id);
                                return (
                                    <button
                                        key={image.id}
                                        className={`vmra-grid-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleImageTap(image.id, i)}
                                        aria-label={`Image ${i + 1}${isSelected ? ', selected' : ''}`}
                                        aria-pressed={isSelected}
                                    >
                                        {renderIcon(image, 64)}
                                        {isSelected && (
                                            <div className="vmra-check-overlay" aria-hidden="true">
                                                <span>✓</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {showGuessingWarning && (
                            <p className="vmra-guessing-warning" role="alert">
                                ⚠️ You've selected most of the grid. Only tap images you truly remember.
                            </p>
                        )}

                        <div className="vmra-recall-footer">
                            <p className="vmra-selection-count" aria-live="polite">
                                Selected: <span style={{ fontWeight: 700 }}>{selectedIds.size} / 10</span> images
                                {selectedIds.size >= 10 && (
                                    <span style={{ marginLeft: '0.5rem', color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>
                                        (Maximum 10 reached)
                                    </span>
                                )}
                            </p>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => {
                                    if (selectedIds.size === 0) {
                                        if (!window.confirm('You haven\'t selected any images. Submit anyway?')) return;
                                    }
                                    submitRecall();
                                }}
                                className="vmra-done-btn"
                            >
                                Done ✓
                            </Button>
                        </div>
                    </div>
                );
            }

            // ── SCORING ──
            case 'scoring':
                return (
                    <div className="vmra-phase vmra-scoring">
                        <div className="vmra-scoring-anim">
                            <div className="vmra-spinner" />
                            <p>Processing your responses...</p>
                        </div>
                    </div>
                );

            // ── RESULTS ──
            case 'results': {
                if (!rawMetrics || !sessionResult) return null;

                const { features, profile } = sessionResult;
                const scorePercent = Math.round(profile.compositeScore || profile.accuracy * 100);

                const getScoreTier = (score: number) => {
                    if (score >= 80) return { label: 'Excellent Memory', level: 'stable' as const };
                    if (score >= 60) return { label: 'Moderate Recall', level: 'change_detected' as const };
                    return { label: 'Needs Attention', level: 'possible_risk' as const };
                };

                const tier = getScoreTier(scorePercent);
                const prevAccuracies = getPreviousAccuracies();
                const isImproving = prevAccuracies.length > 1
                    ? (profile.accuracy >= prevAccuracies[prevAccuracies.length - 2])
                    : (scorePercent >= 60);
                const trend: 'up' | 'down' = isImproving ? 'up' : 'down';

                const radarData = [
                    { subject: 'Recall Accuracy', A: Math.round(features.recallAccuracy * 100), fullMark: 100 },
                    { subject: 'Discrimination', A: Math.round(features.precision * 100), fullMark: 100 },
                    { subject: 'Visual Precision', A: Math.round(features.f1Score * 100), fullMark: 100 },
                    { subject: 'Search Coverage', A: Math.round(features.gridCoverage * 100), fullMark: 100 },
                    { subject: 'Selection Speed', A: Math.max(15, Math.min(100, Math.round(profile.speed * 100))), fullMark: 100 },
                    { subject: 'Consistency', A: Math.max(20, Math.min(100, Math.round(profile.consistency * 100))), fullMark: 100 },
                ];

                const targetIdSet = new Set(targetImages.map(t => t.id));

                return (
                    <div className="story-results-container animate-fadeIn">
                        {/* Top Overview Card */}
                        <Card className="results-overview-card">
                            <div className="overview-header">
                                <div className="overview-title-group">
                                    <h2 className="vyom-serif">Visual Memory Profile</h2>
                                    <span className={`story-trend-pill ${trend === 'up' ? 'trend-up' : 'trend-down'}`}>
                                        <Icon name={trend === 'up' ? 'trend-up' : 'trend-down'} size={13} />
                                        <span>{trend === 'up' ? 'Improving' : 'Declining'}</span>
                                    </span>
                                </div>
                                <div className="score-badge-circle">
                                    <span className="score-num">{scorePercent}</span>
                                    <span className="score-denom">/ 100</span>
                                </div>
                            </div>
                        </Card>

                        <MotivationalQuoteBlock
                            category={tier.label}
                            score={scorePercent}
                        />

                        {/* Biomarkers Breakdown Row (2x2 grid) */}
                        <div className="biomarkers-grid-row">
                            <Card className="metric-card">
                                <div className="metric-info-col">
                                    <h4>Visual Recall</h4>
                                    <p className="metric-desc">{rawMetrics.correctHits} / {targetImages.length} targets recalled</p>
                                </div>
                                <div className="metric-val">{Math.round(features.recallAccuracy * 100)}%</div>
                            </Card>

                            <Card className="metric-card">
                                <div className="metric-info-col">
                                    <h4>Discrimination</h4>
                                    <p className="metric-desc">{rawMetrics.falsePositives === 0 ? 'Zero false alarms' : `${rawMetrics.falsePositives} false selections`}</p>
                                </div>
                                <div className="metric-val">{Math.round(features.precision * 100)}%</div>
                            </Card>

                            <Card className="metric-card">
                                <div className="metric-info-col">
                                    <h4>Selection Latency</h4>
                                    <p className="metric-desc">Visual search & motor speed</p>
                                </div>
                                <div className="metric-val">{(features.meanSelectionLatencyMs / 1000).toFixed(2)} <span className="metric-unit">s</span></div>
                            </Card>

                            <Card className="metric-card">
                                <div className="metric-info-col">
                                    <h4>Grid Precision</h4>
                                    <p className="metric-desc">{Math.round(features.gridCoverage * 100)}% spatial exploration</p>
                                </div>
                                <div className="metric-val">{Math.round(features.f1Score * 100)}%</div>
                            </Card>
                        </div>

                        {/* Full-Length Biomarker Radar & Item Verification Card */}
                        <Card className="radar-chart-card full-width-radar">
                            <h3 className="radar-title">Biomarker Radar</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={155}>
                                    <RadarChart cx="50%" cy="50%" outerRadius="52%" data={radarData}>
                                        <PolarGrid stroke={isDark ? "rgba(0, 201, 183, 0.22)" : "rgba(79, 124, 120, 0.22)"} />
                                        <PolarAngleAxis 
                                            dataKey="subject" 
                                            tick={renderCustomAxisTick} 
                                            tickLine={false} 
                                        />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="transparent" tick={false} />
                                        <Radar
                                            name="Biomarkers"
                                            dataKey="A"
                                            stroke={isDark ? "#00C9B7" : "#4F7C78"}
                                            fill={isDark ? "#00C9B7" : "#4F7C78"}
                                            fillOpacity={isDark ? 0.35 : 0.28}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Stimuli Verification Grid */}
                            <div className="vmra-results-grid-section">
                                <div className="vmra-grid-header-row">
                                    <span className="vmra-grid-section-title">Item Verification Breakdown</span>
                                    <span className="vmra-grid-count-badge">
                                        {rawMetrics.correctHits} / {targetImages.length} Recalled
                                    </span>
                                </div>

                                <div className="vmra-results-grid" style={{ gridTemplateColumns: `repeat(${config.gridColumns}, 1fr)` }}>
                                    {gridImages.map((image) => {
                                        const isTarget = targetIdSet.has(image.id);
                                        const wasSelected = selectedIds.has(image.id);
                                        let status = '';

                                        if (isTarget && wasSelected) status = 'correct';       // Green
                                        else if (isTarget && !wasSelected) status = 'missed';   // Amber
                                        else if (!isTarget && wasSelected) status = 'false-pos'; // Red
                                        else status = 'neutral';                                 // Dim

                                        return (
                                            <div key={image.id} className={`vmra-result-item ${status}`} title={`${image.name} (${status})`}>
                                                {renderIcon(image, 34)}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="vmra-grid-legend">
                                    <span className="legend-item"><span className="legend-dot correct" /> Recalled</span>
                                    <span className="legend-item"><span className="legend-dot missed" /> Missed Target</span>
                                    <span className="legend-item"><span className="legend-dot false-pos" /> Distractor Selected</span>
                                </div>
                            </div>
                        </Card>

                        {/* Delayed Recall Results (if completed) */}
                        {sessionResult.delayedRecall && (
                            <div className="vmra-summary-card" style={{ marginTop: '0.75rem' }}>
                                <div className="vmra-stat-row">
                                    <span className="vmra-stat-label">Delayed Recall Retention</span>
                                    <span className="vmra-stat-value">
                                        {Math.round(sessionResult.delayedRecall.delayedRecallRatio * 100)}% retained
                                    </span>
                                </div>
                                <div className="vmra-stat-row secondary">
                                    <span className="vmra-stat-label">Delay Interval</span>
                                    <span className="vmra-stat-value">
                                        {sessionResult.delayedRecall.delayMinutes.toFixed(1)} min
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Centered Actions */}
                        <div className="results-actions">
                            <button type="button" onClick={startEncoding} className="story-retake-btn">
                                <Icon name="reaction" size={15} /> Retake Test
                            </button>
                            <button 
                                type="button" 
                                className="story-primary-start-btn story-back-assessments-btn" 
                                onClick={() => navigate('/tests')}
                            >
                                Back to Assessments
                            </button>
                        </div>
                    </div>
                );
            }

            // ── DELAYED RECALL ──
            case 'delayed-recall':
                return (
                    <div className="vmra-phase vmra-recall">
                        <p className="vmra-phase-label">Can you still recall the images from earlier?</p>

                        <div
                            className="vmra-recall-grid"
                            style={{
                                gridTemplateColumns: `repeat(${config.gridColumns}, 1fr)`,
                            }}
                        >
                            {delayedGridImages.map((image, i) => {
                                const isSelected = delayedSelectedIds.has(image.id);
                                return (
                                    <button
                                        key={image.id}
                                        className={`vmra-grid-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleDelayedTap(image.id, i)}
                                        aria-label={`Image ${i + 1}`}
                                        aria-pressed={isSelected}
                                    >
                                        {renderIcon(image, 64)}
                                        {isSelected && (
                                            <div className="vmra-check-overlay">
                                                <span>✓</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="vmra-recall-footer">
                            <p className="vmra-selection-count">
                                Selected: {delayedSelectedIds.size} image{delayedSelectedIds.size !== 1 ? 's' : ''}
                            </p>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={submitDelayedRecall}
                                className="vmra-done-btn"
                            >
                                Done ✓
                            </Button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <PageWrapper>
            <div className="vmra-assessment story-assessment-container container">
                {/* Top Navigation Bar: Back / Exit Control */}
                <div className="story-top-nav">
                    <button
                        type="button"
                        onClick={handleExitClick}
                        className="story-back-btn"
                        aria-label="Back to Assessments"
                    >
                        <span className="back-arrow" aria-hidden="true">←</span>
                        <span>Back to Assessments</span>
                    </button>
                </div>

                {/* Primary Test Header (shown on intro) */}
                {phase === 'onboarding' && (
                    <div className="story-header animate-fadeInUp">
                        <h1 className="story-title vyom-serif">Visual Memory</h1>
                        <p className="story-subtitle">
                            Observe visual items and identify them from a grid to evaluate short-term recognition.
                        </p>
                    </div>
                )}

                {/* Active Assessment Stage Container */}
                <div ref={activeStageRef} className="story-stage-viewport vmra-stage-viewport">
                    {renderPhase()}
                </div>

                {/* Exit Confirmation Dialog */}
                {showExitConfirm && (
                    <div className="story-modal-backdrop animate-fadeIn" role="dialog" aria-modal="true">
                        <div className="story-exit-modal animate-scaleUp">
                            <div className="exit-modal-icon">⚠️</div>
                            <h3 className="exit-modal-title vyom-serif">Leave this assessment?</h3>
                            <p className="exit-modal-text">
                                Your current assessment progress will be lost if you leave now.
                            </p>
                            <div className="exit-modal-actions">
                                <button
                                    type="button"
                                    onClick={handleCancelExit}
                                    className="modal-btn modal-btn-secondary"
                                >
                                    Continue Test
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmExit}
                                    className="modal-btn modal-btn-danger"
                                >
                                    Leave Test
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PageWrapper>
    );
}
