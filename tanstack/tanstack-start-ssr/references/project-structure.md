# TanStack Start プロジェクト構造

## 推奨ディレクトリ構造

```
your-project/
├── app/                          # アプリケーションコード
│   ├── routes/                   # ルート定義（ファイルベースルーティング）
│   │   ├── __root.tsx            # ルートレイアウト（必須）
│   │   ├── index.tsx             # トップページ（/）
│   │   ├── about.tsx             # /about
│   │   ├── _authed/              # 認証レイアウト
│   │   │   ├── route.tsx         # beforeLoad で認証チェック
│   │   │   ├── dashboard.tsx    # /dashboard
│   │   │   ├── profile.tsx      # /profile
│   │   │   └── settings.tsx     # /settings
│   │   ├── posts/                # 投稿機能
│   │   │   ├── index.tsx         # /posts
│   │   │   ├── new.tsx           # /posts/new
│   │   │   └── $postId.tsx       # /posts/:postId
│   │   ├── api/                  # API ルート
│   │   │   ├── auth.tsx          # 認証 API
│   │   │   └── webhooks.tsx      # Webhook
│   │   └── login.tsx             # /login
│   │
│   ├── components/               # 再利用可能なコンポーネント
│   │   ├── ui/                   # shadcn/ui コンポーネント
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── card.tsx
│   │   ├── layout/               # レイアウトコンポーネント
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── features/             # 機能別コンポーネント
│   │       ├── PostList.tsx
│   │       ├── UserCard.tsx
│   │       └── CommentThread.tsx
│   │
│   ├── lib/                      # ユーティリティ関数
│   │   ├── utils.ts              # 汎用ユーティリティ（cn() など）
│   │   ├── queryClient.ts        # TanStack Query 設定
│   │   ├── session.ts            # セッション管理
│   │   ├── db.ts                 # データベースクライアント
│   │   └── auth.ts               # 認証ヘルパー
│   │
│   ├── server/                   # サーバー専用コード
│   │   ├── functions/            # サーバー関数
│   │   │   ├── auth.ts           # 認証関連
│   │   │   ├── posts.ts          # 投稿関連
│   │   │   └── users.ts          # ユーザー関連
│   │   ├── middleware/           # ミドルウェア
│   │   │   ├── auth.ts
│   │   │   └── logging.ts
│   │   └── services/             # ビジネスロジック
│   │       ├── email.ts
│   │       └── storage.ts
│   │
│   ├── types/                    # 型定義
│   │   ├── env.ts                # 環境変数の型
│   │   ├── api.ts                # API レスポンスの型
│   │   └── models.ts             # データモデルの型
│   │
│   ├── styles/                   # スタイル
│   │   └── globals.css           # グローバルスタイル
│   │
│   ├── hooks/                    # カスタムフック
│   │   ├── useAuth.ts
│   │   └── useDebounce.ts
│   │
│   ├── client.tsx                # クライアントエントリーポイント
│   ├── ssr.tsx                   # SSR エントリーポイント
│   ├── router.tsx                # ルーター設定
│   └── routeTree.gen.ts          # 自動生成ルートツリー（手動編集不可）
│
├── e2e/                          # E2E テスト（Playwright）
│   ├── auth.spec.ts
│   └── posts.spec.ts
│
├── public/                       # 静的アセット
│   ├── favicon.ico
│   └── images/
│
├── prisma/                       # Prisma（データベース）
│   ├── schema.prisma
│   └── migrations/
│
├── .env.example                  # 環境変数テンプレート
├── .env.local                    # ローカル環境変数（.gitignore）
├── wrangler.jsonc                # Cloudflare 設定
├── vite.config.ts                # Vite 設定
├── tsconfig.json                 # TypeScript 設定
├── package.json                  # パッケージ設定
└── README.md                     # プロジェクトドキュメント
```

## ファイルの役割

### `app/routes/`

TanStack Router のファイルベースルーティングを使用。ファイル名が URL パスにマッピングされる。

**命名規則**:
- `index.tsx` → `/`（インデックスルート）
- `about.tsx` → `/about`（静的ルート）
- `$postId.tsx` → `/:postId`（動的ルート）
- `_authed/` → レイアウトルート（パスに影響しない）

### `app/client.tsx`

クライアントサイドのエントリーポイント:

```tsx
import { createRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import { getRouter } from './router'

const router = getRouter()

const rootElement = document.getElementById('root')!

if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)
  root.render(<StartClient router={router} />)
}
```

### `app/ssr.tsx`

サーバーサイドのエントリーポイント:

```tsx
import { createStartHandler, defaultStreamHandler } from '@tanstack/react-start/server'
import { getRouter } from './router'

export default createStartHandler({
  getRouter,
  createHandler: defaultStreamHandler,
})()
```

### `app/router.tsx`

ルーター設定:

```tsx
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { queryClient } from './lib/queryClient'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    context: {
      queryClient,
    },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0, // TanStack Query 使用時
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
```

### `app/types/env.ts`

環境変数の型定義:

```typescript
export interface Env {
  // サーバー側のみ
  DATABASE_URL?: string
  SESSION_SECRET?: string
  API_KEY?: string

  // Cloudflare バインディング
  KV?: KVNamespace
  R2?: R2Bucket
  DB?: D1Database
  AI?: Ai
}
```

## ルーティングパターン

### 認証レイアウト

```
app/routes/
├── _authed/              # 認証レイアウト
│   ├── route.tsx         # beforeLoad で認証チェック
│   ├── dashboard.tsx     # /dashboard
│   └── profile.tsx       # /profile
```

`_authed/route.tsx`:

```tsx
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUser()
    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    return { user }
  },
})
```

### 動的ルート

```
app/routes/
└── posts/
    ├── index.tsx         # /posts
    ├── new.tsx           # /posts/new
    └── $postId.tsx       # /posts/:postId
```

`posts/$postId.tsx`:

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await getPost({ data: params.postId })
    return { post }
  },
  component: PostComponent,
})
```

### API ルート

```
app/routes/
└── api/
    ├── auth.tsx          # /api/auth
    └── webhooks.tsx      # /api/webhooks
```

`api/auth.tsx`:

```tsx
import { createAPIFileRoute } from '@tanstack/react-start/api'

export const Route = createAPIFileRoute('/api/auth')({
  GET: async ({ request }) => {
    // API ロジック
    return Response.json({ success: true })
  },
  POST: async ({ request }) => {
    const body = await request.json()
    // 処理
    return Response.json({ success: true })
  },
})
```

## コンポーネント構成

### UI コンポーネント（shadcn/ui）

```
app/components/ui/
├── button.tsx
├── input.tsx
├── card.tsx
├── dialog.tsx
└── dropdown-menu.tsx
```

shadcn/ui でインストール:

```bash
bunx shadcn add button input card dialog dropdown-menu
```

### 機能別コンポーネント

```
app/components/features/
├── PostList.tsx          # 投稿一覧
├── PostCard.tsx          # 投稿カード
├── UserCard.tsx          # ユーザーカード
└── CommentThread.tsx     # コメントスレッド
```

### レイアウトコンポーネント

```
app/components/layout/
├── Header.tsx
├── Footer.tsx
├── Sidebar.tsx
└── MainLayout.tsx
```

## サーバー関数の整理

### 機能別に分割

```
app/server/functions/
├── auth.ts               # 認証関連
├── posts.ts              # 投稿関連
└── users.ts              # ユーザー関連
```

`auth.ts`:

```typescript
import { createServerFn } from '@tanstack/react-start'

export const login = createServerFn({ method: 'POST' })
  .inputValidator(LoginSchema)
  .handler(async ({ data }) => {
    // ログイン処理
  })

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  // ログアウト処理
})

export const getCurrentUser = createServerFn('GET').handler(async () => {
  // 現在のユーザーを取得
})
```

## 環境変数の管理

```
.env                      # デフォルト値（コミット）
.env.local                # ローカル上書き（.gitignore）
.env.development          # 開発環境固有
.env.production           # 本番環境固有
.env.example              # テンプレート（コミット）
```

`.env.example`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db

# Session
SESSION_SECRET=your-secret-key-here

# API Keys (Server-side only)
API_KEY=your-api-key

# Public variables (Client-side accessible)
VITE_PUBLIC_API_URL=https://api.example.com
```

## ビルド出力

```
.output/
├── public/               # デプロイ用の静的ファイル
│   ├── assets/           # JS/CSS バンドル
│   └── server/           # サーバーコード
└── client/               # クライアント用バンドル
```

Cloudflare Pages へのデプロイ:

```bash
wrangler pages deploy .output/public
```
