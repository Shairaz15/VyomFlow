import * as maplibregl from "maplibre-gl";

export const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
export const BRIGHT_STYLE = "https://tiles.openfreemap.org/styles/bright";
export const DEMO_STYLE = "https://demotiles.maplibre.org/style.json";

export interface MapLoaderOptions {
    container: HTMLElement;
    center: [number, number]; // [lng, lat]
    zoom?: number;
    pitch?: number;
    bearing?: number;
    onLoad?: () => void;
}

export class MapLoader {
    private mapInstance: maplibregl.Map | null = null;
    public is3DExtrusionActive: boolean = false;

    public initMap(options: MapLoaderOptions): maplibregl.Map {
        const {
            container,
            center,
            zoom = 16.5,
            pitch = 55,
            bearing = -15,
            onLoad,
        } = options;

        this.mapInstance = new maplibregl.Map({
            container,
            style: OPENFREEMAP_STYLE,
            center,
            zoom,
            pitch,
            bearing,
            interactive: false,
            dragPan: false,
            scrollZoom: false,
            boxZoom: false,
            dragRotate: false,
            touchZoomRotate: false,
            doubleClickZoom: false,
            keyboard: false,
        });

        // Ensure canvas element has dark background (prevents white flash)
        const canvas = this.mapInstance.getCanvas();
        if (canvas) {
            canvas.style.backgroundColor = "#0f172a";
        }

        this.mapInstance.on("style.load", () => {
            this.setup3DBuildingExtrusions();
            if (this.mapInstance) this.mapInstance.resize();
            if (onLoad) onLoad();
        });

        // Error handling fallback for tile provider styles
        let triedFallback = false;
        this.mapInstance.on("error", (e: any) => {
            console.warn("MapLibre tile style issue detected, applying fallback:", e);
            if (!triedFallback && this.mapInstance) {
                triedFallback = true;
                this.mapInstance.setStyle(DEMO_STYLE);
            }
        });

        // Trigger auto-resize after DOM render
        setTimeout(() => {
            if (this.mapInstance) this.mapInstance.resize();
        }, 100);

        setTimeout(() => {
            if (this.mapInstance) this.mapInstance.resize();
        }, 500);

        return this.mapInstance;
    }

    private setup3DBuildingExtrusions(): void {
        if (!this.mapInstance) return;

        try {
            const style = this.mapInstance.getStyle();
            if (!style || !style.layers) return;

            const buildingLayer = style.layers.find(
                (layer: any) => layer.type === "fill" && (layer.id.includes("building") || layer["source-layer"] === "building")
            ) as any;

            if (buildingLayer && !this.mapInstance.getLayer("3d-buildings")) {
                const labelLayerId = style.layers.find(
                    (layer: any) => layer.type === "symbol" && layer.layout?.["text-field"]
                )?.id;

                this.mapInstance.addLayer(
                    {
                        id: "3d-buildings",
                        source: buildingLayer.source,
                        "source-layer": buildingLayer["source-layer"] || "building",
                        type: "fill-extrusion",
                        minzoom: 14,
                        paint: {
                            "fill-extrusion-color": [
                                "interpolate",
                                ["linear"],
                                ["get", "render_height"],
                                0, "#1e293b",
                                50, "#334155",
                                100, "#475569"
                            ],
                            "fill-extrusion-height": [
                                "interpolate",
                                ["linear"],
                                ["zoom"],
                                14, 0,
                                14.5, ["coalesce", ["get", "render_height"], ["get", "height"], 15]
                            ],
                            "fill-extrusion-base": [
                                "interpolate",
                                ["linear"],
                                ["zoom"],
                                14, 0,
                                14.5, ["coalesce", ["get", "render_min_height"], ["get", "min_height"], 0]
                            ],
                            "fill-extrusion-opacity": 0.85,
                        },
                    },
                    labelLayerId
                );
                this.is3DExtrusionActive = true;
            }
        } catch (err) {
            console.info("3D building extrusion omitted (flat 2D vector fallback active):", err);
            this.is3DExtrusionActive = false;
        }
    }

    public snapToNode(lng: number, lat: number): void {
        if (!this.mapInstance) return;

        this.mapInstance.easeTo({
            center: [lng, lat],
            duration: 350,
            pitch: 55,
            easing: (t: number) => t * (2 - t),
        });

        this.mapInstance.resize();
    }

    public resize(): void {
        if (this.mapInstance) {
            this.mapInstance.resize();
        }
    }

    public destroy(): void {
        if (this.mapInstance) {
            this.mapInstance.remove();
            this.mapInstance = null;
        }
    }
}
