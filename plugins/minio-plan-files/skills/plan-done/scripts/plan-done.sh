#!/bin/bash
# plan-done.sh - processing/ のplanを完了 (processing/ → done/)
#
# 動作:
#   1. 対象ファイルを特定 (引数 or processing/ 内の唯一のファイル)
#   2. 結果ファイルがあればアップロード (省略可)
#   3. S3 上で processing/ → done/ に移動
#
# 使い方:
#   ./plan-done.sh                          # processing/ に1件だけある場合
#   ./plan-done.sh plan-001.json            # ファイル名を指定
#   ./plan-done.sh plan-001.json result.json  # 結果ファイルもアップロード
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

processing_key="${PROJECT}/processing/${filename}"
done_key="${PROJECT}/done/${filename}"

# ========== メイン ==========

# 結果ファイルのアップロード (第2引数があれば)
if [[ -n "${1:-}" ]]; then
  if [[ -f "$1" ]]; then
    result_basename="${filename%.json}-result.json"
    result_key="${PROJECT}/done/${result_basename}"
    log "結果ファイルをアップロード: $1 → s3://${BUCKET}/${result_key}"
    s3 cp "$1" "s3://${BUCKET}/${result_key}" >&2 || die "結果ファイルのアップロードに失敗しました"
  else
    die "結果ファイルが見つかりません: $1"
  fi
fi

log "S3: processing/ → done/ に移動 (project: ${PROJECT})"
s3 mv "s3://${BUCKET}/${processing_key}" "s3://${BUCKET}/${done_key}" \
  >&2 || die "S3 の移動に失敗しました"

# ========== 完了通知 ==========
SQS_ENDPOINT="${PLAN_SQS_ENDPOINT:-http://${HOST}:9324}"
NOTIFICATION_QUEUE_URL="${PLAN_NOTIFICATION_QUEUE_URL:-${SQS_ENDPOINT}/000000000000/plan-notifications}"
REGION="${PLAN_AWS_REGION:-us-east-1}"

log "通知送信: ${filename} → done"
aws --endpoint-url "$SQS_ENDPOINT" --region "$REGION" sqs send-message \
  --queue-url "$NOTIFICATION_QUEUE_URL" \
  --message-body "{\"filename\":\"${filename}\",\"project\":\"${PROJECT}\",\"status\":\"done\",\"reason\":null,\"s3_key\":\"${done_key}\",\"timestamp\":\"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\"}" \
  >/dev/null 2>&1 || log "WARN: 通知送信に失敗しました (処理自体は完了済み)"

log "完了: ${filename}"
