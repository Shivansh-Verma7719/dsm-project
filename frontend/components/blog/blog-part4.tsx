"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, ShieldCheck, Activity, Target, Users, AlertTriangle } from 'lucide-react';
import { ResearcherNote, CodeHighlight, DataStat, InsightCard, IterationNote } from './blog-components';

const BARRIER_DATA = [
  { label: "Trust-Deficient", pct: 46, color: "var(--data-1)", desc: "Urban, higher income, skeptical of institutions" },
  { label: "Knowledge-Gated", pct: 29, color: "#60a5fa", desc: "Rural, lower income, lacks procedural know-how" },
  { label: "Fear-Driven", pct: 25, color: "#f43f5e", desc: "Emotionally risk-averse across all demographics" },
];

const DK_DATA = [
  { label: "Overconfident Investors", crypto: 34, fo: 28, fill: "#f43f5e" },
  { label: "Calibrated Investors", crypto: 8, fo: 9, fill: "#10b981" },
];

export default function BlogPart4() {
  return (
    <section className="mb-32 relative">
      <div className="absolute -left-24 top-0 text-[10rem] font-space-grotesk font-bold text-[#2c3340]/10 select-none pointer-events-none leading-none">
        04
      </div>
      <div className="relative z-10">
        <h2 className="text-4xl font-bold font-space-grotesk mb-3 tracking-tight">The Behavioral Reveal</h2>
        <p className="font-mono text-[0.6rem] text-[#5a6374] uppercase tracking-widest mb-12">Dunning-Kruger · Barrier Archetypes · The Say-Do Paradox</p>

        <div className="font-sans text-[#8a93a3] leading-relaxed text-lg space-y-6 mb-16">
          <p>
            Beyond prediction, we wanted to understand <em>who</em> the Indian investor really is —
            and more importantly, who the non-investor is. This section presents three behavioral
            discoveries that moved our research from "interesting statistics" to "publishable insight."
          </p>
        </div>

        {/* Finding 1: Dunning-Kruger */}
        <h3 className="text-2xl font-bold font-space-grotesk mt-4 mb-6 tracking-tight">Finding 1: The Dunning-Kruger Effect in Finance</h3>

        <div className="font-sans text-[#8a93a3] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            We constructed a "calibration gap" metric: the difference between self-reported market
            familiarity (1-5 scale) and actual performance on our 9-item knowledge quiz. Investors
            who rated themselves 5/5 ("Very Familiar") but scored below 4/9 on the quiz were
            classified as <strong className="text-[#c2c7d0]">overconfident</strong>. Those whose
            self-assessment matched their quiz score were <strong className="text-[#c2c7d0]">calibrated</strong>.
          </p>
          <p>
            The results were stark. Overconfident investors didn't just behave differently — they
            held fundamentally different portfolios.
          </p>
        </div>

        {/* Custom Dunning-Kruger chart */}
        <div className="my-12 p-8 rounded-xl border border-[#2c3340] bg-[var(--surface-sunken)]">
          <h4 className="font-space-grotesk text-xs uppercase tracking-widest text-[#5a6374] mb-8">
            Speculative Asset Penetration: Overconfident vs. Calibrated Investors
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {DK_DATA.map((group) => (
              <div key={group.label}>
                <p className="text-sm font-space-grotesk font-bold mb-4" style={{ color: group.fill }}>{group.label}</p>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Cryptocurrency</span>
                      <span className="font-mono">{group.crypto}%</span>
                    </div>
                    <div className="h-3 bg-[#1a1f2b] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${group.crypto}%` }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="h-full rounded-full"
                        style={{ background: group.fill }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Futures &amp; Options</span>
                      <span className="font-mono">{group.fo}%</span>
                    </div>
                    <div className="h-3 bg-[#1a1f2b] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${group.fo}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        viewport={{ once: true }}
                        className="h-full rounded-full"
                        style={{ background: group.fill }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[0.6rem] text-[#5a6374] mt-6 italic">
            Overconfident investors are 4x more likely to hold crypto and 3x more likely to trade F&amp;O.
          </p>
        </div>

        <ResearcherNote>
          This isn't just academic. Overconfident retail traders are the primary source of losses
          in the Indian F&amp;O market. SEBI's own 2023 study found that 89% of individual F&amp;O
          traders lost money. Our data suggests the mechanism: it's not greed, it's miscalibrated
          self-assessment.
        </ResearcherNote>

        {/* Finding 2: Barrier Archetypes */}
        <h3 className="text-2xl font-bold font-space-grotesk mt-20 mb-6 tracking-tight">Finding 2: Three Faces of Non-Participation</h3>

        <div className="font-sans text-[#8a93a3] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            The standard approach to barriers is a frequency bar chart: "Fear of loss" tops the list,
            "Lack of knowledge" comes second. But this flattens a rich, multidimensional signal. We
            instead applied <strong className="text-[#c2c7d0]">K-Means clustering</strong> on all 18
            barrier variables to discover latent profiles among the ~80,000 non-investors.
          </p>
          <p>
            Three distinct archetypes emerged. Each requires a fundamentally different policy response.
          </p>
        </div>

        {/* Archetype chart */}
        <div className="my-12 p-8 rounded-xl border border-[#2c3340] bg-[var(--surface-sunken)]">
          <h4 className="font-space-grotesk text-xs uppercase tracking-widest text-[#5a6374] mb-8">
            Non-Investor Archetypes (K-Means, k=3)
          </h4>
          <div className="space-y-6">
            {BARRIER_DATA.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between items-baseline mb-2">
                  <div>
                    <span className="text-sm font-space-grotesk font-bold" style={{ color: b.color }}>{b.label}</span>
                    <span className="text-xs text-[#5a6374] ml-3">{b.desc}</span>
                  </div>
                  <span className="text-2xl font-bold font-space-grotesk" style={{ color: b.color }}>{b.pct}%</span>
                </div>
                <div className="h-2 bg-[#1a1f2b] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${b.pct}%` }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="h-full rounded-full"
                    style={{ background: b.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <CodeHighlight
          title="Barrier Archetype Clustering"
          code={`from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

barrier_cols = [c for c in df.columns if c.startswith('barrier_')]
X = StandardScaler().fit_transform(df[barrier_cols].fillna(0))

km = KMeans(n_clusters=3, random_state=42, n_init=10)
df['archetype'] = km.fit_predict(X)

# Interpret clusters by examining centroid barrier loadings
centroids = pd.DataFrame(
    km.cluster_centers_,
    columns=barrier_cols
)`}
        />

        <div className="font-sans text-[#8a93a3] leading-relaxed text-lg space-y-6 my-12">
          <p>
            The <strong style={{ color: 'var(--data-1)' }}>Trust-Deficient</strong> cluster is the most
            counterintuitive: these are often urban, higher-income households who <em>could</em> invest
            but choose not to. Their top barriers are "Lack of trust in stock market institutions"
            and "Regulatory concerns." For this group, the problem isn't access or knowledge — it's
            institutional credibility.
          </p>
          <p>
            The <strong style={{ color: '#60a5fa' }}>Knowledge-Gated</strong> cluster is more expected:
            rural, lower-income, with "I don't know how to start" and "Lack of knowledge" as dominant
            barriers. These are the households that financial literacy programs should target.
          </p>
          <p>
            The <strong style={{ color: '#f43f5e' }}>Fear-Driven</strong> cluster is spread across all
            demographics. Their primary barrier is emotional: "Fear of losing money due to market risks."
            No amount of knowledge or trust will move this group without addressing their relationship
            with financial risk itself.
          </p>
        </div>

        {/* Finding 3: Say-Do Paradox */}
        <h3 className="text-2xl font-bold font-space-grotesk mt-20 mb-6 tracking-tight">Finding 3: The Say-Do Paradox</h3>

        <div className="font-sans text-[#8a93a3] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            Our goal-alignment analysis cross-referenced <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm">respondent_goal_ranks</code> with
            <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm mx-1">respondent_holdings</code>.
            The question: do people who <em>say</em> they want "Daily Trading" actually <em>hold</em>
            speculative instruments?
          </p>
          <p>
            The answer: overwhelmingly, no. <strong className="text-[#c2c7d0]">92.7%</strong> of
            households ranking "Daily Trading" as their primary financial goal hold zero F&amp;O or
            crypto positions. The stated intent exists, but the execution is absent. This "Say-Do Gap"
            is largest in the lower income deciles, suggesting that aspiration for active trading may be
            driven by media exposure rather than actual capital allocation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <DataStat label="Say-Do Gap" value="92.7%" sub="Trading goal but no speculative holdings" />
          <DataStat label="IEP Leverage" value="3.7x" sub="IEP-exposed cite long-term growth" />
          <DataStat label="Overconfidence Gap" value="4x" sub="Higher speculative asset adoption" />
        </div>

        <IterationNote title="Reconciling Dunning-Kruger with Say-Do">
          A reviewer asked: "If overconfident investors hold more crypto, but daily-trading aspirants
          don't, is there a contradiction?" No — these are different populations. Dunning-Kruger
          measures a <strong>psychological trait</strong> (miscalibrated confidence) among existing
          investors. The Say-Do Gap measures an <strong>execution gap</strong> between stated intent
          and actual behavior across all respondents. Overconfidence acts; aspiration doesn't.
        </IterationNote>
      </div>
    </section>
  );
}
