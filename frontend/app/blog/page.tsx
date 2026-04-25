"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, MousePointer2, ChevronRight } from 'lucide-react';
import { ReadingProgressBar } from '@/components/blog/blog-components';
import BlogPart1 from '@/components/blog/blog-part1';
import BlogPart2 from '@/components/blog/blog-part2';
import BlogPart3 from '@/components/blog/blog-part3';
import BlogPart4 from '@/components/blog/blog-part4';

export default function BlogPage() {
  return (
    <article className="max-w-3xl mx-auto py-12 px-6 selection:bg-[var(--data-1)] selection:text-white relative">
      <ReadingProgressBar />

      {/* Editorial Header */}
      <header className="mb-20 border-b border-[#2c3340] pb-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-6 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-[#8a93a3]">
            <span className="text-[var(--data-1)]">Project Narrative</span>
            <span>•</span>
            <span>18 Min Read</span>
            <span>•</span>
            <span>April 2025</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-10 leading-[0.85] font-space-grotesk uppercase">
            Decoding the <br />
            <span className="text-[var(--data-1)] italic font-fraunces normal-case">Indian Retail</span> Investor
          </h1>

          <div className="flex items-center gap-6 p-4 rounded-2xl bg-[var(--surface-sunken)] border border-[var(--border)] w-fit">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--background)] bg-[var(--surface)] flex items-center justify-center overflow-hidden">
                  <Users size={16} className="text-[#8a93a3]" />
                </div>
              ))}
            </div>
            <div className="pr-4">
              <p className="text-[0.65rem] font-bold font-space-grotesk uppercase tracking-widest text-[var(--ink)]">The DSM Research Group</p>
              <p className="text-[0.6rem] text-[#8a93a3] font-mono">Data Science Methods • Spring 2025</p>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Prologue with Drop Cap */}
      <div className="prose prose-invert prose-lg max-w-none font-fraunces text-[#c2c7d0] leading-relaxed mb-24">
        <p className="text-3xl font-medium text-[var(--ink)] mb-10 leading-tight">
          <span className="float-left text-8xl font-space-grotesk font-bold text-[var(--data-1)] mr-4 leading-[0.8] mt-2">T</span>
          he numbers were a shock to the system. In a "Digital India" where UPI transactions happen at tea stalls
          in the remotest villages, we expected a similar democratization of the stock market. We were wrong.
        </p>
        <p>
          Our initial probe into the 2025 SEBI Household Survey revealed a staggering disconnect: <strong>74.5% of Indian
            households remain completely outside the securities market</strong>. No mutual funds, no equity, no SIPs.
          The market isn't just a physical exchange; it's a gated psychological garden.
        </p>
      </div>

      <BlogPart1 />
      <BlogPart2 />
      <BlogPart3 />
      <BlogPart4 />


      {/* Conclusion */}
      <section className="mt-32 pt-16 border-t border-[#2c3340]">
        <h2 className="text-4xl font-bold font-space-grotesk mb-10 uppercase tracking-tighter">The Way Forward</h2>
        <div className="prose prose-invert prose-lg max-w-none font-fraunces text-[#c2c7d0] leading-relaxed mb-16">
          <p>
            This journey taught us that data science is most powerful when it becomes a tool for empathy.
            By identifying these specific behavioral gates, we can begin to design financial systems
            that don't just provide access, but build genuine participation.
          </p>
        </div>

        <div className="p-10 rounded-2xl bg-[var(--surface-sunken)] border border-[#2c3340] flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex gap-6 items-center">
            <div className="w-16 h-16 rounded-full bg-[var(--data-1)]/10 flex items-center justify-center text-[var(--data-1)]">
              <MousePointer2 size={32} />
            </div>
            <div>
              <h4 className="text-xl font-bold font-space-grotesk uppercase">Live Predictor</h4>
              <p className="text-xs text-[#8a93a3] font-mono tracking-widest uppercase">Simulate Household Participation</p>
            </div>
          </div>
          <Link href="/" className="px-8 py-4 bg-[var(--ink)] text-[var(--background)] rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-2xl">
            Launch Platform <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footnote */}
      <footer className="mt-32 pt-8 border-t border-[#2c3340] text-[0.6rem] font-mono text-[#5a6374] uppercase tracking-[0.4em] text-center">
        Deep-Dive Securities Market Project • 2025
      </footer>
    </article>
  );
}
