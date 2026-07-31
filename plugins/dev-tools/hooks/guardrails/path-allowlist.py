#!/usr/bin/env python3
"""汎用書込パス制限 hook（PreToolUse）。

Edit / Write / MultiEdit / NotebookEdit の書込先を環境変数で指定した
許可パスリストに限定する。cia 固有の「巡回フラグ」「PROJECTS.md 参照」を
除去したパラメータ化版。

## 環境変数

  GUARDRAILS_ALLOW_PATHS=<コロン区切りの許可パスリスト>

- 未設定または空の場合は **全拒否**（デフォルト deny）。
- パスはコロン（:）区切りで複数指定可能。
- 各パスは realpath で正規化されるため、`..` / symlink による脱出を防ぐ。

## 使用例

  GUARDRAILS_ALLOW_PATHS=/my/project/.docs:/other/project/.docs/actions \
    python3 path-allowlist.py

## 動作

- stdin から Claude Code の PreToolUse hook 形式（JSON）を読む。
- 書込先 (file_path / notebook_path) が許可パスリストのいずれかのサブパスであれば
  exit 0（許可）。
- 許可されない場合は deny レスポンスを stdout へ出力して exit 0。
- file_path が取れない / JSON 破損 は fail-open（exit 0）でセッションを保護する。

## 重要な限界

本 hook は **Edit / Write / MultiEdit / NotebookEdit ツールのみ**を縛る。
Bash 経由の書込（`mv` / `echo >>` / `tee` 等）は本 hook を迂回する。
Bash 自体を制限する場合は別途 rate-fuse.py 等を組み合わせるか、
Bash を deny する hook を追加すること。
"""
import json
import os
import sys


def get_allow_roots() -> list[str]:
    """環境変数 GUARDRAILS_ALLOW_PATHS からコロン区切りで許可ルートを取得する。"""
    raw = os.environ.get("GUARDRAILS_ALLOW_PATHS", "")
    if not raw.strip():
        return []
    paths = [p.strip() for p in raw.split(":") if p.strip()]
    return [os.path.realpath(os.path.expanduser(p)) for p in paths]


def within(target_real: str, root_real: str) -> bool:
    """target が root のサブパスであれば True を返す。"""
    return target_real == root_real or target_real.startswith(root_real + os.sep)


def deny(reason: str) -> int:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }, ensure_ascii=False))
    return 0


def main() -> int:
    try:
        data = json.load(sys.stdin)
        tool_input = data.get("tool_input", {}) or {}
    except Exception:
        return 0  # fail-open（セッション保護）

    target = tool_input.get("file_path") or tool_input.get("notebook_path")
    if not target:
        return 0  # 対象パスが取れない＝判定不能は fail-open

    roots = get_allow_roots()
    if not roots:
        # GUARDRAILS_ALLOW_PATHS 未設定 → デフォルト全拒否
        return deny(
            "guardrails path-allowlist: GUARDRAILS_ALLOW_PATHS が未設定のため "
            "Edit/Write は全て拒否されます。許可するパスを GUARDRAILS_ALLOW_PATHS に設定してください。"
        )

    target_real = os.path.realpath(os.path.expanduser(target))
    if any(within(target_real, r) for r in roots):
        return 0  # 許可パス内

    return deny(
        f"guardrails path-allowlist: 書込先 '{target}' は許可パス外です。"
        " 許可パス: " + ", ".join(roots)
    )


if __name__ == "__main__":
    sys.exit(main())
