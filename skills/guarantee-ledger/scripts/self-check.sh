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

if [ "$failed" -ne 0 ]; then
  echo "self-check: FAIL"
  exit 1
fi

echo "self-check: PASS"
exit 0
