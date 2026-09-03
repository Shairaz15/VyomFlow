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
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/common';
import { PageWrapper } from '../components/layout';
import { VMRA_ICON_MAP } from '../components/vmra/vmraIcons';
import {
    selectTargetImages,
    selectDistractors,
    buildGrid,
    getSessionConfig,
} from '../data/vmraImageCatalog';
import { buildSessionResult, identifyVmraKeyFactors } from '../utils/vmraScoring';
import { useVmraResults } from '../hooks/useTestResults';
import type {
    VmraPhase,
    ImageStimulus,
    TapEvent,
    VmraRawMetrics,
    VmraSessionConfig,
    VmraAssessmentResult,
} from '../types/vmraTypes';
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
    const { isAuthenticated } = useAuth(); // Ensures user is in auth context
    const { saveResult, getSessionCount, getPreviousAccuracies } = useVmraResults();

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
    const [keyFactors, setKeyFactors] = useState<string[]>([]);

    // Delayed recall state
    const [delayedGridImages, setDelayedGridImages] = useState<ImageStimulus[]>([]);
    const [delayedDistractors, setDelayedDistractors] = useState<ImageStimulus[]>([]);
    const [delayedSelectedIds, setDelayedSelectedIds] = useState<Set<string>>(new Set());
    const [delayedTapEvents, setDelayedTapEvents] = useState<TapEvent[]>([]);
    const delayedRecallStartTime = useRef<number>(0);
    const immediateRecallEndTime = useRef<number>(0);
    const [delayedCompleted, setDelayedCompleted] = useState(false);

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

    const handleImageTap = useCallback((imageId: string, gridPosition: number) => {
        const now = Date.now();

        // Double-tap prevention: ignore taps within 200ms on same image
        const lastTap = lastTapTime.current.get(imageId) || 0;
        if (now - lastTap < 200) return;
        lastTapTime.current.set(imageId, now);

        const isCurrentlySelected = selectedIds.has(imageId);
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
            } else {
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
        setKeyFactors(identifyVmraKeyFactors(result.features));

        // Save to Firestore/localStorage
        saveResult(result);
        immediateRecallEndTime.current = Date.now();

        // Show scoring briefly, then results
        setTimeout(() => {
            setPhase('results');
        }, 1500);
    }, [targetImages, distractorImages, gridImages, selectedIds, tapEvents, config, retentionCorrect, retentionTotal, saveResult, getPreviousAccuracies]);

    // ─── Start Delayed Recall ─────────────────────────────────────

    const startDelayedRecall = useCallback(() => {
        // Build a new grid with different distractors
        const newDistractors = selectDistractors(
            targetImages,
            config.distractorCount,
            config.similarityLevel
        );
        setDelayedDistractors(newDistractors);
        const grid = buildGrid(targetImages, newDistractors);
        setDelayedGridImages(grid);
        setDelayedSelectedIds(new Set());
        setDelayedTapEvents([]);
        delayedRecallStartTime.current = Date.now();
        lastTapTime.current = new Map();
        setPhase('delayed-recall');
    }, [targetImages, config]);

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
        setDelayedCompleted(true);
        saveResult(updatedResult); // Overwrite with delayed data
        setPhase('results');
    }, [sessionResult, targetImages, delayedDistractors, delayedGridImages, delayedSelectedIds, delayedTapEvents, config, saveResult, getPreviousAccuracies]);

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
                    <div className="vmra-phase vmra-onboarding">
                        <div className="vmra-phase-icon">👁️</div>
                        <h2>Visual Memory Assessment</h2>
                        <p className="vmra-description">
                            This brief activity helps track your visual recall patterns over time.
                        </p>

                        <div className="vmra-instructions">
                            <div className="vmra-instruction-step">
                                <div className="vmra-step-visual">
                                    <span className="vmra-step-emoji">👀</span>
                                </div>
                                <span>You'll see {config.targetCount} images, one at a time</span>
                            </div>
                            <div className="vmra-instruction-step">
                                <div className="vmra-step-visual">
                                    <span className="vmra-step-emoji">🧩</span>
                                </div>
                                <span>A short activity to keep you busy</span>
                            </div>
                            <div className="vmra-instruction-step">
                                <div className="vmra-step-visual">
                                    <span className="vmra-step-emoji">👆</span>
                                </div>
                                <span>Tap the images you remember from a grid</span>
                            </div>
                        </div>

                        <p className="vmra-reassurance">
                            Take your time — there's no pressure. Occasional variation is completely normal.
                        </p>

                        <div className="vmra-actions">
                            <Button variant="secondary" size="lg" onClick={() => navigate('/tests')}>
                                Back
                            </Button>
                            <Button variant="primary" size="lg" onClick={startEncoding}>
                                Begin Assessment
                            </Button>
                        </div>
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
                                Selected: {selectedIds.size} image{selectedIds.size !== 1 ? 's' : ''}
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
            case 'results':
                if (!rawMetrics || !sessionResult) return null;

                const stars = sessionResult.profile.starRating;
                const targetIdSet = new Set(targetImages.map(t => t.id));

                return (
                    <div className="vmra-phase vmra-results">
                        <div className="vmra-phase-icon vmra-success">✓</div>
                        <h2>Assessment Complete</h2>

                        {/* Star Rating */}
                        <div className="vmra-stars">
                            {[1, 2, 3, 4, 5].map(s => (
                                <span key={s} className={`vmra-star ${s <= stars ? 'filled' : ''}`}>
                                    ★
                                </span>
                            ))}
                        </div>

                        {/* Visual results grid */}
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
                                    <div key={image.id} className={`vmra-result-item ${status}`}>
                                        {renderIcon(image, 48)}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary stats */}
                        <div className="vmra-summary-card">
                            <div className="vmra-stat-row">
                                <span className="vmra-stat-label">Correctly recalled</span>
                                <span className="vmra-stat-value">{rawMetrics.correctHits} / {targetImages.length}</span>
                            </div>
                            {rawMetrics.falsePositives > 0 && (
                                <div className="vmra-stat-row secondary">
                                    <span className="vmra-stat-label">Incorrect selections</span>
                                    <span className="vmra-stat-value">{rawMetrics.falsePositives}</span>
                                </div>
                            )}
                        </div>

                        {/* Key Factors */}
                        {keyFactors.length > 0 && (
                            <div className="vmra-factors">
                                <p className="vmra-factors-label">Key Observations:</p>
                                <ul className="vmra-factors-list">
                                    {keyFactors.map((f, i) => (
                                        <li key={i}>{f}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <p className="vmra-reassurance">
                            Occasional variation is normal. Trends over time are more meaningful than a single session.
                        </p>

                        <div className="vmra-actions">
                            {!delayedCompleted && (
                                <Button variant="secondary" onClick={startDelayedRecall}>
                                    Try Delayed Recall
                                </Button>
                            )}
                            <Button variant="primary" onClick={() => navigate('/dashboard')}>
                                View Dashboard
                            </Button>
                            <Button variant="secondary" onClick={() => navigate('/tests')}>
                                Back to Assessments
                            </Button>
                        </div>

                        {/* Delayed Recall Results (if completed) */}
                        {sessionResult.delayedRecall && (
                            <div className="vmra-summary-card" style={{ marginTop: '1rem' }}>
                                <div className="vmra-stat-row">
                                    <span className="vmra-stat-label">Delayed recall</span>
                                    <span className="vmra-stat-value">
                                        {Math.round(sessionResult.delayedRecall.delayedRecallRatio * 100)}% retained
                                    </span>
                                </div>
                                <div className="vmra-stat-row secondary">
                                    <span className="vmra-stat-label">Delay time</span>
                                    <span className="vmra-stat-value">
                                        {sessionResult.delayedRecall.delayMinutes.toFixed(1)} min
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                );

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
            <div className="vmra-assessment container">
                {renderPhase()}
            </div>
        </PageWrapper>
    );
}
