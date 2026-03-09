# plugin-dev:skill-improver 設計書

## 概要

スキル実行時のエラーを自動検知し、診断・修正を行うメタスキル。
Stop Hook でエラーを検知し、skill-improver スキルが3つの専門エージェントに委譲して修正する。

## 要件

- **起動**: Stop Hook (skill-error-detector) によるエラー自動検知 → skill-improver 手動起動
- **対象エラー**: SKILL.md構文エラー、ワークフロー実行時エラー、品質問題
- **修正方針**: 診断 + 自動修正 (重大変更のみユーザー確認)
- **配置**: 新規 plugin-dev プラグイン

## アーキテクチャ

### ディレクトリ構成

```
plugins/plugin-dev/
├── skills/
│   └── skill-improver/
│       ├── SKILL.md                    # メインスキル (診断 → エージェント委譲)
│       └── reference/
│           └── diagnosis-rules.md      # エラー分類ルール・修正パターン
├── agents/
│   ├── plugindev-syntax-fixer.md       # YAML frontmatter/構文修正
│   ├── plugindev-workflow-debugger.md  # 実行時エラー原因特定・修正
│   └── plugindev-quality-improver.md   # 品質基準違反検出・修正
└── hooks/
    └── skill-error-detector.md         # Stop Hook (エラー検知プロンプト)
```

### フロー

```
会話終了 (Stop Event)
  |
  v
skill-error-detector Hook
  -> 直前の会話にスキル関連エラーがあったか判定
  -> エラーあり: "skill-improver を起動してください" と出力
  |
  v
skill-improver スキル (手動 or 提案に従い起動)
  -> エラー内容をパース・分類
  -> エラー種別に応じたエージェントに委譲
  |
  +-- plugindev-syntax-fixer      (構文エラー)
  +-- plugindev-workflow-debugger  (実行時エラー)
  +-- plugindev-quality-improver  (品質問題)
  |
  v
修正適用 -> 検証 -> レポート出力
```

## コンポーネント詳細

### 1. Stop Hook: skill-error-detector

- **イベント**: Stop
- **マッチャー**: なし (全Stop時に発火)
- **タイプ**: プロンプトベース

#### 検知パターン

1. **スキル読み込み失敗**: SKILL.md 関連のエラーメッセージ、YAML パースエラー
2. **参照ファイル未発見**: スキル内で Read した参照ファイルが存在しない
3. **ツール呼び出し失敗**: スキルのワークフロー中にツールがエラーを返した
4. **ワークフロー中断**: スキルの手順が途中で止まった形跡

#### 出力

エラー検知時:
```
[skill-error-detector] スキル実行エラーを検知しました。
対象: <スキル名>
エラー種別: <syntax | runtime | quality>
概要: <エラーの概要>

修正するには: /skill plugin-dev:skill-improver を実行してください。
```

非検知時: サイレント (出力なし)

### 2. skill-improver スキル

#### YAML frontmatter

```yaml
---
name: skill-improver
description: |
  Diagnoses and fixes skill errors automatically. Use when a skill has
  YAML frontmatter syntax errors, workflow runtime failures, reference
  file issues, or quality violations. Triggered by skill-error-detector
  hook or manually invoked with '/skill plugin-dev:skill-improver'.
  Classifies the error type and delegates to specialized agents for
  syntax fixing, workflow debugging, or quality improvement.
allowed-tools: [Read, Edit, Write, Glob, Grep, AskUserQuestion, Agent]
context: fork
agents:
  - plugindev-syntax-fixer
  - plugindev-workflow-debugger
  - plugindev-quality-improver
---
```

#### ワークフロー

| Step | 内容 | 検証 |
|------|------|------|
| 1 | エラー情報の収集 (AskUserQuestion or Hookパース) | 対象スキルとエラー内容が特定できている |
| 2 | 対象スキルの読み込み (Glob + Read) | SKILL.md と関連ファイルが取得できている |
| 3 | エラー分類 (diagnosis-rules.md 参照) | syntax/runtime/quality のいずれかに分類 |
| 4 | エージェント委譲 (Agent) | 適切なエージェントが起動 |
| 5 | 修正適用 (Edit / AskUserQuestion) | 軽微→自動、重大→ユーザー確認 |
| 6 | 検証 (Read + Glob) | 構文OK、参照ファイル存在、500行以内 |
| 7 | レポート出力 | Skill Improvement Report |

#### レポート形式

```
## Skill Improvement Report

- Target: <plugin>:<skill>
- Error Type: syntax / runtime / quality
- Issues Found: N
- Fixed: M
- Requires Manual Review: K
- Details: ...
```

### 3. plugindev-syntax-fixer エージェント

**役割**: SKILL.md の YAML frontmatter と構文エラーの検出・修正

#### 検査項目

- YAML frontmatter のパース可能性
- 必須フィールド (name, description) の存在
- name 形式 (ケバブケース、64文字以内)
- description 形式 (三人称、トリガーワード含有、1024文字以内)
- allowed-tools の有効なツール名チェック
- agents で指定されたエージェントファイルの存在確認

#### 修正能力

- YAML インデント修正
- 欠落フィールドの追加 (テンプレートベース)
- description の三人称への書き換え
- 無効なツール名の候補提示

**ツール**: Read, Edit, Glob, Grep

### 4. plugindev-workflow-debugger エージェント

**役割**: スキル実行時のエラーの原因特定と修正

#### 検査項目

- 参照ファイルパスの存在確認 (Read で読み込む指示があるファイル)
- allowed-tools に記載されたツールの妥当性
- スキル内で参照される外部コマンド・スクリプトの存在
- ワークフローの Step 間の論理的整合性

#### 修正能力

- 欠落した参照ファイルのスケルトン生成
- パスの修正 (相対パス → 正しいパス)
- allowed-tools への不足ツール追加

**ツール**: Read, Edit, Write, Glob, Grep

### 5. plugindev-quality-improver エージェント

**役割**: 品質基準違反の検出と改善

#### 検査項目 (skills.md 評価基準準拠)

- SKILL.md の行数 (500行以下)
- Progressive Disclosure パターン準拠
- 参照深度が1階層のみか
- description の長さと質
- テンプレート・例の有無
- context: fork / agents の適切な活用

#### 修正能力

- 長大な SKILL.md の外部ファイル分離 (reference/ に切り出し)
- description のリライト
- 不足セクションの追加 (Error Handling, Verification 等)

**ツール**: Read, Edit, Write, Glob, Grep

## marketplace.json 変更

```json
{
  "name": "plugin-dev",
  "description": "Plugin development tools for diagnosing and fixing skill errors, validating plugin structure, and improving skill quality.",
  "version": "1.0.0",
  "author": { "name": "naoto24kawa" },
  "source": "./plugins/plugin-dev",
  "category": "development"
}
```

## 成功基準

1. Stop Hook がスキル実行エラーを正しく検知できる
2. エラー種別 (syntax/runtime/quality) が正しく分類される
3. 各エージェントが対応するエラーを自動修正できる
4. 修正後のスキルが正常に動作する
5. 重大変更時にユーザー確認が入る
