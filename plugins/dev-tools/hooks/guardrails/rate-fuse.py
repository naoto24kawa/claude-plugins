#!/usr/bin/env python3
"""汎用レート制限フューズ hook（PreToolUse）。

指定したツールパターンに一致するツール呼び出し回数を計測し、上限を超えたら
deny する。cia 固有の「gh issue close 特化」「巡回フラグ依存」を除去した
パラメータ化版。

## 環境変数

  GUARDRAILS_FUSE_LIMIT=<上限件数（デフォルト 10）>
  GUARDRAILS_FUSE_COUNTER=<カウンタファイルのパス（デフォルト /tmp/guardrails-fuse-count）>
  GUARDRAILS_FUSE_TOOL_PATTERN=<監視ツール名パターン（デフォルト空 = 全ツール）>

- GUARDRAILS_FUSE_TOOL_PATTERN が空の場合は**全ツール**をカウントする。
- カウンタファイルは数値のみを格納するテキストファイル。手動でリセット可能:
    rm $GUARDRAILS_FUSE_COUNTER
- GUARDRAILS_FUSE_LIMIT 件を**超えた**タイミングで deny（= limit+1 件目で停止）。

## 使用例

  # gh issue create / comment を 10 件でキャップ
  GUARDRAILS_FUSE_LIMIT=10 \
  GUARDRAILS_FUSE_COUNTER=/tmp/gh-issue-fuse \
  GUARDRAILS_FUSE_TOOL_PATTERN='gh.*issue (create|comment)' \
    python3 rate-fuse.py

## 動作

- stdin から Claude Code の PreToolUse hook 形式（JSON）を読む。
- Bash ツールの場合は tool_input.command に対してパターンマッチを試みる。
- 全ツールで tool_name に対してもパターンマッチを試みる（どちらか一方でマッチすれば対象）。
- マッチした場合にカウンタをインクリメントし、上限超過で deny する。
- JSON 破損 / カウンタ読取失敗は fail-open（exit 0）でセッションを保護する。

## カウンタのリセット

  rm $GUARDRAILS_FUSE_COUNTER

## 注意

デフォルトカウンタパス (/tmp/...) は再起動で消え、マルチユーザー環境では
他者から書き換えられる可能性がある。フューズは best-effort の量ヒューズで
あり厳密なセキュリティ境界ではない。本番利用ではユーザー専有パスを指定
（例: $HOME/.config/guardrails/fuse-count）すること。
"""
import json
import os
import re
import sys

DEFAULT_LIMIT = 10
DEFAULT_COUNTER = "/tmp/guardrails-fuse-count"


def get_config() -> tuple[int, str, str]:
    """環境変数から (limit, counter_path, tool_pattern) を返す。"""
    try:
        limit = int(os.environ.get("GUARDRAILS_FUSE_LIMIT", str(DEFAULT_LIMIT)))
    except ValueError:
        limit = DEFAULT_LIMIT
    counter = os.environ.get("GUARDRAILS_FUSE_COUNTER", DEFAULT_COUNTER)
    counter = os.path.expanduser(counter)
    pattern = os.environ.get("GUARDRAILS_FUSE_TOOL_PATTERN", "")
    return limit, counter, pattern


def deny(reason: str) -> int:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }, ensure_ascii=False))
    return 0


def matches_pattern(pattern: str, tool_name: str, tool_input: dict) -> bool:
    """ツール名またはコマンド文字列がパターンに一致するか判定する。"""
    if not pattern:
        return True  # 空パターン = 全ツール

    try:
        compiled = re.compile(pattern, re.S)
    except re.error:
        return False  # 不正な正規表現 = fail-open

    # Bash ツールはコマンド文字列に対してマッチ
    if tool_name == "Bash":
        cmd = tool_input.get("command", "")
        if isinstance(cmd, str) and compiled.search(cmd):
            return True

    # ツール名に対してもマッチ（非 Bash ツールの場合）
    if compiled.search(tool_name):
        return True

    return False


def _cap(counter_path: str, limit: int) -> int:
    """カウンタを1回だけ読み、上限到達なら deny、未満なら +1 して許可（0 を返す）。

    read→compare→write を1関数内にまとめて TOCTOU の窓を最小化する（best-effort）。
    カウンタ読取・書込失敗は fail-open（0 を返す）。
    """
    try:
        n = int(open(counter_path, encoding="utf-8").read().strip()) if os.path.exists(counter_path) else 0
    except Exception:
        n = 0

    if n >= limit:
        return deny(
            f"guardrails rate-fuse: 上限 {limit} 件に達しました（現在 {n} 件）。"
            f" カウンタをリセットするには `rm {counter_path}` を実行してください。"
        )

    # 上限未達 → カウンタを +1 して許可
    try:
        counter_dir = os.path.dirname(counter_path)
        if counter_dir:
            os.makedirs(counter_dir, exist_ok=True)
        with open(counter_path, "w", encoding="utf-8") as f:
            f.write(str(n + 1))
    except Exception:
        pass  # 書込失敗は best-effort・許可は通す
    return 0


def main() -> int:
    limit, counter_path, pattern = get_config()

    try:
        data = json.load(sys.stdin)
        tool_name = data.get("tool_name", "")
        tool_input = data.get("tool_input", {}) or {}
    except Exception:
        return 0  # fail-open（JSON 破損等）

    if not isinstance(tool_name, str):
        return 0

    if not matches_pattern(pattern, tool_name, tool_input):
        return 0  # パターン非マッチ → スルー

    return _cap(counter_path, limit)


if __name__ == "__main__":
    sys.exit(main())
