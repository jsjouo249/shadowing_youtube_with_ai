"use client";

import { usePlayerStore } from "@/stores/usePlayerStore";
import type { Expression } from "@/types";

function ExpressionCard({
  expr,
  type,
}: {
  expr: Expression;
  type: "key" | "idiom";
}) {
  const bgColor =
    type === "key"
      ? "border-highlight-green/30 bg-highlight-green/5"
      : "border-highlight-yellow/30 bg-highlight-yellow/5";
  const textColor =
    type === "key" ? "text-highlight-green" : "text-highlight-yellow";

  return (
    <div className={`border ${bgColor} rounded-lg p-3 mb-2`}>
      <p className={`font-semibold ${textColor}`}>{expr.expression}</p>
      <p className="text-foreground text-sm mt-1">{expr.meaning}</p>
      <p className="text-muted text-xs mt-1">{expr.explanation}</p>
      <p className="text-muted text-xs mt-1 italic">
        &quot;{expr.example}&quot;
      </p>
    </div>
  );
}

export default function InterpretationPanel() {
  const { currentLine, learningData, goToPrevLine, goToNextLine } =
    usePlayerStore();
  const getCurrentData = usePlayerStore((s) => s.getCurrentData);
  const data = getCurrentData();

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full text-muted">
        데이터를 불러오는 중...
      </div>
    );
  }

  // Get next line data for preview
  const nextData = learningData.find((d) => d.line === currentLine + 1);
  const prevData = learningData.find((d) => d.line === currentLine - 1);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Previous line preview */}
      {prevData && (
        <button
          onClick={goToPrevLine}
          className="w-full text-left p-3 bg-card-hover/50 border-b border-border hover:bg-card-hover transition-colors"
        >
          <p className="text-xs text-muted mb-0.5">← 이전 문장</p>
          <p className="text-sm text-muted truncate">{prevData.text}</p>
        </button>
      )}

      {/* Current sentence section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current sentence */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-primary font-semibold">
              #{data.line}번 문장
            </span>
          </div>
          <p className="text-foreground text-base leading-relaxed font-medium">
            {data.text}
          </p>
          {data.translation && (
            <p className="text-muted text-sm mt-2">{data.translation}</p>
          )}
        </div>

        {/* Key Expressions */}
        {data.keyExpressions && data.keyExpressions.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-highlight-green mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-highlight-green rounded-full" />
              핵심 표현
            </h3>
            {data.keyExpressions.map((expr, i) => (
              <ExpressionCard key={`key-${i}`} expr={expr} type="key" />
            ))}
          </div>
        )}

        {/* Idioms */}
        {data.idioms && data.idioms.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-highlight-yellow mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-highlight-yellow rounded-full" />
              관용 표현
            </h3>
            {data.idioms.map((expr, i) => (
              <ExpressionCard key={`idiom-${i}`} expr={expr} type="idiom" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {(!data.keyExpressions || data.keyExpressions.length === 0) &&
          (!data.idioms || data.idioms.length === 0) && (
            <div className="text-center text-muted text-sm py-4">
              이 문장에는 특별한 표현이 없습니다.
            </div>
          )}
      </div>

      {/* Next line preview */}
      {nextData && (
        <button
          onClick={goToNextLine}
          className="w-full text-left p-3 bg-card-hover/50 border-t border-border hover:bg-card-hover transition-colors"
        >
          <p className="text-xs text-muted mb-0.5">다음 문장 →</p>
          <p className="text-sm text-muted truncate">{nextData.text}</p>
        </button>
      )}
    </div>
  );
}
