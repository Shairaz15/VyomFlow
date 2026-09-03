import type { MapGraph, LandmarkRecallQuestion, NavigationDifficulty } from "../../types/navigationTypes";

export interface LandmarkInfo {
    label: string;
    emoji: string;
}

export const INDIAN_LANDMARKS: LandmarkInfo[] = [
    { label: "Home", emoji: "🏠" },
    { label: "School", emoji: "🏫" },
    { label: "Hospital", emoji: "🏥" },
    { label: "Temple", emoji: "🛕" },
    { label: "Bus Stop", emoji: "🚏" },
    { label: "Market", emoji: "🛒" },
    { label: "Pharmacy", emoji: "💊" },
    { label: "Park", emoji: "🌳" },
    { label: "Railway Station", emoji: "🚉" },
    { label: "Bank", emoji: "🏦" },
    { label: "Library", emoji: "📚" },
    { label: "Post Office", emoji: "📮" },
];

/**
 * Curated Pre-built Map Graphs
 * Multi-path networks with asymmetric, non-linear topologies (400 x 400 SVG canvas coordinate system).
 */
export const NAVIGATION_MAPS: MapGraph[] = [
    // ==========================================
    // LEVEL 1: 6 Intersections, 2 Parallel Valid Routes, 15s
    // ==========================================
    {
        id: "l1_map1",
        name: "Connaught Cross",
        difficulty: 1,
        encodingTimeSeconds: 15,
        nodes: [
            { id: "n1", label: "Home", emoji: "🏠", x: 60, y: 320, isStart: true },
            { id: "n2", label: "Bus Stop", emoji: "🚏", x: 120, y: 200, landmark: "Bus Stop" },
            { id: "n3", label: "Junction A", emoji: "🔀", x: 220, y: 310 },
            { id: "n4", label: "Market", emoji: "🛒", x: 280, y: 160, landmark: "Market" },
            { id: "n5", label: "School", emoji: "🏫", x: 350, y: 60, isDestination: true },
            { id: "n6", label: "Park", emoji: "🌳", x: 190, y: 90, landmark: "Park" },
        ],
        edges: [
            // Route 1 (via n2, n3, n4)
            { from: "n1", to: "n2", weight: 1, direction: "north" },
            { from: "n2", to: "n1", weight: 1, direction: "south" },
            { from: "n2", to: "n3", weight: 1, direction: "east" },
            { from: "n3", to: "n2", weight: 1, direction: "west" },
            { from: "n3", to: "n4", weight: 1, direction: "north" },
            { from: "n4", to: "n3", weight: 1, direction: "south" },
            { from: "n4", to: "n5", weight: 1, direction: "east" },
            { from: "n5", to: "n4", weight: 1, direction: "west" },
            // Alternative Route 2 (via n2, n6, n5)
            { from: "n2", to: "n6", weight: 1, direction: "east" },
            { from: "n6", to: "n2", weight: 1, direction: "west" },
            { from: "n6", to: "n5", weight: 1, direction: "east" },
            { from: "n5", to: "n6", weight: 1, direction: "west" },
        ],
        optimalPath: ["n1", "n2", "n6", "n5"],
    },

    // ==========================================
    // LEVEL 2: 8 Intersections, 3 Alternative Valid Routes, 12s
    // ==========================================
    {
        id: "l2_map1",
        name: "Indiranagar Avenue",
        difficulty: 2,
        encodingTimeSeconds: 12,
        nodes: [
            { id: "n1", label: "Home", emoji: "🏠", x: 50, y: 340, isStart: true },
            { id: "n2", label: "Bank", emoji: "🏦", x: 110, y: 230, landmark: "Bank" },
            { id: "n3", label: "Post Office", emoji: "📮", x: 60, y: 100, landmark: "Post Office" },
            { id: "n4", label: "Junction A", emoji: "🔀", x: 210, y: 270 },
            { id: "n5", label: "Hospital", emoji: "🏥", x: 240, y: 140, landmark: "Hospital" },
            { id: "n6", label: "Junction B", emoji: "🔀", x: 330, y: 270 },
            { id: "n7", label: "Library", emoji: "📚", x: 340, y: 360, landmark: "Library" },
            { id: "n8", label: "Railway Station", emoji: "🚉", x: 350, y: 50, isDestination: true },
        ],
        edges: [
            // Route 1 (n1 -> n2 -> n4 -> n5 -> n8)
            { from: "n1", to: "n2", weight: 1, direction: "north" },
            { from: "n2", to: "n1", weight: 1, direction: "south" },
            { from: "n2", to: "n3", weight: 1, direction: "north" },
            { from: "n3", to: "n2", weight: 1, direction: "south" },
            { from: "n2", to: "n4", weight: 1, direction: "east" },
            { from: "n4", to: "n2", weight: 1, direction: "west" },
            { from: "n4", to: "n5", weight: 1, direction: "north" },
            { from: "n5", to: "n4", weight: 1, direction: "south" },
            { from: "n5", to: "n8", weight: 1, direction: "east" },
            { from: "n8", to: "n5", weight: 1, direction: "west" },
            // Route 2 (n1 -> n2 -> n4 -> n6 -> n8)
            { from: "n4", to: "n6", weight: 1, direction: "east" },
            { from: "n6", to: "n4", weight: 1, direction: "west" },
            { from: "n6", to: "n8", weight: 1, direction: "north" },
            { from: "n8", to: "n6", weight: 1, direction: "south" },
            { from: "n6", to: "n7", weight: 1, direction: "south" },
            { from: "n7", to: "n6", weight: 1, direction: "north" },
            // Route 3 (n3 -> n5 bypass connection)
            { from: "n3", to: "n5", weight: 1, direction: "east" },
            { from: "n5", to: "n3", weight: 1, direction: "west" },
        ],
        optimalPath: ["n1", "n2", "n3", "n5", "n8"],
    },

    // ==========================================
    // LEVEL 3: 10 Intersections, Multi-Branch Web, 10s
    // ==========================================
    {
        id: "l3_map1",
        name: "Bandra Promenade",
        difficulty: 3,
        encodingTimeSeconds: 10,
        nodes: [
            { id: "n1", label: "Home", emoji: "🏠", x: 50, y: 350, isStart: true },
            { id: "n2", label: "Junction 1", emoji: "🔀", x: 110, y: 260 },
            { id: "n3", label: "Pharmacy", emoji: "💊", x: 50, y: 120, landmark: "Pharmacy" },
            { id: "n4", label: "Market", emoji: "🛒", x: 190, y: 200, landmark: "Market" },
            { id: "n5", label: "School", emoji: "🏫", x: 160, y: 70, landmark: "School" },
            { id: "n6", label: "Junction 2", emoji: "🔀", x: 290, y: 240 },
            { id: "n7", label: "Park", emoji: "🌳", x: 250, y: 350, landmark: "Park" },
            { id: "n8", label: "Temple", emoji: "🛕", x: 280, y: 110, landmark: "Temple" },
            { id: "n9", label: "Junction 3", emoji: "🔀", x: 360, y: 150 },
            { id: "n10", label: "Hospital", emoji: "🏥", x: 350, y: 290, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "north" },
            { from: "n2", to: "n1", weight: 1, direction: "south" },
            { from: "n2", to: "n3", weight: 1, direction: "north" },
            { from: "n3", to: "n2", weight: 1, direction: "south" },
            { from: "n2", to: "n4", weight: 1, direction: "east" },
            { from: "n4", to: "n2", weight: 1, direction: "west" },
            { from: "n4", to: "n5", weight: 1, direction: "north" },
            { from: "n5", to: "n4", weight: 1, direction: "south" },
            { from: "n3", to: "n5", weight: 1, direction: "east" },
            { from: "n5", to: "n3", weight: 1, direction: "west" },
            { from: "n4", to: "n6", weight: 1, direction: "east" },
            { from: "n6", to: "n4", weight: 1, direction: "west" },
            { from: "n5", to: "n8", weight: 1, direction: "east" },
            { from: "n8", to: "n5", weight: 1, direction: "west" },
            { from: "n6", to: "n7", weight: 1, direction: "south" },
            { from: "n7", to: "n6", weight: 1, direction: "north" },
            { from: "n6", to: "n8", weight: 1, direction: "north" },
            { from: "n8", to: "n6", weight: 1, direction: "south" },
            { from: "n8", to: "n9", weight: 1, direction: "east" },
            { from: "n9", to: "n8", weight: 1, direction: "west" },
            { from: "n9", to: "n10", weight: 1, direction: "south" },
            { from: "n10", to: "n9", weight: 1, direction: "north" },
            { from: "n6", to: "n10", weight: 1, direction: "east" },
            { from: "n10", to: "n6", weight: 1, direction: "west" },
        ],
        optimalPath: ["n1", "n2", "n4", "n6", "n10"],
    },

    // ==========================================
    // LEVEL 4: 12 Intersections, Complex Multi-Route Mesh, 8s
    // ==========================================
    {
        id: "l4_map1",
        name: "Cyber City Grid",
        difficulty: 4,
        encodingTimeSeconds: 8,
        nodes: [
            { id: "n1", label: "Home", emoji: "🏠", x: 40, y: 350, isStart: true },
            { id: "n2", label: "Bank", emoji: "🏦", x: 90, y: 240, landmark: "Bank" },
            { id: "n3", label: "Post Office", emoji: "📮", x: 40, y: 100, landmark: "Post Office" },
            { id: "n4", label: "Junction A", emoji: "🔀", x: 180, y: 220 },
            { id: "n5", label: "Pharmacy", emoji: "💊", x: 140, y: 90, landmark: "Pharmacy" },
            { id: "n6", label: "Library", emoji: "📚", x: 170, y: 340, landmark: "Library" },
            { id: "n7", label: "Junction B", emoji: "🔀", x: 270, y: 240 },
            { id: "n8", label: "Market", emoji: "🛒", x: 260, y: 100, landmark: "Market" },
            { id: "n9", label: "Park", emoji: "🌳", x: 280, y: 350, landmark: "Park" },
            { id: "n10", label: "Junction C", emoji: "🔀", x: 350, y: 210 },
            { id: "n11", label: "Bus Stop", emoji: "🚏", x: 370, y: 340 },
            { id: "n12", label: "Railway Station", emoji: "🚉", x: 360, y: 60, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "north" },
            { from: "n2", to: "n1", weight: 1, direction: "south" },
            { from: "n2", to: "n3", weight: 1, direction: "north" },
            { from: "n3", to: "n2", weight: 1, direction: "south" },
            { from: "n2", to: "n4", weight: 1, direction: "east" },
            { from: "n4", to: "n2", weight: 1, direction: "west" },
            { from: "n4", to: "n5", weight: 1, direction: "north" },
            { from: "n5", to: "n4", weight: 1, direction: "south" },
            { from: "n4", to: "n6", weight: 1, direction: "south" },
            { from: "n6", to: "n4", weight: 1, direction: "north" },
            { from: "n4", to: "n7", weight: 1, direction: "east" },
            { from: "n7", to: "n4", weight: 1, direction: "west" },
            { from: "n5", to: "n8", weight: 1, direction: "east" },
            { from: "n8", to: "n5", weight: 1, direction: "west" },
            { from: "n7", to: "n8", weight: 1, direction: "north" },
            { from: "n8", to: "n7", weight: 1, direction: "south" },
            { from: "n7", to: "n9", weight: 1, direction: "south" },
            { from: "n9", to: "n7", weight: 1, direction: "north" },
            { from: "n7", to: "n10", weight: 1, direction: "east" },
            { from: "n10", to: "n7", weight: 1, direction: "west" },
            { from: "n8", to: "n12", weight: 1, direction: "east" },
            { from: "n12", to: "n8", weight: 1, direction: "west" },
            { from: "n10", to: "n12", weight: 1, direction: "north" },
            { from: "n12", to: "n10", weight: 1, direction: "south" },
            { from: "n10", to: "n11", weight: 1, direction: "south" },
            { from: "n11", to: "n10", weight: 1, direction: "north" },
        ],
        optimalPath: ["n1", "n2", "n4", "n5", "n8", "n12"],
    },
];

/**
 * Get map for a specified difficulty level with landmark randomization.
 */
export function getMapByDifficulty(difficulty: NavigationDifficulty): MapGraph {
    const matchingMaps = NAVIGATION_MAPS.filter((m) => m.difficulty === difficulty);
    const baseMap = matchingMaps.length > 0 ? matchingMaps[0] : NAVIGATION_MAPS[0];

    // Clone base map to apply session randomization
    const clonedNodes = baseMap.nodes.map((n) => ({ ...n }));
    const clonedEdges = baseMap.edges.map((e) => ({ ...e }));

    // Shuffle Indian landmarks array
    const shuffledLandmarks = [...INDIAN_LANDMARKS].sort(() => Math.random() - 0.5);
    let landmarkIdx = 0;

    for (const node of clonedNodes) {
        if (node.isStart) {
            const startLandmark = shuffledLandmarks[landmarkIdx++];
            node.label = startLandmark.label;
            node.emoji = startLandmark.emoji;
        } else if (node.isDestination) {
            const destLandmark = shuffledLandmarks[landmarkIdx++];
            node.label = destLandmark.label;
            node.emoji = destLandmark.emoji;
        } else if (node.landmark) {
            const lm = shuffledLandmarks[landmarkIdx++];
            if (lm) {
                node.label = lm.label;
                node.emoji = lm.emoji;
                node.landmark = lm.label;
            }
        }
    }

    return {
        ...baseMap,
        nodes: clonedNodes,
        edges: clonedEdges,
    };
}

/**
 * Generate 3 multiple choice recall questions for a given map graph.
 */
export function generateLandmarkQuestions(map: MapGraph): LandmarkRecallQuestion[] {
    const questions: LandmarkRecallQuestion[] = [];
    const landmarkNodes = map.nodes.filter((n) => n.landmark || n.isStart || n.isDestination);
    const landmarkLabels = INDIAN_LANDMARKS.map((l) => `${l.emoji} ${l.label}`);

    // Question 1: Start Location
    const startNode = map.nodes.find((n) => n.isStart);
    if (startNode) {
        const correct = `${startNode.emoji} ${startNode.label}`;
        const distractors = landmarkLabels.filter((l) => l !== correct).slice(0, 3);
        const options = [...distractors, correct].sort(() => Math.random() - 0.5);
        questions.push({
            id: "q1_start",
            questionText: "What was your starting location on the map?",
            options,
            correctAnswer: correct,
        });
    }

    // Question 2: Destination Location
    const destNode = map.nodes.find((n) => n.isDestination);
    if (destNode) {
        const correct = `${destNode.emoji} ${destNode.label}`;
        const distractors = landmarkLabels.filter((l) => l !== correct && l !== questions[0]?.correctAnswer).slice(0, 3);
        const options = [...distractors, correct].sort(() => Math.random() - 0.5);
        questions.push({
            id: "q2_destination",
            questionText: "What was your target destination?",
            options,
            correctAnswer: correct,
        });
    }

    // Question 3: Intermediate Landmark on Optimal Route
    const intermediateNodes = map.nodes.filter(
        (n) => map.optimalPath.includes(n.id) && !n.isStart && !n.isDestination
    );
    if (intermediateNodes.length > 0) {
        const node = intermediateNodes[0];
        const correct = `${node.emoji} ${node.label}`;
        const distractors = landmarkLabels.filter((l) => !optionsContain(questions, l) && l !== correct).slice(0, 3);
        const options = [...distractors, correct].sort(() => Math.random() - 0.5);
        questions.push({
            id: "q3_landmark",
            questionText: `Which landmark did you pass on your way to the destination?`,
            options,
            correctAnswer: correct,
        });
    } else if (landmarkNodes.length >= 3) {
        const node = landmarkNodes[1];
        const correct = `${node.emoji} ${node.label}`;
        const distractors = landmarkLabels.filter((l) => l !== correct).slice(0, 3);
        const options = [...distractors, correct].sort(() => Math.random() - 0.5);
        questions.push({
            id: "q3_landmark",
            questionText: `Which landmark was present on the map?`,
            options,
            correctAnswer: correct,
        });
    }

    return questions.slice(0, 3);
}

function optionsContain(questions: LandmarkRecallQuestion[], label: string): boolean {
    return questions.some((q) => q.correctAnswer === label);
}
