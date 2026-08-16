#!/usr/bin/env bash
# check-guarantees.sh の出自検査に対する positive control。
# 正例（fixtures/guarantees.md）で exit 0、負例（fixtures/guarantees-broken.md）で exit 1 になることを assert する。
# 判定は exit code のみで行う。checked= 等の数値は成功条件に焼き込まない。
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
LEDGER=fixtures/guarantees-broken.md TEST_DIR=fixtures/tests bash scripts/check-guarantees.sh
negative_exit=$?
if [ "$negative_exit" -eq 0 ]; then
  echo "FAIL: 負例で非 0 の exit を期待したが exit 0 だった（出自検査が退行している）" >&2
  failed=1
fi

if [ "$failed" -ne 0 ]; then
  echo "self-check: FAIL"
  exit 1
fi

echo "self-check: PASS"
exit 0
