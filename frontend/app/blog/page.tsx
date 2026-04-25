"use client";

import React from "react";
import { DunningKrugerChart, FinfluencerChart } from "@/components/native-charts";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";

export default function Blog() {
  const router = useRouter();
  return (
    <div className="max-w-3xl mx-auto py-12 space-y-12">
      {/* Header */}
      <header className="space-y-4">
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight">
          Unmasking the Retail Investor: Behavioral Dynamics in the Indian Securities Market
        </h1>
        <div className="flex items-center gap-4 text-default-500 pb-4 border-b border-divider">
          <span>By Shivansh Verma and Sashwat Dhanuka</span>
          <span>•</span>
          <span>Ashoka University</span>
        </div>
      </header>

      {/* Intro */}
      <section className="space-y-4 text-lg leading-relaxed text-foreground/80">
        <p>
          Household participation in capital markets is a crucial driver of financial inclusion and wealth creation. Yet, in India, it remains disproportionately skewed. Using a large-scale micro-dataset from the <strong>2025 SEBI Household Survey</strong> (N=109,430), we set out to understand what separates those who invest from those who don't.
        </p>
        <p>
          What we found challenged the standard economic assumption that capital allocation is purely a function of wealth and rational risk assessment. While entry into the market is structurally gated by income and education, <em>post-entry</em> behavior is a psychological battlefield.
        </p>
      </section>

      {/* The Dunning Kruger Effect */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">The Overconfidence Trap</h2>
        <p className="text-lg leading-relaxed text-foreground/80">
          When analyzing self-reported market familiarity against actual scores on an objective financial literacy quiz, we uncovered a profound <strong>Dunning-Kruger effect</strong>. 
        </p>
        <p className="text-lg leading-relaxed text-foreground/80">
          Investors who are "overconfident" (high perceived familiarity, low actual knowledge) are disproportionately drawn to highly speculative, high-risk assets like Futures & Options (F&O) and Cryptocurrency. 
        </p>
        
        {/* Interactive Rechart */}
        <div className="my-8">
          <DunningKrugerChart />
        </div>

        <p className="text-lg leading-relaxed text-foreground/80">
          This behavior contradicts rational choice theory. A calibrated investor—one who understands their own limitations—sticks to diversified Mutual Funds and Direct Equities. The overconfident retail trader, fueled by a false sense of expertise, is the one gambling on derivatives.
        </p>
      </section>

      {/* Finfluencers */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold">The Age of the "Finfluencer"</h2>
        <p className="text-lg leading-relaxed text-foreground/80">
          So, where is this overconfidence coming from? Our analysis points directly to the modern information ecosystem. We segmented investors based on their primary source of financial advice: Social Media vs. Traditional Professionals.
        </p>

        {/* Interactive Rechart */}
        <div className="my-8">
          <FinfluencerChart />
        </div>

        <p className="text-lg leading-relaxed text-foreground/80">
          The contrast is stark. Investors relying exclusively on social media "Finfluencers" are overwhelmingly motivated by <em>"Quick Speculative Gains"</em> (65%), whereas the professionally-advised cohort seeks <em>"Long Term Growth"</em> (72%). The gamification of finance on social media has fundamentally altered the retail investment horizon.
        </p>
      </section>

      {/* Predictive Modeling Call To Action */}
      <section className="space-y-6 p-8 bg-content2 rounded-xl border border-divider">
        <h2 className="text-2xl font-bold">Can We Predict Investor Behavior?</h2>
        <p className="text-lg leading-relaxed text-foreground/80">
          We tasked a series of Histogram-based Gradient Boosting Classifiers to forecast household behavior. We found that demographics alone are highly effective at predicting <strong>whether</strong> a household will participate (AUC = 0.76).
        </p>
        <p className="text-lg leading-relaxed text-foreground/80 mb-6">
          However, to predict <strong>how</strong> they participate (asset choice) and for <strong>how long</strong>, demographics fail. It is only when we inject psychographic traits—like financial literacy and social media reliance—that our predictive power surges (AUC = 0.83).
        </p>
        <Button onPress={() => router.push("/")} variant="primary" size="lg" className="font-semibold shadow-lg">
          Try the Live Prediction Simulator
        </Button>
      </section>

    </div>
  );
}
