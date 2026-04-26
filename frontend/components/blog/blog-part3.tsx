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
    <section className="mb-20 relative">
      <div className="absolute -left-24 top-0 text-[10rem] font-space-grotesk font-bold text-[var(--blog-ink)]/10 select-none pointer-events-none leading-none">
        03
      </div>
      <div className="relative z-10">
        <h2 className="text-4xl font-bold font-space-grotesk mb-3 tracking-tight">The Models</h2>
        <p className="font-mono text-[0.6rem] text-[var(--blog-ink-secondary)] uppercase tracking-widest mb-12">Three models · HistGradientBoosting · Permutation Importance</p>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            Schema done. The actual question: can we <em>predict</em> which households invest,
            and what is really driving it? We built three models, each asking something harder than the last:
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
            all three models. Unlike standard random forests, HGB natively handles missing values,
            which matters when 80k non-investors have NULL portfolio columns. And it doesn't care
            whether a feature is boolean, ordinal, or continuous; no separate preprocessing steps per type.
          </p>
          <p>
            The trickier call was <strong className="text-[var(--blog-ink-muted)]">class balancing</strong>. With 74.5%
            of households being non-investors, a naive model can score 74.5% accuracy by predicting
            "No" for everyone. We used <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm">class_weight='balanced'</code> to
            stop the model from taking that shortcut, and shifted evaluation to ROC-AUC, a metric
            that rewards actual <em>discrimination</em> rather than majority-class laziness.
          </p>
        </div>

        <IterationNote title="The Model Evolution: Beyond Random Forest">
          Our initial baseline was a standard <strong>Random Forest</strong>. It achieved a respectable 0.72 AUC,
          but it struggled with the extreme sparsity of the holding data and the non-linear interaction
          between awareness and income. A household with Rs.15,000 income and awareness of 8 products
          invests at the same rate as one with Rs.50,000 income and awareness of 3. Standard Random Forests
          required excessive tree depth to capture these "awareness gating" thresholds.
          <br /><br />
          We improved the score by 13% (to 0.814) by switching to <strong>Histogram-based Gradient Boosting</strong>
          and engineering <strong>midpoint-continuous features</strong> for income. This allowed the model to find
          monotonic relationships that were previously obscured by the discrete income brackets of the raw survey.
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

        <h3 className="text-2xl font-bold font-space-grotesk mt-20 mb-6 tracking-tight">Feature Importance</h3>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            When we ran permutation importance on Model 1, one result stood out:
            <strong className="text-[var(--blog-ink-muted)]"> Product Awareness</strong>, the count of financial
            instruments a household has heard of, outstripped Income as the single strongest predictor
            of market entry. This overturns the common assumption that wealth is the primary gate.
            In India, knowing about a product predicts market entry more reliably than being able to afford it.
          </p>
        </div>

        {/* Custom feature importance chart */}
        <div className="my-12 p-8 rounded-xl border border-[var(--blog-ink)] bg-[var(--surface-sunken)]">
          <h4 className="font-space-grotesk text-xs uppercase tracking-widest text-[var(--blog-ink-secondary)] mb-8">
            Permutation Importance: Model 1 (Participation)
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
          This clicked something we had been puzzled by in the raw numbers. There were high-income
          households completely absent from the market, and middle-class ones who were actively investing.
          It wasn't about money. It was about whether they had been told certain things were
          possible for people like them.
        </ResearcherNote>

        <h3 className="text-2xl font-bold font-space-grotesk mt-20 mb-6 tracking-tight">Serving the Models</h3>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            All three trained models were serialised with
            <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm mx-1">joblib</code>
            and served through a <strong className="text-[var(--blog-ink-muted)]">FastAPI backend</strong> with a
            <code className="text-[var(--data-1)] bg-[var(--surface)] px-1 py-0.5 rounded text-sm mx-1">/predict</code> endpoint.
          </p>
        </div>

        {/* Dashboard Integration: Prediction Simulator */}
        <div className="my-10 p-6 rounded-2xl border border-[var(--data-1)]/30 bg-[var(--data-1)]/5">
          <div className="flex gap-4 items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--data-1)]/10 flex items-center justify-center text-[var(--data-1)]">
              <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold font-space-grotesk uppercase">Integration: The Live Predictor</h4>
              <p className="text-xs text-[var(--blog-ink-muted)] font-mono">Real-time Inference Pipeline</p>
            </div>
          </div>
          <p className="text-sm text-[var(--blog-ink-secondary)] mb-6">
            The <strong>Prediction Simulator</strong> on our home page is a live implementation of 
            Model 1. It allows users to manipulate household variables (income, education, and
            awareness) to see how they shift the participation probability in real-time.
          </p>
          <div className="aspect-video bg-[var(--surface-sunken)] rounded-xl border border-[var(--border)] flex items-center justify-center relative overflow-hidden group">
            <img src="/images/live_predictor.png" alt="Dashboard Prediction Simulator" className="object-cover w-full h-full opacity-100 group-hover:scale-105 transition-transform duration-700" />
          </div>
        </div>
      </div>
    </section>
  );
}
