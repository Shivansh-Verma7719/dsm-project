"use client";

import React, { useState, useEffect, useMemo } from "react";
import Map, { Source, Layer, MapLayerMouseEvent } from "react-map-gl/maplibre";
import { Tooltip, Card, Spinner } from "@heroui/react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";

export function InteractiveMap() {
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; feature: any } | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/state-metrics")
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch((err) => console.error(err));
  }, []);

  const dataLayer: any = {
    id: "data",
    type: "fill",
    paint: {
      "fill-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        "var(--chart-1)",
        "var(--chart-2)"
      ],
      "fill-opacity": 0.6,
      "fill-outline-color": theme === "dark" ? "#000" : "#fff",
    },
  };

  const onHover = (event: MapLayerMouseEvent) => {
    const { features, point } = event;
    const hoveredFeature = features && features[0];
    if (hoveredFeature) {
      // Find matching metric from API
      const stName = hoveredFeature.properties?.st_nm; // Assuming geojson has st_nm
      const metric = metrics.find(m => m.state_name === stName);
      setHoverInfo({
        x: point.x,
        y: point.y,
        feature: { ...hoveredFeature.properties, ...metric },
      });
    } else {
      setHoverInfo(null);
    }
  };

  if (!metrics.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] w-full rounded-xl bg-content2">
        <Spinner size="lg" />
        <span className="mt-4 text-sm font-medium text-default-500">Loading Map Data...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden shadow-lg border border-divider">
      <Map
        initialViewState={{
          longitude: 78.9629,
          latitude: 20.5937,
          zoom: 3.5,
        }}
        mapStyle={{
          version: 8,
          sources: {
            "google-tiles": {
              type: "raster",
              tiles: ["https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"],
              tileSize: 256,
              attribution: "© Google Maps",
            },
          },
          layers: [
            {
              id: "google-tiles",
              type: "raster",
              source: "google-tiles",
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        }}
        interactiveLayerIds={["data"]}
        onMouseMove={onHover}
        onMouseLeave={() => setHoverInfo(null)}
      >
        <Source type="geojson" data="/geo/in.json">
          <Layer {...dataLayer} />
        </Source>
      </Map>
      
      {hoverInfo && (
        <div
          className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full pb-2"
          style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
          <Card className="min-w-[200px] bg-background/90 backdrop-blur-md border-1 border-divider">
            <Card.Content className="p-3 text-sm flex flex-col gap-1">
              <h4 className="font-bold text-base mb-1">{hoverInfo.feature.state_name || hoverInfo.feature.st_nm}</h4>
              {hoverInfo.feature.investors_per_lakh !== undefined ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-default-500">Investors (per Lakh):</span>
                    <span className="font-semibold">{hoverInfo.feature.investors_per_lakh?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Per Capita Income:</span>
                    <span className="font-semibold">₹{hoverInfo.feature.per_capita_income_2011?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-default-500">Total Population:</span>
                    <span className="font-semibold">{hoverInfo.feature.total_population?.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <span className="text-default-500 text-xs italic">No data mapped</span>
              )}
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
}
