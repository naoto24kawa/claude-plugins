#!/bin/bash
# plan-submit.sh - planファイルをS3にアップロードしてキューに投入
# 使い方:
#   ./plan-submit.sh plan-001.json
#   ./plan-submit.sh plan-001.json plan-002.json plan-003.json
#   cat plans/*.json | xargs ./plan-submit.sh

set -euo pipefail

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
elif git remote get-url origin &>/dev/null; then
  PROJECT=$(git remote get-url origin \
    | sed 's|.*github\.com[:/]||' \
    | sed 's/\.git$//' \
    | sed 's/\//-/')
else
  PROJECT=$(basename "$(pwd)")
fi

s3() {
  aws --endpoint-url "$S3_ENDPOINT" --profile "$PROFILE" s3 "$@"
}

sqs() {
  aws --endpoint-url "$SQS_ENDPOINT" --region "$REGION" sqs "$@"
}

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2
}

if [[ $# -eq 0 ]]; then
  echo "使い方: $0 <plan-file> [plan-file...]" >&2
  exit 1
fi

log "プロジェクト: ${PROJECT}"

count=0
for file in "$@"; do
  if [[ ! -f "$file" ]]; then
    log "WARN: ファイルが見つかりません: $file"
    continue
  fi

  filename=$(basename "$file")
  s3_key="${PROJECT}/pending/${filename}"

  # S3にアップロード
  log "アップロード: ${file} → s3://${BUCKET}/${s3_key}"
  s3 cp "$file" "s3://${BUCKET}/${s3_key}" >/dev/null

  # キューに投入
  sqs send-message \
    --queue-url "$QUEUE_URL" \
    --message-body "{\"s3_key\": \"${s3_key}\", \"filename\": \"${filename}\", \"project\": \"${PROJECT}\", \"dispatched_at\": \"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\"}" \
    >/dev/null

  log "キューに投入: ${filename}"
  count=$((count + 1))
done

log "完了: ${count}件投入しました"
