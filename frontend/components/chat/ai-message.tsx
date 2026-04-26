"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  content: string;
  role: "user" | "assistant";
}

export function AIMessage({ content, role }: Props) {
  if (role === "user") {
    return <p className="font-mono text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>{content}</p>;
  }

  return (
    <div className="prose prose-sm max-w-none prose-invert">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="font-serif leading-relaxed mb-4 text-[0.95rem]" style={{ fontFamily: "var(--font-fraunces), serif", color: "var(--ink)" }}>
              {children}
            </p>
          ),
          h1: ({ children }) => <h1 className="font-serif text-xl font-bold mb-4" style={{ color: "var(--accent)" }}>{children}</h1>,
          h2: ({ children }) => <h2 className="font-serif text-lg font-bold mb-3" style={{ color: "var(--accent)" }}>{children}</h2>,
          h3: ({ children }) => <h3 className="font-serif text-md font-bold mb-2" style={{ color: "var(--ink)" }}>{children}</h3>,
          li: ({ children }) => (
            <li className="font-serif text-[0.9rem] mb-1.5" style={{ fontFamily: "var(--font-fraunces), serif", color: "var(--ink-2)" }}>
              {children}
            </li>
          ),
          code: ({ children }) => (
            <code className="font-mono text-[11px] bg-paper-3 px-1.5 py-0.5 rounded-sm" style={{ color: "var(--data-2)", background: "rgba(155, 154, 154, 0.2)" }}>
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full border-collapse font-mono text-[11px]" style={{ border: "1px solid var(--border)" }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="p-2 border text-left bg-paper-3 uppercase tracking-tighter" style={{ borderColor: "var(--border)", color: "var(--ink-3)" }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-2 border" style={{ borderColor: "var(--border)", color: "var(--ink-2)" }}>
              {children}
            </td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 pl-4 py-1 my-4 italic" style={{ borderColor: "var(--accent)", color: "var(--ink-3)" }}>
              {children}
            </blockquote>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
