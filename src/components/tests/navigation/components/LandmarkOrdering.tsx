import { useState, useMemo, useCallback } from "react";
import { Button, Icon } from "../../../common";
import type { LandmarkItem, LandmarkOrderingResult } from "../../../../types/navigationTypes";

interface LandmarkOrderingProps {
    landmarks: LandmarkItem[];
    onComplete: (result: LandmarkOrderingResult) => void;
}

const TARGET_COUNT = 6;
const TOTAL_DISPLAY = 10; // 6 correct + 4 random distractors

/* ─────────────────────────────────────────────────────
 * Landmark Card in Available Pool
 * ───────────────────────────────────────────────────── */
function PoolLandmarkCard({
    landmark,
    isSelected,
    sequenceNumber,
    onTap,
}: {
    landmark: LandmarkItem;
    isSelected: boolean;
    sequenceNumber: number | null;
    onTap: () => void;
}) {
    const [imgError, setImgError] = useState(false);

    return (
        <div
            onClick={onTap}
            className={`vyom-landmark-card group ${
                isSelected
                    ? "is-selected"
                    : "is-selectable"
            }`}
            role="button"
            tabIndex={0}
            aria-label={`${landmark.name}${isSelected ? `, placed as stop ${sequenceNumber}, tap to remove` : `, tap to select as stop`}`}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onTap();
                }
            }}
        >
            {/* Visual Image Container */}
            <div className="card-image-wrap">
                {!imgError && landmark.imageUrl ? (
                    <img
                        src={landmark.imageUrl}
                        alt={landmark.name}
                        onError={() => setImgError(true)}
                        className="card-img"
                        draggable={false}
                    />
                ) : (
                    <div className="card-img-placeholder">
                        <Icon name="memory" size={24} />
                    </div>
                )}

                {/* Selected Sequence Number Badge */}
                {isSelected && sequenceNumber !== null && (
                    <div className="selected-overlay">
                        <div className="seq-number-badge">
                            <span>{sequenceNumber}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Label Section */}
            <div className="card-meta">
                <span className="landmark-name" title={landmark.name}>
                    {landmark.name}
                </span>
                <span className={`card-status-hint ${isSelected ? "is-selected" : ""}`}>
                    {isSelected ? `Stop #${sequenceNumber} • Tap to remove` : "Tap to select"}
                </span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────
 * Route Sequence Slot (The Hero Area)
 * ───────────────────────────────────────────────────── */
function SequenceSlotItem({
    slotIndex,
    landmark,
    onRemove,
}: {
    slotIndex: number;
    landmark: LandmarkItem | null;
    onRemove: () => void;
}) {
    const [imgError, setImgError] = useState(false);
    const formattedNum = String(slotIndex + 1).padStart(2, "0");

    return (
        <div
            className={`vyom-sequence-slot ${
                landmark
                    ? "is-filled"
                    : "is-empty"
            }`}
            onClick={landmark ? onRemove : undefined}
            role={landmark ? "button" : undefined}
            tabIndex={landmark ? 0 : undefined}
            title={landmark ? "Click to remove this stop" : undefined}
            onKeyDown={landmark ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRemove();
                }
            } : undefined}
        >
            {/* Slot Number Tag */}
            <div className="slot-number-badge">
                <span>{formattedNum}</span>
            </div>

            {landmark ? (
                /* Filled Slot Content */
                <div className="slot-filled-content">
                    <div className="slot-img-wrap">
                        {!imgError && landmark.imageUrl ? (
                            <img
                                src={landmark.imageUrl}
                                alt={landmark.name}
                                onError={() => setImgError(true)}
                                className="slot-img"
                                draggable={false}
                            />
                        ) : (
                            <div className="slot-img-fallback">
                                <Icon name="memory" size={20} />
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            className="slot-remove-btn"
                            title="Remove landmark"
                            aria-label={`Remove ${landmark.name}`}
                        >
                            ✕
                        </button>
                    </div>
                    <div className="slot-meta">
                        <span className="slot-landmark-name" title={landmark.name}>
                            {landmark.name}
                        </span>
                    </div>
                </div>
            ) : (
                /* Empty Slot Placeholder */
                <div className="slot-empty-content">
                    <div className="slot-empty-icon">
                        <span>+</span>
                    </div>
                    <span className="slot-empty-label">
                        {slotIndex === 0
                            ? "1st Stop"
                            : slotIndex === TARGET_COUNT - 1
                            ? "Final Stop"
                            : `Stop ${slotIndex + 1}`}
                    </span>
                    <span className="slot-empty-sub">Tap photo to place</span>
                </div>
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════════
 * Main LandmarkOrdering Component
 * ═════════════════════════════════════════════════════ */
export function LandmarkOrdering({ landmarks, onComplete }: LandmarkOrderingProps) {
    // Ground truth: real landmarks sorted by chronological order
    const realLandmarksInOrder = useMemo(() => {
        return landmarks
            .filter((lm) => lm.isReal && lm.chronologicalOrder > 0)
            .sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);
    }, [landmarks]);

    // Build the 10-item pool: all 6 real + 4 randomly selected distractors
    const displayPool = useMemo(() => {
        const reals = landmarks.filter((lm) => lm.isReal);
        const distractors = landmarks.filter((lm) => !lm.isReal);

        // Shuffle distractors and pick 4
        const shuffledDistractors = [...distractors].sort(() => Math.random() - 0.5);
        const selectedDistractors = shuffledDistractors.slice(0, TOTAL_DISPLAY - reals.length);

        // Combine and shuffle the whole pool
        const pool = [...reals, ...selectedDistractors];
        return pool.sort(() => Math.random() - 0.5);
    }, [landmarks]);

    // Ordered sequence slots (null = empty)
    const [slots, setSlots] = useState<(LandmarkItem | null)[]>(() =>
        new Array(TARGET_COUNT).fill(null)
    );

    const filledCount = useMemo(() => {
        return slots.filter((lm): lm is LandmarkItem => lm !== null).length;
    }, [slots]);

    const isComplete = filledCount === TARGET_COUNT;

    // Tap to select or unselect landmark in sequence
    const handleTapLandmark = useCallback((landmark: LandmarkItem) => {
        const existingIdx = slots.findIndex((item) => item?.id === landmark.id);

        if (existingIdx !== -1) {
            // Remove from sequence and shift remaining items left
            setSlots((prev) => {
                const remaining = prev.filter((item) => item !== null && item.id !== landmark.id);
                while (remaining.length < TARGET_COUNT) {
                    remaining.push(null);
                }
                return remaining;
            });
        } else {
            // Find first empty slot
            const firstEmpty = slots.findIndex((item) => item === null);
            if (firstEmpty !== -1) {
                setSlots((prev) => {
                    const next = [...prev];
                    next[firstEmpty] = landmark;
                    return next;
                });
            }
        }
    }, [slots]);

    // Remove an item by slot index and shift left
    const handleRemoveSlot = useCallback((slotIndex: number) => {
        setSlots((prev) => {
            const next = prev.filter((_, idx) => idx !== slotIndex);
            while (next.length < TARGET_COUNT) {
                next.push(null);
            }
            return next;
        });
    }, []);

    const handleClearAll = useCallback(() => {
        setSlots(new Array(TARGET_COUNT).fill(null));
    }, []);

    const handleSubmit = () => {
        if (!isComplete) return;

        const orderedPlaced = slots as LandmarkItem[];
        const orderedLandmarkIds = orderedPlaced.map((lm) => lm.id);
        const correctOrderIds = realLandmarksInOrder.map((lm) => lm.id);

        const realCount = orderedPlaced.filter((lm) => lm.isReal).length;
        const recognitionAccuracy = realCount / TARGET_COUNT;
        const falseLandmarkCount = TARGET_COUNT - realCount;

        // Sequence accuracy: correct item in correct slot
        let correctPositions = 0;
        for (let i = 0; i < TARGET_COUNT; i++) {
            if (orderedPlaced[i]?.id === correctOrderIds[i]) {
                correctPositions++;
            }
        }
        const sequenceAccuracy = correctPositions / TARGET_COUNT;

        onComplete({
            selectedLandmarkIds: orderedLandmarkIds,
            orderedLandmarkIds,
            correctOrderIds,
            recognitionAccuracy,
            sequenceAccuracy,
            falseLandmarkCount,
        });
    };

    return (
        <div className="landmark-chronology-container animate-fadeIn">
            {/* ── 1. HEADER WITH TOP PROMINENT SUBMIT BUTTON ── */}
            <header className="chronology-top-header">
                <div className="header-left-info">
                    <div className="header-meta-row">
                        <span className="phase-pill">PHASE 4 OF 4</span>
                        <span className="progress-counter">
                            {filledCount} of {TARGET_COUNT} placed
                        </span>
                    </div>
                    <h1 className="chronology-title vyom-serif">Landmark Chronology Sequence</h1>
                    <p className="chronology-instruction">
                        Select all 6 landmarks in order from <strong>Gate 1 (A)</strong> to <strong>Sports Plaza (B)</strong>.
                    </p>
                </div>

                {/* Prominent Top Submit Button */}
                <div className="header-right-action">
                    <Button
                        variant="primary"
                        size="md"
                        disabled={!isComplete}
                        onClick={handleSubmit}
                        className={`chronology-top-submit-btn ${isComplete ? "is-ready" : "is-incomplete"}`}
                    >
                        {isComplete ? "Submit Sequence →" : `Select all 6 to submit (${filledCount}/${TARGET_COUNT})`}
                    </Button>
                </div>
            </header>

            {/* ── 2. YOUR ROUTE SEQUENCE (WITH HORIZONTAL SCROLLBAR) ── */}
            <section className="chronology-hero-section">
                <div className="section-title-bar">
                    <div className="section-title-wrap">
                        <span className="section-icon">🧭</span>
                        <h2 className="section-heading">Your Route Sequence</h2>
                        <span className="scroll-hint-pill">↔ Scroll to view all stops</span>
                    </div>
                    {filledCount > 0 && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="clear-all-btn"
                        >
                            Clear all
                        </button>
                    )}
                </div>

                {/* Horizontally Scrollable Journey Track Container */}
                <div className="route-journey-scroll-viewport">
                    <div className="route-journey-track">
                        {/* Start Point A */}
                        <div className="journey-node start-node">
                            <div className="node-marker">A</div>
                            <span className="node-label">Gate 1</span>
                        </div>

                        <div className="journey-connector">
                            <span className="connector-arrow">→</span>
                        </div>

                        {/* 6 Sequence Slots */}
                        <div className="sequence-slots-row">
                            {slots.map((landmark, idx) => (
                                <div key={`slot_wrap_${idx}`} className="slot-wrapper-cell">
                                    <SequenceSlotItem
                                        slotIndex={idx}
                                        landmark={landmark}
                                        onRemove={() => handleRemoveSlot(idx)}
                                    />
                                    {idx < TARGET_COUNT - 1 && (
                                        <div className="slot-sub-arrow">→</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="journey-connector">
                            <span className="connector-arrow">→</span>
                        </div>

                        {/* End Point B */}
                        <div className="journey-node end-node">
                            <div className="node-marker">B</div>
                            <span className="node-label">Sports Plaza</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 3. AVAILABLE LANDMARKS POOL ── */}
            <section className="chronology-pool-section">
                <div className="section-title-bar">
                    <div className="section-title-wrap">
                        <span className="section-icon">🏛️</span>
                        <h2 className="section-heading">Available Landmarks</h2>
                        <span className="pool-count-tag">10 Photos • Tap to select in order</span>
                    </div>
                </div>

                <div className="landmark-pool-grid">
                    {displayPool.map((lm) => {
                        const selectedIdx = slots.findIndex((s) => s?.id === lm.id);
                        const isSelected = selectedIdx !== -1;
                        const sequenceNumber = isSelected ? selectedIdx + 1 : null;

                        return (
                            <PoolLandmarkCard
                                key={lm.id}
                                landmark={lm}
                                isSelected={isSelected}
                                sequenceNumber={sequenceNumber}
                                onTap={() => handleTapLandmark(lm)}
                            />
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
