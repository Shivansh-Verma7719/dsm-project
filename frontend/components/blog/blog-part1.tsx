  "use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Database } from 'lucide-react';
import { ResearcherNote, CodeHighlight, IterationNote } from './blog-components';

const DOMAINS = [
  { label: "Portfolio & Holdings", cols: 130, color: "#f43f5e", desc: "holdings, allocation, status, duration across 21 instruments" },
  { label: "Demographics", cols: 95, color: "var(--data-1)", desc: "income, education, occupation, NCCS, family type" },
  { label: "Motivations & Barriers", cols: 85, color: "#a78bfa", desc: "18 barriers, 14 motives, 12 ranked goals" },
  { label: "Knowledge & Behavior", cols: 75, color: "#10b981", desc: "literacy quiz, risk perception, market views" },
  { label: "Survey Metadata", cols: 41, color: "var(--blog-ink-muted)", desc: "identifiers, weights, routing flags" },
  { label: "Awareness & Media", cols: 23, color: "#fbbf24", desc: "15 product awareness booleans, media frequency" },
];

const SCHEMA_ROWS = [
  ["1", "respondents", "109,430", "respondent_id, is_investor, survey_weight"],
  ["2", "respondent_geography", "109,430", "state_id, zone, is_urban, city_class"],
  ["3", "respondent_profile", "109,430", "gender, education_years, monthly_income_rs"],
  ["4", "respondent_income_allocation", "~80k", "pct_income_savings, pct_income_investment"],
  ["5", "respondent_portfolio_allocation", "~28k", "18 pct_portfolio_* columns"],
  ["6", "respondent_goal_ranks", "109,430", "12 goal_rank_* (1=most important)"],
  ["7", "respondent_awareness", "109,430", "15 aware_* booleans + n_products_aware"],
  ["8", "respondent_holdings", "~28k", "21 holds_* booleans + n_instruments_held"],
  ["9", "respondent_instrument_status", "~28k", "Active / Dormant per 8 instruments"],
  ["10", "respondent_instrument_duration", "~28k", "Short / Mid / Long per instrument"],
  ["11", "respondent_time_horizons", "~28k", "short / mid / long_term_months"],
  ["12", "respondent_literacy_risk", "109,430", "familiarity (1-5), risk + return ranks"],
  ["13", "respondent_knowledge", "109,430", "9 knowledge items: True / False / DK"],
  ["14", "respondent_market_perception", "~80k", "6 institution perception scales"],
  ["15", "respondent_info_sources", "~28k", "9 info_* booleans"],
  ["16", "respondent_motivations", "~28k", "14 motive_* booleans"],
  ["17", "respondent_barriers", "~80k", "18 barrier_* booleans"],
  ["18", "respondent_media", "109,430", "tv, radio, newspaper, internet frequency"],
];

export default function BlogPart1() {
  return (
    <section id="raw-data" className="mb-20 relative">
      <div className="absolute -left-24 top-0 text-[10rem] font-space-grotesk font-bold text-[var(--blog-ink)]/10 select-none pointer-events-none leading-none">
        01
      </div>
      <div className="relative z-10">
        <h2 className="text-4xl font-bold font-space-grotesk mb-3 tracking-tight">The Raw Data Problem</h2>
        <p className="font-mono text-[0.6rem] text-[var(--blog-ink-secondary)] uppercase tracking-widest mb-12">SEBI Household Survey 2025 · 109,430 respondents · 449 columns</p>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            <strong>We started</strong> with a problem that most researchers gloss over:
            opening a 450MB Excel file at 11pm and watching our laptop fan spin up while Pandas chokes on
            the first read attempt. The raw <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm">Respondent Data.XLSX</code> from
            SEBI's 2025 Household Investor Survey was exactly this: 109,430 rows, 449 columns, and no column
            dictionary beyond a 60-page PDF survey instrument.
          </p>
        </div>

        {/* Dashboard Integration: Data Viewer */}
        <div className="my-10 p-6 rounded-2xl border border-[var(--data-1)]/30 bg-[var(--data-1)]/5">
          <div className="flex gap-4 items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--data-1)]/10 flex items-center justify-center text-[var(--data-1)]">
              <Database size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold font-space-grotesk uppercase">Integration: The Raw Data Explorer</h4>
              <p className="text-xs text-[var(--blog-ink-muted)] font-mono">Verifying ETL outcomes in real-time</p>
            </div>
          </div>
          <p className="text-sm text-[var(--blog-ink-secondary)] mb-6">
            We built a dedicated <strong>Data Explorer</strong> into the dashboard to verify our ETL 
            transformations. It allows us to query the 18 semantic tables directly and inspect the 
            midpoint-mapped income values that power our models.
          </p>
          <div className="aspect-video bg-[var(--surface-sunken)] rounded-xl border border-[var(--border)] flex items-center justify-center relative overflow-hidden group">
            <img src="/images/data_explorer.png" alt="Dashboard Data Explorer" className="object-cover w-full h-full opacity-100 group-hover:scale-105 transition-transform duration-700" />
          </div>
        </div>

        {/* Column taxonomy visualization */}
        <div className="my-12 p-8 rounded-2xl border border-[var(--blog-ink)] bg-[var(--surface-sunken)]">
          <p className="font-mono text-[0.65rem] uppercase tracking-widest text-[var(--blog-ink-secondary)] mb-1">Fig. 1: Column Taxonomy</p>
          <p className="text-xs text-[var(--blog-ink-secondary)] italic mb-8">449 raw survey columns mapped to six functional domains</p>

          <div className="flex h-8 rounded-md overflow-hidden mb-8" style={{ gap: '2px' }}>
            {DOMAINS.map((d, i) => (
              <motion.div
                key={d.label}
                initial={{ opacity: 0, scaleX: 0 }}
                whileInView={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: 'easeOut' }}
                viewport={{ once: true }}
                style={{ background: d.color, width: `${(d.cols / 449 * 100).toFixed(1)}%`, originX: 0 }}
                className="h-full shrink-0"
                title={`${d.label}: ${d.cols} columns`}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            {DOMAINS.map((d) => (
              <div key={d.label} className="flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-sm mt-1.5 shrink-0" style={{ background: d.color }} />
                <div>
                  <p className="text-xs font-space-grotesk font-semibold leading-tight" style={{ color: d.color }}>
                    {d.label} <span className="font-mono font-normal text-[var(--blog-ink-secondary)]">({d.cols})</span>
                  </p>
                  <p className="text-[0.6rem] text-[var(--blog-ink-secondary)] leading-snug mt-0.5">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            Then there was the <strong className="text-[var(--blog-ink-muted)]">encoding</strong> problem. The XLSX was generated
            with Windows-1252 characters, specifically the en-dash appearing in income labels like
            "Rs.10,001–Rs.15,000". Visually identical to a hyphen, it broke every string-match lookup
            we tried. We wrote a normalizer that stripped these before any comparison:
          </p>
        </div>

        <CodeHighlight
          title="etl_respondents.py: Encoding Normalizer"
          code={`def _nd(s):
    # en-dash and em-dash slip through from Windows-1252 XLSX
    # visually identical to hyphen, but breaks .get() lookups
    return str(s).replace("\\u2013", "-").replace("\\u2014", "-").strip()

INC_MAP = {
    "Rs. 5,001 - Rs. 10,000":    7500,
    "Rs.10,001 - Rs. 15,000":   12500,
    "Rs.20,001 - Rs. 30,000":   25000,
    "Above Rs. 1,00,000":      150000,
}

def map_inc(val):
    if pd.isna(val): return None
    return INC_MAP.get(_nd(str(val)))   # normalise before lookup`}
        />

        <IterationNote title="Why Not One-Hot Encoding?">
          Our first instinct was to one-hot encode all income brackets, turning 12 labels into
          12 binary columns. That gave us 800+ features before we even touched behavioral data.
          The GBM trained but permutation importance was scattered across dozens of
          near-identical bracket columns, destroying interpretability. Switching to continuous
          <strong> midpoint values</strong> (e.g. "Rs.20k–30k" to 25,000) collapsed 12 columns into one
          and let the model find the actual monotonic income–participation relationship.
        </IterationNote>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 my-12">
          <p>
            Multi-select fields were where things got genuinely messy. Questions like "Which instruments do you hold?"
            allowed multiple selections packed into a single comma-separated cell. We wrote a mapper for
            each question that split one packed cell into 15–21 individual boolean columns:
          </p>
        </div>

        <CodeHighlight
          title="Expanding Multi-Select Cells into Boolean Columns"
          code={`Q22A_HOLDS = {
    "holds_fd_rd":          "Fixed Deposits",
    "holds_gold_physical":  "Gold - Physical",
    "holds_nps":            "National Pension",
    "holds_crypto":         "Cryptocurrency",
    "holds_mf_etf":         "Mutual Funds",
    "holds_equity_shares":  "Stocks / Shares",
    "holds_derivatives_fo": "Futures & Options",
    # ... 14 more instruments
}

def _contains(cell, substr):
    if pd.isna(cell): return False
    return substr in str(cell)

# Expands one cell into 21 boolean columns per row:
holds = {k: _contains(row.get("Q22A"), v) for k, v in Q22A_HOLDS.items()}`}
        />

        <h3 className="text-2xl font-bold font-space-grotesk mt-20 mb-6 tracking-tight">The Schema</h3>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-10">
          <p>
            Instead of one enormous 449-column table, we split the survey into
            <strong className="text-[var(--blog-ink-muted)]"> 18 PostgreSQL tables</strong>, one per topic.
            That means a query for gender breakdown never has to touch the portfolio tables,
            no scanning 449 columns when you only need three.
            Every child table links back via <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm">respondent_id REFERENCES respondents ON DELETE CASCADE</code>.
            Delete a respondent and all their data cascades out cleanly.
          </p>
        </div>

        {/* Schema reference table */}
        <div className="my-10 overflow-hidden rounded-xl border border-[var(--blog-ink)]">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[var(--blog-ink)]">
                {["#", "Table", "~Rows", "Key Columns"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[0.6rem] uppercase tracking-widest text-[var(--blog-ink-secondary)] font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--blog-ink)]">
              {SCHEMA_ROWS.map(([num, tbl, rows, cols]) => (
                <tr key={tbl} className="hover:bg-[var(--surface)]/50 transition-colors">
                  <td className="px-4 py-3 text-[var(--blog-ink-secondary)] text-xs">{num}</td>
                  <td className="px-4 py-3 text-[var(--data-1)] text-xs">{tbl}</td>
                  <td className="px-4 py-3 text-[var(--blog-ink-muted)] text-xs">{rows}</td>
                  <td className="px-4 py-3 text-[var(--blog-ink-secondary)] text-xs leading-snug">{cols}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-2xl font-bold font-space-grotesk mt-20 mb-6 tracking-tight">Indexes</h3>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-10">
          <p>
            With 109k rows, full-table scans are fast enough for batch analysis. But this schema also
            powers a <strong className="text-[var(--blog-ink-muted)]">live dashboard with sub-100ms filtering</strong>.
            A user selecting "Female, Urban, Maharashtra" must get near-instant responses. We took
            a two-level approach to indexes:
          </p>
          <p>
            <strong className="text-[var(--blog-ink-muted)]">Tier 1: Composite indexes on common join paths.</strong>{" "}
            Dashboard queries almost always start with <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm">is_investor</code> then
            filter by geography or income. A composite index on
            <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm mx-1">(survey_year, is_investor)</code>
            lets Postgres skip 80k non-investors immediately when computing investor-only charts.
          </p>
          <p>
            <strong className="text-[var(--blog-ink-muted)]">Tier 2: Partial indexes on sparse boolean columns.</strong>{" "}
            Only ~6% of respondents hold crypto, ~8% hold F&amp;O. A full B-tree index on
            <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm mx-1">holds_crypto</code>
            still scans 94% false rows. A partial index with
            <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm mx-1">WHERE holds_crypto = true</code>
            cuts the index to ~6,500 entries; lookup becomes near-instant.
          </p>
        </div>

        <CodeHighlight
          title="schema_respondents.sql: Two-Tier Index Strategy"
          code={`-- Tier 1: Composite indexes for common dashboard joins
CREATE INDEX idx_resp_year_inv   ON respondents(survey_year, is_investor);
CREATE INDEX idx_geo_state_urban ON respondent_geography(state_id, is_urban);
CREATE INDEX idx_prof_edu_income ON respondent_profile(education_years, monthly_income_rs);

-- Tier 2: Partial indexes on sparse speculative holdings
CREATE INDEX idx_hold_equity ON respondent_holdings(respondent_id)
    WHERE holds_equity_shares = true;
CREATE INDEX idx_hold_mf     ON respondent_holdings(respondent_id)
    WHERE holds_mf_etf = true;

-- Derived awareness count for ML feature extraction
CREATE INDEX idx_awr_n ON respondent_awareness(n_products_aware);`}
          language="sql"
        />

        <ResearcherNote>
          The partial index insight came from a slow query in week 3. A chart showing "Crypto holders
          by state" was taking 800ms. Adding WHERE holds_crypto = true to the index
          dropped it to 12ms. Sometimes database design is more impactful than machine learning.
        </ResearcherNote>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mt-12">
          <p>
            The entire load runs in a single Psycopg2 transaction with <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm">execute_values</code> batched
            at 500 rows per round-trip: read the XLSX, transform all 109,430 rows, load 18 tables.
            Total wall-clock time: under 4 minutes. If any table fails,
            the whole transaction rolls back; either everything loads, or nothing does.
          </p>
        </div>

        <CodeHighlight
          title="Atomic Multi-Table Load"
          code={`conn = psycopg2.connect(DATABASE_URL)
cur  = conn.cursor()
try:
    for tname in TABLE_ORDER:   # parent tables first, FK children last
        rows = tables[tname]
        cols = list(rows[0].keys())
        sql  = (f"INSERT INTO {tname} ({', '.join(cols)}) "
                f"VALUES %s ON CONFLICT DO NOTHING")
        vals = [tuple(row[c] for c in cols) for row in rows]
        execute_values(cur, sql, vals, page_size=500)
    conn.commit()   # atomic — all 18 tables land, or none do
except Exception:
    conn.rollback()
    raise`}
        />
      </div>
    </section>
  );
}
