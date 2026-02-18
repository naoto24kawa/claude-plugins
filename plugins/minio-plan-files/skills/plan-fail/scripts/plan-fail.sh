#!/bin/bash
# plan-fail.sh - 現在処理中の plan を失敗 (processing/ → failed/)
#
# 動作:
#   1. .current-plan からステートを読み込み
#   2. S3 上で processing/ → failed/ に移動
#   3. SQS メッセージを削除
#   4. .current-plan を削除
#
# 使い方:
#   ./plan-fail.sh                      # 理由なし
#   ./plan-fail.sh "API タイムアウト"   # 失敗理由を記録
#
# 失敗後の再投入: plan-status.sh retry
#
# 環境変数:
#   MINIO_SHARED_PLAN_FILES_HOST          MinIO/SQS のホスト IP (default: localhost)
#   PLAN_S3_ENDPOINT   MinIO エンドポイント
#   PLAN_SQS_ENDPOINT  ElasticMQ エンドポイント
#   PLAN_BUCKET        S3 バケット名 (default: shared)
#   PLAN_AWS_PROFILE   AWS CLI プロファイル (default: share)
#   PLAN_WORK_DIR      作業ディレクトリ (default: .)

set -euo pipefail

# ========== 設定 ==========
HOST="${MINIO_SHARED_PLAN_FILES_HOST:-localhost}"
S3_ENDPOINT="${PLAN_S3_ENDPOINT:-http://${HOST}:9000}"
SQS_ENDPOINT="${PLAN_SQS_ENDPOINT:-http://${HOST}:9324}"
QUEUE_URL="${PLAN_QUEUE_URL:-${SQS_ENDPOINT}/000000000000/plans}"
BUCKET="${PLAN_BUCKET:-shared}"
PROFILE="${PLAN_AWS_PROFILE:-share}"
REGION="${PLAN_AWS_REGION:-us-east-1}"
WORK_DIR="${PLAN_WORK_DIR:-.}"
STATE_FILE="${WORK_DIR}/.current-plan"

# ========== 共通関数 ==========
s3()  { aws --endpoint-url "$S3_ENDPOINT" --profile "$PROFILE" s3 "$@"; }
sqs() { aws --endpoint-url "$SQS_ENDPOINT" --region "$REGION" sqs "$@"; }
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2; }
die() { log "ERROR: $*"; exit 1; }

# ========== メイン ==========
if [[ ! -f "$STATE_FILE" ]]; then
  die "処理中のplanがありません (.current-plan が見つかりません)"
fi

# ステートを読み込み (PLAN_S3_KEY, PLAN_RECEIPT_HANDLE, PLAN_STARTED_AT, PLAN_LOCAL_PATH)
# shellcheck source=/dev/null
source "$STATE_FILE"

reason="${1:-unknown}"
filename=$(basename "$PLAN_S3_KEY")
plan_project=$(echo "$PLAN_S3_KEY" | cut -d/ -f1)
failed_key="${plan_project}/failed/${filename}"

log "S3: processing/ → failed/ に移動 (project: ${plan_project}, 理由: ${reason})"
s3 mv "s3://${BUCKET}/${PLAN_S3_KEY}" "s3://${BUCKET}/${failed_key}" \
  >&2 || die "S3 の移動に失敗しました"

log "SQS メッセージを削除"
sqs delete-message \
  --queue-url "$QUEUE_URL" \
  --receipt-handle "$PLAN_RECEIPT_HANDLE" \
  2>/dev/null || log "WARN: メッセージ削除に失敗しました (Visibility Timeout 済みの可能性)"

rm -f "$STATE_FILE"
log "失敗記録: ${filename} (理由: ${reason})"
log "再投入するには: plan-status.sh retry"
