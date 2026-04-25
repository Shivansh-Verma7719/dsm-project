"use client";

import React from "react";

// Barrier data from who_participates_barriers.csv
// Categorized: behavioral (amber) vs structural (navy)
const BARRIERS = [
  { key: "fear_of_loss",          label: "Fear of Loss",          pct: 4.83, type: "behavioral" },
  { key: "lack_knowledge",        label: "Lack of Knowledge",     pct: 4.17, type: "behavioral" },
  { key: "lack_trust",            label: "Lack of Trust",         pct: 3.93, type: "behavioral" },
  { key: "dont_know_how",         label: "Don't Know How",        pct: 3.48, type: "behavioral" },
  { key: "regulatory_concerns",   label: "Regulatory Concerns",   pct: 2.80, type: "structural" },
  { key: "info_overload",         label: "Information Overload",  pct: 2.75, type: "behavioral" },
  { key: "uncertain_returns",     label: "Uncertain Returns",     pct: 2.51, type: "behavioral" },
  { key: "large_capital_needed",  label: "Capital Needed",        pct: 2.48, type: "structural" },
  { key: "long_term_lock_in",     label: "Long-Term Lock-in",     pct: 2.47, type: "structural" },
  { key: "too_many_options",      label: "Too Many Options",      pct: 2.15, type: "behavioral" },
  { key: "better_alternatives",   label: "Better Alternatives",   pct: 2.09, type: "structural" },
  { key: "high_fees",             label: "High Fees",             pct: 1.87, type: "structural" },
  { key: "insufficient_funds",    label: "Insufficient Funds",    pct: 1.54, type: "structural" },
  { key: "family_advice_against", label: "Family Advice",         pct: 1.02, type: "behavioral" },
  { key: "liquidity_concerns",    label: "Liquidity Concerns",    pct: 0.77, type: "structural" },
  { key: "time_commitment",       label: "Time Commitment",       pct: 0.74, type: "structural" },
  { key: "documentation_burden",  label: "Documentation",         pct: 0.61, type: "structural" },
  { key: "language_barrier",      label: "Language Barrier",      pct: 0.33, type: "structural" },
];

const DESCRIPTIONS: Record<string, string> = {
  fear_of_loss:          "The top barrier — loss aversion outweighs potential gains even before any investment is made.",
  lack_knowledge:        "Cited by 4.2% of all non-investors. Digital platforms solved access, but knowledge gaps remain.",
  lack_trust:            "Distrust of brokers, platforms, and regulatory bodies keeps many households on the sidelines.",
  dont_know_how:         "Procedural friction: even willing investors don't know where to start.",
  regulatory_concerns:   "Concerns about complexity of tax, compliance, and regulatory rules.",
  info_overload:         "Paradox of choice — too much conflicting information leads to inaction.",
  uncertain_returns:     "Preference for guaranteed returns (FDs) over market-variable outcomes.",
  large_capital_needed:  "A common misperception: many believe large sums are required to begin investing.",
  long_term_lock_in:     "Preference for liquidity over compounding growth. FDs and post office savings win here.",
  too_many_options:      "Proliferation of apps, funds, and products increases decision fatigue.",
  better_alternatives:   "FDs, gold, and real estate perceived as safer with adequate returns.",
  high_fees:             "Brokerage, expense ratios, and DEMAT maintenance fees perceived as significant.",
  insufficient_funds:    "Monthly surplus too small to begin — actual structural barrier, not just perception.",
  family_advice_against: "Social influence of conservative family attitudes around market risk.",
  liquidity_concerns:    "Equity lock-in and settlement cycles create perceived illiquidity.",
  time_commitment:       "Active monitoring perceived as required — passive investing not well-understood.",
  documentation_burden:  "KYC, PAN, nomination, and account opening seen as excessive friction.",
  language_barrier:      "Financial platforms predominantly in English; vernacular coverage is limited.",
};

export function BarrierWall() {
  const [hoveredKey, setHoveredKey] = React.useState<string | null>(null);
  const maxPct = Math.max(...BARRIERS.map(b => b.pct));

  const behavioralTotal = BARRIERS.filter(b => b.type === "behavioral").reduce((s, b) => s + b.pct, 0);
  const structuralTotal = BARRIERS.filter(b => b.type === "structural").reduce((s, b) => s + b.pct, 0);

  const hovered = BARRIERS.find(b => b.key === hoveredKey);

  return (
    <div style={{ border: "1px solid var(--border)", background: "var(--paper-2)" }}>
      {/* Header */}
      <div
        className="px-6 py-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p
              className="font-mono text-xs uppercase tracking-widest mb-2"
              style={{ color: "var(--accent)" }}
            >
              74.5% of Indian households own no securities
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--ink-3)", maxWidth: "55ch", lineHeight: 1.65 }}>
              Each block below represents a self-reported barrier. Area is proportional to prevalence
              among non-investors. Behavioral friction (amber) outweighs structural friction (navy).
            </p>
          </div>
          <div className="flex gap-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5" style={{ background: "var(--accent)", opacity: 0.85 }} />
              <span className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>Behavioral ({behavioralTotal.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5" style={{ background: "var(--data-1)", opacity: 0.75 }} />
              <span className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>Structural ({structuralTotal.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {/* Mosaic grid — proportional block sizes */}
        <div
          className="flex flex-wrap gap-1"
          style={{ alignItems: "flex-start" }}
        >
          {BARRIERS.map((barrier) => {
            // Width as % of max, clamped between 60px and 220px
            const widthPct = (barrier.pct / maxPct) * 100;
            const isHovered = hoveredKey === barrier.key;
            const isActive = hoveredKey === null || isHovered;

            return (
              <button
                key={barrier.key}
                onMouseEnter={() => setHoveredKey(barrier.key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{
                  width: `${Math.max(6, widthPct)}%`,
                  minWidth: 60,
                  padding: "10px 10px",
                  background: barrier.type === "behavioral"
                    ? `oklch(0.65 0.13 55 / ${isHovered ? 1 : isActive ? 0.75 : 0.35})`
                    : `oklch(0.35 0.08 250 / ${isHovered ? 1 : isActive ? 0.75 : 0.35})`,
                  border: isHovered ? "1.5px solid var(--ink-2)" : "1.5px solid transparent",
                  cursor: "default",
                  transition: "background 0.2s, transform 0.15s",
                  transform: isHovered ? "translateY(-2px)" : "none",
                  textAlign: "left",
                }}
                aria-label={`${barrier.label}: ${barrier.pct.toFixed(2)}%`}
              >
                <div
                  className="font-mono text-xs font-medium"
                  style={{
                    color: isHovered ? "var(--ink)" : "var(--ink-2)",
                    lineHeight: 1.3,
                    fontSize: barrier.pct > 3 ? "0.72rem" : "0.65rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {barrier.label}
                </div>
                {barrier.pct > 2.5 && (
                  <div
                    className="font-mono"
                    style={{ fontSize: "0.6rem", color: isHovered ? "var(--ink-2)" : "var(--ink-3)", marginTop: 2 }}
                  >
                    {barrier.pct.toFixed(1)}%
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Hover detail panel */}
        <div
          className="mt-4"
          style={{
            minHeight: 56,
            padding: "12px 16px",
            background: "var(--paper-3)",
            border: "1px solid var(--border)",
            transition: "opacity 0.2s",
            opacity: hovered ? 1 : 0.4,
          }}
        >
          {hovered ? (
            <div className="flex items-start gap-4">
              <span
                className="font-mono shrink-0"
                style={{ fontSize: "1.4rem", fontWeight: 500, color: hovered.type === "behavioral" ? "var(--accent)" : "var(--data-1)", lineHeight: 1 }}
              >
                {hovered.pct.toFixed(2)}%
              </span>
              <div>
                <p className="font-mono text-xs font-medium mb-0.5" style={{ color: "var(--ink-2)" }}>
                  {hovered.label} — {hovered.type}
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--ink-3)", lineHeight: 1.6 }}>
                  {DESCRIPTIONS[hovered.key]}
                </p>
              </div>
            </div>
          ) : (
            <p className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>
              Hover a block to see context
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
