"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  lastUpdated?: string | null;
}

export function Header({ title, lastUpdated }: HeaderProps) {
  const [refreshState, setRefreshState] = useState<
    "idle" | "pending" | "running" | "done" | "error"
  >("idle");
  const [requestId, setRequestId] = useState<string | null>(null);

  const handleRefresh = async () => {
    if (refreshState === "pending" || refreshState === "running") return;
    setRefreshState("pending");

    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      if (!res.ok) throw new Error("Failed to queue refresh");
      const { id } = await res.json();
      setRequestId(id);
      setRefreshState("running");

      // Poll every 10s
      const poll = setInterval(async () => {
        const statusRes = await fetch(`/api/refresh?id=${id}`);
        if (!statusRes.ok) return;
        const { status } = await statusRes.json();
        if (status === "completed") {
          clearInterval(poll);
          setRefreshState("done");
          setTimeout(() => {
            setRefreshState("idle");
            window.location.reload();
          }, 1500);
        } else if (status === "failed") {
          clearInterval(poll);
          setRefreshState("error");
          setTimeout(() => setRefreshState("idle"), 3000);
        }
      }, 10_000);
    } catch {
      setRefreshState("error");
      setTimeout(() => setRefreshState("idle"), 3000);
    }
  };

  const refreshLabel = {
    idle:    "Refresh",
    pending: "Queuing…",
    running: "Running…",
    done:    "Done!",
    error:   "Failed",
  }[refreshState];

  const refreshColor = {
    idle:    "text-gray-400 hover:text-white",
    pending: "text-yellow-400",
    running: "text-blue-400",
    done:    "text-green-400",
    error:   "text-red-400",
  }[refreshState];

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-[#2d3748] bg-[#1a1a2e] sticky top-0 z-30">
      <h1 className="text-base font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-4">
        {lastUpdated && (
          <span className="text-xs text-gray-500 hidden sm:block">
            Updated {timeAgo(lastUpdated)}
          </span>
        )}
        <button
          onClick={handleRefresh}
          disabled={refreshState !== "idle"}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#2d3748] transition-colors",
            refreshColor,
            refreshState === "idle" ? "hover:bg-[#16213e]" : "opacity-80 cursor-not-allowed"
          )}
        >
          <RefreshCw
            size={12}
            className={refreshState === "running" ? "animate-spin" : ""}
          />
          {refreshLabel}
        </button>
      </div>
    </header>
  );
}
