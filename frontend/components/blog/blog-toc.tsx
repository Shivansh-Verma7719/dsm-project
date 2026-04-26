"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SECTIONS = [
  { id: 'raw-data', label: '01 The Raw Data Problem' },
  { id: 'what-we-measured', label: '02 What We Measured' },
  { id: 'the-models', label: '03 The Models' },
  { id: 'what-we-found', label: '04 What We Found' },
  { id: 'appendix', label: 'Technical Appendix' },
];

export const BlogTOC = () => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observers = new Map();
    
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveId(entry.target.id);
        }
      });
    };

    const observerOptions = {
      rootMargin: '-20% 0% -70% 0%', // Adjust based on when you want the section to be considered "active"
      threshold: 0,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    SECTIONS.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav className="sticky top-24 hidden lg:block w-48 shrink-0 h-fit self-start">
      <div className="border-l border-[var(--border)] pl-6 space-y-4 relative">
        <h4 className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--blog-ink-muted)] mb-6">
          Contents
        </h4>
        
        {SECTIONS.map((section) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`block text-left text-xs font-space-grotesk transition-all duration-300 group relative ${
                isActive 
                  ? 'text-[var(--data-1)] font-bold translate-x-1' 
                  : 'text-[var(--blog-ink-secondary)] hover:text-[var(--ink)]'
              }`}
            >
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="toc-indicator"
                    className="absolute -left-[25px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--data-1)]"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                  />
                )}
              </AnimatePresence>
              {section.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
