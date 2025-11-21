# TanStack Start SSR ベストプラクティス

## セキュリティ

### 環境変数の適切な管理

**基本原則**: サーバーとクライアントで環境変数を厳密に分離

```typescript
// ❌ 危険: クライアントに API キーが露出
export const VITE_API_KEY = import.meta.env.VITE_API_KEY

// ✅ 安全: サーバー関数内でのみアクセス
export const getSecretData = createServerFn('GET').handler(async () => {
  const apiKey = process.env.API_KEY // サーバー側のみ
  return await fetchWithApiKey(apiKey)
})
```

**環境変数のコンテキスト**:

| コンテキスト | アクセス方法 | 利用可能な変数 |
|------------|------------|--------------|
| サーバー側 | `process.env` | すべての変数 |
| クライアント側 | `import.meta.env` | `VITE_` プレフィックス付きのみ |

**ファイル構造**:

```
.env                # デフォルト値（コミット推奨）
.env.local          # ローカル上書き（.gitignore 推奨）
.env.development    # 開発環境固有
.env.production     # 本番環境固有
```

**型定義**:

```typescript
// app/types/env.ts
export interface Env {
  // サーバー側のみ
  DATABASE_URL?: string
  SESSION_SECRET?: string
  API_KEY?: string

  // Cloudflare バインディング
  KV?: KVNamespace
  R2?: R2Bucket
  DB?: D1Database
}

// サーバー関数での使用
export const getData = createServerFn('GET').handler(async (_, { env }: { env: Env }) => {
  const secret = env.SESSION_SECRET
  const data = await env.KV.get('key')
  return { data }
})
```

### 入力バリデーション

**必須**: すべてのサーバー関数で入力を検証

```typescript
import { z } from 'zod'

// ❌ 危険: バリデーションなし
export const createUser = createServerFn({ method: 'POST' }).handler(async ({ data }) => {
  // data の型が any、SQL インジェクションのリスク
  return await db.users.create({ data })
})

// ✅ 安全: Zod でバリデーション
const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().min(0).max(120),
  role: z.enum(['user', 'admin']),
})

export const createUser = createServerFn({ method: 'POST' })
  .inputValidator(CreateUserSchema)
  .handler(async ({ data }) => {
    // data は型安全で検証済み
    return await db.users.create({ data })
  })
```

**複雑なバリデーション例**:

```typescript
const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  settings: z
    .object({
      notifications: z.boolean(),
      theme: z.enum(['light', 'dark', 'auto']),
    })
    .optional(),
})

export const updateProfile = createServerFn({ method: 'POST' })
  .inputValidator(UpdateProfileSchema)
  .handler(async ({ data }) => {
    const session = await getSession()

    if (!session?.userId) {
      throw new Error('認証が必要です')
    }

    return await db.users.update({
      where: { id: session.userId },
      data,
    })
  })
```

### セッション管理とクッキー

**セキュアなセッション設定**:

```typescript
import { useSession } from '@tanstack/react-start'

export function useAppSession() {
  return useSession<SessionData>({
    name: 'app-session',
    password: process.env.SESSION_SECRET!, // 32文字以上推奨

    cookie: {
      // XSS 対策: JavaScript からアクセス不可
      httpOnly: true,

      // HTTPS のみ（本番環境）
      secure: process.env.NODE_ENV === 'production',

      // CSRF 対策
      sameSite: 'lax', // または 'strict'

      // ドメイン設定（サブドメイン共有時）
      domain: process.env.COOKIE_DOMAIN,

      // 有効期限（7日間）
      maxAge: 60 * 60 * 24 * 7,
    },
  })
}
```

**セッションのベストプラクティス**:

1. **SESSION_SECRET の管理**:
   - 32文字以上のランダムな文字列
   - 環境変数で管理（ハードコード禁止）
   - 定期的にローテーション

2. **セッション有効期限**:
   - 適切な `maxAge` を設定
   - アクティビティに応じて延長を検討

3. **セッションの無効化**:
```typescript
export const logout = createServerFn('POST').handler(async () => {
  const session = await getSession()
  await session.clear() // セッションをクリア
  throw redirect({ to: '/login' })
})
```

### 認証のベストプラクティス

**パスワードハッシュ**:

```typescript
import bcrypt from 'bcryptjs'

// ユーザー登録
export const register = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
    }),
  )
  .handler(async ({ data }) => {
    // bcrypt で 12 ラウンドのソルト（推奨）
    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await db.users.create({
      data: {
        email: data.email,
        password: hashedPassword,
      },
    })

    return { success: true }
  })

// ログイン
export const login = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const user = await db.users.findUnique({
      where: { email: data.email },
    })

    if (!user) {
      throw new Error('メールアドレスまたはパスワードが間違っています')
    }

    const isValid = await bcrypt.compare(data.password, user.password)

    if (!isValid) {
      throw new Error('メールアドレスまたはパスワードが間違っています')
    }

    const session = await getSession()
    await session.update({ userId: user.id })

    return { success: true }
  })
```

**レート制限**:

```typescript
// 簡易的なレート制限の実装例
const loginAttempts = new Map<string, number>()

export const login = createServerFn({ method: 'POST' })
  .inputValidator(LoginSchema)
  .handler(async ({ data }) => {
    const attempts = loginAttempts.get(data.email) || 0

    // 5回失敗したら15分間ブロック
    if (attempts >= 5) {
      throw new Error('ログイン試行回数が上限に達しました。15分後に再試行してください。')
    }

    try {
      // ログイン処理
      const user = await authenticateUser(data)

      // 成功したらカウントをリセット
      loginAttempts.delete(data.email)

      return { success: true, user }
    } catch (error) {
      // 失敗したらカウントを増やす
      loginAttempts.set(data.email, attempts + 1)

      // 15分後に自動リセット
      setTimeout(() => loginAttempts.delete(data.email), 15 * 60 * 1000)

      throw error
    }
  })
```

## パフォーマンス最適化

### データローディング戦略

**ローダーの実行順序を理解する**:

```typescript
// 親ルート（順次実行）
export const Route = createFileRoute('/_layout')({
  beforeLoad: async () => {
    // 1. 最初に実行（親 beforeLoad）
    const user = await getCurrentUser()
    return { user }
  },
  loader: async () => {
    // 3. 並列実行（親 loader）
    const config = await getConfig()
    return { config }
  },
})

// 子ルート（順次実行）
export const Route = createFileRoute('/_layout/dashboard')({
  beforeLoad: async ({ context }) => {
    // 2. 次に実行（子 beforeLoad）
    // 親の beforeLoad が完了するまで待機
    if (!context.user.hasAccess) {
      throw redirect({ to: '/unauthorized' })
    }
  },
  loader: async () => {
    // 3. 並列実行（子 loader）
    // 親の loader と同時に実行
    const dashboard = await getDashboard()
    return { dashboard }
  },
})
```

**重要なポイント**:
- `beforeLoad` は順次実行（親→子）
- `loader` は並列実行（パフォーマンス向上）
- 重い処理は `loader` に配置

### プリロード設定

**デフォルト設定の調整**:

```typescript
// app/router.tsx
export function getRouter() {
  return createRouter({
    routeTree,

    // TanStack Query を使用しない場合
    defaultPreloadStaleTime: 30000, // 30秒間キャッシュ（デフォルト）

    // TanStack Query を使用する場合
    defaultPreloadStaleTime: 0, // 常にローダーを実行
  })
}
```

**ルート単位でのカスタマイズ**:

```typescript
export const Route = createFileRoute('/posts')({
  loader: async () => {
    const posts = await getPosts()
    return { posts }
  },

  // このルートのプリロード設定
  staleTime: 60000, // 1分間キャッシュ
})
```

### TanStack Query の活用

**効率的なキャッシュ管理**:

```typescript
// app/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // デフォルトのキャッシュ時間
      staleTime: 1000 * 60 * 5, // 5分

      // 再フェッチ設定
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,

      // リトライ設定
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})
```

**ローダーでの使用**:

```typescript
export const Route = createFileRoute('/users')({
  loader: async () => {
    // 並列プリフェッチ
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: ['users'],
        queryFn: getUsersFn,
        staleTime: 1000 * 60 * 5,
      }),
      queryClient.prefetchQuery({
        queryKey: ['teams'],
        queryFn: getTeamsFn,
        staleTime: 1000 * 60 * 10,
      }),
    ])
  },
  component: UsersComponent,
})
```

### コード分割

**動的インポート**:

```typescript
import { lazy } from 'react'

// 重いコンポーネントを遅延ロード
const HeavyChart = lazy(() => import('~/components/HeavyChart'))

export const Route = createFileRoute('/analytics')({
  component: AnalyticsComponent,
})

function AnalyticsComponent() {
  return (
    <div>
      <h1>アナリティクス</h1>
      <Suspense fallback={<div>チャートを読み込み中...</div>}>
        <HeavyChart />
      </Suspense>
    </div>
  )
}
```

## エラーハンドリング

### 適切なエラータイプの使用

```typescript
import { createServerFn, notFound } from '@tanstack/react-start'
import { redirect } from '@tanstack/react-router'

export const getPost = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: postId }) => {
    const post = await db.posts.findUnique({
      where: { id: postId },
    })

    // 404 エラー
    if (!post) {
      throw notFound()
    }

    // 権限エラー（リダイレクト）
    const session = await getSession()
    if (post.isPrivate && post.authorId !== session?.userId) {
      throw redirect({ to: '/unauthorized' })
    }

    // 一般的なエラー
    if (post.status === 'deleted') {
      throw new Error('この投稿は削除されています')
    }

    return post
  })
```

### エラーバウンダリー

```typescript
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await getPost({ data: params.postId })
    return { post }
  },
  component: PostComponent,

  // エラーバウンダリー
  errorComponent: ({ error, reset }) => {
    if (error.message === 'Not Found') {
      return (
        <div>
          <h1>投稿が見つかりませんでした</h1>
          <Link to="/posts">投稿一覧に戻る</Link>
        </div>
      )
    }

    return (
      <div>
        <h1>エラーが発生しました</h1>
        <p>{error.message}</p>
        <button onClick={reset}>リトライ</button>
      </div>
    )
  },
})
```

## 型安全性

### エンドツーエンドの型安全性

```typescript
// サーバー関数の型は自動的に推論される
export const getUser = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: userId }) => {
    const user = await db.users.findUnique({
      where: { id: userId },
    })
    return user // 型: User | null
  })

// コンポーネントで型安全に使用
function UserProfile() {
  const getUserFn = useServerFn(getUser)

  const loadUser = async (id: string) => {
    const user = await getUserFn({ data: id })
    // user の型が自動的に推論される
    console.log(user?.name)
  }

  return <button onClick={() => loadUser('123')}>Load User</button>
}
```

### ルートコンテキストの型定義

```typescript
// 親ルート
export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const user = await getCurrentUser()
    if (!user) throw redirect({ to: '/login' })
    return { user } // 型: { user: User }
  },
})

// 子ルート
export const Route = createFileRoute('/_authed/profile')({
  component: ProfileComponent,
})

function ProfileComponent() {
  // 型安全にコンテキストにアクセス
  const { user } = Route.useRouteContext() // 型: { user: User }
  return <div>{user.name}</div>
}
```

## テスト戦略

### サーバー関数のテスト

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createUser } from '~/routes/api/users'

describe('createUser', () => {
  beforeEach(() => {
    // データベースをリセット
  })

  it('should create a new user', async () => {
    const result = await createUser({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
      },
    })

    expect(result.success).toBe(true)
    expect(result.user.email).toBe('test@example.com')
  })

  it('should validate input', async () => {
    await expect(
      createUser({
        data: {
          name: '',
          email: 'invalid-email',
          age: -1,
        },
      }),
    ).rejects.toThrow()
  })
})
```

### E2E テスト

```typescript
import { test, expect } from '@playwright/test'

test('user can login and view profile', async ({ page }) => {
  await page.goto('/login')

  // ログイン
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  // プロフィールページに遷移
  await expect(page).toHaveURL('/profile')
  await expect(page.locator('h1')).toContainText('Test User')
})
```
