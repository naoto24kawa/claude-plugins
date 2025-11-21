# TanStack Start SPA Implementation Patterns

このドキュメントは、TanStack Startを使用したSPA実装における実践的なパターン集です。

## 目次

1. [ルーティングパターン](#ルーティングパターン)
2. [Server Functionsパターン](#server-functionsパターン)
3. [データローディングパターン](#データローディングパターン)
4. [認証パターン](#認証パターン)
5. [環境変数管理](#環境変数管理)

---

## ルーティングパターン

### 基本的なルート構造

```
app/routes/
├── __root.tsx         # ルートレイアウト（必須）
├── index.tsx          # / (トップページ)
├── about.tsx          # /about
├── posts/
│   ├── index.tsx      # /posts
│   └── $postId.tsx    # /posts/:postId (動的ルート)
└── _authed/           # 認証保護されたルートグループ
    ├── dashboard.tsx  # /dashboard
    └── settings.tsx   # /settings
```

### パターン1: 基本的なルート定義

```tsx
// app/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  component: PostComponent,
})

function PostComponent() {
  const { postId } = Route.useParams()
  return <div>Post ID: {postId}</div>
}
```

### パターン2: ローダー付きルート

```tsx
// app/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { getPostFn } from '~/lib/api'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await getPostFn({ id: params.postId })
    return { post }
  },
  component: PostComponent,
})

function PostComponent() {
  const { post } = Route.useLoaderData()
  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  )
}
```

### パターン3: パスレスレイアウトルート（認証保護）

```tsx
// app/routes/_authed.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { getCurrentUserFn } from '~/lib/auth'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn()

    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    return { user }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { user } = Route.useRouteContext()
  return (
    <div>
      <header>
        <nav>Welcome, {user.name}</nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
```

### パターン4: 動的ルートのネスト

```tsx
// app/routes/users/$userId/posts/$postId.tsx
// URL: /users/123/posts/456
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users/$userId/posts/$postId')({
  loader: async ({ params }) => {
    const [user, post] = await Promise.all([
      getUserFn({ id: params.userId }),
      getPostFn({ id: params.postId }),
    ])
    return { user, post }
  },
  component: UserPostComponent,
})
```

### パターン5: Rootレイアウト（必須）

```tsx
// app/routes/__root.tsx
import { createRootRoute, Outlet, HeadContent, Scripts } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="ja">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
```

---

## Server Functionsパターン

### パターン1: 基本的なGETリクエスト

```tsx
import { createServerFn } from '@tanstack/start'

export const getDataFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    // サーバーサイドでのみ実行
    const data = await db.query('SELECT * FROM items')
    return { items: data.rows }
  })
```

### パターン2: 入力バリデーション付きPOSTリクエスト

```tsx
import { createServerFn } from '@tanstack/start'
import { z } from 'zod'

const CreatePostSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  content: z.string().min(10, '本文は10文字以上必要です'),
  tags: z.array(z.string()).optional(),
})

export const createPostFn = createServerFn({ method: 'POST' })
  .inputValidator(CreatePostSchema)
  .handler(async ({ data }) => {
    // dataは型安全（CreatePostSchemaの型が推論される）
    const post = await db.posts.create({
      data: {
        title: data.title,
        content: data.content,
        tags: data.tags || [],
      },
    })

    return { success: true, post }
  })
```

### パターン3: エラーハンドリング

```tsx
import { createServerFn } from '@tanstack/start'
import { redirect, notFound } from '@tanstack/react-router'

export const getPostFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const post = await db.posts.findUnique({
      where: { id: data.id },
    })

    // リソースが見つからない場合
    if (!post) {
      throw notFound()
    }

    return post
  })

export const updatePostFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({
    id: z.string(),
    title: z.string(),
  }))
  .handler(async ({ data }) => {
    const user = await getCurrentUser()

    // 認証エラー
    if (!user) {
      throw redirect({ to: '/login' })
    }

    const post = await db.posts.findUnique({ where: { id: data.id } })

    // 権限エラー
    if (post.authorId !== user.id) {
      throw new Error('この投稿を編集する権限がありません')
    }

    const updated = await db.posts.update({
      where: { id: data.id },
      data: { title: data.title },
    })

    return updated
  })
```

### パターン4: コンポーネントからの呼び出し

```tsx
import { useServerFn } from '@tanstack/start'
import { createPostFn } from '~/lib/api'

function CreatePostForm() {
  const createPost = useServerFn(createPostFn)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const result = await createPost({
        data: {
          title: formData.get('title') as string,
          content: formData.get('content') as string,
        },
      })

      console.log('投稿作成成功:', result.post)
    } catch (error) {
      console.error('エラー:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">投稿</button>
    </form>
  )
}
```

---

## データローディングパターン

### パターン1: 並列ローダー（推奨）

```tsx
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    // 複数のリクエストを並列実行
    const [user, posts, stats] = await Promise.all([
      getUserFn(),
      getPostsFn(),
      getStatsFn(),
    ])

    return { user, posts, stats }
  },
})
```

### パターン2: beforeLoadとloaderの組み合わせ

```tsx
export const Route = createFileRoute('/_authed/dashboard')({
  // beforeLoadは順次実行（親→子）
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn()

    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    return { user }
  },

  // loaderは並列実行
  loader: async ({ context }) => {
    const [posts, notifications] = await Promise.all([
      getPostsFn({ userId: context.user.id }),
      getNotificationsFn({ userId: context.user.id }),
    ])

    return { posts, notifications }
  },
})
```

### パターン3: TanStack Query統合（プリフェッチ）

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '~/lib/query-client'
import { useSuspenseQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/posts')({
  loader: async () => {
    // 非ブロッキングプリフェッチ
    await queryClient.prefetchQuery({
      queryKey: ['posts'],
      queryFn: () => getPostsFn(),
    })
  },
  component: PostsComponent,
})

function PostsComponent() {
  // コンポーネント内でuseSuspenseQueryを使用
  const { data: posts } = useSuspenseQuery({
    queryKey: ['posts'],
    queryFn: () => getPostsFn(),
  })

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>{post.title}</article>
      ))}
    </div>
  )
}
```

### パターン4: ensureQueryData（ブロッキング）

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    // レンダリングをブロックしてデータを取得
    const post = await queryClient.ensureQueryData({
      queryKey: ['posts', params.postId],
      queryFn: () => getPostFn({ id: params.postId }),
    })

    return { post }
  },
})
```

### パターン5: ウォーターフォール回避

```tsx
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    // Promise.allSettledで全リクエストを即座に開始
    const results = await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: ['user'],
        queryFn: getUserFn,
      }),
      queryClient.prefetchQuery({
        queryKey: ['posts'],
        queryFn: getPostsFn,
      }),
      queryClient.prefetchQuery({
        queryKey: ['stats'],
        queryFn: getStatsFn,
      }),
    ])

    // エラーがあっても続行（部分的なデータで表示）
    return { results }
  },
})
```

### パターン6: プリローディング戦略

```tsx
import { Link } from '@tanstack/react-router'

// Intent-based（ホバー時にプリロード）
<Link to="/posts/$postId" params={{ postId: '123' }} preload="intent">
  記事を読む
</Link>

// Viewport-based（画面に入ったらプリロード）
<Link to="/posts/$postId" params={{ postId: '123' }} preload="viewport">
  記事を読む
</Link>

// 手動プリロード
<Link
  to="/posts/$postId"
  params={{ postId: '123' }}
  preload={false}
  onMouseEnter={() => {
    // カスタムロジックでプリロード
    router.preloadRoute({ to: '/posts/$postId', params: { postId: '123' } })
  }}
>
  記事を読む
</Link>
```

---

## 認証パターン

### パターン1: セッション管理セットアップ

```tsx
// app/lib/session.ts
import { useSession } from '@tanstack/start'

export interface SessionData {
  userId: string
  email: string
  role: 'admin' | 'user'
}

export function useAppSession() {
  return useSession<SessionData>({
    name: 'app-session',
    password: process.env.SESSION_SECRET!,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',     // CSRF対策
      httpOnly: true,       // XSS対策
      maxAge: 60 * 60 * 24 * 7, // 7日間
    },
  })
}
```

### パターン2: 認証Server Functions

```tsx
// app/lib/auth.ts
import { createServerFn } from '@tanstack/start'
import { redirect } from '@tanstack/react-router'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { useAppSession } from '~/lib/session'

const LoginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上必要です'),
})

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator(LoginSchema)
  .handler(async ({ data }) => {
    const user = await db.users.findUnique({
      where: { email: data.email },
    })

    if (!user) {
      throw new Error('メールアドレスまたはパスワードが正しくありません')
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash)

    if (!validPassword) {
      throw new Error('メールアドレスまたはパスワードが正しくありません')
    }

    const session = await useAppSession()
    await session.update({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    throw redirect({ to: '/dashboard' })
  })

export const logoutFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    const session = await useAppSession()
    await session.clear()
    throw redirect({ to: '/login' })
  })

export const getCurrentUserFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await useAppSession()

    if (!session.data?.userId) {
      return null
    }

    const user = await db.users.findUnique({
      where: { id: session.data.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    return user
  })

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
})

export const registerFn = createServerFn({ method: 'POST' })
  .inputValidator(RegisterSchema)
  .handler(async ({ data }) => {
    const existing = await db.users.findUnique({
      where: { email: data.email },
    })

    if (existing) {
      throw new Error('このメールアドレスは既に登録されています')
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const user = await db.users.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        role: 'user',
      },
    })

    const session = await useAppSession()
    await session.update({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    throw redirect({ to: '/dashboard' })
  })
```

### パターン3: 保護されたルートレイアウト

```tsx
// app/routes/_authed.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { getCurrentUserFn, logoutFn } from '~/lib/auth'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn()

    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    return { user }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { user } = Route.useRouteContext()
  const logout = useServerFn(logoutFn)

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="font-bold">MyApp</div>
          <div className="flex items-center gap-4">
            <span>{user.email}</span>
            <button onClick={() => logout()}>ログアウト</button>
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
```

### パターン4: ログインページ

```tsx
// app/routes/login.tsx
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/start'
import { loginFn, getCurrentUserFn } from '~/lib/auth'
import { z } from 'zod'

const LoginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: LoginSearchSchema,
  beforeLoad: async ({ search }) => {
    const user = await getCurrentUserFn()

    // 既にログイン済みの場合はリダイレクト
    if (user) {
      throw redirect({ to: search.redirect || '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const login = useServerFn(loginFn)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      await login({
        data: {
          email: formData.get('email') as string,
          password: formData.get('password') as string,
        },
      })

      // loginFnがredirectをthrowするため、ここには到達しない
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">ログイン</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            パスワード
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={8}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          ログイン
        </button>
      </form>
    </div>
  )
}
```

### パターン5: ロールベースのアクセス制御

```tsx
// app/routes/_authed/_admin.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { getCurrentUserFn } from '~/lib/auth'

export const Route = createFileRoute('/_authed/_admin')({
  beforeLoad: async ({ context }) => {
    // 親ルート(_authed)からuserが渡される
    const user = context.user

    if (user.role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }

    return { user }
  },
  component: () => <Outlet />,
})
```

---

## 環境変数管理

### パターン1: 環境変数の型定義

```typescript
// app/types/env.ts
export interface Env {
  // サーバーサイドのみ（VITE_プレフィックスなし）
  SESSION_SECRET: string
  DATABASE_URL: string
  API_KEY: string
  SMTP_HOST: string
  SMTP_PORT: string

  // クライアントにも公開（VITE_プレフィックス必須）
  VITE_APP_NAME: string
  VITE_API_BASE_URL: string
  VITE_SENTRY_DSN: string
}

// 型安全なアクセスヘルパー
export function getServerEnv<K extends keyof Env>(key: K): Env[K] {
  const value = process.env[key]

  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません`)
  }

  return value as Env[K]
}

export function getClientEnv<K extends keyof Env>(
  key: K extends `VITE_${string}` ? K : never
): Env[K] {
  const value = import.meta.env[key]

  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません`)
  }

  return value as Env[K]
}
```

### パターン2: Server Functionでの安全な使用

```tsx
// app/lib/api.ts
import { createServerFn } from '@tanstack/start'
import { getServerEnv } from '~/types/env'

export const fetchExternalDataFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    // サーバーサイドで安全にアクセス
    const apiKey = getServerEnv('API_KEY')

    const response = await fetch('https://api.example.com/data', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    return response.json()
  })
```

### パターン3: クライアントサイドでの使用

```tsx
// app/components/AppInfo.tsx
import { getClientEnv } from '~/types/env'

export function AppInfo() {
  // クライアントサイドで公開された変数のみアクセス可能
  const appName = getClientEnv('VITE_APP_NAME')
  const apiBaseUrl = getClientEnv('VITE_API_BASE_URL')

  return (
    <div>
      <h1>{appName}</h1>
      <p>API URL: {apiBaseUrl}</p>
    </div>
  )
}
```

### パターン4: .envファイルの構成

```bash
# .env - デフォルト設定（リポジトリにコミット）
VITE_APP_NAME=MyApp
VITE_API_BASE_URL=https://api.example.com

# .env.local - ローカル上書き（.gitignoreに追加）
SESSION_SECRET=your-local-secret-key
DATABASE_URL=postgresql://localhost:5432/myapp
API_KEY=your-local-api-key

# .env.production - 本番環境
SESSION_SECRET=production-secret-key
DATABASE_URL=postgresql://prod-db:5432/myapp
API_KEY=production-api-key
```

### パターン5: Cloudflare環境変数（本番環境）

```typescript
// app/types/env.ts（Cloudflare Workers用）
import type { Env as CloudflareEnv } from 'cloudflare:workers'

export interface Env extends CloudflareEnv {
  // Cloudflareバインディング
  SESSION_SECRET: string
  DB: D1Database
  BUCKET: R2Bucket
  KV: KVNamespace
  AI: Ai
}

// Server Functionでの使用
export const getDataFn = createServerFn({ method: 'GET' })
  .handler(async (_, { env }: { env: Env }) => {
    // 型安全にCloudflareバインディングにアクセス
    const secret = env.SESSION_SECRET
    const data = await env.DB.prepare('SELECT * FROM users').all()

    return data
  })
```
