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
