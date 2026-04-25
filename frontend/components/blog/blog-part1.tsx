"use client";

import React from 'react';
import { Database } from 'lucide-react';
import { ResearcherNote, CodeHighlight, IterationNote } from './blog-components';

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
    <section className="mb-32 relative">
      <div className="absolute -left-24 top-0 text-[10rem] font-space-grotesk font-bold text-[#2c3340]/10 select-none pointer-events-none leading-none">
        01
      </div>
      <div className="relative z-10">
        <h2 className="text-4xl font-bold font-space-grotesk mb-3 tracking-tight">Archaeology &amp; the Raw Data Problem</h2>
        <p className="font-mono text-[0.6rem] text-[#5a6374] uppercase tracking-widest mb-12">SEBI Household Survey 2025 · 109,430 respondents · 449 columns</p>

        <div className="font-sans text-[#8a93a3] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            Data scientists love talking about "cleaning data." What that phrase hides is the actual experience:
            opening a 450MB Excel file at 11pm and watching your laptop fan spin up while Pandas chokes on
            the first read attempt. The raw <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm">Respondent Data.XLSX</code> from
            SEBI's 2025 Household Investor Survey was exactly this — 109,430 rows, 449 columns, and no column
            dictionary beyond a 60-page PDF survey instrument.
          </p>
          <p>
            Our first task before any modeling was simply <em>understanding what we had</em>.
            We ran a column audit and found the data fell into six broad categories, many using
            non-standard multi-select encoding: comma-separated strings like
            <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm mx-1">"Mutual Funds, Gold, Fixed Deposits"</code>
            where three holdings were crammed into one cell.
          </p>
        </div>

        {/* Placeholder: column taxonomy */}
        <div className="my-12 rounded-2xl border border-dashed border-[#2c3340] bg-[var(--surface-sunken)] aspect-video flex flex-col items-center justify-center gap-4 text-[#5a6374]">
          <div className="w-12 h-12 rounded-xl border border-[#2c3340] flex items-center justify-center">
            <Database size={24} />
          </div>
          <div className="text-center">
            <p className="font-mono text-[0.65rem] uppercase tracking-widest">Fig. 1 — Column Taxonomy Heatmap</p>
            <p className="text-xs mt-1 italic">Six functional domains across 449 raw survey columns</p>
          </div>
        </div>

        <div className="font-sans text-[#8a93a3] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            The second obstacle was <strong className="text-[#c2c7d0]">encoding</strong>. The XLSX was generated
            with Windows-1252 characters — specifically the en-dash appearing in income labels like
            "Rs.10,001–Rs.15,000". Visually identical to a hyphen, it broke every string-match lookup
            we tried. We wrote a normalizer that stripped these before any comparison:
          </p>
        </div>

        <CodeHighlight
          title="etl_respondents.py — Encoding Normalizer"
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

        <div className="font-sans text-[#8a93a3] leading-relaxed text-lg space-y-6 my-12">
          <p>
            Multi-select fields were the deepest challenge. Questions like "Which instruments do you hold?"
            allowed multiple selections stored as a single comma-separated cell. We built a
            family of substring-match mappers — one per multi-select question — that expanded
            each into 15–21 individual boolean columns:
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

        <h3 className="text-2xl font-bold font-space-grotesk mt-20 mb-6 tracking-tight">The 17-Table Relational Schema</h3>

        <div className="font-sans text-[#8a93a3] leading-relaxed text-lg space-y-6 mb-10">
          <p>
            Rather than loading everything into one wide table, we decomposed the survey into
            <strong className="text-[#c2c7d0]"> 17 purpose-built PostgreSQL tables</strong>, each
            representing one semantic domain. A normalized schema means dashboard queries only touch
            the tables they need — no full-table scans on a 109k-row, 449-column monolith.
            Every child table uses <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm">respondent_id REFERENCES respondents ON DELETE CASCADE</code>,
            giving us a clean star-schema centred on the respondent.
          </p>
        </div>

        {/* Schema reference table */}
        <div className="my-10 overflow-hidden rounded-xl border border-[#2c3340]">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="bg-[var(--surface)] border-b border-[#2c3340]">
                {["#", "Table", "~Rows", "Key Columns"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[0.6rem] uppercase tracking-widest text-[#5a6374] font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2c3340]">
              {SCHEMA_ROWS.map(([num, tbl, rows, cols]) => (
                <tr key={tbl} className="hover:bg-[var(--surface)]/50 transition-colors">
                  <td className="px-4 py-3 text-[#5a6374] text-xs">{num}</td>
                  <td className="px-4 py-3 text-[var(--data-1)] text-xs">{tbl}</td>
                  <td className="px-4 py-3 text-[#c2c7d0] text-xs">{rows}</td>
                  <td className="px-4 py-3 text-[#8a93a3] text-xs leading-snug">{cols}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="text-2xl font-bold font-space-grotesk mt-20 mb-6 tracking-tight">Index Strategy</h3>

        <div className="font-sans text-[#8a93a3] leading-relaxed text-lg space-y-6 mb-10">
          <p>
            With 109k rows, full-table scans are fast enough for batch analysis. But this schema also
            powers a <strong className="text-[#c2c7d0]">live dashboard with sub-100ms filtering</strong>.
            A user selecting "Female, Urban, Maharashtra" must get near-instant responses. We designed
            a two-tier index strategy:
          </p>
          <p>
            <strong className="text-[#c2c7d0]">Tier 1 — Composite indexes on common join paths.</strong>{" "}
            Dashboard queries almost always start with <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm">is_investor</code> then
            filter by geography or income. A composite index on
            <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm mx-1">(survey_year, is_investor)</code>
            lets Postgres skip 80k non-investors immediately when computing investor-only charts.
          </p>
          <p>
            <strong className="text-[#c2c7d0]">Tier 2 — Partial indexes on sparse boolean columns.</strong>{" "}
            Only ~6% of respondents hold crypto, ~8% hold F&amp;O. A full B-tree index on
            <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm mx-1">holds_crypto</code>
            still scans 94% false rows. A partial index with
            <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm mx-1">WHERE holds_crypto = true</code>
            cuts the index to ~6,500 entries — lookup becomes near-instant.
          </p>
        </div>

        <CodeHighlight
          title="schema_respondents.sql — Two-Tier Index Strategy"
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

        <div className="font-sans text-[#8a93a3] leading-relaxed text-lg space-y-6 mt-12">
          <p>
            The entire ETL — reading the XLSX, transforming all 109,430 rows, and loading 18 tables —
            runs in a single Psycopg2 transaction with <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm">execute_values</code> batched
            at 500 rows per round-trip. Total wall-clock time: under 4 minutes. If any table fails,
            the whole transaction rolls back, guaranteeing referential integrity.
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
