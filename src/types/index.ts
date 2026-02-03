export interface ScriptLine {
  line: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface TranslateLine {
  line: number;
  translation: string;
}

export interface Expression {
  expression: string;
  meaning: string;
  explanation: string;
  example: string;
  highlightColor: "green" | "yellow";
}

export interface AnalysisLine {
  line: number;
  keyExpressions: Expression[];
  idioms: Expression[];
}

export interface LearningData {
  line: number;
  startTime: number;
  endTime: number;
  text: string;
  translation: string;
  keyExpressions: Expression[];
  idioms: Expression[];
}

export interface VideoProcessResponse {
  youtubeId: string;
  title: string;
  subtitleCount: number;
  isNew: boolean;
}
