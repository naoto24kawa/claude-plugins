#!/usr/bin/env bash
# check-guarantees.sh の出自・出自種別検査に対する positive control。
# 正例（fixtures/guarantees.md）で exit 0、負例（fixtures/guarantees-broken.md）で exit 1 になることを assert する。
# 件数は焼き込まず、exit code と出自種別の診断文字列を assert する。
set -uo pipefail

script_dir="${0%/*}"
if [ "$script_dir" = "$0" ]; then
  script_dir=.
fi
ROOT=$(cd "$script_dir/.." && pwd -P)
cd "$ROOT"

failed=0

echo "== 正例（fixtures/guarantees.md）を検査する =="
LEDGER=fixtures/guarantees.md TEST_DIR=fixtures/tests bash scripts/check-guarantees.sh
positive_exit=$?
if [ "$positive_exit" -ne 0 ]; then
  echo "FAIL: 正例で exit 0 を期待したが exit $positive_exit だった" >&2
  failed=1
fi

echo "== 負例（fixtures/guarantees-broken.md）を検査する =="
negative_stderr_file=$(mktemp)
trap 'rm -f "$negative_stderr_file"' EXIT
LEDGER=fixtures/guarantees-broken.md TEST_DIR=fixtures/tests bash scripts/check-guarantees.sh 2>"$negative_stderr_file"
negative_exit=$?
cat "$negative_stderr_file" >&2
if [ "$negative_exit" -eq 0 ]; then
  echo "FAIL: 負例で非 0 の exit を期待したが exit 0 だった（出自検査が退行している）" >&2
  failed=1
fi
if ! rg -F '出自種別が不正' "$negative_stderr_file" >/dev/null; then
  echo "FAIL: 負例の stderr に『出自種別が不正』が無い（出自種別検査が退行している）" >&2
  failed=1
fi

echo "== 表の無い保証レコードを検査する =="
if ! empty_ledger_file=$(mktemp); then
  echo "FAIL: 空の保証レコード用の一時ファイルを作成できない" >&2
  exit 1
fi
trap 'rm -f "$negative_stderr_file" "$empty_ledger_file"' EXIT
printf '# x\n\n本文\n' > "$empty_ledger_file"
empty_output=$(LEDGER="$empty_ledger_file" TEST_DIR=fixtures/tests bash scripts/check-guarantees.sh)
empty_exit=$?
printf '%s\n' "$empty_output"
if [ "$empty_exit" -ne 0 ] || [ "$empty_output" != 'checked=0 broken=0 unpinned=0 指示=0 選択=0' ]; then
  echo "FAIL: 表の無い保証レコードで全件数 0・exit 0 を期待したが exit $empty_exit だった" >&2
  failed=1
fi

echo "== 表の無い保証レコードで cochange を検査する =="
empty_cochange_output=$(LEDGER="$empty_ledger_file" BASE_REF=HEAD bash scripts/check-guarantee-cochange.sh)
empty_cochange_exit=$?
printf '%s\n' "$empty_cochange_output"
if [ "$empty_cochange_exit" -ne 0 ] || [ "$empty_cochange_output" != 'cochange_checked=0 cochange_warn=0' ]; then
  echo "FAIL: 表の無い保証レコードで cochange_checked=0・exit 0 を期待したが exit $empty_cochange_exit だった" >&2
  failed=1
fi

if [ "$failed" -ne 0 ]; then
  echo "self-check: FAIL"
  exit 1
fi

echo "self-check: PASS"
exit 0
