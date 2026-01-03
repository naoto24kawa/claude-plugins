# TanStack Start SSG Implementation Patterns

このドキュメントは、TanStack StartでSSG（静的サイト生成）を実装する際の具体的なパターンとベストプラクティスをまとめたリファレンスです。

## 目次

- [パターン1: 全ページ自動検出 + リンククローリング](#パターン1-全ページ自動検出--リンククローリング)
- [パターン2: SPAモード + 選択的プリレンダリング](#パターン2-spaモード--選択的プリレンダリング)
- [パターン3: ページ個別指定 + 詳細制御](#パターン3-ページ個別指定--詳細制御)
- [パターン4: ブログサイト最適化](#パターン4-ブログサイト最適化)
- [パターン5: マルチ言語サイト(i18n)](#パターン5-マルチ言語サイトi18n)
- [パターン6: 段階的導入(フェーズ別)](#パターン6-段階的導入フェーズ別)
- [パフォーマンス最適化パターン](#パフォーマンス最適化パターン)
- [デプロイ先別の設定](#デプロイ先別の設定)
- [トラブルシューティングパターン](#トラブルシューティングパターン)
- [まとめ](#まとめ)

## パターン1: 全ページ自動検出 + リンククローリング

### 概要
最もシンプルな設定。静的ルートを自動検出し、リンクを辿って動的ルートも自動的にプリレンダリングします。

### 適用シーン
- ブログサイト
- ドキュメントサイト
- 小規模なマーケティングサイト
- ページ数が100ページ以下のサイト

### vite.config.ts実装例

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: true,
        crawlLinks: true,
      },
    }),
    viteReact(),
  ],
})
```

### メリット
- 設定が最小限
- 新規ページを追加しても自動検出される
- メンテナンスコストが低い

### デメリット
- 全ページがプリレンダリングされるため、ビルド時間が長くなる可能性
- 動的なページ（ユーザーダッシュボード等）も静的化される恐れ

## パターン2: SPAモード + 選択的プリレンダリング

### 概要
SPAとSSGのハイブリッドアプローチ。重要なページのみ静的化し、その他はSPAとして動作します。

### 適用シーン
- SEO重視のランディングページと動的な管理画面が混在するサイト
- 認証が必要なページを含むアプリケーション
- パフォーマンス最適化が必要な特定ページのみ静的化したい場合

### vite.config.ts実装例

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart({
      spa: {
        enabled: true,
        prerender: {
          enabled: true,
          crawlLinks: true,
        },
      },
      prerender: {
        filter: ({ path }) => {
          // 重要なページのみプリレンダリング
          if (['/en', '/zh', '/', '/about', '/pricing'].includes(path)) {
            return true
          }
          // ドキュメントページをプリレンダリング
          if (path.includes('/docs') && !path.includes('/#')) {
            return true
          }
          // ダッシュボードや管理画面は除外
          if (path.startsWith('/dashboard') || path.startsWith('/admin')) {
            return false
          }
          return false
        },
      },
    }),
    viteReact(),
  ],
})
```

### メリット
- SEO最適化とインタラクティブ性の両立
- ビルド時間の短縮
- 認証が必要なページを適切に処理

### デメリット
- filterロジックのメンテナンスが必要
- どのページを静的化するか判断が必要

## パターン3: ページ個別指定 + 詳細制御

### 概要
各ページを明示的に指定し、細かい制御を行います。

### 適用シーン
- 中規模サイト（100-500ページ）
- 各ページで異なる出力設定が必要な場合
- 国際化（i18n）対応サイト

### vite.config.ts実装例

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        autoSubfolderIndex: true,
        crawlLinks: true,
        concurrency: 10,
      },
      pages: [
        // トップページ
        {
          path: '/',
          prerender: {
            enabled: true,
            outputPath: '/index.html',
          }
        },
        // 言語別トップページ
        {
          path: '/en',
          prerender: {
            enabled: true,
            outputPath: '/en/index.html',
          }
        },
        {
          path: '/zh',
          prerender: {
            enabled: true,
            outputPath: '/zh/index.html',
          }
        },
        // ドキュメントエントリーポイント
        {
          path: '/docs',
          prerender: { enabled: true }
        },
        // APIエンドポイント（検索機能用）
        {
          path: '/api/search',
          prerender: { enabled: true }
        },
      ],
    }),
    viteReact(),
  ],
})
```

### メリット
- 細かい制御が可能
- 出力パスを明示的に指定できる
- 国際化対応が容易

### デメリット
- 新規ページ追加時に設定更新が必要
- 設定ファイルが長くなりがち

## パターン4: ブログサイト最適化

### 概要
ブログや記事サイトに特化した設定。記事一覧ページをエントリーポイントにして、crawlLinksで個別記事を自動検出します。

### 適用シーン
- ブログサイト
- ニュースサイト
- ポートフォリオサイト

### vite.config.ts実装例

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        autoSubfolderIndex: true,
        crawlLinks: true,
        concurrency: 10,
        onSuccess: ({ page }) => {
          console.log(`✓ ${page.path}`)
        },
      },
      pages: [
        { path: '/', prerender: { enabled: true } },
        { path: '/blog', prerender: { enabled: true } },
        { path: '/about', prerender: { enabled: true } },
        { path: '/contact', prerender: { enabled: true } },
        // 個別記事は /blog からのリンクで自動検出される
      ],
    }),
    viteReact(),
  ],
})
```

### ファイル構造例

```
app/routes/
├── __root.tsx
├── index.tsx           # トップページ
├── about.tsx          # About ページ
├── contact.tsx        # Contact ページ
├── blog.tsx           # ブログ一覧ページ（記事へのリンクあり）
└── blog.$slug.tsx     # 個別記事ページ（crawlLinksで自動検出）
```

### メリット
- 記事を追加しても設定変更不要
- ブログ一覧がインデックスとして機能
- SEOに最適

### デメリット
- 記事が多い場合、ビルド時間が長くなる

## パターン5: マルチ言語サイト（i18n）

### 概要
複数言語に対応したサイトで、各言語バージョンを静的生成します。

### 適用シーン
- グローバル展開するプロダクト
- ドキュメントサイトの多言語対応
- 国際的なマーケティングサイト

### vite.config.ts実装例

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

const supportedLocales = ['en', 'ja', 'zh', 'es', 'fr']

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        autoSubfolderIndex: true,
        crawlLinks: true,
        filter: ({ path }) => {
          // 各言語のルートを含める
          for (const locale of supportedLocales) {
            if (path === `/${locale}` || path.startsWith(`/${locale}/`)) {
              return true
            }
          }
          // デフォルト言語（英語）
          if (path === '/' || (!path.includes('/en/') && !supportedLocales.some(l => path.startsWith(`/${l}/`)))) {
            return true
          }
          return false
        },
      },
      pages: supportedLocales.map(locale => ({
        path: `/${locale}`,
        prerender: { enabled: true },
      })),
    }),
    viteReact(),
  ],
})
```

### メリット
- 全言語版を静的配信
- SEOに最適
- 高速な初期表示

### デメリット
- ビルド時間が言語数に比例
- ビルド成果物のサイズが増加

## パターン6: 段階的導入（フェーズ別）

### 概要
既存のSSRサイトに段階的にSSGを導入していくアプローチ。

### フェーズ1: 重要ページのみ静的化

```typescript
tanstackStart({
  prerender: {
    enabled: true,
    filter: ({ path }) => ['/', '/about', '/pricing'].includes(path),
  },
})
```

### フェーズ2: リンククローリング追加

```typescript
tanstackStart({
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
  },
})
```

### フェーズ3: 全体最適化

```typescript
tanstackStart({
  prerender: {
    enabled: true,
    autoStaticPathsDiscovery: true,
    crawlLinks: true,
    concurrency: 20,
    filter: ({ path }) => {
      // ユーザーダッシュボードのみ除外
      return !path.startsWith('/dashboard')
    },
  },
})
```

## パフォーマンス最適化パターン

### 高速ビルド設定

```typescript
tanstackStart({
  prerender: {
    enabled: true,
    concurrency: 20, // CPU性能に応じて調整
    crawlLinks: true,
    retryCount: 1,   // 再試行回数を減らす
    retryDelay: 500, // 再試行間隔を短縮
    filter: ({ path }) => {
      // 外部リンクやAPIエンドポイントを除外
      if (path.startsWith('/api/')) return false
      if (path.includes('http://') || path.includes('https://')) return false
      // 大量の動的ページを除外
      if (path.match(/\/page\/\d+/)) return false
      return true
    },
  },
})
```

### メモリ効率化設定

```typescript
tanstackStart({
  prerender: {
    enabled: true,
    concurrency: 5, // 並行数を減らす
    crawlLinks: false, // リンククローリングを無効化
    autoStaticPathsDiscovery: true,
  },
  pages: [
    // 必要なページのみ明示的に指定
  ],
})
```

## デプロイ先別の設定

### Cloudflare Pages

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart({
      target: 'cloudflare-module',
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

### Netlify

```typescript
import { defineConfig } from 'vite'
import { netlify } from '@netlify/vite-plugin-tanstack-start'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    netlify(),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
    }),
    viteReact(),
  ],
})
```

### Vercel（Nitro経由）

```typescript
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
    }),
    nitro(),
    viteReact(),
  ],
})
```

## トラブルシューティングパターン

### 問題: 動的ルートがプリレンダリングされない

**解決策**: `crawlLinks`を有効にし、動的ルートへのリンクを含む静的ページを指定する

```typescript
tanstackStart({
  prerender: {
    enabled: true,
    crawlLinks: true,
  },
  pages: [
    { path: '/blog', prerender: { enabled: true } }, // 記事一覧ページ
    // /blog/$slug は自動検出される
  ],
})
```

### 問題: ビルド時間が長すぎる

**解決策1**: 並行数を増やす

```typescript
prerender: {
  concurrency: 30, // デフォルト14から増やす
}
```

**解決策2**: 不要なページを除外

```typescript
prerender: {
  filter: ({ path }) => {
    // ページネーションの2ページ目以降を除外
    if (path.match(/\/page\/[2-9]\d*/)) return false
    return true
  },
}
```

### 問題: 特定のページでエラーが発生

**解決策**: エラー詳細を確認し、該当ページを一時的に除外

```typescript
prerender: {
  enabled: true,
  failOnError: false, // エラーでもビルド続行
  onSuccess: ({ page }) => {
    console.log(`✓ ${page.path}`)
  },
  filter: ({ path }) => {
    // 問題のあるページを除外
    if (path === '/problematic-page') return false
    return true
  },
}
```

### 問題: 環境変数がビルド時に参照できない

**解決策**: ビルド時に環境変数を適切に設定

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
      },
    }),
  ],
  define: {
    'process.env.SITE_URL': JSON.stringify(process.env.SITE_URL || 'https://example.com'),
  },
})
```

## まとめ

これらのパターンは、プロジェクトの規模、要件、デプロイ先に応じて選択・組み合わせることができます。最適なパターンを選択し、段階的に導入していくことを推奨します。
