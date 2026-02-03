#!/bin/bash
set -e

# 설정
CHUNK_COUNT=4

# 복수 프로세스 대기 스피너
spin_all() {
  local label=$1
  shift
  local pids=("$@")
  local total=${#pids[@]}
  local chars='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
  local start=$SECONDS
  local i=0

  while true; do
    local running=0
    for pid in "${pids[@]}"; do
      if kill -0 "$pid" 2>/dev/null; then
        running=$((running + 1))
      fi
    done
    if [ $running -eq 0 ]; then break; fi

    local elapsed=$(( SECONDS - start ))
    local min=$(( elapsed / 60 ))
    local sec=$(( elapsed % 60 ))
    local done_count=$(( total - running ))
    printf "\r  %s %s ... %d/%d 완료 %02d:%02d " \
      "${chars:i%${#chars}:1}" "$label" "$done_count" "$total" "$min" "$sec"
    sleep 0.1
    i=$((i + 1))
  done

  local elapsed=$(( SECONDS - start ))
  local min=$(( elapsed / 60 ))
  local sec=$(( elapsed % 60 ))
  printf "\r  ✓ %s 완료 (%02d:%02d)%*s\n" "$label" "$min" "$sec" 20 ""
}

YOUTUBE_ID="$1"

if [ -z "$YOUTUBE_ID" ]; then
  echo "사용법: npm run translate <youtubeId>"
  echo "예시:   npm run translate dQw4w9WgXcQ"
  exit 1
fi

VIDEO_DIR="data/videos/$YOUTUBE_ID"
SCRIPT_FILE="$VIDEO_DIR/${YOUTUBE_ID}_script.txt"
TRANSLATE_FILE="$VIDEO_DIR/${YOUTUBE_ID}_script_translate.txt"
ANALYSIS_FILE="$VIDEO_DIR/${YOUTUBE_ID}_script_analysis.json"

if [ ! -f "$SCRIPT_FILE" ]; then
  echo "오류: $SCRIPT_FILE 파일이 없습니다."
  echo "먼저 웹에서 YouTube URL을 입력하여 자막을 추출해주세요."
  exit 1
fi

LINE_COUNT=$(wc -l < "$SCRIPT_FILE" | tr -d ' ')
CHUNK_SIZE=$(( (LINE_COUNT + CHUNK_COUNT - 1) / CHUNK_COUNT ))

# 청크 수가 줄 수보다 많으면 조정
if [ "$CHUNK_COUNT" -gt "$LINE_COUNT" ]; then
  CHUNK_COUNT=$LINE_COUNT
  CHUNK_SIZE=1
fi

echo "=== Shadowing YouTube - Claude CLI 번역 (병렬) ==="
echo "영상 ID: $YOUTUBE_ID"
echo "자막 수: ${LINE_COUNT}줄 → ${CHUNK_COUNT}청크 병렬 처리"
echo ""

# 임시 디렉토리 생성 (종료 시 자동 삭제)
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# 파일을 청크로 분할
for ((i=0; i<CHUNK_COUNT; i++)); do
  start=$((i * CHUNK_SIZE + 1))
  end=$(( (i + 1) * CHUNK_SIZE ))
  if [ $end -gt $LINE_COUNT ]; then end=$LINE_COUNT; fi
  sed -n "${start},${end}p" "$SCRIPT_FILE" > "$TEMP_DIR/chunk_${i}.txt"
done

NEED_TRANSLATE=false
NEED_ANALYSIS=false

if [ -f "$TRANSLATE_FILE" ]; then
  echo "[번역] 이미 존재합니다. 건너뜁니다. (재생성하려면 파일을 삭제하세요)"
else
  NEED_TRANSLATE=true
fi

if [ -f "$ANALYSIS_FILE" ]; then
  echo "[분석] 이미 존재합니다. 건너뜁니다. (재생성하려면 파일을 삭제하세요)"
else
  NEED_ANALYSIS=true
fi

ALL_PIDS=()

# 번역 청크 병렬 실행
if $NEED_TRANSLATE; then
  for ((i=0; i<CHUNK_COUNT; i++)); do
    start_line=$((i * CHUNK_SIZE + 1))
    chunk_lines=$(wc -l < "$TEMP_DIR/chunk_${i}.txt" | tr -d ' ')

    cat "$TEMP_DIR/chunk_${i}.txt" | claude -p "당신은 영어-한국어 전문 번역가입니다. 아래 YouTube 영상의 영어 자막을 한국어로 번역해주세요.

[규칙]
1. 전체 문맥을 파악한 뒤 번역하세요.
2. 특정 라인이 잘리거나 이상한 경우, 앞뒤 라인을 참고하여 자연스러운 문장으로 보정하세요.
3. 직역보다 자연스러운 의역을 우선하되, 원래 의미를 왜곡하지 마세요.
4. 같은 인물의 말투는 일관되게 유지하세요.

[출력 형식]
- 반드시 원본과 동일한 줄 수(${chunk_lines}줄)로 출력하세요.
- 각 줄은 [번호] 번역 형식으로 출력하세요. 번호는 ${start_line}부터 시작합니다.
  예: [${start_line}] 우리가 이기면 상금을 나눠 가지자.
- 번호 없이 번역만 있는 줄, 설명, 빈 줄은 절대 포함하지 마세요." > "$TEMP_DIR/translate_${i}.txt" &
    ALL_PIDS+=($!)
  done
fi

# 분석 청크 병렬 실행
if $NEED_ANALYSIS; then
  for ((i=0; i<CHUNK_COUNT; i++)); do
    start_line=$((i * CHUNK_SIZE + 1))
    chunk_lines=$(wc -l < "$TEMP_DIR/chunk_${i}.txt" | tr -d ' ')
    end_line=$((start_line + chunk_lines - 1))

    cat "$TEMP_DIR/chunk_${i}.txt" | claude -p "당신은 영어 교육 전문가입니다. 아래 영어 자막의 각 문장에서 한국인 영어 학습자에게 유용한 핵심 표현과 관용 표현을 추출해주세요.

[규칙]
1. 모든 문장에 표현이 있는 것은 아닙니다. 없으면 빈 배열로 처리하세요.
2. 핵심 표현(keyExpressions): 일상에서 자주 쓰이는 유용한 표현, 구동사, 콜로케이션 등. highlightColor는 반드시 \"green\".
3. 관용 표현(idioms): 숙어, 속담, 비유적 표현 등. highlightColor는 반드시 \"yellow\".
4. 각 표현에 대해 meaning(한국어 의미), explanation(설명), example(예문)을 포함하세요.
5. 반드시 ${chunk_lines}개 라인에 대한 결과를 출력하세요 (line ${start_line}부터 line ${end_line}까지).

[출력]
순수 JSON 배열만 출력하세요. 마크다운 코드블록, 설명 텍스트 없이 [ 로 시작해서 ] 로 끝나야 합니다.

[JSON 형식]
[
  {
    \"line\": ${start_line},
    \"keyExpressions\": [
      { \"expression\": \"표현\", \"meaning\": \"의미\", \"explanation\": \"설명\", \"example\": \"예문\", \"highlightColor\": \"green\" }
    ],
    \"idioms\": [
      { \"expression\": \"표현\", \"meaning\": \"의미\", \"explanation\": \"설명\", \"example\": \"예문\", \"highlightColor\": \"yellow\" }
    ]
  }
]" > "$TEMP_DIR/analysis_${i}.json" &
    ALL_PIDS+=($!)
  done
fi

# 모든 프로세스 대기
if [ ${#ALL_PIDS[@]} -gt 0 ]; then
  TASK_DESC=""
  if $NEED_TRANSLATE && $NEED_ANALYSIS; then
    TASK_DESC="번역 + 분석 (${#ALL_PIDS[@]}개 병렬)"
  elif $NEED_TRANSLATE; then
    TASK_DESC="번역 (${#ALL_PIDS[@]}개 병렬)"
  else
    TASK_DESC="분석 (${#ALL_PIDS[@]}개 병렬)"
  fi

  echo "[처리] $TASK_DESC"
  spin_all "$TASK_DESC" "${ALL_PIDS[@]}"

  # 종료 코드 확인
  FAILED=false
  for pid in "${ALL_PIDS[@]}"; do
    wait "$pid" || FAILED=true
  done

  if $FAILED; then
    echo ""
    echo "오류: 일부 처리가 실패했습니다. 재시도해주세요."
    exit 1
  fi
fi

# 번역 결과 병합
if $NEED_TRANSLATE; then
  for ((i=0; i<CHUNK_COUNT; i++)); do
    cat "$TEMP_DIR/translate_${i}.txt"
  done > "$TRANSLATE_FILE"
  echo "  → $TRANSLATE_FILE"
fi

# 분석 결과 병합 (JSON 배열 합치기)
if $NEED_ANALYSIS; then
  node -e "
    const fs = require('fs');
    const merged = [];
    for (let i = 0; i < $CHUNK_COUNT; i++) {
      const raw = fs.readFileSync('$TEMP_DIR/analysis_' + i + '.json', 'utf8').trim();
      // 마크다운 코드블록 제거
      const cleaned = raw.replace(/^\`\`\`json?\n?/,'').replace(/\n?\`\`\`$/,'').trim();
      merged.push(...JSON.parse(cleaned));
    }
    merged.sort((a, b) => a.line - b.line);
    fs.writeFileSync('$ANALYSIS_FILE', JSON.stringify(merged, null, 2));
  "
  echo "  → $ANALYSIS_FILE"
fi

echo ""
echo "=== 완료! ==="
echo "브라우저에서 http://localhost:3000/learn/$YOUTUBE_ID 로 접속하세요."
