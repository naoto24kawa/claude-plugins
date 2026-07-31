#!/usr/bin/env python3
"""汎用監査ログ hook（PostToolUse）。

実行されたツール呼び出しを JSONL 形式でログファイルに追記する。
cia 固有の「PROJECT_DIR 依存」「.docs/audit 固定パス」を除去した
パラメータ化版。

## 環境変数

  GUARDRAILS_AUDIT_LOG=<ログファイルのパス（デフォルト ~/.config/guardrails/audit.jsonl）>
  GUARDRAILS_AUDIT_TOOLS=<ログ対象ツール名のコロン区切り（デフォルト空 = 全ツール）>

- GUARDRAILS_AUDIT_TOOLS が空の場合は**全ツール**を記録する。
- ログは GUARDRAILS_AUDIT_LOG に1行ずつ追記する。
- 記録形式: {"ts": "<ISO8601>", "tool": "<tool_name>", "target": "<最大300字>"}

## 使い方

  # 書込系ツールのみ記録
  GUARDRAILS_AUDIT_LOG=~/.config/guardrails/audit.jsonl \
  GUARDRAILS_AUDIT_TOOLS=Edit:Write:MultiEdit:NotebookEdit:Bash \
    python3 audit-log.py

## セキュリティ

target フィールドの PAT / API キー / メールアドレス / クレカ番号相当の
パターンを [REDACTED] に置換してからログに書く。

## 動作

PostToolUse はツール実行**後**に走るため deny はできない（観測のみ）。
記録失敗（権限・JSON 破損）は静かに exit 0（ログ取得失敗で本処理を止めない）。
"""
import json
import os
import re
import sys
from datetime import datetime, timezone

DEFAULT_LOG = os.path.expanduser("~/.config/guardrails/audit.jsonl")

MASK_PATTERNS = [
    re.compile(r'ghp_[A-Za-z0-9]{30,}'),
    re.compile(r'sk-[A-Za-z0-9]{20,}'),
    re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'),
    re.compile(r'\b(?:\d[ -]?){13,16}\b'),
]


def get_config() -> tuple[str, set[str]]:
    """環境変数から (log_path, allowed_tools) を返す。allowed_tools が空なら全ツール対象。"""
    log_path = os.path.expanduser(os.environ.get("GUARDRAILS_AUDIT_LOG", DEFAULT_LOG))
    tools_raw = os.environ.get("GUARDRAILS_AUDIT_TOOLS", "")
    if tools_raw.strip():
        allowed = {t.strip() for t in tools_raw.split(":") if t.strip()}
    else:
        allowed = set()  # 空 = 全ツール
    return log_path, allowed


def mask(text: str) -> str:
    """target フィールドから機密パターン（PAT・API キー・PII）を除去する。"""
    for pat in MASK_PATTERNS:
        text = pat.sub("[REDACTED]", text)
    return text


def main() -> int:
    log_path, allowed_tools = get_config()

    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0  # fail-open

    tool = data.get("tool_name", "?")

    # ツールフィルタ（空 = 全ツール）
    if allowed_tools and tool not in allowed_tools:
        return 0

    ti = data.get("tool_input", {}) or {}
    target = ti.get("file_path") or ti.get("notebook_path") or ti.get("url") or ti.get("command") or ""
    if not isinstance(target, str):
        target = str(target)
    target = mask(target[:300])

    try:
        now = datetime.now(timezone.utc)
        log_dir = os.path.dirname(log_path)
        if log_dir:
            os.makedirs(log_dir, exist_ok=True)
        rec = {"ts": now.isoformat(), "tool": tool, "target": target}
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    except Exception:
        return 0  # ログ失敗で本処理を止めない

    return 0


if __name__ == "__main__":
    sys.exit(main())
