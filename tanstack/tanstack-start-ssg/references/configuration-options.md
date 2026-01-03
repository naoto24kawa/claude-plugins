# TanStack Start SSG 設定オプション完全リファレンス

このドキュメントは、TanStack StartのSSG機能で使用できる全設定オプションの詳細なリファレンスです。

## 目次

- [prerender オブジェクト](#prerender-オブジェクト)
  - [enabled](#enabled)
  - [autoSubfolderIndex](#autosubfolderindex)
  - [autoStaticPathsDiscovery](#autostaticpathsdiscovery)
  - [crawlLinks](#crawllinks)
  - [concurrency](#concurrency)
  - [filter](#filter)
  - [retryCount](#retrycount)
  - [retryDelay](#retrydelay)
  - [maxRedirects](#maxredirects)
  - [failOnError](#failonerror)
  - [onSuccess](#onsuccess)
- [pages 配列](#pages-配列)
- [spa オブジェクト](#spa-オブジェクト)
- [sitemap オブジェクト](#sitemap-オブジェクト)
- [完全な設定例](#完全な設定例)
- [デバッグのヒント](#デバッグのヒント)
- [まとめ](#まとめ)

## prerender オブジェクト

### enabled

- **型**: `boolean`
- **デフォルト**: `false`
- **説明**: 静的プリレンダリング機能を有効化します。

```typescript
prerender: {
  enabled: true,
}
```

### autoSubfolderIndex

- **型**: `boolean`
- **デフォルト**: `false`
- **説明**: `/page.html`ではなく`/page/index.html`形式で出力します。
- **使用例**:
  - `false`: `/about.html`
  - `true`: `/about/index.html`

```typescript
prerender: {
  autoSubfolderIndex: true,
}
```

**いつ使うか**:
- サーバーが`/about/`形式のURLを期待する場合
- ディレクトリ構造を維持したい場合
- Apache/Nginxの設定に合わせる場合

### autoStaticPathsDiscovery

- **型**: `boolean`
- **デフォルト**: `true`
- **説明**: 静的ルートを自動検出します。

**自動検出対象**:
- `/index.tsx` → `/`
- `/about.tsx` → `/about`
- `/contact.tsx` → `/contact`

**自動検出対象外**:
- 動的ルート: `/posts/$id.tsx`
- レイアウトルート: `/_layout.tsx`
- APIルート: コンポーネントがないルート

```typescript
prerender: {
  autoStaticPathsDiscovery: true,
}
```

### crawlLinks

- **型**: `boolean`
- **デフォルト**: `true`
- **説明**: プリレンダリング済みページのHTMLからリンクを抽出し、それらのページもプリレンダリングします。

```typescript
prerender: {
  crawlLinks: true,
}
```

**動作例**:
1. `/` をプリレンダリング
2. HTML内から `/about`, `/blog` へのリンクを検出
3. `/about`, `/blog` をプリレンダリング
4. それらのHTML内からさらにリンクを検出
5. 繰り返し

**メリット**:
- 動的ルート（`/posts/$slug`）も検出可能
- 新規ページ追加時に設定変更不要

**注意点**:
- 外部リンクは除外される
- 無限ループに注意（適切な`filter`で制御）

### concurrency

- **型**: `number`
- **デフォルト**: `14`
- **説明**: 同時に実行するプリレンダリングジョブの数。

```typescript
prerender: {
  concurrency: 20,
}
```

**推奨値**:
- 低スペックマシン: `5-10`
- 標準マシン: `14-20`
- 高スペックマシン: `20-30`

**注意**: 高すぎるとメモリ不足やタイムアウトが発生する可能性があります。

### filter

- **型**: `(context: { path: string }) => boolean`
- **デフォルト**: すべてのパスを許可
- **説明**: プリレンダリング対象をフィルタリングします。

```typescript
prerender: {
  filter: ({ path }) => {
    // APIエンドポイントを除外
    if (path.startsWith('/api/')) return false

    // ユーザーダッシュボードを除外
    if (path.startsWith('/dashboard')) return false

    // ドキュメントページのみ含める
    if (path.includes('/docs')) return true

    // デフォルトで含める
    return true
  },
}
```

**よくあるパターン**:

```typescript
// パターン1: ホワイトリスト方式
filter: ({ path }) => {
  const allowedPaths = ['/', '/about', '/pricing']
  const allowedPrefixes = ['/blog/', '/docs/']

  return allowedPaths.includes(path) ||
         allowedPrefixes.some(prefix => path.startsWith(prefix))
}

// パターン2: ブラックリスト方式
filter: ({ path }) => {
  const excludedPrefixes = ['/admin/', '/api/', '/dashboard/']
  return !excludedPrefixes.some(prefix => path.startsWith(prefix))
}

// パターン3: 正規表現パターン
filter: ({ path }) => {
  // ページネーション2ページ目以降を除外
  if (path.match(/\/page\/[2-9]\d*/)) return false
  // 日付形式のアーカイブを除外
  if (path.match(/\/\d{4}\/\d{2}\//)) return false
  return true
}
```

### retryCount

- **型**: `number`
- **デフォルト**: `2`
- **説明**: プリレンダリング失敗時の再試行回数。

```typescript
prerender: {
  retryCount: 3,
}
```

**推奨値**:
- 安定環境: `1-2`
- 不安定なネットワーク: `3-5`
- 外部API依存: `5-10`

### retryDelay

- **型**: `number` (ミリ秒)
- **デフォルト**: `1000`
- **説明**: 再試行間の待機時間。

```typescript
prerender: {
  retryDelay: 2000, // 2秒
}
```

**推奨値**:
- 通常: `1000-2000ms`
- レート制限対策: `3000-5000ms`
- 外部API依存: `5000-10000ms`

### maxRedirects

- **型**: `number`
- **デフォルト**: `5`
- **説明**: プリレンダリング中に許可する最大リダイレクト数。

```typescript
prerender: {
  maxRedirects: 10,
}
```

**使用例**:
- 言語リダイレクト: `/` → `/en`
- 認証リダイレクト: `/admin` → `/login`

### failOnError

- **型**: `boolean`
- **デフォルト**: `true`
- **説明**: プリレンダリングエラー発生時にビルドを失敗させるか。

```typescript
prerender: {
  failOnError: false, // エラーでもビルド続行
}
```

**推奨設定**:
- **開発環境**: `false` （エラーを確認しながら開発）
- **本番環境**: `true` （エラーを見逃さない）

### onSuccess

- **型**: `(context: { page: { path: string } }) => void`
- **デフォルト**: なし
- **説明**: ページのプリレンダリング成功時に呼ばれるコールバック。

```typescript
prerender: {
  onSuccess: ({ page }) => {
    console.log(`✓ ${page.path}`)
  },
}
```

**活用例**:

```typescript
// パターン1: ログ出力
onSuccess: ({ page }) => {
  console.log(`✓ ${page.path}`)
}

// パターン2: カウント
let count = 0
prerender: {
  onSuccess: ({ page }) => {
    count++
    console.log(`[${count}] ${page.path}`)
  },
}

// パターン3: ファイル書き込み（ビルドログ）
import fs from 'fs'
const logFile = './build-log.txt'
prerender: {
  onSuccess: ({ page }) => {
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${page.path}\n`)
  },
}
```

## pages 配列

個別ページごとに詳細な設定を行います。

### 基本構造

```typescript
pages: [
  {
    path: '/my-page',
    prerender: {
      enabled: true,
      outputPath: '/my-page/index.html',
    },
  },
]
```

### path

- **型**: `string`
- **必須**: はい
- **説明**: プリレンダリング対象のページパス。

```typescript
pages: [
  { path: '/', prerender: { enabled: true } },
  { path: '/about', prerender: { enabled: true } },
  { path: '/blog', prerender: { enabled: true } },
]
```

### prerender.enabled

- **型**: `boolean`
- **デフォルト**: グローバル設定に従う
- **説明**: このページのプリレンダリングを有効化。

```typescript
pages: [
  { path: '/static-page', prerender: { enabled: true } },
  { path: '/dynamic-page', prerender: { enabled: false } },
]
```

### prerender.outputPath

- **型**: `string`
- **オプション**: はい
- **説明**: 出力先のカスタムパス。

```typescript
pages: [
  {
    path: '/',
    prerender: {
      enabled: true,
      outputPath: '/index.html',
    },
  },
  {
    path: '/ja',
    prerender: {
      enabled: true,
      outputPath: '/ja/index.html',
    },
  },
]
```

## spa オブジェクト

SPAモードとSSGを組み合わせる設定。

### spa.enabled

- **型**: `boolean`
- **デフォルト**: `false`
- **説明**: SPAモードを有効化。

```typescript
spa: {
  enabled: true,
}
```

### spa.prerender

- **型**: `object`
- **説明**: SPAモード内でのプリレンダリング設定。

```typescript
spa: {
  enabled: true,
  prerender: {
    enabled: true,
    crawlLinks: true,
  },
}
```

**動作**:
- プリレンダリング済みページ → 静的HTML配信
- 未プリレンダリングページ → SPAシェルで動的レンダリング

## sitemap オブジェクト

サイトマップ自動生成機能。

### sitemap.enabled

- **型**: `boolean`
- **デフォルト**: `false`
- **説明**: サイトマップ生成を有効化。

```typescript
sitemap: {
  enabled: true,
  host: 'https://example.com',
}
```

### sitemap.host

- **型**: `string`
- **必須**: はい（sitemapが有効な場合）
- **説明**: サイトのベースURL。

```typescript
sitemap: {
  enabled: true,
  host: process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'https://example.com',
}
```

## 完全な設定例

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart({
      // グローバルプリレンダリング設定
      prerender: {
        enabled: true,
        autoSubfolderIndex: true,
        autoStaticPathsDiscovery: true,
        concurrency: 14,
        crawlLinks: true,
        retryCount: 2,
        retryDelay: 1000,
        maxRedirects: 5,
        failOnError: true,
        filter: ({ path }) => {
          // APIエンドポイントを除外
          if (path.startsWith('/api/')) return false
          // ダッシュボードを除外
          if (path.startsWith('/dashboard')) return false
          return true
        },
        onSuccess: ({ page }) => {
          console.log(`✓ ${page.path}`)
        },
      },

      // 個別ページ設定
      pages: [
        {
          path: '/',
          prerender: {
            enabled: true,
            outputPath: '/index.html',
          }
        },
        {
          path: '/en',
          prerender: {
            enabled: true,
            outputPath: '/en/index.html',
          }
        },
      ],

      // SPAモード設定
      spa: {
        enabled: true,
        prerender: {
          enabled: true,
          crawlLinks: true,
        },
      },

      // サイトマップ設定
      sitemap: {
        enabled: true,
        host: 'https://example.com',
      },
    }),
    viteReact(),
  ],
})
```

## デバッグのヒント

### ビルドログの詳細出力

```typescript
prerender: {
  enabled: true,
  onSuccess: ({ page }) => {
    console.log(`[${new Date().toISOString()}] ✓ ${page.path}`)
  },
}
```

### エラー時の詳細確認

```bash
# ビルド時に詳細ログを出力
DEBUG=* bun run build
```

### プリレンダリング対象の確認

```typescript
prerender: {
  enabled: true,
  onSuccess: ({ page }) => {
    // ファイルに記録
    fs.appendFileSync('./prerendered-pages.txt', `${page.path}\n`)
  },
}
```

## まとめ

これらの設定オプションを組み合わせることで、プロジェクトの要件に最適なSSG実装を構築できます。段階的に導入し、パフォーマンスとメンテナンス性のバランスを取りながら最適化していくことを推奨します。
