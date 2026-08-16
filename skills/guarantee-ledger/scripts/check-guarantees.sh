#!/usr/bin/env bash
# .docs/guarantees.md の対応実装と裏付けテスト索引が実在するか検査する。
# 検査対象が1つでも壊れていれば exit 1。
set -uo pipefail

# 導入時はプロジェクトの実パスへ書き換える。既定値は同梱 fixture を指す。
LEDGER="${LEDGER:-fixtures/guarantees.md}"
TEST_DIR="${TEST_DIR:-fixtures/tests}"
ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
cd "$ROOT"

if [ ! -f "$LEDGER" ]; then
  echo "ERROR: $LEDGER が存在しない" >&2
  exit 1
fi

failed=0
checked=0
unpinned=0

declared_name_exists() {
  local kind="$1"
  local expected="$2"
  local file="$3"
  awk -v kind="$kind" -v expected="$expected" '
    function declared_name(line, rest, quote, end) {
      rest = line
      sub(/^[[:space:]]*(describe|it|test)[[:space:]]*\([[:space:]]*/, "", rest)
      quote = substr(rest, 1, 1)
      if (quote != "\"" && quote != "\047") return ""
      rest = substr(rest, 2)
      end = index(rest, quote)
      if (end == 0) return ""
      return substr(rest, 1, end - 1)
    }
    {
      if (kind == "describe" && $0 !~ /^[[:space:]]*describe[[:space:]]*\(/) next
      if (kind == "test" && $0 !~ /^[[:space:]]*(it|test)[[:space:]]*\(/) next
      if (declared_name($0) == expected) found = 1
    }
    END { exit(found ? 0 : 1) }
  ' "$file"
}

# 表の行のみ（| で始まる行）をfail-closedで読み取る。
if ! rows=$(rg '^\|' "$LEDGER"); then
  echo "ERROR: 台帳の表を読み取れない: $LEDGER" >&2
  exit 1
fi

# retired を除き、対応実装・裏付けテスト・pin確認を取り出す。
while IFS= read -r line; do
  case "$line" in
    *"(retired:"*) continue ;;
  esac

  id=$(printf '%s\n' "$line" | awk -F'|' '{print $2}' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
  case "$id" in
    G-[0-9][0-9][0-9]) ;;
    *) continue ;;
  esac

  pin=$(printf '%s\n' "$line" | awk -F'|' '{print $6}' | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
  if [ -z "$pin" ]; then
    unpinned=$((unpinned + 1))
  elif [[ ! "$pin" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}\  ]]; then
    echo "BROKEN: pin確認の形式が不正: $id :: $pin" >&2
    failed=$((failed + 1))
    continue
  fi

  implementation=$(printf '%s\n' "$line" | awk -F'|' '{print $4}' | sed 's/`//g; s/^[[:space:]]*//; s/[[:space:]]*$//')
  if [ -z "$implementation" ]; then
    echo "BROKEN: 対応実装が空: $id" >&2
    failed=$((failed + 1))
    continue
  fi

  implementation_broken=0
  implementation_paths=()
  remaining="$implementation"
  if [[ "${implementation//, /}" == *","* ]]; then
    echo "BROKEN: 対応実装の形式が不正: $id :: $implementation" >&2
    failed=$((failed + 1))
    continue
  fi
  while [[ "$remaining" == *", "* ]]; do
    implementation_paths+=("${remaining%%, *}")
    remaining="${remaining#*, }"
  done
  implementation_paths+=("$remaining")
  for raw_path in "${implementation_paths[@]}"; do
    path=$(printf '%s\n' "$raw_path" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')
    if [ "$path" != "$raw_path" ]; then
      echo "BROKEN: 対応実装の形式が不正: $id :: $implementation" >&2
      failed=$((failed + 1))
      implementation_broken=1
      continue
    fi
    case "$path" in
      ""|/*|../*|*/../*|*/..)
        echo "BROKEN: 対応実装の形式が不正: $id :: $path" >&2
        failed=$((failed + 1))
        implementation_broken=1
        continue
        ;;
    esac
    if [ -L "$path" ]; then
      echo "BROKEN: 対応実装の形式が不正: $id :: $path" >&2
      failed=$((failed + 1))
      implementation_broken=1
      continue
    fi
    if [ ! -f "$path" ]; then
      echo "BROKEN: 対応実装ファイルが無い: $id :: $path" >&2
      failed=$((failed + 1))
      implementation_broken=1
      continue
    fi
    resolved_path=$(realpath "$path")
    case "$resolved_path" in
      "$ROOT"/*) ;;
      *)
        echo "BROKEN: 対応実装の形式が不正: $id :: $path" >&2
        failed=$((failed + 1))
        implementation_broken=1
        ;;
    esac
  done
  if [ "$implementation_broken" -ne 0 ]; then
    continue
  fi

  # 出自（7列目）。空と参照先ファイルの不在を検出する。
  # 見出しの実在は検査しない。形式検査を意味検査と誤認させないため（設計文書「機械検査の境界」）。
  provenance=$(printf '%s\n' "$line" | awk -F'|' '{print $7}' | sed 's/`//g; s/^[[:space:]]*//; s/[[:space:]]*$//')
  if [ -z "$provenance" ]; then
    echo "BROKEN: 出自が空: $id" >&2
    failed=$((failed + 1))
    continue
  fi
  case "$provenance" in
    *"::"*) ;;
    *)
      echo "BROKEN: 出自の形式が不正: $id :: $provenance" >&2
      failed=$((failed + 1))
      continue
      ;;
  esac
  provenance_path="${provenance%%::*}"
  case "$provenance_path" in
    ""|/*|../*|*/../*|*/..)
      echo "BROKEN: 出自の形式が不正: $id :: $provenance_path" >&2
      failed=$((failed + 1))
      continue
      ;;
  esac
  if [ -L "$provenance_path" ] || [ ! -f "$provenance_path" ]; then
    echo "BROKEN: 出自の参照先が無い: $id :: $provenance_path" >&2
    failed=$((failed + 1))
    continue
  fi
  resolved_provenance_path=$(realpath "$provenance_path")
  case "$resolved_provenance_path" in
    "$ROOT"/*) ;;
    *)
      echo "BROKEN: 出自の形式が不正: $id :: $provenance_path" >&2
      failed=$((failed + 1))
      continue
      ;;
  esac

  ref=$(printf '%s\n' "$line" | awk -F'|' '{print $5}' | sed 's/`//g; s/^[[:space:]]*//; s/[[:space:]]*$//')
  case "$ref" in
    "")
      echo "BROKEN: 裏付けテストが空または不正: $id" >&2
      failed=$((failed + 1))
      continue
      ;;
    *"::"*) ;;
    *)
      echo "BROKEN: 裏付けテストが空または不正: $id :: $ref" >&2
      failed=$((failed + 1))
      continue
      ;;
  esac

  file="${ref%%::*}"
  rest="${ref#*::}"

  case "$file" in
    ""|*/*)
      echo "BROKEN: 裏付けテストが空または不正: $id :: $ref" >&2
      failed=$((failed + 1))
      continue
      ;;
  esac

  test_path="$TEST_DIR/$file"
  if [ -L "$test_path" ] || [ ! -f "$test_path" ]; then
    echo "BROKEN: テストファイルが無い: $test_path" >&2
    failed=$((failed + 1))
    continue
  fi
  resolved_test_path=$(realpath "$test_path")
  case "$resolved_test_path" in
    "$ROOT"/*) ;;
    *)
      echo "BROKEN: 裏付けテストが空または不正: $id :: $ref" >&2
      failed=$((failed + 1))
      continue
      ;;
  esac

  case "$rest" in
    *">"*)
      if [[ "$rest" != *" > "* ]] || [[ "${rest#* > }" == *" > "* ]] || [[ "${rest// > /}" == *">"* ]]; then
        echo "BROKEN: 裏付けテストが空または不正: $id :: $ref" >&2
        failed=$((failed + 1))
        continue
      fi
      # describe 名と it/test 名の実宣言を独立に照合する。所属関係は解析しない（限界は risk-registry RISK-001 で受容済み）。
      describe="${rest%% > *}"
      test_name="${rest#* > }"
      if [ -z "$describe" ] || [ -z "$test_name" ]; then
        echo "BROKEN: 裏付けテストが空または不正: $id :: $ref" >&2
        failed=$((failed + 1))
        continue
      fi
      if ! declared_name_exists describe "$describe" "$TEST_DIR/$file"; then
        echo "BROKEN: describe が見つからない: $file :: $describe" >&2
        failed=$((failed + 1))
        continue
      fi
      if ! declared_name_exists test "$test_name" "$TEST_DIR/$file"; then
        echo "BROKEN: テスト名が見つからない: $file :: $test_name" >&2
        failed=$((failed + 1))
        continue
      fi
      ;;
    *)
      if ! declared_name_exists describe "$rest" "$TEST_DIR/$file"; then
        echo "BROKEN: テスト名が見つからない: $file :: $rest" >&2
        failed=$((failed + 1))
        continue
      fi
      ;;
  esac
  checked=$((checked + 1))
done <<< "$rows"

echo "checked=$checked broken=$failed unpinned=$unpinned"

if [ "$failed" -gt 0 ]; then
  exit 1
fi
exit 0
