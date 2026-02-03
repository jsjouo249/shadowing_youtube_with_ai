"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubePlayer() {
  const playerRef = useRef<YT.Player | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    youtubeId,
    learningData,
    currentLine,
    isRepeating,
    seekRequested,
    syncOffset,
    setCurrentTime,
    setCurrentLineFromTime,
    setIsPlaying,
    clearSeekRequest,
  } = usePlayerStore();

  const getCurrentData = usePlayerStore((s) => s.getCurrentData);

  // Update current line based on video time (no seek), applying sync offset
  const updateCurrentLine = useCallback(
    (time: number) => {
      // Apply offset: positive offset means subtitles should appear later,
      // so we subtract offset from video time to match earlier subtitle times
      const adjustedTime = time - syncOffset;
      const line = learningData.find(
        (d) => adjustedTime >= d.startTime && adjustedTime < d.endTime
      );
      if (line && line.line !== currentLine) {
        setCurrentLineFromTime(line.line);
      }
    },
    [learningData, currentLine, syncOffset, setCurrentLineFromTime]
  );

  // Handle repeating
  const handleRepeat = useCallback(
    (time: number) => {
      const data = getCurrentData();
      if (isRepeating && data && playerRef.current) {
        if (time >= data.endTime) {
          playerRef.current.seekTo(data.startTime, true);
        }
      }
    },
    [isRepeating, getCurrentData]
  );

  // Time tracking interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === "function"
      ) {
        try {
          const time = playerRef.current.getCurrentTime();
          setCurrentTime(time);
          updateCurrentLine(time);
          handleRepeat(time);
        } catch {
          // Player not ready
        }
      }
    }, 200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [setCurrentTime, updateCurrentLine, handleRepeat]);

  // Seek ONLY when user manually navigates (seekRequested === true)
  useEffect(() => {
    if (!seekRequested) return;

    const data = learningData.find((d) => d.line === currentLine);
    if (
      data &&
      playerRef.current &&
      typeof playerRef.current.seekTo === "function"
    ) {
      try {
        playerRef.current.seekTo(data.startTime, true);
      } catch {
        // Player not ready
      }
    }
    clearSeekRequest();
  }, [seekRequested, currentLine, learningData, clearSeekRequest]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (!youtubeId) return;

    const loadAPI = () => {
      if (window.YT && window.YT.Player) {
        createPlayer();
        return;
      }

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    };

    const createPlayer = () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }

      playerRef.current = new window.YT.Player("youtube-player", {
        videoId: youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          cc_load_policy: 0,
        },
        events: {
          onStateChange: (event: YT.OnStateChangeEvent) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          },
        },
      });
    };

    loadAPI();

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Player already destroyed
        }
        playerRef.current = null;
      }
    };
  }, [youtubeId, setIsPlaying]);

  // Expose player ref globally for PlaybackControls
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__ytPlayer = playerRef;
  }, []);

  return (
    <div className="youtube-container rounded-lg overflow-hidden">
      <div id="youtube-player" />
    </div>
  );
}
