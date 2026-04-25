"use client";

import React from "react";

const kpis = [
  {
    value: "35",
    unit: "states",
    label: "Geographic Scope",
    delta: "+3 UTs included",
    deltaUp: true,
  },
  {
    value: "6,200",
    unit: "households",
    label: "Survey Sample",
    delta: "Stratified random",
    deltaUp: null,
  },
  {
    value: "76.1%",
    unit: "AUC",
    label: "Participation Model",
    delta: "Random Forest",
    deltaUp: true,
  },
  {
    value: "77.8%",
    unit: "AUC",
    label: "Securities Choice Model",
    delta: "Gradient Boosting",
    deltaUp: true,
  },
  {
    value: "61.1%",
    unit: "AUC",
    label: "Horizon Model",
    delta: "Logistic Regression",
    deltaUp: null,
  },
];

export function KpiStrip() {
  return (
    <div 
      className="grid gap-px"
      style={{ 
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        background: "var(--border)",
      }}
    >
      {kpis.map((kpi, i) => (
        <div
          key={i}
          className="flex flex-col gap-1 p-5"
          style={{ background: "var(--paper-2)" }}
        >
          <span className="kpi-label">{kpi.label}</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="kpi-number">{kpi.value}</span>
            <span 
              className="font-mono text-xs"
              style={{ color: "var(--ink-3)" }}
            >
              {kpi.unit}
            </span>
          </div>
          <span 
            className="kpi-delta mt-1"
            style={{ 
              color: kpi.deltaUp === true 
                ? "var(--data-3)" 
                : kpi.deltaUp === false 
                  ? "var(--data-4)" 
                  : "var(--ink-3)" 
            }}
          >
            {kpi.deltaUp === true && "↑ "}
            {kpi.deltaUp === false && "↓ "}
            {kpi.delta}
          </span>
        </div>
      ))}
    </div>
  );
}
