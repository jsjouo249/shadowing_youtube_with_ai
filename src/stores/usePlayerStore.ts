"use client";

import { create } from "zustand";
import type { LearningData } from "@/types";

interface PlayerState {
  // Video data
  youtubeId: string | null;
  learningData: LearningData[];
  isLoading: boolean;

  // Playback state
  currentLine: number;
  isPlaying: boolean;
  currentTime: number;
  isRepeating: boolean;

  // Seek flag: true only when user manually navigates (prev/next/click)
  seekRequested: boolean;

  // Sync offset (seconds): positive = subtitles delayed, negative = subtitles early
  syncOffset: number;

  // UI state
  showOriginal: boolean;
  showTranslation: boolean;
  activeTab: "interpretation" | "ai" | "shadowing" | "quiz" | "sync";

  // Actions
  setYoutubeId: (id: string) => void;
  setLearningData: (data: LearningData[]) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentLine: (line: number) => void;
  setCurrentLineFromTime: (line: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setIsRepeating: (repeating: boolean) => void;
  clearSeekRequest: () => void;
  adjustSyncOffset: (delta: number) => void;
  resetSyncOffset: () => void;
  toggleOriginal: () => void;
  toggleTranslation: () => void;
  setActiveTab: (tab: PlayerState["activeTab"]) => void;

  // Navigation
  goToPrevLine: () => void;
  goToNextLine: () => void;

  // Computed helpers
  getCurrentData: () => LearningData | null;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  youtubeId: null,
  learningData: [],
  isLoading: true,

  currentLine: 1,
  isPlaying: false,
  currentTime: 0,
  isRepeating: false,
  seekRequested: false,
  syncOffset: 0,

  showOriginal: true,
  showTranslation: true,
  activeTab: "interpretation",

  setYoutubeId: (id) => set({ youtubeId: id }),
  setLearningData: (data) => set({ learningData: data }),
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Manual navigation: triggers seek
  setCurrentLine: (line) =>
    set({ currentLine: line, isRepeating: false, seekRequested: true }),

  // Auto update from video time: no seek
  setCurrentLineFromTime: (line) => set({ currentLine: line }),

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsRepeating: (repeating) => set({ isRepeating: repeating }),
  clearSeekRequest: () => set({ seekRequested: false }),
  adjustSyncOffset: (delta) =>
    set((s) => ({ syncOffset: Math.round((s.syncOffset + delta) * 10) / 10 })),
  resetSyncOffset: () => set({ syncOffset: 0 }),
  toggleOriginal: () => set((s) => ({ showOriginal: !s.showOriginal })),
  toggleTranslation: () =>
    set((s) => ({ showTranslation: !s.showTranslation })),
  setActiveTab: (tab) => set({ activeTab: tab }),

  goToPrevLine: () => {
    const { currentLine } = get();
    if (currentLine > 1) {
      set({
        currentLine: currentLine - 1,
        isRepeating: false,
        seekRequested: true,
      });
    }
  },

  goToNextLine: () => {
    const { currentLine, learningData } = get();
    if (currentLine < learningData.length) {
      set({
        currentLine: currentLine + 1,
        isRepeating: false,
        seekRequested: true,
      });
    }
  },

  getCurrentData: () => {
    const { learningData, currentLine } = get();
    return learningData.find((d) => d.line === currentLine) || null;
  },
}));
