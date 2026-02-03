"use client";

import { useRef, useEffect } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SubtitleSyncPanel() {
  const { learningData, currentLine, setCurrentLine } = usePlayerStore();
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLine]);

  return (
    <div className="h-full overflow-y-auto p-2">
      {learningData.map((item) => {
        const isActive = item.line === currentLine;
        return (
          <button
            key={item.line}
            ref={isActive ? activeRef : undefined}
            onClick={() => setCurrentLine(item.line)}
            className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
              isActive
                ? "bg-primary/20 border border-primary/40"
                : "hover:bg-card-hover border border-transparent"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`text-xs mt-0.5 shrink-0 ${isActive ? "text-primary" : "text-muted"}`}
              >
                {formatTime(item.startTime)}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm leading-relaxed ${isActive ? "text-foreground font-medium" : "text-muted"}`}
                >
                  {item.text}
                </p>
                <p className="text-xs text-muted mt-0.5 truncate">
                  {item.translation}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
