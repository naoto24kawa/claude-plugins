---
name: skill-improver
description: |
  Diagnoses and fixes skill errors automatically. This skill should be used
  when the user asks to "スキルを修正したい", "skill error", "SKILL.mdのエラーを直して",
  "スキルが動かない", "frontmatterエラー", "参照ファイルが見つからない",
  "skill-improverを実行したい".
  Triggered by skill-error-detector Stop hook or manually invoked.
  Classifies errors into syntax/runtime and delegates to specialized agents.
  For quality issues, suggests using plugin-dev:skill-development or
  claude:claude-config-review instead.
allowed-tools: [Read, Edit, Write, Glob, Grep, AskUserQuestion, Agent]
context: fork
agents:
  - plugindev-syntax-fixer
  - plugindev-workflow-debugger
user-invocable: true
---

# Skill Improver

スキルの構文エラーと実行時エラーを診断し、自動修正する。2つの専門エージェントに委譲して対応する。
品質問題については `plugin-dev:skill-development` または `claude:claude-config-review` を案内する。

## 前提条件

- 対象スキルの SKILL.md パスまたはプラグイン名:スキル名が特定されていること
- エラー内容の概要 (Stop Hook出力 or ユーザー入力)

## ワークフロー

### Step 1: エラー情報の収集

**Stop Hook からのトリガーの場合**:

- Hook 出力から対象スキル名、エラータイプ、サマリーをパースする
- 出力形式の例:
  ```
  [skill-error-detector] plugin=review skill=ts-code-review type=syntax summary="YAML parse error at line 3"
  ```

**手動実行の場合**:

- AskUserQuestion で以下を確認する:
  ```
  修正対象のスキルを教えてください。

  1. プラグイン名:スキル名 (例: review:ts-code-review)
  2. SKILL.md のパス (例: plugins/review/skills/ts-code-review/SKILL.md)

  また、エラーの種類を選択してください:
  - syntax: YAMLフロントマター、構文エラー
  - runtime: ワークフロー実行時のエラー
  - unknown: 不明(自動判定に委ねる)
  ```

**検証**: 対象スキルのパスとエラータイプが特定されていること

### Step 2: 対象スキルの読み込み

1. Glob で `plugins/<plugin>/skills/<skill>/**/*` を検索し、関連ファイルの一覧を取得する
2. Read で SKILL.md を読み込む
3. Glob で `reference/`, `templates/`, `examples/` サブディレクトリの有無を確認する
4. SKILL.md の `agents` フィールドが存在する場合、関連するエージェントファイルを Read で読み込む
   - エージェントファイルのパス: `plugins/<plugin>/agents/<agent-name>.md`

**検証**: SKILL.md の内容が取得でき、関連ファイル一覧が判明していること

### Step 3: エラーの分類

1. `./reference/diagnosis-rules.md` を Read で読み込む
2. 診断ルールに基づいてエラーを分類する:

| 分類 | 対象 | 例 |
|------|------|-----|
| syntax | YAMLフロントマター、マークダウン構文 | インデント不正、必須フィールド欠落、型不一致 |
| runtime | ワークフロー実行時の問題 | 参照ファイル不在、ツール不足、ステップ間の矛盾 |

品質問題 (500行超過、description形式不正等) が検出された場合は、以下を案内する:
- スキル作成・改善: `/skill plugin-dev:skill-development`
- 品質レビュー: `/skill claude:claude-config-review`

3. 複数のエラータイプが該当する場合、重大度の高い順に処理する: syntax > runtime

**検証**: エラーが1つ以上のタイプに分類されていること

### Step 4: エージェントへの委譲

エラータイプに応じた専門エージェントに修正を委譲する:

| エラータイプ | 委譲先エージェント | 役割 |
|-------------|-------------------|------|
| syntax | plugindev-syntax-fixer | YAMLパース、必須フィールド、構文修正 |
| runtime | plugindev-workflow-debugger | ワークフロー実行、参照整合性の修正 |

エージェントへのプロンプトに以下を含める:

- SKILL.md の全文
- エラーの詳細 (タイプ、サマリー、該当箇所)
- 関連ファイル一覧
- `./reference/diagnosis-rules.md` から該当する診断ルール

複数タイプのエラーがある場合、重大度順に各エージェントを順次呼び出す。

**検証**: エージェントから修正提案が返されること

### Step 5: 修正の適用

修正内容に応じて、自動適用と確認付き適用を使い分ける。

**自動適用 (確認不要)**:

- YAMLインデントの修正
- 必須フィールドの追加
- name のケバブケース化
- description の三人称形式への修正
- allowed-tools への不足ツール追加
- ワークフローステップへの Verification セクション追加

**ユーザー確認が必要**:

- ファイル構造の変更 (ファイル分割、ディレクトリ追加)
- ロジック・ワークフローの変更 (ステップの順序変更、内容の大幅修正)
- context: fork や agents フィールドの追加・変更
- description の大幅な書き換え

確認が必要な場合、AskUserQuestion で変更内容を提示し承認を得る:

```
以下の変更にはユーザーの確認が必要です:

1. [変更種別] 変更内容の説明
   - 変更前: ...
   - 変更後: ...

適用してよろしいですか? (yes/no/skip)
```

**検証**: Edit / Write が正常に完了すること

### Step 6: 修正結果の検証

修正後のスキルに対して以下の検証を行う:

1. Read で修正後の SKILL.md を読み込む
2. YAMLフロントマターがパース可能か確認する
3. 必須フィールド (name, description, allowed-tools) が存在するか確認する
4. Glob で SKILL.md 内の参照ファイルがすべて実在するか確認する
5. SKILL.md が500行以下であることを確認する
6. `agents` フィールドがある場合、該当エージェントファイルが存在するか確認する

すべてのチェックに合格した場合、Step 7 のレポート出力に進む。
不合格項目がある場合、残存課題としてレポートに記載する。

**検証**: すべてのチェック項目が合格すること

### Step 7: レポート出力

以下の形式でレポートを出力する:

```
## Skill Improvement Report

- **Target**: <plugin>:<skill>
- **Error Type**: syntax / runtime
- **Issues Found**: N
- **Auto-Fixed**: M
- **User-Confirmed Fixes**: K
- **Remaining (Manual Review)**: L

### Changes Applied
1. [type] description of change

### Remaining Issues (if any)
- Issue and suggested manual action
```

## エラーハンドリング

### SKILL.md が見つからない場合

対象パスに SKILL.md が存在しない場合:

```
エラー: 指定されたパスに SKILL.md が見つかりませんでした。
パス: plugins/<plugin>/skills/<skill>/SKILL.md

正しいプラグイン名とスキル名を確認してください。
利用可能なスキル一覧を表示しますか?
```

AskUserQuestion で正しいパスを再入力してもらう。

### エージェントが修正提案を返さない場合

エージェントがエラーの修正方法を特定できなかった場合:

- エラーの詳細と検出された症状を提示する
- 手動での修正ガイダンスを提供する (該当する診断ルールの参照先を案内)
- 必要に応じて `./reference/diagnosis-rules.md` の該当セクションを表示する

### 修正後の検証が失敗する場合

Step 6 の検証で不合格項目が残った場合:

- 残存課題をレポートの "Remaining Issues" セクションに記載する
- 各課題に対して手動修正の推奨アクションを提示する
- 再度 skill-improver を実行することで追加修正が可能であることを案内する

## reference ファイル

| ファイル | 内容 | 読み込みタイミング |
|---------|------|------------------|
| `./reference/diagnosis-rules.md` | エラー分類ルールと診断基準 | Step 3 (常に読み込む) |
