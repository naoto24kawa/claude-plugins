# Observability Plugin 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** AI自己修復システムの観測系設計を個人開発で再現するための Claude Code プラグイン(2スキル)を作成する

**Architecture:** observability-setup(初回設計確定 → .docs/observability-design.md 出力)と observability-audit(設計ドキュメントを基準にコードを検査 → OK/WARN/NG レポート)の2スキル構成。frontmatter スキーマが2スキル間の契約。

**Tech Stack:** Claude Code Plugin (SKILL.md + reference files), YAML frontmatter, Glob/Grep/Read ツール

---

### Task 1: ディレクトリ構造の作成

**Files:**
- Create: `plugins/observability/skills/observability-setup/SKILL.md` (空ファイル)
- Create: `plugins/observability/skills/observability-audit/SKILL.md` (空ファイル)
- Create: 各 reference/ ディレクトリ

**Step 1: ディレクトリとプレースホルダを作成**

```bash
mkdir -p plugins/observability/skills/observability-setup/reference
mkdir -p plugins/observability/skills/observability-setup/templates
mkdir -p plugins/observability/skills/observability-audit/reference
```

**Step 2: 構造確認**

Run: `find plugins/observability -type d | sort`
Expected:
```
plugins/observability
plugins/observability/skills
plugins/observability/skills/observability-audit
plugins/observability/skills/observability-audit/reference
plugins/observability/skills/observability-setup
plugins/observability/skills/observability-setup/reference
plugins/observability/skills/observability-setup/templates
```

**Step 3: Commit**

```bash
git add plugins/observability/
git commit -m "chore(observability): scaffold plugin directory structure"
```

---

### Task 2: 設計ドキュメントテンプレートの作成

**Files:**
- Create: `plugins/observability/skills/observability-setup/templates/observability-design.md`

**Step 1: テンプレートファイルを作成**

```markdown
---
pattern:          # A / B / C / D
infrastructure:   # aws / cloudflare
architecture:     # single / microservices
trace_id:         # required / recommended / optional
repair_input:     # error_log / distributed_trace
repair_key:       # component / service_chain
repair_actions:
  immediate: []
  approval: []
  proposal_only: []
git_snapshot:       # true / false
repair_history_rag: # true / false
---

# Observability Design

## 選択パターン

- パターン: <!-- pattern -->
- インフラ: <!-- infrastructure -->
- アーキテクチャ: <!-- architecture -->

## 構成図

<!-- observability-setup が選択パターンに応じて埋める -->

## 3差分の設計判断

### trace_id / span_id

- 方針: <!-- trace_id -->
- 理由:

### 修復AIへの入力

- 粒度: <!-- repair_input -->
- 理由:

### 修復履歴ストアのキー設計

- キー構成: <!-- repair_key -->
- 理由:

## 共通原則

### 修復アクション3層

| 層 | アクション | 承認 |
|---|---|---|
| 即時実行 | <!-- immediate --> | 不要 |
| 承認実行 | <!-- approval --> | Slack Boltで承認 |
| 提案のみ | <!-- proposal_only --> | 人間が手動実行 |

### Gitスナップショット

<!-- git_snapshot: true/false とその方針 -->

### RAG修復履歴

<!-- repair_history_rag: true/false とその方針 -->

## ツール構成

| コンポーネント | ツール |
|---|---|
| ログ収集 | |
| 分散トレース | |
| アラート | |
| 承認フロー | |
| 修復履歴ストア | |
| アクション実行 | |
| PR生成 | |
| スナップショット | |
```

**Step 2: Commit**

```bash
git add plugins/observability/skills/observability-setup/templates/
git commit -m "feat(observability): add design document template"
```

---

### Task 3: パターン別 reference ファイルの作成

**Files:**
- Create: `plugins/observability/skills/observability-setup/reference/pattern-a.md`
- Create: `plugins/observability/skills/observability-setup/reference/pattern-b.md`
- Create: `plugins/observability/skills/observability-setup/reference/pattern-c.md`
- Create: `plugins/observability/skills/observability-setup/reference/pattern-d.md`

元のガイド `AIアプリ自己修復_観測系構成ガイド.md` のセクション3(パターン別の詳細)を4ファイルに分割する。

**Step 1: pattern-a.md を作成**

ガイドの「パターンA: AWS x 単一アプリ」セクションの内容を以下の構造で記載:

```markdown
# パターンA: AWS x 単一アプリ

## 構成図

(ガイドの構成図をそのまま)

## ツール構成

| コンポーネント | ツール |
|---|---|
| ログ収集 | Pino → CloudWatch Logs |
| 分散トレース | AWS X-Ray |
| アラート | CloudWatch Alarms |
| 承認フロー | Slack Bolt |
| 修復履歴ストア | PostgreSQL (Aurora) |
| アクション実行 | Temporal |
| PR生成 | GitHub API + Claude API |
| スナップショット | Git |

## 3差分のデフォルト値

| 項目 | デフォルト | 理由 |
|---|---|---|
| trace_id | recommended | 任意だがOTel SDKで付与推奨(マイクロサービス移行時に流用) |
| repair_input | error_log | エラーログ単体で修復判断 |
| repair_key | component | 単一コンポーネントで完結 |

## 設計上の注意点

- (ガイドから転記)
```

**Step 2: pattern-b.md, pattern-c.md, pattern-d.md を同様に作成**

各ファイルで異なる部分:
- pattern-b: trace_id=required, repair_input=distributed_trace, repair_key=service_chain
- pattern-c: Cloudflare用ツール構成, Workers Tracingのベータ注意
- pattern-d: pattern-b + pattern-c の両方の注意点

**Step 3: Commit**

```bash
git add plugins/observability/skills/observability-setup/reference/
git commit -m "feat(observability): add pattern reference files (A-D)"
```

---

### Task 4: Pino/OTel 導入リファレンスの作成

**Files:**
- Create: `plugins/observability/skills/observability-setup/reference/pino-otel-setup.md`

**Step 1: リファレンスファイルを作成**

Audit スキルの検査項目と対応する形で、以下のセクションを含める:

```markdown
# Pino + OpenTelemetry 導入リファレンス

## Pino セットアップ

### インストール
### 基本設定(構造化JSON出力)
### severity の統一(level → severity マッピング)
### 本番 vs 開発の設定分離(prettifier の扱い)

## OpenTelemetry SDK セットアップ

### インストール(パッケージ一覧)
### Node.js SDK 初期化
### trace_id / span_id の自動付与
### HTTP instrumentation

## AWS パターン向け追加設定

### CloudWatch Logs へのエクスポート
### X-Ray トレースエクスポーター

## Cloudflare パターン向け追加設定

### Workers Logs
### Workers Tracing + Axiom OTLP エクスポート
```

**Step 2: Commit**

```bash
git add plugins/observability/skills/observability-setup/reference/pino-otel-setup.md
git commit -m "feat(observability): add Pino/OTel setup reference"
```

---

### Task 5: observability-setup SKILL.md の作成

**Files:**
- Create: `plugins/observability/skills/observability-setup/SKILL.md`

**Step 1: SKILL.md を作成**

```markdown
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

```
どのインフラを使用しますか？

1. AWS (CloudWatch Logs + X-Ray)
2. Cloudflare (Workers Logs + Workers Tracing + Axiom)
```

### Step 2: アーキテクチャ選択

```
アーキテクチャはどちらですか？

1. 単一アプリ
2. マイクロサービス
```

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
```

**Step 2: 行数確認**

Run: `wc -l plugins/observability/skills/observability-setup/SKILL.md`
Expected: 120行前後 (500行以下を確認)

**Step 3: Commit**

```bash
git add plugins/observability/skills/observability-setup/SKILL.md
git commit -m "feat(observability): add observability-setup skill"
```

---

### Task 6: Audit チェックリストの作成

**Files:**
- Create: `plugins/observability/skills/observability-audit/reference/audit-checklist.md`

**Step 1: チェックリストファイルを作成**

```markdown
# Observability Audit チェックリスト

## パターン共通チェック

### LOG-001: Pino 導入

- 検査方法: `package.json` で `"pino"` を検索
- OK: pino パッケージが dependencies に存在
- NG: pino 未導入
- 修正提案: `npm install pino` を実行

### LOG-002: 構造化JSON出力

- 検査方法: Pino の設定ファイルを Grep で検索し、transport/prettifier 設定を確認
- OK: 本番設定で JSON 出力
- WARN: prettifier が本番設定に残っている
- 修正提案: NODE_ENV=production で prettifier を無効化

### LOG-003: severity 統一

- 検査方法: ログ呼び出し箇所の level 指定を Grep
- OK: info/warn/error/fatal が統一的に使用されている
- WARN: console.log/console.error が混在
- 修正提案: Pino の logger インスタンスに統一

### TRACE-001: OpenTelemetry SDK 導入

- 検査方法: `package.json` で `@opentelemetry` を検索
- OK: @opentelemetry/sdk-node (または sdk-trace-node) が存在
- NG: OTel 未導入
- 修正提案: `npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node`

### TRACE-002: OTel SDK 初期化

- 検査方法: `NodeSDK` または `registerInstrumentations` の import を Grep
- OK: エントリポイントで初期化されている
- NG: パッケージはあるが初期化コードがない
- 修正提案: エントリポイントに SDK 初期化コードを追加

## パターン依存チェック

### TRACE-003: trace_id 付与 (trace_id: required の場合)

- 検査方法: HTTP ハンドラで trace_id をレスポンスヘッダまたはログに含めているか Grep
- OK: trace_id が出力されている
- WARN: OTel の自動計装に任せている(明示的な出力なし)
- NG: trace_id が一切出力されていない

### TRACE-004: Context Propagation (architecture: microservices の場合)

- 検査方法: HTTP クライアント呼び出しで W3C Trace Context ヘッダを伝播しているか確認
- OK: OTel の HTTP instrumentation が有効
- NG: 手動 HTTP 呼び出しで context が失われている

### TRACE-005: 分散トレース収集設定 (repair_input: distributed_trace の場合)

- 検査方法: OTel エクスポーター設定を確認 (X-Ray / Axiom OTLP)
- OK: エクスポーター設定が存在
- NG: エクスポーター未設定

## 設計原則チェック

### DESIGN-001: 修復アクション3層定義

- 検査方法: `.docs/observability-design.md` の repair_actions を確認
- OK: immediate / approval / proposal_only が全て定義済み
- WARN: 一部空
- NG: 設計ドキュメントに定義なし

### DESIGN-002: Gitスナップショット手順

- 検査方法: `.docs/` 配下にロールバック手順またはスナップショット方針の記載があるか
- OK: 手順が文書化されている
- WARN: 設計ドキュメントで git_snapshot: true だが手順未文書化

### DESIGN-003: 修復履歴RAG設定

- 検査方法: repair_history_rag: true なら DB 接続設定を検索
- OK: PostgreSQL / Supabase の接続設定が存在
- WARN: 設計段階(接続設定は後で追加予定)
- NG: repair_history_rag: true だが接続設定なし
```

**Step 2: Commit**

```bash
git add plugins/observability/skills/observability-audit/reference/
git commit -m "feat(observability): add audit checklist reference"
```

---

### Task 7: observability-audit SKILL.md の作成

**Files:**
- Create: `plugins/observability/skills/observability-audit/SKILL.md`

**Step 1: SKILL.md を作成**

```markdown
---
name: observability-audit
description: This skill should be used when the user asks to "観測系の設定を監査したい", "observability audit", "ログ設計に沿ってるか確認したい", "observability-auditを実行したい", "OTelの導入状況をチェックしたい", "設計ドキュメントとコードの整合性を確認したい", "Pino設定を検証したい". .docs/observability-design.md の設計判断を基準にコードを検査し、OK/WARN/NG のレポートと具体的な修正提案を出力する継続的監査スキル。
allowed-tools: [Read, Glob, Grep]
user-invocable: true
---

# Observability Audit

`.docs/observability-design.md` の設計判断を基準に、プロジェクトのコードが観測系設計に沿っているかを検査するスキル。

## 前提条件

- `observability-setup` で `.docs/observability-design.md` が生成済みであること
- ファイルが存在しない場合: 「先に `observability-setup` を実行して設計を確定してください」と案内して終了

## ワークフロー

### Step 1: 設計ドキュメント読み込み

`.docs/observability-design.md` を Read で読み込み、frontmatter をパースする。

以下の値を取得:
- `pattern` (A/B/C/D)
- `infrastructure` (aws/cloudflare)
- `architecture` (single/microservices)
- `trace_id` (required/recommended/optional)
- `repair_input` (error_log/distributed_trace)
- `repair_key` (component/service_chain)
- `git_snapshot` (true/false)
- `repair_history_rag` (true/false)

パターン名を表示: 「パターン X (infrastructure x architecture) で監査します」

### Step 2: コード検査 (パターン共通)

以下を順に検査する。検査方法の詳細は `./reference/audit-checklist.md` を参照。

| ID | 項目 | 検査方法 |
|---|---|---|
| LOG-001 | Pino 導入 | Glob: `**/package.json` → "pino" を Grep |
| LOG-002 | 構造化JSON出力 | Grep: pino の transport/prettifier 設定 |
| LOG-003 | severity 統一 | Grep: `console.log` `console.error` の残存 |
| TRACE-001 | OTel SDK 導入 | Glob: `**/package.json` → "@opentelemetry" を Grep |
| TRACE-002 | OTel SDK 初期化 | Grep: `NodeSDK` or `registerInstrumentations` |

### Step 3: コード検査 (パターン依存)

frontmatter の値に応じて条件付きで検査する:

| 条件 | ID | 項目 |
|------|---|------|
| trace_id == required | TRACE-003 | trace_id がログ/レスポンスに含まれているか |
| architecture == microservices | TRACE-004 | Context Propagation が有効か |
| repair_input == distributed_trace | TRACE-005 | トレースエクスポーター設定があるか |

条件に該当しない項目はスキップし、レポートに「(対象外)」と記載する。

### Step 4: 設計原則チェック

| ID | 項目 | 検査方法 |
|---|---|---|
| DESIGN-001 | 3層アクション定義 | frontmatter の repair_actions を確認 |
| DESIGN-002 | Gitスナップショット | git_snapshot: true なら手順ドキュメントの存在確認 |
| DESIGN-003 | 修復履歴RAG | repair_history_rag: true なら DB 接続設定を検索 |

### Step 5: レポート出力

以下の形式でレポートを出力する:

```
## Observability Audit Report

Pattern: X (infrastructure x architecture)
Date: YYYY-MM-DD

| カテゴリ | ID | 項目 | 状態 | 備考 |
|---------|-----|------|------|------|
| ログ | LOG-001 | Pino導入 | OK/WARN/NG | 詳細 |
| ... | ... | ... | ... | ... |

### サマリ
- OK: N 項目
- WARN: N 項目
- NG: N 項目

### 推奨アクション (NG/WARN のみ)
1. [NG] TRACE-001: OTel SDK導入 — `npm install @opentelemetry/sdk-node`
2. [WARN] LOG-002: prettifier — 本番環境では無効化
```

NG が 0 件の場合: 「全項目が設計に準拠しています」と表示。

## reference ファイル

| ファイル | 内容 |
|---------|------|
| `./reference/audit-checklist.md` | 全検査項目の詳細定義(検査方法, OK/WARN/NG 基準, 修正提案) |
```

**Step 2: 行数確認**

Run: `wc -l plugins/observability/skills/observability-audit/SKILL.md`
Expected: 120行前後 (500行以下を確認)

**Step 3: Commit**

```bash
git add plugins/observability/skills/observability-audit/SKILL.md
git commit -m "feat(observability): add observability-audit skill"
```

---

### Task 8: marketplace.json への追加

**Files:**
- Modify: `.claude-plugin/marketplace.json`

**Step 1: marketplace.json を読み込む**

Run: `cat .claude-plugin/marketplace.json`

**Step 2: plugins 配列に observability エントリを追加**

```json
{
  "name": "observability",
  "description": "AI自己修復システムの観測系設計セットアップと継続監査",
  "version": "1.0.0",
  "author": { "name": "naoto24kawa" },
  "source": "./plugins/observability",
  "category": "productivity"
}
```

**Step 3: Commit**

```bash
git add .claude-plugin/marketplace.json
git commit -m "feat(observability): register plugin in marketplace.json"
```

---

### Task 9: 動作確認

**Step 1: スキルファイルの構造確認**

Run: `find plugins/observability -type f | sort`
Expected:
```
plugins/observability/skills/observability-audit/SKILL.md
plugins/observability/skills/observability-audit/reference/audit-checklist.md
plugins/observability/skills/observability-setup/SKILL.md
plugins/observability/skills/observability-setup/reference/pattern-a.md
plugins/observability/skills/observability-setup/reference/pattern-b.md
plugins/observability/skills/observability-setup/reference/pattern-c.md
plugins/observability/skills/observability-setup/reference/pattern-d.md
plugins/observability/skills/observability-setup/reference/pino-otel-setup.md
plugins/observability/skills/observability-setup/templates/observability-design.md
```

**Step 2: SKILL.md の frontmatter 検証**

各 SKILL.md の frontmatter に以下が含まれているか確認:
- `name`: ケバブケース
- `description`: トリガーワード含有、1024文字以内
- `allowed-tools`: 必要なツールが列挙
- `user-invocable: true`

Run: `head -10 plugins/observability/skills/observability-setup/SKILL.md`
Run: `head -10 plugins/observability/skills/observability-audit/SKILL.md`

**Step 3: SKILL.md の行数確認**

Run: `wc -l plugins/observability/skills/*/SKILL.md`
Expected: 各ファイル 500行以下

**Step 4: marketplace.json の JSON 構文確認**

Run: `python3 -c "import json; json.load(open('.claude-plugin/marketplace.json'))"`
Expected: エラーなし

---

### Task 10: CLAUDE.md の更新

**Files:**
- Modify: `CLAUDE.md`

**Step 1: プラグイン構成テーブルに observability を追加**

`## アーキテクチャ` > `### プラグイン構成 (marketplace.json)` のテーブルに行を追加:

```
| observability | 1.0.0 | 2 | 0 | productivity | 観測系設計セットアップ + 継続監査 |
```

**Step 2: ディレクトリ構造セクションに observability を追加**

**Step 3: スキル実行例に追加**

```bash
# Observability系 (2スキル)
/skill observability:observability-setup
/skill observability:observability-audit
```

**Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add observability plugin to CLAUDE.md"
```
