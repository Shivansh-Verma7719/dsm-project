"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, AlertTriangle } from 'lucide-react';
import { ResearcherNote, CodeHighlight, DataStat, IterationNote } from './blog-components';

const FEATURES = [
  { label: "Product Awareness", val: 100, raw: "0.084" },
  { label: "Log-Income", val: 68, raw: "0.057" },
  { label: "Education Years", val: 52, raw: "0.044" },
  { label: "Risk Tolerance", val: 28, raw: "0.024" },
  { label: "Urban Status", val: 14, raw: "0.012" },
  { label: "Gender", val: 8, raw: "0.007" },
];

export default function BlogPart3() {
  return (
    <section className="mb-32 relative">
      <div className="absolute -left-24 top-0 text-[10rem] font-space-grotesk font-bold text-[var(--blog-ink)]/10 select-none pointer-events-none leading-none">
        03
      </div>
      <div className="relative z-10">
        <h2 className="text-4xl font-bold font-space-grotesk mb-3 tracking-tight">The Predictive Engine</h2>
        <p className="font-mono text-[0.6rem] text-[var(--blog-ink-secondary)] uppercase tracking-widest mb-12">Three models · HistGradientBoosting · Permutation Importance</p>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            With our relational schema in place, we turned to the central modelling question: can we
            <em> predict</em> whether a household participates in the market — and if so, what drives
            that prediction? We built three cascading models, each targeting a different depth of
            the investment decision:
          </p>
        </div>

        {/* Three model cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          <div className="p-6 rounded-xl border border-[var(--blog-ink)] bg-[var(--surface-sunken)]">
            <div className="text-xs font-mono uppercase tracking-widest text-[var(--blog-ink-secondary)] mb-3">Model 1</div>
            <h4 className="text-lg font-bold font-space-grotesk mb-2">Participation</h4>
            <p className="text-xs text-[var(--blog-ink-secondary)] mb-4">Does this household invest at all?</p>
            <div className="text-3xl font-bold text-[var(--data-1)] font-space-grotesk">0.814</div>
            <div className="text-[0.6rem] font-mono text-[var(--blog-ink-secondary)] uppercase">ROC-AUC</div>
          </div>
          <div className="p-6 rounded-xl border border-[var(--blog-ink)] bg-[var(--surface-sunken)]">
            <div className="text-xs font-mono uppercase tracking-widest text-[var(--blog-ink-secondary)] mb-3">Model 2</div>
            <h4 className="text-lg font-bold font-space-grotesk mb-2">Asset Choice</h4>
            <p className="text-xs text-[var(--blog-ink-secondary)] mb-4">Equity/MF or traditional instruments?</p>
            <div className="text-3xl font-bold text-[#60a5fa] font-space-grotesk">0.820</div>
            <div className="text-[0.6rem] font-mono text-[var(--blog-ink-secondary)] uppercase">ROC-AUC</div>
          </div>
          <div className="p-6 rounded-xl border border-[var(--blog-ink)] bg-[var(--surface-sunken)]">
            <div className="text-xs font-mono uppercase tracking-widest text-[var(--blog-ink-secondary)] mb-3">Model 3</div>
            <h4 className="text-lg font-bold font-space-grotesk mb-2">Time Horizon</h4>
            <p className="text-xs text-[var(--blog-ink-secondary)] mb-4">Short-term trader or long-term holder?</p>
            <div className="text-3xl font-bold text-[#10b981] font-space-grotesk">0.612</div>
            <div className="text-[0.6rem] font-mono text-[var(--blog-ink-secondary)] uppercase">ROC-AUC</div>
          </div>
        </div>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            We chose <strong className="text-[var(--blog-ink-muted)]">Histogram-based Gradient Boosting (HGB)</strong> for
            all three models. Unlike standard random forests, HGB natively handles missing values —
            critical when 80k non-investors have NULL portfolio columns. It also handles mixed
            feature types (boolean, ordinal, continuous) without requiring separate preprocessing
            pipelines for each.
          </p>
          <p>
            The key design decision was <strong className="text-[var(--blog-ink-muted)]">class balancing</strong>. With 74.5%
            of households being non-investors, a naive model can score 74.5% accuracy by predicting
            "No" for everyone. We used <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm">class_weight='balanced'</code> to
            penalise false negatives and shifted evaluation from accuracy to ROC-AUC, which measures
            the model's ability to <em>separate</em> investors from non-investors across all threshold values.
          </p>
        </div>

        <IterationNote title="The Logistic Regression Failure">
          Our first attempt was a standard logistic regression. It achieved a respectable 0.78 AUC
          but completely missed the non-linear interaction between awareness and income. A household
          with Rs.15,000 income and awareness of 8 products invests at the same rate as one with
          Rs.50,000 income and awareness of 3. Logistic regression cannot capture this "awareness
          gating" — it assumes a linear, additive relationship. HGB models naturally find these
          interaction effects through tree splits.
        </IterationNote>

        <CodeHighlight
          title="Model 1: Participation Classifier"
          code={`feature_cols = [
    'gender', 'education_years', 'is_urban',
    'risk_tolerance_preference', 'log_income', 'n_products_aware'
]

clf = HistGradientBoostingClassifier(
    random_state=42,
    class_weight='balanced',   # penalise majority class
    max_iter=200,
    learning_rate=0.05
)
clf.fit(X_train, y_train)

auc = roc_auc_score(y_test, clf.predict_proba(X_test)[:, 1])
# >>> 0.814`}
        />

        <h3 className="text-2xl font-bold font-space-grotesk mt-20 mb-6 tracking-tight">Feature Importance: The Awareness Surprise</h3>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            The most striking finding from Model 1's permutation importance analysis was that
            <strong className="text-[var(--blog-ink-muted)]"> Product Awareness</strong> — the count of financial
            instruments a household has heard of — outstripped Income as the single strongest predictor
            of market entry. This overturns the common assumption that wealth is the primary gate.
            In India, <em>it's not what you earn; it's what you've been told is possible</em>.
          </p>
        </div>

        {/* Custom feature importance chart */}
        <div className="my-12 p-8 rounded-xl border border-[var(--blog-ink)] bg-[var(--surface-sunken)]">
          <h4 className="font-space-grotesk text-xs uppercase tracking-widest text-[var(--blog-ink-secondary)] mb-8">
            Permutation Importance — Model 1 (Participation)
          </h4>
          <div className="space-y-5">
            {FEATURES.map((f, i) => (
              <div key={f.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--blog-ink-muted)] font-space-grotesk">{f.label}</span>
                  <span className="font-mono text-[var(--blog-ink-secondary)]">{f.raw}</span>
                </div>
                <div className="h-2 bg-[#1a1f2b] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${f.val}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="h-full rounded-full"
                    style={{ background: i === 0 ? 'var(--data-1)' : 'var(--blog-ink-muted)' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[0.6rem] text-[var(--blog-ink-secondary)] mt-6 italic">
            n_products_aware dominates. A household that knows about 5+ instruments is 3x more likely
            to participate than a high-income household that only knows about Fixed Deposits.
          </p>
        </div>

        <CodeHighlight
          title="Permutation Importance Extraction"
          code={`from sklearn.inspection import permutation_importance

result = permutation_importance(
    clf, X_test, y_test,
    n_repeats=5,
    random_state=42
)

fi = pd.DataFrame({
    'Feature': feature_cols,
    'Importance': result.importances_mean
}).sort_values('Importance', ascending=False)`}
        />

        <ResearcherNote>
          When we showed these results to a financial advisor, she said: "This makes total sense.
          My richest clients who don't invest always say 'I don't understand that stuff.'
          My middle-class clients who do invest always say 'I read about it.'"
          Our model had quantified a truth that practitioners already felt intuitively.
        </ResearcherNote>

        <h3 className="text-2xl font-bold font-space-grotesk mt-20 mb-6 tracking-tight">Deploying the Predictor</h3>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            We didn't stop at offline analysis. All three trained models were serialised with
            <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm mx-1">joblib</code>
            and served through a <strong className="text-[var(--blog-ink-muted)]">FastAPI backend</strong> exposing a
            <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm mx-1">/predict</code> endpoint.
            Users can input a household profile — income, education, awareness level, risk tolerance —
            and receive real-time predictions for participation probability, likely asset choice, and
            expected holding duration.
          </p>
          <p>
            The dashboard's "Prediction Simulator" pane takes these raw probabilities and maps them
            onto semantic gauge bars. A participation probability of 0.82 becomes "Likely Investor."
            An asset choice skewing 70% toward MF/ETF becomes "Market-Linked Preference." This
            translation from math to meaning is what makes the tool useful for policymakers who
            don't read probability distributions.
          </p>
        </div>
      </div>
    </section>
  );
}
