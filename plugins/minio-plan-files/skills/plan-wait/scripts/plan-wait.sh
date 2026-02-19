#!/bin/bash
# plan-wait.sh - plan完了/失敗を通知キューで待機
#
# 使い方:
#   ./plan-wait.sh plan-001.json
#   ./plan-wait.sh plan-001.json plan-002.json
#   PLAN_WAIT_TIMEOUT=600 ./plan-wait.sh plan-001.json
#
# 環境変数:
#   MINIO_SHARED_PLAN_FILES_HOST  ホストIP (default: localhost)
#   PLAN_WAIT_TIMEOUT  最大待機秒数 (default: 300)
#   PLAN_SQS_ENDPOINT  SQSエンドポイント
#   PLAN_AWS_REGION    AWSリージョン (default: us-east-1)

set -euo pipefail

HOST="${MINIO_SHARED_PLAN_FILES_HOST:-localhost}"
SQS_ENDPOINT="${PLAN_SQS_ENDPOINT:-http://${HOST}:9324}"
NOTIFICATION_QUEUE_URL="${PLAN_NOTIFICATION_QUEUE_URL:-${SQS_ENDPOINT}/000000000000/plan-notifications}"
REGION="${PLAN_AWS_REGION:-us-east-1}"
TIMEOUT="${PLAN_WAIT_TIMEOUT:-300}"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >&2; }

if [[ $# -eq 0 ]]; then
  echo "使い方: $0 <filename> [filename...]" >&2
  exit 1
fi

# 待機対象をセットアップ
declare -A results
for f in "$@"; do
  results["$f"]="pending"
done

total=$#
deadline=$(($(date +%s) + TIMEOUT))

log "待機開始: ${total}件 (タイムアウト: ${TIMEOUT}秒)"
for f in "$@"; do
  log "  対象: $f"
done

remaining() {
  local count=0
  for status in "${results[@]}"; do
    [[ "$status" == "pending" ]] && count=$((count + 1))
  done
  echo "$count"
}

while [[ $(remaining) -gt 0 ]] && [[ $(date +%s) -lt $deadline ]]; do
  time_left=$(( deadline - $(date +%s) ))
  wait_time=$(( time_left < 20 ? time_left : 20 ))
  [[ $wait_time -le 0 ]] && break

  msg=$(aws --endpoint-url "$SQS_ENDPOINT" --region "$REGION" sqs receive-message \
    --queue-url "$NOTIFICATION_QUEUE_URL" \
    --max-number-of-messages 10 \
    --wait-time-seconds "$wait_time" 2>/dev/null || echo '{}')

  msg_count=$(echo "$msg" | jq -r '.Messages // [] | length')
  [[ "$msg_count" -eq 0 ]] && continue

  for i in $(seq 0 $((msg_count - 1))); do
    body=$(echo "$msg" | jq -r ".Messages[$i].Body")
    receipt=$(echo "$msg" | jq -r ".Messages[$i].ReceiptHandle")
    fname=$(echo "$body" | jq -r '.filename')
    status=$(echo "$body" | jq -r '.status')
    reason=$(echo "$body" | jq -r '.reason // "unknown"')
    s3_key=$(echo "$body" | jq -r '.s3_key')

    if [[ -n "${results[$fname]+x}" ]] && [[ "${results[$fname]}" == "pending" ]]; then
      results["$fname"]="${status}|${reason}|${s3_key}"
      log "受信: ${fname} → ${status}"
      # 対象の通知なのでメッセージを削除
      aws --endpoint-url "$SQS_ENDPOINT" --region "$REGION" sqs delete-message \
        --queue-url "$NOTIFICATION_QUEUE_URL" \
        --receipt-handle "$receipt" 2>/dev/null || true
    fi
    # 対象外は削除しない
  done
done

# 結果表示
echo ""
echo "=== Plan Wait Result ==="
done_count=0
failed_count=0
pending_count=0

for fname in "$@"; do
  val="${results[$fname]}"
  if [[ "$val" == "pending" ]]; then
    echo "  ${fname}: pending (timeout - まだ完了していません)"
    pending_count=$((pending_count + 1))
  else
    IFS='|' read -r status reason s3_key <<< "$val"
    if [[ "$status" == "done" ]]; then
      echo "  ${fname}: done (s3://shared/${s3_key})"
      done_count=$((done_count + 1))
    else
      echo "  ${fname}: failed (reason: ${reason}) (s3://shared/${s3_key})"
      failed_count=$((failed_count + 1))
    fi
  fi
done

echo ""
echo "完了: ${done_count}/${total}, 失敗: ${failed_count}/${total}, 未完了: ${pending_count}/${total}"
