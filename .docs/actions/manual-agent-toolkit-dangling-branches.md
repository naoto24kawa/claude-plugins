---
trigger: manual
created: 2026-08-05
autonomy: manual
---

# agent-toolkit に PR 化されていない feature ブランチが5本ある（うち2本は remote に無い）

2026-08-05 のセッション終了前スイープで検出した。作業自体は別セッション由来のため手を付けていない。**オープン PR は0件**で、5本すべてが宙吊りになっている。

## 実測（2026-08-05 時点）

| ブランチ | remote | 状態 |
|---|---|---|
| `feat/consulting-plugin` | あり | 同期済み |
| `feat/dev-process-confidence-guidelines` | あり | **ahead 4 / behind 9** |
| `feat/ecc-patterns-skill` | あり | **ahead 2 / behind 1** |
| `feat/dev-process-plugin` | **無し** | **完全に未 push** |
| `feat/observability-plugin` | **無し** | **完全に未 push** |

`main` は `origin/main` と同期しており、直コミットは0件（DOCS_OPS §5 違反ではない）。

## なぜ起票するか

**`feat/dev-process-plugin` と `feat/observability-plugin` は remote に存在しない。** ローカルのブランチを消すか checkout を作り直すと**復元できない**。他の3本と違い、失われるまでの猶予が無い。

`ahead` と `behind` が両方立っている2本は rebase 途中の可能性があり、第三者が push すると進行中の作業を壊しうる。

## 決めること

各ブランチについて、持ち主のセッションが以下を判断する。

1. 生かす → 少なくとも push して remote に退避する（`feat/dev-process-plugin` / `feat/observability-plugin` が最優先）
2. PR 化する → `naoto24kawa-claude-plugins` の marketplace version バンプが要るか確認する
3. 破棄する → 削除してよいか確認のうえ削除する

## 触ってはいけない理由（記録）

CLAUDE.md の「1 PR = 1 実装エージェント」により、別セッションが進行中のブランチへ第三者が commit / push しない。本 action は**判断を持ち主へ戻すための起票**であり、代行を意図しない。
