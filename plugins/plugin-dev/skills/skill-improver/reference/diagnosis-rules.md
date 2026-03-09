# Diagnosis Rules - エラー分類ルールと修正パターン

skill-improver の Step 3 (Error Classification) で使用する診断ルール。
検出されたエラーを syntax / runtime の 2 種類に分類し、適切な修正エージェントに委譲する。
品質問題 (Progressive Disclosure, description品質等) は skill-development や claude-config-review の範囲。

---

## Error Classification

### 1. syntax - YAML Frontmatter / Structure Errors

SKILL.md の YAML フロントマターや構造に関するエラー。
スキルのロード自体が失敗する可能性が高い。

**委譲先**: `plugindev-syntax-fixer`

#### 検出パターンと修正方針

| ID | 検出パターン | Severity | 自動修正 | 修正内容 |
|----|------------|----------|---------|---------|
| SYN-001 | YAML パースエラー (不正なインデント, 不正な文字) | Critical | auto | インデントを 2 スペースに正規化、不正文字を除去 |
| SYN-002 | 必須フィールド欠落 (`name`, `description`) | Critical | auto (テンプレート補完) | テンプレートから欠落フィールドを補完 |
| SYN-003 | `name` が不正形式 (ケバブケースでない) | High | auto | ケバブケースに自動変換 (例: `mySkill` → `my-skill`) |
| SYN-004 | `name` が 64 文字超過 | High | auto | 短縮名を提案し自動適用 |
| SYN-005 | `description` が三人称形式でない | Medium | auto | 三人称形式にリライト |
| SYN-006 | `description` にトリガーワードが含まれない | Medium | auto | 適切なトリガーワードを追加してリライト |
| SYN-007 | `description` が 1024 文字超過 | High | auto | 1024 文字以内に要約 |
| SYN-008 | `allowed-tools` に無効なツール名 | High | suggest (user confirm) | 有効なツール名リストから候補を提示 |
| SYN-009 | `agents` に存在しないファイルパス | High | suggest (user confirm) | 正しいパスを検索して提案 |
| SYN-010 | `---` デリミタの欠落または不正 | Critical | auto | フロントマターの `---` デリミタを修復 |

#### 検出ロジック

```
1. SKILL.md を Read で読み込む
2. 先頭行が `---` で始まるか確認 → 不一致なら SYN-010
3. YAML ブロックをパース → 失敗なら SYN-001
4. name フィールド:
   - 存在確認 → 欠落なら SYN-002
   - /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/ にマッチするか → 不一致なら SYN-003
   - 64 文字以下か → 超過なら SYN-004
5. description フィールド:
   - 存在確認 → 欠落なら SYN-002
   - 三人称動詞で始まるか (Analyzes, Creates, Reviews, etc.) → 不一致なら SYN-005
   - トリガーワードを含むか → 欠落なら SYN-006
   - 1024 文字以内か → 超過なら SYN-007
6. allowed-tools: 各エントリを Valid Tool Names リストと照合 → 不一致なら SYN-008
7. agents: 各エントリのファイルパスが存在するか Glob で確認 → 不在なら SYN-009
```

---

### 2. runtime - Workflow Execution Errors

スキルの実行中に発生するエラー。スキルはロードできるが、ワークフローが途中で失敗する。

**委譲先**: `plugindev-workflow-debugger`

#### 検出パターンと修正方針

| ID | 検出パターン | Severity | 自動修正 | 修正内容 |
|----|------------|----------|---------|---------|
| RUN-001 | 参照ファイルが見つからない (`Read` 対象の reference/ ファイル) | High | auto (スケルトン生成) + user confirm (内容) | スケルトンファイルを自動生成、内容はユーザー確認 |
| RUN-002 | 使用ツールが `allowed-tools` に未登録 | High | auto | `allowed-tools` にエントリを追加 |
| RUN-003 | スクリプトファイルが見つからない (`Bash` 対象) | High | create placeholder + user confirm | プレースホルダースクリプトを生成、ユーザー確認 |
| RUN-004 | 相対パスが壊れている (ディレクトリ移動後の参照) | Medium | auto | 正しい相対パスに修正 |
| RUN-005 | ステップ間の依存関係エラー (前ステップの出力を参照するが未定義) | Medium | suggest | 依存関係の修正案を提示 |

#### 検出ロジック

```
1. SKILL.md 本文から参照されているファイルパスを抽出
   - `Read` 指示内のパス (reference/, templates/ 等)
   - `Bash` 指示内のスクリプトパス
2. 各パスに対して Glob で存在確認:
   - reference/ 内ファイル → 不在なら RUN-001
   - スクリプトファイル → 不在なら RUN-003
3. allowed-tools と本文中のツール使用を照合:
   - 本文で使用しているが allowed-tools にないツール → RUN-002
4. 相対パスの整合性チェック:
   - `./` や `../` で始まるパスを解決し、存在確認 → 不正なら RUN-004
5. ステップ間のデータフロー分析:
   - 各ステップの入出力を追跡 → 前ステップ出力の未定義参照なら RUN-005
```

---

### Note: 品質問題について

スキルの品質問題 (Progressive Disclosure 違反、description品質、Verification/Error Handling 欠如等) は
本スキルのスコープ外。以下のツールを案内する:

- スキル作成・改善ガイド: `/skill plugin-dev:skill-development`
- A-Fグレード品質レビュー: `/skill claude:claude-config-review`

---

## Severity Levels

| Level | 定義 | 影響 | 修正方針 |
|-------|------|------|---------|
| **Critical** | スキルがロード/実行できない | 完全に動作不能 | 即時自動修正 |
| **High** | スキルはロードできるがワークフローが途中で失敗 | 部分的に動作不能 | 自動修正 + 結果を報告 |
| **Medium** | スキルは動作するが品質に問題がある | 保守性・UX の低下 | 軽微は自動修正、重要な変更は提案のみ |
| **Low** | スタイルやベストプラクティスの改善 | 将来的な問題リスク | 提案のみ (ユーザー判断) |

### Severity 判定フロー

```
エラー検出
  ├── スキルがロードできない? → Critical (syntax)
  ├── ワークフローが途中で停止する? → High (runtime)
  ├── 軽微な構文/参照問題? → Medium (syntax/runtime)
  └── 品質問題? → スコープ外 (skill-development / claude-config-review へ案内)
```

---

## Valid Tool Names

スキルの `allowed-tools` で指定可能なツール名の一覧。

### 組み込みツール

```
Read, Edit, Write, Glob, Grep, Bash, Agent, AskUserQuestion,
WebFetch, WebSearch, NotebookEdit, TodoWrite, TaskCreate, TaskUpdate,
TaskGet, TaskList, ToolSearch, Skill, SendMessage
```

### MCP ツール

MCP (Model Context Protocol) サーバー経由のツールは以下の命名規則に従う:

```
mcp__<server-name>__<tool-name>
```

**例**:
- `mcp__slack__send_message`
- `mcp__github__create_issue`
- `mcp__filesystem__list_directory`

### ツール名検証ルール

1. 組み込みツール名はリスト内の文字列と完全一致
2. MCP ツール名は `mcp__` プレフィックスで始まり、`__` で区切られた 3 パートで構成
3. 各パートは空でないこと
4. 大文字・小文字は区別する (組み込みツールは PascalCase)

---

## 診断レポート出力形式

各エラーは以下の形式で報告する:

```
[<severity>] <ID>: <概要>
  場所: <ファイルパス>:<行番号>
  検出値: <問題のある値>
  修正案: <提案する修正内容>
  修正方法: auto | suggest (user confirm)
  委譲先: <エージェント名>
```

**出力例**:

```
[Critical] SYN-010: YAML フロントマターの --- デリミタが欠落
  場所: plugins/example/skills/my-skill/SKILL.md:1
  検出値: (先頭行が --- でない)
  修正案: ファイル先頭に --- デリミタを追加
  修正方法: auto
  委譲先: plugindev-syntax-fixer

[High] RUN-002: allowed-tools に未登録のツール使用
  場所: plugins/example/skills/my-skill/SKILL.md:45
  検出値: Bash (本文で使用しているが allowed-tools に未記載)
  修正案: allowed-tools に Bash を追加
  修正方法: auto
  委譲先: plugindev-workflow-debugger

[Medium] RUN-004: 相対パスが壊れている
  場所: plugins/example/skills/my-skill/SKILL.md:72
  検出値: ./reference/old-name.md (ファイル名変更後の参照)
  修正案: ./reference/new-name.md に修正
  修正方法: auto
  委譲先: plugindev-workflow-debugger
```
