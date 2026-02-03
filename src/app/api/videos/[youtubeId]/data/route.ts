import { NextRequest, NextResponse } from "next/server";
import { readScriptFile, readTranslateFile, readAnalysisFile } from "@/lib/files";
import type { LearningData } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ youtubeId: string }> }
) {
  try {
    const { youtubeId } = await params;

    const [script, translations, analysis] = await Promise.all([
      readScriptFile(youtubeId),
      readTranslateFile(youtubeId),
      readAnalysisFile(youtubeId),
    ]);

    const translateMap = new Map(translations.map((t) => [t.line, t.translation]));
    const analysisMap = new Map(analysis.map((a) => [a.line, a]));

    const data: LearningData[] = script.map((s) => {
      const a = analysisMap.get(s.line);
      return {
        line: s.line,
        startTime: s.startTime,
        endTime: s.endTime,
        text: s.text,
        translation: translateMap.get(s.line) || "",
        keyExpressions: a?.keyExpressions || [],
        idioms: a?.idioms || [],
      };
    });

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Learning data not found" },
      { status: 404 }
    );
  }
}
