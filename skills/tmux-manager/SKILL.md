---
name: tmux-manager
description: tmux の状況可視化と残留掃除。「tmux の状況を見せて」「tmux で何が動いてる？」「エージェント生き残ってる？」「tmux/残骸を掃除して」「孤児ペインを消して」などで使用。tmux 全体と agmsg の状態を突合して報告し、ユーザー承認を得てから掃除する。
---

# tmux-manager — tmux の可視化と残留掃除

tmux が「裏で動いたまま」になる不安を解消するための skill。
収集は `scripts/status.sh`（読み取り専用・deterministic）が行い、
解釈・報告・掃除の対話はこの指示に従って Claude が行う。

## 手順

1. **収集**: `~/.agents/skills/tmux-manager/scripts/status.sh` を実行する。
2. **報告**: 出力を整形して全体像を報告する。ラベルの意味:
   - `agmsg:<team>/<name>` — agmsg が spawn したエージェントのペイン
   - `manual` — 手動作成のセッション/ペイン
   - `,self` サフィックス — このセッション自身のペイン
   - `unknown` — 突合不能（隠さずそのまま見せる）
3. **掃除候補の提示**: 以下を候補として一覧提示する。
   - `agmsg:` ラベルのうち LIVE-GUARD で `alive` でないもの（孤児エージェント）
   - `manual` のセッション（要否はユーザーに聞く。勝手に候補へ入れない）
   - STALE セクションの各ファイル
4. **human-gate（skip 不可）**: 対象一覧を見せてユーザーの明示承認を得る。
   「全部消して」と言われても、必ず一覧提示 → 承認の順を守る。
5. **実行**:
   - agmsg 管理下 → `~/.agents/skills/agmsg/scripts/despawn.sh <team> <from> <name>` を優先
     （graceful。`<from>` は自分の agmsg 名。応答しない/codex メンバーは `--force` を付ける）
   - 手動セッション → `tmux kill-session -t '=<name>'`（`=` 前置で完全一致指定。前方一致による誤爆を防ぐ）/ ペイン単位は `tmux kill-pane -t '%N'`
   - stale ファイル → `rm <file>`
6. **検証**: `status.sh` を再実行し、対象が消えたことを出力の実体で確認して報告する。
   コマンドの exit 0 を根拠にしない。

## 安全規則（必ず守る）

- kill・rm の前に必ずユーザー承認（human-gate、skip 不可）
- LIVE-GUARD で `alive` のメンバーとそのペインは掃除候補に**含めない**（現役の誤殺防止）
- `,self` の付いたペイン（自分自身）は掃除候補に**含めない**
- `,self` の付いたペインを含むセッションも `kill-session` の対象にしない（自分ごと死ぬのを防ぐ）
- agmsg 管理下のペインを直接 `kill-pane` しない（despawn.sh 経由。--force も despawn.sh の --force を使う）
- 掃除実行で1件失敗しても残りは続行し、失敗した対象を報告する
- SERVER が `not-installed` の場合はその旨を報告して終了する（掃除フローに入らない）

## 将来枠（未実装・提案しない限り触れない)

起動の定型化・セッション終了時の自動片付けはスコープ外。
求められたら設計書（docs/2026-07-16-tmux-manager-design.md）の将来枠を参照。
