# RepairLog スキーマ & 修復履歴DB設計

## RepairLog JSON スキーマ

修復AIが生成するログの共通構造。全パターンで同一スキーマを使用する。

```jsonc
{
  // 識別
  "repair_id": "uuid",
  "timestamp": "ISO 8601",

  // エラー情報
  "error_type": "string",           // e.g. "TIMEOUT", "OOM", "UNHANDLED_REJECTION"
  "error_message": "string",
  "severity": "error | fatal",
  "component": "string",            // 単一アプリ: モジュール名, マイクロサービス: サービス名

  // トレース情報 (trace_id: required/recommended の場合)
  "trace_id": "string | null",
  "span_id": "string | null",

  // マイクロサービス専用 (パターンB/D)
  "root_cause_service": "string | null",   // 分散トレースから特定した根本原因サービス
  "service_chain": ["string"] ,            // 影響を受けたサービスの連鎖
  "blast_radius": "low | medium | high",   // サービス依存グラフから算出

  // 修復判断
  "suggested_action": "string",       // e.g. "restart", "cache_clear", "pr_fix"
  "action_tier": "immediate | approval | proposal_only",
  "confidence": 0.0,                  // 0.0-1.0, 修復AIの確信度

  // 修復履歴RAG参照
  "similar_repairs": [                // 過去の類似修復 (repair_history_rag: true の場合)
    {
      "repair_id": "uuid",
      "similarity": 0.0,
      "action_taken": "string",
      "result": "success | failure"
    }
  ],

  // 結果 (修復実行後に埋める)
  "action_taken": "string | null",
  "result": "success | failure | pending",
  "git_snapshot_sha": "string | null"  // 不可逆アクション前のコミットSHA
}
```

### パターン別の使い分け

| フィールド | 単一アプリ (A/C) | マイクロサービス (B/D) |
|-----------|-----------------|---------------------|
| `root_cause_service` | null | 必須 |
| `service_chain` | 空配列 | 必須 |
| `blast_radius` | 省略可 | 必須 |
| `trace_id` | 推奨 (recommended) | 必須 (required) |

## 修復履歴 DB スキーマ (PostgreSQL)

`repair_history_rag: true` の場合に使用する。AWS は Aurora、Cloudflare は Supabase。

```sql
-- 修復履歴テーブル
CREATE TABLE repair_logs (
  repair_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- エラー情報
  error_type    TEXT NOT NULL,
  error_hash    TEXT NOT NULL,          -- error_type + component のハッシュ
  component     TEXT NOT NULL,
  severity      TEXT NOT NULL CHECK (severity IN ('error', 'fatal')),

  -- トレース
  trace_id      TEXT,
  span_id       TEXT,

  -- マイクロサービス専用
  root_cause_service TEXT,
  service_chain      TEXT[],            -- PostgreSQL配列型
  blast_radius       TEXT CHECK (blast_radius IN ('low', 'medium', 'high')),

  -- 修復
  action_tier        TEXT NOT NULL CHECK (action_tier IN ('immediate', 'approval', 'proposal_only')),
  suggested_action   TEXT NOT NULL,
  action_taken       TEXT,
  result             TEXT CHECK (result IN ('success', 'failure', 'pending', 'rejected')),
  confidence         NUMERIC(3,2),
  git_snapshot_sha   TEXT
);

-- repair_key 用インデックス
-- 単一アプリ (component ベース)
CREATE INDEX idx_repair_component ON repair_logs (component, error_hash);

-- マイクロサービス (service_chain ベース)
CREATE INDEX idx_repair_service_chain ON repair_logs USING GIN (service_chain);

-- RAG検索用 (類似エラー検索)
CREATE INDEX idx_repair_error_type ON repair_logs (error_type, created_at DESC);
```

### repair_key によるインデックス使い分け

| repair_key | 検索クエリ | インデックス |
|-----------|-----------|------------|
| `component` | `WHERE component = ? AND error_hash = ?` | `idx_repair_component` |
| `service_chain` | `WHERE service_chain @> ARRAY[?]` | `idx_repair_service_chain` |

## アラート閾値の目安

修復AIを起動するトリガーの目安値。プロジェクトの特性に応じて調整する。

### AWS (CloudWatch Alarms)

```
メトリクス: ErrorRate (エラーログ数 / 総リクエスト数)
閾値: 5% (5分間の平均)
評価期間: 1 データポイント / 5分
アクション: Lambda → 修復AI起動
```

### Cloudflare (Axiom アラート)

```
クエリ: error_count / total_count > 0.05
評価間隔: 5分
通知先: Webhook → 修復AI起動
```

### 閾値調整の指針

- 初期値は 5% から開始し、誤検知が多ければ引き上げる
- fatal レベルは閾値に関係なく即時トリガー
- 時間帯やトラフィック量による動的閾値は初期段階では不要(運用後に検討)
