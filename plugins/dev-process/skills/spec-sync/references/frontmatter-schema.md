# docs/specs frontmatter スキーマ

## 必須フィールド

| フィールド | 型 | 説明 | 例 |
|-----------|------|------|-----|
| type | enum | ドキュメント種別 | feature, api, data-model, screen, batch, integration |
| title | string | 日本語タイトル | "認証・認可" |
| area | string | 機能領域 (英語kebab-case) | auth, job-management |
| tags | string[] | タグ (英語kebab-case) | [api, authentication] |
| doc_status | enum | ドキュメント状態 | draft, stable, deprecated |
| created | date | 作成日 (YYYY-MM-DD) | 2026-03-09 |
| updated | date | 更新日 (YYYY-MM-DD) | 2026-03-09 |

## オプションフィールド

| フィールド | 型 | 説明 | 例 |
|-----------|------|------|-----|
| related | string[] | 関連ドキュメント/Issue | ["docs/specs/auth.md", "#123"] |
| related_tables | string[] | 関連テーブル名 | ["users", "sessions"] |
| related_apis | string[] | 関連APIパス | ["/api/auth/login"] |

## doc_status の遷移

```
draft -> stable -> deprecated
          ^
          |-- draft (大幅改訂時)
```

- **draft**: 初回生成時、大幅改訂時
- **stable**: レビュー完了後
- **deprecated**: 機能廃止時 (ファイルは削除せず状態変更)

## 例

```yaml
---
type: feature
title: "認証・認可"
area: auth
tags: [authentication, authorization, jwt]
doc_status: stable
created: 2026-03-09
updated: 2026-03-15
related:
  - docs/specs/user-management.md
  - "#45"
related_tables: [users, sessions, refresh_tokens]
related_apis: ["/api/auth/login", "/api/auth/refresh"]
---
```
