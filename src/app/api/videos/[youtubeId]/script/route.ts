import { NextRequest, NextResponse } from "next/server";
import { readScriptFile } from "@/lib/files";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ youtubeId: string }> }
) {
  try {
    const { youtubeId } = await params;
    const script = await readScriptFile(youtubeId);
    return NextResponse.json(script);
  } catch {
    return NextResponse.json(
      { error: "Script file not found" },
      { status: 404 }
    );
  }
}
