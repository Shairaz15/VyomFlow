import type { MapGraph, NavigationDifficulty, LandmarkRecallQuestion } from "../../types/navigationTypes";

export interface LandmarkInfo {
    id: string;
    label: string;
    emoji: string;
}

export const FICTIONAL_LANDMARKS: LandmarkInfo[] = [
    { id: "school", label: "Oakwood Academy", emoji: "🏫" },
    { id: "hospital", label: "St. Jude Medical Center", emoji: "🏥" },
    { id: "temple", label: "Serenity Shrine", emoji: "🛕" },
    { id: "market", label: "Grand Horizon Market", emoji: "🛒" },
    { id: "bus_stop", label: "Metro Transit Hub", emoji: "🚏" },
    { id: "library", label: "City Central Library", emoji: "📚" },
    { id: "park", label: "Verdant Community Park", emoji: "🌳" },
    { id: "pharmacy", label: "Crestview Pharmacy", emoji: "💊" },
    { id: "bank", label: "First Horizon Bank", emoji: "🏦" },
    { id: "railway", label: "Union Central Station", emoji: "🚉" },
    { id: "post_office", label: "Postal Depot", emoji: "📮" },
    { id: "bakery", label: "Sunbake Bakery", emoji: "🥐" },
];

/** Base coordinate anchor for fictional map canvas layout (Bangalore center offset coordinates for vector tile alignment) */
const BASE_LNG = 77.5946;
const BASE_LAT = 12.9716;
const STEP = 0.0015; // Geographic coordinate offset per grid unit (~150m)

/**
 * 16 Curated Fictional Neighborhood Maps
 * 4 Maps per Difficulty Level (Level 1, Level 2, Level 3, Level 4)
 */
export const CURATED_MAPS: MapGraph[] = [
    // ==========================================
    // LEVEL 1: FICTIONAL NEIGHBORHOODS (15s Encoding)
    // ==========================================
    {
        id: "l1_map1",
        name: "Maplewood Quarter",
        difficulty: 1,
        gridDimensions: { cols: 5, rows: 5 },
        center: [BASE_LNG, BASE_LAT],
        encodingTimeSeconds: 15,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 1, y: 5, lat: BASE_LAT - 2 * STEP, lng: BASE_LNG - 2 * STEP, gridCol: 1, gridRow: 5, isStart: true },
            { id: "n2", label: "St. Jude Medical Center", emoji: "🏥", landmark: "St. Jude Medical Center", x: 1, y: 3, lat: BASE_LAT, lng: BASE_LNG - 2 * STEP, gridCol: 1, gridRow: 3 },
            { id: "n3", label: "Sunbake Bakery", emoji: "🥐", landmark: "Sunbake Bakery", x: 3, y: 5, lat: BASE_LAT - 2 * STEP, lng: BASE_LNG, gridCol: 3, gridRow: 5 },
            { id: "n4", label: "Grand Horizon Market", emoji: "🛒", landmark: "Grand Horizon Market", x: 3, y: 3, lat: BASE_LAT, lng: BASE_LNG, gridCol: 3, gridRow: 3 },
            { id: "n5", label: "Crestview Pharmacy", emoji: "💊", landmark: "Crestview Pharmacy", x: 3, y: 1, lat: BASE_LAT + 2 * STEP, lng: BASE_LNG, gridCol: 3, gridRow: 1 },
            { id: "n6", label: "Destination", emoji: "🏁", x: 5, y: 1, lat: BASE_LAT + 2 * STEP, lng: BASE_LNG + 2 * STEP, gridCol: 5, gridRow: 1, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "north", streetName: "Astra Way" },
            { from: "n2", to: "n1", weight: 1, direction: "south", streetName: "Astra Way" },
            { from: "n2", to: "n4", weight: 1, direction: "east", streetName: "Beacon Street" },
            { from: "n4", to: "n2", weight: 1, direction: "west", streetName: "Beacon Street" },
            { from: "n4", to: "n5", weight: 1, direction: "north", streetName: "Cedar Lane" },
            { from: "n5", to: "n4", weight: 1, direction: "south", streetName: "Cedar Lane" },
            { from: "n5", to: "n6", weight: 1, direction: "east", streetName: "Horizon Boulevard" },
            { from: "n6", to: "n5", weight: 1, direction: "west", streetName: "Horizon Boulevard" },
            // Alternative branch
            { from: "n1", to: "n3", weight: 1, direction: "east", streetName: "Solstice Alley" },
            { from: "n3", to: "n1", weight: 1, direction: "west", streetName: "Solstice Alley" },
            { from: "n3", to: "n4", weight: 1, direction: "north", streetName: "Meadow View" },
            { from: "n4", to: "n3", weight: 1, direction: "south", streetName: "Meadow View" },
        ],
        optimalPath: ["n1", "n2", "n4", "n5", "n6"],
        patternSequence: ["north", "east", "north", "east"],
    },
    {
        id: "l1_map2",
        name: "Willow Creek Precinct",
        difficulty: 1,
        gridDimensions: { cols: 5, rows: 5 },
        center: [BASE_LNG + 0.005, BASE_LAT + 0.005],
        encodingTimeSeconds: 15,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 1, y: 1, lat: BASE_LAT + 2 * STEP, lng: BASE_LNG - 2 * STEP, gridCol: 1, gridRow: 1, isStart: true },
            { id: "n2", label: "City Central Library", emoji: "📚", landmark: "City Central Library", x: 3, y: 1, lat: BASE_LAT + 2 * STEP, lng: BASE_LNG, gridCol: 3, gridRow: 1 },
            { id: "n3", label: "Oakwood Academy", emoji: "🏫", landmark: "Oakwood Academy", x: 3, y: 3, lat: BASE_LAT, lng: BASE_LNG, gridCol: 3, gridRow: 3 },
            { id: "n4", label: "Verdant Community Park", emoji: "🌳", landmark: "Verdant Community Park", x: 5, y: 3, lat: BASE_LAT, lng: BASE_LNG + 2 * STEP, gridCol: 5, gridRow: 3 },
            { id: "n5", label: "Destination", emoji: "🏁", x: 5, y: 5, lat: BASE_LAT - 2 * STEP, lng: BASE_LNG + 2 * STEP, gridCol: 5, gridRow: 5, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "east", streetName: "Pinecrest Avenue" },
            { from: "n2", to: "n1", weight: 1, direction: "west", streetName: "Pinecrest Avenue" },
            { from: "n2", to: "n3", weight: 1, direction: "south", streetName: "Summit Street" },
            { from: "n3", to: "n2", weight: 1, direction: "north", streetName: "Summit Street" },
            { from: "n3", to: "n4", weight: 1, direction: "east", streetName: "Orion Drive" },
            { from: "n4", to: "n3", weight: 1, direction: "west", streetName: "Orion Drive" },
            { from: "n4", to: "n5", weight: 1, direction: "south", streetName: "Verdant Way" },
            { from: "n5", to: "n4", weight: 1, direction: "north", streetName: "Verdant Way" },
        ],
        optimalPath: ["n1", "n2", "n3", "n4", "n5"],
        patternSequence: ["east", "south", "east", "south"],
    },
    {
        id: "l1_map3",
        name: "Riverbend Haven",
        difficulty: 1,
        gridDimensions: { cols: 5, rows: 5 },
        center: [BASE_LNG - 0.005, BASE_LAT - 0.005],
        encodingTimeSeconds: 15,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 5, y: 5, lat: BASE_LAT - 2 * STEP, lng: BASE_LNG + 2 * STEP, isStart: true },
            { id: "n2", label: "First Horizon Bank", emoji: "🏦", landmark: "First Horizon Bank", x: 3, y: 5, lat: BASE_LAT - 2 * STEP, lng: BASE_LNG },
            { id: "n3", label: "Metro Transit Hub", emoji: "🚏", landmark: "Metro Transit Hub", x: 3, y: 3, lat: BASE_LAT, lng: BASE_LNG },
            { id: "n4", label: "Serenity Shrine", emoji: "🛕", landmark: "Serenity Shrine", x: 1, y: 3, lat: BASE_LAT, lng: BASE_LNG - 2 * STEP },
            { id: "n5", label: "Destination", emoji: "🏁", x: 1, y: 1, lat: BASE_LAT + 2 * STEP, lng: BASE_LNG - 2 * STEP, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "west", streetName: "River Road" },
            { from: "n2", to: "n1", weight: 1, direction: "east", streetName: "River Road" },
            { from: "n2", to: "n3", weight: 1, direction: "north", streetName: "Bridge Street" },
            { from: "n3", to: "n2", weight: 1, direction: "south", streetName: "Bridge Street" },
            { from: "n3", to: "n4", weight: 1, direction: "west", streetName: "High Street" },
            { from: "n4", to: "n3", weight: 1, direction: "east", streetName: "High Street" },
            { from: "n4", to: "n5", weight: 1, direction: "north", streetName: "North Crescent" },
            { from: "n5", to: "n4", weight: 1, direction: "south", streetName: "North Crescent" },
        ],
        optimalPath: ["n1", "n2", "n3", "n4", "n5"],
        patternSequence: ["west", "north", "west", "north"],
    },
    {
        id: "l1_map4",
        name: "Crestview Heights",
        difficulty: 1,
        gridDimensions: { cols: 5, rows: 5 },
        center: [BASE_LNG, BASE_LAT],
        encodingTimeSeconds: 15,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 1, y: 5, lat: BASE_LAT - 2 * STEP, lng: BASE_LNG - 2 * STEP, isStart: true },
            { id: "n2", label: "Postal Depot", emoji: "📮", landmark: "Postal Depot", x: 3, y: 5, lat: BASE_LAT - 2 * STEP, lng: BASE_LNG },
            { id: "n3", label: "Crestview Pharmacy", emoji: "💊", landmark: "Crestview Pharmacy", x: 3, y: 3, lat: BASE_LAT, lng: BASE_LNG },
            { id: "n4", label: "Destination", emoji: "🏁", x: 3, y: 1, lat: BASE_LAT + 2 * STEP, lng: BASE_LNG, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "east", streetName: "Crestview Drive" },
            { from: "n2", to: "n1", weight: 1, direction: "west", streetName: "Crestview Drive" },
            { from: "n2", to: "n3", weight: 1, direction: "north", streetName: "Valley Road" },
            { from: "n3", to: "n2", weight: 1, direction: "south", streetName: "Valley Road" },
            { from: "n3", to: "n4", weight: 1, direction: "north", streetName: "Summit Boulevard" },
            { from: "n4", to: "n3", weight: 1, direction: "south", streetName: "Summit Boulevard" },
        ],
        optimalPath: ["n1", "n2", "n3", "n4"],
        patternSequence: ["east", "north", "north"],
    },

    // ==========================================
    // LEVEL 2: FICTIONAL NEIGHBORHOODS (12s Encoding)
    // ==========================================
    {
        id: "l2_map1",
        name: "Silverstone Sector (7x7)",
        difficulty: 2,
        gridDimensions: { cols: 7, rows: 7 },
        center: [BASE_LNG, BASE_LAT],
        encodingTimeSeconds: 12,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 1, y: 7, lat: BASE_LAT - 3 * STEP, lng: BASE_LNG - 3 * STEP, isStart: true },
            { id: "n2", label: "St. Jude Medical Center", emoji: "🏥", landmark: "St. Jude Medical Center", x: 1, y: 5, lat: BASE_LAT - STEP, lng: BASE_LNG - 3 * STEP },
            { id: "n3", label: "Dead End Alley", emoji: "🔀", x: 1, y: 2, lat: BASE_LAT + 2 * STEP, lng: BASE_LNG - 3 * STEP },
            { id: "n4", label: "Grand Horizon Market", emoji: "🛒", landmark: "Grand Horizon Market", x: 4, y: 5, lat: BASE_LAT - STEP, lng: BASE_LNG },
            { id: "n5", label: "City Central Library", emoji: "📚", landmark: "City Central Library", x: 4, y: 2, lat: BASE_LAT + 2 * STEP, lng: BASE_LNG },
            { id: "n6", label: "Oakwood Academy", emoji: "🏫", landmark: "Oakwood Academy", x: 6, y: 5, lat: BASE_LAT - STEP, lng: BASE_LNG + 2 * STEP },
            { id: "n7", label: "Union Central Station", emoji: "🚉", landmark: "Union Central Station", x: 6, y: 7, lat: BASE_LAT - 3 * STEP, lng: BASE_LNG + 2 * STEP },
            { id: "n8", label: "Destination", emoji: "🏁", x: 7, y: 2, lat: BASE_LAT + 2 * STEP, lng: BASE_LNG + 3 * STEP, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "north", streetName: "Silver Street" },
            { from: "n2", to: "n1", weight: 1, direction: "south", streetName: "Silver Street" },
            { from: "n2", to: "n3", weight: 1, direction: "north", streetName: "Silver Street" },
            { from: "n3", to: "n2", weight: 1, direction: "south", streetName: "Silver Street" },
            { from: "n2", to: "n4", weight: 1, direction: "east", streetName: "Central Avenue" },
            { from: "n4", to: "n2", weight: 1, direction: "west", streetName: "Central Avenue" },
            { from: "n4", to: "n5", weight: 1, direction: "north", streetName: "Library Passage" },
            { from: "n5", to: "n4", weight: 1, direction: "south", streetName: "Library Passage" },
            { from: "n5", to: "n8", weight: 1, direction: "east", streetName: "East Boulevard" },
            { from: "n8", to: "n5", weight: 1, direction: "west", streetName: "East Boulevard" },
            { from: "n4", to: "n6", weight: 1, direction: "east", streetName: "Academy Way" },
            { from: "n6", to: "n4", weight: 1, direction: "west", streetName: "Academy Way" },
            { from: "n6", to: "n8", weight: 1, direction: "north", streetName: "Station Link" },
            { from: "n8", to: "n6", weight: 1, direction: "south", streetName: "Station Link" },
            { from: "n6", to: "n7", weight: 1, direction: "south", streetName: "Station Link" },
            { from: "n7", to: "n6", weight: 1, direction: "north", streetName: "Station Link" },
        ],
        optimalPath: ["n1", "n2", "n4", "n5", "n8"],
        patternSequence: ["north", "east", "north", "east"],
    },
    {
        id: "l2_map2",
        name: "Horizon Hills",
        difficulty: 2,
        gridDimensions: { cols: 7, rows: 7 },
        center: [BASE_LNG + 0.005, BASE_LAT],
        encodingTimeSeconds: 12,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 1, y: 7, lat: BASE_LAT - 3 * STEP, lng: BASE_LNG - 3 * STEP, isStart: true },
            { id: "n2", label: "Verdant Community Park", emoji: "🌳", landmark: "Verdant Community Park", x: 4, y: 7, lat: BASE_LAT - 3 * STEP, lng: BASE_LNG },
            { id: "n3", label: "Metro Transit Hub", emoji: "🚏", landmark: "Metro Transit Hub", x: 4, y: 4, lat: BASE_LAT, lng: BASE_LNG },
            { id: "n4", label: "First Horizon Bank", emoji: "🏦", landmark: "First Horizon Bank", x: 1, y: 4, lat: BASE_LAT, lng: BASE_LNG - 3 * STEP },
            { id: "n5", label: "Crestview Pharmacy", emoji: "💊", landmark: "Crestview Pharmacy", x: 7, y: 4, lat: BASE_LAT, lng: BASE_LNG + 3 * STEP },
            { id: "n6", label: "Destination", emoji: "🏁", x: 7, y: 1, lat: BASE_LAT + 3 * STEP, lng: BASE_LNG + 3 * STEP, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "east", streetName: "Horizon Way" },
            { from: "n2", to: "n1", weight: 1, direction: "west", streetName: "Horizon Way" },
            { from: "n2", to: "n3", weight: 1, direction: "north", streetName: "Park Road" },
            { from: "n3", to: "n2", weight: 1, direction: "south", streetName: "Park Road" },
            { from: "n3", to: "n4", weight: 1, direction: "west", streetName: "Bank Street" },
            { from: "n4", to: "n3", weight: 1, direction: "east", streetName: "Bank Street" },
            { from: "n3", to: "n5", weight: 1, direction: "east", streetName: "Pharmacy Avenue" },
            { from: "n5", to: "n3", weight: 1, direction: "west", streetName: "Pharmacy Avenue" },
            { from: "n5", to: "n6", weight: 1, direction: "north", streetName: "Hill Crest Drive" },
            { from: "n6", to: "n5", weight: 1, direction: "south", streetName: "Hill Crest Drive" },
        ],
        optimalPath: ["n1", "n2", "n3", "n5", "n6"],
        patternSequence: ["east", "north", "east", "north"],
    },
    {
        id: "l2_map3",
        name: "Beacon Park Estate",
        difficulty: 2,
        gridDimensions: { cols: 7, rows: 7 },
        center: [BASE_LNG, BASE_LAT + 0.005],
        encodingTimeSeconds: 12,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 7, y: 7, lat: BASE_LAT - 3 * STEP, lng: BASE_LNG + 3 * STEP, isStart: true },
            { id: "n2", label: "Sunbake Bakery", emoji: "🥐", landmark: "Sunbake Bakery", x: 4, y: 7, lat: BASE_LAT - 3 * STEP, lng: BASE_LNG },
            { id: "n3", label: "Serenity Shrine", emoji: "🛕", landmark: "Serenity Shrine", x: 4, y: 4, lat: BASE_LAT, lng: BASE_LNG },
            { id: "n4", label: "Postal Depot", emoji: "📮", landmark: "Postal Depot", x: 1, y: 4, lat: BASE_LAT, lng: BASE_LNG - 3 * STEP },
            { id: "n5", label: "Destination", emoji: "🏁", x: 1, y: 1, lat: BASE_LAT + 3 * STEP, lng: BASE_LNG - 3 * STEP, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "west", streetName: "Beacon Avenue" },
            { from: "n2", to: "n1", weight: 1, direction: "east", streetName: "Beacon Avenue" },
            { from: "n2", to: "n3", weight: 1, direction: "north", streetName: "Shrine Path" },
            { from: "n3", to: "n2", weight: 1, direction: "south", streetName: "Shrine Path" },
            { from: "n3", to: "n4", weight: 1, direction: "west", streetName: "Postal Lane" },
            { from: "n4", to: "n3", weight: 1, direction: "east", streetName: "Postal Lane" },
            { from: "n4", to: "n5", weight: 1, direction: "north", streetName: "Estate Drive" },
            { from: "n5", to: "n4", weight: 1, direction: "south", streetName: "Estate Drive" },
        ],
        optimalPath: ["n1", "n2", "n3", "n4", "n5"],
        patternSequence: ["west", "north", "west", "north"],
    },
    {
        id: "l2_map4",
        name: "Oakridge Crest",
        difficulty: 2,
        gridDimensions: { cols: 7, rows: 7 },
        center: [BASE_LNG, BASE_LAT],
        encodingTimeSeconds: 12,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 1, y: 1, lat: BASE_LAT + 3 * STEP, lng: BASE_LNG - 3 * STEP, isStart: true },
            { id: "n2", label: "City Central Library", emoji: "📚", landmark: "City Central Library", x: 4, y: 1, lat: BASE_LAT + 3 * STEP, lng: BASE_LNG },
            { id: "n3", label: "Oakwood Academy", emoji: "🏫", landmark: "Oakwood Academy", x: 4, y: 4, lat: BASE_LAT, lng: BASE_LNG },
            { id: "n4", label: "Union Central Station", emoji: "🚉", landmark: "Union Central Station", x: 7, y: 4, lat: BASE_LAT, lng: BASE_LNG + 3 * STEP },
            { id: "n5", label: "Destination", emoji: "🏁", x: 7, y: 7, lat: BASE_LAT - 3 * STEP, lng: BASE_LNG + 3 * STEP, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "east", streetName: "Oakridge Way" },
            { from: "n2", to: "n1", weight: 1, direction: "west", streetName: "Oakridge Way" },
            { from: "n2", to: "n3", weight: 1, direction: "south", streetName: "Campus Drive" },
            { from: "n3", to: "n2", weight: 1, direction: "north", streetName: "Campus Drive" },
            { from: "n3", to: "n4", weight: 1, direction: "east", streetName: "Station Boulevard" },
            { from: "n4", to: "n3", weight: 1, direction: "west", streetName: "Station Boulevard" },
            { from: "n4", to: "n5", weight: 1, direction: "south", streetName: "Terminal Way" },
            { from: "n5", to: "n4", weight: 1, direction: "north", streetName: "Terminal Way" },
        ],
        optimalPath: ["n1", "n2", "n3", "n4", "n5"],
        patternSequence: ["east", "south", "east", "south"],
    },

    // ==========================================
    // LEVEL 3: FICTIONAL NEIGHBORHOODS (10s Encoding)
    // ==========================================
    {
        id: "l3_map1",
        name: "Verdant Square (9x9)",
        difficulty: 3,
        gridDimensions: { cols: 9, rows: 9 },
        center: [BASE_LNG, BASE_LAT],
        encodingTimeSeconds: 10,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 1, y: 9, lat: BASE_LAT - 4 * STEP, lng: BASE_LNG - 4 * STEP, isStart: true },
            { id: "n2", label: "St. Jude Medical Center", emoji: "🏥", landmark: "St. Jude Medical Center", x: 1, y: 6, lat: BASE_LAT - STEP, lng: BASE_LNG - 4 * STEP },
            { id: "n3", label: "City Central Library", emoji: "📚", landmark: "City Central Library", x: 1, y: 2, lat: BASE_LAT + 3 * STEP, lng: BASE_LNG - 4 * STEP },
            { id: "n4", label: "Grand Horizon Market", emoji: "🛒", landmark: "Grand Horizon Market", x: 5, y: 6, lat: BASE_LAT - STEP, lng: BASE_LNG },
            { id: "n5", label: "Oakwood Academy", emoji: "🏫", landmark: "Oakwood Academy", x: 5, y: 2, lat: BASE_LAT + 3 * STEP, lng: BASE_LNG },
            { id: "n6", label: "Crestview Pharmacy", emoji: "💊", landmark: "Crestview Pharmacy", x: 7, y: 6, lat: BASE_LAT - STEP, lng: BASE_LNG + 2 * STEP },
            { id: "n7", label: "Verdant Community Park", emoji: "🌳", landmark: "Verdant Community Park", x: 7, y: 9, lat: BASE_LAT - 4 * STEP, lng: BASE_LNG + 2 * STEP },
            { id: "n8", label: "First Horizon Bank", emoji: "🏦", landmark: "First Horizon Bank", x: 7, y: 2, lat: BASE_LAT + 3 * STEP, lng: BASE_LNG + 2 * STEP },
            { id: "n9", label: "Metro Transit Hub", emoji: "🚏", landmark: "Metro Transit Hub", x: 9, y: 4, lat: BASE_LAT + STEP, lng: BASE_LNG + 4 * STEP },
            { id: "n10", label: "Destination", emoji: "🏁", x: 9, y: 8, lat: BASE_LAT - 3 * STEP, lng: BASE_LNG + 4 * STEP, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "north", streetName: "Verdant Avenue" },
            { from: "n2", to: "n1", weight: 1, direction: "south", streetName: "Verdant Avenue" },
            { from: "n2", to: "n3", weight: 1, direction: "north", streetName: "Verdant Avenue" },
            { from: "n3", to: "n2", weight: 1, direction: "south", streetName: "Verdant Avenue" },
            { from: "n2", to: "n4", weight: 1, direction: "east", streetName: "Market Row" },
            { from: "n4", to: "n2", weight: 1, direction: "west", streetName: "Market Row" },
            { from: "n4", to: "n5", weight: 1, direction: "north", streetName: "Academy Walk" },
            { from: "n5", to: "n4", weight: 1, direction: "south", streetName: "Academy Walk" },
            { from: "n3", to: "n5", weight: 1, direction: "east", streetName: "Library Street" },
            { from: "n5", to: "n3", weight: 1, direction: "west", streetName: "Library Street" },
            { from: "n4", to: "n6", weight: 1, direction: "east", streetName: "Pharmacy Way" },
            { from: "n6", to: "n4", weight: 1, direction: "west", streetName: "Pharmacy Way" },
            { from: "n5", to: "n8", weight: 1, direction: "east", streetName: "Bank Alley" },
            { from: "n8", to: "n5", weight: 1, direction: "west", streetName: "Bank Alley" },
            { from: "n6", to: "n7", weight: 1, direction: "south", streetName: "Parkside Lane" },
            { from: "n7", to: "n6", weight: 1, direction: "north", streetName: "Parkside Lane" },
            { from: "n6", to: "n8", weight: 1, direction: "north", streetName: "Parkside Lane" },
            { from: "n8", to: "n6", weight: 1, direction: "south", streetName: "Parkside Lane" },
            { from: "n8", to: "n9", weight: 1, direction: "east", streetName: "Transit Link" },
            { from: "n9", to: "n8", weight: 1, direction: "west", streetName: "Transit Link" },
            { from: "n9", to: "n10", weight: 1, direction: "south", streetName: "Destination Way" },
            { from: "n10", to: "n9", weight: 1, direction: "north", streetName: "Destination Way" },
            { from: "n6", to: "n10", weight: 1, direction: "east", streetName: "Cross Avenue" },
            { from: "n10", to: "n6", weight: 1, direction: "west", streetName: "Cross Avenue" },
        ],
        optimalPath: ["n1", "n2", "n4", "n6", "n10"],
        patternSequence: ["north", "east", "east", "east"],
    },
    {
        id: "l3_map2",
        name: "Astor Heights",
        difficulty: 3,
        gridDimensions: { cols: 9, rows: 9 },
        center: [BASE_LNG + 0.005, BASE_LAT - 0.005],
        encodingTimeSeconds: 10,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 1, y: 1, lat: BASE_LAT + 4 * STEP, lng: BASE_LNG - 4 * STEP, isStart: true },
            { id: "n2", label: "Serenity Shrine", emoji: "🛕", landmark: "Serenity Shrine", x: 5, y: 1, lat: BASE_LAT + 4 * STEP, lng: BASE_LNG },
            { id: "n3", label: "Oakwood Academy", emoji: "🏫", landmark: "Oakwood Academy", x: 5, y: 5, lat: BASE_LAT, lng: BASE_LNG },
            { id: "n4", label: "St. Jude Medical Center", emoji: "🏥", landmark: "St. Jude Medical Center", x: 1, y: 5, lat: BASE_LAT, lng: BASE_LNG - 4 * STEP },
            { id: "n5", label: "Grand Horizon Market", emoji: "🛒", landmark: "Grand Horizon Market", x: 9, y: 5, lat: BASE_LAT, lng: BASE_LNG + 4 * STEP },
            { id: "n6", label: "Destination", emoji: "🏁", x: 9, y: 9, lat: BASE_LAT - 4 * STEP, lng: BASE_LNG + 4 * STEP, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "east", streetName: "Astor Boulevard" },
            { from: "n2", to: "n1", weight: 1, direction: "west", streetName: "Astor Boulevard" },
            { from: "n2", to: "n3", weight: 1, direction: "south", streetName: "Shrine Way" },
            { from: "n3", to: "n2", weight: 1, direction: "north", streetName: "Shrine Way" },
            { from: "n3", to: "n4", weight: 1, direction: "west", streetName: "Medical Lane" },
            { from: "n4", to: "n3", weight: 1, direction: "east", streetName: "Medical Lane" },
            { from: "n3", to: "n5", weight: 1, direction: "east", streetName: "Market Passage" },
            { from: "n5", to: "n3", weight: 1, direction: "west", streetName: "Market Passage" },
            { from: "n5", to: "n6", weight: 1, direction: "south", streetName: "Terminal Boulevard" },
            { from: "n6", to: "n5", weight: 1, direction: "north", streetName: "Terminal Boulevard" },
        ],
        optimalPath: ["n1", "n2", "n3", "n5", "n6"],
        patternSequence: ["east", "south", "east", "south"],
    },
    {
        id: "l3_map3",
        name: "Celestia Park",
        difficulty: 3,
        gridDimensions: { cols: 9, rows: 9 },
        center: [BASE_LNG, BASE_LAT],
        encodingTimeSeconds: 10,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 9, y: 9, lat: BASE_LAT - 4 * STEP, lng: BASE_LNG + 4 * STEP, isStart: true },
            { id: "n2", label: "Union Central Station", emoji: "🚉", landmark: "Union Central Station", x: 5, y: 9, lat: BASE_LAT - 4 * STEP, lng: BASE_LNG },
            { id: "n3", label: "Postal Depot", emoji: "📮", landmark: "Postal Depot", x: 5, y: 5, lat: BASE_LAT, lng: BASE_LNG },
            { id: "n4", label: "Sunbake Bakery", emoji: "🥐", landmark: "Sunbake Bakery", x: 1, y: 5, lat: BASE_LAT, lng: BASE_LNG - 4 * STEP },
            { id: "n5", label: "Destination", emoji: "🏁", x: 1, y: 1, lat: BASE_LAT + 4 * STEP, lng: BASE_LNG - 4 * STEP, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "west", streetName: "Celestia Drive" },
            { from: "n2", to: "n1", weight: 1, direction: "east", streetName: "Celestia Drive" },
            { from: "n2", to: "n3", weight: 1, direction: "north", streetName: "Station Avenue" },
            { from: "n3", to: "n2", weight: 1, direction: "south", streetName: "Station Avenue" },
            { from: "n3", to: "n4", weight: 1, direction: "west", streetName: "Bakery Street" },
            { from: "n4", to: "n3", weight: 1, direction: "east", streetName: "Bakery Street" },
            { from: "n4", to: "n5", weight: 1, direction: "north", streetName: "North Summit" },
            { from: "n5", to: "n4", weight: 1, direction: "south", streetName: "North Summit" },
        ],
        optimalPath: ["n1", "n2", "n3", "n4", "n5"],
        patternSequence: ["west", "north", "west", "north"],
    },
    {
        id: "l3_map4",
        name: "Lakeside District",
        difficulty: 3,
        gridDimensions: { cols: 9, rows: 9 },
        center: [BASE_LNG, BASE_LAT],
        encodingTimeSeconds: 10,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 1, y: 9, lat: BASE_LAT - 4 * STEP, lng: BASE_LNG - 4 * STEP, isStart: true },
            { id: "n2", label: "Crestview Pharmacy", emoji: "💊", landmark: "Crestview Pharmacy", x: 5, y: 9, lat: BASE_LAT - 4 * STEP, lng: BASE_LNG },
            { id: "n3", label: "First Horizon Bank", emoji: "🏦", landmark: "First Horizon Bank", x: 5, y: 5, lat: BASE_LAT, lng: BASE_LNG },
            { id: "n4", label: "Metro Transit Hub", emoji: "🚏", landmark: "Metro Transit Hub", x: 9, y: 5, lat: BASE_LAT, lng: BASE_LNG + 4 * STEP },
            { id: "n5", label: "Destination", emoji: "🏁", x: 9, y: 1, lat: BASE_LAT + 4 * STEP, lng: BASE_LNG + 4 * STEP, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "east", streetName: "Lakeside Drive" },
            { from: "n2", to: "n1", weight: 1, direction: "west", streetName: "Lakeside Drive" },
            { from: "n2", to: "n3", weight: 1, direction: "north", streetName: "Bank Road" },
            { from: "n3", to: "n2", weight: 1, direction: "south", streetName: "Bank Road" },
            { from: "n3", to: "n4", weight: 1, direction: "east", streetName: "Transit Way" },
            { from: "n4", to: "n3", weight: 1, direction: "west", streetName: "Transit Way" },
            { from: "n4", to: "n5", weight: 1, direction: "north", streetName: "Harbor Boulevard" },
            { from: "n5", to: "n4", weight: 1, direction: "south", streetName: "Harbor Boulevard" },
        ],
        optimalPath: ["n1", "n2", "n3", "n4", "n5"],
        patternSequence: ["east", "north", "east", "north"],
    },

    // ==========================================
    // LEVEL 4: FICTIONAL NEIGHBORHOODS (8s Encoding)
    // ==========================================
    {
        id: "l4_map1",
        name: "Solstice Complex (11x11)",
        difficulty: 4,
        gridDimensions: { cols: 11, rows: 11 },
        center: [BASE_LNG, BASE_LAT],
        encodingTimeSeconds: 8,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 1, y: 11, lat: BASE_LAT - 5 * STEP, lng: BASE_LNG - 5 * STEP, isStart: true },
            { id: "n2", label: "St. Jude Medical Center", emoji: "🏥", landmark: "St. Jude Medical Center", x: 1, y: 8, lat: BASE_LAT - 2 * STEP, lng: BASE_LNG - 5 * STEP },
            { id: "n3", label: "Oakwood Academy", emoji: "🏫", landmark: "Oakwood Academy", x: 1, y: 3, lat: BASE_LAT + 3 * STEP, lng: BASE_LNG - 5 * STEP },
            { id: "n4", label: "Grand Horizon Market", emoji: "🛒", landmark: "Grand Horizon Market", x: 5, y: 8, lat: BASE_LAT - 2 * STEP, lng: BASE_LNG - STEP },
            { id: "n5", label: "City Central Library", emoji: "📚", landmark: "City Central Library", x: 5, y: 3, lat: BASE_LAT + 3 * STEP, lng: BASE_LNG - STEP },
            { id: "n6", label: "Verdant Community Park", emoji: "🌳", landmark: "Verdant Community Park", x: 5, y: 11, lat: BASE_LAT - 5 * STEP, lng: BASE_LNG - STEP },
            { id: "n7", label: "First Horizon Bank", emoji: "🏦", landmark: "First Horizon Bank", x: 8, y: 8, lat: BASE_LAT - 2 * STEP, lng: BASE_LNG + 2 * STEP },
            { id: "n8", label: "Crestview Pharmacy", emoji: "💊", landmark: "Crestview Pharmacy", x: 8, y: 3, lat: BASE_LAT + 3 * STEP, lng: BASE_LNG + 2 * STEP },
            { id: "n9", label: "Metro Transit Hub", emoji: "🚏", landmark: "Metro Transit Hub", x: 8, y: 11, lat: BASE_LAT - 5 * STEP, lng: BASE_LNG + 2 * STEP },
            { id: "n10", label: "Union Central Station", emoji: "🚉", landmark: "Union Central Station", x: 11, y: 6, lat: BASE_LAT, lng: BASE_LNG + 5 * STEP },
            { id: "n11", label: "Serenity Shrine", emoji: "🛕", landmark: "Serenity Shrine", x: 11, y: 11, lat: BASE_LAT - 5 * STEP, lng: BASE_LNG + 5 * STEP },
            { id: "n12", label: "Destination", emoji: "🏁", x: 11, y: 2, lat: BASE_LAT + 4 * STEP, lng: BASE_LNG + 5 * STEP, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "north", streetName: "Solstice Boulevard" },
            { from: "n2", to: "n1", weight: 1, direction: "south", streetName: "Solstice Boulevard" },
            { from: "n2", to: "n3", weight: 1, direction: "north", streetName: "Solstice Boulevard" },
            { from: "n3", to: "n2", weight: 1, direction: "south", streetName: "Solstice Boulevard" },
            { from: "n2", to: "n4", weight: 1, direction: "east", streetName: "Market Walk" },
            { from: "n4", to: "n2", weight: 1, direction: "west", streetName: "Market Walk" },
            { from: "n4", to: "n5", weight: 1, direction: "north", streetName: "Library Lane" },
            { from: "n5", to: "n4", weight: 1, direction: "south", streetName: "Library Lane" },
            { from: "n4", to: "n6", weight: 1, direction: "south", streetName: "Park Road" },
            { from: "n6", to: "n4", weight: 1, direction: "north", streetName: "Park Road" },
            { from: "n4", to: "n7", weight: 1, direction: "east", streetName: "Bank Avenue" },
            { from: "n7", to: "n4", weight: 1, direction: "west", streetName: "Bank Avenue" },
            { from: "n5", to: "n8", weight: 1, direction: "east", streetName: "Pharmacy Way" },
            { from: "n8", to: "n5", weight: 1, direction: "west", streetName: "Pharmacy Way" },
            { from: "n7", to: "n8", weight: 1, direction: "north", streetName: "Central Link" },
            { from: "n8", to: "n7", weight: 1, direction: "south", streetName: "Central Link" },
            { from: "n7", to: "n9", weight: 1, direction: "south", streetName: "Transit Alley" },
            { from: "n9", to: "n7", weight: 1, direction: "north", streetName: "Transit Alley" },
            { from: "n7", to: "n10", weight: 1, direction: "east", streetName: "Station Drive" },
            { from: "n10", to: "n7", weight: 1, direction: "west", streetName: "Station Drive" },
            { from: "n8", to: "n12", weight: 1, direction: "east", streetName: "Horizon Expressway" },
            { from: "n12", to: "n8", weight: 1, direction: "west", streetName: "Horizon Expressway" },
            { from: "n10", to: "n12", weight: 1, direction: "north", streetName: "Terminal Parkway" },
            { from: "n12", to: "n10", weight: 1, direction: "south", streetName: "Terminal Parkway" },
            { from: "n10", to: "n11", weight: 1, direction: "south", streetName: "Shrine Boulevard" },
            { from: "n11", to: "n10", weight: 1, direction: "north", streetName: "Shrine Boulevard" },
        ],
        optimalPath: ["n1", "n2", "n4", "n5", "n8", "n12"],
        patternSequence: ["north", "east", "north", "east", "east"],
    },
    {
        id: "l4_map2",
        name: "Meridian Ridge",
        difficulty: 4,
        gridDimensions: { cols: 11, rows: 11 },
        center: [BASE_LNG + 0.005, BASE_LAT + 0.005],
        encodingTimeSeconds: 8,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 1, y: 1, lat: BASE_LAT + 5 * STEP, lng: BASE_LNG - 5 * STEP, isStart: true },
            { id: "n2", label: "Postal Depot", emoji: "📮", landmark: "Postal Depot", x: 5, y: 1, lat: BASE_LAT + 5 * STEP, lng: BASE_LNG - STEP },
            { id: "n3", label: "Sunbake Bakery", emoji: "🥐", landmark: "Sunbake Bakery", x: 5, y: 5, lat: BASE_LAT + STEP, lng: BASE_LNG - STEP },
            { id: "n4", label: "First Horizon Bank", emoji: "🏦", landmark: "First Horizon Bank", x: 8, y: 5, lat: BASE_LAT + STEP, lng: BASE_LNG + 2 * STEP },
            { id: "n5", label: "Crestview Pharmacy", emoji: "💊", landmark: "Crestview Pharmacy", x: 8, y: 8, lat: BASE_LAT - 2 * STEP, lng: BASE_LNG + 2 * STEP },
            { id: "n6", label: "Destination", emoji: "🏁", x: 11, y: 8, lat: BASE_LAT - 2 * STEP, lng: BASE_LNG + 5 * STEP, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "east", streetName: "Meridian Way" },
            { from: "n2", to: "n1", weight: 1, direction: "west", streetName: "Meridian Way" },
            { from: "n2", to: "n3", weight: 1, direction: "south", streetName: "Postal Street" },
            { from: "n3", to: "n2", weight: 1, direction: "north", streetName: "Postal Street" },
            { from: "n3", to: "n4", weight: 1, direction: "east", streetName: "Bakery Lane" },
            { from: "n4", to: "n3", weight: 1, direction: "west", streetName: "Bakery Lane" },
            { from: "n4", to: "n5", weight: 1, direction: "south", streetName: "Bank Crescent" },
            { from: "n5", to: "n4", weight: 1, direction: "north", streetName: "Bank Crescent" },
            { from: "n5", to: "n6", weight: 1, direction: "east", streetName: "Ridge Way" },
            { from: "n6", to: "n5", weight: 1, direction: "west", streetName: "Ridge Way" },
        ],
        optimalPath: ["n1", "n2", "n3", "n4", "n5", "n6"],
        patternSequence: ["east", "south", "east", "south", "east"],
    },
    {
        id: "l4_map3",
        name: "Elysium Heights",
        difficulty: 4,
        gridDimensions: { cols: 11, rows: 11 },
        center: [BASE_LNG, BASE_LAT],
        encodingTimeSeconds: 8,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 11, y: 11, lat: BASE_LAT - 5 * STEP, lng: BASE_LNG + 5 * STEP, isStart: true },
            { id: "n2", label: "Metro Transit Hub", emoji: "🚏", landmark: "Metro Transit Hub", x: 8, y: 11, lat: BASE_LAT - 5 * STEP, lng: BASE_LNG + 2 * STEP },
            { id: "n3", label: "City Central Library", emoji: "📚", landmark: "City Central Library", x: 8, y: 6, lat: BASE_LAT, lng: BASE_LNG + 2 * STEP },
            { id: "n4", label: "Oakwood Academy", emoji: "🏫", landmark: "Oakwood Academy", x: 4, y: 6, lat: BASE_LAT, lng: BASE_LNG - 2 * STEP },
            { id: "n5", label: "St. Jude Medical Center", emoji: "🏥", landmark: "St. Jude Medical Center", x: 4, y: 1, lat: BASE_LAT + 5 * STEP, lng: BASE_LNG - 2 * STEP },
            { id: "n6", label: "Destination", emoji: "🏁", x: 1, y: 1, lat: BASE_LAT + 5 * STEP, lng: BASE_LNG - 5 * STEP, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "west", streetName: "Elysium Boulevard" },
            { from: "n2", to: "n1", weight: 1, direction: "east", streetName: "Elysium Boulevard" },
            { from: "n2", to: "n3", weight: 1, direction: "north", streetName: "Library Way" },
            { from: "n3", to: "n2", weight: 1, direction: "south", streetName: "Library Way" },
            { from: "n3", to: "n4", weight: 1, direction: "west", streetName: "Academic Row" },
            { from: "n4", to: "n3", weight: 1, direction: "east", streetName: "Academic Row" },
            { from: "n4", to: "n5", weight: 1, direction: "north", streetName: "Hospital Drive" },
            { from: "n5", to: "n4", weight: 1, direction: "south", streetName: "Hospital Drive" },
            { from: "n5", to: "n6", weight: 1, direction: "west", streetName: "North Crescent" },
            { from: "n6", to: "n5", weight: 1, direction: "east", streetName: "North Crescent" },
        ],
        optimalPath: ["n1", "n2", "n3", "n4", "n5", "n6"],
        patternSequence: ["west", "north", "west", "north", "west"],
    },
    {
        id: "l4_map4",
        name: "Vanguard Precinct",
        difficulty: 4,
        gridDimensions: { cols: 11, rows: 11 },
        center: [BASE_LNG, BASE_LAT],
        encodingTimeSeconds: 8,
        nodes: [
            { id: "n1", label: "Start", emoji: "🟢", x: 1, y: 11, lat: BASE_LAT - 5 * STEP, lng: BASE_LNG - 5 * STEP, isStart: true },
            { id: "n2", label: "Grand Horizon Market", emoji: "🛒", landmark: "Grand Horizon Market", x: 5, y: 11, lat: BASE_LAT - 5 * STEP, lng: BASE_LNG - STEP },
            { id: "n3", label: "Serenity Shrine", emoji: "🛕", landmark: "Serenity Shrine", x: 5, y: 6, lat: BASE_LAT, lng: BASE_LNG - STEP },
            { id: "n4", label: "Verdant Community Park", emoji: "🌳", landmark: "Verdant Community Park", x: 9, y: 6, lat: BASE_LAT, lng: BASE_LNG + 3 * STEP },
            { id: "n5", label: "Union Central Station", emoji: "🚉", landmark: "Union Central Station", x: 9, y: 1, lat: BASE_LAT + 5 * STEP, lng: BASE_LNG + 3 * STEP },
            { id: "n6", label: "Destination", emoji: "🏁", x: 11, y: 1, lat: BASE_LAT + 5 * STEP, lng: BASE_LNG + 5 * STEP, isDestination: true },
        ],
        edges: [
            { from: "n1", to: "n2", weight: 1, direction: "east", streetName: "Vanguard Drive" },
            { from: "n2", to: "n1", weight: 1, direction: "west", streetName: "Vanguard Drive" },
            { from: "n2", to: "n3", weight: 1, direction: "north", streetName: "Shrine Way" },
            { from: "n3", to: "n2", weight: 1, direction: "south", streetName: "Shrine Way" },
            { from: "n3", to: "n4", weight: 1, direction: "east", streetName: "Parkside Avenue" },
            { from: "n4", to: "n3", weight: 1, direction: "west", streetName: "Parkside Avenue" },
            { from: "n4", to: "n5", weight: 1, direction: "north", streetName: "Station Boulevard" },
            { from: "n5", to: "n4", weight: 1, direction: "south", streetName: "Station Boulevard" },
            { from: "n5", to: "n6", weight: 1, direction: "east", streetName: "Terminal Link" },
            { from: "n6", to: "n5", weight: 1, direction: "west", streetName: "Terminal Link" },
        ],
        optimalPath: ["n1", "n2", "n3", "n4", "n5", "n6"],
        patternSequence: ["east", "north", "east", "north", "east"],
    },
];

/**
 * Get map graph for a specified difficulty level.
 */
export function getMapByDifficulty(difficulty: NavigationDifficulty, mapIndex = 0): MapGraph {
    const matchingMaps = CURATED_MAPS.filter((m) => m.difficulty === difficulty);
    if (matchingMaps.length === 0) return CURATED_MAPS[0];
    return matchingMaps[mapIndex % matchingMaps.length];
}

/**
 * Generate 3 diversified landmark recall questions based on the map and route.
 * Question types: sequential, spatial, exclusion, temporal, destination.
 */
export function generateLandmarkQuestions(map: MapGraph): LandmarkRecallQuestion[] {
    const questions: LandmarkRecallQuestion[] = [];
    const landmarksInMap = map.nodes
        .filter((n) => n.landmark)
        .map((n) => n.landmark as string);

    const optimalLandmarkNodes = map.optimalPath
        .map((id) => map.nodes.find((n) => n.id === id))
        .filter((n): n is NonNullable<typeof n> => !!n && !!n.landmark);

    // 1. Sequential Question: "Which landmark came immediately after [X]?"
    if (optimalLandmarkNodes.length >= 2) {
        const firstLmNode = optimalLandmarkNodes[0];
        const nextLmNode = optimalLandmarkNodes[1];
        const wrongLandmarks = FICTIONAL_LANDMARKS.filter(
            (l) => l.label !== nextLmNode.landmark
        )
            .map((l) => l.label)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);

        const options = [nextLmNode.landmark!, ...wrongLandmarks].sort(
            () => Math.random() - 0.5
        );

        questions.push({
            id: "q1_sequential",
            type: "sequential",
            questionText: `Which landmark did you encounter immediately after ${firstLmNode.landmark}?`,
            options,
            correctAnswer: nextLmNode.landmark!,
        });
    }

    // 2. Spatial Question: "Which landmark was located along [streetName] or direction?"
    const edgeWithStreet = map.edges.find((e) => e.streetName);
    if (edgeWithStreet) {
        const targetNode = map.nodes.find((n) => n.id === edgeWithStreet.to && n.landmark);
        const correctLm = targetNode?.landmark || FICTIONAL_LANDMARKS[0].label;
        const options = FICTIONAL_LANDMARKS.map((l) => l.label)
            .filter((l) => l !== correctLm)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
        options.push(correctLm);
        options.sort(() => Math.random() - 0.5);

        questions.push({
            id: "q2_spatial",
            type: "spatial",
            questionText: `Which landmark was located along ${edgeWithStreet.streetName}?`,
            options,
            correctAnswer: correctLm,
        });
    }

    // 3. Exclusion Question: "Which landmark was NOT part of your route?"
    const unvisitedLandmarks = FICTIONAL_LANDMARKS.filter(
        (l) => !landmarksInMap.includes(l.label)
    ).map((l) => l.label);

    if (unvisitedLandmarks.length > 0 && landmarksInMap.length >= 3) {
        const notInRoute = unvisitedLandmarks[0];
        const inRouteLandmarks = landmarksInMap.slice(0, 3);
        const options = [notInRoute, ...inRouteLandmarks].sort(
            () => Math.random() - 0.5
        );

        questions.push({
            id: "q3_exclusion",
            type: "exclusion",
            questionText: "Which landmark was NOT present in this neighborhood?",
            options,
            correctAnswer: notInRoute,
        });
    }

    // Fallback fill to ensure 3 questions
    while (questions.length < 3) {
        const fallbackOptions = ["Oakwood Academy", "St. Jude Medical Center", "City Central Library", "Verdant Community Park"].sort(() => Math.random() - 0.5);
        questions.push({
            id: `q_fallback_${questions.length}`,
            type: "temporal",
            questionText: "Which landmark was present on the optimal navigation path?",
            options: fallbackOptions,
            correctAnswer: fallbackOptions[0],
        });
    }

    return questions.slice(0, 3);
}
