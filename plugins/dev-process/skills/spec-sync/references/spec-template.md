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

## 概要

- API種別: (REST / GraphQL / gRPC)
- ベースURL:
- 認証方式:
- 共通レスポンス形式:

## エンドポイント一覧

| メソッド | パス | 概要 | 認証 | 定義箇所 |
|---------|------|------|------|---------|

## 各エンドポイント詳細

### <METHOD> <path>

- 概要:
- 認証: Required/Not required
- ミドルウェア:
- リクエスト:
  - パスパラメータ:
  - クエリパラメータ:
  - ボディ:
- レスポンス:
  - 成功(status code, type):
  - エラー:
- バリデーション:
- 定義箇所:

## 共通仕様

### エラーレスポンス形式
### ページネーション
### レート制限
### CORS設定
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

## ER図

<!-- Mermaid erDiagram -->

## エンティティ詳細

### <エンティティ名>

| カラム/フィールド | 型 | 制約 | 説明 |
|-----------------|------|------|------|

- 主キー:
- ユニーク制約:
- インデックス:
- リレーション:
- 共通パターン: (timestamps, soft delete 等)
- 定義箇所:

## データフロー概要

<!-- 主要な CRUD パターン -->

## マイグレーション履歴サマリー

<!-- マイグレーションファイル存在時のみ -->

## データソース情報

- DB種別:
- 接続情報の管理方法:
- ORM/クエリビルダー:
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

## type: overview

```markdown
---
type: overview
title: "システム概要"
area: system
tags: [overview]
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---

# システム概要

## プロジェクトの目的

<!-- 解決する問題、ターゲットユーザー -->

## 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|

## システム境界図

<!-- Mermaid graph: 本システムと外部システム、ユーザーの関係 -->

## 主要機能の一覧

| # | 機能名 | 概要 | エントリポイント |
|---|--------|------|-----------------|

## 前提・制約

<!-- 推定前提条件、既知の制約 -->

## 用語集

| 用語 | 意味 | コード上の表現 |
|------|------|---------------|
```

## type: architecture

```markdown
---
type: architecture
title: "アーキテクチャ・モジュール構造"
area: system
tags: [architecture]
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---

# アーキテクチャ・モジュール構造

## アーキテクチャパターン

<!-- MVC, Clean Architecture, DDD, Layered 等 -->

## レイヤー構造

<!-- Mermaid graph: レイヤー間の依存方向 -->

## モジュール一覧

### モジュール: <モジュール名>

- パス:
- 責務:
- 主要ファイル:
- 依存先:
- 依存元:
- 公開インターフェース:

## モジュール依存関係図

<!-- Mermaid graph: モジュール間の依存関係 -->

## 横断的関心事

### 認証・認可
### エラーハンドリング
### ロギング
### ミドルウェア/インターセプター
### 設定管理
```

## type: usecase

```markdown
---
type: usecase
title: "<ユースケース名>"
area: <kebab-case>
tags: [usecase]
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---

# <ユースケース名>

## 概要

<!-- 目的・ゴール -->

## アクター

<!-- ユーザータイプ・外部システム -->

## 事前条件

<!-- 開始に必要な状態 -->

## 基本フロー

<!-- Mermaid sequenceDiagram -->

## 基本フローの説明

1. (ステップ1)
2. (ステップ2)

## 代替フロー

<!-- 基本フローからの分岐パターン -->

## 例外フロー

<!-- エラーハンドリング -->

## 事後条件

<!-- 完了後の状態変化 -->

## 関連コード

| 種別 | ファイルパス |
|------|-----------|
| エントリポイント | |
| 主要処理 | |
| テスト | |
```

## type: business-rules

```markdown
---
type: business-rules
title: "ビジネスルール・バリデーション"
area: system
tags: [business-rules]
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---

# ビジネスルール・バリデーション

## 定数・設定値

| 定数名 | 値 | 用途 | 定義箇所 |
|--------|---|------|---------|

## ステータス遷移

### <エンティティ名> のステータス遷移

<!-- Mermaid stateDiagram-v2 -->

## バリデーションルール

### <機能/エンティティ名>

| フィールド | ルール | エラーメッセージ | 定義箇所 |
|-----------|--------|----------------|---------|

## 権限・アクセス制御

| 操作 | 必要な権限/ロール | 条件 | 定義箇所 |
|------|------------------|------|---------|

## 計算ロジック

<!-- 公式と条件を具体的に記述 -->

## 暗黙のビジネスルール

| ルール | 推定理由 | コード箇所 |
|--------|---------|-----------|
```

## type: non-functional

```markdown
---
type: non-functional
title: "非機能要件"
area: system
tags: [non-functional]
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---

# 非機能要件(コードから推定)

> このドキュメントは「実装されている事実」の記述であり「あるべき姿」ではありません。

## パフォーマンス

- キャッシュ戦略:
- クエリ最適化:
- ページネーション:
- 非同期処理:

## セキュリティ

- 認証方式:
- 認可方式:
- 入力検証:
- CSRF対策:
- CORS設定:
- セキュリティヘッダー:
- 機密情報管理:

## 可用性・耐障害性

- エラーハンドリング:
- リトライ:
- タイムアウト設定:
- ヘルスチェック:

## 監視・ロギング

- ログフレームワーク:
- ログレベル・出力先:
- 構造化ログ:
- トレーシング:
- メトリクス:

## テスト戦略

- テストフレームワーク:
- テスト種別と分布:
- テストヘルパー/ファクトリ:
- モック戦略:

## デプロイ・運用

- CI/CDパイプライン:
- コンテナ:
- IaC:
- 環境分離:

## 未検出・未対応領域

<!-- 検出されなかった対策を列挙 -->
```
