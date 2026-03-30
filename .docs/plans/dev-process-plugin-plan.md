# dev-process プラグイン実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 個人開発プロジェクトに開発プロセス基盤を再現可能に導入するClaude Codeプラグインを構築する

**Architecture:** 3スキル構成(setup / spec-sync / process-audit)。setupが生成するCLAUDE.md規約が日常運用のランタイムとなり、spec-syncがAI判断による仕様管理、process-auditがメタ監査を担う。テンプレートはプラグイン内蔵のデフォルト + プロジェクト側オーバーライド方式。

**Tech Stack:** Claude Code Plugin(Markdown + YAML frontmatter)、gh CLI、GitHub Actions(YAML)

**Design Doc:** `.docs/plans/dev-process-plugin-design.md`

---

## Task 1: プラグインディレクトリ構造の作成と marketplace.json 登録

**Files:**
- Create: `plugins/dev-process/skills/setup/.gitkeep`
- Create: `plugins/dev-process/skills/spec-sync/.gitkeep`
- Create: `plugins/dev-process/skills/process-audit/.gitkeep`
- Modify: `.claude-plugin/marketplace.json`

**Step 1: ディレクトリ構造を作成**

```bash
mkdir -p plugins/dev-process/skills/setup/generators
mkdir -p plugins/dev-process/skills/spec-sync/references
mkdir -p plugins/dev-process/skills/process-audit/checklists
```

**Step 2: marketplace.json にプラグインエントリを追加**

`.claude-plugin/marketplace.json` の `plugins` 配列末尾に追加:

```json
{
  "name": "dev-process",
  "description": "Development process infrastructure plugin. Sets up CLAUDE.md rules, Issue/PR templates, GitHub Actions quality gates, docs/specs structure, and provides AI-powered spec sync and process auditing for personal projects.",
  "version": "1.0.0",
  "author": {
    "name": "naoto24kawa",
    "email": "naoto24kawa@gmail.com"
  },
  "source": "./plugins/dev-process",
  "category": "productivity"
}
```

marketplace の `version` を `"3.9.0"` にバンプする。

**Step 3: コミット**

```bash
git add plugins/dev-process/ .claude-plugin/marketplace.json
git commit -m "feat(dev-process): プラグインディレクトリ構造の作成と marketplace 登録

refs dev-process-plugin-design.md"
```

---

## Task 2: setup スキル - SKILL.md 作成

**Files:**
- Create: `plugins/dev-process/skills/setup/SKILL.md`

**Step 1: SKILL.md を作成**

```markdown
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
1. .dev-process/templates/<file>   ← プロジェクト固有(あれば優先)
2. プラグイン内 generators/<file>  ← デフォルト
```

各ステップで生成物を書き出す前に `.dev-process/templates/` に同名ファイルがあるか Glob で確認する。あればそちらを Read して使用する。

## ワークフロー

### Step 1: プロジェクト分析

以下を調査する:

```bash
# 言語/フレームワーク検出
ls package.json Cargo.toml go.mod pyproject.toml requirements.txt 2>/dev/null

# 既存 CLAUDE.md
ls CLAUDE.md 2>/dev/null

# 既存テンプレート
ls .github/ISSUE_TEMPLATE/ .github/PULL_REQUEST_TEMPLATE.md 2>/dev/null

# docs/specs の有無
ls docs/specs/ 2>/dev/null

# GitHub Actions の有無
ls .github/workflows/ 2>/dev/null
```

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

`generators/pr-template.md` を Read し、`.github/PULL_REQUEST_TEMPLATE.md` に Write する。

```bash
mkdir -p .github
```

**Verification**: `.github/PULL_REQUEST_TEMPLATE.md` が存在する

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

`generators/labels.md` を Read し、gh CLI でラベルを作成する。

```bash
# type ラベル
gh label create "type:implementation" --color "0E8A16" --description "実装タスク" --force
gh label create "type:research" --color "D4C5F9" --description "調査タスク" --force
gh label create "type:bug" --color "D73A4A" --description "バグ修正" --force
gh label create "type:improvement" --color "A2EEEF" --description "改善" --force
gh label create "type:documentation" --color "0075CA" --description "ドキュメント" --force

# priority ラベル
gh label create "priority:high" --color "B60205" --description "高優先度" --force
gh label create "priority:medium" --color "FBCA04" --description "中優先度" --force
gh label create "priority:low" --color "0E8A16" --description "低優先度" --force

# status ラベル
gh label create "status:ready" --color "0E8A16" --description "着手可能" --force
gh label create "status:in-progress" --color "FBCA04" --description "作業中" --force
gh label create "status:in-review" --color "D4C5F9" --description "レビュー中" --force
```

area ラベルはプロジェクト固有のため、ユーザーに確認してから作成する。

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
```

**Step 2: コミット**

```bash
git add plugins/dev-process/skills/setup/SKILL.md
git commit -m "feat(dev-process): setup スキルの SKILL.md を作成

セットアップワークフロー、テンプレートオーバーライド機構、
9ステップの導入プロセスを定義

refs dev-process-plugin-design.md"
```

---

## Task 3: setup スキル - generators (テンプレート群) 作成

**Files:**
- Create: `plugins/dev-process/skills/setup/generators/claude-md-rules.md`
- Create: `plugins/dev-process/skills/setup/generators/issue-template.md`
- Create: `plugins/dev-process/skills/setup/generators/pr-template.md`
- Create: `plugins/dev-process/skills/setup/generators/actions-pr-check.md`
- Create: `plugins/dev-process/skills/setup/generators/actions-weekly.md`
- Create: `plugins/dev-process/skills/setup/generators/labels.md`

**Step 1: claude-md-rules.md を作成**

CLAUDE.md に注入する開発規約テンプレート。`{{PROJECT_NAME}}` などのプレースホルダーはsetupスキルが置換する。

```markdown
# Dev Process Rules

このセクションは dev-process プラグインにより生成されました。

## Issue ルール

- `.github/ISSUE_TEMPLATE/specification.yml` テンプレートに従い作成する
- 受け入れ条件は検証可能な形式でチェックリスト記述する
- type / area ラベルを付与する
- 関連する要望や調査は `refs #XX` または `refs notion-xxx` で紐付ける

## コミットメッセージ規約

Conventional Commits に準拠する。

```
<type>(<scope>): <subject>

<body>

<footer>
```

| 要素 | 言語 | ルール |
|------|------|--------|
| type | 英語 | feat, fix, docs, refactor, test, chore |
| scope | 英語 kebab-case | 機能領域 (例: job-management, auth) |
| subject | 日本語 | 簡潔に「何をしたか」 |
| body | 日本語 | 「なぜこの実装方法を選んだか」 |
| footer | 英語 | `refs #XX` または `closes #XX` 必須 |

## PR ルール

- `closes #XX` 必須(トレーサビリティの土台)
- 受け入れ条件充足チェックリスト
- 「仕様からの変更点」セクション(なければ「なし」と明記)
- docs/specs 更新有無の明示
- コード変更 + 仕様更新 + テスト を常にセットで含める

## docs/specs ルール

- `docs/specs/` にシステムの現在の姿を記述する
- 「何がどうなっているか」を書く。「なぜ」は PR/Issue に残す
- frontmatter 必須:

```yaml
---
type: feature | api | data-model | screen | batch | integration
title: "日本語タイトル"
area: kebab-case-area
tags: [kebab-case-tag]
doc_status: draft | stable | deprecated
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---
```

- コードに影響する仕様変更は PR にセットで含める

## 言語使い分け

| 要素 | 言語 |
|------|------|
| frontmatter フィールド名、area、tags、ファイル名、ラベル | 英語 |
| 本文、コミット subject/body、Issue/PR description | 日本語 |
```

**Step 2: issue-template.md を作成**

setupスキルが `.github/ISSUE_TEMPLATE/specification.yml` として書き出すテンプレート。

```yaml
name: 仕様書 (Specification)
description: 実装タスクの仕様を記述する
title: "<type>: "
labels: ["type:implementation"]
body:
  - type: dropdown
    id: type
    attributes:
      label: 種類
      options:
        - feat (新機能)
        - fix (バグ修正)
        - change (既存機能の変更)
        - remove (機能削除)
    validations:
      required: true

  - type: textarea
    id: summary
    attributes:
      label: 概要
      description: このタスクで何を実現するかを1-2文で
    validations:
      required: true

  - type: textarea
    id: background
    attributes:
      label: 背景・目的
      description: なぜこの変更が必要か。関連する要望への参照を含む
      placeholder: |
        refs notion-xxx
        refs #XX
    validations:
      required: true

  - type: textarea
    id: acceptance-criteria
    attributes:
      label: 受け入れ条件
      description: 検証可能な条件をチェックリストで記述
      placeholder: |
        - [ ] 条件1
        - [ ] 条件2
        - [ ] 条件3
    validations:
      required: true

  - type: textarea
    id: impact
    attributes:
      label: 影響範囲
      description: 変更が影響するモジュール、画面、APIを記述
    validations:
      required: false

  - type: textarea
    id: related-files
    attributes:
      label: 関連ファイル
      description: 変更対象となるファイルパスや関連するドキュメント
      placeholder: |
        - docs/specs/xxx.md
    validations:
      required: false

  - type: textarea
    id: notes
    attributes:
      label: 備考
      description: 技術的制約、注意事項、参考情報
    validations:
      required: false
```

**Step 3: pr-template.md を作成**

setupスキルが `.github/PULL_REQUEST_TEMPLATE.md` として書き出すテンプレート。

```markdown
## 対応 Issue

closes #

## 変更概要

<!-- 何をどう変更したかの要約 -->

## 受け入れ条件の充足

<!-- Issue の受け入れ条件に対応するチェックリスト -->
- [ ] 条件1
- [ ] 条件2

## 仕様からの変更点

<!-- 実装中に判明した仕様の曖昧さ、追加判断、変更があればここに記述 -->
<!-- なければ「なし」と記述 -->

なし

## 仕様ドキュメント更新

- [ ] docs/specs/ の更新あり
- [ ] 仕様更新の必要なし (理由: )

## テスト

- [ ] 単体テスト追加・更新
- [ ] 手動確認
```

**Step 4: actions-pr-check.md を作成**

setupスキルが `.github/workflows/pr-check.yml` として書き出すワークフロー。

```yaml
name: PR Quality Gate

on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  check-closes-reference:
    name: Check closes reference
    runs-on: ubuntu-latest
    steps:
      - name: Check PR body for closes reference
        uses: actions/github-script@v7
        with:
          script: |
            const body = context.payload.pull_request.body || '';
            const hasCloses = /closes?\s+#\d+/i.test(body);
            if (!hasCloses) {
              core.setFailed('PR body must contain "closes #XX" to link to an Issue.');
            }

  commit-lint:
    name: Commit message lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Check commit messages
        uses: actions/github-script@v7
        with:
          script: |
            const { execSync } = require('child_process');
            const base = context.payload.pull_request.base.sha;
            const head = context.payload.pull_request.head.sha;
            const log = execSync(`git log --format=%s ${base}..${head}`).toString().trim();
            const commits = log.split('\n').filter(Boolean);
            const pattern = /^(feat|fix|docs|refactor|test|chore)(\(.+\))?: .+/;
            const failures = commits.filter(msg => !pattern.test(msg));
            if (failures.length > 0) {
              core.setFailed(
                'Commit messages must follow Conventional Commits:\n' +
                failures.map(f => `  - "${f}"`).join('\n')
              );
            }

  frontmatter-check:
    name: Check docs/specs frontmatter
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check changed spec files
        uses: actions/github-script@v7
        with:
          script: |
            const { execSync } = require('child_process');
            const files = execSync(
              `git diff --name-only --diff-filter=ACMR origin/${{ github.base_ref }}...HEAD -- 'docs/specs/*.md'`
            ).toString().trim().split('\n').filter(Boolean);

            if (files.length === 0) {
              console.log('No docs/specs files changed.');
              return;
            }

            const fs = require('fs');
            const required = ['type', 'title', 'area', 'tags', 'doc_status', 'created', 'updated'];
            const errors = [];

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');
              const match = content.match(/^---\n([\s\S]*?)\n---/);
              if (!match) {
                errors.push(`${file}: frontmatter not found`);
                continue;
              }
              for (const field of required) {
                if (!match[1].includes(`${field}:`)) {
                  errors.push(`${file}: missing required field "${field}"`);
                }
              }
            }

            if (errors.length > 0) {
              core.setFailed('docs/specs frontmatter errors:\n' + errors.join('\n'));
            }
```

**Step 5: actions-weekly.md を作成**

setupスキルが `.github/workflows/weekly-check.yml` として書き出すワークフロー。

```yaml
name: Weekly Process Check

on:
  schedule:
    - cron: '0 9 * * 1'  # 毎週月曜 9:00 UTC
  workflow_dispatch:

jobs:
  weekly-check:
    name: Weekly process health check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check draft specs age
        uses: actions/github-script@v7
        with:
          script: |
            const { execSync } = require('child_process');
            const fs = require('fs');
            const glob = require('@actions/glob');

            const globber = await glob.create('docs/specs/**/*.md');
            const files = await globber.glob();
            const warnings = [];
            const now = new Date();

            for (const file of files) {
              const content = fs.readFileSync(file, 'utf8');
              const match = content.match(/doc_status:\s*draft/);
              if (!match) continue;

              const updatedMatch = content.match(/updated:\s*(\d{4}-\d{2}-\d{2})/);
              if (!updatedMatch) continue;

              const updated = new Date(updatedMatch[1]);
              const days = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
              if (days > 30) {
                warnings.push(`${file}: draft for ${days} days (last updated: ${updatedMatch[1]})`);
              }
            }

            if (warnings.length > 0) {
              core.warning('Long-standing draft specs:\n' + warnings.join('\n'));
            }

      - name: Check stale issues
        uses: actions/github-script@v7
        with:
          script: |
            const issues = await github.rest.issues.listForRepo({
              owner: context.repo.owner,
              repo: context.repo.repo,
              state: 'open',
              sort: 'updated',
              direction: 'asc',
              per_page: 50
            });

            const now = new Date();
            const stale = issues.data.filter(issue => {
              const updated = new Date(issue.updated_at);
              const days = Math.floor((now - updated) / (1000 * 60 * 60 * 24));
              return days > 30;
            });

            if (stale.length > 0) {
              const list = stale.map(i => `  #${i.number}: ${i.title} (${Math.floor((now - new Date(i.updated_at)) / 86400000)}d)`);
              core.warning('Stale issues (30+ days):\n' + list.join('\n'));
            }
```

**Step 6: labels.md を作成**

setupスキルが参照するラベル定義。

```markdown
# ラベル体系

## type (タスク種別)

| ラベル | 色 | 説明 |
|--------|------|------|
| type:implementation | #0E8A16 | 実装タスク |
| type:research | #D4C5F9 | 調査タスク |
| type:bug | #D73A4A | バグ修正 |
| type:improvement | #A2EEEF | 改善 |
| type:documentation | #0075CA | ドキュメント |

## priority (優先度)

| ラベル | 色 | 説明 |
|--------|------|------|
| priority:high | #B60205 | 高優先度 |
| priority:medium | #FBCA04 | 中優先度 |
| priority:low | #0E8A16 | 低優先度 |

## status (進行状態)

| ラベル | 色 | 説明 |
|--------|------|------|
| status:ready | #0E8A16 | 着手可能 |
| status:in-progress | #FBCA04 | 作業中 |
| status:in-review | #D4C5F9 | レビュー中 |

## area (機能領域) - プロジェクト固有

area ラベルはプロジェクトごとに異なる。setup スキル実行時にユーザーに確認して作成する。

例:
- area:auth
- area:job-management
- area:notification
```

**Step 7: コミット**

```bash
git add plugins/dev-process/skills/setup/generators/
git commit -m "feat(dev-process): setup スキルのテンプレート群を作成

CLAUDE.md規約、Issue/PRテンプレート、GitHub Actionsワークフロー、
ラベル定義のデフォルトテンプレートを追加

refs dev-process-plugin-design.md"
```

---

## Task 4: spec-sync スキル - SKILL.md と references 作成

**Files:**
- Create: `plugins/dev-process/skills/spec-sync/SKILL.md`
- Create: `plugins/dev-process/skills/spec-sync/references/frontmatter-schema.md`
- Create: `plugins/dev-process/skills/spec-sync/references/spec-template.md`

**Step 1: SKILL.md を作成**

```markdown
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

```bash
# ディレクトリ構成の把握
find . -type f -name "*.ts" -o -name "*.py" -o -name "*.go" -o -name "*.rs" | head -100

# 既存の docs/specs/ 確認
ls docs/specs/ 2>/dev/null
```

Glob と Grep でコードベースの機能領域を洗い出す。

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

```bash
ls docs/specs/*.md
```

各ファイルを Read して内容を把握する。

**Verification**: 全ファイルを読み込んだ

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
```

**Step 2: frontmatter-schema.md を作成**

```markdown
# docs/specs frontmatter スキーマ

## 必須フィールド

| フィールド | 型 | 説明 | 例 |
|-----------|------|------|-----|
| type | enum | ドキュメント種別 | feature, api, data-model, screen, batch, integration |
| title | string | 日本語タイトル | "認証・認可" |
| area | string | 機能領域 (英語kebab-case) | auth, job-management |
| tags | string[] | タグ (英語kebab-case) | [api, authentication] |
| doc_status | enum | ドキュメント状態 | draft, stable, deprecated |
| created | date | 作成日 (YYYY-MM-DD) | 2026-03-09 |
| updated | date | 更新日 (YYYY-MM-DD) | 2026-03-09 |

## オプションフィールド

| フィールド | 型 | 説明 | 例 |
|-----------|------|------|-----|
| related | string[] | 関連ドキュメント/Issue | ["docs/specs/auth.md", "#123"] |
| related_tables | string[] | 関連テーブル名 | ["users", "sessions"] |
| related_apis | string[] | 関連APIパス | ["/api/auth/login"] |

## doc_status の遷移

```
draft → stable → deprecated
         ↑
         └── draft (大幅改訂時)
```

- **draft**: 初回生成時、大幅改訂時
- **stable**: レビュー完了後
- **deprecated**: 機能廃止時 (ファイルは削除せず状態変更)

## 例

```yaml
---
type: feature
title: "認証・認可"
area: auth
tags: [authentication, authorization, jwt]
doc_status: stable
created: 2026-03-09
updated: 2026-03-15
related:
  - docs/specs/user-management.md
  - "#45"
related_tables: [users, sessions, refresh_tokens]
related_apis: ["/api/auth/login", "/api/auth/refresh"]
---
```
```

**Step 3: spec-template.md を作成**

```markdown
# 仕様ドキュメントテンプレート

type に応じて以下のセクション構成を使う。

## type: feature

```markdown
---
type: feature
title: "<日本語タイトル>"
area: <kebab-case>
tags: []
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
---

# <タイトル>

## 概要

<!-- この機能が何であるかを1-2文で -->

## 機能一覧

<!-- 提供する機能をリストで -->

## 画面・API

<!-- ユーザーインターフェースやAPIエンドポイント -->

## データ構造

<!-- 関連するデータモデル -->

## 状態遷移

<!-- 状態がある場合は Mermaid で記述 -->

## 制約・ルール

<!-- ビジネスルール、バリデーション -->
```

## type: api

```markdown
---
type: api
title: "<API名>"
area: <kebab-case>
tags: [api]
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
related_apis: []
---

# <API名>

## エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|

## 共通仕様

<!-- 認証、ページネーション、エラー形式 -->

## 各エンドポイント詳細

### <METHOD> <path>

- リクエスト
- レスポンス
- エラーケース
```

## type: data-model

```markdown
---
type: data-model
title: "<モデル名>"
area: <kebab-case>
tags: [data-model]
doc_status: draft
created: YYYY-MM-DD
updated: YYYY-MM-DD
related: []
related_tables: []
---

# <モデル名>

## テーブル定義

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|

## リレーション

## インデックス
```
```

**Step 4: コミット**

```bash
git add plugins/dev-process/skills/spec-sync/
git commit -m "feat(dev-process): spec-sync スキルの SKILL.md と references を作成

3モード(初回生成/PR連動更新/乖離検出)のワークフロー、
frontmatterスキーマ定義、仕様テンプレートを追加

refs dev-process-plugin-design.md"
```

---

## Task 5: process-audit スキル - SKILL.md と checklists 作成

**Files:**
- Create: `plugins/dev-process/skills/process-audit/SKILL.md`
- Create: `plugins/dev-process/skills/process-audit/checklists/infra-health.md`
- Create: `plugins/dev-process/skills/process-audit/checklists/traceability.md`
- Create: `plugins/dev-process/skills/process-audit/checklists/spec-coverage.md`

**Step 1: SKILL.md を作成**

```markdown
---
name: process-audit
description: This skill should be used when the user asks to "プロセスの健全性を確認して", "開発プロセスを監査して", "process-auditを実行して", "プロセスチェックして", "トレーサビリティを確認して", "仕様カバレッジを確認して", "開発基盤の状態を見て". 開発プロセス全体の健全性をインフラ・トレーサビリティ・仕様カバレッジの3観点から監査し、A-Fスコア付きレポートを出力する。
allowed-tools: [Bash, Read, Glob, Grep]
user-invocable: true
---

# Process Audit

開発プロセス全体の健全性を監査する。

## 監査カテゴリ

| カテゴリ | 内容 | チェックリスト |
|---------|------|-------------|
| インフラ | テンプレート、Actions、ラベル、CLAUDE.md | checklists/infra-health.md |
| トレーサビリティ | PR-Issue紐付け、コミットメッセージ | checklists/traceability.md |
| 仕様カバレッジ | docs/specs の網羅性と鮮度 | checklists/spec-coverage.md |

## ワークフロー

### Step 1: チェックリスト読み込み

`checklists/` 配下の3ファイルを Read する。

### Step 2: インフラ健全性チェック

`checklists/infra-health.md` に従い、以下を確認:

- CLAUDE.md に `# Dev Process Rules` セクションがあるか
- `.github/ISSUE_TEMPLATE/specification.yml` が存在するか
- `.github/PULL_REQUEST_TEMPLATE.md` が存在するか
- `.github/workflows/pr-check.yml` が存在するか
- `.github/workflows/weekly-check.yml` が存在するか
- `docs/specs/` ディレクトリが存在するか

不足があれば「`dev-process-setup` を再実行してください」と案内する。

**Verification**: 各ファイルの存在が確認できた

### Step 3: トレーサビリティ監査

`checklists/traceability.md` に従い、以下を確認:

```bash
# 直近20件のマージ済みPR
gh pr list --state merged --limit 20 --json number,title,body

# 直近50件のコミットメッセージ
git log --oneline -50
```

チェック:
- PR body に `closes #XX` があるか
- コミットメッセージが Conventional Commits 準拠か
- コミットメッセージに `refs #XX` または `closes #XX` があるか

**Verification**: チェック結果を集計した

### Step 4: 仕様カバレッジ

`checklists/spec-coverage.md` に従い、以下を確認:

```bash
# docs/specs/ のファイル一覧
ls docs/specs/*.md 2>/dev/null

# 各ファイルの frontmatter から area を抽出
grep -r "^area:" docs/specs/
```

チェック:
- コードの機能領域に対応する docs/specs/ ファイルがあるか
- `doc_status: draft` のまま30日以上経過していないか
- `doc_status: deprecated` のファイルがないか

**Verification**: カバレッジ情報を集計した

### Step 5: レポート出力

```markdown
# Dev Process Audit Report

**プロジェクト**: <project-name>
**監査日**: YYYY-MM-DD

## Summary

| カテゴリ | スコア | 備考 |
|---------|--------|------|
| インフラ | A-F | ... |
| トレーサビリティ | A-F | ... |
| 仕様カバレッジ | A-F | ... |

## インフラ健全性

| チェック項目 | 状態 |
|-------------|------|
| CLAUDE.md Dev Process Rules | OK / NG |
| Issue テンプレート | OK / NG |
| PR テンプレート | OK / NG |
| PR 品質ゲート Actions | OK / NG |
| 週次チェック Actions | OK / NG |
| docs/specs/ | OK / NG |

## トレーサビリティ

- PR closes 率: XX/XX (XX%)
- コミット Conventional Commits 準拠率: XX/XX (XX%)
- コミット Issue 参照率: XX/XX (XX%)
- 断裂箇所: (あれば列挙)

## 仕様カバレッジ

- 文書化済み area: X 件
- 未文書化 area: (あれば列挙)
- draft 放置 (30日超): (あれば列挙)
- deprecated: (あれば列挙)

## 要対応

- [ ] ...

## 推奨アクション

1. ...
```

## スコアリング

| グレード | 基準 |
|---------|------|
| A | 全項目 OK、率 90% 以上 |
| B | 軽微な不足、率 70-89% |
| C | 複数の不足、率 50-69% |
| D | 多数の不足、率 30-49% |
| F | 基盤が未導入、率 30% 未満 |
```

**Step 2: infra-health.md を作成**

```markdown
# インフラ健全性チェックリスト

## 必須ファイル

| ファイル | 確認方法 |
|--------|---------|
| CLAUDE.md (Dev Process Rules セクション) | Grep で `# Dev Process Rules` を検索 |
| .github/ISSUE_TEMPLATE/specification.yml | Glob で存在確認 |
| .github/PULL_REQUEST_TEMPLATE.md | Glob で存在確認 |
| .github/workflows/pr-check.yml | Glob で存在確認 |
| .github/workflows/weekly-check.yml | Glob で存在確認 |
| docs/specs/ | Bash で `ls docs/specs/` |

## CLAUDE.md 内容チェック

Dev Process Rules セクションに以下が含まれているか:

- [ ] Issue ルール
- [ ] コミットメッセージ規約
- [ ] PR ルール
- [ ] docs/specs ルール
- [ ] 言語使い分け

## Actions 有効性チェック

```bash
# ワークフローが有効か
gh workflow list
```

disabled になっているワークフローがあれば警告する。
```

**Step 3: traceability.md を作成**

```markdown
# トレーサビリティチェックリスト

## PR チェック

```bash
gh pr list --state merged --limit 20 --json number,title,body
```

各 PR について:
- [ ] body に `closes #XX` または `Closes #XX` が含まれるか
- [ ] 紐づく Issue が存在するか

## コミットメッセージチェック

```bash
git log --oneline -50
```

各コミットについて:
- [ ] Conventional Commits 形式か (`<type>(<scope>): <subject>`)
- [ ] footer に `refs #XX` または `closes #XX` が含まれるか (git log --format=%B -1 <hash> で確認)

## 追跡チェーンの完全性

理想的な追跡チェーン:

```
docs/specs/ の記述
  ↑ git log → commit (refs/closes #XX)
    → PR (closes #XX)
      → Issue (refs notion-xxx)
```

途中が途切れている箇所を断裂として報告する。
```

**Step 4: spec-coverage.md を作成**

```markdown
# 仕様カバレッジチェックリスト

## area 網羅性チェック

1. コードベースから機能領域を推定する

```bash
# ディレクトリ構成から推定
ls -d src/*/  app/*/  pages/*/  2>/dev/null
```

2. docs/specs/ の area 一覧を取得する

```bash
grep -r "^area:" docs/specs/ | sort -u
```

3. コードにあるが docs/specs/ にない area を「未文書化」として報告する

## 鮮度チェック

各 docs/specs/ ファイルについて:

- [ ] `doc_status: draft` で `updated` が30日以上前 → 「draft 放置」として警告
- [ ] `doc_status: deprecated` → 棚卸し対象として報告

## related 整合性

各 docs/specs/ ファイルの `related` フィールドについて:

- [ ] 参照先のファイルが存在するか
- [ ] 参照先の Issue が存在するか (`gh issue view #XX`)
```

**Step 5: コミット**

```bash
git add plugins/dev-process/skills/process-audit/
git commit -m "feat(dev-process): process-audit スキルの SKILL.md と checklists を作成

インフラ健全性、トレーサビリティ、仕様カバレッジの
3観点監査ワークフローとチェックリストを追加

refs dev-process-plugin-design.md"
```

---

## Task 6: CLAUDE.md にプラグイン情報を追加

**Files:**
- Modify: `CLAUDE.md`

**Step 1: CLAUDE.md のプラグイン一覧テーブルに dev-process を追加**

マーケットプレース構成テーブルに追記:

```markdown
| dev-process | 1.0.0 | 3 | 0 | productivity | 開発プロセス基盤(セットアップ/仕様同期/監査) |
```

**Step 2: ディレクトリ構造に追記**

```markdown
    └── dev-process/            # 開発プロセス基盤プラグイン
        └── skills/
            ├── setup/          # プロジェクト初回セットアップ
            ├── spec-sync/      # 仕様ドキュメント管理
            └── process-audit/  # プロセス健全性監査
```

**Step 3: スキル実行例に追記**

```markdown
# Dev Process系 (3スキル)
/skill dev-process:dev-process-setup
/skill dev-process:spec-sync
/skill dev-process:process-audit
```

**Step 4: コミット**

```bash
git add CLAUDE.md
git commit -m "docs(dev-process): CLAUDE.md にプラグイン情報を追加

refs dev-process-plugin-design.md"
```

---

## Task 7: 全体検証

**Step 1: ファイル構造の確認**

```bash
find plugins/dev-process -type f | sort
```

期待される出力:
```
plugins/dev-process/skills/process-audit/SKILL.md
plugins/dev-process/skills/process-audit/checklists/infra-health.md
plugins/dev-process/skills/process-audit/checklists/spec-coverage.md
plugins/dev-process/skills/process-audit/checklists/traceability.md
plugins/dev-process/skills/setup/SKILL.md
plugins/dev-process/skills/setup/generators/actions-pr-check.md
plugins/dev-process/skills/setup/generators/actions-weekly.md
plugins/dev-process/skills/setup/generators/claude-md-rules.md
plugins/dev-process/skills/setup/generators/issue-template.md
plugins/dev-process/skills/setup/generators/labels.md
plugins/dev-process/skills/setup/generators/pr-template.md
plugins/dev-process/skills/spec-sync/SKILL.md
plugins/dev-process/skills/spec-sync/references/frontmatter-schema.md
plugins/dev-process/skills/spec-sync/references/spec-template.md
```

**Step 2: SKILL.md の行数確認(500行以下)**

```bash
wc -l plugins/dev-process/skills/*/SKILL.md
```

**Step 3: frontmatter の整合性確認**

各 SKILL.md の frontmatter に `name` と `description` が存在するか確認。

```bash
head -5 plugins/dev-process/skills/*/SKILL.md
```

**Step 4: marketplace.json の JSON バリデーション**

```bash
python3 -c "import json; json.load(open('.claude-plugin/marketplace.json'))"
```
