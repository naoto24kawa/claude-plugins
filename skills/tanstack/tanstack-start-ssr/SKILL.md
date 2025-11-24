---
name: tanstack-start-ssr
description: TanStack Start を使った SSR（サーバーサイドレンダリング）アプリケーションの実装パターン、ベストプラクティス、プロジェクト構造を提供する。ルーティング、Server Functions、データローディング、認証、セキュリティ、パフォーマンス最適化など、SSR 実装に必要な知識を網羅。このスキルは、TanStack Start で新規プロジェクトを構築する際、既存プロジェクトに SSR を追加する際、または SSR 実装のベストプラクティスを確認する際に使用する。
---

# TanStack Start SSR Implementation

TanStack Start を使った SSR（サーバーサイドレンダリング）アプリケーションの実装パターン、ベストプラクティス、プロジェクト構造を提供する専門スキル。

## 目次

1. [概要](#概要)
2. [使用タイミング](#使用タイミング)
3. [実装の基本フロー](#実装の基本フロー)
4. [参照資料の活用](#参照資料の活用)
5. [実装チェックリスト](#実装チェックリスト)
6. [トラブルシューティング](#トラブルシューティング)
7. [まとめ](#まとめ)
8. [リファレンス](#リファレンス)

---

## 概要

TanStack Start は、TanStack Router を基盤とするフルスタック React フレームワークで、以下の特徴を持つ:

- **フルドキュメント SSR**: 完全なサーバーサイドレンダリング
- **ストリーミング**: プログレッシブなページロード
- **Server Functions**: クライアント/サーバー間の型安全な RPC
- **ファイルベースルーティング**: 自動コード分割と型安全性
- **ユニバーサルデプロイ**: Cloudflare Workers/Pages、Netlify など
- **エンドツーエンド型安全性**: スタック全体での TypeScript サポート

## 使用タイミング

このスキルは以下の場合に使用する:

- TanStack Start で新規 SSR プロジェクトを構築する
- 既存プロジェクトに SSR を追加する
- ルーティング、Server Functions の実装パターンを確認する
- データローディング戦略を最適化する
- 認証フローを実装する
- セキュリティとパフォーマンスのベストプラクティスを適用する
- プロジェクト構造を設計する

## 初期セットアップ: バージョン確認

**最優先事項**: このスキルを使用する前に、プロジェクトの TanStack Start バージョンを必ず確認する:

```bash
# package.json でインストール済みバージョンを確認
cat package.json | grep -A 2 "@tanstack/react-start"
```

**バージョン別ドキュメントURL:**
- v1.x の場合: `https://tanstack.com/router/v1/docs/framework/react/start`
- 最新版の場合: `https://tanstack.com/router/latest/docs/framework/react/start`

**バージョンに応じた対応:**

1. **package.json にバージョンがある場合**:
   - バージョン固有のドキュメントURLを使用
   - 検索クエリ: `"TanStack Start" <機能名> v{メジャー}.{マイナー} site:tanstack.com`
   - 例: `"TanStack Start" server functions v1.80 site:tanstack.com`

2. **package.json が存在しない、またはバージョン不明の場合**:
   - 最新版を前提とする
   - 最新版ドキュメントURLを使用
   - ユーザーに最新版パターンを使用していることを通知

3. **v1.60 より古いバージョンの場合**:
   - ユーザーに古いバージョンである旨を警告
   - マイグレーションガイドの確認を推奨
   - 検索: `"TanStack Start" migration v{旧} to v{新} site:tanstack.com`

**バージョン検出の検証:**
- [ ] package.json の存在確認と確認完了
- [ ] TanStack Start バージョンの特定、または最新版と仮定
- [ ] 適切なドキュメントURLの選択完了
- [ ] ユーザーにどのバージョンのパターンを使用するか通知済み

## 実装の基本フロー

### 1. Root Route の設定

すべての SSR アプリケーションは Root Route から始まる。`app/routes/__root.tsx` を作成:

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

**重要な要素**:
- `<HeadContent />`: メタタグ、タイトルを管理
- `<Outlet />`: マッチした子ルートをレンダリング
- `<Scripts />`: クライアント側 JavaScript を読み込み

**検証ポイント**:
- [ ] `HeadContent`、`Outlet`、`Scripts` の3つのコンポーネントがすべて配置されている
- [ ] HTML 構造が適切（`<html>` → `<head>` → `<body>`）
- [ ] `createRootRoute` を使用している（`createFileRoute` ではない）

### 2. ファイルベースルーティング

TanStack Start は `app/routes/` ディレクトリのファイル構造に基づいてルーティングを自動生成する。

**基本的な命名規則**:
- `index.tsx` → `/`
- `about.tsx` → `/about`
- `posts/$postId.tsx` → `/posts/:postId`
- `_authed/` → 認証レイアウト（パスに影響しない）

**ルートの作成**:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})

function AboutComponent() {
  return <div>About Page</div>
}
```

**検証ポイント**:
- [ ] ファイル名とパスが正しく対応している
- [ ] `createFileRoute` のパス引数がファイルパスと一致
- [ ] 開発サーバー起動時に `routeTree.gen.ts` が自動生成される

### 3. Server Functions によるデータ取得

Server Functions を使ってサーバー側でのみ実行されるロジックを定義:

```tsx
import { createServerFn, notFound } from '@tanstack/react-start'
import { z } from 'zod'

export const getPost = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: postId }) => {
    // サーバー側でのみ実行（DB アクセス、API キー使用可能）
    const post = await db.posts.findUnique({
      where: { id: postId },
    })

    if (!post) {
      throw notFound()
    }

    return post
  })
```

**検証ポイント**:
- [ ] 入力バリデーション（Zod）が実装されている
- [ ] エラー時に適切な例外をスロー（`notFound()`、`redirect()`、`Error`）
- [ ] サーバー側でのみ実行される処理（DB アクセス、API キー使用）
- [ ] 型安全性が保たれている（返り値の型が自動推論）

### 4. ローダーによるデータプリフェッチ

ルートローダーでナビゲーション前にデータをプリフェッチ:

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await getPost({ data: params.postId })
    return { post }
  },
  component: PostComponent,
})

function PostComponent() {
  const { post } = Route.useLoaderData()
  return <article>{post.title}</article>
}
```

**検証ポイント**:
- [ ] ローダーで Server Functions を呼び出している
- [ ] コンポーネントで `Route.useLoaderData()` を使用してデータを取得
- [ ] ナビゲーション前にデータがプリフェッチされる
- [ ] 型安全性が保たれている（useLoaderData の返り値の型が自動推論）

### 5. 認証フローの実装

認証レイアウトルートで認証チェックを実装:

```tsx
// app/routes/_authed/route.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

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

**検証ポイント**:
- [ ] `beforeLoad` で認証チェックを実装
- [ ] 未認証ユーザーを適切にリダイレクト（`redirect` を throw）
- [ ] リダイレクト後に元のページに戻れるよう `search` パラメータを設定
- [ ] 認証済みユーザー情報をコンテキストに提供（`return { user }`）
- [ ] 子ルートで `Route.useRouteContext()` でユーザー情報にアクセス可能

## 最新ドキュメントの参照

**重要**: このスキルのパターンは最終更新時点のものです。実装前に必ず最新の公式ドキュメントを確認してください。

### 公式ドキュメント検索ワークフロー

1. **実装前に必ず公式ドキュメントを検索**:
   - WebSearch を使用: `"TanStack Start" <機能名> site:tanstack.com`
   - 例: `"TanStack Start" server functions 2025 site:tanstack.com`

2. **最新のAPI仕様を確認**:
   - WebFetch で公式ドキュメントを取得: https://tanstack.com/router/latest/docs/framework/react/start
   - 取得した内容でこのスキルのパターンを検証・更新

3. **公式ドキュメントとの矛盾がある場合**:
   - 常に公式ドキュメントを優先

### 推奨検索クエリ

- ルーティング: `"TanStack Start" ファイルベースルーティング 2025 site:tanstack.com`
- Server Functions: `"TanStack Start" createServerFn バリデーション 2025 site:tanstack.com`
- データローディング: `"TanStack Start" loader beforeLoad 2025 site:tanstack.com`
- 認証: `"TanStack Start" 認証 セッション 2025 site:tanstack.com`
- デプロイ: `"TanStack Start" Cloudflare デプロイ 2025 site:tanstack.com`

### 参照資料の活用

このスキルには 3 つの包括的な参照ドキュメントが含まれている。
実装中に詳細な情報が必要な場合は、Read ツールで該当する参照ファイルを読み込む。
ただし、これらは補足資料であり、最新の公式ドキュメントを優先すること。

### references/ssr-patterns.md

詳細な SSR 実装パターンとコード例。実装時に Read で読み込んで参照する:

- **Root Route、データプリフェッチ、並列ローディング**
  - `Promise.allSettled` でウォーターフォールを回避
- **TanStack Query 統合、認証とルート保護**
  - `prefetchQuery` と `ensureQueryData` の使い分け
- **フォーム処理、エラーハンドリング**
  - Server Functions を使ったフォーム送信
- **プリローディング戦略（インテントベース、ビューポートベース）**
  - ホバーやビューポートに基づくプリロード
- **ストリーミング SSR、パフォーマンス最適化**
  - Suspense を使った段階的レンダリング

### references/best-practices.md

セキュリティとパフォーマンスのベストプラクティス。実装時に Read で読み込んで参照する:

- **環境変数の適切な管理（サーバー/クライアント分離）**
  - サーバー: `process.env`、クライアント: `import.meta.env.VITE_*`
- **入力バリデーション（Zod）、セッション管理**
  - HTTP-only、Secure、SameSite クッキー
- **認証のベストプラクティス（パスワードハッシュ、レート制限）**
  - bcrypt で 12 ラウンド以上のハッシュ化
- **データローディング戦略、TanStack Query の活用**
  - ローダーの並列化、プリロード設定
- **コード分割、エラーハンドリング、型安全性**
  - 適切なエラータイプの使用

### references/project-structure.md

推奨されるプロジェクト構造。実装時に Read で読み込んで参照する:

- **ディレクトリ構成の詳細**
  - app/routes/、app/components/、app/lib/ など
- **ファイルの役割と責務**
  - client.tsx、ssr.tsx、router.tsx の役割
- **ルーティングパターン（認証レイアウト、動的ルート、API ルート）**
  - _authed/、$postId.tsx、api/ の構成
- **コンポーネント構成（UI、機能別、レイアウト）**
  - shadcn/ui、features、layout の整理
- **サーバー関数の整理、環境変数の管理**
  - app/server/functions/ の構成

## 実装チェックリスト

SSR アプリケーションを実装する際は、以下を確認する:

### 基本設定
- [ ] Root Route (`__root.tsx`) に `HeadContent`、`Outlet`、`Scripts` を配置
- [ ] `router.tsx` でルーター設定を正しく構成
- [ ] 環境変数を適切に分離（サーバー: `process.env`、クライアント: `import.meta.env.VITE_*`）

### データローディング
- [ ] Server Functions で入力バリデーション（Zod）を実装
- [ ] ローダーで並列データフェッチング（`Promise.allSettled`）を使用
- [ ] TanStack Query を使う場合、`defaultPreloadStaleTime: 0` を設定

### セキュリティ
- [ ] 環境変数に機密情報を `VITE_` プレフィックスなしで保存
- [ ] セッション設定で `httpOnly: true`、`sameSite: 'lax'`、`secure: true`（本番）を設定
- [ ] パスワードを bcrypt でハッシュ化（12 ラウンド以上）

### パフォーマンス
- [ ] 重い処理を `beforeLoad` ではなく `loader` に配置
- [ ] プリロード戦略（`intent` または `viewport`）を適用
- [ ] コード分割と遅延ロード（`lazy`）を活用

### エラーハンドリング
- [ ] エラーバウンダリー（`errorComponent`）を各ルートに設定
- [ ] 適切なエラータイプ（`notFound`、`redirect`、`Error`）を使用

## トラブルシューティング

### 一般的な問題

**問題**: ローダーがデータをフェッチしない
- **原因**: TanStack Query を使用している場合、`defaultPreloadStaleTime` がデフォルト（30秒）
- **解決策**: `router.tsx` で `defaultPreloadStaleTime: 0` を設定

**問題**: 環境変数がクライアントで undefined
- **原因**: `VITE_` プレフィックスがない
- **解決策**: クライアントで使用する変数に `VITE_` プレフィックスを追加（ただし機密情報は絶対に含めない）

**問題**: beforeLoad が遅くて子ルートがブロックされる
- **原因**: `beforeLoad` は順次実行される
- **解決策**: 重い処理を `loader` に移動（並列実行される）

**問題**: 認証チェック後にリダイレクトループ
- **原因**: ログインページも認証チェックの対象になっている
- **解決策**: 認証レイアウトルート（`_authed`）を使用し、ログインページを外に配置

## まとめ

TanStack Start を使った SSR 実装では、以下を重視する:

✅ **型安全性**: Server Functions で end-to-end の型安全性を確保
✅ **パフォーマンス**: 並列ローダー、TanStack Query 統合、プリロード戦略
✅ **セキュリティ**: 環境変数の適切な分離、入力バリデーション、認証
✅ **開発体験**: ファイルベースルーティング、自動コード分割

詳細な実装パターンやベストプラクティスは、各参照ドキュメントを確認する。

## リファレンス

このスキルには、TanStack Start SSR 実装に関する 3 つの包括的な参照ドキュメントが含まれている:

### references/ssr-patterns.md
SSR 実装の基本パターンとコード例:
- Root Route、データプリフェッチ、並列ローディング
- TanStack Query 統合、認証とルート保護
- フォーム処理、エラーハンドリング
- プリローディング戦略（インテントベース、ビューポートベース）
- ストリーミング SSR、パフォーマンス最適化

### references/best-practices.md
セキュリティとパフォーマンスのベストプラクティス:
- 環境変数の適切な管理（サーバー/クライアント分離）
- 入力バリデーション（Zod）、セッション管理
- 認証のベストプラクティス（パスワードハッシュ、レート制限）
- データローディング戦略、TanStack Query の活用
- コード分割、エラーハンドリング、型安全性

### references/project-structure.md
推奨されるプロジェクト構造:
- ディレクトリ構成の詳細
- ファイルの役割と責務
- ルーティングパターン（認証レイアウト、動的ルート、API ルート）
- コンポーネント構成（UI、機能別、レイアウト）
- サーバー関数の整理、環境変数の管理
