"use client";

import React, { useState, useEffect, useCallback } from "react";

type GridData = {
  grid: number[][];
  incomes: number[];
  educations: number[];
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

// Interpolate between two hex colors using t [0..1]
function colorScale(t: number): string {
  // Low prob = warm grey, medium = light amber, high = deep navy
  if (t < 0.5) {
    const u = t * 2;
    // grey #d4d0c9 → amber-light #e8c48a
    const r = Math.round(lerp(212, 232, u));
    const g = Math.round(lerp(208, 196, u));
    const b = Math.round(lerp(201, 138, u));
    return `rgb(${r},${g},${b})`;
  } else {
    const u = (t - 0.5) * 2;
    // amber-light → deep navy #2a4b8c
    const r = Math.round(lerp(232, 42, u));
    const g = Math.round(lerp(196, 75, u));
    const b = Math.round(lerp(138, 140, u));
    return `rgb(${r},${g},${b})`;
  }
}

function textContrast(t: number) {
  return t > 0.5 ? "rgba(245,243,239,0.9)" : "rgba(17,20,24,0.7)";
}

export function ParticipationFrontier({
  incomeValue,
  educationValue,
}: {
  incomeValue: number;
  educationValue: number;
}) {
  const [data, setData] = useState<GridData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tooltip, setTooltip] = useState<{ inc: number; edu: number; prob: number; x: number; y: number } | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/participation-grid`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  // Find the closest grid cell for the current user inputs
  const getUserCell = useCallback(() => {
    if (!data || !Array.isArray(data.incomes) || !Array.isArray(data.educations)) return null;
    const incIdx = data.incomes.reduce((best, inc, i) =>
      Math.abs(inc - incomeValue) < Math.abs(data.incomes[best] - incomeValue) ? i : best, 0);
    const eduIdx = data.educations.reduce((best, edu, i) =>
      Math.abs(edu - educationValue) < Math.abs(data.educations[best] - educationValue) ? i : best, 0);
    return { incIdx, eduIdx, prob: data.grid[eduIdx][incIdx] };
  }, [data, incomeValue, educationValue]);

  const userCell = getUserCell();

  const CELL_SIZE = 44; // px per cell

  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: 340, background: "var(--paper-3)", border: "1px solid var(--border)" }}
      >
        <p className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>Building participation landscape...</p>
      </div>
    );
  }

  if (error || !data || !Array.isArray(data.incomes)) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: 340, background: "var(--paper-3)", border: "1px solid var(--border)" }}
      >
        <p className="font-mono text-xs" style={{ color: "var(--data-4)" }}>Backend unavailable — start uvicorn to see frontier</p>
      </div>
    );
  }

  const rows = data.educations.length;
  const cols = data.incomes.length;
  const svgW = cols * CELL_SIZE;
  const svgH = rows * CELL_SIZE;
  const PAD_LEFT = 52;
  const PAD_BOTTOM = 32;

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--paper-2)" }}>
      <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "var(--ink-3)" }}>
          Where is the threshold?
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--ink-3)", lineHeight: 1.6, maxWidth: "60ch" }}>
          Predicted participation probability varying income (X) and education (Y), holding all other
          inputs at sample medians. Your current simulator position is marked with a ring.
        </p>
      </div>

      <div className="p-4 md:p-6 overflow-x-auto">
        <svg
          width={svgW + PAD_LEFT + 8}
          height={svgH + PAD_BOTTOM + 8}
          style={{ display: "block", fontFamily: "'DM Mono', monospace", overflow: "visible" }}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Y-axis labels (education) — rows are edu, top=high */}
          {data.educations.map((edu, ri) => {
            const y = ri * CELL_SIZE + CELL_SIZE / 2;
            return (
              <text
                key={ri}
                x={PAD_LEFT - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={9}
                fill="var(--ink-3)"
              >
                {edu}yr
              </text>
            );
          })}

          {/* X-axis labels (income) */}
          {data.incomes.map((inc, ci) => {
            const x = PAD_LEFT + ci * CELL_SIZE + CELL_SIZE / 2;
            const label = inc >= 100000 ? `₹${(inc / 100000).toFixed(0)}L` : `₹${(inc / 1000).toFixed(0)}k`;
            return (
              <text
                key={ci}
                x={x}
                y={svgH + PAD_BOTTOM - 2}
                textAnchor="middle"
                fontSize={8.5}
                fill="var(--ink-3)"
              >
                {label}
              </text>
            );
          })}

          {/* Axis labels */}
          <text
            x={PAD_LEFT - 40}
            y={svgH / 2}
            textAnchor="middle"
            fontSize={9}
            fill="var(--ink-3)"
            transform={`rotate(-90, ${PAD_LEFT - 40}, ${svgH / 2})`}
          >
            Education (yrs)
          </text>
          <text
            x={PAD_LEFT + svgW / 2}
            y={svgH + PAD_BOTTOM + 4}
            textAnchor="middle"
            fontSize={9}
            fill="var(--ink-3)"
          >
            Monthly Income
          </text>

          {/* Heat cells */}
          <g transform={`translate(${PAD_LEFT}, 0)`}>
            {data.grid.map((row, ri) =>
              row.map((prob, ci) => {
                const isUser = userCell && ri === userCell.eduIdx && ci === userCell.incIdx;
                return (
                  <g key={`${ri}-${ci}`}>
                    <rect
                      x={ci * CELL_SIZE}
                      y={ri * CELL_SIZE}
                      width={CELL_SIZE}
                      height={CELL_SIZE}
                      fill={colorScale(prob)}
                      stroke="var(--paper-2)"
                      strokeWidth={1}
                      style={{ cursor: "crosshair" }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({ inc: data.incomes[ci], edu: data.educations[ri], prob, x: rect.left, y: rect.top });
                      }}
                    />
                    {/* 50% contour label on cells crossing ~0.5 */}
                    {prob >= 0.48 && prob <= 0.52 && (
                      <text
                        x={ci * CELL_SIZE + CELL_SIZE / 2}
                        y={ri * CELL_SIZE + CELL_SIZE / 2 + 4}
                        textAnchor="middle"
                        fontSize={8}
                        fontWeight={600}
                        fill="rgba(255,255,255,0.9)"
                      >
                        50%
                      </text>
                    )}
                    {/* Probability text in each cell */}
                    <text
                      x={ci * CELL_SIZE + CELL_SIZE / 2}
                      y={ri * CELL_SIZE + CELL_SIZE / 2 + (prob >= 0.48 && prob <= 0.52 ? -3 : 4)}
                      textAnchor="middle"
                      fontSize={9}
                      fill={textContrast(prob)}
                    >
                      {(prob * 100).toFixed(0)}%
                    </text>
                    {/* User position ring */}
                    {isUser && (
                      <rect
                        x={ci * CELL_SIZE + 2}
                        y={ri * CELL_SIZE + 2}
                        width={CELL_SIZE - 4}
                        height={CELL_SIZE - 4}
                        fill="none"
                        stroke="white"
                        strokeWidth={2.5}
                        style={{ pointerEvents: "none" }}
                      />
                    )}
                  </g>
                );
              })
            )}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed pointer-events-none z-50 font-mono text-xs px-3 py-2"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y - 50,
              background: "var(--ink)",
              color: "var(--paper)",
              border: "1px solid var(--border-2)",
            }}
          >
            <div>Income: ₹{tooltip.inc.toLocaleString()}</div>
            <div>Education: {tooltip.edu}yr</div>
            <div style={{ color: "var(--accent)", fontWeight: 500 }}>P(participate): {(tooltip.prob * 100).toFixed(1)}%</div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-3 mt-3">
          <span className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>Low</span>
          <div style={{ width: 120, height: 8, background: "linear-gradient(to right, rgb(212,208,201), rgb(232,196,138), rgb(42,75,140))", border: "1px solid var(--border)" }} />
          <span className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>High</span>
          <span className="font-mono text-xs ml-4" style={{ color: "var(--ink-3)" }}>
            ◻ = your current simulator position
          </span>
        </div>
      </div>
    </div>
  );
}
