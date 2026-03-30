# plugin-dev:skill-improver Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** スキル実行エラーを自動検知・診断・修正するメタスキルプラグインを作成する

**Architecture:** 新規 plugin-dev プラグインに、Stop Hook (エラー検知) + skill-improver スキル (診断・委譲) + 3専門エージェント (構文修正/実行時デバッグ/品質改善) を配置する。Hook がエラーを検知し、スキルがエラーを分類して適切なエージェントに委譲する。

**Tech Stack:** Claude Code Plugin (SKILL.md, agents/*.md, hooks/hooks.json), YAML frontmatter, Progressive Disclosure pattern

**Design Doc:** `.docs/plans/plugin-dev-skill-improver-design.md`

---

### Task 1: プラグインディレクトリ構造の作成

**Files:**
- Create: `plugins/plugin-dev/skills/skill-improver/` (dir)
- Create: `plugins/plugin-dev/skills/skill-improver/reference/` (dir)
- Create: `plugins/plugin-dev/agents/` (dir)
- Create: `plugins/plugin-dev/hooks/` (dir)

**Step 1: ディレクトリ構造を作成**

```bash
mkdir -p plugins/plugin-dev/skills/skill-improver/reference
mkdir -p plugins/plugin-dev/agents
mkdir -p plugins/plugin-dev/hooks
```

**Step 2: 構造を確認**

Run: `find plugins/plugin-dev -type d | sort`
Expected:
```
plugins/plugin-dev
plugins/plugin-dev/agents
plugins/plugin-dev/hooks
plugins/plugin-dev/skills
plugins/plugin-dev/skills/skill-improver
plugins/plugin-dev/skills/skill-improver/reference
```

**Step 3: コミット**

```bash
git add plugins/plugin-dev/
git commit -m "chore(plugin-dev): scaffold plugin directory structure"
```

---

### Task 2: marketplace.json にプラグインエントリを追加

**Files:**
- Modify: `.claude-plugin/marketplace.json`

**Step 1: 現在の marketplace.json を確認**

Run: `cat .claude-plugin/marketplace.json | jq '.plugins | length'`
Expected: `7`

**Step 2: plugin-dev エントリを追加**

`.claude-plugin/marketplace.json` の `plugins` 配列末尾に追加:

```json
{
  "name": "plugin-dev",
  "description": "Plugin development tools for diagnosing and fixing skill errors, validating plugin structure, and improving skill quality. Includes Stop hook for automatic error detection and specialized agents for syntax fixing, workflow debugging, and quality improvement.",
  "version": "1.0.0",
  "author": {
    "name": "naoto24kawa",
    "email": "naoto24kawa@gmail.com"
  },
  "source": "./plugins/plugin-dev",
  "category": "development"
}
```

**Step 3: JSON の妥当性を確認**

Run: `cat .claude-plugin/marketplace.json | jq '.plugins | length'`
Expected: `8`

Run: `cat .claude-plugin/marketplace.json | jq '.plugins[-1].name'`
Expected: `"plugin-dev"`

**Step 4: マーケットプレースバージョンをバンプ**

`version` を `"3.9.0"` → `"3.10.0"` に更新。

**Step 5: コミット**

```bash
git add .claude-plugin/marketplace.json
git commit -m "feat(plugin-dev): add plugin-dev to marketplace v3.10.0"
```

---

### Task 3: Stop Hook (skill-error-detector) の作成

**Files:**
- Create: `plugins/plugin-dev/hooks/hooks.json`

**Step 1: hooks.json を作成**

`plugins/plugin-dev/hooks/hooks.json`:

```json
{
  "description": "Detects skill execution errors at conversation end and suggests running skill-improver",
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "You are a skill error detector. Analyze the conversation transcript to determine if a Claude Code skill (SKILL.md) encountered an error during execution.\n\nCheck for these patterns:\n1. YAML frontmatter parse errors in SKILL.md files\n2. Missing reference files that a skill tried to Read but got 'file not found'\n3. Tool calls that failed during a skill workflow execution\n4. Skills that loaded but their workflow steps were interrupted or produced errors\n5. Missing or invalid 'name', 'description', or 'allowed-tools' fields\n\nIMPORTANT: Only detect errors that are clearly related to skill definition or execution problems. Do NOT flag:\n- Normal user errors or typos\n- Application code bugs unrelated to skills\n- Intentional file-not-found checks\n- Successful skill executions\n\nIf a skill error is detected, respond with:\n```json\n{\"decision\": \"block\", \"reason\": \"[skill-error-detector] Skill execution error detected.\\nTarget: <skill-name>\\nError type: <syntax|runtime|quality>\\nSummary: <brief description>\\n\\nRun /skill plugin-dev:skill-improver to diagnose and fix.\"}\n```\n\nIf no skill error is detected, respond with:\n```json\n{\"decision\": \"approve\", \"reason\": \"No skill errors detected.\"}\n```",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**Step 2: JSON の妥当性を確認**

Run: `cat plugins/plugin-dev/hooks/hooks.json | jq '.hooks.Stop[0].hooks[0].type'`
Expected: `"prompt"`

**Step 3: コミット**

```bash
git add plugins/plugin-dev/hooks/hooks.json
git commit -m "feat(plugin-dev): add skill-error-detector Stop hook"
```

---

### Task 4: diagnosis-rules.md (エラー分類リファレンス) の作成

**Files:**
- Create: `plugins/plugin-dev/skills/skill-improver/reference/diagnosis-rules.md`

**Step 1: diagnosis-rules.md を作成**

`plugins/plugin-dev/skills/skill-improver/reference/diagnosis-rules.md`:

```markdown
# Diagnosis Rules

## Error Classification

### syntax: YAML Frontmatter / Structure Errors

**Detection patterns:**
- YAML parse failure (invalid indentation, missing colons, unclosed quotes)
- Missing required field: `name`
- Missing required field: `description`
- Invalid `name` format (not kebab-case, exceeds 64 chars)
- Invalid `description` format (not third-person, missing trigger words, exceeds 1024 chars)
- Invalid `allowed-tools` entries (non-existent tool names)
- Invalid `agents` entries (agent files not found in plugin's agents/ directory)
- Missing or malformed `---` delimiters

**Delegate to:** plugindev-syntax-fixer

**Auto-fix scope:**
- YAML indentation → auto-fix
- Missing required fields → auto-fix with template defaults
- Invalid name format → auto-fix (convert to kebab-case)
- Description issues → auto-fix (rewrite to third-person)
- Invalid tool names → suggest correction (user confirmation)

### runtime: Workflow Execution Errors

**Detection patterns:**
- Reference file not found: SKILL.md references a file via Read but path does not exist
- Tool not in allowed-tools: Skill workflow uses a tool not listed in `allowed-tools`
- Script not found: Command hook or script reference points to non-existent file
- Broken relative path: Paths using `./reference/` or `./templates/` resolve incorrectly
- Step dependency failure: A workflow step depends on output from a failed previous step

**Delegate to:** plugindev-workflow-debugger

**Auto-fix scope:**
- Missing reference files → auto-generate skeleton (user confirmation for content)
- Path corrections → auto-fix (relative path resolution)
- Missing allowed-tools entry → auto-fix (add tool to list)
- Missing script files → create placeholder with TODO (user confirmation)

### quality: Standards Violation

**Detection patterns:**
- SKILL.md exceeds 500 lines
- Reference depth exceeds 1 level (file references another reference file)
- Missing Progressive Disclosure (large SKILL.md without reference/ or templates/ separation)
- Description too short (< 50 chars) or too long (> 1024 chars)
- No workflow verification points (missing "Verification:" sections)
- No error handling defined
- Missing templates or examples for output-producing skills
- context: fork not used for long-running or complex analysis skills
- agents field not used when multiple specialist perspectives needed

**Delegate to:** plugindev-quality-improver

**Auto-fix scope:**
- Line count exceeded → auto-split into reference/ files (user confirmation for split points)
- Missing verification sections → auto-add template (auto-fix)
- Missing error handling → auto-add template (auto-fix)
- Description quality → auto-rewrite (auto-fix)
- context/agents suggestions → suggest only (user confirmation)

## Severity Levels

| Level | Description | Action |
|-------|------------|--------|
| Critical | Skill cannot load or execute at all | Auto-fix immediately |
| High | Skill loads but workflow fails partway | Auto-fix, report |
| Medium | Skill works but has quality issues | Auto-fix minor, suggest major |
| Low | Style or best-practice improvements | Suggest only |

## Valid Tool Names

```
Read, Edit, Write, Glob, Grep, Bash, Agent, AskUserQuestion,
WebFetch, WebSearch, NotebookEdit, TodoWrite, TaskCreate, TaskUpdate,
TaskGet, TaskList, ToolSearch, Skill, SendMessage
```

MCP tools follow pattern: `mcp__<server>__<tool>`
```

**Step 2: ファイルの存在を確認**

Run: `wc -l plugins/plugin-dev/skills/skill-improver/reference/diagnosis-rules.md`
Expected: ~85 lines

**Step 3: コミット**

```bash
git add plugins/plugin-dev/skills/skill-improver/reference/diagnosis-rules.md
git commit -m "feat(plugin-dev): add diagnosis rules reference for skill-improver"
```

---

### Task 5: skill-improver SKILL.md の作成

**Files:**
- Create: `plugins/plugin-dev/skills/skill-improver/SKILL.md`

**Step 1: SKILL.md を作成**

`plugins/plugin-dev/skills/skill-improver/SKILL.md`:

```markdown
---
name: skill-improver
description: |
  Diagnoses and fixes skill errors automatically. This skill should be used
  when the user asks to "スキルを修正したい", "skill error", "SKILL.mdのエラーを直して",
  "スキルが動かない", "frontmatterエラー", "参照ファイルが見つからない",
  "skill-improverを実行したい", "スキルの品質を改善したい".
  Triggered by skill-error-detector Stop hook or manually invoked.
  Classifies errors into syntax/runtime/quality and delegates to specialized
  agents: plugindev-syntax-fixer, plugindev-workflow-debugger, plugindev-quality-improver.
allowed-tools: [Read, Edit, Write, Glob, Grep, AskUserQuestion, Agent]
context: fork
agents:
  - plugindev-syntax-fixer
  - plugindev-workflow-debugger
  - plugindev-quality-improver
user-invocable: true
---

# Skill Improver

スキルのエラーを診断し、自動修正する。3つの専門エージェントに委譲して対応する。

## Prerequisites

- 対象スキルの SKILL.md パスまたはプラグイン名:スキル名が特定されていること
- エラー内容の概要 (Stop Hook 出力 or ユーザー入力)

## Workflow

### Step 1: Collect Error Information

エラー情報を収集する。

**If triggered by Stop Hook:**
- Hook 出力から対象スキル名、エラー種別、概要をパースする

**If manually invoked:**
- AskUserQuestion で対象スキルを特定する:
  ```
  どのスキルを修正しますか?
  例: review:ts-code-review, observability:observability-setup
  ```
- エラーの概要を聞く:
  ```
  どのようなエラーが発生しましたか?
  1. SKILL.md の読み込みエラー (構文エラー)
  2. スキル実行中にエラーが発生 (実行時エラー)
  3. スキルは動くが品質に問題 (品質問題)
  ```

Verification: 対象スキルのパスとエラー種別が特定できている

### Step 2: Load Target Skill

対象スキルの全ファイルを読み込む。

1. `Glob` でスキルディレクトリ内の全ファイルを検出:
   ```
   plugins/<plugin>/skills/<skill>/**/*
   ```
2. `Read` で SKILL.md を読み込む
3. `Glob` で reference/, templates/, examples/ 配下のファイルを検出
4. 関連するエージェントファイルがあれば読み込む:
   ```
   plugins/<plugin>/agents/<agent-name>.md
   ```

Verification: SKILL.md の内容が取得できている。関連ファイル一覧が把握できている。

### Step 3: Classify Error

`./reference/diagnosis-rules.md` を Read で読み込み、エラーを分類する。

分類結果:
- `syntax`: YAML 不正、必須フィールド欠落、フォーマット違反
- `runtime`: 参照ファイル欠如、ツール名不正、パス不正
- `quality`: 500行超過、Progressive Disclosure 違反、description 不良

複数の種別に該当する場合は、severity が高い順に処理する。

Verification: エラーが syntax/runtime/quality のいずれかに分類されている

### Step 4: Delegate to Agent

分類に応じて Agent ツールで専門エージェントに委譲する。

| Error Type | Agent | Task |
|-----------|-------|------|
| syntax | plugindev-syntax-fixer | YAML frontmatter 修正、フィールド追加・修正 |
| runtime | plugindev-workflow-debugger | 参照ファイル修正、パス修正、ツール設定修正 |
| quality | plugindev-quality-improver | ファイル分割、description リライト、セクション追加 |

エージェントへのプロンプトに以下を含める:
- 対象 SKILL.md の内容
- 検出されたエラーの詳細
- 関連ファイル一覧
- diagnosis-rules.md の該当セクション

Verification: エージェントが修正案を返している

### Step 5: Apply Fixes

エージェントの修正案を適用する。

**Auto-fix (確認不要):**
- YAML インデント修正
- 必須フィールドの追加
- name のケバブケース変換
- description の三人称リライト
- allowed-tools への不足ツール追加
- Verification セクションの追加

**User confirmation required (AskUserQuestion):**
- ファイル構成の変更 (新規ファイル作成、分割)
- ロジック・ワークフローの変更
- context: fork / agents の追加
- 大規模な description リライト

Verification: Edit/Write が正常に完了している

### Step 6: Verify Fixes

修正後の検証を実行する。

1. Read で修正後の SKILL.md を再読み込み
2. YAML frontmatter がパース可能か確認
3. 必須フィールド (name, description) が存在するか確認
4. 参照ファイルが全て存在するか Glob で確認
5. SKILL.md が 500 行以内か確認
6. agents で指定されたエージェントファイルが存在するか確認

Verification: 全チェック項目がパスしている

### Step 7: Output Report

修正結果のレポートを出力する。

```
## Skill Improvement Report

- **Target**: <plugin>:<skill>
- **Error Type**: syntax / runtime / quality
- **Issues Found**: N
- **Auto-Fixed**: M
- **User-Confirmed Fixes**: K
- **Remaining (Manual Review)**: L

### Changes Applied
1. [type] description of change
2. [type] description of change

### Remaining Issues (if any)
- Issue description and suggested manual action
```

## Error Handling

- SKILL.md が見つからない場合: エラーメッセージを出力し、正しいパスの入力を求める
- エージェントが修正案を返さない場合: 手動修正のガイダンスを提供する
- 修正後も検証が失敗する場合: 残存問題をレポートに記載し、手動対応を推奨する

## Reference Files

| File | Content | When to Read |
|------|---------|-------------|
| `./reference/diagnosis-rules.md` | Error classification rules, fix patterns, valid tool names | Step 3 (always) |
```

**Step 2: 行数を確認**

Run: `wc -l plugins/plugin-dev/skills/skill-improver/SKILL.md`
Expected: ~160 lines (500行以下)

**Step 3: YAML frontmatter を確認**

Run: `head -15 plugins/plugin-dev/skills/skill-improver/SKILL.md`
Expected: Valid YAML with name, description, allowed-tools, context, agents

**Step 4: コミット**

```bash
git add plugins/plugin-dev/skills/skill-improver/SKILL.md
git commit -m "feat(plugin-dev): add skill-improver skill"
```

---

### Task 6: plugindev-syntax-fixer エージェントの作成

**Files:**
- Create: `plugins/plugin-dev/agents/plugindev-syntax-fixer.md`

**Step 1: エージェント定義を作成**

`plugins/plugin-dev/agents/plugindev-syntax-fixer.md`:

```markdown
---
name: plugindev-syntax-fixer
description: |
  Fixes YAML frontmatter and structural errors in SKILL.md files. Analyzes
  frontmatter parse issues, missing required fields (name, description),
  invalid field formats (kebab-case, third-person, trigger words), and
  broken agent/tool references. Use when a skill has YAML syntax errors or
  malformed frontmatter that prevents loading.

  <example>
  Context: A skill has invalid YAML frontmatter
  user: "SKILL.md の YAML がパースできない"
  assistant: "plugindev-syntax-fixer で YAML frontmatter を解析・修正します。"
  <commentary>
  YAML parsing errors are this agent's primary domain.
  </commentary>
  </example>

  <example>
  Context: A skill is missing required fields
  user: "スキルの description フィールドがない"
  assistant: "plugindev-syntax-fixer で必須フィールドを追加します。"
  <commentary>
  Missing required fields fall under syntax/structure fixes.
  </commentary>
  </example>
tools: ["Read", "Edit", "Glob", "Grep"]
model: inherit
---

あなたは Claude Code スキルの YAML frontmatter と構文の専門家です。
SKILL.md ファイルの構造的な問題を検出し、修正します。

## あなたの役割

1. YAML frontmatter のパース可能性を検証する
2. 必須フィールド (name, description) の存在と妥当性を確認する
3. フィールド形式の検証と修正を行う
4. 参照されるエージェント・ツールの存在を確認する

## 検査項目

### YAML Structure
- `---` デリミタが正しく開閉されている
- インデントが一貫している (2スペース)
- 文字列が適切にクォートされている
- マルチラインの `|` や `>` が正しく使われている

### Required Fields
- `name`: 存在する、ケバブケース、64文字以内
- `description`: 存在する、空でない、1024文字以内

### Field Format
- `name`: kebab-case (例: `skill-improver`, NOT `SkillImprover`)
- `description`: 三人称記述 ("This skill..." or 機能を主語にした記述)
- `description`: トリガーワード含有 ("Use when...", "...should be used when...")
- `allowed-tools`: 有効なツール名のリスト
- `agents`: プラグイン内に対応する .md ファイルが存在する

### Valid Tool Names
```
Read, Edit, Write, Glob, Grep, Bash, Agent, AskUserQuestion,
WebFetch, WebSearch, NotebookEdit, TodoWrite, TaskCreate,
TaskUpdate, TaskGet, TaskList, ToolSearch, Skill, SendMessage
```
MCP tools: `mcp__<server>__<tool>` 形式

## 修正方法

1. 問題を特定し、修正案を明示する
2. Edit ツールで修正を適用する
3. 修正後のfrontmatterを提示して確認する

## 出力形式

各問題について:
- **Severity**: Critical / High / Medium / Low
- **Issue**: 問題の説明
- **Fix**: 適用した修正内容
- **Before/After**: 変更前後の比較

すべての分析・出力は日本語で行う。
```

**Step 2: コミット**

```bash
git add plugins/plugin-dev/agents/plugindev-syntax-fixer.md
git commit -m "feat(plugin-dev): add plugindev-syntax-fixer agent"
```

---

### Task 7: plugindev-workflow-debugger エージェントの作成

**Files:**
- Create: `plugins/plugin-dev/agents/plugindev-workflow-debugger.md`

**Step 1: エージェント定義を作成**

`plugins/plugin-dev/agents/plugindev-workflow-debugger.md`:

```markdown
---
name: plugindev-workflow-debugger
description: |
  Debugs and fixes runtime errors in skill workflows. Identifies missing
  reference files, broken file paths, invalid tool references in
  allowed-tools, and logical inconsistencies between workflow steps. Use
  when a skill loads but fails during execution with file-not-found errors,
  tool errors, or incomplete workflow execution.

  <example>
  Context: A skill references a file that doesn't exist
  user: "スキル実行中に参照ファイルが見つからないエラーが出た"
  assistant: "plugindev-workflow-debugger で参照パスを検証・修正します。"
  <commentary>
  Missing reference files during execution are this agent's primary domain.
  </commentary>
  </example>

  <example>
  Context: A skill workflow fails mid-execution
  user: "スキルのワークフローが途中で止まる"
  assistant: "plugindev-workflow-debugger でワークフローの論理整合性を検証します。"
  <commentary>
  Workflow execution failures and step dependency issues.
  </commentary>
  </example>
tools: ["Read", "Edit", "Write", "Glob", "Grep"]
model: inherit
---

あなたは Claude Code スキルのワークフローデバッガーです。
スキル実行時に発生するランタイムエラーの原因を特定し、修正します。

## あなたの役割

1. SKILL.md 内で参照されるファイルの存在を検証する
2. ファイルパスの正確性を確認する
3. allowed-tools とワークフロー内のツール使用の整合性を検証する
4. ワークフローのステップ間の依存関係を分析する

## 検査項目

### Reference File Verification
- SKILL.md 内の `Read` 指示で参照されるファイルパスを抽出
- `./reference/`, `./templates/`, `./examples/` 配下のファイル存在確認
- 相対パスの解決が正しいか確認

### Tool Consistency
- ワークフロー内で使用するツール (Read, Write, Edit, Glob, Grep, AskUserQuestion, Agent 等)
- `allowed-tools` リストに全て含まれているか確認
- 使用されていないツールが `allowed-tools` に含まれていないか確認

### Workflow Logic
- Step 間の入出力依存関係
- 前提条件が満たされるか (前 Step の出力が次 Step の入力になる)
- エラーハンドリングのカバレッジ

### Script/Command References
- hooks 内のスクリプトパス (`$CLAUDE_PLUGIN_ROOT` 使用推奨)
- 外部コマンドの存在確認

## 修正方法

1. 欠落ファイルに対してスケルトンを生成 (Write)
2. パスの修正 (Edit)
3. allowed-tools への不足ツール追加 (Edit)
4. ワークフローの論理修正は修正案を提示し確認後に適用

## 出力形式

各問題について:
- **Severity**: Critical / High / Medium / Low
- **Issue**: 問題の説明
- **Root Cause**: 原因の特定
- **Fix**: 適用した修正内容または修正提案

すべての分析・出力は日本語で行う。
```

**Step 2: コミット**

```bash
git add plugins/plugin-dev/agents/plugindev-workflow-debugger.md
git commit -m "feat(plugin-dev): add plugindev-workflow-debugger agent"
```

---

### Task 8: plugindev-quality-improver エージェントの作成

**Files:**
- Create: `plugins/plugin-dev/agents/plugindev-quality-improver.md`

**Step 1: エージェント定義を作成**

`plugins/plugin-dev/agents/plugindev-quality-improver.md`:

```markdown
---
name: plugindev-quality-improver
description: |
  Detects and fixes quality violations in skills. Checks Progressive
  Disclosure compliance (500-line limit, reference depth), description
  quality, workflow verification points, error handling, and advanced
  feature usage (context: fork, agents, AskUserQuestion). Use when a
  skill works but has quality issues, is too long, or doesn't follow
  best practices.

  <example>
  Context: A skill's SKILL.md exceeds 500 lines
  user: "SKILL.md が長すぎるので分割したい"
  assistant: "plugindev-quality-improver で Progressive Disclosure に従ってファイルを分割します。"
  <commentary>
  File splitting and Progressive Disclosure compliance.
  </commentary>
  </example>

  <example>
  Context: A skill needs quality improvement
  user: "スキルの品質を改善したい"
  assistant: "plugindev-quality-improver で品質基準に沿った改善を行います。"
  <commentary>
  General quality improvement request.
  </commentary>
  </example>
tools: ["Read", "Edit", "Write", "Glob", "Grep"]
model: inherit
---

あなたは Claude Code スキルの品質改善の専門家です。
スキルの品質基準違反を検出し、ベストプラクティスに沿った改善を行います。

## あなたの役割

1. Progressive Disclosure パターンの準拠性を検証する
2. description の品質を評価・改善する
3. ワークフローの検証ポイントとエラーハンドリングを確認する
4. 高度な機能 (context, agents, AskUserQuestion) の適切な活用を提案する

## 検査項目

### Progressive Disclosure (Critical)
- SKILL.md が 500 行以下であること (700行超は要改善)
- 100行超のファイルに目次があること
- 詳細情報が reference/, templates/, examples/ に分離されていること
- 参照深度が 1 階層のみであること (SKILL.md → 参照ファイル)

### Description Quality (High)
- 三人称で記述されている ("This skill..." or 機能主語)
- トリガーワード含有 ("Use when...", "should be used when...")
- 長さ: 50-1024 文字
- 複数の関連キーワードを含む
- 日本語/英語のトリガーワードを含む

### Workflow Quality (Medium)
- 番号付きステップで定義されている
- 各ステップに "Verification:" セクションがある
- エラーハンドリングが定義されている
- フォールバック動作が明記されている
- デフォルト設定が明示されている

### Templates & Examples (Medium)
- 期待される出力形式が明確
- 入力/出力の例がある
- 良い例と悪い例の対比がある (該当する場合)

### Advanced Features (Low)
- 長時間/複雑なタスクに `context: fork` が検討されている
- 複数の専門的視点が必要な場合に `agents` が指定されている
- ユーザー確認が必要な場面で `AskUserQuestion` が `allowed-tools` に含まれている
- `allowed-tools` でツールアクセスが適切に制限されている

## 修正方法

### Auto-fix
- Verification セクションの追加
- Error Handling セクションの追加
- description の三人称リライト
- 目次の追加

### User confirmation required
- SKILL.md のファイル分割 (分割ポイントを提示して確認)
- context: fork / agents の追加提案
- 大規模な構造変更

## 出力形式

各問題について:
- **Category**: Progressive Disclosure / Description / Workflow / Templates / Advanced
- **Severity**: Critical / High / Medium / Low
- **Issue**: 問題の説明
- **Fix**: 適用した修正内容または修正提案
- **Impact**: 改善による効果

すべての分析・出力は日本語で行う。
```

**Step 2: コミット**

```bash
git add plugins/plugin-dev/agents/plugindev-quality-improver.md
git commit -m "feat(plugin-dev): add plugindev-quality-improver agent"
```

---

### Task 9: CLAUDE.md の更新

**Files:**
- Modify: `CLAUDE.md`

**Step 1: プラグイン構成テーブルに plugin-dev を追加**

`CLAUDE.md` のプラグイン構成テーブルに以下を追加:

```
| plugin-dev | 1.0.0 | 1 | 3 | development | スキルエラー自動検知・診断・修正 |
```

**Step 2: ディレクトリ構造に plugin-dev を追加**

ディレクトリ構造セクションに追加:

```
    └── plugin-dev/             # プラグイン開発ツール
        ├── skills/
        │   └── skill-improver/     # スキルエラー診断・修正
        ├── agents/
        │   ├── plugindev-syntax-fixer.md
        │   ├── plugindev-workflow-debugger.md
        │   └── plugindev-quality-improver.md
        └── hooks/
            └── hooks.json          # Stop Hook (エラー検知)
```

**Step 3: スキル実行例セクションに追加**

```bash
# Plugin-dev系 (1スキル)
/skill plugin-dev:skill-improver
```

**Step 4: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: add plugin-dev plugin to CLAUDE.md"
```

---

### Task 10: 全体検証

**Step 1: ファイル構成の確認**

Run: `find plugins/plugin-dev -type f | sort`
Expected:
```
plugins/plugin-dev/agents/plugindev-quality-improver.md
plugins/plugin-dev/agents/plugindev-syntax-fixer.md
plugins/plugin-dev/agents/plugindev-workflow-debugger.md
plugins/plugin-dev/hooks/hooks.json
plugins/plugin-dev/skills/skill-improver/SKILL.md
plugins/plugin-dev/skills/skill-improver/reference/diagnosis-rules.md
```

**Step 2: marketplace.json の整合性確認**

Run: `cat .claude-plugin/marketplace.json | jq '.plugins[] | select(.name == "plugin-dev") | {name, version, source, category}'`
Expected:
```json
{
  "name": "plugin-dev",
  "version": "1.0.0",
  "source": "./plugins/plugin-dev",
  "category": "development"
}
```

**Step 3: SKILL.md が 500 行以内か確認**

Run: `wc -l plugins/plugin-dev/skills/skill-improver/SKILL.md`
Expected: < 500

**Step 4: hooks.json の JSON 妥当性確認**

Run: `cat plugins/plugin-dev/hooks/hooks.json | jq .`
Expected: Valid JSON output

**Step 5: 全エージェントの frontmatter 確認**

Run: `for f in plugins/plugin-dev/agents/*.md; do echo "=== $f ==="; head -3 "$f"; done`
Expected: Each file starts with `---` and has a `name:` field

**Step 6: コミットログの確認**

Run: `git log --oneline -10`
Expected: Task 1-9 の各コミットが存在する
