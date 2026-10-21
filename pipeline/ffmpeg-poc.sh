#!/usr/bin/env bash
# TwelveLabs timestamps -> ffmpeg proof pipeline, tested empirically 2026-10-20.
#
# Real timestamp pair used: Pegasus 1.6 analyze (json_schema) on basketball-broll.mp4
# returned event {label: "camera zoom and tilt up", start_time: 6.0, end_time: 14.0}.
# Padded +/-2s per docs.twelvelabs.io boundary-uncertainty guidance, clamped to clip
# duration (13.972331s): window = [4.0, 13.97].
#
# NOTE on ffmpeg build: the default `brew install ffmpeg` formula does NOT include
# drawtext/libass (no libfreetype). Steps (a) and (b) work with it. Step (c)'s
# caption burn-in needs `brew install ffmpeg-full` (keg-only, invoke its binary
# directly or add it to PATH) -- see docs/twelvelabs-empirical-test.md for detail.

set -euo pipefail

SRC="${1:-data/fallback-assets/basketball-broll.mp4}"
OUT_DIR="${2:-data/fallback-assets/poc}"
START_PAD="${3:-4.0}"
END_PAD="${4:-13.97}"
CAPTION="${5:-TEST CAPTION}"
FONT="/System/Library/Fonts/Supplemental/Arial.ttf"

# Prefer ffmpeg-full (has drawtext/libass) if present; fall back to plain ffmpeg
# for steps (a)/(b), which don't need drawtext.
FFMPEG_FULL="/opt/homebrew/Cellar/ffmpeg-full/9.0.2/bin/ffmpeg"
FFMPEG_PLAIN="$(command -v ffmpeg || true)"

mkdir -p "$OUT_DIR"

echo "=== (a) stream-copy rough cut (fast, keyframe-snapped) ==="
"$FFMPEG_PLAIN" -y -ss "$START_PAD" -to "$END_PAD" -i "$SRC" -c copy "$OUT_DIR/rough_cut.mp4"

echo "=== (b) frame-accurate re-encode ==="
"$FFMPEG_PLAIN" -y -i "$SRC" -ss "$START_PAD" -to "$END_PAD" \
  -c:v libx264 -preset fast -crf 20 -c:a aac \
  "$OUT_DIR/precise_cut.mp4"

echo "=== (c) 9:16 crop 1080x1920 + caption burn-in (requires drawtext/libfreetype) ==="
if [ -x "$FFMPEG_FULL" ]; then
  ENGINE="$FFMPEG_FULL"
else
  echo "WARNING: ffmpeg-full not found at $FFMPEG_FULL; drawtext will likely fail on plain ffmpeg." >&2
  ENGINE="$FFMPEG_PLAIN"
fi

# Build -vf as one variable (quote the single-quoted text literal for ffmpeg's own
# filtergraph parser -- this is distinct from bash quoting). TESTED 2026-10-20: this
# exact pattern (one bash variable holding the full filter string, no nested bash
# escaping beyond double-quoting "$VF") ran clean on ffmpeg-full 9.0.2.
VF="crop=ih*9/16:ih,scale=1080:1920,drawtext=fontfile=${FONT}:text='${CAPTION}':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-200"

"$ENGINE" -y -i "$OUT_DIR/precise_cut.mp4" \
  -vf "$VF" \
  -c:v libx264 -preset fast -crf 20 -c:a aac \
  "$OUT_DIR/final_clip_9x16.mp4"

echo "Done. Outputs in $OUT_DIR:"
ls -la "$OUT_DIR"/*.mp4
