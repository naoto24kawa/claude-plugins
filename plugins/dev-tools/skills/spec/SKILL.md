---
name: spec
description: This skill should be used when the user asks anything related to specification documents: generating ("仕様書を生成して", "specを作って", "仕様書を作成", "コードベースから仕様書", "specification generation", "generate specs", "generate documentation from code", "仕様書の自動生成"), drift detection ("乖離チェックして", "仕様とコードがずれてないか確認して", "仕様の乖離を検出して", "ドリフトレポートを出して", "仕様書の整合性を確認して", "specとコードを比較して"), or incremental updates ("PRの差分を仕様書に反映して", "仕様書を差分更新して", "update specs from PR", "仕様書をPRに合わせて更新", "ブランチの差分から仕様書を更新", "仕様書を部分更新して").
allowed-tools: [Task, Bash, Read, Write, Glob, Grep, AskUserQuestion]
user-invocable: true
---

# Spec — Specification Document Skill

仕様書の生成・乖離チェック・差分更新を1つのスキルで担う。ユーザーの意図を自然言語から読み取り、3つのモードのいずれかを実行する。

## モード判定

ユーザーの発言からモードを判定して対応するセクションに進む。

| モード | トリガー例 |
|--------|-----------|
| **Generate** (全体生成) | "仕様書を生成して" / "specを作って" / "初回生成" / "コードから仕様書" |
| **Drift** (乖離チェック) | "乖離チェック" / "仕様とコードがずれてないか" / "drift" / "整合性確認" |
| **Update** (差分更新) | "PRの差分を反映" / "差分更新" / "#51 を反映" / "incremental update" |

不明な場合はユーザーに確認する:
> "仕様書の操作モードを選んでください: (1) 全体生成 (2) 乖離チェック (3) PR/差分更新"

---

## Mode: Generate — 仕様書全体生成

コードベースから9フェーズで仕様書を生成する。このモードでは直接コード解析は行わず、Task ツールで専門エージェントを順次起動して結果を統合する。

### 設計原則

- **ファイルベースの連携**: フェーズ間はMarkdownファイルで情報を受け渡す
- **推定マーク**: 不確かな情報には `⚠️ 推定` を付けて確定事実と区別する
- **人間レビューポイント**: Phase 1完了後（必須）とPhase 8完了後（推奨）でユーザーレビューを挟む

### 出力ディレクトリ

1. ユーザーが指定した場合はそれを使用
2. デフォルト: `docs/specs/`

実行前に出力ディレクトリが存在しなければ作成する。

### 実行フロー

**Step 1: Foundation (Phase 0-1)**

1. **Phase 0** — `spec-phase0-context` エージェントを Task で起動
   - プロンプト: "Generate repository context. Output: `{OUTPUT_DIR}/_context.md`"
   - 完了報告: "Phase 0 完了: `{OUTPUT_DIR}/_context.md`"

2. **Phase 1** — `spec-phase1-overview` エージェントを Task で起動
   - プロンプト: "Generate system overview. Prerequisites: `{OUTPUT_DIR}/_context.md`. Output: `{OUTPUT_DIR}/00-overview.md`"
   - 完了報告: "Phase 1 完了: `{OUTPUT_DIR}/00-overview.md`"

3. **STOP** — ユーザーレビューを依頼してから先に進む
   > "`{OUTPUT_DIR}/00-overview.md` をレビューしてください。プロジェクトの目的・用語集・機能一覧が正しいか確認をお願いします。問題なければ続行します。"

**Step 2: 詳細解析 (Phase 2-7)**

ユーザー承認後、順次実行:

4. **Phase 2** — `spec-phase2-architecture`
   - プロンプト: "Generate architecture doc. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/01-architecture.md`"

5. **Phase 3** — `spec-phase3-datamodel`
   - プロンプト: "Generate data model doc. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/02-data-model.md`"

6. **Phase 4** — `spec-phase4-api`
   - プロンプト: "Generate API specification. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/03-api-specification.md`"
   - APIが存在しない場合はスキップして Phase 5 へ

7. **Phase 5** — `spec-phase5-usecases`
   - プロンプト: "Generate use case docs. Prerequisites: `{OUTPUT_DIR}/00-overview.md`, `{OUTPUT_DIR}/01-architecture.md`. Output directory: `{OUTPUT_DIR}/04-usecases/`"

8. **Phase 6** — `spec-phase6-rules`
   - プロンプト: "Extract business rules. Prerequisites: `{OUTPUT_DIR}/00-overview.md`, `{OUTPUT_DIR}/01-architecture.md`. Output: `{OUTPUT_DIR}/05-business-rules.md`"

9. **Phase 7** — `spec-phase7-nonfunctional`
   - プロンプト: "Estimate non-functional requirements. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/06-non-functional.md`"

各Phase完了後に "Phase N 完了: `{file_path}`" を報告する。

**Step 3: 最終整合性チェック (Phase 8)**

10. **Phase 8** — `spec-phase8-index`
    - プロンプト: "Generate index and check consistency of all docs in `{OUTPUT_DIR}/`. Output: `{OUTPUT_DIR}/_index.md`"

11. **最終レビュー依頼**
    > "全Phaseが完了しました。`{OUTPUT_DIR}/_index.md` にインデックスと整合性チェック結果があります。最終確認をお願いします。"

### 出力構造

```
{OUTPUT_DIR}/
├── _context.md              # Phase 0: リポジトリコンテキスト
├── _index.md                # Phase 8: インデックス + 整合性レポート
├── 00-overview.md           # Phase 1: システム概要
├── 01-architecture.md       # Phase 2: アーキテクチャ
├── 02-data-model.md         # Phase 3: データモデル
├── 03-api-specification.md  # Phase 4: API仕様
├── 04-usecases/             # Phase 5: ユースケース
│   ├── _index.md
│   └── UC-XXX-*.md
├── 05-business-rules.md     # Phase 6: ビジネスルール
└── 06-non-functional.md     # Phase 7: 非機能要件
```

### エラーハンドリング

- エージェントがエラーを返した場合、内容をユーザーに報告して指示を仰ぐ
- Phase 4 がAPIなしを報告した場合、スキップを記録してPhase 5へ進む
- `⚠️ 推定` が多数出現した場合、不確実性レベルをユーザーに警告する

### 個別Phase再実行

特定Phaseのみ再実行する場合は、対応するエージェントをTaskで直接起動する。前提となるPhaseの出力が既に存在していること。

参照: **`../../references/phase-mapping.md`** — Phase別エージェント一覧（前提条件・出力先・プロンプト形式）

---

## Mode: Drift — 仕様書とコードの乖離チェック

`docs/specs/` の仕様ドキュメントとコードベースの実態を比較し、乖離をレポートする。

### 前提条件

- 仕様ディレクトリ（デフォルト: `docs/specs/`）が存在すること
- 存在しない場合は Generate モードの実行を案内する

### 出力ディレクトリ

1. ユーザーが指定した場合はそれを使用
2. デフォルト: `docs/specs/`

### 実行フロー

**Step 1: 全仕様ファイルの読み込み**

Glob で仕様ディレクトリ内の `*.md` ファイルを検索し Read する。内部ファイル（`_context.md`, `_index.md`）はスキップ。

frontmatter の `type`, `area`, `doc_status` を抽出して構造を把握する。`doc_status: deprecated` はチェック対象外として別途列挙する。

ファイルが存在しない場合は Generate モードの実行を案内して終了。

**Step 2: コード実態との比較**

各ドキュメントの `type` に応じた比較方法を適用する:

- **data-model**: 仕様のテーブル/カラム ↔ schema.ts / migrations / prisma
- **api**: 仕様のエンドポイント ↔ ルーティング定義（`app.get`, `router.post`, `@Get` 等）
- **feature / usecase**: 仕様の機能一覧 ↔ 実装コード（双方向で未記載を検出）
- **architecture**: 仕様のモジュール一覧 ↔ 実際のディレクトリ構造（Glob）
- **business-rules**: 仕様の定数・バリデーション値 ↔ コード内の定数定義
- **non-functional**: 仕様の設定値・ライブラリ ↔ コード実装
- **overview**: 仕様の技術スタック・バージョン ↔ package.json / go.mod 等
- **その他（screen, batch, integration）**: 主要セクションのキー要素 ↔ コード実装

**Step 3: 未文書化の機能領域の検出**

Glob ツールで `src/*`、`app/*`、`lib/*`、`packages/*` 等のパターンを検索してトップレベルのディレクトリ一覧を取得する。

各ディレクトリの機能領域を推定し、仕様の `area` 一覧と照合して未文書化領域を検出する。

**Step 4: frontmatter 整合性チェック**

- `related`: 参照先ファイルの実在確認（Glob）
- `related_tables`: テーブル名のコード内実在確認（Grep）
- `related_apis`: APIパスのコード内実在確認（Grep）

**Step 5: レポート出力**

レポートを `{OUTPUT_DIR}/_drift-report.md` に保存し、パスをユーザーに通知する。大規模リポジトリでは乖離件数が多くなるためインライン表示はしない。
ユーザーが「画面に表示して」と明示した場合のみインライン出力する。

```markdown
# Spec Drift Report

**検査日**: YYYY-MM-DD
**仕様ディレクトリ**: docs/specs/
**検査ファイル数**: N 件

## 乖離なし
- 00-overview.md
- 01-architecture.md

## 乖離あり
### 02-data-model.md
- [仕様にあり/実装になし] usersテーブルのemail_verified カラム
- [実装にあり/仕様になし] sessionsテーブルのdevice_info カラム

### 03-api-specification.md
- [実装にあり/仕様になし] DELETE /api/users/:id エンドポイント

## frontmatter 不整合
- 02-data-model.md: related_tables に "audit_logs" があるがコードに未検出

## 未文書化の機能領域
- notification (実装はあるが仕様ファイルなし)

## deprecated ドキュメント
- (なし、またはリスト)

## 推奨アクション
- [ ] Update モードで差分を反映する
- [ ] Generate モードで全体を再生成する
```

---

## Mode: Update — PR/ブランチ差分から仕様書を差分更新

コード変更（PRまたはブランチdiff）を解析して影響するPhaseのみ再実行する。全体生成より高速。

### 前提条件チェック

実行前に以下を確認する:

1. `docs/specs/`（またはユーザー指定ディレクトリ）が存在するか
2. `_context.md` と `00-overview.md` が存在するか
3. いずれかが不足する場合: "仕様書がまだ生成されていません。先に Generate モードで全体生成を実行してください。" と伝えて終了

### 出力ディレクトリ

1. ユーザーが指定した場合はそれを使用
2. デフォルト: `docs/specs/`

### 入力解決

まずデフォルトブランチを検出する:

```bash
git symbolic-ref refs/remotes/origin/HEAD | sed 's|refs/remotes/origin/||'
```

`main` にフォールバック（存在しなければ `master`）。

| 入力形式 | 例 | 解決方法 |
|----------|----|---------| 
| PR番号 | `#51`, `51` | `gh pr diff 51` |
| PR URL | `https://github.com/org/repo/pull/51` | PR番号を抽出して `gh pr diff 51` |
| ブランチ名 | `feat/my-feature` | `git diff {DEFAULT_BRANCH}...feat/my-feature` |
| 入力なし | (なし) | `git diff {DEFAULT_BRANCH}...HEAD` |

### 実行フロー

**Step 1: 差分と変更ファイルを取得**

1. diff取得:
   - PR: `gh pr diff {PR_NUMBER}`
   - ブランチ/デフォルト: `git diff {BASE}...{TARGET}`
   - 失敗した場合は代替コマンドを試みる

2. 変更ファイル一覧取得:
   - PR: `gh pr view {PR_NUMBER} --json files --jq '.files[].path'`
   - ブランチ/デフォルト: `git diff {BASE}...{TARGET} --name-only`

3. ユーザーへ報告: "差分を取得しました。変更ファイル数: N 件"

**Step 2: 変更ファイルを影響Phaseにマッピング**

**`../../references/file-phase-mapping.md`** のルールを適用する（存在しない場合は下記の原則を使用）:

- データ層の変更（DB / ORM / migrations）→ Phase 3
- コアビジネスロジックの変更 → Phase 2, 5, 6
- API / ハンドラの変更 → Phase 4, 5
- インフラ / 設定の変更 → Phase 7
- パッケージ / 依存関係の変更 → Phase 1
- ドキュメントのみの変更（README.md, CHANGELOG.md 等）→ スキップ

パターンに該当しない場合はコードベース内の役割から判断する。本当に不明な場合はユーザーに確認する。

**Step 3: 最終Phaseセットを決定**

1. **常に含める**: Phase 0（コンテキスト）と Phase 8（インデックス）
2. **Phase 1 の条件追加**: 他Phase（2-7）が3つ以上影響を受ける場合はPhase 1も含める
3. **全体再生成しきい値**: Phase 2-7 の全てが影響を受ける場合はユーザーに確認:
   > "全てのPhase(2-7)が影響を受けています。Generate モードで全体再生成を実行しますか? それともこのまま差分更新を続けますか?"

4. 実行計画をユーザーに報告:
   > "以下のPhaseを再実行します: Phase 0, Phase 2, Phase 5, Phase 8（各Phaseのトリガーとなったファイルを列挙）"

**Step 4: 影響Phaseのエージェントを実行**

Phase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 の順で、影響Phaseのみ実行（スキップPhaseは既存ファイルをそのまま使用）:

- **Phase 0**: `spec-phase0-context` — "Generate repository context. Output: `{OUTPUT_DIR}/_context.md`"
- **Phase 1**: `spec-phase1-overview` — "Generate system overview. Prerequisites: `{OUTPUT_DIR}/_context.md`. Output: `{OUTPUT_DIR}/00-overview.md`"
- **Phase 2**: `spec-phase2-architecture` — "Generate architecture doc. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/01-architecture.md`"
- **Phase 3**: `spec-phase3-datamodel` — "Generate data model doc. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/02-data-model.md`"
- **Phase 4**: `spec-phase4-api` — "Generate API specification. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/03-api-specification.md`"（APIなしの場合はスキップ）
- **Phase 5**: `spec-phase5-usecases` — "Generate use case docs. Prerequisites: `{OUTPUT_DIR}/00-overview.md`, `{OUTPUT_DIR}/01-architecture.md`. Output directory: `{OUTPUT_DIR}/04-usecases/`"
- **Phase 6**: `spec-phase6-rules` — "Extract business rules. Prerequisites: `{OUTPUT_DIR}/00-overview.md`, `{OUTPUT_DIR}/01-architecture.md`. Output: `{OUTPUT_DIR}/05-business-rules.md`"
- **Phase 7**: `spec-phase7-nonfunctional` — "Estimate non-functional requirements. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/06-non-functional.md`"
- **Phase 8**: `spec-phase8-index` — "Generate index and check consistency of all docs in `{OUTPUT_DIR}/`. Output: `{OUTPUT_DIR}/_index.md`"

**Step 5: サマリーレポート**

```
## 差分更新完了

- 差分ソース: PR #51 (またはブランチ名等)
- 変更ファイル数: N 件
- 実行Phase: Phase 0, 2, 5, 8
- 更新されたドキュメント:
  - `{OUTPUT_DIR}/_context.md` (Phase 0)
  - `{OUTPUT_DIR}/01-architecture.md` (Phase 2)
  - `{OUTPUT_DIR}/04-usecases/` (Phase 5)
  - `{OUTPUT_DIR}/_index.md` (Phase 8)

`{OUTPUT_DIR}/_index.md` で整合性チェック結果を確認してください。
```

### エラーハンドリング

- エージェントエラー: 内容をユーザーに報告して指示を仰ぐ
- Phase 4 がAPIなし: スキップを記録して次のPhaseへ
- diff コマンド失敗: 代替アプローチを試みる（`gh pr diff` 失敗 → `git diff origin/{DEFAULT_BRANCH}...HEAD`）
- 変更ファイルが見つからない: "差分が見つかりませんでした。ブランチやPR番号を確認してください。" と伝える

---

## リファレンスファイル

- **`../../references/phase-mapping.md`** — Phase別エージェント一覧（前提条件・出力先・プロンプト形式）
- **`../../references/frontmatter-schema.md`** — frontmatter の必須/オプションフィールド定義、doc_status 遷移ルール
- **`../../references/spec-template.md`** — type別の仕様ドキュメントテンプレート
- **`../../references/file-phase-mapping.md`** — ファイルパスからPhaseへのマッピングルール（Update モードで使用）
