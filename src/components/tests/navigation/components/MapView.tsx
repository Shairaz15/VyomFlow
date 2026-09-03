import { useEffect, useRef, useState } from "react";
import type { MapGraph, MapNode } from "../../../../types/navigationTypes";
import { MapLoader } from "../services/MapLoader";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface MapViewProps {
    graph: MapGraph;
    currentNodeId: string;
    visitedNodes?: string[];
    highlightedPath?: string[];
    phase: "encoding" | "navigation" | "replay";
    replayUserPath?: string[];
    replayStepIndex?: number;
    wrongTurnNodes?: string[];
    backtrackNodes?: string[];
}

export function MapView({
    graph,
    currentNodeId,
    visitedNodes = [],
    highlightedPath = [],
    phase,
    replayUserPath = [],
    replayStepIndex,
    wrongTurnNodes = [],
    backtrackNodes = [],
}: MapViewProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapLoaderRef = useRef<MapLoader | null>(null);
    const mapInstanceRef = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    const currentNode = graph.nodes.find((n) => n.id === currentNodeId);

    // Initialize MapLibre Map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        setIsLoaded(false);
        const loader = new MapLoader();
        mapLoaderRef.current = loader;

        const startNode = graph.nodes.find((n) => n.isStart) || graph.nodes[0];
        const map = loader.initMap({
            container: mapContainerRef.current,
            center: [startNode.lng, startNode.lat],
            zoom: 16.5,
            pitch: 55,
            bearing: -15,
            onLoad: () => {
                mapInstanceRef.current = map;
                setIsLoaded(true);
                updateMapGeoJSONLayers(map, graph, highlightedPath, visitedNodes, phase, replayUserPath, replayStepIndex);
                map.resize();
            },
        });

        // ResizeObserver to handle container layout changes
        const resizeObserver = new ResizeObserver(() => {
            if (loader) loader.resize();
        });
        resizeObserver.observe(mapContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            clearMarkers();
            loader.destroy();
            mapInstanceRef.current = null;
        };
    }, [graph.id]);

    // Camera snapping on node change
    useEffect(() => {
        if (currentNode && mapLoaderRef.current) {
            mapLoaderRef.current.snapToNode(currentNode.lng, currentNode.lat);
        }
    }, [currentNodeId]);

    // Update GeoJSON route lines & HTML 3D Markers whenever props update
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !map.isStyleLoaded()) return;

        updateMapGeoJSONLayers(
            map,
            graph,
            highlightedPath,
            visitedNodes,
            phase,
            replayUserPath,
            replayStepIndex
        );
        updateHTMLMarkers(map, graph, currentNodeId, wrongTurnNodes, backtrackNodes);
    }, [graph, currentNodeId, visitedNodes, highlightedPath, phase, replayStepIndex]);

    const clearMarkers = () => {
        markersRef.current.forEach((m) => m.remove());
        markersRef.current = [];
    };

    const updateHTMLMarkers = (
        map: maplibregl.Map,
        graph: MapGraph,
        activeNodeId: string,
        wrongTurns: string[],
        backtracks: string[]
    ) => {
        clearMarkers();

        graph.nodes.forEach((node) => {
            const el = document.createElement("div");
            el.className = "map-3d-node-marker";

            const isCurrent = node.id === activeNodeId;
            const isWrong = wrongTurns.includes(node.id);
            const isBacktrack = backtracks.includes(node.id);

            let markerHtml = `<div class="node-badge ${isCurrent ? "current" : ""} ${isWrong ? "wrong" : ""} ${isBacktrack ? "backtrack" : ""}">
                <span class="node-emoji">${node.emoji || "📍"}</span>
                ${node.landmark ? `<span class="landmark-tooltip">${node.landmark}</span>` : ""}
            </div>`;

            if (node.isStart) {
                markerHtml = `<div class="node-badge start">🟢 <span class="badge-label">Start</span></div>`;
            } else if (node.isDestination) {
                markerHtml = `<div class="node-badge destination">🏁 <span class="badge-label">Destination</span></div>`;
            }

            el.innerHTML = markerHtml;

            const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
                .setLngLat([node.lng, node.lat])
                .addTo(map);

            markersRef.current.push(marker);
        });
    };

    return (
        <div className="map-view-container relative w-full h-[420px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-950">
            {/* MapLibre Canvas Container */}
            <div ref={mapContainerRef} className="w-full h-full bg-slate-950" />

            {/* Dark Vignette Overlay */}
            <div className="map-overlay-vignette absolute inset-0 pointer-events-none rounded-2xl" />

            {/* Loading Indicator */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-cyan-400 font-mono text-sm z-10">
                    <div className="animate-spin text-3xl mb-2">🌀</div>
                    <span>Initializing 3D Vector Map Engine...</span>
                </div>
            )}
        </div>
    );
}

function updateMapGeoJSONLayers(
    map: maplibregl.Map,
    graph: MapGraph,
    highlightedPath: string[],
    visitedNodes: string[],
    phase: string,
    replayUserPath: string[],
    replayStepIndex?: number
) {
    const roadFeatures = graph.edges.map((edge) => {
        const fromNode = graph.nodes.find((n) => n.id === edge.from)!;
        const toNode = graph.nodes.find((n) => n.id === edge.to)!;
        return {
            type: "Feature" as const,
            properties: { streetName: edge.streetName || "Street" },
            geometry: {
                type: "LineString" as const,
                coordinates: [
                    [fromNode.lng, fromNode.lat],
                    [toNode.lng, toNode.lat],
                ],
            },
        };
    });

    const streetSource = map.getSource("street-network") as maplibregl.GeoJSONSource;
    if (streetSource) {
        streetSource.setData({ type: "FeatureCollection", features: roadFeatures });
    } else {
        map.addSource("street-network", {
            type: "geojson",
            data: { type: "FeatureCollection", features: roadFeatures },
        });

        map.addLayer({
            id: "street-network-line",
            type: "line",
            source: "street-network",
            paint: {
                "line-color": "#475569",
                "line-width": 6,
                "line-opacity": 0.6,
            },
        });
    }

    let pathNodeIds: string[] = [];
    if (phase === "encoding") {
        pathNodeIds = highlightedPath;
    } else if (phase === "navigation") {
        pathNodeIds = visitedNodes;
    } else if (phase === "replay" && replayUserPath.length > 0) {
        const step = replayStepIndex ?? replayUserPath.length - 1;
        pathNodeIds = replayUserPath.slice(0, step + 1);
    }

    const routeCoords = pathNodeIds
        .map((id) => graph.nodes.find((n) => n.id === id))
        .filter((n): n is MapNode => !!n)
        .map((n) => [n.lng, n.lat]);

    const routeFeature = {
        type: "Feature" as const,
        properties: {},
        geometry: {
            type: "LineString" as const,
            coordinates: routeCoords.length >= 2 ? routeCoords : [],
        },
    };

    const routeSource = map.getSource("route-highlight") as maplibregl.GeoJSONSource;
    if (routeSource) {
        routeSource.setData({ type: "FeatureCollection", features: [routeFeature] });
    } else {
        map.addSource("route-highlight", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [routeFeature] },
        });

        map.addLayer({
            id: "route-highlight-glow",
            type: "line",
            source: "route-highlight",
            paint: {
                "line-color": phase === "encoding" ? "#06b6d4" : "#10b981",
                "line-width": 10,
                "line-opacity": 0.85,
                "line-blur": 2,
            },
        });
    }
}
