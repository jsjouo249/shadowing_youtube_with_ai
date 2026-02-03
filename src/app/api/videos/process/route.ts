import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript-plus";
import { extractYoutubeId } from "@/lib/youtube";
import {
  videoExists,
  saveScriptFile,
  getTranslatePath,
  getAnalysisPath,
} from "@/lib/files";
import fs from "fs/promises";

function decodeHtmlEntities(text: string): string {
  // Decode &amp; first (double-encoded entities like &amp;#39; → &#39;)
  let decoded = text.replace(/&amp;/g, "&");
  // Then decode remaining entities
  decoded = decoded.replace(/&#39;/g, "'");
  decoded = decoded.replace(/&#x27;/g, "'");
  decoded = decoded.replace(/&quot;/g, '"');
  decoded = decoded.replace(/&lt;/g, "<");
  decoded = decoded.replace(/&gt;/g, ">");
  decoded = decoded.replace(/&nbsp;/g, " ");
  // Numeric entities (&#NNN;)
  decoded = decoded.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code))
  );
  return decoded;
}

export async function POST(request: NextRequest) {
  try {
    const { youtubeUrl } = await request.json();

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    const youtubeId = extractYoutubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Check if already fully processed (all 3 files exist)
    const exists = await videoExists(youtubeId);
    if (exists) {
      return NextResponse.json({
        youtubeId,
        title: "",
        subtitleCount: 0,
        isNew: false,
      });
    }

    // Check if translation/analysis is pending (script exists but others don't)
    let hasTranslate = false;
    let hasAnalysis = false;
    try {
      await fs.access(getTranslatePath(youtubeId));
      hasTranslate = true;
    } catch {}
    try {
      await fs.access(getAnalysisPath(youtubeId));
      hasAnalysis = true;
    } catch {}

    // Step 1: Extract subtitles
    let transcriptItems;
    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(youtubeId, {
        lang: "en",
      });
    } catch {
      return NextResponse.json(
        {
          error:
            "자막을 가져올 수 없습니다. 해당 영상에 영어 자막이 있는지 확인해주세요.",
        },
        { status: 400 }
      );
    }

    if (!transcriptItems || transcriptItems.length === 0) {
      return NextResponse.json(
        { error: "해당 영상에 사용 가능한 자막이 없습니다." },
        { status: 400 }
      );
    }

    // Process transcript lines (offset and duration are already in seconds)
    const rawLines = transcriptItems.map((item) => ({
      startTime: item.offset,
      endTime: item.offset + item.duration,
      text: decodeHtmlEntities(item.text.replace(/\n/g, " ")).trim(),
    }));

    // Fix overlapping timestamps: clamp each line's endTime to the next line's startTime
    const scriptLines = rawLines.map((line, i) => {
      if (i < rawLines.length - 1) {
        const nextStart = rawLines[i + 1].startTime;
        return {
          ...line,
          endTime: Math.min(line.endTime, nextStart),
        };
      }
      return line;
    });

    // Step 2: Save script file
    await saveScriptFile(youtubeId, scriptLines);

    // If translate/analysis not yet generated, tell the user
    if (!hasTranslate || !hasAnalysis) {
      return NextResponse.json({
        youtubeId,
        title: "YouTube Video",
        subtitleCount: scriptLines.length,
        isNew: true,
        needsProcessing: true,
        message:
          "자막 추출 완료. 터미널에서 아래 명령어를 실행해주세요:\nnpm run translate " +
          youtubeId,
      });
    }

    return NextResponse.json({
      youtubeId,
      title: "YouTube Video",
      subtitleCount: scriptLines.length,
      isNew: true,
    });
  } catch (error) {
    console.error("Video processing error:", error);
    return NextResponse.json(
      { error: "영상 처리 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
