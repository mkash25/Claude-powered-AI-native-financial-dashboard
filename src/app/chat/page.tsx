"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import { Header } from "@/components/layout/header";
import { Send, Bot, User, Loader2, ChevronDown, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "Which of my holdings are oversold right now?",
  "What are the top BUY recommendations?",
  "Compare my biggest gainers vs losers",
  "What's my portfolio health and top concern?",
  "If I contribute $1,500/month, when do I hit $1M?",
];

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({ api: "/api/chat" });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleExampleClick = (prompt: string) => {
    handleInputChange({
      target: { value: prompt },
    } as React.ChangeEvent<HTMLTextAreaElement>);
    inputRef.current?.focus();
  };

  return (
    <>
      <Header title="AI Chat" lastUpdated={null} />
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* ── Messages area ─────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-4 md:px-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6">
              <Bot size={48} className="text-indigo-400 opacity-60" />
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">
                  Ask about your portfolio
                </h2>
                <p className="text-sm text-gray-400 max-w-sm">
                  Claude has access to your holdings, market data, and analysis
                  to answer questions in real-time.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full max-w-md">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleExampleClick(prompt)}
                    className="text-left text-sm text-gray-300 bg-surface border border-white/8 rounded-lg px-4 py-3 hover:bg-white/5 hover:border-indigo-500/40 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
          )}
          {error && (
            <div className="text-sm text-red-400 text-center py-2">
              Error: {error.message}
            </div>
          )}
          <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Input area ────────────────────────────────────────────────────── */}
        <div className="border-t border-white/8 bg-surface px-4 py-3 md:px-6">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              placeholder="Ask about your portfolio..."
              rows={1}
              className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 focus:bg-white/8 transition-colors min-h-[48px] max-h-[160px] overflow-y-auto"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="shrink-0 w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Claude can query your live portfolio data · Powered by Claude claude-opus-4-5
          </p>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ msg }: { msg: any }) {
  const isUser = msg.role === "user";
  const isAssistant = msg.role === "assistant";

  // Check for tool invocations
  const toolCalls = msg.toolInvocations ?? [];

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1",
          isUser
            ? "bg-indigo-600"
            : "bg-gray-700"
        )}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Content */}
      <div className={cn("flex flex-col gap-2 max-w-[85%]", isUser ? "items-end" : "items-start")}>
        {/* Tool calls (shown before response) */}
        {toolCalls.length > 0 && (
          <div className="space-y-1.5">
            {toolCalls.map((tc: any, i: number) => (
              <ToolCallChip key={i} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Message text */}
        {msg.content && (
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
              isUser
                ? "bg-indigo-600 text-white rounded-tr-sm"
                : "bg-surface border border-white/8 text-gray-100 rounded-tl-sm"
            )}
          >
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallChip({ toolCall }: { toolCall: any }) {
  const [open, setOpen] = useState(false);
  const isDone = toolCall.state === "result";

  return (
    <div className="bg-indigo-950/40 border border-indigo-900/30 rounded-lg px-3 py-2 text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left"
      >
        <Wrench size={12} className="text-indigo-400 shrink-0" />
        <span className="text-indigo-300 font-medium">{toolCall.toolName}</span>
        {isDone && <span className="text-gray-500 ml-auto">✓</span>}
        <ChevronDown
          size={12}
          className={cn(
            "text-gray-500 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 text-gray-400">
          <div>
            <span className="text-gray-500">Args: </span>
            <code>{JSON.stringify(toolCall.args, null, 2)}</code>
          </div>
          {isDone && toolCall.result && (
            <div>
              <span className="text-gray-500">Result: </span>
              <code className="text-green-400">
                {JSON.stringify(toolCall.result).slice(0, 200)}…
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
