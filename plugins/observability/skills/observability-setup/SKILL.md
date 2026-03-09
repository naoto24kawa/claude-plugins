---
name: observability-setup
description: This skill should be used when the user asks to "観測系のセットアップをしたい", "observabilityを設定したい", "ログ/トレース設計を始めたい", "自己修復システムの観測系を構成したい", "observability-setupを実行したい", "パターンA/B/C/Dを選びたい", "Pino/OTelの導入方針を決めたい". プロジェクト初期にインフラ(AWS/CF)とアーキテクチャ(単一/マイクロ)を選択し、4パターンから観測系設計を確定して .docs/observability-design.md に出力する初回セットアップスキル。
allowed-tools: [Read, Write, Glob, Grep, AskUserQuestion]
user-invocable: true
---

# Observability Setup

プロジェクトの観測系設計を対話的に確定し、設計ドキュメントを出力する。
AI自己修復システムの観測系構成ガイドに基づく4パターンから最適な構成を選択する。

## 前提条件

- `.docs/observability-design.md` が既に存在する場合、上書き前に確認を取る
- 上書きを選択した場合、既存の設計判断を差分として提示する

## ワークフロー

### Step 1: インフラ選択

以下の選択肢を提示する:

```
どのインフラを使用しますか?

1. AWS (CloudWatch Logs + X-Ray)
2. Cloudflare (Workers Logs + Workers Tracing + Axiom)
```

判断基準:
- 既にインフラが決まっている場合はそれに従う
- 迷っている場合は、既存のプロジェクト構成(package.json の dependencies、wrangler.toml の有無等)から推定を提示する

### Step 2: アーキテクチャ選択

以下の選択肢を提示する:

```
アーキテクチャはどちらですか?

1. 単一アプリ
2. マイクロサービス
```

選択結果からパターンを自動決定する:

| | 単一アプリ | マイクロサービス |
|---|---|---|
| AWS | パターンA | パターンB |
| Cloudflare | パターンC | パターンD |

決定したパターンの詳細を `./reference/pattern-{a,b,c,d}.md` から読み込んで提示する。
構成図とツール構成を表示し、認識が合っているか確認を取る。

### Step 3: 3差分の設計確定

パターンごとのデフォルト値を提示し、各項目でデフォルト採用またはカスタマイズを確認する。

**trace_id / span_id**:

| アーキテクチャ | デフォルト | 理由 |
|---|---|---|
| 単一アプリ | `recommended` | 任意だがOTel SDKで付与推奨(マイクロサービス移行時に流用可能) |
| マイクロサービス | `required` | サービス間の連鎖を辿るために必須 |

**修復AIへの入力**:

| アーキテクチャ | デフォルト | 理由 |
|---|---|---|
| 単一アプリ | `error_log` | エラーログ単体で修復判断可能 |
| マイクロサービス | `distributed_trace` | 根本原因サービスの特定に分散トレース全体が必要 |

**修復履歴ストアのキー設計**:

| アーキテクチャ | デフォルト | 理由 |
|---|---|---|
| 単一アプリ | `component` | component + エラー種別ハッシュで完結 |
| マイクロサービス | `service_chain` | サービス間の組み合わせパターンを含める必要あり |

デフォルト値の根拠を示した上で、変更が必要か確認する。
不明な場合はデフォルトを採用し、後から `observability-audit` で検証可能であることを案内する。

### Step 4: 共通原則の確認

以下の共通原則を提示し、カスタマイズの要否を確認する。

**修復アクション3層**:

| 層 | デフォルト例 | 承認 |
|---|---|---|
| 即時実行 | サービス再起動, キャッシュクリア | 不要 |
| 承認実行 | PRマージ, スケールアップ | Slack Boltで承認 |
| 提案のみ | インフラ構成変更, DBマイグレーション | 人間が手動実行 |

各層に具体的なアクションを追加・削除するか確認する。
プロジェクト固有のアクション(例: 特定のジョブ再実行)があれば追加する。

**Gitスナップショット**: 不可逆アクション前に必ずコミットする (デフォルト: true)

**RAG修復履歴**: 過去の修復パターンをPostgreSQLに蓄積する (デフォルト: true)
初期段階で修復履歴ストアが未構築の場合は true のまま設定し、WARN として記録する。

### Step 5: 設計ドキュメント出力

`./templates/observability-design.md` を Read で読み込み、テンプレートとして使用する。
確定した全項目を埋めて `.docs/observability-design.md` に Write で出力する。

出力後の案内:
- 設計ドキュメントの保存先パスを表示する
- `observability-audit` で設計との整合性を検査できることを案内する
- Pino/OTel の導入手順が必要な場合は `./reference/pino-otel-setup.md` を参照するよう案内する

## reference ファイル

| ファイル | 内容 | 読み込みタイミング |
|---------|------|------------------|
| `./reference/pattern-a.md` | AWS x 単一アプリ: 構成図、ツール、注意点 | Step 2 でパターンA選択時 |
| `./reference/pattern-b.md` | AWS x マイクロサービス: 構成図、ツール、注意点 | Step 2 でパターンB選択時 |
| `./reference/pattern-c.md` | CF x 単一アプリ: 構成図、ツール、注意点 | Step 2 でパターンC選択時 |
| `./reference/pattern-d.md` | CF x マイクロサービス: 構成図、ツール、注意点 | Step 2 でパターンD選択時 |
| `./reference/pino-otel-setup.md` | Pino/OTel 導入手順のリファレンス | Step 5 の案内時、必要に応じて |
