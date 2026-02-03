"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProcessResponse {
  youtubeId: string;
  needsProcessing?: boolean;
  message?: string;
  error?: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [cliCommand, setCliCommand] = useState("");
  const [processedId, setProcessedId] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError("");
    setCliCommand("");

    try {
      const res = await fetch("/api/videos/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl: url.trim() }),
      });

      const data: ProcessResponse = await res.json();

      if (!res.ok) {
        setError(data.error || "오류가 발생했습니다.");
        return;
      }

      if (data.needsProcessing) {
        // Script extracted, but needs CLI translation
        setCliCommand(`npm run translate ${data.youtubeId}`);
        setProcessedId(data.youtubeId);
      } else {
        // Already fully processed, go to learn page
        router.push(`/learn/${data.youtubeId}`);
      }
    } catch {
      setError("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLearn = () => {
    if (processedId) {
      router.push(`/learn/${processedId}`);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-3">
          Shadowing <span className="text-primary">YouTube</span>
        </h1>
        <p className="text-muted text-lg mb-10">
          YouTube 영상으로 영어를 문장 단위로 학습하세요.
          <br />
          Claude가 번역과 핵심 표현을 분석해드립니다.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
                setCliCommand("");
              }}
              placeholder="YouTube 링크를 붙여넣으세요"
              className="flex-1 px-5 py-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted focus:outline-none focus:border-primary transition-colors text-lg"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="px-8 py-4 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  추출 중...
                </span>
              ) : (
                "자막 추출"
              )}
            </button>
          </div>

          {error && (
            <p className="text-red-400 text-sm mt-1">{error}</p>
          )}
        </form>

        {/* CLI command guide */}
        {cliCommand && (
          <div className="mt-8 text-left bg-card border border-border rounded-xl p-6">
            <p className="text-highlight-green font-semibold mb-3">
              자막 추출 완료!
            </p>
            <p className="text-sm text-muted mb-4">
              터미널에서 아래 명령어를 실행하여 Claude로 번역 및 표현 분석을
              진행하세요:
            </p>
            <div className="bg-background border border-border rounded-lg p-4 font-mono text-sm flex items-center justify-between">
              <code className="text-foreground">{cliCommand}</code>
              <button
                onClick={() => navigator.clipboard.writeText(cliCommand)}
                className="text-muted hover:text-foreground ml-3 shrink-0 transition-colors"
                title="복사"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-muted mt-3">
              번역이 완료되면 아래 버튼을 눌러 학습을 시작하세요.
            </p>
            <button
              onClick={handleGoToLearn}
              className="mt-4 w-full px-6 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-colors"
            >
              학습 시작하기
            </button>
          </div>
        )}

        {isLoading && (
          <div className="mt-8 text-muted">
            <p className="mb-2">자막을 추출하고 있습니다...</p>
            <div className="mt-4 w-full bg-border rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-full rounded-full animate-pulse w-2/3" />
            </div>
          </div>
        )}

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-5 bg-card rounded-xl border border-border">
            <div className="text-2xl mb-3">1</div>
            <h3 className="font-semibold mb-2">링크 입력</h3>
            <p className="text-sm text-muted">
              YouTube 링크를 붙여넣고 자막을 추출합니다.
            </p>
          </div>
          <div className="p-5 bg-card rounded-xl border border-border">
            <div className="text-2xl mb-3">2</div>
            <h3 className="font-semibold mb-2">Claude 번역</h3>
            <p className="text-sm text-muted">
              터미널에서 Claude CLI로 번역과 표현 분석을 실행합니다.
            </p>
          </div>
          <div className="p-5 bg-card rounded-xl border border-border">
            <div className="text-2xl mb-3">3</div>
            <h3 className="font-semibold mb-2">문장 학습</h3>
            <p className="text-sm text-muted">
              문장 단위로 영상을 보며 쉐도잉 학습하세요.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
