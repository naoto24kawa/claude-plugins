#!/bin/bash
# plan-fail.sh - processing/ のplanを失敗 (processing/ → failed/)
#
# 動作:
#   1. 対象ファイルを特定 (引数 or processing/ 内の唯一のファイル)
#   2. S3 上で processing/ → failed/ に移動
#
# 使い方:
#   ./plan-fail.sh                               # processing/ に1件だけある場合
#   ./plan-fail.sh plan-001.json                  # ファイル名を指定
#   ./plan-fail.sh plan-001.json "API タイムアウト"  # 失敗理由を記録
#
# 失敗後の再投入: plan-status.sh retry
#
# 環境変数:
#   MINIO_SHARED_PLAN_FILES_PROJECT  プロジェクト名
#   MINIO_SHARED_PLAN_FILES_HOST     MinIO のホスト IP (default: localhost)
#   PLAN_S3_ENDPOINT   MinIO エンドポイント
#   PLAN_BUCKET        S3 バケット名 (default: shared)
#   PLAN_AWS_PROFILE   AWS CLI プロファイル (default: share)

set -euo pipefail

# ========== 設定 ==========
HOST="${MINIO_SHARED_PLAN_FILES_HOST:-localhost}"
S3_ENDPOINT="${PLAN_S3_ENDPOINT:-http://${HOST}:9000}"
BUCKET="${PLAN_BUCKET:-shared}"
PROFILE="${PLAN_AWS_PROFILE:-share}"

# プロジェクト名
if [[ -n "${MINIO_SHARED_PLAN_FILES_PROJECT:-}" ]]; then
  PROJECT="$MINIO_SHARED_PLAN_FILES_PROJECT"
elif git remote get-url origin &>/dev/null 2>&1; then
  PROJECT=$(git remote get-url origin \
    | sed 's|.*github\.com[:/]||' \
    | sed 's/\.git$//' \
    | sed 's/\//-/')
else
  PROJECT=$(basename "$(pwd)")
fi

# ========== 共通関数 ==========
s3() { aws --endpoint-url "$S3_ENDPOINT" --profile "$PROFILE" s3 "$@"; }
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2; }
die() { log "ERROR: $*"; exit 1; }

# ========== 対象ファイル特定 ==========
if [[ -n "${1:-}" ]]; then
  filename="${1}"
  shift || true
else
  # processing/ 内のファイルを自動検出
  files=$(s3 ls "s3://${BUCKET}/${PROJECT}/processing/" 2>/dev/null | awk '{print $NF}' || true)
  count=$(echo "$files" | grep -c . 2>/dev/null || echo 0)

  if [[ "$count" -eq 0 ]]; then
    die "processing/ にファイルがありません"
  elif [[ "$count" -gt 1 ]]; then
    die "processing/ に複数のファイルがあります。ファイル名を指定してください:\n${files}"
  fi
  filename="$files"
fi

reason="${1:-unknown}"
processing_key="${PROJECT}/processing/${filename}"
failed_key="${PROJECT}/failed/${filename}"

# ========== メイン ==========
log "S3: processing/ → failed/ に移動 (project: ${PROJECT}, 理由: ${reason})"
s3 mv "s3://${BUCKET}/${processing_key}" "s3://${BUCKET}/${failed_key}" \
  >&2 || die "S3 の移動に失敗しました"

log "失敗記録: ${filename} (理由: ${reason})"
log "再投入するには: plan-status.sh retry"
