#!/bin/bash
# plan-done.sh - 現在処理中の plan を完了 (processing/ → done/)
#
# 動作:
#   1. .current-plan からステートを読み込み
#   2. 結果ファイルがあればアップロード (省略可)
#   3. S3 上で processing/ → done/ に移動
#   4. SQS メッセージを削除
#   5. .current-plan を削除
#
# 使い方:
#   ./plan-done.sh                 # 完了のみ
#   ./plan-done.sh result.json     # 結果ファイルをアップロードして完了
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

filename=$(basename "$PLAN_S3_KEY")
plan_project=$(echo "$PLAN_S3_KEY" | cut -d/ -f1)
done_key="${plan_project}/done/${filename}"

# 結果ファイルのアップロード (引数があれば)
if [[ -n "${1:-}" ]]; then
  if [[ -f "$1" ]]; then
    result_basename="${filename%.json}-result.json"
    result_key="${plan_project}/done/${result_basename}"
    log "結果ファイルをアップロード: $1 → s3://${BUCKET}/${result_key}"
    s3 cp "$1" "s3://${BUCKET}/${result_key}" >&2 || die "結果ファイルのアップロードに失敗しました"
  else
    die "結果ファイルが見つかりません: $1"
  fi
fi

log "S3: processing/ → done/ に移動 (project: ${plan_project})"
s3 mv "s3://${BUCKET}/${PLAN_S3_KEY}" "s3://${BUCKET}/${done_key}" \
  >&2 || die "S3 の移動に失敗しました"

log "SQS メッセージを削除"
sqs delete-message \
  --queue-url "$QUEUE_URL" \
  --receipt-handle "$PLAN_RECEIPT_HANDLE" \
  2>/dev/null || log "WARN: メッセージ削除に失敗しました (Visibility Timeout 済みの可能性)"

rm -f "$STATE_FILE"
log "完了: ${filename}"
