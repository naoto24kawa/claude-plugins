---
name: dev-process-setup
description: This skill should be used when the user asks to "dev-processを導入して", "開発プロセスをセットアップして", "プロジェクトにプロセス基盤を入れて", "Issue/PRテンプレートを作って", "開発規約をCLAUDE.mdに追加して", "GitHub Actionsの品質ゲートを設定して", "dev-process-setupを実行して", "ラベル体系を作って", "docs/specsを初期化して". プロジェクトにIssue/PRテンプレート、CLAUDE.md開発規約、GitHub Actions品質ゲート、docs/specs構造、ラベル体系を一括導入する初回セットアップスキル。再実行で差分更新も可能。
allowed-tools: [Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion]
user-invocable: true
---

# Dev Process Setup

プロジェクトに開発プロセス基盤を導入する。再実行で差分更新も可能。

## 生成物一覧

| 生成物 | 配置先 | 内容 |
|--------|--------|------|
| 開発規約 | CLAUDE.md (セクション追記) | コミット規約、Issue/PR/docs/specsルール |
| Issueテンプレート | .github/ISSUE_TEMPLATE/specification.yml | 概要、背景、受け入れ条件、影響範囲 |
| PRテンプレート | .github/PULL_REQUEST_TEMPLATE.md | closes、変更概要、受け入れ条件充足、仕様変更点 |
| PR品質ゲート | .github/workflows/pr-check.yml | closes必須、コミットlint、frontmatter検証 |
| 週次チェック | .github/workflows/weekly-check.yml | リンク切れ、draft放置、放置Issue |
| ラベル | GitHub Labels (gh CLI) | type:*, priority:*, status:*, area:* |
| docs構造 | docs/specs/README.md | ディレクトリ説明と運用ルール |

## テンプレートオーバーライド

```
優先順位:
1. .dev-process/templates/<file>   <- プロジェクト固有(あれば優先)
2. プラグイン内 generators/<file>  <- デフォルト
```

各ステップで生成物を書き出す前に `.dev-process/templates/` に同名ファイルがあるか Glob で確認する。あればそちらを Read して使用する。

## ワークフロー

### Step 1: プロジェクト分析

以下を Glob で調査する:

- 言語/フレームワーク検出: Glob で `package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml` を検索
- 既存 CLAUDE.md: Glob で `CLAUDE.md` を検索
- 既存テンプレート: Glob で `.github/ISSUE_TEMPLATE/*`, `.github/PULL_REQUEST_TEMPLATE.md` を検索
- docs/specs の有無: Glob で `docs/specs/*.md` を検索
- GitHub Actions の有無: Glob で `.github/workflows/*.yml` を検索

**Verification**: プロジェクトの現状が把握できた

### Step 2: 差分検出 & 生成計画

Step 1 の結果から、以下を一覧化してユーザーに提示する:

```
生成計画:
- [新規] .github/ISSUE_TEMPLATE/specification.yml
- [新規] .github/PULL_REQUEST_TEMPLATE.md
- [新規] .github/workflows/pr-check.yml
- [新規] .github/workflows/weekly-check.yml
- [追記] CLAUDE.md - Dev Process Rules セクション
- [新規] docs/specs/README.md
- [実行] GitHub ラベル作成
```

既存ファイルがある場合は `[更新]` と表示し、何が変わるか説明する。

AskUserQuestion で承認を得る: 「この計画で進めますか?」

**Verification**: ユーザーが生成計画を承認した

**Error Handling**:
- ユーザーが一部のみ希望: 指定された項目のみ生成

### Step 3: CLAUDE.md に開発規約セクションを追記

`generators/claude-md-rules.md` (またはオーバーライド) を Read し、CLAUDE.md に追記する。

ルール:
- 既存 CLAUDE.md がある場合: `# Dev Process Rules` セクションが既にあれば置換、なければ末尾に追記
- 既存 CLAUDE.md がない場合: 新規作成

**Verification**: CLAUDE.md に `# Dev Process Rules` セクションが存在する

### Step 4: Issue テンプレート生成

`generators/issue-template.md` を Read し、`.github/ISSUE_TEMPLATE/specification.yml` に Write する。

```bash
mkdir -p .github/ISSUE_TEMPLATE
```

**Verification**: `.github/ISSUE_TEMPLATE/specification.yml` が存在する

**Error Handling**:
- 既存テンプレートあり: ユーザーに上書き確認

### Step 5: PR テンプレート生成

`generators/pr-template.md` (またはオーバーライド) を Read し、`.github/PULL_REQUEST_TEMPLATE.md` に Write する。

```bash
mkdir -p .github
```

**Verification**: `.github/PULL_REQUEST_TEMPLATE.md` が存在する

**Error Handling**:
- 既存テンプレートあり: ユーザーに上書き確認

### Step 6: GitHub Actions ワークフロー生成

`generators/actions-pr-check.md` と `generators/actions-weekly.md` を Read し、それぞれ `.github/workflows/` に Write する。

```bash
mkdir -p .github/workflows
```

**Verification**: `.github/workflows/pr-check.yml` と `.github/workflows/weekly-check.yml` が存在する

### Step 7: docs/specs 構造の初期化

```bash
mkdir -p docs/specs
```

`docs/specs/README.md` を生成する。内容はプロジェクト名と運用ルールの説明。

**Verification**: `docs/specs/README.md` が存在する

**Error Handling**:
- 既存の docs/specs/ あり: README.md のみ追加/更新、既存ファイルは保持

### Step 8: ラベル体系の作成

`generators/labels.md` (またはオーバーライド) を Read し、定義されたラベルを `gh label create --force` で作成する。

area ラベルはプロジェクト固有のため、AskUserQuestion でユーザーに確認してから作成する。

**Verification**: `gh label list` でラベルが存在する

**Error Handling**:
- gh CLI 未認証: `gh auth login` を案内
- ラベル既存: `--force` で上書き(色・説明を更新)

### Step 9: 検証と完了報告

生成物の一覧を表示する:

```
セットアップ完了:
- [x] CLAUDE.md - Dev Process Rules セクション追記
- [x] .github/ISSUE_TEMPLATE/specification.yml
- [x] .github/PULL_REQUEST_TEMPLATE.md
- [x] .github/workflows/pr-check.yml
- [x] .github/workflows/weekly-check.yml
- [x] docs/specs/README.md
- [x] GitHub ラベル (type:*, priority:*, status:*)

次のステップ:
1. 生成物を確認してコミットしてください
2. docs/specs/ の初期コンテンツを作成するには spec-sync を実行してください
3. プロセスの健全性を確認するには process-audit を実行してください
```

**Verification**: 全生成物が配置されている

## テンプレートファイル (generators/)

各ステップで Read して使用するデフォルトテンプレート:

- **`generators/claude-md-rules.md`** - CLAUDE.md に注入する開発プロセス規約
- **`generators/issue-template.md`** - GitHub Issue フォームテンプレート (YAML)
- **`generators/pr-template.md`** - Pull Request テンプレート
- **`generators/actions-pr-check.md`** - PR 品質ゲート GitHub Actions ワークフロー
- **`generators/actions-weekly.md`** - 週次プロセスチェック GitHub Actions ワークフロー
- **`generators/labels.md`** - ラベル体系定義 (名前、色、説明)
