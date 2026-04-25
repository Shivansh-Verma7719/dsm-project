"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  ScatterChart, Scatter, ZAxis, ResponsiveContainer 
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/charts";
import { Spinner } from "@heroui/react";

export function StateMetricsPanel() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/state-metrics`)
      .then(res => res.json())
      .then(d => {
        if (!d.error) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const top10 = useMemo(() => {
    return [...data]
      .sort((a, b) => b.investors_per_lakh - a.investors_per_lakh)
      .slice(0, 8)
      .map(d => ({
        ...d,
        investors_per_lakh: Math.round(d.investors_per_lakh)
      }));
  }, [data]);

  const scatterData = useMemo(() => {
    return data
      .filter(d => d.per_capita_income_2011 && d.investors_per_lakh)
      .map(d => ({
        name: d.state_name,
        income: Math.round(d.per_capita_income_2011),
        participation: Math.round(d.investors_per_lakh)
      }));
  }, [data]);

  if (loading) return (
    <div className="flex h-full items-center justify-center bg-[var(--paper-2)] border border-[var(--border)]">
      <Spinner size="sm" />
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top 8 States */}
      <div className="flex-1 min-h-[250px]" style={{ background: "var(--paper-2)", border: "1px solid var(--border)", padding: "1rem" }}>
        <h4 className="font-serif text-sm font-semibold mb-4" style={{ color: "var(--ink)" }}>
          Top 8 States by Investor Density
        </h4>
        <ChartContainer config={{ investors_per_lakh: { label: "Investors / Lakh", color: "var(--data-1)" } }} className="h-[190px] w-full">
          <BarChart data={top10} layout="vertical" margin={{ left: -10, right: 10 }}>
            <CartesianGrid strokeDasharray="2 3" horizontal={false} stroke="var(--border)" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="state_name" 
              type="category" 
              tick={{ fontSize: 9, fill: "var(--ink-3)", fontFamily: "'DM Sans', sans-serif" }}
              width={100}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" className="min-w-[180px]" />} />
            <Bar dataKey="investors_per_lakh" fill="var(--data-1)" radius={[0, 2, 2, 0]} barSize={10} />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Correlation Scatter */}
      <div className="flex-1 min-h-[240px]" style={{ background: "var(--paper-2)", border: "1px solid var(--border)", padding: "1rem" }}>
        <h4 className="font-serif text-sm font-semibold mb-2" style={{ color: "var(--ink)" }}>
          Income vs. Participation
        </h4>
        <p className="font-mono text-[0.65rem] text-[var(--ink-3)] mb-4 uppercase tracking-wider">
          Correlation: Per Capita Income to Density
        </p>
        <ChartContainer config={{ participation: { label: "Investors / Lakh", color: "var(--accent)" } }} className="h-[160px] w-full">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="2 3" stroke="var(--border)" />
            <XAxis 
              type="number" 
              dataKey="income" 
              name="Income" 
              unit="₹" 
              tick={{ fontSize: 9, fill: "var(--ink-3)" }}
              axisLine={false}
            />
            <YAxis 
              type="number" 
              dataKey="participation" 
              name="Density" 
              tick={{ fontSize: 9, fill: "var(--ink-3)" }}
              axisLine={false}
            />
            <ZAxis type="number" range={[50, 50]} />
            <ChartTooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              content={<ChartTooltipContent className="min-w-[150px]" />} 
            />
            <Scatter name="States" data={scatterData} fill="var(--accent)" />
          </ScatterChart>
        </ChartContainer>
      </div>
    </div>
  );
}
