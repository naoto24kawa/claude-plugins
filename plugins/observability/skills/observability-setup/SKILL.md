---
name: observability-setup
description: This skill should be used when the user asks to "観測系のセットアップをしたい", "observabilityを設定したい", "ログ/トレース設計を始めたい", "自己修復システムの観測系を構成したい", "observability-setupを実行したい", "パターンA/B/C/Dを選びたい", "Pino/OTelの導入方針を決めたい". プロジェクト初期にインフラ(AWS/CF)とアーキテクチャ(単一/マイクロ)を選択し、4パターンから観測系設計を確定して .docs/observability-design.md に出力する初回セットアップスキル。
allowed-tools: [Read, Write, Glob, Grep, AskUserQuestion]
user-invocable: true
---

# Observability Setup

プロジェクトの観測系設計を対話的に確定し、設計ドキュメントを出力するスキル。
AI自己修復システムの観測系構成ガイドに基づく4パターンから最適な構成を選択する。

## ワークフロー

### Step 1: インフラ選択

ユーザーに質問する:

(以下の選択肢を提示)
1. AWS (CloudWatch Logs + X-Ray)
2. Cloudflare (Workers Logs + Workers Tracing + Axiom)

### Step 2: アーキテクチャ選択

(以下の選択肢を提示)
1. 単一アプリ
2. マイクロサービス

選択結果からパターンを自動決定:

| | 単一アプリ | マイクロサービス |
|---|---|---|
| AWS | パターンA | パターンB |
| Cloudflare | パターンC | パターンD |

決定したパターンの詳細を `./reference/pattern-{a,b,c,d}.md` から読み込んで提示する。

### Step 3: 3差分の設計確定

パターンごとのデフォルト値を提示し、ユーザーに確認する:

**trace_id / span_id**:
- 単一アプリ: デフォルト `recommended` (任意だが推奨)
- マイクロサービス: デフォルト `required` (必須)

**修復AIへの入力**:
- 単一アプリ: デフォルト `error_log` (エラーログ単体)
- マイクロサービス: デフォルト `distributed_trace` (分散トレース全体)

**修復履歴ストアのキー設計**:
- 単一アプリ: デフォルト `component` (component + エラー種別ハッシュ)
- マイクロサービス: デフォルト `service_chain` (サービス間組み合わせパターン含む)

各項目でデフォルト採用 or カスタマイズを確認する。

### Step 4: 共通原則の確認

以下の共通原則を提示し、カスタマイズの要否を確認する:

**修復アクション3層**:
| 層 | デフォルト例 | 承認 |
|---|---|---|
| 即時実行 | サービス再起動, キャッシュクリア | 不要 |
| 承認実行 | PRマージ, スケールアップ | Slack Boltで承認 |
| 提案のみ | インフラ構成変更, DBマイグレーション | 人間が手動実行 |

**Gitスナップショット**: 不可逆アクション前に必ずコミット (デフォルト: true)

**RAG修復履歴**: 過去の修復パターンをPostgreSQLに蓄積 (デフォルト: true)

### Step 5: 設計ドキュメント出力

`./templates/observability-design.md` をテンプレートとして読み込み、確定した内容で埋めて `.docs/observability-design.md` に出力する。

出力後、以下を案内する:
- 「設計ドキュメントを `.docs/observability-design.md` に保存しました」
- 「開発中に `observability-audit` を実行すると、この設計に沿っているか検査できます」
- Pino/OTel の導入手順が必要な場合は `./reference/pino-otel-setup.md` を参照

## reference ファイル

| ファイル | 内容 |
|---------|------|
| `./reference/pattern-a.md` | AWS x 単一アプリ: 構成図、ツール、注意点 |
| `./reference/pattern-b.md` | AWS x マイクロサービス: 構成図、ツール、注意点 |
| `./reference/pattern-c.md` | CF x 単一アプリ: 構成図、ツール、注意点 |
| `./reference/pattern-d.md` | CF x マイクロサービス: 構成図、ツール、注意点 |
| `./reference/pino-otel-setup.md` | Pino/OTel 導入手順のリファレンス |
