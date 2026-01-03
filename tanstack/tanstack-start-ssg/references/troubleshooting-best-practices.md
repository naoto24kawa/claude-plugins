# TanStack Start SSG トラブルシューティング & ベストプラクティス

このドキュメントは、TanStack Start SSG実装時のよくある問題と解決策、およびベストプラクティスをまとめたリファレンスです。

## 目次

- [よくある問題と解決策](#よくある問題と解決策)
  - [問題1: 動的ルートがプリレンダリングされない](#問題1-動的ルートがプリレンダリングされない)
  - [問題2: ビルド時間が長すぎる](#問題2-ビルド時間が長すぎる)
  - [問題3: 特定のページでエラーが発生](#問題3-特定のページでエラーが発生)
  - [問題4: 環境変数がビルド時に参照できない](#問題4-環境変数がビルド時に参照できない)
  - [問題5: localStorage/sessionStorageがプリレンダリング時にエラー](#問題5-localstoragesessionstorageがプリレンダリング時にエラー)
  - [問題6: プリレンダリングしたHTMLが表示されない](#問題6-プリレンダリングしたhtmlが表示されない)
  - [問題7: 404エラーページがプリレンダリングされない](#問題7-404エラーページがプリレンダリングされない)
- [ベストプラクティス](#ベストプラクティス)
- [CI/CD統合](#cicd統合)
- [セキュリティベストプラクティス](#セキュリティベストプラクティス)
- [テスト戦略](#テスト戦略)
- [デプロイ前チェックリスト](#デプロイ前チェックリスト)

## よくある問題と解決策

### 問題1: 動的ルートがプリレンダリングされない

**症状**:
- `/posts/$slug.tsx`のような動的ルートが`.output/public`に生成されない
- `autoStaticPathsDiscovery`を有効にしても検出されない

**原因**:
動的ルート（パラメータ付きルート）は`autoStaticPathsDiscovery`の対象外です。

**解決策1: crawlLinksを使用**

```typescript
tanstackStart({
  prerender: {
    enabled: true,
    crawlLinks: true, // これを有効化
  },
  pages: [
    // 記事一覧ページを指定（記事へのリンクを含む）
    { path: '/blog', prerender: { enabled: true } },
  ],
})
```

ファイル構造:
```
app/routes/
├── blog.tsx           // 記事一覧（各記事へのリンクあり）
└── blog.$slug.tsx     // 個別記事（crawlLinksで自動検出）
```

`blog.tsx`の実装例:
```tsx
// app/routes/blog.tsx
export default function BlogIndex() {
  const posts = [
    { slug: 'first-post', title: 'First Post' },
    { slug: 'second-post', title: 'Second Post' },
  ]

  return (
    <div>
      {posts.map(post => (
        <Link to={`/blog/${post.slug}`} key={post.slug}>
          {post.title}
        </Link>
      ))}
    </div>
  )
}
```

**解決策2: pages配列で明示的に指定**

```typescript
// ビルド時にスラッグ一覧を取得
const posts = await getPostSlugs() // ['first-post', 'second-post', ...]

tanstackStart({
  prerender: {
    enabled: true,
  },
  pages: [
    { path: '/blog', prerender: { enabled: true } },
    ...posts.map(slug => ({
      path: `/blog/${slug}`,
      prerender: { enabled: true },
    })),
  ],
})
```

### 問題2: ビルド時間が長すぎる

**症状**:
- プリレンダリングに10分以上かかる
- ビルドが途中でタイムアウトする

**原因**:
- ページ数が多すぎる
- `concurrency`が低すぎる
- 外部APIへのリクエストが多い

**解決策1: 並行数を増やす**

```typescript
prerender: {
  concurrency: 30, // デフォルト14から増やす
}
```

**マシンスペックに応じた推奨値**:
- 4コア / 8GB RAM: `10-14`
- 8コア / 16GB RAM: `20-30`
- 16コア / 32GB RAM: `30-50`

**解決策2: 不要なページを除外**

```typescript
prerender: {
  filter: ({ path }) => {
    // ページネーションの2ページ目以降を除外
    if (path.match(/\/page\/[2-9]\d*/)) return false

    // 古いアーカイブを除外
    if (path.match(/\/20(1[0-9]|2[0-2])\//)) return false

    return true
  },
}
```

**解決策3: 段階的プリレンダリング**

```typescript
// フェーズ1: 重要ページのみ
const isProduction = process.env.NODE_ENV === 'production'

prerender: {
  enabled: true,
  filter: ({ path }) => {
    // 本番ビルドでは全ページ
    if (isProduction) return true

    // 開発ビルドでは重要ページのみ
    return ['/', '/about', '/blog'].includes(path)
  },
}
```

### 問題3: 特定のページでエラーが発生

**症状**:
```
Error: Failed to prerender /problematic-page
```

**原因**:
- サーバーサイド専用コードがクライアントで実行される
- 環境変数が未定義
- 外部APIが応答しない

**解決策1: エラー詳細を確認**

```typescript
prerender: {
  failOnError: false, // 一時的に無効化
  onSuccess: ({ page }) => {
    console.log(`✓ ${page.path}`)
  },
}
```

ビルドログから問題のあるページを特定。

**解決策2: 該当ページを一時的に除外**

```typescript
prerender: {
  filter: ({ path }) => {
    if (path === '/problematic-page') {
      console.warn(`Skipping ${path} due to known issue`)
      return false
    }
    return true
  },
}
```

**解決策3: サーバーサイドコードを適切に分離**

```tsx
// ❌ 悪い例
export const Route = createFileRoute('/my-page')({
  loader: async () => {
    const data = await fs.readFile('./data.json') // fsはサーバーのみ
    return { data }
  },
})

// ✅ 良い例
import { createServerFn } from '@tanstack/react-start'

const getData = createServerFn('GET', async () => {
  const fs = await import('fs/promises')
  const data = await fs.readFile('./data.json', 'utf-8')
  return JSON.parse(data)
})

export const Route = createFileRoute('/my-page')({
  loader: async () => {
    const data = await getData()
    return { data }
  },
})
```

### 問題4: 環境変数がビルド時に参照できない

**症状**:
```
Error: process.env.API_URL is undefined
```

**原因**:
- 環境変数が`.env`ファイルに定義されていない
- `VITE_`プレフィックスがない

**解決策1: Viteの環境変数規則に従う**

```bash
# .env
VITE_API_URL=https://api.example.com
VITE_SITE_URL=https://example.com
```

```typescript
// コード内
const apiUrl = import.meta.env.VITE_API_URL
```

**解決策2: vite.config.tsでdefineを使用**

```typescript
export default defineConfig({
  plugins: [tanstackStart({ /* ... */ })],
  define: {
    'process.env.SITE_URL': JSON.stringify(
      process.env.SITE_URL || 'https://example.com'
    ),
  },
})
```

**解決策3: デフォルト値を設定**

```typescript
const apiUrl = import.meta.env.VITE_API_URL ?? 'https://api.example.com'
```

### 問題5: Cloudflare Pagesへのデプロイが失敗

**症状**:
```
Error: Cloudflare Pages deployment failed
```

**原因**:
- `target`設定が不適切
- `wrangler.toml`が未設定

**解決策: Cloudflare向け設定**

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    tanstackStart({
      target: 'cloudflare-module', // Cloudflare向けtarget
      prerender: {
        enabled: true,
        autoSubfolderIndex: true,
        crawlLinks: true,
      },
    }),
    viteReact(),
  ],
})
```

```json
// wrangler.toml
{
  "compatibility_date": "2024-11-20",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@tanstack/react-start/server-entry"
}
```

### 問題6: リンククローリングが無限ループする

**症状**:
- ビルドが終わらない
- 同じページが何度もプリレンダリングされる

**原因**:
- ページ間で相互リンクがある
- パラメータ付きURLが無限に生成される

**解決策1: filterで制限**

```typescript
prerender: {
  crawlLinks: true,
  filter: ({ path }) => {
    // 深さ制限（階層5以下のみ）
    const depth = path.split('/').filter(Boolean).length
    if (depth > 5) return false

    // パラメータ数制限
    const params = path.match(/\$/g)?.length || 0
    if (params > 2) return false

    return true
  },
}
```

**解決策2: maxRedirectsを調整**

```typescript
prerender: {
  maxRedirects: 3, // デフォルト5から減らす
}
```

### 問題7: 出力ファイルが生成されない

**症状**:
- `.output/public`が空
- HTMLファイルが生成されない

**原因**:
- `enabled: false`になっている
- filterですべて除外されている

**解決策: デバッグログで確認**

```typescript
prerender: {
  enabled: true,
  onSuccess: ({ page }) => {
    console.log(`✓ Generated: ${page.path}`)
  },
  filter: ({ path }) => {
    console.log(`Checking: ${path}`)
    return true // すべて通す
  },
}
```

ログから何が生成されたか確認。

## ベストプラクティス

### 1. 段階的導入戦略

**フェーズ1: 重要ページのみ静的化（1-2週間）**

```typescript
prerender: {
  enabled: true,
  filter: ({ path }) => ['/', '/about', '/pricing'].includes(path),
}
```

**検証項目**:
- ビルド成功率
- 初期表示速度
- SEOスコア

**フェーズ2: リンククローリング追加（2-4週間）**

```typescript
prerender: {
  enabled: true,
  crawlLinks: true,
  filter: ({ path }) => {
    // マーケティングページのみ
    if (path.startsWith('/features') || path.startsWith('/solutions')) {
      return true
    }
    return ['/', '/about', '/pricing'].includes(path)
  },
}
```

**検証項目**:
- ビルド時間
- ページカバレッジ
- リンク抽出精度

**フェーズ3: 全体最適化（継続的）**

```typescript
prerender: {
  enabled: true,
  autoStaticPathsDiscovery: true,
  crawlLinks: true,
  concurrency: 20,
  filter: ({ path }) => {
    // ユーザーダッシュボードのみ除外
    return !path.startsWith('/dashboard')
  },
}
```

### 2. エラーハンドリング戦略

**開発環境: エラー詳細を確認**

```typescript
const isDev = process.env.NODE_ENV === 'development'

prerender: {
  enabled: true,
  failOnError: !isDev, // 開発時はエラーでも続行
  retryCount: isDev ? 1 : 3,
  onSuccess: ({ page }) => {
    console.log(`✓ ${page.path}`)
  },
}
```

**本番環境: エラーで確実に失敗**

```typescript
prerender: {
  enabled: true,
  failOnError: true, // 本番ビルドで不具合を見逃さない
  retryCount: 3,
  retryDelay: 2000,
}
```

### 3. パフォーマンス最適化

**ビルド時間最適化**

```typescript
prerender: {
  enabled: true,
  concurrency: 20, // CPU性能に応じて調整
  retryCount: 1,   // 再試行回数を最小限に
  retryDelay: 500, // 待機時間を短縮
  filter: ({ path }) => {
    // 外部リンクやAPIを除外
    if (path.startsWith('/api/')) return false
    if (path.includes('http://') || path.includes('https://')) return false
    return true
  },
}
```

**メモリ使用量最適化**

```typescript
prerender: {
  enabled: true,
  concurrency: 5,     // 並行数を減らす
  crawlLinks: false,  // 必要なければ無効化
}
```

### 4. CI/CD統合

**GitHub Actions例**

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Build with SSG
        run: bun run build
        env:
          NODE_ENV: production
          VITE_API_URL: ${{ secrets.API_URL }}

      - name: Deploy to Cloudflare Pages
        run: bunx wrangler pages deploy .output/public
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 5. モニタリングと検証

**ビルドログ記録**

```typescript
import fs from 'fs'

const logFile = './build-report.json'
const pages: string[] = []

prerender: {
  enabled: true,
  onSuccess: ({ page }) => {
    pages.push(page.path)
  },
}

// ビルド後に実行
process.on('exit', () => {
  const report = {
    timestamp: new Date().toISOString(),
    totalPages: pages.length,
    pages: pages,
  }
  fs.writeFileSync(logFile, JSON.stringify(report, null, 2))
})
```

**Lighthouse CI統合**

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "staticDistDir": ".output/public",
      "url": [
        "http://localhost/index.html",
        "http://localhost/about/index.html"
      ]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

### 6. セキュリティベストプラクティス

**環境変数の適切な管理**

```bash
# .env（gitignoreに追加）
VITE_PUBLIC_API_URL=https://api.example.com
SECRET_API_KEY=xxxxx  # VITE_プレフィックスなし = ビルドに含まれない
```

```typescript
// ✅ 良い例: パブリック情報のみクライアントに公開
const apiUrl = import.meta.env.VITE_PUBLIC_API_URL

// ❌ 悪い例: シークレットをクライアントに公開
const apiKey = import.meta.env.VITE_SECRET_API_KEY // 危険！
```

**Server Functionでシークレットを使用**

```typescript
import { createServerFn } from '@tanstack/react-start'

const fetchData = createServerFn('GET', async () => {
  // サーバー側のみで実行
  const apiKey = process.env.SECRET_API_KEY
  const response = await fetch('https://api.example.com', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  })
  return response.json()
})
```

### 7. テスト戦略

**ビルド成功テスト**

```bash
#!/bin/bash
# scripts/test-build.sh

bun run build

if [ -d ".output/public" ]; then
  echo "✓ Build successful"

  # 重要なファイルが存在するか確認
  if [ -f ".output/public/index.html" ]; then
    echo "✓ index.html generated"
  else
    echo "✗ index.html missing"
    exit 1
  fi
else
  echo "✗ Build failed"
  exit 1
fi
```

**プリレンダリング検証テスト**

```typescript
// scripts/verify-prerender.ts
import fs from 'fs'
import path from 'path'

const outputDir = '.output/public'
const requiredPages = ['index.html', 'about/index.html', 'blog/index.html']

let failed = false

for (const page of requiredPages) {
  const filePath = path.join(outputDir, page)
  if (!fs.existsSync(filePath)) {
    console.error(`✗ Missing: ${page}`)
    failed = true
  } else {
    console.log(`✓ Found: ${page}`)
  }
}

if (failed) {
  process.exit(1)
}
```

## チェックリスト

プロダクション環境にデプロイする前の最終確認：

### 設定確認
- [ ] `prerender.enabled: true`
- [ ] 適切な`concurrency`値
- [ ] `failOnError: true`（本番ビルド）
- [ ] 環境変数が適切に設定されている
- [ ] シークレットが`VITE_`プレフィックスなし

### ビルド確認
- [ ] ビルドが成功する
- [ ] `.output/public`にHTMLファイルが生成される
- [ ] 重要ページがすべて生成される
- [ ] ビルド時間が許容範囲内（< 10分推奨）

### 動作確認
- [ ] ローカルで`bun run preview`で動作確認
- [ ] Lighthouse スコア 90以上（Performance/SEO）
- [ ] リンクが正しく機能する
- [ ] 画像やアセットが正しく表示される

### デプロイ確認
- [ ] デプロイ先プラットフォームの設定が正しい
- [ ] 環境変数がデプロイ先で設定されている
- [ ] カスタムドメインが正しく設定されている
- [ ] HTTPSが有効

## まとめ

これらのトラブルシューティング手法とベストプラクティスを活用することで、TanStack Start SSGを安定的に運用できます。問題が発生した際は、このドキュメントを参照し、段階的にデバッグを進めてください。
