# TanStack Start SSR 実装パターン

## 基本的な SSR アーキテクチャ

### Root Route パターン

すべての SSR アプリケーションの基盤となる必須ルート:

```tsx
import { createRootRoute } from '@tanstack/react-router'
import { Outlet, HeadContent, Scripts } from '@tanstack/react-start'

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

**重要なコンポーネント**:
- `<HeadContent />`: メタタグ、タイトル、リンクを管理
- `<Outlet />`: マッチした子ルートをレンダリング
- `<Scripts />`: クライアント側 JavaScript を読み込み（ハイドレーション用）

### データプリフェッチパターン

Server Functions を使ったサーバーサイドデータローディング:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// サーバー関数: サーバー側でのみ実行
export const getPost = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: postId }) => {
    // DB アクセス、API キー使用可能
    const post = await db.posts.findUnique({
      where: { id: postId },
    })

    if (!post) {
      throw notFound()
    }

    return post
  })

// ルートローダー: ナビゲーション前にデータをプリフェッチ
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await getPost({ data: params.postId })
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

### 並列データローディングパターン

複数のデータソースを効率的に読み込む:

```tsx
export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    // Promise.allSettled でウォーターフォールを回避
    const [userResult, postsResult, analyticsResult] = await Promise.allSettled([
      getUserFn(),
      getPostsFn(),
      getAnalyticsFn(),
    ])

    return {
      user: userResult.status === 'fulfilled' ? userResult.value : null,
      posts: postsResult.status === 'fulfilled' ? postsResult.value : [],
      analytics: analyticsResult.status === 'fulfilled' ? analyticsResult.value : null,
    }
  },
  component: DashboardComponent,
})
```

**重要なポイント**:
- `Promise.all` ではなく `Promise.allSettled` を使用
- 一部のリクエストが失敗してもページ全体が壊れない
- すべてのリクエストが並列で実行される（パフォーマンス向上）

### TanStack Query 統合パターン

外部キャッシュライブラリとの統合:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '~/lib/queryClient'

export const Route = createFileRoute('/users')({
  loader: async () => {
    // prefetchQuery: 非ブロッキング（推奨）
    await queryClient.prefetchQuery({
      queryKey: ['users'],
      queryFn: getUsersFn,
    })

    // ensureQueryData: レンダリングをブロック（クリティカルなデータのみ）
    const criticalData = await queryClient.ensureQueryData({
      queryKey: ['critical'],
      queryFn: getCriticalDataFn,
    })

    return { criticalData }
  },
  component: UsersComponent,
})

function UsersComponent() {
  // コンポーネント内で TanStack Query を使用
  const { data: users } = useSuspenseQuery({
    queryKey: ['users'],
    queryFn: getUsersFn,
  })

  return <UserList users={users} />
}
```

**使い分け**:
- `prefetchQuery`: コンポーネントがレンダリング時に useSuspenseQuery で同じクエリを実行
- `ensureQueryData`: ローダーがデータを返し、コンポーネントはそれを使用

### 認証とルート保護パターン

認証が必要なルートの実装:

```tsx
// app/routes/_authed/route.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

// 現在のユーザーを取得するサーバー関数
export const getCurrentUser = createServerFn('GET').handler(async () => {
  const session = await getSession()

  if (!session?.userId) {
    return null
  }

  const user = await db.users.findUnique({
    where: { id: session.userId },
  })

  return user
})

// 認証レイアウトルート
export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUser()

    // 未認証ユーザーをログインページにリダイレクト
    if (!user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href, // ログイン後に元のページに戻る
        },
      })
    }

    // コンテキストにユーザー情報を提供
    return { user }
  },
})
```

**子ルートからユーザー情報にアクセス**:

```tsx
// app/routes/_authed/profile.tsx
export const Route = createFileRoute('/_authed/profile')({
  component: ProfileComponent,
})

function ProfileComponent() {
  // 親ルートのコンテキストからユーザー情報を取得
  const { user } = Route.useRouteContext()

  return <div>Welcome, {user.name}!</div>
}
```

### フォーム処理パターン

Server Functions を使ったフォーム送信:

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { useServerFn } from '@tanstack/react-start'

// バリデーションスキーマ
const CreatePostSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  content: z.string().min(10, '本文は10文字以上必要です'),
})

// サーバー関数
export const createPost = createServerFn({ method: 'POST' })
  .inputValidator(CreatePostSchema)
  .handler(async ({ data }) => {
    const session = await getSession()

    if (!session?.userId) {
      throw new Error('認証が必要です')
    }

    const post = await db.posts.create({
      data: {
        ...data,
        authorId: session.userId,
      },
    })

    return post
  })

export const Route = createFileRoute('/_authed/posts/new')({
  component: NewPostComponent,
})

function NewPostComponent() {
  const createPostFn = useServerFn(createPost)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      const post = await createPostFn({
        data: {
          title: formData.get('title') as string,
          content: formData.get('content') as string,
        },
      })

      // 作成後に投稿ページにリダイレクト
      navigate({ to: `/posts/${post.id}` })
    } catch (error) {
      console.error('投稿の作成に失敗しました:', error)
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

### エラーハンドリングパターン

適切なエラー処理の実装:

```tsx
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

    // 権限チェック
    const session = await getSession()
    if (post.isPrivate && post.authorId !== session?.userId) {
      throw redirect({ to: '/unauthorized' })
    }

    return post
  })

// エラーバウンダリーコンポーネント
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    try {
      const post = await getPost({ data: params.postId })
      return { post }
    } catch (error) {
      // エラーを再スローしてルートのエラーバウンダリーで処理
      throw error
    }
  },
  component: PostComponent,
  errorComponent: ({ error }) => {
    if (error.message === 'Not Found') {
      return <div>投稿が見つかりませんでした</div>
    }
    return <div>エラーが発生しました: {error.message}</div>
  },
})
```

## プリローディング戦略

### インテントベースプリローディング

ユーザーの意図を検知してプリロード:

```tsx
import { Link } from '@tanstack/react-router'

function Navigation() {
  return (
    <nav>
      {/* ホバー時にプリロード */}
      <Link to="/about" preload="intent">
        About
      </Link>

      {/* タッチスタート時にもプリロード */}
      <Link to="/posts" preload="intent">
        Posts
      </Link>
    </nav>
  )
}
```

### ビューポートベースプリローディング

リンクが画面に表示されたらプリロード:

```tsx
function PostList({ posts }) {
  return (
    <div>
      {posts.map((post) => (
        <Link
          key={post.id}
          to="/posts/$postId"
          params={{ postId: post.id }}
          preload="viewport" // 画面に表示されたらプリロード
        >
          {post.title}
        </Link>
      ))}
    </div>
  )
}
```

### カスタムプリロード設定

```tsx
import { createRouter } from '@tanstack/react-router'

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent', // デフォルトのプリロード戦略
    defaultPreloadStaleTime: 30000, // 30秒間キャッシュ（デフォルト）
    // TanStack Query を使う場合は 0 に設定
    defaultPreloadStaleTime: 0,
  })
}
```

## パフォーマンス最適化

### beforeLoad の最適化

`beforeLoad` は順次実行されるため、パフォーマンスに注意:

```tsx
// ❌ 悪い例: 遅い beforeLoad が子ルートをブロック
export const Route = createFileRoute('/_layout')({
  beforeLoad: async () => {
    // この処理が遅いと、すべての子ルートがブロックされる
    const slowData = await slowApiCall()
    return { slowData }
  },
})

// ✅ 良い例: 認証チェックのみを beforeLoad で実行
export const Route = createFileRoute('/_layout')({
  beforeLoad: async () => {
    // 高速な認証チェックのみ
    const user = await getCurrentUser() // キャッシュされた高速な処理
    if (!user) throw redirect({ to: '/login' })
    return { user }
  },
  loader: async () => {
    // 重い処理は loader で並列実行
    const data = await heavyDataFetching()
    return { data }
  },
})
```

### ローダーの並列化

複数ルートのローダーは並列実行される:

```tsx
// 親ルート
export const Route = createFileRoute('/_layout')({
  loader: async () => {
    const config = await getConfig() // 並列実行される
    return { config }
  },
})

// 子ルート
export const Route = createFileRoute('/_layout/dashboard')({
  loader: async () => {
    const dashboard = await getDashboard() // 親と並列実行
    return { dashboard }
  },
})
```

## ストリーミング SSR

TanStack Start はストリーミング SSR をサポート:

```tsx
import { Suspense } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: DashboardComponent,
})

function DashboardComponent() {
  return (
    <div>
      <h1>ダッシュボード</h1>

      {/* 即座にレンダリング */}
      <QuickStats />

      {/* 非同期コンポーネントをストリーミング */}
      <Suspense fallback={<div>読み込み中...</div>}>
        <SlowAnalytics />
      </Suspense>
    </div>
  )
}

function SlowAnalytics() {
  // useSuspenseQuery でデータを取得
  const { data } = useSuspenseQuery({
    queryKey: ['analytics'],
    queryFn: getAnalyticsFn, // 遅い API
  })

  return <AnalyticsChart data={data} />
}
```

**メリット**:
- ページの一部を即座に表示
- 遅いデータは後からストリーミング
- ユーザー体験の向上
