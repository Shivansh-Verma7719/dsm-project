"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Database, GitBranch, Layers } from 'lucide-react';
import { ResearcherNote, CodeHighlight, DataStat, IterationNote } from './blog-components';

const DOMAIN_CARDS = [
  { label: "Socio-Demographics", desc: "Age, Income (Midpoint), Education Years, Occupation, NCCS class, Life Stage, Family Type, Marital Status.", color: "var(--data-1)" },
  { label: "Behavioral Traits", desc: "Risk Tolerance (4-point), Market Familiarity (1-5), Downturn Reaction (sell-all to buy-more), Risk/Return ranking per instrument.", color: "#60a5fa" },
  { label: "Knowledge & Literacy", desc: "9 verified True/False/DK questions: compounding, diversification, KYC, BSDA, demat accounts, pension equity.", color: "#10b981" },
  { label: "Portfolio Dynamics", desc: "21 instrument holdings (boolean), portfolio allocation (%), instrument duration (Short/Mid/Long), Active/Dormant status.", color: "#f43f5e" },
  { label: "Motivations & Barriers", desc: "14 investment motives (boolean), 18 non-investment barriers (boolean), 12 ranked financial goals.", color: "#a78bfa" },
  { label: "Media & Information", desc: "TV/Radio/Newspaper/Internet frequency (1-5), 9 information source booleans, IEP exposure.", color: "#fbbf24" },
];

export default function BlogPart2() {
  return (
    <section className="mb-20 relative">
      <div className="absolute -left-24 top-0 text-[10rem] font-space-grotesk font-bold text-[var(--blog-ink)]/10 select-none pointer-events-none leading-none">
        02
      </div>
      <div className="relative z-10">
        <h2 className="text-4xl font-bold font-space-grotesk mb-3 tracking-tight">What We Measured</h2>
        <p className="font-mono text-[0.6rem] text-[var(--blog-ink-secondary)] uppercase tracking-widest mb-12">Multi-source synthesis · Census 2011 · NSE Pulse · SEBI Microdata</p>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-16">
          <p>
            The ETL was done. We had a clean relational database. But a database is not a dataset.
            To answer the question "Why don't Indians invest?", we needed to understand <em>what</em> we
            were actually measuring. We mapped all 449 source columns into six functional
            domains, each capturing a different angle on how a household relates to money and markets.
          </p>
        </div>

        {/* Domain cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {DOMAIN_CARDS.map((d) => (
            <div key={d.label} className="p-5 rounded-xl border border-[var(--blog-ink)] bg-[var(--surface-sunken)] group hover:border-[var(--blog-ink-secondary)] transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <strong className="text-sm font-space-grotesk uppercase tracking-wider" style={{ color: d.color }}>{d.label}</strong>
              </div>
              <p className="text-xs text-[var(--blog-ink-secondary)] leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            <strong>We noticed</strong> an interesting <strong className="text-[var(--blog-ink-muted)]">asymmetry in our data</strong>. Portfolio-level
            tables (holdings, allocation, duration) only exist for the ~28,000 investors. But
            barriers and market perception tables exist for <em>all</em> 109k respondents, including
            the 80k non-investors. Most surveys only ask investors about their portfolios. This one
            captured the 80k people who never invested with equal detail, which is rare.
          </p>
          <p>
            The barrier table alone contains <strong className="text-[var(--blog-ink-muted)]">18 binary flags</strong> per non-investor,
            from "Fear of losing money" to "Lack of availability of investment platform in local language."
            This is the raw material we later used to discover the three non-investor archetypes.
          </p>
        </div>

        <ResearcherNote>
          92% of respondents who say "Daily Trading" is their primary financial goal hold zero F&amp;O
          or crypto. We called this the Intent Gap. Intent rarely translates to action.
        </ResearcherNote>

        <h3 className="text-2xl font-bold font-space-grotesk mt-20 mb-6 tracking-tight">Adding Geography</h3>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            The SEBI survey tells us <em>who</em> invests. But it doesn't tell us <em>where</em> the financial
            infrastructure exists. So we pulled in two more sources to fill that gap:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-xl border border-[var(--blog-ink)] bg-[var(--surface-sunken)]">
            <div className="flex items-center gap-3 mb-4">
              <Layers size={20} className="text-[var(--data-1)]" />
              <h4 className="text-sm font-space-grotesk font-bold uppercase tracking-widest">Census 2011</h4>
            </div>
            <p className="text-sm text-[var(--blog-ink-secondary)] leading-relaxed">
              District-level population, urbanisation rate, literacy rate, and banking penetration
              metrics. We used this to calculate a "Financial Infrastructure Score", a proxy for
              how accessible formal financial services are in the respondent's locality.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-[var(--blog-ink)] bg-[var(--surface-sunken)]">
            <div className="flex items-center gap-3 mb-4">
              <GitBranch size={20} className="text-[var(--data-1)]" />
              <h4 className="text-sm font-space-grotesk font-bold uppercase tracking-widest">NSE Pulse Data</h4>
            </div>
            <p className="text-sm text-[var(--blog-ink-secondary)] leading-relaxed">
              State-level demat account density, trading volume, and unique investor counts.
              This gives us a state-by-state picture of actual retail participation to hold up
              against what the survey reports.
            </p>
          </div>
        </div>

        {/* Dashboard Integration: State Explorer */}
        <div className="my-10 p-6 rounded-2xl border border-[#60a5fa]/30 bg-[#60a5fa]/5">
          <div className="flex gap-4 items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-[#60a5fa]/10 flex items-center justify-center text-[#60a5fa]">
              <Database size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold font-space-grotesk uppercase">Integration: The State Explorer</h4>
              <p className="text-xs text-[var(--blog-ink-muted)] font-mono">Geographic Triangulation in Action</p>
            </div>
          </div>
          <p className="text-sm text-[var(--blog-ink-secondary)] mb-6">
            Our <strong>State Explorer</strong> dashboard maps the NSE demat density against our 
            survey-derived participation rates. It reveals states like Gujarat where retail 
            enthusiasm is matched by infrastructure, and others where the knowledge gap remains 
            the primary bottleneck.
          </p>
          <div className="aspect-video bg-[var(--surface-sunken)] rounded-xl border border-[var(--border)] flex items-center justify-center relative overflow-hidden group">
            <img src="/images/state_explorer.png" alt="Dashboard State Explorer" className="object-cover w-full h-full opacity-100 group-hover:scale-105 transition-transform duration-700" />
          </div>
        </div>

        <CodeHighlight
          title="Joining Survey Microdata with Census Geography"
          code={`query = """
SELECT
    r.respondent_id, r.is_investor,
    p.gender, p.education_years, p.monthly_income_rs,
    g.is_urban, g.zone, g.state_id,
    lr.risk_tolerance_preference, lr.stock_market_familiarity,
    a.n_products_aware
FROM respondents r
LEFT JOIN respondent_profile p    ON r.respondent_id = p.respondent_id
LEFT JOIN respondent_geography g  ON r.respondent_id = g.respondent_id
LEFT JOIN respondent_literacy_risk lr ON r.respondent_id = lr.respondent_id
LEFT JOIN respondent_awareness a  ON r.respondent_id = a.respondent_id
"""
df = pd.read_sql(query, engine)`}
        />

        <IterationNote title="Why HistGradientBoosting and Not XGBoost?">
          Our FastAPI backend serialises trained models with joblib and loads them at startup.
          Scikit-learn + NumPy already push the deployment footprint past 400MB uncompressed.
          We pinned <strong>scikit-learn&ge;1.6.0</strong> and <strong>numpy&ge;1.26.4</strong>
          to keep the bundle lean. XGBoost or LightGBM would have added another 50-100MB each
          with no meaningful accuracy gain on this dataset. HistGradientBoosting is built into
          sklearn, natively handles missing values, and matched their performance on all three tasks.
        </IterationNote>
      </div>
    </section>
  );
}
