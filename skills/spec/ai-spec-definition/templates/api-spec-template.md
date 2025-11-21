---
type: api
title: [リソース名] API仕様書
version: 1.0.0
updated: YYYY-MM-DD
tags: []
related: []
dependencies: []
---

# [リソース名] API仕様書

## 概要

[このAPIの目的と責務を簡潔に記述]

## API種別

- [ ] REST API
- [ ] GraphQL API

## 認証・認可

### 認証方式
- **方式**: [JWT / セッション / APIキー / OAuth2.0]
- **トークン送信方法**: [Authorization ヘッダー / Cookie]
- **トークン形式**: `Bearer {token}`

### 認可要件
- **必要な権限**: [admin / user / guest]
- **リソース所有権チェック**: [必要 / 不要]

## レート制限

- **制限**: [100リクエスト/分 / 1000リクエスト/時]
- **制限超過時のレスポンス**: 429 Too Many Requests

---

## REST API 仕様

### エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | /api/v1/[resource] | リスト取得 | 必須 |
| GET | /api/v1/[resource]/:id | 詳細取得 | 必須 |
| POST | /api/v1/[resource] | 新規作成 | 必須 |
| PUT | /api/v1/[resource]/:id | 更新 | 必須 |
| DELETE | /api/v1/[resource]/:id | 削除 | 必須 |

---

### GET /api/v1/[resource]

**概要**: [リソース]のリストを取得

#### リクエスト

**クエリパラメータ**:
```typescript
{
  page?: number;        // ページ番号 (デフォルト: 1)
  limit?: number;       // 1ページあたりの件数 (デフォルト: 20, 最大: 100)
  sort?: string;        // ソート項目 (例: "createdAt", "-updatedAt")
  filter?: string;      // フィルタ条件 (JSON文字列)
}
```

#### レスポンス

**成功時** (200 OK):
```typescript
{
  data: Array<{
    id: string;
    [field]: [type];
    createdAt: string;  // ISO 8601形式
    updatedAt: string;  // ISO 8601形式
  }>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

**エラー時** (401 Unauthorized):
```typescript
{
  error: {
    code: "UNAUTHORIZED",
    message: "認証が必要です"
  }
}
```

---

### GET /api/v1/[resource]/:id

**概要**: 指定した[リソース]の詳細を取得

#### リクエスト

**パスパラメータ**:
- `id` (string, 必須): [リソース]ID

#### レスポンス

**成功時** (200 OK):
```typescript
{
  id: string;
  [field]: [type];
  createdAt: string;
  updatedAt: string;
}
```

**エラー時** (404 Not Found):
```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "指定された[リソース]が見つかりません"
  }
}
```

---

### POST /api/v1/[resource]

**概要**: 新しい[リソース]を作成

#### リクエスト

**ボディ** (application/json):
```typescript
{
  [field]: [type];      // 必須、[説明]
  [field]: [type];      // 任意、[説明]
}
```

#### バリデーション

##### フロントエンド責務
- [ ] 形式チェック（メール形式、文字数、数値範囲）
- [ ] 必須項目チェック
- [ ] パターンマッチング
- [ ] 即時フィードバック（onChange/onBlur）

##### バックエンド責務
- [ ] ビジネスルール検証
- [ ] データ整合性チェック（一意性、外部キー制約）
- [ ] セキュリティ検証（XSS、SQLインジェクション対策）
- [ ] 最終的な形式検証

#### バリデーションルール詳細

| フィールド | ルール | エラーメッセージ | 検証箇所 |
|-----------|--------|----------------|----------|
| [field] | [ルール] | [メッセージ] | フロント/バック |

#### レスポンス

**成功時** (201 Created):
```typescript
{
  id: string;
  [field]: [type];
  createdAt: string;
  updatedAt: string;
}
```

**エラー時** (400 Bad Request):
```typescript
{
  error: {
    code: "VALIDATION_ERROR",
    message: "入力内容に誤りがあります",
    details: Array<{
      field: string;
      message: string;
    }>;
  }
}
```

---

### PUT /api/v1/[resource]/:id

**概要**: 既存の[リソース]を更新

#### リクエスト

**パスパラメータ**:
- `id` (string, 必須): [リソース]ID

**ボディ** (application/json):
```typescript
{
  [field]?: [type];     // 任意、[説明]
}
```

#### バリデーション
[POST同様のバリデーション定義]

#### レスポンス

**成功時** (200 OK):
```typescript
{
  id: string;
  [field]: [type];
  createdAt: string;
  updatedAt: string;
}
```

---

### DELETE /api/v1/[resource]/:id

**概要**: 指定した[リソース]を削除

#### リクエスト

**パスパラメータ**:
- `id` (string, 必須): [リソース]ID

#### レスポンス

**成功時** (204 No Content):
レスポンスボディなし

**エラー時** (404 Not Found):
```typescript
{
  error: {
    code: "NOT_FOUND",
    message: "指定された[リソース]が見つかりません"
  }
}
```

---

## GraphQL API 仕様

### スキーマ定義

```graphql
type [Resource] {
  id: ID!
  [field]: [Type]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

input Create[Resource]Input {
  [field]: [Type]!
}

input Update[Resource]Input {
  [field]: [Type]
}

type [Resource]Connection {
  edges: [[Resource]Edge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type [Resource]Edge {
  node: [Resource]!
  cursor: String!
}

type Query {
  [resource](id: ID!): [Resource]
  [resources](
    first: Int
    after: String
    orderBy: [Resource]OrderBy
    filter: [Resource]Filter
  ): [Resource]Connection!
}

type Mutation {
  create[Resource](input: Create[Resource]Input!): [Resource]!
  update[Resource](id: ID!, input: Update[Resource]Input!): [Resource]!
  delete[Resource](id: ID!): Boolean!
}
```

### Resolver仕様

#### Query: [resource]

**引数**:
- `id` (ID!, 必須): [リソース]ID

**戻り値**: `[Resource]` | `null`

**データ取得元**: [Database / Cache / External API]

**N+1問題対策**: [DataLoader使用 / バッチクエリ]

#### Query: [resources]

**引数**:
- `first` (Int): 取得件数
- `after` (String): カーソル（ページネーション用）
- `orderBy` ([Resource]OrderBy): ソート順
- `filter` ([Resource]Filter): フィルタ条件

**戻り値**: `[Resource]Connection!`

**キャッシュ戦略**: [Apollo Cache / Redis / なし]

#### Mutation: create[Resource]

**引数**:
- `input` (Create[Resource]Input!, 必須): 作成データ

**戻り値**: `[Resource]!`

**副作用**: データベースへの書き込み、イベント発行

#### バリデーション

##### フロントエンド責務
- GraphQLクエリのスキーマ検証
- 入力フォームの即時バリデーション
- 楽観的更新（Optimistic Update）

##### バックエンド責務
- GraphQLスキーマレベルの型検証
- ビジネスルール検証
- データ整合性チェック

### エラーハンドリング

**エラーレスポンス構造**:
```json
{
  "errors": [
    {
      "message": "Validation error",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["create[Resource]"],
      "extensions": {
        "code": "VALIDATION_ERROR",
        "field": "[field]",
        "userMessage": "ユーザー向けエラーメッセージ"
      }
    }
  ],
  "data": null
}
```

**エラーコード一覧**:
- `UNAUTHENTICATED`: 認証エラー
- `FORBIDDEN`: 認可エラー
- `NOT_FOUND`: リソース未検出
- `VALIDATION_ERROR`: バリデーションエラー
- `INTERNAL_SERVER_ERROR`: サーバー内部エラー

---

## 共通仕様

### エラーレスポンス形式（統一）

すべてのエラーは以下の形式で返却:

```typescript
{
  error: {
    code: string;           // エラーコード（大文字スネークケース）
    message: string;        // ユーザー向けエラーメッセージ
    details?: Array<{       // 詳細情報（バリデーションエラー時）
      field: string;
      message: string;
    }>;
    timestamp: string;      // エラー発生時刻（ISO 8601）
    requestId?: string;     // リクエストID（トレーシング用）
  }
}
```

### ステータスコード一覧

| コード | 意味 | 使用場面 |
|-------|------|---------|
| 200 | OK | 成功（GET, PUT） |
| 201 | Created | 作成成功（POST） |
| 204 | No Content | 削除成功（DELETE） |
| 400 | Bad Request | バリデーションエラー |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 認可エラー |
| 404 | Not Found | リソース未検出 |
| 409 | Conflict | 競合エラー |
| 429 | Too Many Requests | レート制限超過 |
| 500 | Internal Server Error | サーバー内部エラー |

---

## AI実装時の注意事項

### トランザクション境界
- [このAPIのトランザクション範囲を記述]

### 冪等性
- [ ] このAPIは冪等である
- [ ] このAPIは冪等でない（理由: [理由]）

### 副作用
- [データベース更新、外部API呼び出し、イベント発行等を列挙]

### パフォーマンス要件
- **レスポンスタイム**: [200ms以内 / 1秒以内]
- **スループット**: [1000リクエスト/秒]

### セキュリティ考慮事項
- [ ] CSRF対策
- [ ] XSS対策
- [ ] SQLインジェクション対策
- [ ] レート制限
- [ ] 入力サニタイゼーション

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0.0 | YYYY-MM-DD | 初版作成 |
