# Cloudflare MCP ツール使用ガイド

このドキュメントは、`cloudflare:mcp-server-cloudflare` の各ツールの具体的な使用方法を示します。

## 利用可能なツール

1. **ゾーン設定取得**: ゾーンの全般的な設定情報
2. **DNS レコード取得**: DNS レコード一覧
3. **Workers 設定確認**: Workers のルートと設定
4. **Analytics データ取得**: トラフィックとパフォーマンスデータ
5. **ファイアウォールルール確認**: セキュリティルールの取得

## 1. ゾーン設定取得

### 使用例

**目的**: ゾーンの SSL/TLS 設定を確認

```
ツール: cloudflare:mcp-server-cloudflare:get-zone-settings
パラメータ:
{
  "zone_id": "your-zone-id",
  "settings": ["ssl", "tls_1_3", "always_use_https", "min_tls_version"]
}
```

**レスポンス例**:
```json
{
  "result": [
    {
      "id": "ssl",
      "value": "full",
      "editable": true,
      "modified_on": "2025-01-31T00:00:00Z"
    },
    {
      "id": "tls_1_3",
      "value": "on",
      "editable": true,
      "modified_on": "2025-01-31T00:00:00Z"
    }
  ]
}
```

### よく使う設定項目

| 設定 ID | 説明 | 推奨値 |
|---------|------|--------|
| ssl | 暗号化モード | full (strict) |
| tls_1_3 | TLS 1.3 | on |
| min_tls_version | 最小 TLS バージョン | 1.2 |
| always_use_https | HTTPS 強制 | on |
| http3 | HTTP/3 | on |
| brotli | Brotli 圧縮 | on |

---

## 2. DNS レコード取得

### 使用例

**目的**: ゾーンのすべての DNS レコードを取得

```
ツール: cloudflare:mcp-server-cloudflare:list-dns-records
パラメータ:
{
  "zone_id": "your-zone-id"
}
```

**レスポンス例**:
```json
{
  "result": [
    {
      "id": "record-id-1",
      "type": "A",
      "name": "example.com",
      "content": "192.0.2.1",
      "proxied": true,
      "ttl": 1
    },
    {
      "id": "record-id-2",
      "type": "CNAME",
      "name": "www",
      "content": "example.com",
      "proxied": true,
      "ttl": 1
    }
  ]
}
```

### フィルタリング

特定タイプのレコードのみ取得：

```
パラメータ:
{
  "zone_id": "your-zone-id",
  "type": "A"  // A レコードのみ
}
```

---

## 3. Workers 設定確認

### 使用例

**目的**: Workers のルート設定を確認

```
ツール: cloudflare:mcp-server-cloudflare:list-workers-routes
パラメータ:
{
  "zone_id": "your-zone-id"
}
```

**レスポンス例**:
```json
{
  "result": [
    {
      "id": "route-id-1",
      "pattern": "example.com/api/*",
      "script": "api-worker"
    },
    {
      "id": "route-id-2",
      "pattern": "*.example.com/*",
      "script": "main-worker"
    }
  ]
}
```

---

## 4. Analytics データ取得

### 使用例

**目的**: 過去7日間のトラフィックデータを取得

```
ツール: cloudflare:mcp-server-cloudflare:get-analytics
パラメータ:
{
  "zone_id": "your-zone-id",
  "since": "2025-01-24T00:00:00Z",
  "until": "2025-01-31T00:00:00Z",
  "metrics": ["requests", "bandwidth", "cached_requests"]
}
```

**レスポンス例**:
```json
{
  "result": {
    "totals": {
      "requests": 1234567,
      "bandwidth": 48989765432,
      "cached_requests": 1073840
    },
    "timeseries": [
      {
        "timestamp": "2025-01-24T00:00:00Z",
        "requests": 176366,
        "bandwidth": 6998538204,
        "cached_requests": 153280
      }
    ]
  }
}
```

### 利用可能なメトリクス

| メトリクス | 説明 |
|-----------|------|
| requests | 総リクエスト数 |
| bandwidth | 総帯域幅（バイト） |
| cached_requests | キャッシュされたリクエスト数 |
| unique_visitors | ユニーク訪問者数 |
| page_views | ページビュー数 |
| threats | ブロックされた脅威数 |

### キャッシュヒット率の計算

```javascript
const cacheHitRate = (cached_requests / requests) * 100;
console.log(`キャッシュヒット率: ${cacheHitRate.toFixed(2)}%`);
```

---

## 5. ファイアウォールルール確認

### 使用例

**目的**: ファイアウォールルールの一覧を取得

```
ツール: cloudflare:mcp-server-cloudflare:list-firewall-rules
パラメータ:
{
  "zone_id": "your-zone-id"
}
```

**レスポンス例**:
```json
{
  "result": [
    {
      "id": "rule-id-1",
      "filter": {
        "expression": "(ip.geoip.country eq \"CN\")"
      },
      "action": "block",
      "description": "Block China traffic"
    },
    {
      "id": "rule-id-2",
      "filter": {
        "expression": "(http.request.uri.path contains \"/admin\")"
      },
      "action": "challenge",
      "description": "Challenge admin paths"
    }
  ]
}
```

### ルールアクション

| アクション | 説明 |
|-----------|------|
| allow | 許可 |
| block | ブロック |
| challenge | CAPTCHA チャレンジ |
| js_challenge | JavaScript チャレンジ |
| managed_challenge | マネージドチャレンジ |
| log | ログのみ |

---

## ワークフロー例：包括的な調査

以下は、MCP ツールを組み合わせた包括的な調査ワークフローの例です。

### シナリオ: ゾーンの全体的な健全性チェック

**ステップ1: ゾーン設定の確認**

```
ツール: get-zone-settings
パラメータ: { "zone_id": "..." }
```

**ステップ2: DNS レコードの確認**

```
ツール: list-dns-records
パラメータ: { "zone_id": "..." }
```

**ステップ3: セキュリティ設定の確認**

```
ツール: list-firewall-rules
パラメータ: { "zone_id": "..." }
```

**ステップ4: パフォーマンスデータの分析**

```
ツール: get-analytics
パラメータ: {
  "zone_id": "...",
  "since": "2025-01-24T00:00:00Z",
  "until": "2025-01-31T00:00:00Z"
}
```

**ステップ5: Workers 設定の確認**

```
ツール: list-workers-routes
パラメータ: { "zone_id": "..." }
```

---

## トラブルシューティング

### ツールが応答しない場合

1. **MCP サーバーの接続確認**: サーバーが起動しているか確認
2. **API トークンの権限**: 必要な権限（Zone:Read、DNS:Read 等）があるか確認
3. **ゾーン ID の確認**: 正しいゾーン ID を使用しているか確認

### エラーレスポンス

**認証エラー**:
```json
{
  "success": false,
  "errors": [{
    "code": 10000,
    "message": "Authentication error"
  }]
}
```

**対処法**: API トークンの権限を確認

**レート制限エラー**:
```json
{
  "success": false,
  "errors": [{
    "code": 10004,
    "message": "Rate limit exceeded"
  }]
}
```

**対処法**: 待機時間を設けてリトライ

---

## ベストプラクティス

1. **必要なデータのみ取得**: 不要なメトリクスやレコードは取得しない
2. **エラーハンドリング**: API エラーに対する適切な処理
3. **キャッシング**: 頻繁に変更されないデータはキャッシュ
4. **並列実行**: 独立したデータ取得は並列で実行

---

この MCP ツール使用ガイドを活用して、Cloudflare リソース情報を効率的に取得してください。
