"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/charts";

/* ──────────────────────────────────────────────────────────────
   Chart 1 — Dunning-Kruger Effect on Asset Allocation
────────────────────────────────────────────────────────────── */
const dunningKrugerData = [
  { cohort: "High Literacy\n(Calibrated)", mf: 92, eq: 88, fo: 15, crypto: 10 },
  { cohort: "Low Literacy\n(Overconfident)", mf: 85, eq: 81, fo: 35, crypto: 28 },
];

const dkChartConfig = {
  mf:     { label: "Mutual Funds",       color: "var(--data-1)" },
  eq:     { label: "Direct Equities",    color: "var(--data-3)" },
  fo:     { label: "Derivatives (F&O)",  color: "var(--data-2)" },
  crypto: { label: "Cryptocurrency",     color: "var(--data-4)" },
};

function ChartCard({ title, finding, children }: { title: string; finding: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--paper-2)", border: "1px solid var(--border)" }}>
      <div 
        className="px-5 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <h3 
          className="font-serif"
          style={{ fontSize: "1rem", fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}
        >
          {title}
        </h3>
        <p 
          className="mt-1.5 font-mono text-xs"
          style={{ color: "var(--accent)", lineHeight: 1.5 }}
        >
          {finding}
        </p>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

export function DunningKrugerChart() {
  return (
    <ChartCard
      title="The Dunning–Kruger Effect on Asset Risk"
      finding="Overconfident investors hold F&O / crypto at 2.3× the rate of calibrated investors"
    >
      <ChartContainer config={dkChartConfig} className="h-[300px] w-full">
        <BarChart data={dunningKrugerData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 3" vertical={false} stroke="var(--border)" />
          <XAxis 
            dataKey="cohort" 
            tickLine={false} 
            axisLine={false} 
            tickMargin={10}
            tick={{ fontSize: 11, fill: "var(--ink-3)", fontFamily: "'DM Sans', sans-serif" }}
          />
          <YAxis 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 10, fill: "var(--ink-3)", fontFamily: "'DM Mono', monospace" }}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} cursor={false} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="mf"     fill="var(--color-mf)"     radius={[3, 3, 0, 0]} maxBarSize={40} />
          <Bar dataKey="eq"     fill="var(--color-eq)"     radius={[3, 3, 0, 0]} maxBarSize={40} />
          <Bar dataKey="fo"     fill="var(--color-fo)"     radius={[3, 3, 0, 0]} maxBarSize={40} />
          <Bar dataKey="crypto" fill="var(--color-crypto)" radius={[3, 3, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}

/* ──────────────────────────────────────────────────────────────
   Chart 2 — Information Source vs Investment Motive
────────────────────────────────────────────────────────────── */
const finfluencerData = [
  { cohort: "Finfluencers Only",   quick: 65, regular: 15, long: 20 },
  { cohort: "Professional Advice", quick: 18, regular: 10, long: 72 },
  { cohort: "Self-Directed",       quick: 25, regular: 15, long: 60 },
];

const finConfig = {
  quick:   { label: "Speculative Gains",  color: "var(--data-4)" },
  regular: { label: "Regular Income",     color: "var(--data-2)" },
  long:    { label: "Long-Term Growth",   color: "var(--data-3)" },
};

export function FinfluencerChart() {
  return (
    <ChartCard
      title="Information Source vs. Investment Motive"
      finding="Finfluencer-only investors are 3.6× more likely to seek speculative gains than professionally advised peers"
    >
      <ChartContainer config={finConfig} className="h-[300px] w-full">
        <BarChart data={finfluencerData} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 3" horizontal={false} stroke="var(--border)" />
          <XAxis 
            type="number" 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 10, fill: "var(--ink-3)", fontFamily: "'DM Mono', monospace" }}
          />
          <YAxis 
            dataKey="cohort" 
            type="category" 
            tickLine={false} 
            axisLine={false} 
            width={130}
            tick={{ fontSize: 11, fill: "var(--ink-3)", fontFamily: "'DM Sans', sans-serif" }}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="line" />} cursor={false} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="quick"   fill="var(--color-quick)"   stackId="a" />
          <Bar dataKey="regular" fill="var(--color-regular)" stackId="a" />
          <Bar dataKey="long"    fill="var(--color-long)"    stackId="a" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
