---
name: hono-specialist
description: |
  Hono web framework specialist for building fast, type-safe APIs on edge runtimes. Use when implementing REST APIs, CRUD operations, authentication, validation, middleware, or deploying to Cloudflare Workers, Deno, Bun, or Node.js. Provides production-ready templates, best practices, and deployment configurations for TypeScript-based API development.
---

# Hono Specialist

高速でエッジランタイム対応のWebフレームワーク「Hono」の専門家として、API開発、ミドルウェア実装、デプロイメント支援を提供します。

## 目次

1. [Overview](#overview)
2. [Core Capabilities](#core-capabilities)
   - [API開発支援](#1-api開発支援)
   - [ミドルウェア実装](#2-ミドルウェア実装)
   - [バリデーション](#3-バリデーション)
   - [認証とセキュリティ](#4-認証とセキュリティ)
   - [デプロイメント支援](#5-デプロイメント支援)
   - [ベストプラクティス](#6-ベストプラクティスのガイダンス)
3. [Quick Start Examples](#quick-start-examples)
4. [デフォルト設定](#デフォルト設定)
5. [Working with This Skill](#working-with-this-skill)
6. [Resources](#resources)
7. [Common Patterns](#common-patterns)
8. [Common Mistakes and Best Practices](#common-mistakes-and-best-practices)
9. [必要な依存関係](#必要な依存関係)
10. [Tips](#tips)
11. [Next Steps](#next-steps)

---

## Overview

このスキルは、Honoを使用したAPI開発を包括的にサポートします：

- **REST API / CRUD API**: 完全な型安全性を持つAPI実装テンプレート
- **ミドルウェア**: 認証、バリデーション、ロギング、エラーハンドリング
- **デプロイメント**: Cloudflare Workers、Deno、Bun、Docker対応
- **ベストプラクティス**: ルーティング、バリデーション、パフォーマンス最適化
- **TypeScript統合**: 完全な型推論とZodによるランタイムバリデーション

## Core Capabilities

### 1. API開発支援

REST APIやCRUD APIの実装を支援します。

**使用シーン:**
- 「HonoでREST APIを作成したい」
- 「CRUD操作を実装してほしい」
- 「ユーザー管理APIを作りたい」

**提供内容:**
- REST API テンプレート (`assets/templates/api/rest-api.ts`)
- CRUD API テンプレート (`assets/templates/api/crud-api.ts`)
- Todo API の完全実装例 (`assets/templates/examples/todo-api/`)
- 型安全なレスポンスヘルパー (`assets/templates/utilities/response-helpers.ts`)

**実装例:**
```typescript
import { Hono } from 'hono'
import { validateBody } from './middleware/validation-zod'
import { success } from './utilities/response-helpers'
import { z } from 'zod'

const app = new Hono()

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

app.post('/users', validateBody(userSchema), async (c) => {
  const data = c.req.valid('json') // Fully typed!
  // Create user in database
  return success(c, user, 'User created', 201)
})
```

詳細は `references/routing-patterns.md` を参照してください。

### 2. ミドルウェア実装

認証、バリデーション、ロギング、エラーハンドリングのミドルウェアを提供します。

**使用シーン:**
- 「JWT認証を追加したい」
- 「Zodでバリデーションしたい」
- 「エラーハンドリングを実装したい」
- 「リクエストログを記録したい」

**提供内容:**
- JWT認証ミドルウェア (`assets/templates/middleware/auth-jwt.ts`)
- Zodバリデーション (`assets/templates/middleware/validation-zod.ts`)
- 構造化ロギング (`assets/templates/middleware/logging.ts`)
- エラーハンドリング (`assets/templates/middleware/error-handling.ts`)

**実装例:**
```typescript
import { Hono } from 'hono'
import { authMiddleware, requireRole } from './middleware/auth-jwt'
import { loggingMiddleware } from './middleware/logging'
import { errorHandler } from './middleware/error-handling'

const app = new Hono()

// Global middleware
app.use('*', loggingMiddleware())

// Protected routes
app.use('/admin/*', authMiddleware())
app.use('/admin/*', requireRole(['admin']))

// Error handling
app.onError(errorHandler)
```

詳細は `references/middleware-guide.md` を参照してください。

### 3. バリデーション

Zodを使用した型安全なバリデーションを実装します。

**使用シーン:**
- 「リクエストボディをバリデーションしたい」
- 「クエリパラメータを検証したい」
- 「カスタムバリデーションを追加したい」

**提供内容:**
- 共通バリデーションスキーマ (`assets/templates/utilities/validation-schemas.ts`)
- バリデーションミドルウェア (`assets/templates/middleware/validation-zod.ts`)

**実装例:**
```typescript
import { z } from 'zod'
import { validateBody, validateQuery } from './middleware/validation-zod'

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string(),
  tags: z.array(z.string()),
})

const paginationSchema = z.object({
  page: z.string().transform(Number),
  limit: z.string().transform(Number),
})

app.post('/posts', validateBody(createSchema), handler)
app.get('/posts', validateQuery(paginationSchema), handler)
```

### 4. 認証とセキュリティ

JWT認証、ロールベースアクセス制御、セッション管理を実装します。

**使用シーン:**
- 「ユーザー登録・ログインを実装したい」
- 「JWT トークンを使いたい」
- 「管理者専用エンドポイントを作りたい」

**提供内容:**
- 認証サービスの完全実装例 (`assets/templates/examples/auth-service/`)
- JWT認証ミドルウェア (`assets/templates/middleware/auth-jwt.ts`)

**実装例:**
```typescript
import { authMiddleware, requireRole, verifyOwnership } from './middleware/auth-jwt'

// 認証必須
app.use('/api/*', authMiddleware())

// 管理者のみ
app.delete('/api/users/:id', requireRole(['admin']), deleteUser)

// 所有者または管理者のみ
app.put('/api/users/:id', verifyOwnership('id'), updateUser)
```

完全な認証サービスの実装は `assets/templates/examples/auth-service/` を参照してください。

### 5. デプロイメント支援

複数のランタイム環境へのデプロイメントを支援します。

**使用シーン:**
- 「Cloudflare Workersにデプロイしたい」
- 「Denoで動かしたい」
- 「Dockerコンテナ化したい」
- 「D1、KV、R2を使いたい」

**提供内容:**
- Cloudflare Workers設定 (`assets/templates/deployment/cloudflare-workers/`)
- Deno Deploy設定 (`assets/templates/deployment/deno/`)
- Bun設定 (`assets/templates/deployment/bun/`)
- Docker設定 (`assets/templates/deployment/docker/`)

**実装例（Cloudflare Workers）:**
```typescript
type Bindings = {
  DB: D1Database
  KV: KVNamespace
  STORAGE: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/users', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM users'
  ).all()
  return c.json(results)
})

export default app
```

詳細は `references/deployment-guide.md` を参照してください。

### 6. ベストプラクティスのガイダンス

Honoのベストプラクティスに従った実装を支援します。

**使用シーン:**
- 「Honoのベストプラクティスを知りたい」
- 「パフォーマンスを最適化したい」
- 「セキュリティを強化したい」

**提供内容:**
- ベストプラクティスガイド (`references/best-practices.md`)
- ルーティングパターン (`references/routing-patterns.md`)
- ミドルウェアガイド (`references/middleware-guide.md`)

**主なベストプラクティス:**
1. **型安全性**: `Hono<{ Bindings, Variables }>` で型を定義
2. **バリデーション**: Zod + `@hono/zod-validator` を使用
3. **エラーハンドリング**: HTTPExceptionとカスタムエラーを活用
4. **ミドルウェア順序**: 認証 → バリデーション → ビジネスロジック
5. **レスポンス標準化**: 統一されたレスポンス形式を使用

詳細は `references/best-practices.md` を参照してください。

## Quick Start Examples

### シンプルなREST API

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const app = new Hono()

const schema = z.object({
  name: z.string(),
  email: z.string().email(),
})

app.post('/users', zValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json({ success: true, data })
})

export default app
```

### 認証付きAPI

```typescript
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'

const app = new Hono()

app.use('/api/*', jwt({ secret: 'secret' }))

app.get('/api/profile', (c) => {
  const payload = c.get('jwtPayload')
  return c.json({ user: payload })
})

export default app
```

### Cloudflare Workers + D1

```typescript
type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

app.get('/users', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM users'
  ).all()
  return c.json(results)
})

export default app
```

## デフォルト設定

ユーザーから特に指示がない限り、以下のデフォルト設定を使用します：

- **ランタイム**: Cloudflare Workers（エッジ実行、D1/KV/R2統合）
- **バリデーション**: Zod + @hono/zod-validator（型安全、ランタイム検証）
- **認証**: JWT (hono/jwt)（ステートレス、エッジ対応）
- **レスポンス**: 統一JSON形式（`{ success: true, data: {...} }`）
- **エラー**: HTTPException + カスタムエラークラス
- **ミドルウェア順序**: ロギング → 認証 → バリデーション → ロジック

詳細は `references/best-practices.md` を参照。

## Working with This Skill

### ステップ1: 要件の確認

まず、実装する機能を確認します：
- API のタイプ（REST、CRUD、リアルタイム）
- 認証・認可の要件
- デプロイ先（Cloudflare Workers、Deno、Bun、Node.js）
- データベース（D1、KV、PostgreSQL、MongoDB など）

**検証**:
- すべての要件が明確になっていることを確認
- デプロイ先とデータベースの互換性を確認
  - Cloudflare Workers: D1、KV、R2
  - Deno: Deno KV、PostgreSQL
  - Bun: SQLite、PostgreSQL
  - Node.js: 任意のデータベース

**エラー時**:
- 不明な要件がある場合はユーザーに確認
- 互換性がない組み合わせの場合は代替案を提示

### ステップ2: テンプレートの選択

要件に応じて適切なテンプレートを選択します：
- シンプルなAPI: `assets/templates/api/rest-api.ts`
- 完全なCRUD: `assets/templates/api/crud-api.ts`
- Todo APIの例: `assets/templates/examples/todo-api/`
- 認証サービス: `assets/templates/examples/auth-service/`

**検証**:
- 選択したテンプレートが要件に適合していることを確認
- テンプレートファイルが存在することを確認

**エラー時**:
- 要件に適したテンプレートがない場合は、最も近いテンプレートをカスタマイズ
- ファイルが見つからない場合は、パスを確認

### ステップ3: ミドルウェアの追加

必要に応じてミドルウェアを追加します：
- 認証: `assets/templates/middleware/auth-jwt.ts`
- バリデーション: `assets/templates/middleware/validation-zod.ts`
- ロギング: `assets/templates/middleware/logging.ts`
- エラーハンドリング: `assets/templates/middleware/error-handling.ts`

**検証**:
- ミドルウェアの適用順序が正しいことを確認（ロギング → 認証 → バリデーション → ビジネスロジック）
- 各ミドルウェアが正しくインポートされていることを確認

**エラー時**:
- インポートエラーの場合は、パスを確認
- ミドルウェアの順序が間違っている場合は修正

### ステップ4: デプロイ設定

デプロイ先に応じて設定ファイルをコピーします：
- Cloudflare Workers: `assets/templates/deployment/cloudflare-workers/`
- Deno: `assets/templates/deployment/deno/`
- Bun: `assets/templates/deployment/bun/`
- Docker: `assets/templates/deployment/docker/`

**検証**:
- 設定ファイルの環境変数が正しく設定されていることを確認
- 必要な依存関係がインストールされていることを確認

**エラー時**:
- 環境変数が不足している場合は、必要な変数を追加
- 依存関係エラーの場合は、`npm install` または `bun install` を実行

### ステップ5: カスタマイズと実装

テンプレートをベースにカスタマイズし、ビジネスロジックを実装します。

**検証**:
- TypeScriptの型エラーがないことを確認
- バリデーションスキーマが要件を満たしていることを確認
- エンドポイントが正しく動作することをテスト

**エラー時**:
- 型エラーの場合は、型定義を追加または修正
- バリデーションエラーの場合は、スキーマを調整
- 動作しない場合は、ログを確認してデバッグ

## Resources

### references/
詳細なガイドとベストプラクティス：
- `best-practices.md`: Honoのベストプラクティス全般
- `routing-patterns.md`: ルーティングパターンとRESTful設計
- `middleware-guide.md`: ミドルウェアの実装と使用方法
- `deployment-guide.md`: 各環境へのデプロイメント手順

### assets/templates/
すぐに使える実装テンプレート：
- `api/`: REST API と CRUD API のテンプレート
- `middleware/`: 認証、バリデーション、ロギング、エラーハンドリング
- `examples/`: Todo API と認証サービスの完全実装例
- `utilities/`: レスポンスヘルパー、バリデーションスキーマ、エラー型
- `deployment/`: Cloudflare Workers、Deno、Bun、Docker の設定

## Common Patterns

### パターン1: 基本的なCRUD API

```typescript
const users = new Hono()

users.get('/', listUsers)        // GET /users
users.get('/:id', getUser)       // GET /users/:id
users.post('/', createUser)      // POST /users
users.put('/:id', updateUser)    // PUT /users/:id
users.delete('/:id', deleteUser) // DELETE /users/:id

app.route('/api/users', users)
```

### パターン2: 認証 + バリデーション

```typescript
app.post('/api/posts',
  authMiddleware(),              // 1. 認証
  validateBody(postSchema),      // 2. バリデーション
  createPost                     // 3. ビジネスロジック
)
```

### パターン3: エラーハンドリング

```typescript
import { HTTPException } from 'hono/http-exception'
import { NotFoundError } from './utilities/error-types'

app.get('/users/:id', async (c) => {
  const user = await db.users.find(id)
  if (!user) {
    throw new NotFoundError('User not found')
  }
  return c.json(user)
})

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  return c.json({ error: 'Internal error' }, 500)
})
```

## Common Mistakes and Best Practices

詳細なアンチパターンと改善例は `references/best-practices.md` を参照してください。

### まとめ: 品質の高いHonoアプリケーションを書くために

1. **型定義を必ず行う** - `Hono<{ Bindings, Variables }>`
2. **Zodで必ずバリデーション** - `zValidator` + `c.req.valid()`
3. **適切なエラーハンドリング** - `HTTPException` + カスタムエラー
4. **正しいミドルウェア順序** - 認証 → バリデーション → ロジック
5. **統一されたレスポンス形式** - レスポンスヘルパーを使用

## Tips

- **型安全性**: `Hono<{ Bindings, Variables }>` で常に型を定義
- **バリデーション**: Zodスキーマを再利用してDRYに
- **ミドルウェア順序**: 認証 → バリデーション → ロジックの順番を守る
- **エラーハンドリング**: カスタムエラークラスで一貫性を保つ
- **テスト**: `hono/testing` を使用して型安全にテスト
- **パフォーマンス**: Context変数の使用は最小限に
- **セキュリティ**: 環境変数でシークレットを管理

## 必要な依存関係

詳細なセットアップ手順、各ランタイム環境の設定、トラブルシューティングは `references/deployment-guide.md` を参照してください。

**基本セットアップ**:
```bash
npm install hono zod @hono/zod-validator
```

**ランタイム別**: Cloudflare Workers (wrangler)、Deno、Bun、Node.js のセットアップ手順は deployment-guide を参照。

## Next Steps

1. `references/best-practices.md` でベストプラクティスを確認
2. `assets/templates/examples/` の実装例を参照
3. 要件に応じたテンプレートを選択してカスタマイズ
4. `references/deployment-guide.md` でデプロイ手順を確認
