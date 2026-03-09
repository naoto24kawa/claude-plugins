# 仕様ドキュメントテンプレート

type に応じて以下のセクション構成を使う。

## type: feature

```markdown
---
type: feature
title: "<日本語タイトル>"
area: <kebab-case>
tags: []
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---

# <タイトル>

## 概要

<!-- この機能が何であるかを1-2文で -->

## 機能一覧

<!-- 提供する機能をリストで -->

## 画面・API

<!-- ユーザーインターフェースやAPIエンドポイント -->

## データ構造

<!-- 関連するデータモデル -->

## 状態遷移

<!-- 状態がある場合は Mermaid で記述 -->

## 制約・ルール

<!-- ビジネスルール、バリデーション -->
```

## type: api

```markdown
---
type: api
title: "<API名>"
area: <kebab-case>
tags: [api]
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
related_apis: []
---

# <API名>

## エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|

## 共通仕様

<!-- 認証、ページネーション、エラー形式 -->

## 各エンドポイント詳細

### <METHOD> <path>

- リクエスト
- レスポンス
- エラーケース
```

## type: data-model

```markdown
---
type: data-model
title: "<モデル名>"
area: <kebab-case>
tags: [data-model]
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
related_tables: []
---

# <モデル名>

## テーブル定義

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|

## リレーション

## インデックス
```
