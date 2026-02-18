#!/bin/bash
# plan-fetch.sh - SQSキューから1件のplanを取得してダウンロード
#
# 動作:
#   1. SQSキューからメッセージを1件取得 (最大 WAIT_SECONDS 秒待機)
#   2. S3上で pending/ → processing/ に移動
#   3. ローカルにダウンロード
#   4. .current-plan にステート保存 (plan-done.sh / plan-fail.sh が参照する)
#
# 出力 (stdout): ダウンロードしたファイルのパス
# ログ (stderr): 進捗メッセージ
#
# 環境変数:
#   MINIO_SHARED_PLAN_FILES_PROJECT  プロジェクト名 (未設定時は git origin またはディレクトリ名)
#   MINIO_SHARED_PLAN_FILES_HOST                MinIO/SQS のホスト IP (default: localhost)
#   PLAN_S3_ENDPOINT         MinIO エンドポイント
#   PLAN_SQS_ENDPOINT        ElasticMQ エンドポイント
#   PLAN_BUCKET              S3 バケット名 (default: shared)
#   PLAN_AWS_PROFILE         AWS CLI プロファイル (default: share)
#   PLAN_WORK_DIR            作業ディレクトリ (default: .)
#   PLAN_WAIT_SECONDS        メッセージ待機秒数 (default: 20)

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
WAIT_SECONDS="${PLAN_WAIT_SECONDS:-20}"

# プロジェクト名 (ローカルのデフォルト用。実際はメッセージの project フィールドを優先)
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
die() { log "ERROR: $*"; exit 1; }

# ========== メイン ==========
if [[ -f "$STATE_FILE" ]]; then
  die "処理中のplanがあります。先に plan-done.sh または plan-fail.sh を実行してください"
fi

log "プロジェクト: ${PROJECT}"
log "キューからメッセージを取得中... (最大${WAIT_SECONDS}秒待機)"

msg=$(sqs receive-message \
  --queue-url "$QUEUE_URL" \
  --max-number-of-messages 1 \
  --wait-time-seconds "$WAIT_SECONDS" \
  2>/dev/null) || die "SQSへの接続に失敗しました"

# メッセージがなければ正常終了 (exit 0)
if [[ -z "$msg" ]] || [[ "$(echo "$msg" | jq -r '.Messages // empty')" == "" ]]; then
  log "キューにメッセージがありません"
  exit 0
fi

body=$(echo "$msg"    | jq -r '.Messages[0].Body')
receipt=$(echo "$msg" | jq -r '.Messages[0].ReceiptHandle')
s3_key=$(echo "$body" | jq -r '.s3_key')

if [[ -z "$s3_key" ]] || [[ "$s3_key" == "null" ]]; then
  die "メッセージに s3_key がありません: $body"
fi

# メッセージ本文の project フィールドを優先 (投入側が設定したプロジェクト)
msg_project=$(echo "$body" | jq -r '.project // empty')
if [[ -z "$msg_project" ]]; then
  # project フィールドがない場合は s3_key の先頭セグメントから抽出
  msg_project=$(echo "$s3_key" | cut -d/ -f1)
fi

filename=$(basename "$s3_key")
processing_key="${msg_project}/processing/${filename}"

log "S3: pending/ → processing/ に移動 (project: ${msg_project})"
s3 mv "s3://${BUCKET}/${s3_key}" "s3://${BUCKET}/${processing_key}" \
  >&2 || die "S3 の移動に失敗しました"

local_path="${WORK_DIR}/${filename}"
log "ダウンロード → ${local_path}"
s3 cp "s3://${BUCKET}/${processing_key}" "$local_path" \
  >&2 || die "ダウンロードに失敗しました"

# ステートファイルに保存 (plan-done.sh / plan-fail.sh が参照する)
cat > "$STATE_FILE" <<EOF
PLAN_S3_KEY="${processing_key}"
PLAN_RECEIPT_HANDLE="${receipt}"
PLAN_STARTED_AT="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
PLAN_LOCAL_PATH="${local_path}"
EOF

log "取得完了: ${local_path}"
# stdout にファイルパスを出力 (呼び出し元がパイプ・変数キャプチャで利用可能)
echo "$local_path"
