# TanStack Start Best Practices

このドキュメントは、TanStack Startを使用したSPA実装におけるベストプラクティスをまとめたものです。

## 目次

1. [パフォーマンス最適化](#パフォーマンス最適化)
2. [セキュリティ](#セキュリティ)
3. [型安全性](#型安全性)
4. [エラーハンドリング](#エラーハンドリング)
5. [コード品質](#コード品質)

---

## パフォーマンス最適化

### 1. beforeLoadの最適化

**問題**: `beforeLoad`は順次実行されるため、重い処理があると子ルート全体がブロックされる。

**ベストプラクティス**:
- `beforeLoad`では軽量な処理のみ実行（認証チェック、権限確認など）
- データフェッチは`loader`で並列実行
- キャッシュを活用して繰り返しのDB問い合わせを削減

```tsx
// ❌ 悪い例: beforeLoadで重いデータフェッチ
export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    const posts = await getPosts() // 重い処理をbeforeLoadで実行
    const stats = await getStats()
    return { user, posts, stats }
  },
})

// ✅ 良い例: beforeLoadは軽量、loaderで並列フェッチ
export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const user = await getCurrentUser() // 軽量な認証チェックのみ
    if (!user) throw redirect({ to: '/login' })
    return { user }
  },
  loader: async ({ context }) => {
    // 重い処理は並列実行
    const [posts, stats] = await Promise.all([
      getPosts({ userId: context.user.id }),
      getStats({ userId: context.user.id }),
    ])
    return { posts, stats }
  },
})
```

### 2. プリローディング戦略

**ベストプラクティス**:
- ユーザーの次の行動を予測してプリロード
- `preload="intent"` でホバー時にプリロード
- `preload="viewport"` で可視範囲に入ったらプリロード

```tsx
// Intent-based: ユーザーがリンクにホバーした時点でプリロード
<Link to="/posts/$postId" params={{ postId: '123' }} preload="intent">
  記事を読む
</Link>

// Viewport-based: リンクが画面に表示されたらプリロード
<Link to="/posts/$postId" params={{ postId: '123' }} preload="viewport">
  次の記事
</Link>
```

**設定のカスタマイズ**:
```tsx
// app/router.tsx
export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent', // デフォルトのプリロード戦略
    defaultPreloadStaleTime: 10000, // 10秒間キャッシュ
  })
}
```

### 3. TanStack Query統合

**ベストプラクティス**:
- ローダーで`prefetchQuery`を使用して非ブロッキングフェッチ
- コンポーネントで`useSuspenseQuery`を使用
- キャッシュの恩恵を最大限活用

```tsx
// ローダーでプリフェッチ
export const Route = createFileRoute('/posts')({
  loader: async () => {
    await queryClient.prefetchQuery({
      queryKey: ['posts'],
      queryFn: getPostsFn,
      staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    })
  },
})

// コンポーネントで使用
function PostsComponent() {
  const { data } = useSuspenseQuery({
    queryKey: ['posts'],
    queryFn: getPostsFn,
  })
  return <PostList posts={data} />
}
```

### 4. ウォーターフォールの回避

**問題**: 順次的なデータフェッチによるパフォーマンス低下

**ベストプラクティス**: `Promise.all`または`Promise.allSettled`で並列実行

```tsx
// ❌ 悪い例: ウォーターフォール
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    const user = await getUserFn()
    const posts = await getPostsFn({ userId: user.id }) // userを待つ
    const stats = await getStatsFn({ userId: user.id }) // postsを待つ
    return { user, posts, stats }
  },
})

// ✅ 良い例: 並列実行
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    return { user }
  },
  loader: async ({ context }) => {
    // 独立したリクエストを並列実行
    const [posts, stats] = await Promise.all([
      getPostsFn({ userId: context.user.id }),
      getStatsFn({ userId: context.user.id }),
    ])
    return { posts, stats }
  },
})
```

### 5. データのメモ化

**ベストプラクティス**: React.useMemoでコストの高い計算をメモ化

```tsx
function Dashboard() {
  const { posts, stats } = Route.useLoaderData()

  // ✅ 高コストな計算をメモ化
  const sortedPosts = React.useMemo(
    () => posts.sort((a, b) => b.createdAt - a.createdAt),
    [posts]
  )

  const aggregatedStats = React.useMemo(
    () => ({
      total: stats.reduce((sum, s) => sum + s.value, 0),
      average: stats.reduce((sum, s) => sum + s.value, 0) / stats.length,
    }),
    [stats]
  )

  return <div>...</div>
}
```

---

## セキュリティ

### 1. 環境変数の管理

**原則**: 秘密情報を絶対にクライアントに公開しない

**ベストプラクティス**:
- サーバーサイドの秘密情報に`VITE_`プレフィックスを付けない
- クライアント公開が必要な変数のみ`VITE_`を使用
- Server Function内でのみ秘密情報にアクセス

```tsx
// ❌ 悪い例: 秘密情報をクライアントに公開
// .env
VITE_DATABASE_URL=postgresql://... # 危険！
VITE_API_KEY=secret-key             # 危険！

// ✅ 良い例: サーバーサイドのみ
// .env
DATABASE_URL=postgresql://...       # VITE_なし
API_KEY=secret-key                  # VITE_なし
VITE_APP_NAME=MyApp                # クライアント公開OK

// Server Functionで安全に使用
export const getDataFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const apiKey = process.env.API_KEY // サーバーサイドのみ
    const response = await fetch('https://api.example.com', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    return response.json()
  })
```

### 2. 入力バリデーション

**原則**: すべての外部入力を検証する

**ベストプラクティス**:
- Zodなどのスキーマバリデーターを使用
- Server Functionで必ず検証
- クライアント側でも検証（UX向上のため）

```tsx
// ✅ Zodで厳密なバリデーション
const CreateUserSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string()
    .min(8, 'パスワードは8文字以上必要です')
    .regex(/[A-Z]/, '大文字を含める必要があります')
    .regex(/[0-9]/, '数字を含める必要があります'),
  age: z.number().min(13, '13歳以上である必要があります').max(120),
})

export const createUserFn = createServerFn({ method: 'POST' })
  .inputValidator(CreateUserSchema) // 自動的に検証
  .handler(async ({ data }) => {
    // dataは既に検証済み・型安全
    const user = await db.users.create({ data })
    return user
  })
```

### 3. 認証とセッション管理

**ベストプラクティス**:
- HTTP-only cookieでセッション管理
- bcryptでパスワードハッシュ化（salt rounds: 12以上）
- CSRF対策: `sameSite: 'lax'`
- XSS対策: `httpOnly: true`

```tsx
// ✅ 安全なセッション設定
export function useAppSession() {
  return useSession<SessionData>({
    name: 'app-session',
    password: process.env.SESSION_SECRET!, // 32文字以上推奨
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS必須（本番）
      sameSite: 'lax',     // CSRF対策
      httpOnly: true,       // XSS対策（JavaScriptからアクセス不可）
      maxAge: 60 * 60 * 24 * 7, // 7日間
    },
  })
}

// ✅ 安全なパスワードハッシュ化
export const registerFn = createServerFn({ method: 'POST' })
  .inputValidator(RegisterSchema)
  .handler(async ({ data }) => {
    const passwordHash = await bcrypt.hash(data.password, 12) // 12 rounds

    const user = await db.users.create({
      data: { ...data, passwordHash },
    })

    return user
  })
```

### 4. CORS設定

**ベストプラクティス**:
- 本番環境では特定のオリジンのみ許可
- 開発環境でのみワイルドカード使用

```tsx
// vite.config.ts
export default defineConfig({
  server: {
    cors: process.env.NODE_ENV === 'production'
      ? { origin: 'https://yourdomain.com' }
      : true, // 開発環境のみ全許可
  },
})
```

### 5. SQLインジェクション対策

**ベストプラクティス**:
- ORMを使用（Prisma、Drizzleなど）
- プレースホルダーを使用（生SQLの場合）

```tsx
// ❌ 悪い例: SQLインジェクションの危険
const userId = data.userId
const result = await db.raw(`SELECT * FROM users WHERE id = ${userId}`)

// ✅ 良い例: ORMを使用
const user = await db.users.findUnique({ where: { id: userId } })

// ✅ 良い例: プレースホルダーを使用（D1の場合）
const result = await env.DB
  .prepare('SELECT * FROM users WHERE id = ?')
  .bind(userId)
  .all()
```

---

## 型安全性

### 1. Server Functionsの型推論

**ベストプラクティス**:
- inputValidatorで自動的に型推論
- 戻り値の型を明示的に定義

```tsx
const CreatePostSchema = z.object({
  title: z.string(),
  content: z.string(),
})

// ✅ 型安全なServer Function
export const createPostFn = createServerFn({ method: 'POST' })
  .inputValidator(CreatePostSchema)
  .handler(async ({ data }): Promise<{ success: boolean; post: Post }> => {
    // dataの型は自動推論: { title: string; content: string }
    const post = await db.posts.create({ data })

    return { success: true, post }
  })

// 使用時も型安全
function CreatePost() {
  const createPost = useServerFn(createPostFn)

  const handleSubmit = async () => {
    const result = await createPost({
      data: {
        title: 'Hello',
        content: 'World',
      },
    })

    // resultの型は推論される: { success: boolean; post: Post }
    console.log(result.post.title)
  }
}
```

### 2. ルートパラメータの型安全性

**ベストプラクティス**:
- TanStack Routerの自動型生成を活用

```tsx
// app/routes/posts/$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    // params.postIdは自動的に型推論される（string）
    const post = await getPostFn({ id: params.postId })
    return { post }
  },
})

function PostComponent() {
  const { postId } = Route.useParams() // 型安全
  const { post } = Route.useLoaderData() // 型安全
}
```

### 3. 検索パラメータの検証

**ベストプラクティス**:
- `validateSearch`でZodスキーマを使用

```tsx
const PostsSearchSchema = z.object({
  page: z.number().int().min(1).catch(1),
  sort: z.enum(['latest', 'popular']).catch('latest'),
  category: z.string().optional(),
})

export const Route = createFileRoute('/posts')({
  validateSearch: PostsSearchSchema,
  loader: async ({ search }) => {
    // searchは型安全: { page: number; sort: 'latest' | 'popular'; category?: string }
    const posts = await getPostsFn({
      page: search.page,
      sort: search.sort,
      category: search.category,
    })
    return { posts }
  },
})
```

### 4. Cloudflare環境変数の型定義

**ベストプラクティス**:
- `wrangler types`で自動生成
- カスタムインターフェースで拡張

```bash
# 型定義を生成
bun run cf-typegen
```

```typescript
// app/types/env.ts
import type { Env as CloudflareEnv } from 'cloudflare:workers'

export interface Env extends CloudflareEnv {
  SESSION_SECRET: string
  DB: D1Database
  BUCKET: R2Bucket
}

// 使用時に型安全
export const getDataFn = createServerFn({ method: 'GET' })
  .handler(async (_, { env }: { env: Env }) => {
    const data = await env.DB.prepare('SELECT * FROM users').all()
    return data
  })
```

---

## エラーハンドリング

### 1. Server Functionsでのエラー処理

**ベストプラクティス**:
- 適切なエラータイプを使い分ける
- クライアントに適切なメッセージを返す

```tsx
export const getPostFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    // リソースが見つからない → notFound()
    const post = await db.posts.findUnique({ where: { id: data.id } })
    if (!post) {
      throw notFound()
    }

    // 認証が必要 → redirect()
    const user = await getCurrentUser()
    if (!user) {
      throw redirect({ to: '/login' })
    }

    // 権限エラー → Error()
    if (post.authorId !== user.id) {
      throw new Error('この投稿を編集する権限がありません')
    }

    return post
  })
```

### 2. エラーバウンダリ

**ベストプラクティス**:
- ルートレベルでエラーをキャッチ
- ユーザーフレンドリーなエラーメッセージ

```tsx
// app/routes/__root.tsx
export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">エラーが発生しました</h1>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button onClick={() => window.location.reload()}>
          再読み込み
        </button>
      </div>
    </div>
  ),
})
```

### 3. フォームエラーの表示

**ベストプラクティス**:
- 検証エラーをユーザーに明確に伝える

```tsx
function CreatePostForm() {
  const createPost = useServerFn(createPostFn)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const formData = new FormData(e.currentTarget)

    try {
      await createPost({
        data: {
          title: formData.get('title') as string,
          content: formData.get('content') as string,
        },
      })
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Zodバリデーションエラー
        const fieldErrors: Record<string, string> = {}
        err.errors.forEach(error => {
          if (error.path[0]) {
            fieldErrors[error.path[0].toString()] = error.message
          }
        })
        setErrors(fieldErrors)
      } else if (err instanceof Error) {
        setErrors({ general: err.message })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {errors.general && <div className="error">{errors.general}</div>}

      <div>
        <input name="title" />
        {errors.title && <span className="error">{errors.title}</span>}
      </div>

      <div>
        <textarea name="content" />
        {errors.content && <span className="error">{errors.content}</span>}
      </div>

      <button type="submit">投稿</button>
    </form>
  )
}
```

---

## コード品質

### 1. ファイル構成

**ベストプラクティス**:
- 機能ごとにディレクトリを分割
- 関連するコードをコロケート

```
app/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── posts/
│   │   ├── index.tsx
│   │   └── $postId.tsx
│   └── _authed/
│       ├── dashboard.tsx
│       └── settings.tsx
├── lib/
│   ├── auth.ts        # 認証Server Functions
│   ├── api.ts         # データ取得Server Functions
│   ├── session.ts     # セッション管理
│   └── query-client.ts
├── components/
│   ├── ui/            # shadcn/ui components
│   └── features/      # 機能別コンポーネント
│       ├── auth/
│       └── posts/
└── types/
    └── env.ts
```

### 2. コンポーネントの分割

**ベストプラクティス**:
- Single Responsibility Principle
- 再利用可能なコンポーネントを抽出

```tsx
// ❌ 悪い例: 巨大なコンポーネント
function Dashboard() {
  return (
    <div>
      <header>{/* ヘッダーのロジック */}</header>
      <aside>{/* サイドバーのロジック */}</aside>
      <main>{/* メインコンテンツのロジック */}</main>
      <footer>{/* フッターのロジック */}</footer>
    </div>
  )
}

// ✅ 良い例: 分割されたコンポーネント
function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <DashboardSidebar />
      <DashboardMain />
      <DashboardFooter />
    </div>
  )
}
```

### 3. カスタムフック

**ベストプラクティス**:
- ロジックをカスタムフックに抽出
- 複数のコンポーネントで再利用

```tsx
// app/hooks/useCurrentUser.ts
export function useCurrentUser() {
  const getCurrentUser = useServerFn(getCurrentUserFn)
  const [user, setUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    getCurrentUser().then(setUser)
  }, [])

  return user
}

// 複数のコンポーネントで使用
function Header() {
  const user = useCurrentUser()
  return <div>{user?.name}</div>
}

function Sidebar() {
  const user = useCurrentUser()
  return <nav>{user?.email}</nav>
}
```

### 4. コメントとドキュメント

**ベストプラクティス**:
- 複雑なロジックにはコメントを追加
- JSDocで関数を文書化

```tsx
/**
 * ユーザーの投稿を取得する
 *
 * @param userId - ユーザーID
 * @param options - 取得オプション
 * @param options.limit - 取得件数（デフォルト: 10）
 * @param options.offset - オフセット（デフォルト: 0）
 * @returns ユーザーの投稿リスト
 */
export const getUserPostsFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      userId: z.string(),
      limit: z.number().int().min(1).max(100).default(10),
      offset: z.number().int().min(0).default(0),
    })
  )
  .handler(async ({ data }) => {
    const posts = await db.posts.findMany({
      where: { authorId: data.userId },
      take: data.limit,
      skip: data.offset,
      orderBy: { createdAt: 'desc' },
    })

    return posts
  })
```

### 5. テスト

**ベストプラクティス**:
- 重要なロジックにはテストを書く
- E2Eテストで主要なフローを検証

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('ログインフロー', async ({ page }) => {
  await page.goto('http://localhost:5173/login')

  await page.fill('input[name="email"]', 'user@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('http://localhost:5173/dashboard')
  await expect(page.locator('text=ダッシュボード')).toBeVisible()
})
```
