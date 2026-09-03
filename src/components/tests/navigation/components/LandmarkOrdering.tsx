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
            className={`p-2.5 rounded-xl border transition-all duration-150 flex flex-col items-center text-center space-y-2 select-none touch-none ${
                isSelected
                    ? "bg-slate-900/40 border-slate-800 text-slate-500"
                    : "bg-slate-800/90 hover:bg-slate-700/90 border-slate-700 hover:border-cyan-500/50 text-slate-200 shadow-md hover:scale-[1.02]"
            }`}
        >
            <div className="w-full h-20 rounded-lg overflow-hidden bg-slate-950/80 flex items-center justify-center border border-slate-800">
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
            <span className="text-xs font-semibold line-clamp-2">{landmark.name}</span>
            <span className="text-[10px] text-cyan-400/80 font-mono">
                {isSelected ? "Placed" : "Tap / Drag to place"}
            </span>
        </div>
    );
}

// Droppable Slot Component
function LandmarkSlot({
    slotIndex,
    landmark,
    onRemove,
}: {
    slotIndex: number;
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
            className={`min-h-[140px] p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-between text-center relative ${
                isOver
                    ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20"
                    : landmark
                    ? "border-cyan-500/40 bg-slate-900/90"
                    : "border-dashed border-slate-700/80 bg-slate-950/50 hover:border-slate-600"
            }`}
        >
            {/* Slot Order Badge */}
            <div className="w-full flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center justify-center">
                    {slotIndex + 1}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                    {slotIndex === 0 ? "1st Landmark" : slotIndex === 4 ? "5th (Final)" : `Step ${slotIndex + 1}`}
                </span>
            </div>

            {landmark ? (
                <div className="w-full space-y-1.5 pt-1">
                    <div className="w-full h-14 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
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
                    <span className="text-xs font-semibold text-white block truncate">
                        {landmark.name}
                    </span>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer underline"
                    >
                        Remove ✕
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center my-auto text-slate-500 space-y-1">
                    <span className="text-xs font-medium">Empty Slot</span>
                    <span className="text-[10px] text-slate-600">Drop or tap landmark</span>
                </div>
            )}
        </div>
    );
}

export function LandmarkOrdering({ landmarks, onComplete }: LandmarkOrderingProps) {
    // 10 shuffled items
    const shuffledLandmarks = useMemo(() => {
        return [...landmarks].sort(() => Math.random() - 0.5);
    }, [landmarks]);

    // 5 ordered slots (null = empty)
    const [slots, setSlots] = useState<(LandmarkItem | null)[]>([null, null, null, null, null]);

    // Sensor config for mouse and mobile touch
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
    );

    // Ground truth real landmarks sorted in chronological order (1 to 5)
    const realLandmarksInOrder = useMemo(() => {
        return landmarks
            .filter((lm) => lm.isReal && lm.chronologicalOrder > 0)
            .sort((a, b) => a.chronologicalOrder - b.chronologicalOrder);
    }, [landmarks]);

    const selectedIds = useMemo(() => {
        return slots.filter((lm): lm is LandmarkItem => lm !== null).map((lm) => lm.id);
    }, [slots]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const landmark = active.data.current?.landmark as LandmarkItem | undefined;
        const slotIndex = over.data.current?.slotIndex as number | undefined;

        if (landmark && slotIndex !== undefined && slotIndex >= 0 && slotIndex < 5) {
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

    // Tap-to-place (for accessible mobile interaction)
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
        const recognitionAccuracy = realCount / 5;
        const falseLandmarkCount = 5 - realCount;

        // Sequence accuracy: correct item in correct slot index
        let correctPositions = 0;
        for (let i = 0; i < 5; i++) {
            if (orderedPlaced[i]?.id === correctOrderIds[i]) {
                correctPositions++;
            }
        }
        const sequenceAccuracy = correctPositions / 5;

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
        <div className="max-w-4xl mx-auto py-6 px-4 space-y-8 animate-fadeInUp">
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
                    Select the 5 real landmarks seen on the forward route (A → H) and place them in the exact order they appeared.
                </p>
            </div>

            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                {/* 5 Ordered Drop Slots (A → H) */}
                <Card className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <Icon name="timeline" size={18} className="text-cyan-400" />
                            <h3 className="text-base font-bold text-white">
                                Route Chronology Order (Start Point A → Destination Point H)
                            </h3>
                        </div>
                        <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                            {selectedIds.length} / 5 Selected
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                        {slots.map((landmark, idx) => (
                            <LandmarkSlot
                                key={idx}
                                slotIndex={idx}
                                landmark={landmark}
                                onRemove={() => handleRemoveSlot(idx)}
                            />
                        ))}
                    </div>
                </Card>

                {/* Available Landmark Cards (10 cards: 5 real, 5 distractors) */}
                <Card className="p-6 bg-slate-900/80 border border-slate-800 rounded-3xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <Icon name="assess" size={18} className="text-cyan-400" />
                            <h3 className="text-base font-bold text-white">Available Landmarks Pool</h3>
                        </div>
                        <span className="text-xs text-slate-400">10 options (5 real + 5 distractors)</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
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
                    {isComplete ? "Submit Route Sequence →" : `Place all 5 landmarks to continue (${selectedIds.length}/5)`}
                </Button>
            </div>
        </div>
    );
}
