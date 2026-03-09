# AIアプリ自己修復システム 観測系・構成ガイド

---

## 1. 確定構成

### ツール一覧

| コンポーネント | AWS | Cloudflare |
|---|---|---|
| ログ収集 | Pino → CloudWatch Logs | Pino → Workers Logs |
| 分散トレース | AWS X-Ray | Workers Tracing + Axiom |
| アラート | CloudWatch Alarms | Axiom のアラート機能 |
| 承認フロー | Slack Bolt | Slack Bolt |
| 修復履歴ストア | PostgreSQL (Aurora) | PostgreSQL (Supabase) |
| アクション実行・状態管理 | Temporal | Temporal |
| PR生成 | GitHub API + Claude API | GitHub API + Claude API |
| スナップショット | Git | Git |

### 4パターンの組み合わせ

| | 単一アプリ | マイクロサービス |
|---|---|---|
| **AWS** | パターンA | パターンB |
| **Cloudflare** | パターンC | パターンD |

ツール自体は4パターンとも共通。変わるのは設計上の3点のみ（後述）。

---

## 2. パターン別の設計差分

### 変わる3点

#### ① trace_id / span_id

| | 単一アプリ | マイクロサービス |
|---|---|---|
| 必要性 | 任意（推奨） | **必須** |
| 理由 | リクエスト単位の追跡に使う | サービス間の連鎖を辿らないと根本原因を特定できない |

単一アプリでもOpenTelemetry SDKを組み込んでおくと、後でマイクロサービスに移行するときにコードを流用できる。

#### ② 修復AIへの入力

| | 単一アプリ | マイクロサービス |
|---|---|---|
| 修復AIへの入力 | エラーログ単体 | 分散トレース全体 |
| 修復の基本方針 | 壊れたコンポーネントを直す | 壊れた連鎖の根本を特定してから直す |

マイクロサービスでエラーログ単体だけ渡すと、根本原因でないサービスに対して修復アクションを実行するリスクがある。

**例：** Notification ServiceのエラーがJob Serviceのタイムアウト起因だった場合、Notification Serviceを再起動しても意味がない。

#### ③ 修復履歴ストアのキー設計

| | 単一アプリ | マイクロサービス |
|---|---|---|
| キー構成 | `component + エラー種別のハッシュ` | `サービス間の組み合わせパターンも含む` |
| 理由 | 単一コンポーネントで完結する | 同じエラーでも連鎖パターンが違えば修復手順が異なる |

---

## 3. パターン別の詳細

### パターンA：AWS × 単一アプリ

```
アプリ（Pino + OpenTelemetry SDK）
  ↓ ログ
CloudWatch Logs
  ↓ エラー率が閾値超過
CloudWatch Alarms
  ↓ 修復AIを起動
修復AI → RepairLog生成（エラーログ単体を入力）
  ↓
Slack Bolt（承認フロー）
  ↓ 承認
Temporal（アクション実行・状態管理）
  ↓
GitHub API + Claude API（PR生成）/ インフラ操作 / 設定変更
  ↓ 不可逆アクション前
Git（スナップショット）
```

**設計上の注意点**
- `trace_id` はOpenTelemetry SDKで付与しておく（マイクロサービス移行時に流用できる）
- `affected_users` は自前でセッションログから集計するか、RepairLogスキーマから省略する

---

### パターンB：AWS × マイクロサービス

```
各サービス（Pino + OpenTelemetry SDK）
  ↓ ログ + トレース
CloudWatch Logs + AWS X-Ray
  ↓ エラー率が閾値超過
CloudWatch Alarms
  ↓ 修復AIを起動
修復AI → RepairLog生成（分散トレース全体を入力）
  ↓ root_cause_serviceを特定してからアクション判断
Slack Bolt（承認フロー）
  ↓ 承認
Temporal（アクション実行・状態管理）
  ↓
GitHub API + Claude API（PR生成）/ インフラ操作 / 設定変更
  ↓ 不可逆アクション前
Git（スナップショット）
```

**設計上の注意点**
- `trace_id` / `span_id` は必須。OpenTelemetry SDKをすべてのサービスに組み込む
- `blast_radius` の評価にサービス依存グラフが必要。事前に定義しておく
- 修復履歴ストアのキーにサービス間の組み合わせパターンを含める
- SYSTEM_PROMPTに「分散トレースを参照して `root_cause_service` を特定してからアクションを選ぶ」旨を明記する

---

### パターンC：Cloudflare × 単一アプリ

```
アプリ（Pino + OpenTelemetry SDK）
  ↓ ログ
Workers Logs
  ↓ トレース（OTLPエクスポート）
Axiom
  ↓ エラー率が閾値超過
Axiom アラート
  ↓ 修復AIを起動
修復AI → RepairLog生成（エラーログ単体を入力）
  ↓
Slack Bolt（承認フロー）
  ↓ 承認
Temporal（アクション実行・状態管理）
  ↓
GitHub API + Claude API（PR生成）/ インフラ操作 / 設定変更
  ↓ 不可逆アクション前
Git（スナップショット）
```

**設計上の注意点**
- Workers TracingはOTLPエクスポートでAxiomに流す構成
- Workers Tracing自体は2026年3月時点でオープンベータのため、本番投入前に安定性を確認する
- 修復履歴ストアはSupabase（PostgreSQL）。Cloudflare WorkersからHTTPS経由で接続する

---

### パターンD：Cloudflare × マイクロサービス

```
各サービス（Pino + OpenTelemetry SDK）
  ↓ ログ + トレース
Workers Logs + Workers Tracing
  ↓ OTLPエクスポート
Axiom
  ↓ エラー率が閾値超過
Axiom アラート
  ↓ 修復AIを起動
修復AI → RepairLog生成（分散トレース全体を入力）
  ↓ root_cause_serviceを特定してからアクション判断
Slack Bolt（承認フロー）
  ↓ 承認
Temporal（アクション実行・状態管理）
  ↓
GitHub API + Claude API（PR生成）/ インフラ操作 / 設定変更
  ↓ 不可逆アクション前
Git（スナップショット）
```

**設計上の注意点**
- パターンBと同様に `trace_id` / `span_id` 必須・依存グラフ事前定義・修復履歴ストアのキー設計が必要
- Workers TracingのオープンベータステータスはパターンCと同様。マイクロサービスで複数Workerをまたぐトレースの安定性は特に注意して検証する
- 修復履歴ストアはSupabase。複数サービスからの同時書き込みを考慮してコネクションプーリングを設定する（Supabase TransactionモードのPgBouncer推奨）

---

## 4. 共通の設計原則

単一アプリ・マイクロサービス・AWS・Cloudflareにかかわらず変わらない原則。

**修復アクションは3層で定義する**

| 層 | アクション例 | 承認 |
|---|---|---|
| 即時実行 | サービス再起動・キャッシュクリア | 不要 |
| 承認実行 | PRマージ・スケールアップ | Slack Boltで承認 |
| 提案のみ | インフラ構成変更・DBマイグレーション | 人間が手動実行 |

**不可逆アクションには必ずGitスナップショットをセットにする**

承認実行・提案のみの層に属するアクションは、実行前にGitで現在の設定・コードをコミットしてからアクションを実行する。効果がなければ `git revert` でロールバックする。

**修復履歴はRAGの知識ベースとして機能させる**

過去の修復パターン（エラー種別・実行アクション・成否）をPostgreSQLに蓄積し、修復AIが同種のエラーに遭遇したときに参照することで精度を上げる。
