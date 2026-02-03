"use client";

import { useEffect, use } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import YouTubePlayer from "@/components/YouTubePlayer";
import SubtitleOverlay from "@/components/SubtitleOverlay";
import PlaybackControls from "@/components/PlaybackControls";
import InterpretationPanel from "@/components/InterpretationPanel";
import SubtitleSyncPanel from "@/components/SubtitleSyncPanel";
import type { LearningData } from "@/types";

const TABS = [
  { key: "interpretation" as const, label: "문장해석" },
  { key: "sync" as const, label: "자막싱크" },
] as const;

export default function LearnPage({
  params,
}: {
  params: Promise<{ youtubeId: string }>;
}) {
  const { youtubeId } = use(params);
  const {
    isLoading,
    activeTab,
    setYoutubeId,
    setLearningData,
    setIsLoading,
    setActiveTab,
  } = usePlayerStore();

  useEffect(() => {
    setYoutubeId(youtubeId);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/videos/${youtubeId}/data`);
        if (!res.ok) throw new Error("Failed to fetch data");
        const data: LearningData[] = await res.json();
        setLearningData(data);
      } catch (err) {
        console.error("Failed to load learning data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [youtubeId, setYoutubeId, setLearningData, setIsLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">학습 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Left: Video Area (70%) */}
      <div className="lg:w-[70%] w-full flex flex-col">
        {/* Video Player */}
        <div className="flex-1 p-4 pb-0 flex flex-col">
          <div className="flex-1 flex flex-col justify-center">
            <YouTubePlayer />
            <SubtitleOverlay />
          </div>
        </div>

        {/* Playback Controls */}
        <div className="p-4">
          <PlaybackControls />
        </div>
      </div>

      {/* Right: Learning Panel (30%) */}
      <div className="lg:w-[30%] w-full flex flex-col border-l border-border bg-card/50 h-full lg:h-screen overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-border shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "interpretation" && <InterpretationPanel />}
          {activeTab === "sync" && <SubtitleSyncPanel />}
        </div>

        {/* Back to Home */}
        <div className="p-3 border-t border-border shrink-0">
          <a
            href="/"
            className="block text-center text-sm text-muted hover:text-foreground transition-colors"
          >
            ← 홈으로 돌아가기
          </a>
        </div>
      </div>
    </div>
  );
}
