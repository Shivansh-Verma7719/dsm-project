import React from "react";
import {motion} from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {Terminal} from 'lucide-react';

// Custom theme mapping to match project's Amber/Ink palette
const customTheme = {
  'code[class*="language-"]': { color: 'var(--ink)', fontFamily: 'var(--font-dm-mono)', lineHeight: '1.6' },
  'comment': { color: '#64748b', fontStyle: 'italic' },
  'keyword': { color: '#d4943a', fontWeight: 'bold' },
  'string': { color: '#10b981' },
  'function': { color: '#60a5fa' },
  'number': { color: '#f43f5e' },
  'operator': { color: '#94a3b8' },
  'attr-name': { color: '#d4943a' },
};

export const ReadingProgressBar = () => {
  const [completion, setCompletion] = React.useState(0);
  
  React.useEffect(() => {
    const updateScroll = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      if (scrollHeight) {
        setCompletion(Number((currentProgress / scrollHeight).toFixed(2)) * 100);
      }
    };
    window.addEventListener('scroll', updateScroll);
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  return (
    <div className="fixed top-12 left-0 w-full h-0.5 z-[60] pointer-events-none">
      <motion.div 
        className="h-full bg-[var(--data-1)]" 
        style={{ width: `${completion}%`, boxShadow: '0 0 10px var(--data-1)' }}
      />
    </div>
  );
};

export const ResearcherNote = ({ children }: { children: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    className="my-10 py-2 relative group"
  >
    <div className="absolute -left-12 top-0 text-7xl font-serif text-[var(--data-1)]/20 select-none group-hover:text-[var(--data-1)]/40 transition-colors">
      &ldquo;
    </div>
    <div className="font-fraunces italic text-2xl text-[var(--blog-ink)] leading-tight pl-4 border-l-2 border-[var(--data-1)]/30">
      {children}
    </div>
  </motion.div>
);

export const ETLStep = ({ number, title, description, icon: Icon }: { number: string, title: string, description: string, icon: any }) => (
  <div className="flex gap-8 group">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[var(--blog-ink-secondary)] group-hover:border-[var(--data-1)] group-hover:text-[var(--data-1)] transition-colors duration-500">
        <Icon size={18} />
      </div>
      <div className="w-px h-full bg-[var(--border)] my-4 group-last:hidden" />
    </div>
    <div className="pb-10">
      <span className="font-mono text-[0.6rem] uppercase tracking-tighter text-[var(--blog-ink-muted)]">{number}</span>
      <h3 className="text-xl font-bold mb-2 font-space-grotesk">{title}</h3>
      <p className="text-sm text-[var(--blog-ink-secondary)] leading-relaxed max-w-xl">{description}</p>
    </div>
  </div>
);

export const CodeHighlight = ({ title, code, language = "python" }: { title: string, code: string, language?: string }) => (
  <div className="my-6 rounded-xl overflow-hidden border border-[var(--border)] bg-[#ffffff] dark:bg-[#0A0A0B] backdrop-blur-sm">
    <div className="px-4 py-2 bg-[#ffffff] dark:bg-[#18181B] border-b border-[var(--border)] flex items-center justify-between">
      <span className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--blog-ink-muted)]">{title}</span>
      <Terminal size={12} className="text-[var(--blog-ink-muted)]" />
    </div>
    <div className="text-[0.8rem] font-mono overflow-x-auto">
      <SyntaxHighlighter 
        language={language} 
        style={customTheme as any}
        customStyle={{
          margin: 0,
          padding: '1.5rem',
          background: 'transparent',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  </div>
);

export const DataStat = ({ label, value, sub }: { label: string, value: string, sub?: string }) => (
  <div className="p-6 rounded-2xl border-b-2 border-transparent hover:border-[var(--data-1)] bg-[var(--surface)] transition-all duration-300">
    <div className="text-4xl font-bold mb-1 font-space-grotesk tracking-tight">{value}</div>
    <div className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--blog-ink-muted)]">{label}</div>
    {sub && <div className="text-[0.65rem] text-[var(--blog-ink-muted)] mt-2 italic">{sub}</div>}
  </div>
);

export const InsightCard = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon: any }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="py-6 border-t border-[var(--border)] group"
  >
    <div className="flex gap-6 items-start">
      <div className="w-10 h-10 rounded-lg bg-[var(--surface-sunken)] text-[var(--blog-ink-muted)] group-hover:text-[var(--data-1)] flex items-center justify-center transition-colors">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-xl font-bold mb-3 font-space-grotesk uppercase tracking-tight">{title}</h3>
        <div className="text-[var(--blog-ink-secondary)] text-sm leading-relaxed font-sans">
          {children}
        </div>
      </div>
    </div>
  </motion.div>
);

export const IterationNote = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="my-8 p-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30">
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--data-1)] animate-pulse" />
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-[var(--blog-ink-muted)]">Iteration {title}</span>
      </div>
      <div className="text-[var(--blog-ink-secondary)] text-sm leading-relaxed italic pl-4 border-l border-[var(--border)]">
        {children}
      </div>
    </div>
  </div>
);
