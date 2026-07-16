---
name: watch-sprawlens-update
description: Use when checking mizchi/sprawlens for new upstream commits
user-invocable: true
metadata:
  author: nishikawa
  dev: false
  tools: git
---

## 概要

`~/projects/mizchi/sprawlens` の upstream（origin/main）に新しいコミットがあるか確認し、あれば内容を報告する。

## Workflow

### 確認

```bash
git -C ~/projects/mizchi/sprawlens fetch origin 2>&1
git -C ~/projects/mizchi/sprawlens log HEAD..origin/main --oneline
```

新しいコミットが 0 件の場合: 「sprawlens は最新の状態です」と報告して終了する。

新しいコミットがある場合: コミット一覧を表示し、以下を報告する。

- 新コミット数
- 各コミットのメッセージ
- 「rebuild が必要な場合は `cd ~/projects/mizchi/sprawlens && pnpm install && pnpm build` を実行してください」
