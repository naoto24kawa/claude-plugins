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

## type: screen

```markdown
---
type: screen
title: "<画面名>"
area: <kebab-case>
tags: [screen]
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---

# <画面名>

## 概要

<!-- この画面が何であるかを1-2文で -->

## 画面一覧

| 画面ID | 画面名 | パス | 説明 |
|--------|--------|------|------|

## 各画面詳細

### <画面名>

- レイアウト
- 入力項目
- アクション
- バリデーション

## 状態遷移

<!-- 画面間遷移がある場合は Mermaid で記述 -->
```

## type: batch

```markdown
---
type: batch
title: "<バッチ名>"
area: <kebab-case>
tags: [batch]
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---

# <バッチ名>

## 概要

<!-- このバッチが何であるかを1-2文で -->

## ジョブ一覧

| ジョブID | ジョブ名 | スケジュール | 説明 |
|----------|----------|-------------|------|

## 各ジョブ詳細

### <ジョブ名>

- トリガー (cron/イベント/手動)
- 入力データ
- 処理内容
- 出力データ
- エラーハンドリング

## リトライ・冪等性

<!-- リトライ戦略と冪等性の保証方法 -->
```

## type: integration

```markdown
---
type: integration
title: "<連携名>"
area: <kebab-case>
tags: [integration]
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
related_apis: []
---

# <連携名>

## 概要

<!-- この外部連携が何であるかを1-2文で -->

## 連携先一覧

| 連携先 | プロトコル | 方向 | 説明 |
|--------|-----------|------|------|

## 各連携詳細

### <連携先名>

- 認証方式
- エンドポイント/接続先
- データフォーマット
- リクエスト/レスポンス例

## エラーハンドリング

<!-- タイムアウト、リトライ、フォールバック -->

## 制約・SLA

<!-- レート制限、可用性要件 -->
```
