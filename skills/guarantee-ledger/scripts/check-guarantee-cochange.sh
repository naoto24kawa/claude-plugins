#!/usr/bin/env bash
# テストファイルは保証間で共有され、追加のたびに無関係な保証がWARNになるため、
# 保証台帳の各行について、対応実装の変更のみを同じ保証行の更新と突合する。
set -uo pipefail

LEDGER="${LEDGER:-fixtures/guarantees.md}"
BASE_REF="${BASE_REF:-origin/main}"

checked=0
warned=0

summary() {
  echo "cochange_checked=$checked cochange_warn=$warned"
}

fail() {
  echo "ERROR: $1" >&2
  summary
  exit 1
}

script_dir="${0%/*}"
if [ "$script_dir" = "$0" ]; then
  script_dir=.
fi
if ! ROOT=$(cd "$script_dir/.." && pwd -P); then
  fail "リポジトリルートを解決できない"
fi
if ! cd "$ROOT"; then
  fail "リポジトリルートへ移動できない: $ROOT"
fi

if [ ! -r "$LEDGER" ]; then
  fail "台帳を読み取れない: $LEDGER"
fi

if ! git rev-parse --verify --quiet "$BASE_REF^{commit}" >/dev/null; then
  fail "base refを解決できない: $BASE_REF"
fi

rows=$(rg '^\|' "$LEDGER")
rg_status=$?
case "$rg_status" in
  0) ;;
  1) fail "台帳の表を読み取れない: $LEDGER" ;;
  *) fail "台帳の表検査に失敗: $LEDGER" ;;
esac

changed_files=$(mktemp)
untracked_files=$(mktemp)
ledger_diff=$(mktemp)
trap 'rm -f "$changed_files" "$untracked_files" "$ledger_diff"' EXIT

# commit済み、未commit、未追跡の変更を全て集め、同一pathを1件へ畳む。
if ! git diff --name-only "$BASE_REF"...HEAD >"$changed_files"; then
  fail "commit済み差分を取得できない: $BASE_REF...HEAD"
fi
if ! git diff --name-only HEAD >>"$changed_files"; then
  fail "未commit差分を取得できない: HEAD"
fi
if ! git ls-files --others --exclude-standard >"$untracked_files"; then
  fail "未追跡ファイルを取得できない"
fi
if ! command sort -u "$changed_files" "$untracked_files" -o "$changed_files"; then
  fail "変更ファイル集合を作成できない"
fi

# G-ID行の更新もcommit済みと未commitの双方から集める。
if ! git diff "$BASE_REF"...HEAD -- "$LEDGER" >"$ledger_diff"; then
  fail "台帳のcommit済み差分を取得できない: $LEDGER"
fi
if ! git diff HEAD -- "$LEDGER" >>"$ledger_diff"; then
  fail "台帳の未commit差分を取得できない: $LEDGER"
fi

ledger_untracked=0
rg -F -x -q -- "$LEDGER" "$untracked_files"
rg_status=$?
case "$rg_status" in
  0) ledger_untracked=1 ;;
  1) ;;
  *) fail "未追跡台帳の判定に失敗: $LEDGER" ;;
esac

path_changed() {
  local path="$1"
  local rg_status
  rg -F -x -q -- "$path" "$changed_files"
  rg_status=$?
  case "$rg_status" in
    0) return 0 ;;
    1) return 1 ;;
    *) fail "変更pathの判定に失敗: $path" ;;
  esac
}

ledger_row_changed() {
  local id="$1"
  local rg_status
  if [ "$ledger_untracked" -eq 1 ]; then
    return 0
  fi
  rg -q "^[+-]\\|[[:space:]]*$id[[:space:]]*\\|" "$ledger_diff"
  rg_status=$?
  case "$rg_status" in
    0) return 0 ;;
    1) return 1 ;;
    *) fail "台帳行の変更判定に失敗: $id" ;;
  esac
}

trim_cell() {
  local value="$1"
  value="${value#"${value%%[![:space:]]*}"}"
  value="${value%"${value##*[![:space:]]}"}"
  TRIMMED_CELL="$value"
}

while IFS= read -r line; do
  case "$line" in
    *"(retired:"*) continue ;;
  esac

  if ! IFS='|' read -r _ id _ implementation _ _ <<< "$line"; then
    fail "台帳行を解析できない"
  fi
  trim_cell "$id"
  id="$TRIMMED_CELL"
  case "$id" in
    G-[0-9][0-9][0-9]) ;;
    *) continue ;;
  esac

  checked=$((checked + 1))

  if ledger_row_changed "$id"; then
    continue
  fi

  implementation="${implementation//\`/}"
  trim_cell "$implementation"
  implementation="$TRIMMED_CELL"

  changed_refs=()
  remaining="$implementation"
  while [[ "$remaining" == *", "* ]]; do
    path="${remaining%%, *}"
    if path_changed "$path"; then
      changed_refs+=("$path")
    fi
    remaining="${remaining#*, }"
  done
  if [ -n "$remaining" ] && path_changed "$remaining"; then
    changed_refs+=("$remaining")
  fi

  if [ "${#changed_refs[@]}" -gt 0 ]; then
    joined="${changed_refs[0]}"
    for path in "${changed_refs[@]:1}"; do
      joined="$joined, $path"
    done
    echo "COCHANGE_WARN: $id :: $joined" >&2
    warned=$((warned + 1))
  fi
done <<< "$rows"

summary

if [ "$warned" -gt 0 ]; then
  exit 2
fi
exit 0
