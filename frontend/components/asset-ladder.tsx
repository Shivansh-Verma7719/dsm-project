"use client";

import React, { useState } from "react";

// Asset penetration by income quartile from which_securities_by_income.csv
const QUARTILES = [
  {
    label: "Q1",
    range: "up to ₹17.5k",
    assets: [
      { name: "MF / ETF",    pct: 67.6, color: "var(--data-1)" },
      { name: "FD / RD",     pct: 52.6, color: "var(--data-3)" },
      { name: "Equity",      pct: 41.8, color: "var(--data-2)" },
      { name: "ULIP",        pct: 34.8, color: "var(--data-5)" },
      { name: "Gold",        pct: 14.8, color: "oklch(0.75 0.14 75)" },
      { name: "Post Office", pct: 16.1, color: "var(--ink-3)" },
      { name: "Real Estate", pct:  3.8, color: "var(--ink-3)" },
    ],
  },
  {
    label: "Q2",
    range: "₹17.5k – ₹35k",
    assets: [
      { name: "MF / ETF",    pct: 65.3, color: "var(--data-1)" },
      { name: "FD / RD",     pct: 57.9, color: "var(--data-3)" },
      { name: "Equity",      pct: 49.7, color: "var(--data-2)" },
      { name: "ULIP",        pct: 37.0, color: "var(--data-5)" },
      { name: "Gold",        pct: 18.9, color: "oklch(0.75 0.14 75)" },
      { name: "Post Office", pct: 15.7, color: "var(--ink-3)" },
      { name: "Real Estate", pct:  5.1, color: "var(--ink-3)" },
    ],
  },
  {
    label: "Q3",
    range: "₹35k – ₹45k",
    assets: [
      { name: "MF / ETF",    pct: 67.1, color: "var(--data-1)" },
      { name: "FD / RD",     pct: 60.2, color: "var(--data-3)" },
      { name: "Equity",      pct: 53.6, color: "var(--data-2)" },
      { name: "ULIP",        pct: 44.0, color: "var(--data-5)" },
      { name: "Gold",        pct: 21.8, color: "oklch(0.75 0.14 75)" },
      { name: "Post Office", pct: 17.7, color: "var(--ink-3)" },
      { name: "Real Estate", pct:  8.6, color: "var(--ink-3)" },
    ],
  },
  {
    label: "Q4",
    range: "above ₹45k",
    assets: [
      { name: "MF / ETF",    pct: 68.6, color: "var(--data-1)" },
      { name: "FD / RD",     pct: 59.2, color: "var(--data-3)" },
      { name: "Equity",      pct: 54.0, color: "var(--data-2)" },
      { name: "ULIP",        pct: 45.5, color: "var(--data-5)" },
      { name: "Gold",        pct: 27.3, color: "oklch(0.75 0.14 75)" },
      { name: "Post Office", pct: 17.1, color: "var(--ink-3)" },
      { name: "Real Estate", pct: 13.3, color: "var(--ink-3)" },
    ],
  },
];

export function AssetLadder() {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--paper-2)" }}>
      <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <p className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "var(--ink-3)" }}>
          Among investing households only
        </p>
        <p style={{ fontSize: "0.82rem", color: "var(--ink-3)", lineHeight: 1.6, maxWidth: "60ch" }}>
          What do investors actually hold? Climb the income ladder to see how the portfolio shifts
          from safety-first instruments toward growth-oriented assets. Click any rung to expand.
        </p>
      </div>

      <div className="p-6 space-y-1">
        {QUARTILES.map((q, qi) => {
          const isOpen = expanded === qi;
          // Sort by pct desc for the strip
          const sorted = [...q.assets].sort((a, b) => b.pct - a.pct);
          const top3 = sorted.slice(0, 3);

          return (
            <div key={qi}>
              <button
                onClick={() => setExpanded(isOpen ? null : qi)}
                className="w-full text-left"
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                aria-expanded={isOpen}
              >
                <div
                  className="flex items-start gap-4 px-4 py-3 transition-colors"
                  style={{
                    background: isOpen ? "var(--paper-3)" : "var(--paper-2)",
                    border: "1px solid var(--border)",
                    borderBottom: isOpen ? "none" : "1px solid var(--border)",
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "var(--paper-3)"; }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = "var(--paper-2)"; }}
                >
                  {/* Rung label */}
                  <div className="shrink-0 w-8 pt-0.5">
                    <span className="font-mono text-sm font-medium" style={{ color: "var(--accent)" }}>{q.label}</span>
                  </div>
                  <div className="shrink-0 w-32 pt-1">
                    <span className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>{q.range}</span>
                  </div>

                  {/* Quick strip stacked: Top 2 then Equity */}
                  <div className="flex-1 flex flex-col gap-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      {top3.slice(0, 2).map(a => (
                        <div key={a.name} className="flex items-center gap-1.5">
                          <div style={{ width: 48, height: 3, background: "var(--border)", borderRadius: 1.5, overflow: "hidden" }}>
                            <div style={{ width: `${a.pct}%`, height: "100%", background: a.color, borderRadius: 1.5 }} />
                          </div>
                          <span className="font-mono" style={{ fontSize: "0.65rem", color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                            {a.name} {a.pct.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {top3.slice(2, 3).map(a => (
                        <div key={a.name} className="flex items-center gap-1.5">
                          <div style={{ width: 48, height: 3, background: "var(--border)", borderRadius: 1.5, overflow: "hidden" }}>
                            <div style={{ width: `${a.pct}%`, height: "100%", background: a.color, borderRadius: 1.5 }} />
                          </div>
                          <span className="font-mono" style={{ fontSize: "0.65rem", color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                            {a.name} {a.pct.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expand indicator */}
                  <div className="shrink-0 pt-1">
                    <span
                      className="font-mono text-xs block"
                      style={{ color: "var(--ink-3)", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
                    >
                      ↓
                    </span>
                  </div>
                </div>
              </button>

              {/* Expanded view */}
              {isOpen && (
                <div
                  className="px-6 py-4 space-y-2.5"
                  style={{ background: "var(--paper-3)", border: "1px solid var(--border)", borderTop: "none" }}
                >
                  {sorted.map(a => (
                    <div key={a.name} className="flex items-center gap-3">
                      <span
                        className="font-mono text-xs shrink-0"
                        style={{ width: 80, color: "var(--ink-2)" }}
                      >
                        {a.name}
                      </span>
                      <div style={{ flex: 1, height: 6, background: "var(--border)", borderRadius: 2, overflow: "hidden", maxWidth: 260 }}>
                        <div
                          style={{
                            width: `${a.pct}%`,
                            height: "100%",
                            background: a.color,
                            borderRadius: 2,
                            transition: "width 0.4s cubic-bezier(0.16,1,0.3,1)",
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs shrink-0" style={{ color: "var(--ink-2)", width: 40 }}>
                        {a.pct.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                  <p className="font-mono text-xs mt-3 pt-3" style={{ borderTop: "1px solid var(--border)", color: "var(--ink-3)" }}>
                    Penetration among investing households in this income band. Gold and real estate scale with wealth. FDs remain high across all quartiles.
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Subtle insight callout */}
        <div
          className="mt-4 px-4 py-3 font-mono text-xs"
          style={{ background: "var(--accent-bg)", border: "1px solid var(--border)", color: "var(--ink-3)", lineHeight: 1.65 }}
        >
          MF / ETF penetration stays remarkably flat across income bands (65–69%). Equity and alternative assets
          scale more sharply — suggesting MFs serve as the baseline vehicle while wealth enables diversification into direct equities and real estate.
        </div>
      </div>
    </div>
  );
}
