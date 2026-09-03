import { useState, useMemo, useCallback } from "react";
import { Button, Icon } from "../../../common";
import { useLanguage } from "../../../../i18n/LanguageContext";
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
    const { t } = useLanguage();
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
                            ? t("navigation.firstStop")
                            : slotIndex === TARGET_COUNT - 1
                            ? t("navigation.finalStop")
                            : t("navigation.stopN", { n: slotIndex + 1 })}
                    </span>
                    <span className="slot-empty-sub">{t("navigation.tapPhotoToPlace")}</span>
                </div>
            )}
        </div>
    );
}

/* ═════════════════════════════════════════════════════
 * Main LandmarkOrdering Component
 * ═════════════════════════════════════════════════════ */
export function LandmarkOrdering({ landmarks, onComplete }: LandmarkOrderingProps) {
    const { t } = useLanguage();

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
            // Already placed: remove it and shift remaining left
            setSlots((prev) => {
                const next = [...prev];
                next.splice(existingIdx, 1);
                next.push(null);
                return next;
            });
            return;
        }

        // Not placed yet: place into first available slot
        setSlots((prev) => {
            const firstEmpty = prev.findIndex((s) => s === null);
            if (firstEmpty === -1) return prev; // All 6 full

            const next = [...prev];
            next[firstEmpty] = landmark;
            return next;
        });
    }, [slots]);

    // Remove an item by slot index and shift left
    const handleRemoveSlot = useCallback((slotIndex: number) => {
        setSlots((prev) => {
            const next = [...prev];
            next.splice(slotIndex, 1);
            next.push(null);
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
                        <span className="phase-pill">{t("navigation.phase4Of4")}</span>
                        <span className="progress-counter">
                            {t("navigation.landmarksPlaced", { count: filledCount, total: TARGET_COUNT })}
                        </span>
                    </div>
                    <h1 className="chronology-title vyom-serif">{t("navigation.landmarkChronologyTitle")}</h1>
                    <p className="chronology-instruction">
                        {t("navigation.landmarkInstruction")}
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
                        {isComplete ? t("navigation.submitSequence") : t("navigation.selectAll6ToSubmit", { count: filledCount, total: TARGET_COUNT })}
                    </Button>
                </div>
            </header>

            {/* ── 2. YOUR ROUTE SEQUENCE (WITH HORIZONTAL SCROLLBAR) ── */}
            <section className="chronology-hero-section">
                <div className="section-title-bar">
                    <div className="section-title-wrap">
                        <span className="section-icon">🧭</span>
                        <h2 className="section-heading">{t("navigation.yourRouteSequence")}</h2>
                        <span className="scroll-hint-pill">{t("navigation.scrollHint")}</span>
                    </div>
                    {filledCount > 0 && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            className="clear-all-btn"
                        >
                            {t("navigation.clearAll")}
                        </button>
                    )}
                </div>

                {/* Horizontally Scrollable Journey Track Container */}
                <div className="route-journey-scroll-viewport">
                    <div className="route-journey-track">
                        {/* Start Point A */}
                        <div className="journey-node start-node">
                            <div className="node-marker">A</div>
                            <span className="node-label">{t("navigation.gate1")}</span>
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
                            <span className="node-label">{t("navigation.sportsPlaza")}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── 3. AVAILABLE LANDMARKS POOL ── */}
            <section className="chronology-pool-section">
                <div className="section-title-bar">
                    <div className="section-title-wrap">
                        <span className="section-icon">🏛️</span>
                        <h2 className="section-heading">{t("navigation.availableLandmarks")}</h2>
                        <span className="pool-count-tag">{t("navigation.photosTapSelect")}</span>
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
