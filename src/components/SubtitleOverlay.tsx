"use client";

import { usePlayerStore } from "@/stores/usePlayerStore";
import type { Expression } from "@/types";

function highlightText(
  text: string,
  expressions: Expression[]
): React.ReactNode[] {
  if (!expressions || expressions.length === 0) {
    return [text];
  }

  // Sort by length descending to match longer expressions first
  const sorted = [...expressions].sort(
    (a, b) => b.expression.length - a.expression.length
  );

  const segments: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    let found = false;

    for (const expr of sorted) {
      const lowerRemaining = remaining.toLowerCase();
      const lowerExpr = expr.expression.toLowerCase();
      const idx = lowerRemaining.indexOf(lowerExpr);

      if (idx === 0) {
        const matched = remaining.slice(0, expr.expression.length);
        const colorClass =
          expr.highlightColor === "green"
            ? "text-highlight-green underline decoration-highlight-green/50"
            : "text-highlight-yellow underline decoration-highlight-yellow/50";

        segments.push(
          <span key={key++} className={`${colorClass} font-semibold`}>
            {matched}
          </span>
        );
        remaining = remaining.slice(expr.expression.length);
        found = true;
        break;
      } else if (idx > 0) {
        segments.push(
          <span key={key++}>{remaining.slice(0, idx)}</span>
        );
        const matched = remaining.slice(idx, idx + expr.expression.length);
        const colorClass =
          expr.highlightColor === "green"
            ? "text-highlight-green underline decoration-highlight-green/50"
            : "text-highlight-yellow underline decoration-highlight-yellow/50";
        segments.push(
          <span key={key++} className={`${colorClass} font-semibold`}>
            {matched}
          </span>
        );
        remaining = remaining.slice(idx + expr.expression.length);
        found = true;
        break;
      }
    }

    if (!found) {
      segments.push(<span key={key++}>{remaining}</span>);
      remaining = "";
    }
  }

  return segments;
}

export default function SubtitleOverlay() {
  const { showOriginal, showTranslation } = usePlayerStore();
  const getCurrentData = usePlayerStore((s) => s.getCurrentData);
  const data = getCurrentData();

  if (!data) return null;

  const allExpressions = [
    ...(data.keyExpressions || []),
    ...(data.idioms || []),
  ];

  return (
    <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 mt-2">
      {showOriginal && (
        <p className="text-white text-lg leading-relaxed">
          {highlightText(data.text, allExpressions)}
        </p>
      )}
      {showTranslation && data.translation && (
        <p className="text-gray-300 text-base mt-1">{data.translation}</p>
      )}
    </div>
  );
}
