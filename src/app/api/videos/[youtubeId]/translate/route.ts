import { NextRequest, NextResponse } from "next/server";
import { readTranslateFile } from "@/lib/files";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ youtubeId: string }> }
) {
  try {
    const { youtubeId } = await params;
    const translations = await readTranslateFile(youtubeId);
    return NextResponse.json(translations);
  } catch {
    return NextResponse.json(
      { error: "Translation file not found" },
      { status: 404 }
    );
  }
}
