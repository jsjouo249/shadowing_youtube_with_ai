import { NextRequest, NextResponse } from "next/server";
import { readAnalysisFile } from "@/lib/files";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ youtubeId: string }> }
) {
  try {
    const { youtubeId } = await params;
    const analysis = await readAnalysisFile(youtubeId);
    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json(
      { error: "Analysis file not found" },
      { status: 404 }
    );
  }
}
