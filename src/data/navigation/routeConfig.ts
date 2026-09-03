import type { RouteConfig } from "../../types/navigationTypes";

/**
 * Demo Route Configuration
 * 8 Waypoints: A ── B ── C ── D ── E ── F ── G ── H
 * Encoding: Full A→H route video showing landmarks
 * Reverse Navigation: 7 segments (H→G, G→F, F→E, E→D, D→C, C→B, B→A)
 * Intersections: 6 decision points between clips (at G, F, E, D, C, B)
 * Landmarks: 5 real landmarks (A→H order) + 5 distractors
 */
export const DEMO_ROUTE: RouteConfig = {
    routeId: "route_01",
    routeName: "Metro Central to Riverside Gardens",
    description: "First-person walking route from Metro Station (A) through the cultural quarter to Riverside Gardens (H).",
    encodingVideoUrl: "/videos/navigation/encoding_full.mp4",
    destination: {
        question: "Where were you headed at the end of the walking route?",
        options: [
            "Riverside Botanical Gardens",
            "City Central Hospital",
            "Metropolitan Railway Station",
            "Grand Library & Heritage Museum"
        ],
        correctIndex: 0,
    },
    segments: [
        {
            segmentId: "seg_h_g",
            videoUrl: "/videos/navigation/segment_h_g.mp4",
            fromWaypoint: "H",
            toWaypoint: "G",
            intersectionLabel: "Intersection 1: Old Town Square (Point G)",
            correctDirection: "left",
        },
        {
            segmentId: "seg_g_f",
            videoUrl: "/videos/navigation/segment_g_f.mp4",
            fromWaypoint: "G",
            toWaypoint: "F",
            intersectionLabel: "Intersection 2: Market Crossroad (Point F)",
            correctDirection: "straight",
        },
        {
            segmentId: "seg_f_e",
            videoUrl: "/videos/navigation/segment_f_e.mp4",
            fromWaypoint: "F",
            toWaypoint: "E",
            intersectionLabel: "Intersection 3: Clocktower Junction (Point E)",
            correctDirection: "right",
        },
        {
            segmentId: "seg_e_d",
            videoUrl: "/videos/navigation/segment_e_d.mp4",
            fromWaypoint: "E",
            toWaypoint: "D",
            intersectionLabel: "Intersection 4: Heritage Arcade (Point D)",
            correctDirection: "left",
        },
        {
            segmentId: "seg_d_c",
            videoUrl: "/videos/navigation/segment_d_c.mp4",
            fromWaypoint: "D",
            toWaypoint: "C",
            intersectionLabel: "Intersection 5: Northgate Avenue (Point C)",
            correctDirection: "straight",
        },
        {
            segmentId: "seg_c_b",
            videoUrl: "/videos/navigation/segment_c_b.mp4",
            fromWaypoint: "C",
            toWaypoint: "B",
            intersectionLabel: "Intersection 6: Station Boulevard (Point B)",
            correctDirection: "right",
        },
        {
            segmentId: "seg_b_a",
            videoUrl: "/videos/navigation/segment_b_a.mp4",
            fromWaypoint: "B",
            toWaypoint: "A",
            intersectionLabel: "Final Stretch: Arrival at Metro Central (Point A)",
            correctDirection: "straight",
        },
    ],
    landmarks: [
        // 5 Real Landmarks in chronological order A → H
        {
            id: "lm_01",
            name: "Metro Central Arch",
            imageUrl: "/images/navigation/landmarks/landmark_01.jpg",
            isReal: true,
            chronologicalOrder: 1,
        },
        {
            id: "lm_02",
            name: "St. Thomas Fountain",
            imageUrl: "/images/navigation/landmarks/landmark_02.jpg",
            isReal: true,
            chronologicalOrder: 2,
        },
        {
            id: "lm_03",
            name: "Heritage Clocktower",
            imageUrl: "/images/navigation/landmarks/landmark_03.jpg",
            isReal: true,
            chronologicalOrder: 3,
        },
        {
            id: "lm_04",
            name: "Town Hall Plaza",
            imageUrl: "/images/navigation/landmarks/landmark_04.jpg",
            isReal: true,
            chronologicalOrder: 4,
        },
        {
            id: "lm_05",
            name: "Riverside Botanical Gate",
            imageUrl: "/images/navigation/landmarks/landmark_05.jpg",
            isReal: true,
            chronologicalOrder: 5,
        },
        // 5 Distractor Landmarks (not on route)
        {
            id: "lm_06",
            name: "Cinema Multiplex",
            imageUrl: "/images/navigation/landmarks/landmark_06.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_07",
            name: "Sports Arena",
            imageUrl: "/images/navigation/landmarks/landmark_07.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_08",
            name: "Airport Terminal",
            imageUrl: "/images/navigation/landmarks/landmark_08.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_09",
            name: "City Fire Station",
            imageUrl: "/images/navigation/landmarks/landmark_09.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
        {
            id: "lm_10",
            name: "Modern Art Museum",
            imageUrl: "/images/navigation/landmarks/landmark_10.jpg",
            isReal: false,
            chronologicalOrder: -1,
        },
    ],
};
