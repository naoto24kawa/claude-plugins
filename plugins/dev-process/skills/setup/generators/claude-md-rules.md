# Dev Process Rules

このセクションは dev-process プラグインにより生成されました。

## Issue ルール

- `.github/ISSUE_TEMPLATE/specification.yml` テンプレートに従い作成する
- 受け入れ条件は検証可能な形式でチェックリスト記述する
- type / area ラベルを付与する
- 関連する要望や調査は `refs #XX` または `refs notion-xxx` で紐付ける

## コミットメッセージ規約

Conventional Commits に準拠する。

format: `<type>(<scope>): <subject>`

| 要素 | 言語 | ルール |
|------|------|--------|
| type | 英語 | feat, fix, docs, refactor, test, chore |
| scope | 英語 kebab-case | 機能領域 (例: job-management, auth) |
| subject | 日本語 | 簡潔に「何をしたか」 |
| body | 日本語 | 「なぜこの実装方法を選んだか」 |
| footer | 英語 | `refs #XX` または `closes #XX` 必須 |

## PR ルール

- `closes #XX` 必須(トレーサビリティの土台)
- 受け入れ条件充足チェックリスト
- 「仕様からの変更点」セクション(なければ「なし」と明記)
- docs/specs 更新有無の明示
- コード変更 + 仕様更新 + テスト を常にセットで含める

## docs/specs ルール

- `docs/specs/` にシステムの現在の姿を記述する
- 「何がどうなっているか」を書く。「なぜ」は PR/Issue に残す
- frontmatter 必須:

```yaml
---
type: feature | api | data-model | screen | batch | integration
title: "日本語タイトル"
area: kebab-case-area
tags: [kebab-case-tag]
doc_status: draft | stable | deprecated
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---
```

- コードに影響する仕様変更は PR にセットで含める

## 言語使い分け

| 要素 | 言語 |
|------|------|
| frontmatter フィールド名、area、tags、ファイル名、ラベル | 英語 |
| 本文、コミット subject/body、Issue/PR description | 日本語 |
