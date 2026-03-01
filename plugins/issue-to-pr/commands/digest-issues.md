---
description: 'GitHub Issueを自動分類・実装・PR作成する'
---

# Issue自動消化 (digest-issues)

GitHub の未処理 Issue を自動的に分類し、処理可能なものを実装して PR を作成する。

## 引数

$ARGUMENTS を以下のルールでパースする:

- `--max N` : 最大処理件数 (デフォルト: 制限なし = 全件取得)
- `--label LABEL` : ラベルでフィルタ
- `#21 #22 #23` : 指定 Issue 番号のみ対象
- 引数なし: 全オープン Issue 対象 (全件取得)

### 引数の組み合わせルール

- Issue 番号指定がある場合: `--label` と `--max` は無視する (番号指定が最優先)
- `--label` と `--max` は併用可能: ラベルでフィルタした上で max 件数に制限する

## Phase 0: Issue 取得

1. 引数をパースする
2. `gh issue list` で対象 Issue を取得する
   - 番号指定がある場合: `gh issue view <number> --json number,title,body,comments,labels` を各番号で実行
     - 取得に失敗した場合 (存在しない、権限なし等): 警告を出力してその番号をスキップし続行する
   - それ以外: `gh issue list --state open --json number,title,body,comments,labels` を実行 (`--max` 指定がある場合のみ `--limit <max>` を付与)
   - `--label` 指定がある場合は `--label <label>` を追加
3. 取得した Issue が 0 件の場合: 「対象 Issue がありません」と出力して終了する
4. 各 Issue について `gh pr list --search "closes #<number> OR fixes #<number> OR resolves #<number>" --json number,state,body` で既存 PR を確認する
   - 検索結果の PR 本文を `\b(closes|fixes|resolves)\s+#<number>\b` で再検証し、誤マッチを除外する
5. 既に PR が存在する (open or merged) Issue は「PR 済み」としてスキップリストに入れる
6. 関連リポジトリを検出する
   - `.claude/issue-to-pr.local.json` を Read tool で読み、`related_repos` から nameWithOwner に対応するローカルパスを取得する
   - `related_repos` がない場合は `.claude/related-repos.local.json` をフォールバックとして読む (後方互換)
   - いずれも存在しない場合: 単一リポジトリモードで続行する
   - 記載された各リポジトリのローカルパスが存在するか確認する
   - アクセス可能な関連リポジトリのリストを記録する (ローカルパス, nameWithOwner)
   - 関連リポジトリが 0 件の場合: ターミナルに「関連リポジトリなし (単一リポジトリモード)」と出力する
   - 関連リポジトリがある場合: ターミナルにリスト表示する (例: `関連リポジトリ: jobantenna-v4 (/path/to/repo)`)

## Phase 1: Router - LLM 分類

取得した各 Issue に対して以下を判定する。

### 判定項目

- type: bug / feature / docs / refactor / unknown
- difficulty: low / medium / high
- automatable: yes / no
- skip_reason: (no の場合) 具体的な理由

### 自動処理不可の基準

以下に該当する場合は automatable: no とする:

- 仕様が曖昧で人間への確認が必要
- 大規模なアーキテクチャ変更を伴う
- セキュリティに関わる変更
- 外部サービスとの新規連携が必要
- difficulty が high

### 複数リポジトリを考慮した判定

Phase 0 で関連リポジトリが検出された場合、以下は自動処理不可の理由にはならない:

- バックエンド変更が必要 (関連リポジトリで対応可能)
- DB マイグレーションが必要 (関連リポジトリで対応可能)
- GraphQL スキーマ変更が必要 (関連リポジトリで対応可能)

つまり、変更が複数リポジトリにまたがること自体はスキップ理由にならない。Worker は複数リポジトリでのブランチ作成・実装・PR 作成に対応している。

ただし以下は関連リポジトリがあっても automatable: no のままとする:

- 外部サービスの API 仕様調査・認証設定が必要
- 人間による事前合意・承認が前提条件
- 仕様が曖昧で具体的な実装方針が決められない

### difficulty 判定の注意

difficulty は変更の複雑さで判定する。リポジトリ数は判定基準にしない。

- low: 単純な修正、既存パターンの踏襲
- medium: 新規機能だが設計判断が明確、複数リポジトリにまたがっても各変更が straightforward
- high: 大規模な設計判断、未知の技術要素、影響範囲が広い

関連リポジトリがある場合、「BE+FE の両方に変更が必要」というだけでは high にしない。各リポジトリの変更が straightforward であれば medium と判定する。

### 結果提示とユーザ承認

判定結果をテーブル形式でユーザに提示する:

```
| # | Issue | Type | Difficulty | Auto | Reason |
|---|-------|------|-----------|------|--------|
```

AskUserQuestion で以下を確認する:

- automatable: yes の Issue を自動処理する
- automatable: no の Issue には GitHub コメントでスキップ理由を報告する
- 除外したい Issue があれば番号を指定できる

ユーザの回答パターン:
- 「続行」: 全ての automatable: yes の Issue を処理対象にする
- 「#22 を除外して続行」: 指定 Issue を処理対象から外す
- 「中止」: 処理を終了する

### スキップ Issue の報告

ユーザ承認後、Phase 1 で automatable: no と判定された Issue に1件ずつ報告する:

- GitHub Issue コメント: `gh issue comment <number> --body <body>`
  テンプレート:
  ```
  ## 自動処理スキップ
  - 理由: <skip_reason>
  - 推奨: <recommendation>
  処理者: Claude Code /digest-issues
  ```
- Slack 通知: Slack Bot MCP が利用可能で、かつ `.claude/issue-to-pr.local.json` に `slack_channel` がある場合のみ通知する
  テンプレート: `:fast_forward: *#<number> <title>* スキップ - 理由: <skip_reason>`
- Bot MCP が利用不可、またはチャンネル ID がない場合はターミナル出力のみ

## Phase 2: Worker dispatch

承認された各 Issue に対して直列に Worker Agent を spawn する。

### dispatch ループの前提確認

dispatch ループに入る前に `git branch --show-current` で main ブランチにいることを確認する。main にいない場合は `git checkout main` を実行する。

### dispatch ループ

for each approved issue:

1. main ブランチにいることを確認する (Worker 失敗後のリカバリ):
   - `git branch --show-current` で確認
   - main にいない場合は `git checkout main` を実行

2. Task tool で digest-worker Agent を起動する:
   - subagent_type: "general-purpose"
   - prompt は以下のテンプレートに従って構築する:

   ```
   あなたは digest-worker エージェントです。
   まず Read tool で `${CLAUDE_PLUGIN_ROOT}/agents/digest-worker.md` を読み、その指示に従って処理してください。

   ## 対象 Issue

   - issue_number: <number>
   - issue_title: <title>
   - issue_body: |
       <body の全文>
   - issue_comments: |
       <comments を改行区切りで全文>
   - type: <type>
   - difficulty: <difficulty>

   ## 関連リポジトリ

   <Phase 0 で検出した関連リポジトリの一覧。なければ「なし」>
   - <nameWithOwner>: <ローカルパス>
   ```

3. Worker の結果を受け取る (status, pr_number, failure_reason)
   - Worker の出力から `## digest-worker result` セクションをパースする
   - パースに失敗した場合は status: failure, failure_reason: "Worker の出力をパースできませんでした" として扱う

4. 結果に応じてターミナルに進捗を出力する:
   - success: "V #<number> <title> -> PR #<pr_number>"
   - failure: "X #<number> <title> -> 失敗: <reason>"

5. Worker が success の場合、結果リストに (issue_number, issue_title, type, pr_number) を記録する

6. 次の Issue へ進む

## Phase 3: Browser verification

Phase 2 で成功した PR に対してブラウザ動作確認を実施する。

### 前提確認

- Phase 2 の成功リストが 0 件の場合: Phase 3 をスキップする
- main ブランチにいることを確認する

### 確認ループ

for each successful PR:

1. git の状態を確認しリカバリする:
   - `git branch --show-current` で確認し、main にいない場合は `git checkout main` を実行
   - `git status --porcelain` で dirty state を確認し、空でない場合は `git stash` してから `git checkout main` を実行

2. Task tool で browser-verifier Agent を起動する:
   - subagent_type: "general-purpose"
   - prompt は以下のテンプレートに従って構築する:

   ```
   あなたは browser-verifier エージェントです。
   まず Read tool で `${CLAUDE_PLUGIN_ROOT}/agents/browser-verifier.md` を読み、その指示に従って処理してください。

   ## 対象 PR

   - pr_number: <pr_number>
   - issue_number: <issue_number>
   - issue_title: <issue_title>
   - issue_body: |
       <Issue 本文の全文>
   - type: <type>
   - verify_targets: |
       <Issue の内容から推測される確認対象の画面・操作の概要>
   ```

3. Verifier の結果を受け取る (browser_check, skip_reason, failure_detail, screens_checked)
   - Verifier の出力から `## browser-verifier result` セクションをパースする
   - パースに失敗した場合は browser_check: SKIP として扱う

4. 結果を成功リストの該当 PR に紐づけて記録する (browser_check フィールドを追加)

5. 結果に応じてターミナルに進捗を出力する:
   - OK: "V PR #<pr_number> ブラウザ確認 OK (<screens_checked> 画面)"
   - NG: "X PR #<pr_number> ブラウザ確認 NG: <failure_detail>"
   - SKIP: "- PR #<pr_number> ブラウザ確認スキップ: <skip_reason>"

6. 次の PR へ進む

### 全 Issue 処理完了後

ターミナルにサマリを出力する:

```
=== digest-issues 実行結果 ===
処理成功: N件
  - #XX: PR #YY 作成 (type, difficulty) [ブラウザ: OK/NG/SKIP]
PR済みスキップ: N件
  - #ZZ: 既存 PR #AA
自動処理不可スキップ: N件
  - #WW: 理由
処理失敗: N件
  - #VV: 理由
================================
```
