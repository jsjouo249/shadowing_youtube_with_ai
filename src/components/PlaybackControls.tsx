"use client";

import { useEffect, useCallback } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";

function getPlayer(): YT.Player | null {
  const ref = (window as unknown as Record<string, unknown>).__ytPlayer as
    | React.MutableRefObject<YT.Player | null>
    | undefined;
  return ref?.current || null;
}

export default function PlaybackControls() {
  const {
    currentLine,
    learningData,
    isPlaying,
    isRepeating,
    syncOffset,
    showOriginal,
    showTranslation,
    setIsRepeating,
    goToPrevLine,
    goToNextLine,
    toggleOriginal,
    toggleTranslation,
    adjustSyncOffset,
    resetSyncOffset,
  } = usePlayerStore();

  const togglePlay = useCallback(() => {
    const player = getPlayer();
    if (!player) return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }, [isPlaying]);

  const toggleRepeat = useCallback(() => {
    setIsRepeating(!isRepeating);
  }, [isRepeating, setIsRepeating]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case "1":
          e.preventDefault();
          goToPrevLine();
          break;
        case "2":
          e.preventDefault();
          togglePlay();
          break;
        case "3":
          e.preventDefault();
          toggleRepeat();
          break;
        case "4":
          e.preventDefault();
          goToNextLine();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevLine, goToNextLine, togglePlay, toggleRepeat]);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        {/* Playback buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevLine}
            disabled={currentLine <= 1}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-background border border-border rounded-lg hover:bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm">이전</span>
            <kbd className="ml-1 text-xs text-muted bg-border px-1.5 py-0.5 rounded">
              1
            </kbd>
          </button>

          <button
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
          >
            {isPlaying ? (
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
            <span className="text-sm">
              {isPlaying ? "일시정지" : "재생"}
            </span>
            <kbd className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded">
              2
            </kbd>
          </button>

          <button
            onClick={toggleRepeat}
            className={`flex items-center gap-1.5 px-4 py-2.5 border rounded-lg transition-colors ${
              isRepeating
                ? "bg-highlight-green/20 border-highlight-green/50 text-highlight-green"
                : "bg-background border-border hover:bg-card-hover"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span className="text-sm">반복</span>
            <kbd className="ml-1 text-xs text-muted bg-border px-1.5 py-0.5 rounded">
              3
            </kbd>
          </button>

          <button
            onClick={goToNextLine}
            disabled={currentLine >= learningData.length}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-background border border-border rounded-lg hover:bg-card-hover disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-sm">다음</span>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <kbd className="ml-1 text-xs text-muted bg-border px-1.5 py-0.5 rounded">
              4
            </kbd>
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Sync offset */}
          <div className="flex items-center gap-1 border border-border rounded-lg px-2 py-1.5">
            <span className="text-xs text-muted mr-1">싱크</span>
            <button
              onClick={() => adjustSyncOffset(-0.5)}
              className="w-6 h-6 flex items-center justify-center text-sm bg-background border border-border rounded hover:bg-card-hover transition-colors"
            >
              -
            </button>
            <button
              onClick={resetSyncOffset}
              className={`min-w-[3.5rem] text-center text-xs px-1 py-0.5 rounded transition-colors ${
                syncOffset !== 0
                  ? "text-highlight-yellow cursor-pointer hover:bg-card-hover"
                  : "text-muted"
              }`}
            >
              {syncOffset >= 0 ? "+" : ""}
              {syncOffset.toFixed(1)}s
            </button>
            <button
              onClick={() => adjustSyncOffset(0.5)}
              className="w-6 h-6 flex items-center justify-center text-sm bg-background border border-border rounded hover:bg-card-hover transition-colors"
            >
              +
            </button>
          </div>

          {/* Toggle buttons */}
          <button
            onClick={toggleOriginal}
            className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
              showOriginal
                ? "bg-primary/20 border-primary/50 text-primary"
                : "bg-background border-border text-muted hover:bg-card-hover"
            }`}
          >
            원문
          </button>
          <button
            onClick={toggleTranslation}
            className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
              showTranslation
                ? "bg-primary/20 border-primary/50 text-primary"
                : "bg-background border-border text-muted hover:bg-card-hover"
            }`}
          >
            번역
          </button>

          <span className="text-sm text-muted">
            {currentLine}/{learningData.length}
          </span>
        </div>
      </div>
    </div>
  );
}
