#!/bin/bash
# 汎用 kill switch（PreToolUse・毎ツール評価）。
#
# STOP ファイルが存在すると全ツールを deny して即停止する。
# 暴走（無限ループ・想定外の連続 write 等）を人間が外から1コマンドで止める
# ための物理経路。cia 固有パスを除去したパラメータ化版。
#
# ## 環境変数
#
#   GUARDRAILS_STOP_FILE=<STOP ファイルのパス（デフォルト $HOME/.config/guardrails/STOP）>
#
# ## 使用例
#
#   止める: touch "$HOME/.config/guardrails/STOP"
#   再開:   rm   "$HOME/.config/guardrails/STOP"
#
# ## 動作
#
# STOP ファイルが存在すれば deny レスポンスを stdout へ出力して exit 0。
# STOP ファイルが無ければ無出力 exit 0（許可）。
# stdin は読まない（全ツールに乗るため軽量 bash で実装）。

STOP_FILE="${GUARDRAILS_STOP_FILE:-$HOME/.config/guardrails/STOP}"

if [ -f "$STOP_FILE" ]; then
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"guardrails kill-switch: %s が存在するため全ツールを停止中です。再開するには STOP ファイルを削除してください（rm %s）。"}}\n' \
    "$STOP_FILE" "$STOP_FILE"
fi
exit 0
