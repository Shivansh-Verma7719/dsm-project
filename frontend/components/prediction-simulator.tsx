"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Slider, ProgressBar, Select, Label, ListBox } from "@heroui/react";

// ── Feature importance from predictive_feature_importance.csv ────────────
// Normalized per-model (max=1.0). Negative = negative impact.
const FEATURE_WEIGHTS: Record<string, [number, number, number]> = {
  // key: [participation, securities_choice, duration]
  monthly_income_rs:           [0.46, 0.11,  1.00],
  education_years:             [1.00, 0.24,  0.43],
  is_urban:                    [0.03, 0.03, -0.06],
  gender:                      [0.28, 0.01,  0.35],
  risk_tolerance_preference:   [0.00, -0.05, 0.45],
  stock_market_familiarity:    [0.00, 1.00, -0.04],
  actual_knowledge_score:      [0.00, 0.77,  0.71],
  info_social_media:           [0.00, -0.52, -0.01],
  info_professionals:          [0.00, -0.34,  0.03],
};

// ── K-Means cluster centroids (from advanced_archetypes.csv) ─────────────
const ARCHETYPES = [
  {
    name: "Risk-Seeking Trader",
    description: "High exposure to derivatives and equities. Every investment is a bet, not a plan.",
    color: "var(--data-4)",
    icon: "▲",
    centroid: { risk_tolerance_preference: 2.05, stock_market_familiarity: 4, actual_knowledge_score: 5, info_social_media: 0.7, info_professionals: 0.2 },
    assets: [
      { name: "F&O",    pct: 100 },
      { name: "Equity", pct: 63 },
      { name: "FD",     pct: 65 },
      { name: "MF",     pct: 54 },
    ],
    income: 45000,
    education: 16,
  },
  {
    name: "MF-First Builder",
    description: "100% MF penetration. Systematic, diversified. Low risk tolerance, professional-advised.",
    color: "var(--data-1)",
    icon: "◆",
    centroid: { risk_tolerance_preference: 1.90, stock_market_familiarity: 3, actual_knowledge_score: 6, info_social_media: 0.1, info_professionals: 0.8 },
    assets: [
      { name: "MF",     pct: 100 },
      { name: "FD",     pct: 59 },
      { name: "Equity", pct: 31 },
      { name: "F&O",    pct: 0 },
    ],
    income: 35000,
    education: 16,
  },
  {
    name: "Equity Direct",
    description: "Pure direct equity ownership. Zero MF exposure. Self-directed, moderate knowledge.",
    color: "var(--data-3)",
    icon: "●",
    centroid: { risk_tolerance_preference: 1.94, stock_market_familiarity: 3.5, actual_knowledge_score: 5.5, info_social_media: 0.1, info_professionals: 0.2 },
    assets: [
      { name: "Equity", pct: 84 },
      { name: "FD",     pct: 52 },
      { name: "MF",     pct: 0 },
      { name: "F&O",    pct: 0 },
    ],
    income: 35000,
    education: 16,
  },
];

// Euclidean distance between simulator inputs and archetype centroid
function classifyArchetype(inputs: typeof DEFAULT_INPUTS) {
  const normalize = (v: number, min: number, max: number) => (v - min) / (max - min);
  const features = (inp: typeof DEFAULT_INPUTS | typeof ARCHETYPES[0]["centroid"]) => [
    normalize(("risk_tolerance_preference" in inp ? inp.risk_tolerance_preference : 0), 1, 3),
    normalize(("stock_market_familiarity" in inp ? inp.stock_market_familiarity : 0), 1, 5),
    normalize(("actual_knowledge_score" in inp ? inp.actual_knowledge_score : 0), 0, 9),
    normalize(("info_social_media" in inp ? inp.info_social_media : 0), 0, 1),
    normalize(("info_professionals" in inp ? inp.info_professionals : 0), 0, 1),
  ];

  const userVec = features(inputs);
  let minDist = Infinity;
  let bestIdx = 0;
  ARCHETYPES.forEach((arch, i) => {
    const archVec = features(arch.centroid);
    const dist = Math.sqrt(userVec.reduce((sum, v, j) => sum + (v - archVec[j]) ** 2, 0));
    if (dist < minDist) { minDist = dist; bestIdx = i; }
  });
  return bestIdx;
};

// ── WeightDots — 3 micro-dots per feature showing model importance ────────
function WeightDots({ featureKey }: { featureKey: string }) {
  const weights = FEATURE_WEIGHTS[featureKey] ?? [0, 0, 0];
  const colors = ["var(--data-1)", "var(--data-2)", "var(--data-3)"];
  const labels = ["P", "S", "H"];

  return (
    <span className="inline-flex items-center gap-1 ml-2" title="Model importance: Participation / Securities / Horizon">
      {weights.map((w, i) => {
        const abs = Math.abs(w);
        const isNeg = w < 0;
        const size = abs < 0.15 ? 4 : abs < 0.5 ? 6 : abs < 0.8 ? 8 : 10;
        return (
          <span
            key={i}
            title={`${labels[i]}: ${w > 0 ? "+" : ""}${(w * 100).toFixed(0)}%`}
            style={{
              display: "inline-block",
              width: size,
              height: size,
              borderRadius: "50%",
              background: abs < 0.05 ? "var(--border)" : isNeg ? "var(--data-4)" : colors[i],
              opacity: abs < 0.05 ? 0.4 : 0.85,
              transition: "all 0.2s",
            }}
          />
        );
      })}
    </span>
  );
}

// ── GaugeBar ─────────────────────────────────────────────────────────────
function GaugeBar({ label, description, value, loading, color, ariaLabel }: {
  label: string; description: string; value: number; loading: boolean; color?: string; ariaLabel: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="gauge-label">{label}</span>
        <span className="gauge-value" style={{ color: color ?? "var(--ink)" }}>
          {loading ? "—" : `${value.toFixed(1)}%`}
        </span>
      </div>
      <ProgressBar value={value} isIndeterminate={loading} aria-label={ariaLabel} className="h-1.5">
        <ProgressBar.Track>
          <ProgressBar.Fill style={{ background: color ?? "var(--data-1)" }} />
        </ProgressBar.Track>
      </ProgressBar>
      <p className="font-mono text-xs" style={{ color: "var(--ink-3)", lineHeight: 1.5 }}>{description}</p>
    </div>
  );
}

// ── InputSection ──────────────────────────────────────────────────────────
function InputSection({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: color, flexShrink: 0 }} />
        <span className="font-mono text-xs font-medium uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

// ── Archetype Mirror panel ────────────────────────────────────────────────
function ArchetypeMirror({ archetypeIdx, loading }: { archetypeIdx: number; loading: boolean }) {
  const arch = ARCHETYPES[archetypeIdx];
  return (
    <div
      className="mt-6 pt-6 space-y-3"
      style={{ borderTop: "1px solid var(--border)", transition: "opacity 0.3s", opacity: loading ? 0.5 : 1 }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>Investor Archetype</span>
      </div>
      <div className="flex items-center gap-3">
        <span style={{ fontSize: "1.2rem", color: arch.color, lineHeight: 1 }}>{arch.icon}</span>
        <span className="font-serif font-semibold" style={{ fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.2 }}>
          {arch.name}
        </span>
      </div>
      <p className="font-mono text-xs" style={{ color: "var(--ink-3)", lineHeight: 1.55 }}>{arch.description}</p>

      {/* Asset fingerprint */}
      <div className="space-y-1.5 pt-1">
        {arch.assets.map(a => (
          <div key={a.name} className="flex items-center gap-2">
            <span className="font-mono text-xs shrink-0" style={{ width: 40, color: "var(--ink-3)" }}>{a.name}</span>
            <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
              <div
                style={{
                  width: `${a.pct}%`,
                  height: "100%",
                  background: arch.color,
                  borderRadius: 2,
                  transition: "width 0.4s cubic-bezier(0.16,1,0.3,1)",
                }}
              />
            </div>
            <span className="font-mono text-xs shrink-0" style={{ width: 30, color: "var(--ink-3)", textAlign: "right" }}>
              {a.pct}%
            </span>
          </div>
        ))}
      </div>
      <p className="font-mono" style={{ fontSize: "0.6rem", color: "var(--ink-3)", marginTop: 6 }}>
        Classified via nearest-centroid K-Means (k=3) on behavioral inputs
      </p>
    </div>
  );
}

// ── Weight legend ─────────────────────────────────────────────────────────
function WeightLegend() {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>Dots: model weight</span>
      {[["var(--data-1)", "P = Participation"], ["var(--data-2)", "S = Securities"], ["var(--data-3)", "H = Horizon"]].map(([c, l]) => (
        <div key={l} className="flex items-center gap-1">
          <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: c }} />
          <span className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>{l}</span>
        </div>
      ))}
      <span className="font-mono text-xs" style={{ color: "var(--data-4)" }}>● = negative weight</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
const DEFAULT_INPUTS = {
  monthly_income_rs: 50000,
  education_years: 15,
  is_urban: 1.0,
  gender: 1.0,
  risk_tolerance_preference: 3.0,
  stock_market_familiarity: 3.0,
  actual_knowledge_score: 5.0,
  info_social_media: 0.0,
  info_professionals: 1.0,
};

export function PredictionSimulator() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [predictions, setPredictions] = useState({
    participation_probability: 0,
    securities_probability: 0,
    long_term_duration_probability: 0,
  });
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Live archetype classification (pure client-side)
  const archetypeIdx = useMemo(() => classifyArchetype(inputs), [inputs]);

  useEffect(() => {
    const id = setTimeout(fetchPredictions, 300);
    return () => clearTimeout(id);
  }, [inputs]);

  const fetchPredictions = async () => {
    setLoading(true);
    setHasError(false);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data) setPredictions(data);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: any) =>
    setInputs(prev => ({ ...prev, [key]: Number(value) }));
  const handleReset = () => setInputs(DEFAULT_INPUTS);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-px" style={{ background: "var(--border)" }}>

      {/* ── Input panel ────────────────────────────────────────────────── */}
      <div className="lg:col-span-2 p-6 space-y-6" style={{ background: "var(--paper-2)" }}>
        <WeightLegend />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <InputSection label="Socioeconomic Factors" color="var(--data-1)">

            <Slider step={5000} maxValue={200000} minValue={5000}
              value={inputs.monthly_income_rs}
              onChange={v => handleChange("monthly_income_rs", v)}
              formatOptions={{ style: "currency", currency: "INR" }}
              className="max-w-md"
            >
              <Label>
                Monthly Income <WeightDots featureKey="monthly_income_rs" />
              </Label>
              <Slider.Output />
              <Slider.Track><Slider.Fill /><Slider.Thumb /></Slider.Track>
            </Slider>

            <Slider step={1} maxValue={20} minValue={0}
              value={inputs.education_years}
              onChange={v => handleChange("education_years", v)}
              className="max-w-md"
            >
              <Label>
                Years of Education <WeightDots featureKey="education_years" />
              </Label>
              <Slider.Output />
              <Slider.Track><Slider.Fill /><Slider.Thumb /></Slider.Track>
            </Slider>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <Select className="w-full" value={String(inputs.is_urban)} onChange={k => handleChange("is_urban", k)}>
                <Label>Location <WeightDots featureKey="is_urban" /></Label>
                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="1" textValue="Urban">Urban<ListBox.ItemIndicator /></ListBox.Item>
                    <ListBox.Item id="0" textValue="Rural">Rural<ListBox.ItemIndicator /></ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select className="w-full" value={String(inputs.gender)} onChange={k => handleChange("gender", k)}>
                <Label>Gender <WeightDots featureKey="gender" /></Label>
                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="1" textValue="Male">Male<ListBox.ItemIndicator /></ListBox.Item>
                    <ListBox.Item id="0" textValue="Female">Female<ListBox.ItemIndicator /></ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </InputSection>

          <InputSection label="Behavioral Factors" color="var(--data-2)">

            <Slider step={1} maxValue={9} minValue={0}
              value={inputs.actual_knowledge_score}
              onChange={v => handleChange("actual_knowledge_score", v)}
              className="max-w-md"
            >
              <Label>
                Financial Literacy Score <WeightDots featureKey="actual_knowledge_score" />
                <span className="font-normal ml-1" style={{ color: "var(--ink-3)" }}>(0–9)</span>
              </Label>
              <Slider.Output />
              <Slider.Track><Slider.Fill /><Slider.Thumb /></Slider.Track>
            </Slider>

            <Slider step={1} maxValue={5} minValue={1}
              value={inputs.stock_market_familiarity}
              onChange={v => handleChange("stock_market_familiarity", v)}
              className="max-w-md"
            >
              <Label>
                Self-Perceived Familiarity <WeightDots featureKey="stock_market_familiarity" />
                <span className="font-normal ml-1" style={{ color: "var(--ink-3)" }}>(1–5)</span>
              </Label>
              <Slider.Output />
              <Slider.Track><Slider.Fill /><Slider.Thumb /></Slider.Track>
            </Slider>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <Select className="w-full" value={String(inputs.info_social_media)} onChange={k => handleChange("info_social_media", k)}>
                <Label>Social Media <WeightDots featureKey="info_social_media" /></Label>
                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="1" textValue="Finfluencers">Finfluencers<ListBox.ItemIndicator /></ListBox.Item>
                    <ListBox.Item id="0" textValue="No">No<ListBox.ItemIndicator /></ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>

              <Select className="w-full" value={String(inputs.info_professionals)} onChange={k => handleChange("info_professionals", k)}>
                <Label>Professionals <WeightDots featureKey="info_professionals" /></Label>
                <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="1" textValue="Yes, Advisors">Yes, Advisors<ListBox.ItemIndicator /></ListBox.Item>
                    <ListBox.Item id="0" textValue="No">No<ListBox.ItemIndicator /></ListBox.Item>
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>
          </InputSection>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <button
            onClick={handleReset}
            className="font-mono text-xs transition-colors"
            style={{ color: "var(--ink-3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--ink-3)")}
          >
            Reset to defaults
          </button>
        </div>

        {/* Archetype Mirror shifted here from the right panel */}
        <div>
          <ArchetypeMirror archetypeIdx={archetypeIdx} loading={loading} />
        </div>
      </div>

      {/* ── Prediction + Archetype panel ────────────────────────────────── */}
      <div className="p-6 space-y-6" style={{ background: "var(--paper-3)" }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: hasError ? "var(--data-4)" : loading ? "var(--data-2)" : "var(--data-3)",
                transition: "background 0.3s",
              }}
            />
            <span className="font-mono text-xs uppercase tracking-widest" style={{ color: "var(--ink-3)" }}>
              {hasError ? "Service unavailable" : loading ? "Computing..." : "Live Predictions"}
            </span>
          </div>
          <p className="font-mono text-xs" style={{ color: "var(--ink-3)", lineHeight: 1.5 }}>
            {hasError ? "Cannot reach the prediction service." : "Outputs update 300ms after changes."}
          </p>
        </div>

        {hasError ? (
          <div className="rounded-sm p-4 font-mono text-xs space-y-2"
            style={{ background: "var(--paper-2)", border: "1px solid var(--border)", color: "var(--ink-3)", lineHeight: 1.6 }}
          >
            <p style={{ color: "var(--data-4)", fontWeight: 500 }}>Prediction service is offline.</p>
            <p>Start the backend:</p>
            <code className="block px-3 py-2" style={{ background: "var(--paper-3)", borderRadius: 2, color: "var(--ink-2)" }}>
              uvicorn main:app --reload
            </code>
          </div>
        ) : (
          <div className="space-y-6" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
            <GaugeBar label="Market Participation" description="Likelihood of holding any securities"
              value={predictions.participation_probability * 100} loading={loading}
              color="var(--data-1)" ariaLabel="Market Participation Probability" />
            <GaugeBar label="Market-Linked Choice" description="Equity / MF vs. traditional instruments"
              value={predictions.securities_probability * 100} loading={loading}
              color="var(--data-2)" ariaLabel="Securities Choice" />
            <GaugeBar label="Long-Term Horizon" description="Holding horizon of more than 3 years"
              value={predictions.long_term_duration_probability * 100} loading={loading}
              color="var(--data-3)" ariaLabel="Long-Term Holding Horizon" />
          </div>
        )}

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <p className="font-mono text-xs" style={{ color: "var(--ink-3)", lineHeight: 1.6 }}>
            Models: Gradient Boosting (all three). AUC: 76.1% / 77.8% / 61.1%
          </p>
        </div>
      </div>
    </div>
  );
}

// Export inputs state for use by ParticipationFrontier
export { DEFAULT_INPUTS };
export type SimulatorInputs = typeof DEFAULT_INPUTS;
