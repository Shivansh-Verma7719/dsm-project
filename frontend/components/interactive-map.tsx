"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Map, { Source, Layer, MapLayerMouseEvent } from "react-map-gl/maplibre";
import { Tooltip, Card, Spinner } from "@heroui/react";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";

export function InteractiveMap() {
  const { theme } = useTheme();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [geoData, setGeoData] = useState<any>(null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; feature: any } | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/state-metrics`)
      .then((res) => res.json())
      .then((data) => setMetrics(data))
      .catch((err) => console.error(err));
      
    fetch("/geo/in.json")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Could not load geojson", err));
  }, []);

  const dataLayer: any = useMemo(() => ({
    id: "data",
    type: "fill",
    paint: {
      "fill-color": theme === "dark" ? "#2a3f6b" : "#c8d8f0",
      "fill-opacity": 0.55,
      "fill-outline-color": theme === "dark" ? "#1c2536" : "#ffffff",
    },
  }), [theme]);

  const highlightLayer: any = useMemo(() => ({
    id: "data-highlight",
    type: "fill",
    paint: {
      "fill-color": theme === "dark" ? "#c9852a" : "#c9852a",
      "fill-opacity": 0.75,
      "fill-outline-color": theme === "dark" ? "#1c2536" : "#ffffff",
    },
  }), [theme]);

  const onHover = useCallback((event: MapLayerMouseEvent) => {
    const { features, point } = event;
    const hoveredFeature = features && features[0];
    
    if (hoveredFeature) {

      // Find matching metric from API
      const stName = hoveredFeature.properties?.name; 
      const normalizedGeoName = stName?.toLowerCase().replace(/ and /g, ' & ');
      
      const metric = metrics.find(m => {
        const mName = m.state_name.toLowerCase();
        if (mName === normalizedGeoName) return true;
        if (mName === "odisha" && normalizedGeoName === "orissa") return true;
        if (mName === "uttarakhand" && normalizedGeoName === "uttaranchal") return true;
        if (mName === "dadra & nagar haveli" && normalizedGeoName?.includes("dādra")) return true;
        return false;
      });

      setHoverInfo({
        x: point.x,
        y: point.y,
        feature: { ...hoveredFeature.properties, ...metric },
      });
    } else {
      setHoverInfo(null);
    }
  }, [metrics]);

  const onMouseLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  const filter = useMemo(() => ["==", "name", hoverInfo?.feature?.name || ""], [hoverInfo?.feature?.name]);

  const mapStyle: any = useMemo(() => ({
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
  }), []);

  if (!metrics.length || !geoData) {
    return (
      <div 
        className="flex flex-col items-center justify-center h-[460px] w-full"
        style={{ background: "var(--paper-3)", border: "1px solid var(--border)" }}
      >
        <Spinner size="lg" />
        <span className="mt-4 font-mono text-xs" style={{ color: "var(--ink-3)" }}>Loading state data...</span>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[460px] overflow-hidden"
      style={{ border: "1px solid var(--border)" }}
    >
      <Map
        initialViewState={{
          longitude: 78.9629,
          latitude: 20.5937,
          zoom: 3.5,
        }}
        mapStyle={mapStyle}
        interactiveLayerIds={["data"]}
        onMouseMove={onHover}
        onMouseLeave={onMouseLeave}
      >
        <Source id="state-boundaries" type="geojson" data={geoData}>
          <Layer {...dataLayer} />
          <Layer 
            {...highlightLayer} 
            filter={filter} 
          />
        </Source>
      </Map>
      
      {hoverInfo && (
        <div
          className="absolute pointer-events-none z-50 transform -translate-x-1/2 -translate-y-full pb-2"
          style={{ left: hoverInfo.x, top: hoverInfo.y }}
        >
          <Card 
            className="min-w-[200px]"
            style={{ 
              background: "var(--paper)", 
              border: "1px solid var(--border)",
              borderRadius: "2px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.12)"
            }}
          >
            <Card.Content className="p-3 text-sm flex flex-col gap-1.5">
              <h4 
                className="font-serif font-semibold mb-1"
                style={{ fontSize: "0.9rem", color: "var(--ink)", lineHeight: 1.2 }}
              >
                {hoverInfo.feature.state_name || hoverInfo.feature.name}
              </h4>
              {hoverInfo.feature.investors_per_lakh !== undefined ? (
                <>
                  <div className="flex justify-between gap-6">
                    <span className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>Investors / Lakh</span>
                    <span className="font-mono text-xs font-medium" style={{ color: "var(--accent)" }}>
                      {hoverInfo.feature.investors_per_lakh?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>Per Capita Income</span>
                    <span className="font-mono text-xs font-medium" style={{ color: "var(--ink)" }}>
                      ₹{hoverInfo.feature.per_capita_income_2011?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between gap-6">
                    <span className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>Population</span>
                    <span className="font-mono text-xs font-medium" style={{ color: "var(--ink)" }}>
                      {(hoverInfo.feature.total_population / 1e6).toFixed(1)}M
                    </span>
                  </div>
                </>
              ) : (
                <span className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>No data available</span>
              )}
            </Card.Content>
          </Card>
        </div>
      )}
    </div>
  );
}
