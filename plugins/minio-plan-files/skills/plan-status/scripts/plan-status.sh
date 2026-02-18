#!/bin/bash
# plan-status.sh - planのステータス確認と failed plan の再投入
#
# 使い方:
#   ./plan-status.sh            ステータス一覧を表示
#   ./plan-status.sh retry      failed/ → pending/ に再投入してキューに送信
#
# 環境変数:
#   MINIO_SHARED_PLAN_FILES_PROJECT  プロジェクト名 (未設定時は git origin またはディレクトリ名)
#   MINIO_SHARED_PLAN_FILES_HOST                MinIO/SQS のホスト IP (default: localhost)
#   PLAN_S3_ENDPOINT         MinIO エンドポイント
#   PLAN_SQS_ENDPOINT        ElasticMQ エンドポイント
#   PLAN_BUCKET              S3 バケット名 (default: shared)
#   PLAN_AWS_PROFILE         AWS CLI プロファイル (default: share)

set -euo pipefail

# ========== 設定 ==========
HOST="${MINIO_SHARED_PLAN_FILES_HOST:-localhost}"
S3_ENDPOINT="${PLAN_S3_ENDPOINT:-http://${HOST}:9000}"
SQS_ENDPOINT="${PLAN_SQS_ENDPOINT:-http://${HOST}:9324}"
QUEUE_URL="${PLAN_QUEUE_URL:-${SQS_ENDPOINT}/000000000000/plans}"
BUCKET="${PLAN_BUCKET:-shared}"
PROFILE="${PLAN_AWS_PROFILE:-share}"
REGION="${PLAN_AWS_REGION:-us-east-1}"

# プロジェクト名: 環境変数 → git origin → ディレクトリ名
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
s3()  { aws --endpoint-url "$S3_ENDPOINT" --profile "$PROFILE" s3 "$@"; }
sqs() { aws --endpoint-url "$SQS_ENDPOINT" --region "$REGION" sqs "$@"; }
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2; }

# ========== status: 状態一覧 ==========
cmd_status() {
  echo "=== Plan Status: ${PROJECT} ==="
  for dir in pending processing done failed; do
    count=$(s3 ls "s3://${BUCKET}/${PROJECT}/${dir}/" 2>/dev/null | wc -l | tr -d ' ') || count=0
    printf "  %-12s %s 件\n" "${dir}/" "$count"
  done
  echo ""

  # キュー状態
  attrs=$(sqs get-queue-attributes \
    --queue-url "$QUEUE_URL" \
    --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible \
    2>/dev/null) || { echo "WARN: キュー情報取得に失敗しました"; return; }

  visible=$(echo "$attrs"   | jq -r '.Attributes.ApproximateNumberOfMessages // "?"')
  invisible=$(echo "$attrs" | jq -r '.Attributes.ApproximateNumberOfMessagesNotVisible // "?"')
  echo "=== Queue ==="
  echo "  待機中 (visible):   ${visible} 件"
  echo "  処理中 (invisible): ${invisible} 件"
}

# ========== retry: failed → pending に再投入 ==========
cmd_retry() {
  log "プロジェクト: ${PROJECT}"

  files=$(s3 ls "s3://${BUCKET}/${PROJECT}/failed/" 2>/dev/null | awk '{print $NF}') || true

  if [[ -z "$files" ]]; then
    log "failed/ に再投入対象のplanはありません"
    return
  fi

  count=0
  while IFS= read -r filename; do
    [[ -z "$filename" ]] && continue

    log "再投入: ${filename}"
    s3 mv \
      "s3://${BUCKET}/${PROJECT}/failed/${filename}" \
      "s3://${BUCKET}/${PROJECT}/pending/${filename}"

    sqs send-message \
      --queue-url "$QUEUE_URL" \
      --message-body "{\"s3_key\": \"${PROJECT}/pending/${filename}\", \"project\": \"${PROJECT}\", \"retried\": true}" \
      >/dev/null

    count=$((count + 1))
  done <<< "$files"

  log "再投入完了: ${count} 件"
}

# ========== メイン ==========
case "${1:-status}" in
  status|"")  cmd_status ;;
  retry)      cmd_retry ;;
  *)
    echo "使い方: $0 [status|retry]" >&2
    echo "  status  各プレフィックスの件数とキュー状態を表示 (default)" >&2
    echo "  retry   failed/ のplanを pending/ に移動してキューに再投入" >&2
    exit 1
    ;;
esac
