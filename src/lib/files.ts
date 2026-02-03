import fs from "fs/promises";
import path from "path";
import type { ScriptLine, TranslateLine, AnalysisLine } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data", "videos");

export function getVideoDir(youtubeId: string): string {
  return path.join(DATA_DIR, youtubeId);
}

export function getScriptPath(youtubeId: string): string {
  return path.join(getVideoDir(youtubeId), `${youtubeId}_script.txt`);
}

export function getTranslatePath(youtubeId: string): string {
  return path.join(
    getVideoDir(youtubeId),
    `${youtubeId}_script_translate.txt`
  );
}

export function getAnalysisPath(youtubeId: string): string {
  return path.join(
    getVideoDir(youtubeId),
    `${youtubeId}_script_analysis.json`
  );
}

export async function videoExists(youtubeId: string): Promise<boolean> {
  try {
    await fs.access(getScriptPath(youtubeId));
    await fs.access(getTranslatePath(youtubeId));
    await fs.access(getAnalysisPath(youtubeId));
    return true;
  } catch {
    return false;
  }
}

export async function ensureVideoDir(youtubeId: string): Promise<void> {
  await fs.mkdir(getVideoDir(youtubeId), { recursive: true });
}

export async function saveScriptFile(
  youtubeId: string,
  lines: { startTime: number; endTime: number; text: string }[]
): Promise<void> {
  await ensureVideoDir(youtubeId);
  const content = lines
    .map((line) => {
      const start = formatTime(line.startTime);
      const end = formatTime(line.endTime);
      return `[${start} --> ${end}] ${line.text}`;
    })
    .join("\n");
  await fs.writeFile(getScriptPath(youtubeId), content, "utf-8");
}

export async function saveTranslateFile(
  youtubeId: string,
  translations: string[]
): Promise<void> {
  await ensureVideoDir(youtubeId);
  const content = translations
    .map((t, i) => `[${i + 1}] ${t}`)
    .join("\n");
  await fs.writeFile(getTranslatePath(youtubeId), content, "utf-8");
}

export async function saveAnalysisFile(
  youtubeId: string,
  analysis: AnalysisLine[]
): Promise<void> {
  await ensureVideoDir(youtubeId);
  await fs.writeFile(
    getAnalysisPath(youtubeId),
    JSON.stringify(analysis, null, 2),
    "utf-8"
  );
}

export async function readScriptFile(
  youtubeId: string
): Promise<ScriptLine[]> {
  const content = await fs.readFile(getScriptPath(youtubeId), "utf-8");
  const lines = content.split("\n").filter((l) => l.trim());
  return lines.map((line, index) => {
    const match = line.match(
      /\[(\d+:\d+[:\d.]*)\s*-->\s*(\d+:\d+[:\d.]*)\]\s*(.*)/
    );
    if (!match) {
      return { line: index + 1, startTime: 0, endTime: 0, text: line };
    }
    return {
      line: index + 1,
      startTime: parseTime(match[1]),
      endTime: parseTime(match[2]),
      text: match[3],
    };
  });
}

export async function readTranslateFile(
  youtubeId: string
): Promise<TranslateLine[]> {
  const content = await fs.readFile(getTranslatePath(youtubeId), "utf-8");
  const lines = content.split("\n");
  // Only keep lines matching [number] format, skip Claude's explanation text
  return lines
    .map((line) => {
      const match = line.match(/^\[(\d+)\]\s*(.*)/);
      if (!match) return null;
      return {
        line: parseInt(match[1]),
        translation: match[2],
      };
    })
    .filter((item): item is TranslateLine => item !== null);
}

export async function readAnalysisFile(
  youtubeId: string
): Promise<AnalysisLine[]> {
  const content = await fs.readFile(getAnalysisPath(youtubeId), "utf-8");
  // Extract JSON array from content - Claude may add explanation text before/after
  const jsonStart = content.indexOf("[");
  const jsonEnd = content.lastIndexOf("]");
  if (jsonStart === -1 || jsonEnd === -1) {
    return [];
  }
  return JSON.parse(content.slice(jsonStart, jsonEnd + 1));
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toFixed(3).padStart(6, "0")}`;
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(":");
  if (parts.length === 3) {
    return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  }
  return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
}
