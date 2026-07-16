# tmux-manager skill 設計書

日付: 2026-07-16
状態: 設計承認済み（実装前）

## 目的

tmux が「裏で動いたままになる」不安を解消する。Claude Code の会話から
tmux 全体の状況を可視化し、残留物（孤児ペイン・stale な agmsg 状態ファイル）を
人間の確認を経て安全に掃除できるようにする。

## スコープ

- **やること**: ① 状況の可視化（tmux 全体 + agmsg 突合ラベル付け） ② 残留の掃除（human-gate 付き）
- **やらないこと（将来枠）**: 起動の定型化、セッション終了時の自動片付け。
  status.sh が全状態を把握する構造のため、後から足せるが今回は実装しない（YAGNI）。

## 形態と配置

Claude Code の会話から使う skill。正本ディレクトリに置き Codex からも利用可能。

```
~/.agents/skills/tmux-manager/
├── SKILL.md            # トリガー・掃除フロー・安全規則（Claude への指示）
├── docs/               # この設計書
└── scripts/
    └── status.sh       # 収集・突合・ラベル付け（deterministic 部分）
```

設計思想: **収集は deterministic に（スクリプト）、解釈と対話は Claude に（SKILL.md）**。
kill 系ヘルパースクリプトは作らない — 確認後の kill は 1 行コマンド
（`tmux kill-pane` / agmsg `despawn.sh`）で足り、ラッパーは despawn.sh との二重実装になる。

## status.sh 仕様

引数なしで実行し、行指向プレーンテキスト（セクション見出し + TSV 行)を stdout に出力する。

### 収集ソース（実在確認済みの形式）

| ソース | 形式 | 用途 |
|---|---|---|
| `tmux list-sessions` / `list-panes -a` | `#{session_name} #{window_id} #{pane_id} #{pane_current_command} #{pane_pid} #{pane_title}` 等 | 生きている実体の一覧 |
| `~/.agents/skills/agmsg/run/spawn.<team>__<name>` | `<tmux_id>\t<project>\t<type>`（tmux_id は `%N`=pane / `@N`=window） | ペイン ↔ agmsg メンバーの突合 |
| `~/.agents/skills/agmsg/run/role-session.<team>__<name>` | `key=value` 行（session/name/team/agent/type/project/updated_at） | メンバーのメタ情報表示 |
| `~/.agents/skills/agmsg/run/watch.<session>.<pid>.pid` | watcher の pid | watcher 生死判定（`kill -0`） |

### 出力セクション

1. **SERVER**: tmux サーバー稼働有無（`tmux ls` の成否で判定）
2. **PANES**: 全ペイン一覧。各行にラベルを付与:
   - `agmsg:<team>/<name>` — spawn record の tmux_id と一致
   - `manual` — どの spawn record とも不一致
   - ラベル判定が不能な行は `unknown` として表示（隠蔽しない）
3. **STALE**: 残骸一覧。
   - spawn record の tmux_id が生存ペイン/ウィンドウに存在しない → `stale-spawn-record`
   - watch.pid の pid が死んでいる → `stale-watch-pid`
   - role-session が指す (team, name) に生きた spawn record も actas lock もない → `stale-role-session`
4. **LIVE-GUARD**: actas lock を保持中の現役メンバー一覧（掃除候補から除外するための情報）

### 挙動の規約

- tmux サーバー停止中でも exit 0 で SERVER セクションに `not-running` を出し、
  STALE セクションは通常どおり出力する（可視化は fail-open で継続）
- 収集の一部が失敗しても他セクションは出力し、失敗はセクション内に `error:` 行で surface する
- 読み取り専用。status.sh は何も変更・削除しない

## 掃除フロー（SKILL.md に記述する手順）

1. `status.sh` を実行し、全体像を整形して報告する
2. 掃除候補を提示する: `manual` の放置セッション（ユーザーに要否を聞く）、
   `agmsg:` ラベルのうち LIVE-GUARD に載っていないもの（= actas lock が失効した孤児ペイン）、
   STALE の各ファイル
3. **human-gate（skip 不可）**: 対象一覧を見せてユーザーの明示承認を得る。
   「全部消して」と言われても一覧提示 → 承認の順を守る
4. 実行:
   - agmsg 管理下 → `despawn.sh` を優先（graceful）。応答しない場合のみ `--force`
   - 手動セッション → `tmux kill-session` / `kill-pane`
   - stale ファイル → `rm`
5. **検証ゲート**: `status.sh` を再実行し、対象が消えたことを実体で確認して報告する
   （「消した」の根拠はコマンドの exit 0 ではなく再実行の出力）

## 安全規則

- kill・rm の前に必ず対象一覧 + ユーザー承認（human-gate、skip 不可）
- LIVE-GUARD にある現役メンバーは掃除候補に含めない（現役の誤殺防止）
- 呼び出し元自身が tmux 内にいる場合、自分のペイン/セッションを掃除候補から除外する
  （`$TMUX_PANE` と照合）
- tmux 未インストールならその旨を報告して終了（掃除フローに入らない）

## エラー処理

- status.sh: 個別ソースの読み取り失敗は該当セクションに surface して継続（fail-open、隠蔽しない）
- 掃除実行: 1 件の失敗で全体を止めず、失敗した対象を報告して残りを続行

## テスト（手動検証）

実 agmsg spawn は使わない（コスト高・実データを汚すため）。以下で status.sh の出力を実体確認する:

1. tmux サーバー停止状態で実行 → SERVER=not-running + STALE が出る
2. 手動 tmux セッションを作って実行 → PANES に `manual` で載る
3. 模擬 spawn record（存在しない `%999` を指す）を run/ に置いて実行 → STALE に `stale-spawn-record` で載る → 検証後に模擬ファイルを削除
4. 既存の実残骸（確認済み: 過去の role-session 2 件）が STALE に載ることを確認

## 備考

- `~/.agents/skills/` は git 管理外のため、この設計書はコミットせずディスク保存のみ
- agmsg の run/ ファイル形式が変わった場合は status.sh の追従が必要
  （形式の正本: `agmsg/scripts/lib/actas-lock.sh` / `spawn.sh` / `despawn.sh`）
