# Pino + OpenTelemetry 導入リファレンス

## Pino セットアップ

### インストール

```bash
npm install pino
```

### 基本設定(構造化JSON出力)

```typescript
import pino from 'pino'
const logger = pino({ level: 'info' })
// 本番ではJSON出力がデフォルト。prettifier は開発時のみ。
```

### severity の統一

Pino のデフォルト level (trace/debug/info/warn/error/fatal) をそのまま使用。
console.log/console.error は使わない。

### 本番 vs 開発の設定分離

```typescript
const logger = pino({
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }
    : undefined
})
```

## OpenTelemetry SDK セットアップ

### インストール

```bash
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node
```

### Node.js SDK 初期化

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations()],
})
sdk.start()
```

### trace_id / span_id の自動付与

OTel SDK が自動で各リクエストに trace_id/span_id を付与する。
Pino と連携する場合は pino-opentelemetry-transport を使用。

```bash
npm install pino-opentelemetry-transport
```

## AWS パターン向け追加設定

### CloudWatch Logs へのエクスポート

アプリのログは stdout に出力し、CloudWatch Agent または Lambda で収集する。

### X-Ray トレースエクスポーター

```bash
npm install @opentelemetry/exporter-trace-otlp-http
```

X-Ray Daemon または ADOT Collector 経由でエクスポートする。

## Cloudflare パターン向け追加設定

### Workers Logs

Workers の console.log は自動的に Workers Logs に記録される。
Pino は Workers 環境では transport を使わず、stdout に出力する。

### Workers Tracing + Axiom OTLP エクスポート

Workers Tracing API でスパンを作成し、Axiom の OTLP エンドポイントにエクスポートする。
2026年3月時点でオープンベータ。本番投入前に安定性を確認すること。
