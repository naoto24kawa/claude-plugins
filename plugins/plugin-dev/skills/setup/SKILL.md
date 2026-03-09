---
name: setup
description: |
  Sets up the plugin-dev plugin in a project. This skill should be used when
  the user asks to "plugin-devをセットアップしたい", "スキル修正プラグインを導入したい",
  "setupを実行したい", "skill-improverを使えるようにしたい",
  "スキルエラー検知を有効にしたい", "plugin-dev setup".
  Verifies plugin installation, confirms Stop hook is loaded, checks agent
  availability, and explains the error detection and fix workflow.
allowed-tools: [Read, Glob, Grep, Bash, AskUserQuestion]
user-invocable: true
---

# Plugin Dev Setup

plugin-dev プラグインの導入確認と動作ガイドを行う。

## Workflow

### Step 1: プラグインインストール確認

プラグインがインストールされているか確認する。

1. Glob で `plugins/plugin-dev/` の存在を確認
2. 以下のファイルが揃っているか確認:
   - `skills/skill-improver/SKILL.md`
   - `skills/skill-improver/reference/diagnosis-rules.md`
   - `agents/plugindev-syntax-fixer.md`
   - `agents/plugindev-workflow-debugger.md`
   - `agents/plugindev-quality-improver.md`
   - `hooks/hooks.json`

見つからない場合:
```
plugin-dev プラグインがインストールされていません。
以下のコマンドでインストールしてください:

/plugin install plugin-dev@naoto24kawa-claude-plugins
```

Verification: 全6ファイルが存在する

### Step 2: Stop Hook の確認

hooks/hooks.json の内容を Read で確認し、Stop Hook が正しく定義されているか検証する。

確認項目:
- `hooks.Stop` 配列が存在する
- `type: prompt` のエントリがある
- `matcher: *` が設定されている

Hook が正しい場合:
```
Stop Hook (skill-error-detector) が有効です。
スキル実行エラーが発生した場合、会話終了時に自動検知されます。
```

**注意**: Hook はセッション開始時に読み込まれます。プラグインを新規インストールした場合は、Claude Code を再起動してください。

Verification: hooks.json に有効な Stop Hook が定義されている

### Step 3: エージェント確認

3つの専門エージェントが利用可能か確認する。

Glob で `plugins/plugin-dev/agents/plugindev-*.md` を検索し、各エージェントの frontmatter (name フィールド) を Read で確認する。

```
利用可能なエージェント:
- plugindev-syntax-fixer: YAML frontmatter / 構文エラーの修正
- plugindev-workflow-debugger: 実行時エラーの原因特定・修正
- plugindev-quality-improver: 品質基準違反の検出・改善
```

Verification: 3つのエージェントファイルが存在し、frontmatter が有効

### Step 4: 使い方の案内

セットアップ完了メッセージと使い方を表示する。

```
## セットアップ完了

plugin-dev プラグインが正常にセットアップされています。

### 使い方

**自動検知 (推奨)**:
スキル実行中にエラーが発生すると、会話終了時に Stop Hook が自動検知し、
skill-improver の実行を提案します。提案に従って実行してください。

**手動実行**:
/skill plugin-dev:skill-improver

### 対応するエラー種別

| 種別 | 内容 | 担当エージェント |
|------|------|----------------|
| syntax | YAML frontmatter / 構文エラー | plugindev-syntax-fixer |
| runtime | 参照ファイル欠如 / パス不正 / ツールエラー | plugindev-workflow-debugger |
| quality | 500行超過 / Progressive Disclosure 違反 | plugindev-quality-improver |

### 注意事項

- Hook はセッション開始時に読み込まれます。変更後は Claude Code を再起動してください。
- 重大な変更 (ファイル構成変更等) は自動修正前にユーザー確認が入ります。
```

## Error Handling

- プラグイン未インストール: インストールコマンドを案内する
- Hook ファイルが不正: hooks.json の再作成を案内する
- エージェントファイルが欠損: 再インストールを案内する
