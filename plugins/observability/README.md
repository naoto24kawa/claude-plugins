# Observability Plugin

AI自己修復システムの観測系設計を標準化するClaude Codeプラグイン。
インフラ(AWS/Cloudflare)とアーキテクチャ(単一アプリ/マイクロサービス)の組み合わせから4パターンを選択し、設計の初期確定と継続的な監査を行う。

## 背景

個人開発プロジェクトで毎回同じ観測系パターンを再現性高く適用するために作成した。
元となるドキュメント「AIアプリ自己修復 観測系構成ガイド」の知識をスキルに変換し、以下を実現する:

- パターン選択と設計判断の標準化
- 実装中のコードが設計に沿っているかの継続的検査
- 修復AIのスキーマ・プロンプト・DB設計のリファレンス提供

## 4パターン

| | 単一アプリ | マイクロサービス |
|---|---|---|
| **AWS** | パターンA (CloudWatch + X-Ray) | パターンB (CloudWatch + X-Ray) |
| **Cloudflare** | パターンC (Workers Logs + Axiom) | パターンD (Workers Logs + Axiom) |

ツールスタックは4パターン共通: Pino(ログ), OpenTelemetry(トレース), Temporal(ワークフロー), Slack Bolt(承認)

パターン間で変わるのは3つの設計差分のみ:

| 差分 | 単一アプリ | マイクロサービス |
|------|-----------|----------------|
| trace_id | recommended | required |
| 修復AI入力 | error_log | distributed_trace |
| 修復履歴キー | component | service_chain |

## スキル

### setup

プロジェクト初期に観測系設計を対話的に確定し、`.docs/observability-design.md` に出力する。

```bash
# 実行
/skill observability:setup
```

**フロー:** インフラ選択 -> アーキテクチャ選択 -> 設計差分確定 -> 共通原則確認 -> 設計ドキュメント出力

### observability-audit

`.docs/observability-design.md` を基準にコードを検査し、OK/WARN/NG のレポートを出力する。

```bash
# 実行
/skill observability:observability-audit
```

**検査項目 (11項目):**

| カテゴリ | ID | 項目 |
|---------|-----|------|
| ログ | LOG-001 | Pino 導入 |
| ログ | LOG-002 | 構造化JSON出力 |
| ログ | LOG-003 | severity 統一 |
| トレース | TRACE-001 | OTel SDK 導入 |
| トレース | TRACE-002 | OTel SDK 初期化 |
| トレース | TRACE-003 | trace_id 付与 (条件付き) |
| トレース | TRACE-004 | Context Propagation (条件付き) |
| トレース | TRACE-005 | トレース収集設定 (条件付き) |
| 設計原則 | DESIGN-001 | 3層アクション定義 |
| 設計原則 | DESIGN-002 | Gitスナップショット |
| 設計原則 | DESIGN-003 | 修復履歴RAG |

## 2スキル間の連携

```
setup (初回)
  -> .docs/observability-design.md 出力

observability-audit (繰り返し)
  -> .docs/observability-design.md 読み込み
  -> コードとの整合性を検査
  -> 乖離があれば修正提案
```

連携ポイントは `.docs/observability-design.md` のYAML frontmatterのみ。

## ファイル構成

```
plugins/observability/
├── README.md                              # このファイル
└── skills/
    ├── setup/
    │   ├── SKILL.md                       # セットアップワークフロー
    │   ├── templates/
    │   │   └── observability-design.md    # 設計ドキュメントテンプレート
    │   └── reference/
    │       ├── pattern-a.md               # AWS x 単一アプリ
    │       ├── pattern-b.md               # AWS x マイクロサービス
    │       ├── pattern-c.md               # CF x 単一アプリ
    │       ├── pattern-d.md               # CF x マイクロサービス
    │       ├── pino-otel-setup.md         # Pino/OTel 導入手順
    │       ├── repair-log-schema.md       # RepairLog JSON + DB設計 + アラート閾値
    │       └── repair-ai-prompt.md        # 修復AI SYSTEM_PROMPT + 承認フロー
    └── observability-audit/
        ├── SKILL.md                       # 監査ワークフロー
        └── reference/
            └── audit-checklist.md         # 全11検査項目の詳細定義
```

## 設計判断

| 判断 | 選択 | 理由 |
|------|------|------|
| スキル分割 | 2スキル分離型 | setup(初回)とaudit(繰り返し)はライフサイクルが異なる |
| 実装詳細 | reference に集約 | RepairLogスキーマ等はパターン共通で定型。スキル追加不要 |
| Audit範囲 | コード + 設計ドキュメント整合性 | Claude Codeで検査可能な範囲に限定。ライブインフラは対象外 |
| 連携方式 | frontmatter契約 | 1ファイルのスキーマで2スキルを疎結合に連携 |
| パターン詳細 | reference/ に外部化 | Progressive Disclosure。SKILL.md を130行以下に保持 |
