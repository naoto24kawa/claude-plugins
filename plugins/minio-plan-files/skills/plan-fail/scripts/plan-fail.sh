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

# ========== 失敗通知 ==========
SQS_ENDPOINT="${PLAN_SQS_ENDPOINT:-http://${HOST}:9324}"
NOTIFICATION_QUEUE_URL="${PLAN_NOTIFICATION_QUEUE_URL:-${SQS_ENDPOINT}/000000000000/plan-notifications}"
REGION="${PLAN_AWS_REGION:-us-east-1}"

log "通知送信: ${filename} → failed (理由: ${reason})"
aws --endpoint-url "$SQS_ENDPOINT" --region "$REGION" sqs send-message \
  --queue-url "$NOTIFICATION_QUEUE_URL" \
  --message-body "{\"filename\":\"${filename}\",\"project\":\"${PROJECT}\",\"status\":\"failed\",\"reason\":\"${reason}\",\"s3_key\":\"${failed_key}\",\"timestamp\":\"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\"}" \
  >/dev/null 2>&1 || log "WARN: 通知送信に失敗しました (処理自体は記録済み)"

log "失敗記録: ${filename} (理由: ${reason})"
log "再投入するには: plan-status.sh retry"
