"use client";

import React, { useState, useEffect, useRef } from "react";
import { TextArea, Button } from "@heroui/react";
import { AIMessage } from "@/components/chat/ai-message";
import { TextShimmer } from "@/components/ui/text-shimmer";

interface StreamEvent {
  type: "token" | "tool_start" | "tool_end" | "done" | "error";
  content?: string;
  tool?: string;
  output?: string;
}

const HUMAN_TOOLS: Record<string, string> = {
  "LeadScorer": "Scoring Lead Potential",
  "GeographicAnalyst": "Mapping Geographic Opportunity",
  "PitchOptimizer": "Refining Sales Strategy",
  "sql_db_query": "Analyzing Microdata",
  "sql_db_list_tables": "Discovering Data Assets",
  "sql_db_schema": "Inspecting Data Architecture"
};

interface Message {
  role: string;
  content: string;
  tools?: string[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [completedTools, setCompletedTools] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const contentRef = useRef("");
  const toolsRef = useRef<string[]>([]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const backendHost = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/^https?:\/\//, "") || "127.0.0.1:8000";
    const wsUrl = `${protocol}//${backendHost}/ai/ws`;
    
    console.log("Connecting to AI WS:", wsUrl);
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log("AI WS Connected");
      setConnected(true);
    };
    ws.current.onclose = () => {
      console.log("AI WS Disconnected");
      setConnected(false);
    };
    ws.current.onerror = (err) => console.error("AI WS Error:", err);
    
    ws.current.onmessage = (event) => {
      try {
        const data: StreamEvent = JSON.parse(event.data);
        console.log("WS Message:", data.type, data);

        if (data.type === "token" && typeof data.content === "string") {
          contentRef.current += data.content;
          setStreamContent(contentRef.current);
        } else if (data.type === "tool_start") {
          setActiveTools(prev => {
            if (prev.includes(data.tool!)) return prev;
            return [...prev, data.tool!];
          });
        } else if (data.type === "tool_end") {
          setActiveTools(prev => prev.filter(t => t !== data.tool));
          setCompletedTools(prev => {
            if (prev.includes(data.tool!)) return prev;
            return [...prev, data.tool!];
          });
          if (!toolsRef.current.includes(data.tool!)) {
            toolsRef.current = [...toolsRef.current, data.tool!];
          }
        } else if (data.type === "done") {
          console.log("Stream Done. Final length:", contentRef.current.length);
          const finalContent = contentRef.current;
          const finalTools = [...toolsRef.current];
          
          if (finalContent || finalTools.length > 0) {
            setMessages(prev => [...prev, { 
              role: "assistant", 
              content: finalContent,
              tools: finalTools
            }]);
          }
          
          // Reset live states
          setLoading(false);
          setStreamContent("");
          contentRef.current = "";
          toolsRef.current = [];
          setCompletedTools([]);
          setActiveTools([]);
        } else if (data.type === "error") {
          console.error("Agent Error:", data.content);
          setStreamContent(prev => prev + `\n\n[Error: ${data.content}]`);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to parse WS message:", err);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [streamContent, activeTools, messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    console.log("Sending message:", userMsg);
    
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setStreamContent("");
    contentRef.current = "";
    toolsRef.current = [];
    setActiveTools([]);
    setCompletedTools([]);

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ message: userMsg }));
    } else {
      console.error("WS not open. ReadyState:", ws.current?.readyState);
      setStreamContent("Error: Agent is disconnected. Please wait for the 'Connected' status.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-5xl mx-auto" style={{ background: "var(--paper-2)", border: "1px solid var(--border)" }}>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)", background: "var(--paper-3)" }}>
        <div className="flex items-center gap-4">
          <div className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-amber-500 animate-pulse"}`} />
          <h1 className="font-serif text-lg font-semibold" style={{ color: "var(--ink)" }}>Sales Intelligence Agent</h1>
        </div>
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-tighter opacity-50">
          <span>Status:</span>
          <span className={connected ? "text-emerald-500" : "text-amber-500"}>{connected ? "Connected" : "Reconnecting..."}</span>
        </div>
      </div>

      {/* Main Experience Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-12 space-y-12"
      >
        {/* Past Messages */}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "space-y-4"}>
            {m.role === "user" ? (
              <div className="bg-paper-3 p-4 border rounded-sm max-w-xl font-mono text-sm" style={{ borderColor: "var(--border)" }}>
                {m.content}
              </div>
            ) : (
              <div className="space-y-4">
                {m.tools && m.tools.length > 0 && (
                   <div className="space-y-1.5">
                     {m.tools.map((t, tid) => (
                        <div key={tid} className="flex items-center gap-2 font-mono text-[10px] opacity-40">
                           <span>✓</span>
                           <span>{HUMAN_TOOLS[t] || t}</span>
                        </div>
                     ))}
                   </div>
                )}
                <AIMessage content={m.content} role="assistant" />
              </div>
            )}
          </div>
        ))}

        {/* Live Streaming Area */}
        {loading && (
          <div className="space-y-8 animate-in fade-in duration-700">
            {/* Tool Execution Log */}
            <div className="space-y-3">
              {completedTools.map((tool, idx) => (
                <div key={idx} className="flex items-center gap-3 font-mono text-[10px]" style={{ color: "var(--ink-3)" }}>
                   <span className="text-data-3">✓</span>
                   <span>{HUMAN_TOOLS[tool] || tool}</span>
                </div>
              ))}
              {activeTools.map((tool, idx) => (
                <div key={idx} className="flex items-center gap-3 font-mono text-[10px]">
                  <span className="h-1 w-1 rounded-full bg-accent animate-ping" />
                  <TextShimmer className="font-semibold uppercase tracking-widest">
                    {HUMAN_TOOLS[tool] || tool}
                  </TextShimmer>
                </div>
              ))}
              {activeTools.length === 0 && streamContent === "" && (
                <div className="flex items-center gap-3 font-mono text-[10px]">
                  <TextShimmer className="italic opacity-50">Synthesizing strategy...</TextShimmer>
                </div>
              )}
            </div>

            {/* The Response Body */}
            {streamContent && (
              <div className="border-t pt-8" style={{ borderColor: "var(--border)" }}>
                 <AIMessage content={streamContent} role="assistant" />
              </div>
            )}
          </div>
        )}
        
        {/* Initial Empty State */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
             <div className="font-serif text-2xl opacity-20 italic">Awaiting leads for analysis...</div>
             <p className="font-mono text-[10px] uppercase tracking-widest opacity-30">Analyze Leads • Map Opportunities in Kerala • Optimize Pitch for 80k Income</p>
          </div>
        )}
      </div>

      <div className="p-6 border-t" style={{ borderColor: "var(--border)", background: "var(--paper-3)" }}>
        <div className="flex gap-4 items-end">
          <TextArea 
            fullWidth
            placeholder="Describe a lead or ask a strategic question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            className="font-mono text-sm"
          />
          <Button 
            onPress={handleSend}
            variant="primary"
            isPending={loading}
            className="px-12 h-[52px] font-mono text-xs uppercase font-bold"
          >
            Execute
          </Button>
        </div>
      </div>
    </div>
  );
}
