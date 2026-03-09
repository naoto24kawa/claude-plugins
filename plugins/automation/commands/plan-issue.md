---
description: 'GitHub Issueを対話的に検討し実装計画を作成する'
argument-hint: '#issue-number'
---

# Issue検討 (plan-issue)

GitHub Issue 1件を人間と対話しながら検討し、実装計画を Issue コメントに投稿する。
`/digest-issues` がスキップした Issue を前に進めるために使う。

## パイプライン

```
/digest-issues -> スキップ Issue 特定
/plan-issue #N -> 対話検討 -> 実装計画を Issue コメントに投稿
/digest-issues #N -> Worker が計画を参照して実装 -> PR 作成
```

## 引数

$ARGUMENTS を以下のルールでパースする:

- `#28` : Issue 番号 (必須、1件のみ)
- 番号なし: 「Issue 番号を指定してください (例: /plan-issue #28)」と出力して終了する
- 複数番号: 最初の1件のみ対象とし、「複数の Issue が指定されました。最初の1件 (#<number>) のみ処理します」と出力する

## 初期化

### 設定ファイルの読み込み

`.claude/automation.local.json` を Read tool で読み、環境固有の設定を取得する:

- `slack_channel` - Slack 通知先チャンネル ID
- `test_command` - テスト実行コマンド
- `related_repos` - 関連リポジトリ (nameWithOwner: ローカルパス)

### CLAUDE.md の読み込み

CLAUDE.md を Read tool で読み、以下の情報を特定して記憶する:

- プロジェクト構成 (ディレクトリ構造、技術スタック)
- 開発規約

### 関連リポジトリの確認

設定ファイルの `related_repos` にリポジトリがある場合は、各リポジトリの CLAUDE.md も Read tool で読み、開発規約・プロジェクト構成を記憶する。

### Slack MCP の確認

`mcp__slack-bot__slack_bot_post_message` ツールが利用可能か ToolSearch で確認する。

## Phase 0: Issue 取得 + コードベース調査

### Issue 取得

`gh issue view <number> --json number,title,body,comments,labels,state` で Issue 詳細を取得する。

取得に失敗した場合: 「Issue #<number> を取得できませんでした」と出力して終了する。

Issue がクローズ済み (state: CLOSED) の場合: 「Issue #<number> はクローズ済みです」と出力して終了する。

取得した comments を走査し、body に `## 実装計画` を含むコメントが存在するか確認する。

既存の実装計画コメントがある場合: 「この Issue には既に実装計画があります。上書きしますか?」と AskUserQuestion で確認する。
- 「上書き」: 既存コメントの ID を記憶し、Phase 3 で上書きする。続行する
- 「中止」: 終了する

### コードベース調査

Issue の内容から関連するコードを調査する:

- CLAUDE.md のプロジェクト構成を参照し、関連ディレクトリを特定する
- Glob / Grep で関連ファイルを探索する
- 設定ファイルの `related_repos` にリポジトリがある場合はそちらも調査する
- 関連ファイルの概要を把握する (全文は読まない、構造と役割を理解する)

## Phase 1: 分析 + アプローチ提案

### 課題の整理

Issue の内容を分析し、以下を整理してユーザーに提示する:

- 課題の要約 (何を解決する Issue か)
- 影響範囲 (変更が必要なコンポーネント/レイヤー)
- 不明点・リスク (仕様の曖昧さ、技術的リスク)
- 関連する既存コード

### アプローチ提案

2-3 のアプローチを提案する。明らかに最適解が1つのみの場合 (typo 修正、設定値変更等) は1つでもよい。各アプローチに以下を含める:

- アプローチ名 (短い名前)
- 概要 (何をどう変えるか)
- メリット / デメリット
- 推定される変更規模 (ファイル数の目安)
- 推奨度 (推奨 / 代替案)

### ユーザー選択

AskUserQuestion でアプローチを選択してもらう。
選択肢はアプローチ名をラベルにし、概要を description に入れる。

ユーザーが「どれでもない」を選んだ場合は、追加のヒアリングを行い再提案する。最大 3 回まで再提案する。3 回目でも選択されない場合は「計画の作成を中止しました」と出力して終了する。

## Phase 2: 実装計画生成

選択されたアプローチに基づいて詳細な実装計画を生成する。Phase 3 の Issue コメントテンプレートに準拠したフォーマットで生成する。

### 計画の内容

- 変更対象ファイル一覧 (パス + 変更の概要)
- 実装手順 (番号付き、各手順は具体的なアクション)
- テスト方針 (何をテストするか、どのレベルのテストか)
- 注意事項 (リスク、依存関係、マイグレーションの要否)
- 複数リポジトリにまたがる場合は各リポジトリの変更を明記する

### ユーザー確認

生成した計画をターミナルに表示し、AskUserQuestion で最終確認する:

- 「OK」: Phase 3 に進む
- 「修正あり」: ユーザーのフィードバックを反映して再生成する
- 「中止」: 「計画の投稿を中止しました」と出力して終了する

## Phase 3: 報告

### Issue コメント投稿

- 上書きモードの場合: `gh api repos/{owner}/{repo}/issues/comments/{comment_id} -X PATCH -f body=<body>` で既存コメントを更新する
- 通常モード: `gh issue comment <number> --body <body>` で新規コメントを投稿する

中止された場合は Slack 通知しない。

テンプレート:

```
## 実装計画

### 選択されたアプローチ

<アプローチ名>: <概要>

### 変更対象

- `<ファイルパス>`: <変更内容>

### 実装手順

1. <手順>
2. <手順>

### テスト方針

- <テスト内容>

### 注意事項

- <リスクや考慮点>

---
処理者: Claude Code /plan-issue
```

### Slack 通知

Slack Bot MCP が利用可能で、かつ `.claude/automation.local.json` に `slack_channel` がある場合のみ通知する。
設定ファイルに `slack_channel` がない場合は Slack 通知をスキップする。

テンプレート:
```
:memo: *#<number> <title>* 実装計画を作成しました
- アプローチ: <アプローチ名>
- 次のアクション: `/digest-issues #<number>` で実装
```

Bot MCP が利用不可の場合はターミナル出力のみとする。

### 次のアクションの案内

ターミナルに以下を出力する:

```
=== plan-issue 完了 ===
Issue: #<number> <title>
アプローチ: <アプローチ名>
計画: Issue コメントに投稿済み

次のアクション:
  /digest-issues #<number>  で Worker に実装させる
========================
```
