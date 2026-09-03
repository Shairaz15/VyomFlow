import { useState, useMemo, useCallback } from "react";
import type { CSSProperties } from "react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    horizontalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
    onTap,
}: {
    landmark: LandmarkItem;
    isSelected: boolean;
    onTap: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: landmark.id,
        disabled: isSelected,
    });

    const [imgError, setImgError] = useState(false);

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: transition || "transform 150ms ease, opacity 150ms ease",
        opacity: isDragging ? 0.2 : isSelected ? 0.35 : 1,
        cursor: isSelected ? "default" : "grab",
        touchAction: "none",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={!isSelected ? onTap : undefined}
            className={`vyom-landmark-card group ${
                isSelected
                    ? "is-selected"
                    : "is-selectable"
            }`}
            role="button"
            tabIndex={isSelected ? -1 : 0}
            aria-label={`${landmark.name}${isSelected ? ", already placed" : ", tap or drag to place"}`}
            onKeyDown={(e) => {
                if (!isSelected && (e.key === "Enter" || e.key === " ")) {
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

                {/* Selected Checkmark Badge */}
                {isSelected && (
                    <div className="selected-overlay">
                        <div className="check-badge">
                            <span>✓</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Label Section */}
            <div className="card-meta">
                <span className="landmark-name" title={landmark.name}>
                    {landmark.name}
                </span>
                <span className="card-status-hint">
                    {isSelected ? "Placed ✓" : "Tap to place"}
                </span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────
 * Route Sequence Slot (The Hero Area)
 * ───────────────────────────────────────────────────── */
function SequenceSlotItem({
    id,
    slotIndex,
    landmark,
    onRemove,
}: {
    id: string;
    slotIndex: number;
    landmark: LandmarkItem | null;
    onRemove: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isOver,
        isDragging,
    } = useSortable({
        id,
        data: { slotIndex },
    });

    const [imgError, setImgError] = useState(false);

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: transition || "transform 150ms ease",
        opacity: isDragging ? 0.4 : 1,
        touchAction: "none",
    };

    const formattedNum = String(slotIndex + 1).padStart(2, "0");

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(landmark ? listeners : {})}
            className={`vyom-sequence-slot ${
                isOver && !landmark
                    ? "is-drop-target"
                    : landmark
                    ? "is-filled"
                    : "is-empty"
            }`}
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
                    <span className="slot-empty-sub">Drop or tap</span>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────
 * Drag Overlay Preview
 * ───────────────────────────────────────────────────── */
function DragOverlayCard({ landmark }: { landmark: LandmarkItem }) {
    return (
        <div className="vyom-drag-overlay-card">
            <div className="overlay-img-wrap">
                {landmark.imageUrl ? (
                    <img src={landmark.imageUrl} alt={landmark.name} className="card-img" />
                ) : (
                    <div className="card-img-placeholder">
                        <Icon name="memory" size={20} />
                    </div>
                )}
            </div>
            <div className="card-meta">
                <span className="landmark-name">{landmark.name}</span>
            </div>
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

    // Active drag item for overlay
    const [activeDragItem, setActiveDragItem] = useState<LandmarkItem | null>(null);

    // Sensors for smooth drag & touch with accurate pointer position
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
    );

    const selectedIds = useMemo(() => {
        return slots.filter((lm): lm is LandmarkItem => lm !== null).map((lm) => lm.id);
    }, [slots]);

    const filledCount = selectedIds.length;
    const isComplete = filledCount === TARGET_COUNT;

    // Slot IDs for SortableContext
    const slotIds = useMemo(() => slots.map((_, idx) => `slot_${idx}`), [slots]);

    // Handle drag start
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const id = active.id as string;

        const poolItem = displayPool.find((lm) => lm.id === id);
        if (poolItem) {
            setActiveDragItem(poolItem);
            return;
        }

        if (id.startsWith("slot_")) {
            const slotIdx = parseInt(id.replace("slot_", ""), 10);
            const slotLm = slots[slotIdx];
            if (slotLm) {
                setActiveDragItem(slotLm);
            }
        }
    }, [displayPool, slots]);

    // Handle drag end
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Case 1: Dragging from pool into a slot
        if (!activeId.startsWith("slot_") && overId.startsWith("slot_")) {
            const landmark = displayPool.find((lm) => lm.id === activeId);
            const slotIndex = parseInt(overId.replace("slot_", ""), 10);

            if (landmark && slotIndex >= 0 && slotIndex < TARGET_COUNT) {
                setSlots((prev) => {
                    const next = [...prev];
                    const existingIdx = next.findIndex((item) => item?.id === landmark.id);
                    if (existingIdx !== -1) {
                        next[existingIdx] = null;
                    }
                    next[slotIndex] = landmark;
                    return next;
                });
            }
            return;
        }

        // Case 2: Reordering within slots
        if (activeId.startsWith("slot_") && overId.startsWith("slot_")) {
            const oldIdx = parseInt(activeId.replace("slot_", ""), 10);
            const newIdx = parseInt(overId.replace("slot_", ""), 10);

            if (oldIdx !== newIdx) {
                setSlots((prev) => arrayMove(prev, oldIdx, newIdx));
            }
        }
    }, [displayPool]);

    // Tap to place / toggle in first available slot
    const handleTapLandmark = useCallback((landmark: LandmarkItem) => {
        if (selectedIds.includes(landmark.id)) {
            // Remove from slot
            setSlots((prev) => prev.map((item) => (item?.id === landmark.id ? null : item)));
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
    }, [selectedIds, slots]);

    const handleRemoveSlot = useCallback((slotIndex: number) => {
        setSlots((prev) => {
            const next = [...prev];
            next[slotIndex] = null;
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
                        Select all 6 landmarks from <strong>Gate 1 (A)</strong> to <strong>Sports Plaza (B)</strong>.
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

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
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
                                <SortableContext items={slotIds} strategy={horizontalListSortingStrategy}>
                                    {slots.map((landmark, idx) => (
                                        <div key={`slot_wrap_${idx}`} className="slot-wrapper-cell">
                                            <SequenceSlotItem
                                                id={`slot_${idx}`}
                                                slotIndex={idx}
                                                landmark={landmark}
                                                onRemove={() => handleRemoveSlot(idx)}
                                            />
                                            {idx < TARGET_COUNT - 1 && (
                                                <div className="slot-sub-arrow">→</div>
                                            )}
                                        </div>
                                    ))}
                                </SortableContext>
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
                            <span className="pool-count-tag">10 Photos • Tap or drag to place</span>
                        </div>
                    </div>

                    <div className="landmark-pool-grid">
                        {displayPool.map((lm) => (
                            <PoolLandmarkCard
                                key={lm.id}
                                landmark={lm}
                                isSelected={selectedIds.includes(lm.id)}
                                onTap={() => handleTapLandmark(lm)}
                            />
                        ))}
                    </div>
                </section>

                {/* Drag Overlay Card */}
                <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
                    {activeDragItem ? <DragOverlayCard landmark={activeDragItem} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
