---
name: spec-sync
description: This skill should be used when the user asks to "仕様を書き起こして", "仕様を更新して", "乖離チェックして", "docs/specsを生成して", "spec-syncを実行して", "仕様とコードがずれてないか確認して", "仕様ドキュメントを作って", "PRの仕様を更新して". docs/specs/ のストック型仕様ドキュメントの初回生成、PR連動更新、仕様-コード乖離検出をAI判断で行う。
allowed-tools: [Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion]
user-invocable: true
---

# Spec Sync

docs/specs/ のストック型仕様ドキュメントを管理する。3つのモードを持つ。

## 前提条件

- docs/specs/ ディレクトリが存在すること
- 存在しない場合は `dev-process-setup` の実行を案内する

## モード選択

ユーザーの意図に応じてモードを判定する。曖昧な場合は質問する。

| モード | トリガー |
|--------|---------|
| A. 初回生成 | "仕様を書き起こして" "docs/specsを生成して" |
| B. PR連動更新 | "仕様を更新して" "PRの仕様を更新して" |
| C. 乖離検出 | "乖離チェックして" "ずれてないか確認して" |

## モード A: 初回生成

### Step 1: コードベース分析

Glob でソースファイルを検索し、ディレクトリ構成から機能領域を特定する:

- Glob で `src/**/*.ts`, `app/**/*.py`, `**/*.go` 等を検索
- Glob で `docs/specs/*.md` の既存ファイルを確認
- Grep でルーティング定義、モデル定義、主要な export を検索

**Verification**: 機能領域の一覧が作成できた

### Step 2: area 一覧の提示

検出した機能領域を一覧化してユーザーに提示する。

```
検出した機能領域:
- auth (認証・認可)
- job-management (求人管理)
- notification (通知)

この一覧で docs/specs/ のドラフトを生成しますか?
追加・削除があれば指定してください。
```

**Verification**: ユーザーが area 一覧を承認した

**Error Handling**:
- area が検出できない場合: ユーザーに手動で機能領域を列挙してもらう

### Step 3: ドラフト生成

各 area ごとに `docs/specs/<area>.md` を生成する。

frontmatter は `references/frontmatter-schema.md` に準拠する。
本文構成は `references/spec-template.md` に従う。

全ファイルを `doc_status: draft` で生成する。

**Verification**: 各ファイルが frontmatter スキーマに準拠している

### Step 4: ユーザー確認

生成したファイル一覧を提示する。

**Verification**: ユーザーが確認した

## モード B: PR連動更新

### Step 1: 変更内容の把握

```bash
git diff main...HEAD --name-only
git diff main...HEAD --stat
```

**Verification**: 変更されたファイルを把握した

**Error Handling**:
- main ブランチにいる場合: 直近のコミットから差分を取得 (`git diff HEAD~1`)

### Step 2: 影響する仕様の特定

変更されたファイルのパスと内容から、影響する docs/specs/ のファイルを特定する。

各 docs/specs/ ファイルの `area` と `related` を参照して対応関係を判定する。

**Verification**: 影響する仕様ファイルが特定された (またはなし)

### Step 3: 更新案の提示

影響する仕様ファイルの更新案を提示する。

ルール:
- `updated` フィールドを今日の日付に更新する
- 「何がどうなっているか」を更新する
- 「なぜ変えたか」は書かない (それは PR に残す)

**Verification**: ユーザーが更新案を確認した

### Step 4: 更新実行

承認された更新案を適用する。

**Verification**: 更新後のファイルが frontmatter スキーマに準拠している

## モード C: 乖離検出

### Step 1: 全仕様ファイルの読み込み

Glob で `docs/specs/*.md` を検索し、各ファイルを Read して内容を把握する。

**Verification**: 全ファイルを読み込んだ

**Error Handling**:
- docs/specs/ にファイルがない場合: モード A (初回生成) の実行を案内する

### Step 2: コード実態との比較

各仕様の記述について、コードベースの実態と比較する。

チェック観点:
- 仕様に記述されているが実装にない機能
- 実装にあるが仕様に記述されていない機能
- 仕様の記述と実装の挙動が異なる箇所

**Verification**: 比較が完了した

### Step 3: レポート出力

```markdown
# Spec Drift Report

## 乖離なし
- docs/specs/auth.md

## 乖離あり
### docs/specs/job-management.md
- [仕様にあり/実装になし] 一括削除API (記述: 3.2節)
- [実装にあり/仕様になし] 下書き保存機能

## 未文書化の機能領域
- notification (実装はあるが docs/specs/ にファイルなし)
```

**Verification**: レポートがユーザーに提示された

## 記述方針

- 仕様には「何がどうなっているか」を記述する
- 「なぜそうなっているか」は PR/Issue/commit に残す
- この分離により、仕様は事実として信頼でき、変更理由は追跡チェーンで辿れる

## リファレンスファイル (references/)

- **`references/frontmatter-schema.md`** - docs/specs frontmatter の必須/オプションフィールド定義、doc_status 遷移ルール
- **`references/spec-template.md`** - type 別 (feature, api, data-model) の仕様ドキュメントテンプレート
