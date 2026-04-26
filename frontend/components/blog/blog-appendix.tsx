"use client";
import React from 'react';
import { Cpu, Globe, Server, Bot } from 'lucide-react';
import { CodeHighlight } from './blog-components';

export default function BlogAppendix() {
  return (
    <section id="appendix" className="mb-20 relative pt-16 border-t border-[#2c3340]">
      <div className="absolute -left-24 top-16 text-[10rem] font-space-grotesk font-bold text-[var(--blog-ink)]/10 select-none pointer-events-none leading-none">
        APPX
      </div>
      <div className="relative z-10">
        <h2 className="text-4xl font-bold font-space-grotesk mb-3 tracking-tight">Technical Appendix</h2>
        <p className="font-mono text-[0.6rem] text-[var(--blog-ink-secondary)] uppercase tracking-widest mb-12">Architecture · Inference · Agentic Workflow</p>

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            The final platform is a three-tier system designed for low-latency inference and 
            interactive exploration of the 109k-respondent dataset.
          </p>
        </div>

        {/* Tech Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)]">
            <div className="flex items-center gap-3 mb-4">
              <Globe size={20} className="text-[var(--data-1)]" />
              <h4 className="text-sm font-space-grotesk font-bold uppercase">Frontend</h4>
            </div>
            <p className="text-xs text-[var(--blog-ink-secondary)] leading-relaxed mb-4">
              Next.js 15, Tailwind CSS v4, and HeroUI v3. Framer Motion handles the high-density 
              interactive charts and the Barrier Wall visualization.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)]">
            <div className="flex items-center gap-3 mb-4">
              <Server size={20} className="text-[var(--data-1)]" />
              <h4 className="text-sm font-space-grotesk font-bold uppercase">Inference Backend</h4>
            </div>
            <p className="text-xs text-[var(--blog-ink-secondary)] leading-relaxed mb-4">
              FastAPI handles real-time requests. Trained scikit-learn models are loaded into memory 
              at startup via joblib for sub-20ms prediction latency.
            </p>
          </div>
        </div>

        <h3 className="text-2xl font-bold font-space-grotesk mb-6 tracking-tight">Agentic Reasoning via LangGraph</h3>
        
        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mb-12">
          <p>
            We implemented a <strong>Sales AI Agent</strong> using LangGraph and Google's Gemini 1.5 
            Flash. The agent has direct read-access to the PostgreSQL microdata and can execute 
            custom tools to score leads or optimize sales pitches.
          </p>
        </div>

        <CodeHighlight
          title="agent.py: LangGraph ReAct Agent with Custom Tools"
          code={`def get_agent_executor():
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
    
    # Custom tools for lead scoring & pitch optimization
    tools = [LeadScorer(), GeographicAnalyst(), PitchOptimizer()]
    
    # ReAct loop handles tool selection & response synthesis
    return create_react_agent(llm, tools=tools)`}
        />

        <div className="font-sans text-[var(--blog-ink-secondary)] leading-relaxed text-lg space-y-6 mt-12">
          <p>
            By integrating the ML models into the Agent's toolset, we bridge the gap between 
            "Black Box" prediction and conversational insight. A broker can ask, "Why is this 
            lead high potential?" and the agent will explain the impact of their product 
            awareness level using the underlying HGB model's feature importance.
          </p>
        </div>
      </div>
    </section>
  );
}
