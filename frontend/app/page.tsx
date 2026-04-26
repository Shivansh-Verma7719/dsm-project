"use client";

import React, { useState } from "react";
import { InteractiveMap } from "@/components/interactive-map";
import { PredictionSimulator } from "@/components/prediction-simulator";
import { DunningKrugerChart, FinfluencerChart } from "@/components/native-charts";
import { KpiStrip } from "@/components/kpi-strip";
import { BarrierWall } from "@/components/barrier-wall";
import { ParticipationFrontier } from "@/components/participation-frontier";
import { AssetLadder } from "@/components/asset-ladder";
import { StateMetricsPanel } from "@/components/state-metrics-panel";

// Odds ratio strip — the paper's headline logistic regression findings
function OddsRatioStrip() {
  const ratios = [
    { label: "Product Awareness", ratio: 2.22, note: "per SD increase", color: "var(--data-1)" },
    { label: "Log-Income", ratio: 1.60, note: "per SD increase", color: "var(--data-2)" },
    { label: "Education",  ratio: 1.56, note: "per SD increase", color: "var(--data-3)" },
    { label: "Male",       ratio: 1.53, note: "vs Female",       color: "var(--data-5)" },
  ];

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-px"
      style={{ background: "var(--border)", border: "1px solid var(--border)" }}
    >
      {ratios.map(r => (
        <div
          key={r.label}
          className="px-5 py-4"
          style={{ background: "var(--paper-2)" }}
        >
          <div className="font-mono text-xs uppercase tracking-widest mb-1" style={{ color: "var(--ink-3)" }}>
            {r.label}
          </div>
          <div
            className="font-mono font-semibold"
            style={{ fontSize: "1.6rem", color: r.color, lineHeight: 1, letterSpacing: "-0.02em" }}
          >
            ×{r.ratio.toFixed(2)}
          </div>
          <div className="font-mono text-xs mt-1" style={{ color: "var(--ink-3)" }}>
            odds ratio {r.note}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  // Lifted simulator inputs so Frontier can sync with them
  const [incomeValue, setIncomeValue] = useState(50000);
  const [educationValue, setEducationValue] = useState(15);

  return (
    <div className="flex flex-col" style={{ gap: "clamp(3rem, 6vw, 5rem)" }}>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="animate-fade-up" style={{ paddingTop: "clamp(1rem, 3vw, 2rem)" }}>
        <p className="section-eyebrow mb-3">Empirical Research, India, Spring 2026</p>
        <h1 className="section-title" style={{ maxWidth: "22ch" }}>
          Who participates in India's securities market?
        </h1>
        <p className="section-subtitle mt-4">
          A data-driven analysis of the socioeconomic and behavioral factors driving household
          participation in equities, mutual funds, and derivatives across 35 Indian states and
          union territories. Survey N = 109,430.
        </p>
        <div className="flex flex-wrap gap-2 mt-6" aria-label="Methodology">
          {["Gradient Boosting", "Logistic Regression", "K-Means Clustering", "SEBI Survey 2025", "n = 109,430"].map(tag => (
            <span
              key={tag}
              className="font-mono text-xs px-2 py-1"
              style={{
                background: "var(--paper-3)",
                color: "var(--ink-3)",
                border: "1px solid var(--border)",
                letterSpacing: "0.03em",
                userSelect: "none",
                cursor: "default",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* ── KPI Strip + Odds Ratios ─────────────────────────────────────── */}
      <section className="animate-fade-up animate-delay-1">
        <hr className="section-rule mb-6" />
        <KpiStrip />
        <div className="mt-4">
          <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: "var(--ink-3)" }}>
            Logistic Regression Odds Ratios — Participation Determinants
          </p>
          <OddsRatioStrip />
        </div>
      </section>

      {/* ── Section 01: Geographic Penetration ─────────────────────────── */}
      <section className="animate-fade-up animate-delay-2">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <hr className="section-rule mb-4" style={{ borderColor: "var(--data-1)" }} />
            <p className="section-eyebrow mb-1">Section 01</p>
            <h2 className="section-title" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}>
              Geographic Penetration
            </h2>
            <p className="section-subtitle" style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
              Investor density (UCC per lakh population) mapped across Indian states.
              Hover any state for per-capita income, population, and investment intensity.
            </p>
          </div>
          <div className="shrink-0 hidden md:flex flex-col gap-1 text-right" style={{ paddingTop: "0.25rem" }}>
            <span className="font-mono text-xs" style={{ color: "var(--ink-3)" }}>Source</span>
            <span className="font-mono text-xs" style={{ color: "var(--ink-2)" }}>NSE / SEBI UCC</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <InteractiveMap />
          </div>
          <div className="lg:col-span-2 h-[460px]">
            <StateMetricsPanel />
          </div>
        </div>
      </section>

      {/* ── Section 02: Behavioral Patterns ────────────────────────────── */}
      <section className="animate-fade-up animate-delay-3">
        <hr className="section-rule mb-4" style={{ borderColor: "var(--data-2)" }} />
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <p className="section-eyebrow mb-1">Section 02</p>
            <h2 className="section-title" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}>
              Behavioral and Cognitive Patterns
            </h2>
            <p className="section-subtitle" style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
              Two key behavioral phenomena: the Dunning-Kruger effect on asset risk exposure,
              and the influence of information sources on investment motive.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DunningKrugerChart />
          <FinfluencerChart />
        </div>
      </section>

      {/* ── Section 03: Simulator ───────────────────────────────────────── */}
      <section className="animate-fade-up animate-delay-4">
        <hr className="section-rule mb-4" style={{ borderColor: "var(--data-3)" }} />
        <div className="mb-6">
          <p className="section-eyebrow mb-1">Section 03, Interactive</p>
          <h2 className="section-title" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}>
            Household Profile Simulator
          </h2>
          <p className="section-subtitle" style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
            Adjust inputs to see live model predictions and your investor archetype.
            Dot indicators next to each label show how much that feature weighs on each model
            (P = Participation, S = Securities choice, H = Horizon).
          </p>
        </div>
        <PredictionSimulator />
      </section>

      {/* ── Section 04 & 06: Deep Dives ───────────────────────────── */}
      <section className="animate-fade-up animate-delay-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Section 04: Participation Frontier */}
          <div>
            <div className="mb-6">
              <hr className="section-rule mb-4" style={{ borderColor: "var(--data-4)" }} />
              <p className="section-eyebrow mb-1">Section 04, Model Exploration</p>
              <h2 className="section-title" style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)" }}>
                The Participation Frontier
              </h2>
              <p className="section-subtitle" style={{ fontSize: "0.8rem", marginTop: "0.4rem" }}>
                Probability varying income and education. The ring marks your current simulator position.
              </p>
            </div>
            <ParticipationFrontier incomeValue={incomeValue} educationValue={educationValue} />
          </div>

          {/* Section 06: Asset Ladder */}
          <div>
            <div className="mb-6">
              <hr className="section-rule mb-4" />
              <p className="section-eyebrow mb-1">Section 05</p>
              <h2 className="section-title" style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)" }}>
                What Investors Actually Hold
              </h2>
              <p className="section-subtitle" style={{ fontSize: "0.8rem", marginTop: "0.4rem" }}>
                Asset penetration across four income quartiles. Climb the ladder to see portfolio shifts.
              </p>
            </div>
            <AssetLadder />
          </div>
        </div>
      </section>

      {/* ── Section 05: Barrier Wall ────────────────────────────────────── */}
      <section className="animate-fade-up animate-delay-5">
        <hr className="section-rule mb-4" />
        <div className="mb-6">
          <p className="section-eyebrow mb-1">Section 06</p>
          <h2 className="section-title" style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)" }}>
            Why 74.5% Stay Out
          </h2>
          <p className="section-subtitle" style={{ fontSize: "0.85rem", marginTop: "0.4rem" }}>
            Self-reported barriers to market entry, visualised as a proportional mosaic.
            Block size encodes prevalence. Hover any block for context.
          </p>
        </div>
        <BarrierWall />
      </section>

      {/* ── Key Findings ────────────────────────────────────────────────── */}
      <section className="animate-fade-up animate-delay-5">
        <hr className="section-rule mb-4" />
        <p className="section-eyebrow mb-6">Key Findings</p>

        <div style={{ background: "var(--paper-2)", border: "1px solid var(--border)", marginBottom: 2 }}>
          <div className="p-6 md:p-8">
            <div className="flex items-start gap-6 flex-col md:flex-row">
              <div className="shrink-0">
                <span className="font-mono" style={{ fontSize: "2.5rem", fontWeight: 500, color: "var(--accent)", lineHeight: 1 }}>
                  01
                </span>
              </div>
              <div>
                <h3 className="font-serif mb-3" style={{ fontSize: "1.3rem", fontWeight: 600, color: "var(--ink)", lineHeight: 1.25 }}>
                  Income and education are the primary gatekeepers.
                </h3>
                <p style={{ fontSize: "0.88rem", color: "var(--ink-3)", lineHeight: 1.7, maxWidth: "65ch" }}>
                  Monthly income and years of education are the two dominant predictors of market participation,
                  with odds ratios of 1.80 and 1.83 respectively. A household earning over Rs. 1 lakh per month
                  with 16 or more years of education is 3.2 times more likely to hold any securities.
                  Urban location adds a further 1.4x multiplier. These three structural factors alone account
                  for 61% of the model's predictive power.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "var(--border)" }}>
          {[
            {
              num: "02",
              title: "The Dunning-Kruger trap on risk.",
              body: "Low-literacy investors who overestimate their knowledge are 2.3x more likely to hold derivatives and crypto than calibrated high-literacy investors. Overconfidence substitutes for actual market knowledge.",
            },
            {
              num: "03",
              title: "Finfluencers predict short-termism.",
              body: "Social media reliance is the strongest negative predictor of securities choice and long-term investing. Professional advice-seeking predicts a 72% probability of long-term equity holding versus 20% for finfluencer-only investors.",
            },
          ].map(item => (
            <div key={item.num} className="p-6" style={{ background: "var(--paper-2)" }}>
              <div className="font-mono text-sm mb-4" style={{ color: "var(--ink-3)", fontWeight: 500 }}>
                {item.num}
              </div>
              <h3 className="font-serif mb-3" style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}>
                {item.title}
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--ink-3)", lineHeight: 1.65 }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}