import type { RouteConfig } from "../../types/navigationTypes";

/**
 * Real-World Campus PoV Navigation Route Configuration
 * Encoding Route: Point A (Main Gate 1) → Point B (Basketball Court Plaza)
 * Reverse Navigation: Point B → Point A with 8 Intersections
 * Video Structure:
 *   - Encoding: /videos/navigation/encoding_full.mp4
 *   - Reverse Departure: /videos/navigation/start.mp4
 *   - Intersections 1 to 8: /videos/navigation/inter-1.mp4 to inter-8.mp4 (approach & pause)
 *   - Continuations 1 to 8: /videos/navigation/af-1.mp4 to af-8.mp4 (path after intersection)
 * Landmarks: 21 items (landmark_1.jpg to landmark_21.jpg)
 */
export const DEMO_ROUTE: RouteConfig = {
    routeId: "campus_route_01",
    routeName: "Main Entrance (Gate 1) to Campus Sports Plaza",
    description: "First-person walking route from Main Gate 1 (Point A) through campus corridors and central lawn to the Basketball Court Plaza (Point B).",
    encodingVideoUrl: "/videos/navigation/encoding_full.mp4",
    startVideoUrl: "/videos/navigation/start.mp4",
    destination: {
        question: "Where were you headed at the end of the walking route (Point B)?",
        options: [
            "Campus Basketball Court & Sports Plaza",
            "Main Administrative Building & Auditorium",
            "Central Library & Information Science Block",
            "Mechanical Engineering Workshops & Labs",
        ],
        correctIndex: 0,
    },
    segments: [
        {
            segmentId: "seg_01",
            approachVideoUrl: "/videos/navigation/inter-1.mp4",
            continuationVideoUrl: "/videos/navigation/af-1.mp4",
            fromWaypoint: "Point B",
            toWaypoint: "Intersection 1",
            intersectionLabel: "Intersection 1: Campus Plaza Walkway",
            correctDirection: "right",
        },
        {
            segmentId: "seg_02",
            approachVideoUrl: "/videos/navigation/inter-2.mp4",
            continuationVideoUrl: "/videos/navigation/af-2.mp4",
            fromWaypoint: "Intersection 1",
            toWaypoint: "Intersection 2",
            intersectionLabel: "Intersection 2: Silver Jubilee Block Corridor",
            correctDirection: "right",
        },
        {
            segmentId: "seg_03",
            approachVideoUrl: "/videos/navigation/inter-3.mp4",
            continuationVideoUrl: "/videos/navigation/af-3.mp4",
            fromWaypoint: "Intersection 2",
            toWaypoint: "Intersection 3",
            intersectionLabel: "Intersection 3: Central Lawn Walkway Junction",
            correctDirection: "straight",
        },
        {
            segmentId: "seg_04",
            approachVideoUrl: "/videos/navigation/inter-4.mp4",
            continuationVideoUrl: "/videos/navigation/af-4.mp4",
            fromWaypoint: "Intersection 3",
            toWaypoint: "Intersection 4",
            intersectionLabel: "Intersection 4: Tree Driveway Corner (Green Fence)",
            correctDirection: "left",
        },
        {
            segmentId: "seg_05",
            approachVideoUrl: "/videos/navigation/inter-5.mp4",
            continuationVideoUrl: "/videos/navigation/af-5.mp4",
            fromWaypoint: "Intersection 4",
            toWaypoint: "Intersection 5",
            intersectionLabel: "Intersection 5: Tree-Lined Driveway along Sports Field",
            correctDirection: "left",
        },
        {
            segmentId: "seg_06",
            approachVideoUrl: "/videos/navigation/inter-6.mp4",
            continuationVideoUrl: "/videos/navigation/af-6.mp4",
            fromWaypoint: "Intersection 5",
            toWaypoint: "Intersection 6",
            intersectionLabel: "Intersection 6: Bose Block Corner & Robot Sculpture",
            correctDirection: "right",
        },
        {
            segmentId: "seg_07",
            approachVideoUrl: "/videos/navigation/inter-7.mp4",
            continuationVideoUrl: "/videos/navigation/af-7.mp4",
            fromWaypoint: "Intersection 6",
            toWaypoint: "Intersection 7",
            intersectionLabel: "Intersection 7: Entrance Walkway Junction (Bamboo Garden)",
            correctDirection: "left",
        },
        {
            segmentId: "seg_08",
            approachVideoUrl: "/videos/navigation/inter-8.mp4",
            continuationVideoUrl: "/videos/navigation/af-8.mp4",
            fromWaypoint: "Intersection 7",
            toWaypoint: "Point A (Gate 1)",
            intersectionLabel: "Intersection 8: Main Gate 1 Arrival Stretch",
            correctDirection: "right",
        },
    ],
    landmarks: [
        // Real Landmarks in forward chronological order (Point A → Point B)
        {
            id: "lm_01",
            name: "Gate 1 Campus Layout Board",
            imageUrl: "/images/navigation/landmarks/landmark_1.jpg",
            isReal: true,
            chronologicalOrder: 1,
        },
        {
            id: "lm_04",
            name: "Bose Block Blue Robot Sculpture",
            imageUrl: "/images/navigation/landmarks/landmark_4.jpg",
            isReal: true,
            chronologicalOrder: 2,
        },
        {
            id: "lm_05",
            name: "Yellow Blossom Tree Driveway",
            imageUrl: "/images/navigation/landmarks/landmark_5.jpg",
            isReal: true,
            chronologicalOrder: 3,
        },
        {
            id: "lm_07",
            name: "Silver Jubilee Building Blue Grids",
            imageUrl: "/images/navigation/landmarks/landmark_7.jpg",
            isReal: true,
            chronologicalOrder: 4,
        },
        {
            id: "lm_08",
            name: "Tree with Giant White Hand Sculpture",
            imageUrl: "/images/navigation/landmarks/landmark_8.jpg",
            isReal: true,
            chronologicalOrder: 5,
        },
        {
            id: "lm_12",
            name: "Vine Pergola Canopy Walkway",
            imageUrl: "/images/navigation/landmarks/landmark_12.jpg",
            isReal: true,
            chronologicalOrder: 6,
        },
        {
            id: "lm_17",
            name: "Student Seating with Floral Mosaic Tiles",
            imageUrl: "/images/navigation/landmarks/landmark_17.jpg",
            isReal: true,
            chronologicalOrder: 7,
        },
        {
            id: "lm_19",
            name: "Amar Hemu Kalani Block Entrance",
            imageUrl: "/images/navigation/landmarks/landmark_19.jpg",
            isReal: true,
            chronologicalOrder: 8,
        },

        // Distractor Landmarks / Alternate Angle Lures from the 21 photo set
        {
            id: "lm_02",
            name: "Main Entrance Arch & Steps",
            imageUrl: "/images/navigation/landmarks/landmark_2.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_03",
            name: "Bamboo Cluster Garden & Stone Benches",
            imageUrl: "/images/navigation/landmarks/landmark_3.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_06",
            name: "Sports Ground Perimeter Fence View",
            imageUrl: "/images/navigation/landmarks/landmark_6.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_09",
            name: "White Hand Sculpture (Front Angle)",
            imageUrl: "/images/navigation/landmarks/landmark_9.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_10",
            name: "White Hand Sculpture (Lawn Angle)",
            imageUrl: "/images/navigation/landmarks/landmark_10.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_11",
            name: "Central Lawn Black Lamp Post",
            imageUrl: "/images/navigation/landmarks/landmark_11.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_13",
            name: "Ghost Rider Scrap Metal Sculpture",
            imageUrl: "/images/navigation/landmarks/landmark_13.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_14",
            name: "Wall Mural & Placements Board",
            imageUrl: "/images/navigation/landmarks/landmark_14.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_15",
            name: "Police Information Box & Blue Board",
            imageUrl: "/images/navigation/landmarks/landmark_15.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_16",
            name: "Campus Emergency Ambulance",
            imageUrl: "/images/navigation/landmarks/landmark_16.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_18",
            name: "Row of Wooden Classroom Desks",
            imageUrl: "/images/navigation/landmarks/landmark_18.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_20",
            name: "Terraced Auditorium Stone Steps",
            imageUrl: "/images/navigation/landmarks/landmark_20.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_21",
            name: "Outdoor Wooden Picnic Tables",
            imageUrl: "/images/navigation/landmarks/landmark_21.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
    ],
};
