import { useState, useMemo } from "react";
import type { CSSProperties } from "react";
import {
    DndContext,
    useDraggable,
    useDroppable,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { Button, Card, Icon } from "../../../common";
import type { LandmarkItem, LandmarkOrderingResult } from "../../../../types/navigationTypes";

interface LandmarkOrderingProps {
    landmarks: LandmarkItem[];
    onComplete: (result: LandmarkOrderingResult) => void;
}

// Draggable Landmark Card Component
function DraggableLandmarkCard({
    landmark,
    isSelected,
    onTap,
}: {
    landmark: LandmarkItem;
    isSelected: boolean;
    onTap: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: landmark.id,
        disabled: isSelected,
        data: { landmark },
    });

    const [imgError, setImgError] = useState<boolean>(false);

    const style: CSSProperties = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.4 : isSelected ? 0.35 : 1,
        cursor: isSelected ? "default" : "grab",
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={onTap}
            className={`p-2 rounded-xl border transition-all duration-150 flex flex-col items-center text-center space-y-1.5 select-none touch-none ${
                isSelected
                    ? "bg-slate-900/40 border-slate-800 text-slate-500 cursor-default"
                    : "bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 hover:border-cyan-500/50 text-slate-200 shadow-md hover:scale-[1.02] cursor-pointer"
            }`}
        >
            <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-950/80 flex items-center justify-center border border-slate-800 relative">
                {!imgError && landmark.imageUrl ? (
                    <img
                        src={landmark.imageUrl}
                        alt={landmark.name}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center p-2 text-cyan-400/60 space-y-1">
                        <Icon name="memory" size={24} />
                        <span className="text-[10px] text-slate-400 font-medium">Landmark</span>
                    </div>
                )}
            </div>
            <span className="text-[11px] font-semibold line-clamp-2 leading-tight min-h-[28px]">
                {landmark.name}
            </span>
            <span className="text-[9px] text-cyan-400/80 font-mono">
                {isSelected ? "Placed ✓" : "Tap / Drag"}
            </span>
        </div>
    );
}

// Droppable Slot Component
function LandmarkSlot({
    slotIndex,
    totalSlots,
    landmark,
    onRemove,
}: {
    slotIndex: number;
    totalSlots: number;
    landmark: LandmarkItem | null;
    onRemove: () => void;
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: `slot_${slotIndex}`,
        data: { slotIndex },
    });

    const [imgError, setImgError] = useState<boolean>(false);

    return (
        <div
            ref={setNodeRef}
            className={`min-h-[140px] p-2.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-between text-center relative ${
                isOver
                    ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20"
                    : landmark
                    ? "border-cyan-500/40 bg-slate-900/90"
                    : "border-dashed border-slate-700/80 bg-slate-950/50 hover:border-slate-600"
            }`}
        >
            {/* Slot Order Badge */}
            <div className="w-full flex items-center justify-between">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold flex items-center justify-center">
                    {slotIndex + 1}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                    {slotIndex === 0 ? "Start (A)" : slotIndex === totalSlots - 1 ? "End (B)" : `Step ${slotIndex + 1}`}
                </span>
            </div>

            {landmark ? (
                <div className="w-full space-y-1 pt-1">
                    <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                        {!imgError && landmark.imageUrl ? (
                            <img
                                src={landmark.imageUrl}
                                alt={landmark.name}
                                onError={() => setImgError(true)}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Icon name="memory" size={20} className="text-cyan-400" />
                        )}
                    </div>
                    <span className="text-[11px] font-semibold text-white block truncate">
                        {landmark.name}
                    </span>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer underline"
                    >
                        Remove ✕
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center my-auto text-slate-500 space-y-1">
                    <span className="text-[11px] font-medium">Empty</span>
                    <span className="text-[9px] text-slate-600">Drop / tap landmark</span>
                </div>
            )}
        </div>
    );
}

export function LandmarkOrdering({ landmarks, onComplete }: LandmarkOrderingProps) {
    // Ground truth real landmarks sorted in chronological order (1 to N)
    const realLandmarksInOrder = useMemo(() => {
        return landmarks
            .filter((lm) => lm.isReal && lm.chronologicalOrder > 0)
            .sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);
    }, [landmarks]);

    const targetCount = realLandmarksInOrder.length || 8;

    // Shuffled pool of all 21 items
    const shuffledLandmarks = useMemo(() => {
        return [...landmarks].sort(() => Math.random() - 0.5);
    }, [landmarks]);

    // Ordered slots (null = empty)
    const [slots, setSlots] = useState<(LandmarkItem | null)[]>(() =>
        new Array(targetCount).fill(null)
    );

    // Sensor config for mouse and mobile touch
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
    );

    const selectedIds = useMemo(() => {
        return slots.filter((lm): lm is LandmarkItem => lm !== null).map((lm) => lm.id);
    }, [slots]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const landmark = active.data.current?.landmark as LandmarkItem | undefined;
        const slotIndex = over.data.current?.slotIndex as number | undefined;

        if (landmark && slotIndex !== undefined && slotIndex >= 0 && slotIndex < targetCount) {
            setSlots((prev) => {
                const next = [...prev];
                // If landmark already in another slot, remove it from that slot
                const existingIdx = next.findIndex((item) => item?.id === landmark.id);
                if (existingIdx !== -1) {
                    next[existingIdx] = null;
                }
                next[slotIndex] = landmark;
                return next;
            });
        }
    };

    // Tap-to-place (for accessible quick interaction)
    const handleTapLandmark = (landmark: LandmarkItem) => {
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
    };

    const handleRemoveSlot = (slotIndex: number) => {
        setSlots((prev) => {
            const next = [...prev];
            next[slotIndex] = null;
            return next;
        });
    };

    const isComplete = slots.every((lm) => lm !== null);

    const handleSubmit = () => {
        if (!isComplete) return;

        const orderedPlaced = slots as LandmarkItem[];
        const orderedLandmarkIds = orderedPlaced.map((lm) => lm.id);
        const correctOrderIds = realLandmarksInOrder.map((lm) => lm.id);

        const realCount = orderedPlaced.filter((lm) => lm.isReal).length;
        const recognitionAccuracy = realCount / targetCount;
        const falseLandmarkCount = targetCount - realCount;

        // Sequence accuracy: correct item in correct slot index
        let correctPositions = 0;
        for (let i = 0; i < targetCount; i++) {
            if (orderedPlaced[i]?.id === correctOrderIds[i]) {
                correctPositions++;
            }
        }
        const sequenceAccuracy = correctPositions / targetCount;

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
        <div className="max-w-5xl mx-auto py-6 px-4 space-y-8 animate-fadeInUp">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Icon name="memory" size={14} />
                    <span>Phase 4: Visuospatial Chronology Task</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Order the Landmarks You Encountered
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                    Select the {targetCount} real landmarks seen on the forward route (A → B) and place them in the exact order they appeared from Main Gate 1 to the Sports Plaza.
                </p>
            </div>

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                {/* Ordered Drop Slots (A → B) */}
                <Card className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <Icon name="timeline" size={18} className="text-cyan-400" />
                            <h3 className="text-sm sm:text-base font-bold text-white">
                                Route Chronology Order (Gate 1 Point A → Sports Plaza Point B)
                            </h3>
                        </div>
                        <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                            {selectedIds.length} / {targetCount} Placed
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2">
                        {slots.map((landmark, idx) => (
                            <LandmarkSlot
                                key={idx}
                                slotIndex={idx}
                                totalSlots={targetCount}
                                landmark={landmark}
                                onRemove={() => handleRemoveSlot(idx)}
                            />
                        ))}
                    </div>
                </Card>

                {/* Available Landmark Cards (21 cards: real landmarks + distractors/lures) */}
                <Card className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <Icon name="assess" size={18} className="text-cyan-400" />
                            <h3 className="text-sm sm:text-base font-bold text-white">
                                Available Landmarks Pool ({landmarks.length} Photos)
                            </h3>
                        </div>
                        <span className="text-xs text-slate-400">
                            Includes actual route landmarks and distractor lures
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
                        {shuffledLandmarks.map((lm) => (
                            <DraggableLandmarkCard
                                key={lm.id}
                                landmark={lm}
                                isSelected={selectedIds.includes(lm.id)}
                                onTap={() => handleTapLandmark(lm)}
                            />
                        ))}
                    </div>
                </Card>
            </DndContext>

            {/* Submission CTA */}
            <div className="text-center pt-2">
                <Button
                    variant="primary"
                    size="lg"
                    disabled={!isComplete}
                    onClick={handleSubmit}
                    className="min-w-[260px] shadow-xl shadow-cyan-500/20 text-base font-semibold"
                >
                    {isComplete
                        ? "Submit Route Sequence →"
                        : `Place all ${targetCount} landmarks to continue (${selectedIds.length}/${targetCount})`}
                </Button>
            </div>
        </div>
    );
}
