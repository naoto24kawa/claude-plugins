# Cloudflare 実装例集

このドキュメントでは、よくある Cloudflare の実装パターンを完全な例として提供します。

## 目次

1. [REST API（Workers + D1）](#rest-api-workers--d1)
2. [画像最適化サービス（Workers + R2）](#画像最適化サービスworkers--r2)
3. [リアルタイムチャット（Durable Objects）](#リアルタイムチャットdurable-objects)
4. [静的サイト + API（Pages + Functions）](#静的サイト--apipages--functions)

---

## REST API（Workers + D1）

ユーザー管理 REST API の実装例です。

### アーキテクチャ

```
Client → Cloudflare Workers → D1 Database
```

### ファイル構成

```
my-api/
├── src/
│   ├── index.ts
│   ├── router.ts
│   └── handlers/
│       └── users.ts
├── migrations/
│   └── 0001_create_users.sql
├── wrangler.toml
├── package.json
└── tsconfig.json
```

### 実装

**wrangler.toml**:

```toml
name = "user-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "users-db"
database_id = "your-database-id"
```

**migrations/0001_create_users.sql**:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**src/index.ts**:

```typescript
import { Router } from './router';
import { handleUsers } from './handlers/users';

export interface Env {
  DB: D1Database;
}

const router = new Router();

// ルート定義
router.get('/api/users', handleUsers.list);
router.get('/api/users/:id', handleUsers.get);
router.post('/api/users', handleUsers.create);
router.put('/api/users/:id', handleUsers.update);
router.delete('/api/users/:id', handleUsers.delete);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await router.handle(request, env);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
```

**src/router.ts**:

```typescript
import { Env } from './index';

type Handler = (request: Request, env: Env, params: Record<string, string>) => Promise<Response>;

export class Router {
  private routes: Map<string, Map<string, Handler>> = new Map();

  get(path: string, handler: Handler) {
    this.addRoute('GET', path, handler);
  }

  post(path: string, handler: Handler) {
    this.addRoute('POST', path, handler);
  }

  put(path: string, handler: Handler) {
    this.addRoute('PUT', path, handler);
  }

  delete(path: string, handler: Handler) {
    this.addRoute('DELETE', path, handler);
  }

  private addRoute(method: string, path: string, handler: Handler) {
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }
    this.routes.get(method)!.set(path, handler);
  }

  async handle(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;
    const routes = this.routes.get(method);

    if (!routes) {
      return new Response('Method Not Allowed', { status: 405 });
    }

    for (const [pattern, handler] of routes) {
      const match = this.matchRoute(pattern, url.pathname);
      if (match) {
        return handler(request, env, match.params);
      }
    }

    return new Response('Not Found', { status: 404 });
  }

  private matchRoute(pattern: string, path: string): { params: Record<string, string> } | null {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return { params };
  }
}
```

**src/handlers/users.ts**:

```typescript
import { Env } from '../index';

export const handleUsers = {
  async list(request: Request, env: Env): Promise<Response> {
    const { results } = await env.DB.prepare('SELECT * FROM users').all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async get(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
    const { id } = params;
    const { results } = await env.DB.prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .all();

    if (!results || results.length === 0) {
      return new Response('Not Found', { status: 404 });
    }

    return new Response(JSON.stringify(results[0]), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async create(request: Request, env: Env): Promise<Response> {
    const body = await request.json() as { email: string; name: string };

    const result = await env.DB.prepare(
      'INSERT INTO users (email, name) VALUES (?, ?)'
    )
      .bind(body.email, body.name)
      .run();

    return new Response(
      JSON.stringify({ id: result.meta.last_row_id, ...body }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },

  async update(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
    const { id } = params;
    const body = await request.json() as { email?: string; name?: string };

    await env.DB.prepare(
      'UPDATE users SET email = COALESCE(?, email), name = COALESCE(?, name) WHERE id = ?'
    )
      .bind(body.email, body.name, id)
      .run();

    return new Response(JSON.stringify({ id, ...body }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async delete(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
    const { id } = params;

    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

    return new Response('', { status: 204 });
  },
};
```

### デプロイ

```bash
# D1 データベース作成
wrangler d1 create users-db

# マイグレーション実行
wrangler d1 migrations apply users-db

# デプロイ
wrangler deploy
```

---

## 画像最適化サービス（Workers + R2）

画像アップロード、リサイズ、配信を行うサービスの実装例です。

### アーキテクチャ

```
Client → Cloudflare Workers → R2 Bucket
         ↓ (resize)
         Image Resizing API
```

### 実装

**wrangler.toml**:

```toml
name = "image-service"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "my-images"
```

**src/index.ts**:

```typescript
export interface Env {
  IMAGES: R2Bucket;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 画像アップロード: POST /upload
    if (request.method === 'POST' && url.pathname === '/upload') {
      return handleUpload(request, env);
    }

    // 画像取得: GET /images/:filename?width=300&height=200
    if (request.method === 'GET' && url.pathname.startsWith('/images/')) {
      return handleGetImage(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function handleUpload(request: Request, env: Env): Promise<Response> {
  const formData = await request.formData();
  const file = formData.get('image') as File;

  if (!file) {
    return new Response('No file uploaded', { status: 400 });
  }

  // ファイル名を生成（UUID + 拡張子）
  const ext = file.name.split('.').pop();
  const filename = `${crypto.randomUUID()}.${ext}`;

  // R2 にアップロード
  await env.IMAGES.put(filename, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  });

  return new Response(
    JSON.stringify({ url: `/images/${filename}` }),
    {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

async function handleGetImage(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const filename = url.pathname.slice(8); // "/images/" を削除

  const object = await env.IMAGES.get(filename);

  if (!object) {
    return new Response('Not Found', { status: 404 });
  }

  // リサイズパラメータ
  const width = url.searchParams.get('width');
  const height = url.searchParams.get('height');

  let response = new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': object.etag,
    },
  });

  // Cloudflare Image Resizing を使用
  if (width || height) {
    const options = {
      cf: {
        image: {
          width: width ? parseInt(width) : undefined,
          height: height ? parseInt(height) : undefined,
          fit: 'cover',
        },
      },
    };

    response = await fetch(request.url, options);
  }

  return response;
}
```

### デプロイ

```bash
# R2 バケット作成
wrangler r2 bucket create my-images

# デプロイ
wrangler deploy
```

---

## リアルタイムチャット（Durable Objects）

WebSocket を使用したリアルタイムチャットの実装例です。

### アーキテクチャ

```
Client (WebSocket) → Workers → Durable Objects
                              ↓
                        Persistent State
```

### 実装

**wrangler.toml**:

```toml
name = "chat-app"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[durable_objects.bindings]]
name = "CHAT_ROOM"
class_name = "ChatRoom"
script_name = "chat-app"

[[migrations]]
tag = "v1"
new_classes = ["ChatRoom"]
```

**src/index.ts**:

```typescript
export { ChatRoom } from './durable-objects/chat-room';

export interface Env {
  CHAT_ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket 接続: GET /room/:roomId
    if (url.pathname.startsWith('/room/')) {
      const roomId = url.pathname.slice(6);

      // Durable Object ID を生成
      const id = env.CHAT_ROOM.idFromName(roomId);
      const stub = env.CHAT_ROOM.get(id);

      return stub.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
```

**src/durable-objects/chat-room.ts**:

```typescript
interface Session {
  webSocket: WebSocket;
  userId: string;
  username: string;
}

export class ChatRoom {
  state: DurableObjectState;
  sessions: Set<Session>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Set();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/websocket') {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleSession(server, request);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    // HTTP API: GET /history
    if (url.pathname === '/history') {
      const history = await this.state.storage.get<string[]>('history') || [];
      return new Response(JSON.stringify(history), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  }

  async handleSession(webSocket: WebSocket, request: Request) {
    webSocket.accept();

    const userId = crypto.randomUUID();
    const username = new URL(request.url).searchParams.get('username') || 'Anonymous';

    const session: Session = { webSocket, userId, username };
    this.sessions.add(session);

    // 入室メッセージ
    this.broadcast({
      type: 'join',
      userId,
      username,
      timestamp: Date.now(),
    });

    webSocket.addEventListener('message', async (event) => {
      const data = JSON.parse(event.data as string);

      const message = {
        type: 'message',
        userId,
        username,
        content: data.content,
        timestamp: Date.now(),
      };

      // メッセージをブロードキャスト
      this.broadcast(message);

      // メッセージ履歴を保存
      await this.saveMessage(message);
    });

    webSocket.addEventListener('close', () => {
      this.sessions.delete(session);

      // 退室メッセージ
      this.broadcast({
        type: 'leave',
        userId,
        username,
        timestamp: Date.now(),
      });
    });
  }

  broadcast(message: any) {
    const json = JSON.stringify(message);

    for (const session of this.sessions) {
      try {
        session.webSocket.send(json);
      } catch (error) {
        // エラーハンドリング
        this.sessions.delete(session);
      }
    }
  }

  async saveMessage(message: any) {
    const history = await this.state.storage.get<any[]>('history') || [];
    history.push(message);

    // 最新100件のみ保持
    if (history.length > 100) {
      history.shift();
    }

    await this.state.storage.put('history', history);
  }
}
```

---

## 静的サイト + API（Pages + Functions）

Next.js アプリケーションを Pages にデプロイし、Functions で API を提供する例です。

### アーキテクチャ

```
Client → Cloudflare Pages (静的コンテンツ)
         ↓
         Pages Functions (API エンドポイント)
         ↓
         D1 Database
```

### ファイル構成

```
my-app/
├── app/
│   ├── page.tsx
│   └── api/
│       └── users/
│           └── route.ts
├── functions/
│   └── api/
│       └── [[path]].ts
├── next.config.js
└── package.json
```

### 実装

**next.config.js**:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
};

module.exports = nextConfig;
```

**functions/api/[[path]].ts** (Pages Functions):

```typescript
interface Env {
  DB: D1Database;
}

export async function onRequest(context: EventContext<Env, any, any>): Promise<Response> {
  const { request, env } = context;
  const url = new URL(request.url);

  // GET /api/users
  if (request.method === 'GET' && url.pathname === '/api/users') {
    const { results } = await env.DB.prepare('SELECT * FROM users').all();

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Not Found', { status: 404 });
}
```

### デプロイ

```bash
# ビルド
npm run build

# Pages プロジェクト作成とデプロイ
wrangler pages deploy out --project-name my-app

# D1 バインディング設定（wrangler または Dashboard）
wrangler pages deployment create --project-name my-app --branch main --binding DB=<database-id>
```

---

これらの例を参考に、Cloudflare サービスを活用したアプリケーションを構築してください。
