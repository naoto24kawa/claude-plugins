# Cloudflare Workers Security Properties

Manako はすべて Cloudflare Workers 上で動作する。コードに明示されないランタイム固有のセキュリティ保護を以下にまとめる。

## Network Layer Protections

### fetch() Private IP Blocking
- Workers の `fetch()` は Cloudflare のネットワークプロキシ経由で実行される
- **ランタイムレベルで** プライベート/予約済みIPへの接続をブロック:
  - RFC 1918: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
  - Loopback: `127.0.0.0/8`, `[::1]`
  - Link-local: `169.254.0.0/16`, `fe80::/10`
  - Cloud metadata: `169.254.169.254`
- DNS解決結果がプライベートIPの場合もブロック(DNS Rebinding防御)
- **アプリケーションコードの `assertSafeUrl()` は defense-in-depth**

### connect() API (TCP)
- TCP `connect()` も同様にCFネットワーク経由
- プライベートIP制限はfetch()と同等

### Browser Rendering API
- `@cloudflare/puppeteer` もCF隔離環境で実行
- Worker自体のネットワーク上ではない

## Execution Model

### Isolate Architecture
- 各リクエストは V8 isolate で処理
- メモリ空間が隔離(他テナントのデータにアクセス不可)
- ファイルシステムアクセスなし(path traversal不可)

### No Shell Access
- `child_process`, `exec`, `spawn` 等は利用不可
- **コマンドインジェクションは構造的に不可能**

### No Native Module Loading
- C/C++ addon loading不可
- deserialization経由のRCEリスクが大幅に低減

## Crypto API

### Web Crypto API Only
- Node.jsの`crypto`モジュールではなくWeb Crypto API
- PBKDF2, AES-GCM, HKDF, SHA-256/512 等がネイティブ利用可能
- 暗号操作はハードウェアアクセラレーション対応

### Timing-Safe Comparison
- `crypto.subtle.timingSafeEqual()` ではなく、Manakoは独自実装のtiming-safe compareを使用
- `packages/shared/src/crypto.ts` の `timingSafeEqual()` を確認

## KV Store Characteristics

### Eventual Consistency
- 同一データセンター内は強い整合性
- グローバルは eventually consistent(伝播に最大60秒)
- **Security implication**: アトミックカウンタは近似値(rate limiting, lockoutに影響)

### TTL-Based Expiry
- refresh token, lockout counter, sudo token は KV TTL で自動失効
- TTL は書き込み時に設定、変更不可(再書き込みが必要)

## Workers-Specific Threat Model

### 該当しない脅威カテゴリ
- ファイルアップロード攻撃(ファイルシステムなし)
- コマンドインジェクション(シェルなし)
- ローカルファイルインクルージョン(FS なし)
- メモリ破壊攻撃(V8 isolate + managed runtime)
- プロセスフォーク攻撃(fork/spawn なし)

### 注意すべき脅威カテゴリ
- SSRF(アプリレベル検証が依然重要、ただしランタイム保護あり)
- SQLインジェクション(D1/SQLiteはドライバ経由で利用)
- 認証・認可バイパス(アプリロジック依存)
- XSS(SSRワーカーのHTMLレスポンス)
- 暗号鍵管理(secret binding経由で安全だが、フォールバックに注意)
- ビジネスロジック脆弱性(テナント分離、plan limit等)

## Security Review での活用

セキュリティレビュー時、以下の判断に利用する:

1. **SSRF候補の評価**: CF Workers fetch()保護により、DNS Rebinding等のTOCTOUは理論上のリスクに留まる
2. **コマンドインジェクション候補**: Workers環境では構造的に不可能と即時棄却
3. **Race condition評価**: KVのeventual consistencyを前提とし、補償制御の有無で判断
4. **Fail-open評価**: Worker-to-CF内部通信は外部から妨害困難。可用性優先の設計判断として許容
