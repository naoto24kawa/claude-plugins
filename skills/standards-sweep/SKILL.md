---
name: standards-sweep
description: 'Use when a work session is wrapping up and the user asks やり残しはないか, スイープして, 残タスク確認, 終了前チェック, session sweep, 宙吊り確認 — or before declaring a multi-agent session (brain / Action Queue / agmsg / worktree 委任を使った作業) complete. Detects leftover state across git, shared state, spawned agents, and self-improvement bookkeeping. For checking repo compliance against standards rules, use standards-audit instead.'
allowed-tools: [Read, Bash, Glob, Grep]
---

# Standards Sweep — セッション終了前のやり残し確認

セッション中に生まれた**残留状態（宙吊りの作業・プロセス・記録漏れ）を検出して報告する**。standards-audit が「リポが standards ルールに準拠しているか」を見るのに対し、本 skill は「このセッションが後始末を終えているか」を見る。

**姿勢**: 検出・報告が主。read-only 確認と可逆な掃除（prune・hit 記録・アーカイブ）は自律実施してよい。不可逆・外向き操作（PR マージ・ファイル削除・ユーザー管理ファイルの変更・エスカレーション判断）は検出結果として提示し、ユーザー判断に委ねる。1項目の失敗で全体を止めず、全項目を走査してから報告する（fail-open）。

**実行順序が重要**: エージェント確認（§1）を最初に行う——先に despawn すると未送信の報告を取りこぼす。共有状態（§3–4）→ git（§2）→ 学び（§5–6）の順で流す。

## §1 エージェント・プロセス残留

| チェック | コマンド / 方法 |
|---|---|
| 未読メッセージ（委譲先の未処理報告） | `~/.agents/skills/agmsg/scripts/inbox.sh <team> <agent>` |
| spawn したメンバーの残留 | `~/.agents/skills/agmsg/scripts/team.sh <team>`（自分以外が残っていたら、未完確認 → despawn。codex は watcher 不在のため `--force`） |
| tmux 孤児ペイン | `tmux list-panes -a -F '#{session_name}:#{window_index}.#{pane_index} #{pane_title}'` で spawn 残骸を目視（詳細調査・掃除は tmux-manager skill） |
| Monitor / background task の残留 | TaskList で残す意図のないタスクを確認し TaskStop（session-length の inbox stream は残してよい） |

## §2 git / worktree

| チェック | コマンド / 方法 |
|---|---|
| working tree クリーン・untracked 滞留なし | `git status --porcelain`（untracked は「意図的（.gitignore 候補）/ コミット漏れ / 削除対象」に分類して報告） |
| 共有 checkout が main に居る | `git branch --show-current`（委任後は URISK-008 #6 のブランチ残置を疑う） |
| worktree の撤去漏れ | `git worktree list`（残っていたら中の未コミット変更を確認してから remove。main を掴んだ worktree は最優先で解消） |
| マージ済み・gone ブランチ残骸 | `git fetch --prune` → `git branch -vv`（`: gone` 行。掃除は clean_gone skill） |
| push 漏れ・stash 残留 | `git log --branches --not --remotes --oneline` / `git stash list` |
| main 直接コミットの検知 | `git log origin/main..main --oneline`（出力があれば DOCS_OPS §5 MUST 違反——ブランチへ退避して PR 化を提案） |
| オープン PR | `gh pr list`（human-gate 待ちは正常として報告。CI 落ち・レビュー未収束は異常） |

## §3 Action Queue（正本: shared-state README）

| チェック | コマンド / 方法 |
|---|---|
| 残 action・健全性 | `actionctl --repo <checkout> scan`（exit 4 = 部分失敗）と `actionctl --repo <checkout> check`（fail-closed ゲート） |
| 完了 action の消し込み漏れ | 完了済みが queue に残っていれば `actionctl --repo <checkout> done <file> --completed YYYY-MM-DD` |
| `deploy_status: pending` | デプロイ済みなら `confirm-deploy`。同じ pending が 3 セッション連続ならユーザーへエスカレーション |
| 起票漏れ | 今セッションで生まれた「忘れると手戻りになる」次セッションタスクを `actionctl add` で起票（Git/PR/コードから導けるものは起票しない） |

`actionctl` = `/Users/nishikawa/.agents/shared-state/bin/actionctl`

## §4 Brain（正本: shared-state README）

| チェック | コマンド / 方法 |
|---|---|
| index 整合 | `brainctl check`（stale なら note を正本に `brainctl rebuild`） |
| hit 記録漏れ | 今セッションで回避策が役立った risk note に `brainctl hit <URISK-NNN>`（main session が実行。subagent の「URISK-NNN 適用」報告も代理記録） |
| 学びの note 化漏れ | 横断的・非自明・失われると再発する学びは draft → `brainctl apply`。記事ネタは `brainctl neta-add` |
| subagent の直接書き込み検査 | `ls -lt ~/.agents/shared-state/brain/ | head` で予期しない更新がないか（隔離契約の検証） |
| Dream 閾値 | risk note が 80 件超なら Dream（棚卸し）をユーザーへ提案 |

`brainctl` = `/Users/nishikawa/.agents/shared-state/bin/brainctl`

## §5 記録・文書整合（対象リポが standards 系ルール適用下の場合）

| チェック | コマンド / 方法 |
|---|---|
| レビューで受容した flag の記録 | `.docs/risk-registry.md` に判断と理由が残っているか（ACCEPTED_RISKS 契約） |
| rev / CHANGELOG / バッジ同期 | 正本ルールを変更したセッションのみ: CHANGELOG 先頭 rev と README バッジの一致 |
| 未検証の完了主張 | 「〜したはず」で終わっている項目がないか。あれば実体確認（完了ゲート）を実施 |

## §6 自己改善・memory

| チェック | コマンド / 方法 |
|---|---|
| 学びの受け皿判定 | 横断 → `~/.claude/CLAUDE.md`（ルール文言のみ無承認可・追記前に 3 問チェック）/ リポ固有 → project CLAUDE.md / 一回性 → brain・neta。sensor 化できるものは提案止まり（hook/CI 新設はユーザー承認） |
| memory 更新 | 新規事実の note 化・陳腐化 note の修正・MEMORY.md index 同期・sitemap の陳腐化確認 |
| CLAUDE.md 棚卸しトリガー | `wc -l ~/.claude/CLAUDE.md`（150 行超なら棚卸しを提案） |

## 出力フォーマット

```
## Sweep 結果（<repo> / <日付>）
| 項目 | 状態 | 備考 |
|---|---|---|
| §1 エージェント | ✅ / ⚠️ | ... |
...
### 検出事項（要対応）
- ...（自律修正済み / ユーザー判断待ち を区別して列挙）
### 実施した掃除
- ...
```

検出ゼロなら「宙吊りの約束・未検証の完了主張・引き継ぎ事項なし」を明言して終える。
