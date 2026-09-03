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
import type { DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    horizontalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, Card, Icon } from "../../../common";
import type { LandmarkItem, LandmarkOrderingResult } from "../../../../types/navigationTypes";

interface LandmarkOrderingProps {
    landmarks: LandmarkItem[];
    onComplete: (result: LandmarkOrderingResult) => void;
}

const TARGET_COUNT = 6;
const TOTAL_DISPLAY = 10; // 6 correct + 4 random distractors

/* ─────────────────────────────────────────────────────
 * Landmark Card used in the available pool (draggable)
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
        transition: transition || "transform 200ms ease, opacity 200ms ease",
        opacity: isDragging ? 0.3 : isSelected ? 0.3 : 1,
        cursor: isSelected ? "default" : "grab",
        zIndex: isDragging ? 50 : "auto",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={!isSelected ? onTap : undefined}
            className={`group relative rounded-2xl border-2 transition-all duration-200 select-none touch-none overflow-hidden ${
                isSelected
                    ? "border-slate-800/50 bg-slate-900/30 pointer-events-none"
                    : "border-slate-700/80 bg-slate-800/90 hover:border-cyan-500/60 hover:shadow-lg hover:shadow-cyan-500/10 hover:scale-[1.03] cursor-pointer active:scale-[0.97]"
            }`}
        >
            {/* Image */}
            <div className="w-full aspect-[4/3] overflow-hidden bg-slate-950 relative">
                {!imgError && landmark.imageUrl ? (
                    <img
                        src={landmark.imageUrl}
                        alt={landmark.name}
                        onError={() => setImgError(true)}
                        className={`w-full h-full object-cover transition-all duration-300 ${
                            isSelected ? "grayscale blur-[1px]" : "group-hover:scale-105"
                        }`}
                        draggable={false}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-cyan-400/60 space-y-1">
                        <Icon name="memory" size={28} />
                        <span className="text-[10px] text-slate-500 font-medium">Landmark</span>
                    </div>
                )}

                {/* Selected checkmark overlay */}
                {isSelected && (
                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center">
                            <span className="text-cyan-300 text-lg font-bold">✓</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Label */}
            <div className="p-2.5 space-y-1">
                <span className={`text-xs font-semibold leading-snug line-clamp-2 block ${
                    isSelected ? "text-slate-600" : "text-slate-200"
                }`}>
                    {landmark.name}
                </span>
                <span className={`text-[10px] font-medium block ${
                    isSelected ? "text-slate-700" : "text-cyan-400/70"
                }`}>
                    {isSelected ? "Placed ✓" : "Tap to place"}
                </span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────
 * Sortable Slot in the sequence area
 * ───────────────────────────────────────────────────── */
function SortableSlot({
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
        transition: transition || "transform 200ms ease",
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(landmark ? listeners : {})}
            className={`relative rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                isOver && !landmark
                    ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20 scale-[1.02]"
                    : landmark
                    ? "border-cyan-500/40 bg-slate-900/95 cursor-grab active:cursor-grabbing"
                    : "border-dashed border-slate-700/60 bg-slate-950/40 hover:border-slate-600/80"
            }`}
        >
            {/* Order badge - top left */}
            <div className="absolute top-2 left-2 z-10">
                <span className={`w-7 h-7 rounded-full text-xs font-mono font-bold flex items-center justify-center shadow-md ${
                    landmark
                        ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/60"
                        : "bg-slate-800/90 text-slate-500 border border-slate-700"
                }`}>
                    {slotIndex + 1}
                </span>
            </div>

            {landmark ? (
                <>
                    {/* Filled slot image */}
                    <div className="w-full aspect-[4/3] overflow-hidden bg-slate-950 relative">
                        {!imgError && landmark.imageUrl ? (
                            <img
                                src={landmark.imageUrl}
                                alt={landmark.name}
                                onError={() => setImgError(true)}
                                className="w-full h-full object-cover"
                                draggable={false}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <Icon name="memory" size={24} className="text-cyan-400" />
                            </div>
                        )}
                    </div>

                    {/* Label + remove */}
                    <div className="p-2 space-y-1">
                        <span className="text-xs font-semibold text-white leading-snug line-clamp-2 block">
                            {landmark.name}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer transition-colors flex items-center gap-0.5"
                        >
                            <span>✕</span> Remove
                        </button>
                    </div>
                </>
            ) : (
                /* Empty slot placeholder */
                <div className="w-full aspect-[4/3] flex flex-col items-center justify-center text-slate-600 space-y-1.5 p-4">
                    <div className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-700/60 flex items-center justify-center">
                        <Icon name="add" size={20} className="text-slate-600" />
                    </div>
                    <span className="text-[11px] font-medium">
                        {slotIndex === 0 ? "First seen" : slotIndex === TARGET_COUNT - 1 ? "Last seen" : `Position ${slotIndex + 1}`}
                    </span>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────
 * Drag Overlay Card (what you see while dragging)
 * ───────────────────────────────────────────────────── */
function DragOverlayCard({ landmark }: { landmark: LandmarkItem }) {
    const [imgError, setImgError] = useState(false);

    return (
        <div className="w-44 rounded-2xl border-2 border-cyan-400 bg-slate-800 shadow-2xl shadow-cyan-500/30 overflow-hidden opacity-90 rotate-2">
            <div className="w-full aspect-[4/3] overflow-hidden bg-slate-950">
                {!imgError && landmark.imageUrl ? (
                    <img
                        src={landmark.imageUrl}
                        alt={landmark.name}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover"
                        draggable={false}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <Icon name="memory" size={24} className="text-cyan-400" />
                    </div>
                )}
            </div>
            <div className="p-2">
                <span className="text-xs font-semibold text-white line-clamp-1">{landmark.name}</span>
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

    // Active drag state for overlay
    const [activeDragItem, setActiveDragItem] = useState<LandmarkItem | null>(null);

    // Sensors for smooth drag
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } })
    );

    const selectedIds = useMemo(() => {
        return slots.filter((lm): lm is LandmarkItem => lm !== null).map((lm) => lm.id);
    }, [slots]);

    const filledCount = selectedIds.length;
    const isComplete = filledCount === TARGET_COUNT;

    // Slot IDs for SortableContext
    const slotIds = useMemo(() =>
        slots.map((_, idx) => `slot_${idx}`)
    , [slots]);

    // Handle drag start
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const id = active.id as string;

        // Check if it's a pool item
        const poolItem = displayPool.find((lm) => lm.id === id);
        if (poolItem) {
            setActiveDragItem(poolItem);
            return;
        }

        // Check if it's a slot item being reordered
        if (id.startsWith("slot_")) {
            const slotIdx = parseInt(id.replace("slot_", ""), 10);
            const slotLm = slots[slotIdx];
            if (slotLm) {
                setActiveDragItem(slotLm);
            }
        }
    }, [displayPool, slots]);

    // Handle drag over (for visual feedback)
    const handleDragOver = useCallback((_event: DragOverEvent) => {
        // Visual feedback handled by useSortable's isOver
    }, []);

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
                    // Remove if already placed elsewhere
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

    // Tap-to-place: places in the first empty slot
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
        <div className="max-w-6xl mx-auto py-6 px-4 space-y-6 animate-fadeInUp">
            {/* ── Header ── */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Icon name="memory" size={14} />
                    <span>Phase 4: Landmark Recall & Sequencing</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Which Landmarks Did You See?
                </h2>
                <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Select <span className="text-cyan-400 font-semibold">{TARGET_COUNT} landmarks</span> from the route and arrange them in the
                    order you encountered them — from <span className="text-white font-medium">Gate 1 (Point A)</span> to <span className="text-white font-medium">Sports Plaza (Point B)</span>.
                </p>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {/* ── Sequence Slots (Drop Zone) ── */}
                <Card className="p-5 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                                <Icon name="timeline" size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">
                                    Route Sequence
                                </h3>
                                <span className="text-[11px] text-slate-500">
                                    Gate 1 → Sports Plaza (drag to reorder)
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {filledCount > 0 && (
                                <button
                                    type="button"
                                    onClick={handleClearAll}
                                    className="text-[11px] text-slate-500 hover:text-rose-400 font-medium cursor-pointer transition-colors px-2 py-1 rounded-lg hover:bg-rose-500/10"
                                >
                                    Clear all
                                </button>
                            )}
                            <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border ${
                                isComplete
                                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                    : "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
                            }`}>
                                {filledCount} / {TARGET_COUNT}
                            </span>
                        </div>
                    </div>

                    <SortableContext items={slotIds} strategy={horizontalListSortingStrategy}>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {slots.map((landmark, idx) => (
                                <SortableSlot
                                    key={`slot_${idx}`}
                                    id={`slot_${idx}`}
                                    slotIndex={idx}
                                    landmark={landmark}
                                    onRemove={() => handleRemoveSlot(idx)}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    {/* Flow arrow indicators between slots */}
                    <div className="hidden sm:flex items-center justify-center gap-1 pt-1">
                        {Array.from({ length: TARGET_COUNT }).map((_, idx) => (
                            <div key={idx} className="flex items-center">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                    slots[idx]
                                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                                        : "bg-slate-800 text-slate-600 border border-slate-700"
                                }`}>
                                    {idx + 1}
                                </div>
                                {idx < TARGET_COUNT - 1 && (
                                    <span className="text-slate-700 text-xs mx-0.5">→</span>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>

                {/* ── Available Landmarks Pool ── */}
                <Card className="p-5 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                                <Icon name="assess" size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">
                                    Landmark Pool
                                </h3>
                                <span className="text-[11px] text-slate-500">
                                    {displayPool.length} photos — includes real landmarks and distractors
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {displayPool.map((lm) => (
                            <PoolLandmarkCard
                                key={lm.id}
                                landmark={lm}
                                isSelected={selectedIds.includes(lm.id)}
                                onTap={() => handleTapLandmark(lm)}
                            />
                        ))}
                    </div>
                </Card>

                {/* Drag Overlay (ghost card while dragging) */}
                <DragOverlay dropAnimation={{
                    duration: 200,
                    easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                }}>
                    {activeDragItem ? <DragOverlayCard landmark={activeDragItem} /> : null}
                </DragOverlay>
            </DndContext>

            {/* ── Submit Button ── */}
            <div className="text-center pt-2">
                <Button
                    variant="primary"
                    size="lg"
                    disabled={!isComplete}
                    onClick={handleSubmit}
                    className="min-w-[280px] shadow-xl shadow-cyan-500/20 text-base font-semibold"
                >
                    {isComplete
                        ? "Submit Route Sequence →"
                        : `Place ${TARGET_COUNT - filledCount} more landmark${TARGET_COUNT - filledCount !== 1 ? "s" : ""} to continue`}
                </Button>
            </div>
        </div>
    );
}
