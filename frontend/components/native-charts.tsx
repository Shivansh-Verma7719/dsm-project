"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card } from "@heroui/react";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/charts"; // The user named it charts.tsx, not chart.tsx

const dunningKrugerData = [
  {
    cohort: "Calibrated (High Lit)",
    mf: 92,
    eq: 88,
    fo: 15,
    crypto: 10,
  },
  {
    cohort: "Overconfident (Low Lit)",
    mf: 85,
    eq: 81,
    fo: 35,
    crypto: 28,
  },
];

const dkChartConfig = {
  mf: { label: "Mutual Funds", color: "var(--chart-1)" },
  eq: { label: "Direct Equities", color: "var(--chart-2)" },
  fo: { label: "Derivatives (F&O)", color: "var(--chart-3)" },
  crypto: { label: "Cryptocurrency", color: "var(--chart-4)" },
};

export function DunningKrugerChart() {
  return (
    <Card className="w-full bg-background border-divider shadow-sm">
      <Card.Header>
        <Card.Title>The Dunning-Kruger Trap</Card.Title>
        <Card.Description>
          Overconfident investors hold risky, speculative assets at disproportionately higher rates than calibrated investors.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <ChartContainer config={dkChartConfig} className="h-[350px] w-full">
          <BarChart data={dunningKrugerData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--divider)" />
            <XAxis dataKey="cohort" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <ChartTooltip content={<ChartTooltipContent indicator="dot" />} cursor={{fill: 'var(--default-100)'}} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="mf" fill="var(--color-mf)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="eq" fill="var(--color-eq)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fo" fill="var(--color-fo)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="crypto" fill="var(--color-crypto)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card.Content>
    </Card>
  );
}

const finfluencerData = [
  { cohort: "Finfluencers Only", quick: 65, long: 20, regular: 15 },
  { cohort: "Professionals Only", quick: 18, long: 72, regular: 10 },
  { cohort: "No Advice / Self", quick: 25, long: 60, regular: 15 },
];

const finConfig = {
  quick: { label: "Quick Speculative Gains", color: "var(--chart-5)" },
  long: { label: "Long Term Growth", color: "var(--chart-1)" },
  regular: { label: "Regular Income", color: "var(--chart-2)" },
};

export function FinfluencerChart() {
  return (
    <Card className="w-full bg-background border-divider shadow-sm">
      <Card.Header>
        <Card.Title>Information Sourcing vs. Motives</Card.Title>
        <Card.Description>
          Investors relying exclusively on social media are heavily biased toward short-term speculative gains compared to professionally advised peers.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <ChartContainer config={finConfig} className="h-[350px] w-full">
          <BarChart data={finfluencerData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--divider)" />
            <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <YAxis dataKey="cohort" type="category" tickLine={false} axisLine={false} width={120} />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} cursor={{fill: 'var(--default-100)'}} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="quick" fill="var(--color-quick)" stackId="a" />
            <Bar dataKey="long" fill="var(--color-long)" stackId="a" />
            <Bar dataKey="regular" fill="var(--color-regular)" stackId="a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartContainer>
      </Card.Content>
    </Card>
  );
}
