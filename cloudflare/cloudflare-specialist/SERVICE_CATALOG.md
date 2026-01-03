# Cloudflare サービスカタログ - 実装ガイド

このドキュメントは、各 Cloudflare サービスの実装パターン、ユースケース、ベストプラクティスをまとめたものです。

## 目次

1. [エッジコンピューティング](#エッジコンピューティング)
2. [ストレージサービス](#ストレージサービス)
3. [ネットワーキングサービス](#ネットワーキングサービス)
4. [セキュリティサービス](#セキュリティサービス)

---

## エッジコンピューティング

### Cloudflare Workers

**ユースケース**:
- REST API のエッジ実装
- 動的コンテンツ生成
- リクエスト/レスポンスの変換
- 認証・認可ミドルウェア

**実装パターン**:

1. **基本的な Workers スクリプト**

```typescript
// src/index.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // ルーティング
    if (url.pathname === '/api/hello') {
      return new Response(
        JSON.stringify({ message: 'Hello from Workers!' }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('Not Found', { status: 404 });
  },
};
```

**wrangler.toml 設定**:

```toml
name = "my-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

# KV Namespace
[[kv_namespaces]]
binding = "MY_KV"
id = "your-kv-namespace-id"

# D1 Database
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your-database-id"

# Secrets (wrangler secret put <NAME>)
# API_TOKEN = "secret-value"
```

2. **D1 データベース統合**

```typescript
interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Prepared Statement の使用
    const stmt = env.DB.prepare('SELECT * FROM users WHERE email = ?');
    const { results } = await stmt.bind('user@example.com').all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
```

3. **KV ストレージの使用**

```typescript
interface Env {
  MY_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // キャッシュから取得
    const cached = await env.MY_KV.get('cache-key', { type: 'json' });

    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // データ生成
    const data = { timestamp: Date.now() };

    // KV に保存（TTL 60秒）
    await env.MY_KV.put('cache-key', JSON.stringify(data), {
      expirationTtl: 60,
    });

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
```

**ベストプラクティス**:
- CPU 時間を最小化（10ms/50ms 制限）
- 非同期処理を並列実行（Promise.all）
- エラーハンドリングとログ出力
- Caching API の活用

---

### Cloudflare Pages

**ユースケース**:
- 静的サイトホスティング
- JAMstack アプリケーション
- Next.js/Remix/SvelteKit 等のフレームワーク
- プレビュー環境の自動生成

**実装パターン**:

1. **Next.js アプリケーション**

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 静的エクスポート
  images: {
    unoptimized: true, // Cloudflare Images を使用する場合
  },
};

module.exports = nextConfig;
```

**Pages 設定**（cloudflare.toml）:

```toml
[build]
command = "npm run build"
cwd = "./"
watch_dir = "src"

[build.upload]
format = "directory"
dir = "out" # Next.js の出力ディレクトリ

[[build.upload.rules]]
type = "Text"
globs = ["**/*.html", "**/*.txt"]
fallthrough = false
```

2. **Pages Functions（Workers Functions）**

```typescript
// functions/api/hello.ts
export async function onRequest(context: EventContext): Promise<Response> {
  return new Response(
    JSON.stringify({ message: 'Hello from Pages Functions!' }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

**環境変数の設定**:

```bash
# Pages プロジェクトの環境変数（Cloudflare Dashboard または wrangler）
wrangler pages secret put API_TOKEN
```

**ベストプラクティス**:
- ビルド時の静的生成を最大化
- Pages Functions はエッジでの動的処理に限定
- プレビュー環境で十分にテスト
- カスタムドメインと DNS 設定を適切に

---

### Durable Objects

**ユースケース**:
- ステートフル WebSocket 接続
- リアルタイムチャット・協調編集
- セッション管理
- ゲームサーバー

**実装パターン**:

```typescript
// src/durable-object.ts
export class ChatRoom {
  state: DurableObjectState;
  sessions: Set<WebSocket>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.sessions = new Set();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      const pair = new WebSocketPair();
      this.handleSession(pair[1]);

      return new Response(null, {
        status: 101,
        webSocket: pair[0],
      });
    }

    return new Response('Not found', { status: 404 });
  }

  async handleSession(webSocket: WebSocket) {
    webSocket.accept();
    this.sessions.add(webSocket);

    webSocket.addEventListener('message', (event) => {
      // メッセージを全セッションにブロードキャスト
      this.broadcast(event.data as string);
    });

    webSocket.addEventListener('close', () => {
      this.sessions.delete(webSocket);
    });
  }

  broadcast(message: string) {
    for (const session of this.sessions) {
      session.send(message);
    }
  }
}
```

**wrangler.toml 設定**:

```toml
[[durable_objects.bindings]]
name = "CHAT_ROOM"
class_name = "ChatRoom"
script_name = "my-worker"

[[migrations]]
tag = "v1"
new_classes = ["ChatRoom"]
```

**ベストプラクティス**:
- Durable Objects はステートが必要な場合のみ使用
- alarm() を使用した定期実行
- Storage API での永続化
- WebSocket 接続数の制限を考慮

---

## ストレージサービス

### R2 Object Storage

**ユースケース**:
- 画像・動画ファイルの保存
- バックアップストレージ
- 静的アセット配信
- ログアーカイブ

**実装パターン**:

```typescript
interface Env {
  MY_BUCKET: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname.startsWith('/files/')) {
      const key = url.pathname.slice(7); // "/files/" を削除

      const object = await env.MY_BUCKET.get(key);

      if (!object) {
        return new Response('Not Found', { status: 404 });
      }

      return new Response(object.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
          'ETag': object.etag,
        },
      });
    }

    if (request.method === 'PUT' && url.pathname.startsWith('/files/')) {
      const key = url.pathname.slice(7);

      await env.MY_BUCKET.put(key, request.body, {
        httpMetadata: {
          contentType: request.headers.get('Content-Type') || 'application/octet-stream',
        },
      });

      return new Response('Uploaded', { status: 201 });
    }

    return new Response('Method Not Allowed', { status: 405 });
  },
};
```

**ベストプラクティス**:
- Public Bucket を使用してエッジキャッシュを活用
- カスタムドメインでの配信
- オブジェクトのメタデータ管理
- ライフサイクルポリシー（削除予定）

---

### D1 Database

**ユースケース**:
- リレーショナルデータの保存
- ユーザー情報管理
- トランザクション処理
- 構造化データクエリ

**実装パターン**:

```typescript
interface Env {
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // マイグレーション（初回のみ）
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // データ挿入
    const stmt = env.DB.prepare(
      'INSERT INTO users (email, name) VALUES (?, ?)'
    );
    await stmt.bind('user@example.com', 'John Doe').run();

    // クエリ実行
    const { results } = await env.DB.prepare('SELECT * FROM users').all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
```

**バッチクエリ（トランザクション）**:

```typescript
const results = await env.DB.batch([
  env.DB.prepare('INSERT INTO users (email, name) VALUES (?, ?)').bind('a@example.com', 'Alice'),
  env.DB.prepare('INSERT INTO users (email, name) VALUES (?, ?)').bind('b@example.com', 'Bob'),
  env.DB.prepare('SELECT * FROM users'),
]);
```

**ベストプラクティス**:
- Prepared Statements でSQLインジェクション対策
- バッチクエリでトランザクション実行
- インデックスの適切な設計
- クエリ結果のキャッシュ（KV/Cache API）

---

### KV Namespace

**ユースケース**:
- キャッシュストレージ
- セッションデータ
- 設定値の保存
- カウンター・ランキング

**実装パターン**:

```typescript
interface Env {
  MY_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // GET /cache/:key
    if (request.method === 'GET') {
      const key = url.pathname.slice(7); // "/cache/" を削除
      const value = await env.MY_KV.get(key);

      if (!value) {
        return new Response('Not Found', { status: 404 });
      }

      return new Response(value, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // PUT /cache/:key
    if (request.method === 'PUT') {
      const key = url.pathname.slice(7);
      const value = await request.text();

      await env.MY_KV.put(key, value, {
        expirationTtl: 3600, // 1時間で自動削除
      });

      return new Response('Stored', { status: 201 });
    }

    return new Response('Method Not Allowed', { status: 405 });
  },
};
```

**メタデータの使用**:

```typescript
// メタデータ付きで保存
await env.MY_KV.put('user:123', JSON.stringify(userData), {
  metadata: { version: 1, updatedAt: Date.now() },
});

// メタデータと一緒に取得
const { value, metadata } = await env.MY_KV.getWithMetadata('user:123', {
  type: 'json',
});
```

**ベストプラクティス**:
- 頻繁に読み取るデータのみ KV に保存
- TTL を設定してストレージコスト削減
- リストキー機能で名前空間管理
- 書き込みは最終的整合性を考慮

---

## ネットワーキングサービス

### Load Balancing

**ユースケース**:
- マルチオリジンの負荷分散
- フェイルオーバー設定
- Geo ルーティング
- ヘルスチェック

**実装パターン**（Terraform）:

```hcl
resource "cloudflare_load_balancer_pool" "primary" {
  account_id = var.account_id
  name       = "primary-pool"

  origins {
    name    = "origin-1"
    address = "origin1.example.com"
    enabled = true
  }

  origins {
    name    = "origin-2"
    address = "origin2.example.com"
    enabled = true
  }

  check_regions = ["WEU", "ENAM"]
  monitor       = cloudflare_load_balancer_monitor.http.id
}

resource "cloudflare_load_balancer_monitor" "http" {
  account_id = var.account_id
  type       = "http"
  path       = "/health"
  interval   = 60
  timeout    = 5
  retries    = 2
}

resource "cloudflare_load_balancer" "lb" {
  zone_id          = var.zone_id
  name             = "lb.example.com"
  default_pool_ids = [cloudflare_load_balancer_pool.primary.id]
  fallback_pool_id = cloudflare_load_balancer_pool.secondary.id

  session_affinity = "cookie"
}
```

**ベストプラクティス**:
- ヘルスチェックの適切な間隔設定
- セッションアフィニティの考慮
- Geo ステアリングでレイテンシ最適化
- フェイルオーバーの自動化

---

## セキュリティサービス

### WAF (Web Application Firewall)

**ユースケース**:
- SQL インジェクション対策
- XSS 攻撃防御
- OWASP Top 10 対策
- カスタムルールによる保護

**実装パターン**:

```typescript
// Workers での WAF ルール適用前の前処理
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // カスタム検証ロジック
    if (url.searchParams.has('debug') && !isAuthorized(request)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Rate Limiting
    const clientIP = request.headers.get('CF-Connecting-IP');
    const rateLimitKey = `rate-limit:${clientIP}`;
    const count = await env.MY_KV.get(rateLimitKey);

    if (count && parseInt(count) > 100) {
      return new Response('Too Many Requests', { status: 429 });
    }

    await env.MY_KV.put(rateLimitKey, String((parseInt(count || '0') + 1)), {
      expirationTtl: 60,
    });

    // オリジンへのリクエスト
    return fetch(request);
  },
};

function isAuthorized(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  return authHeader === 'Bearer secret-token';
}
```

**マネージド WAF ルール（Terraform）**:

```hcl
resource "cloudflare_ruleset" "zone_waf" {
  zone_id     = var.zone_id
  name        = "WAF Ruleset"
  description = "Managed WAF rules"
  kind        = "zone"
  phase       = "http_request_firewall_managed"

  rules {
    action = "execute"
    action_parameters {
      id = "efb7b8c949ac4650a09736fc376e9aee" # Cloudflare Managed Ruleset
    }
    expression = "true"
    enabled    = true
  }
}
```

**ベストプラクティス**:
- マネージドルールを有効化
- カスタムルールでビジネスロジック保護
- ログモードでテスト後に本番適用
- False Positive の監視と調整

---

このカタログは、各 Cloudflare サービスの実装時に参照してください。必要に応じて、公式ドキュメントで最新の仕様を確認することを推奨します。
