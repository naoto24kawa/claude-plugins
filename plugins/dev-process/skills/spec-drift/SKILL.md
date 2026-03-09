---
name: spec-drift
description: This skill should be used when the user asks to "乖離チェックして", "仕様とコードがずれてないか確認して", "spec-driftを実行して", "仕様の乖離を検出して", "仕様カバレッジを確認して", "ドリフトレポートを出して". 仕様ドキュメント(docs/specs/)とコードベースの実態を比較し、乖離を検出してレポートを出力する。
allowed-tools: [Bash, Read, Glob, Grep, AskUserQuestion]
user-invocable: true
---

# Spec Drift

仕様ドキュメントとコードベースの乖離を検出する。

## 前提条件

- 仕様ドキュメントの出力ディレクトリ (デフォルト: `.docs/specs/`) が存在すること
- 存在しない場合は `spec-coordinator` による初回生成を案内する

## ワークフロー

### Step 1: 全仕様ファイルの読み込み

Glob で仕様ディレクトリ内の `*.md` ファイルを検索し、各ファイルを Read して内容を把握する。
内部ファイル (`_context.md`, `_index.md`) はスキップする。

frontmatter の `type`, `area`, `doc_status` を抽出し、仕様の構造を把握する。

**Verification**: 全ファイルを読み込んだ

**Error Handling**:
- 仕様ディレクトリにファイルがない場合: `spec-coordinator` の実行を案内する

### Step 2: コード実態との比較

各仕様の記述について、コードベースの実態と比較する。

チェック観点:
- 仕様に記述されているが実装にない機能
- 実装にあるが仕様に記述されていない機能
- 仕様の記述と実装の挙動が異なる箇所
- frontmatter の `related`, `related_tables`, `related_apis` が実態と合っているか

**Verification**: 比較が完了した

### Step 3: レポート出力

```markdown
# Spec Drift Report

**検査日**: YYYY-MM-DD
**仕様ディレクトリ**: .docs/specs/
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

## 未文書化の機能領域
- notification (実装はあるが仕様ファイルなし)

## 推奨アクション
- [ ] spec-update で差分を反映する
- [ ] spec-coordinator で全体を再生成する
```

**Verification**: レポートがユーザーに提示された

## 記述方針

- 仕様には「何がどうなっているか」を記述する
- 「なぜそうなっているか」は PR/Issue/commit に残す
- この分離により、仕様は事実として信頼でき、変更理由は追跡チェーンで辿れる
- 設計判断の経緯は `decisions/` ディレクトリ (ADR等) に記録し、仕様からは参照のみ行う

## リファレンスファイル

- **`../../references/frontmatter-schema.md`** - docs/specs frontmatter の必須/オプションフィールド定義、doc_status 遷移ルール
- **`../../references/spec-template.md`** - type 別の仕様ドキュメントテンプレート
