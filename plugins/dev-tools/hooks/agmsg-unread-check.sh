#!/usr/bin/env bash
# agmsg-unread-check.sh — v0 可視化フック（Stop hook から呼ばれる）
#
# 「この agent が送ったのに受信側が一度も読んでいない（read_at IS NULL）」
# メッセージのうち、N 秒以上滞留したものを送信側に surface する。
# 分類・自動復旧・再送はしない。可視化と頻度計測のみ。
#
# 設計: agent-toolkit/.docs/plans/agmsg-unread-surfacing-design.md
#
# 規律: fail-open（可観測性フックであり進行を止めない）。identity 未解決・
# agmsg 未インストール・DB 不在・sqlite 失敗はすべて無出力で exit 0。
# Stop を絶対にブロックしない（decision:block / exit 2 を返さない）。

# NOTE: set -e は使わない（失敗で即終了せず、必ず exit 0 まで到達させるため）。
set -u

# Stop hook の stdin(JSON) は使わないが、読み捨てて SIGPIPE を避ける。
cat >/dev/null 2>&1 || true

# --- 設定（環境変数で上書き可能） ---
STALE_SECS="${AGMSG_UNREAD_STALE_SECS:-300}"   # 暫定 300s。ログの age 分布で後決め
LOG_FILE="${AGMSG_UNREAD_LOG:-$HOME/.claude/agmsg-unread-surfacing.log}"
AGMSG_DIR="${AGMSG_SKILL_DIR:-$HOME/.agents/skills/agmsg}"
WHOAMI="$AGMSG_DIR/scripts/whoami.sh"
STORAGE_LIB="$AGMSG_DIR/scripts/lib/storage.sh"

# 数値でなければ既定へ（不正な env で SQL を壊さない）
case "$STALE_SECS" in ''|*[!0-9]*) STALE_SECS=300 ;; esac

# --- 前提が無ければ黙って終了（fail-open） ---
command -v sqlite3 >/dev/null 2>&1 || exit 0
[ -x "$WHOAMI" ] || exit 0

PROJECT="${CLAUDE_PROJECT_DIR:-$PWD}"

# --- 自分の agmsg identity を解決 ---
# whoami.sh の出力例:
#   agent=<name> teams=... type=claude-code project=...
#   multiple=true agents=<n1,n2,...> teams=...
#   not_joined=true ... / suggest=true ...
WHO="$("$WHOAMI" "$PROJECT" claude-code 2>/dev/null)" || exit 0

AGENTS=""
case "$WHO" in
  # このプロジェクトに確定登録が無いケースは自分の送信ではないので surface しない。
  # suggest=true は「他プロジェクトの同型名の提案」であって登録ではない（agents= を
  # 含むため、この除外を先に置かないと下の agents= 抽出が他所の名前を誤採用する）。
  *not_joined=true*|*suggest=true*|*available_teams=none*) exit 0 ;;
esac
# agents=<csv>（複数）を優先、無ければ agent=<name>（単一）
if printf '%s\n' "$WHO" | grep -q 'agents='; then
  AGENTS="$(printf '%s\n' "$WHO" | tr ' ' '\n' | sed -n 's/^agents=//p' | head -1 | tr ',' ' ')"
else
  AGENTS="$(printf '%s\n' "$WHO" | tr ' ' '\n' | sed -n 's/^agent=//p' | head -1)"
fi
[ -n "${AGENTS// /}" ] || exit 0

# --- DB パス解決（agmsg の storage.sh があれば使い、無ければ既定へ） ---
DB=""
if [ -r "$STORAGE_LIB" ]; then
  DB="$( { . "$STORAGE_LIB" && agmsg_db_path; } 2>/dev/null )" || DB=""
fi
[ -n "$DB" ] || DB="${AGMSG_STORAGE_PATH:-$AGMSG_DIR/db}/messages.db"
[ -f "$DB" ] || exit 0

# --- from_agent IN (...) 用の SQL リストを組み立て（' をエスケープ） ---
IN_LIST=""
for a in $AGENTS; do
  esc="$(printf '%s' "$a" | sed "s/'/''/g")"
  IN_LIST="${IN_LIST:+$IN_LIST, }'$esc'"
done
[ -n "$IN_LIST" ] || exit 0

# --- 未読の自送信を抽出（UTC ISO8601 は辞書順=時刻順） ---
# 出力: to_agent|n|oldest_age_seconds
SQL="SELECT to_agent, count(*),
       CAST(strftime('%s','now') - strftime('%s', min(created_at)) AS INTEGER)
     FROM messages
     WHERE from_agent IN ($IN_LIST)
       AND read_at IS NULL
       AND created_at < strftime('%Y-%m-%dT%H:%M:%SZ','now','-${STALE_SECS} seconds')
     GROUP BY to_agent
     ORDER BY 3 DESC;"

ROWS="$(printf '%s\n' "$SQL" | sqlite3 -separator '|' "$DB" 2>/dev/null)" || exit 0
[ -n "$ROWS" ] || exit 0   # 未読なし → 黙って終了

# --- 人間可読な age 整形 ---
fmt_age() {
  local s="$1"
  if   [ "$s" -ge 3600 ]; then echo "$((s/3600))時間前"
  elif [ "$s" -ge 60 ];   then echo "$((s/60))分前"
  else echo "${s}秒前"; fi
}

NOW_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
PARTS=""
mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
while IFS='|' read -r to n age; do
  [ -n "$to" ] || continue
  PARTS="${PARTS:+$PARTS, }${to} ${n}件 (最古 $(fmt_age "$age"))"
  # 計測ログ: 時刻\t宛先\t件数\t最古age秒（後日 age 分布と頻度を集計）
  printf '%s\t%s\t%s\t%s\n' "$NOW_ISO" "$to" "$n" "$age" >>"$LOG_FILE" 2>/dev/null || true
done <<EOF
$ROWS
EOF

[ -n "$PARTS" ] || exit 0

MSG="⚠ agmsg 未読の送信（${STALE_SECS}s 超）: ${PARTS} — 相手の生存確認 / 再送を検討"

# 非ブロッキングで surface。decision:block は出さない。jq が無ければ素の stdout。
if command -v jq >/dev/null 2>&1; then
  jq -cn --arg m "$MSG" '{continue: true, suppressOutput: false, systemMessage: $m}'
else
  printf '%s\n' "$MSG"
fi
exit 0
