---
name: plan-to-github
description: Converts Claude plan results into GitHub workflow. Analyzes plan content and executes Issue creation for spec changes or PR creation for completed implementations at appropriate timing. Use when users mention "planをIssueにして", "実装計画からPR作成", "開発ワークフロー", "plan to issue", "create PR from plan", or "dev workflow".
allowed-tools: [Bash, Read, Write, Glob, Grep, AskUserQuestion, TodoWrite]
context: fork
---

# Plan to GitHub Workflow

Claude の plan 結果を GitHub Issue/PR に変換するオーケストレーションスキル。

## 目次

1. [関連スキル](#関連スキル)
2. [役割](#役割)
3. [ワークフロー](#ワークフロー)
4. [デフォルト設定](#デフォルト設定)
5. [例](#例)

## 関連スキル

本スキルは以下のスキルと連携して動作する:

| スキル | 役割 | 連携方法 |
|--------|------|---------|
| `create-issue` | Issue 作成 | テンプレート・処理を共有 |
| `create-pr` | PR 作成 | テンプレート・処理を共有 |

### 連携アーキテクチャ

```
plan-to-github (オーケストレーター)
    │
    ├── Issue 作成時
    │   └── ../create-issue/references/issue-template.yml を参照
    │
    └── PR 作成時
        └── ../create-pr/references/pr-template.md を参照
```

### 共有リソース

- **Issue テンプレート**: `../create-issue/references/issue-template.yml`
- **PR テンプレート**: `../create-pr/references/pr-template.md`
- **GitHub テンプレート**: `../../templates/` 配下

**Note**: 本スキルは create-issue/create-pr の処理を内包する。
単独で Issue や PR を作成したい場合は、それぞれのスキルを直接使用可能。

## 役割

plan 結果と GitHub ワークフローを連携:
- **分析**: plan の内容から適切なアクションを判断
- **Issue**: 仕様変更が必要な場合、`create-issue` を呼び出し
- **PR**: 実装完了後、`create-pr` を呼び出し
- **フルサイクル**: Issue → 実装支援 → PR の全体管理

## ワークフロー

### Step 1: Plan 内容の確認

plan の内容を確認する。plan がない場合はユーザーに確認。

**確認方法**:
1. 直前の会話で plan が作成されているか確認
2. plan ファイルが指定されているか確認
3. ユーザーから plan 内容を口頭で受け取る

**Verification**: plan の概要、目的、実装ステップが把握できた

**Error Handling**:
- plan がない: 「どのような変更を計画していますか?」と質問
- plan が曖昧: 具体的な内容をヒアリング

### Step 2: ワークフロータイプの選択

ユーザーにワークフロータイプを確認する。

**対話的選択**:
```
plan の内容に基づいて何を行いますか?

1. Issue作成 - 仕様書として記録 (まだ実装前)
2. PR作成 - 実装完了を記録 (実装済み)
3. フルワークフロー - Issue作成 → 実装支援 → PR作成
4. 状況判断 - plan を分析して自動判断
```

**自動判断の基準** (詳細は `workflow-phases/analysis.md`):
- 仕様変更/新機能の検討段階 → Issue作成
- コードが既に変更されている → PR作成
- これから実装を始める → フルワークフロー

**Verification**: ユーザーの選択を確認

### Step 3: Issue 作成 (該当する場合)

仕様変更が必要な場合、Issue を作成する。

**判断基準** (詳細は `workflow-phases/issue-creation.md`):
- 新機能の追加
- 既存機能の変更
- バグ修正の仕様定義
- 機能の削除

**実行内容**:
1. plan から As-Is/To-Be を抽出
2. 検討した選択肢があれば整理
3. Issue テンプレートに沿って作成

**テンプレート参照**:
- 形式: `../create-issue/references/issue-template.yml`
- セットアップ先: `.github/ISSUE_TEMPLATE/specification.yml`

```bash
gh issue create --title "<種類>: <概要>" --body "..." --label "specification"
```

**Verification**: Issue が作成され、URL が取得できた

**Error Handling**:
- 情報不足: ユーザーにヒアリング
- gh コマンド失敗: エラー内容を報告し対処法を案内

### Step 4: 実装支援 (フルワークフローの場合)

Issue 作成後、実装フェーズをサポートする。

**サポート内容**:
1. Issue の内容を実装タスクに分解
2. 各タスクの実装を支援
3. テストの実行サポート
4. 実装完了の確認

**TodoWrite 連携**:
Issue のタスクリストを TodoWrite に反映して進捗管理。

**Verification**: 全タスクが完了し、テストがパスした

**Error Handling**:
- テスト失敗: 修正を提案
- 実装中断: 進捗を保存して後で再開可能に

### Step 5: PR 作成 (該当する場合)

実装が完了した場合、PR を作成する。

**判断基準** (詳細は `workflow-phases/pr-creation.md`):
- コード変更がコミットされている
- テストがパスしている
- 関連 Issue が存在する

**実行内容**:
1. 変更内容を確認 (`git diff`, `git log`)
2. 技術的決定事項を整理
3. PR テンプレートに沿って作成

**テンプレート参照**:
- 形式: `../create-pr/references/pr-template.md`
- セットアップ先: `.github/PULL_REQUEST_TEMPLATE.md`

```bash
gh pr create --title "<type>: <概要>" --body "..."
```

**Issue との紐付け**:
- Step 3 で Issue を作成した場合: `Closes #<issue番号>` を自動設定
- 既存 Issue がある場合: ユーザーに確認して紐付け

**Verification**: PR が作成され、URL が取得できた

### Step 6: ワークフローサマリー

完了したワークフローのサマリーを生成する。

**サマリー内容** (テンプレート: `templates/workflow-summary.md`):
```markdown
## ワークフロー完了

### 作成されたもの
- Issue: #123 - feat: ユーザープロフィール画像機能
- PR: #124 - feat: ユーザープロフィール画像機能の実装

### 次のステップ
- [ ] PR レビューを依頼
- [ ] CI の完了を確認
- [ ] マージ
```

**Verification**: サマリーがユーザーに共有された

## デフォルト設定

| 項目 | デフォルト値 |
|------|-------------|
| ワークフロー | 状況判断 (自動) |
| Issue ラベル | `specification` |
| PR ベースブランチ | `main` |
| Issue-PR 紐付け | 自動 (Closes #) |

## 例

### Example 1: 仕様検討から Issue 作成

**ユーザー**: 「ダークモード機能を追加する plan を Issue にして」

**プロセス**:
1. plan 内容確認: ダークモード機能の仕様
2. ワークフロー選択: Issue作成
3. As-Is/To-Be を整理
4. `gh issue create` で Issue 作成

**結果**: `feat: ダークモード機能` の Issue が作成

### Example 2: 実装完了から PR 作成

**ユーザー**: 「実装が終わったから PR を作成して」

**プロセス**:
1. 変更内容確認: `git diff`, `git log`
2. ワークフロー選択: PR作成
3. 関連 Issue を確認
4. 技術的決定事項を整理
5. `gh pr create` で PR 作成

**結果**: `feat: ダークモード機能の実装` の PR が作成

### Example 3: フルワークフロー

**ユーザー**: 「検索機能を追加したい。Issue から PR まで全部やって」

**プロセス**:
1. plan 内容確認: 検索機能の要件
2. ワークフロー選択: フルワークフロー
3. Issue 作成 → #125
4. タスク分解、TodoWrite に反映
5. 実装支援
6. テスト実行
7. PR 作成 → #126 (Closes #125)
8. サマリー生成

**結果**: Issue #125 と PR #126 が連携して作成

### Bad Example

**ユーザー**: 「PR 作成して」(変更なし)

**問題**: コミットされた変更がない

**対処**:
1. `git status` で状態確認
2. 「変更がコミットされていません。先にコミットしますか?」と確認
3. コミット後に PR 作成へ進む

## 注意事項

- plan の内容を正確に反映する
- Issue と PR の役割分担を維持 (Issue = 仕様、PR = 技術)
- 自動判断に迷う場合はユーザーに確認
- フルワークフローでは進捗を TodoWrite で管理
