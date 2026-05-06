---
name: spec-coordinator
description: This skill should be used when the user asks to "仕様書を生成して", "specを作って", "仕様書を作成", "コードベースから仕様書", "リポジトリの仕様書を生成", "specification generation", "generate specs", "generate documentation from code", "reverse engineer specifications", "create spec documents from codebase", "仕様書の自動生成", "spec-coordinatorを使って". Orchestrates multi-phase specification document generation from codebases using 9 specialized sub-agents, producing system overview, architecture, data model, API specification, use cases, business rules, and non-functional requirements documents with consistency checking.
allowed-tools: [Task, Bash, Read, Write, AskUserQuestion]
user-invocable: true
---

# Specification Document Generation Coordinator

Orchestrate generation of comprehensive specification documents from an existing codebase through 9 sequential phases using specialized sub-agents.

## Overview

This coordinator does not perform code analysis directly. Instead, dispatch specialized agents via the Task tool for each phase and integrate results. Phases are executed sequentially because each depends on outputs from previous phases.

### Design Principles

- **File-based interface**: Phases communicate through Markdown files, not direct data passing
- **Estimation marks**: Agents mark uncertain information with `⚠️ 推定` to distinguish facts from estimates
- **Human review points**: Stop for user review after Phase 1 (mandatory) and Phase 8 (recommended)

## Output Directory

Determine the output directory at the start of execution:

1. If the user specifies a custom directory, use it
2. Otherwise, use the default: `docs/specs/`

Create the output directory if it does not exist before launching any agents.

## Execution Flow

### Step 1: Foundation (Phase 0-1)

Launch sequentially:

1. **Phase 0** - Spawn `spec-phase0-context` agent via Task tool
   - Task prompt: "Generate repository context. Output: `{OUTPUT_DIR}/_context.md`"
   - Report on completion: "Phase 0 完了: `{OUTPUT_DIR}/_context.md`"

2. **Phase 1** - Spawn `spec-phase1-overview` agent via Task tool
   - Task prompt: "Generate system overview. Prerequisites: `{OUTPUT_DIR}/_context.md`. Output: `{OUTPUT_DIR}/00-overview.md`"
   - Report on completion: "Phase 1 完了: `{OUTPUT_DIR}/00-overview.md`"

3. **STOP** - Request user review before proceeding
   - Message: "Phase 1が完了しました。`{OUTPUT_DIR}/00-overview.md` をレビューしてください。特にプロジェクトの目的、用語集、機能一覧が正しいか確認をお願いします。問題なければ続行します。"
   - Wait for explicit approval before continuing

### Step 2: Detailed Analysis (Phase 2-7)

After user approval, launch sequentially:

4. **Phase 2** - Spawn `spec-phase2-architecture`
   - Task prompt: "Generate architecture doc. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/01-architecture.md`"

5. **Phase 3** - Spawn `spec-phase3-datamodel`
   - Task prompt: "Generate data model doc. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/02-data-model.md`"

6. **Phase 4** - Spawn `spec-phase4-api`
   - Task prompt: "Generate API specification. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/03-api-specification.md`"
   - Note: This phase may be skipped if the agent reports no API exists

7. **Phase 5** - Spawn `spec-phase5-usecases`
   - Task prompt: "Generate use case docs. Prerequisites: `{OUTPUT_DIR}/00-overview.md`, `{OUTPUT_DIR}/01-architecture.md`. Output directory: `{OUTPUT_DIR}/04-usecases/`"

8. **Phase 6** - Spawn `spec-phase6-rules`
   - Task prompt: "Extract business rules. Prerequisites: `{OUTPUT_DIR}/00-overview.md`, `{OUTPUT_DIR}/01-architecture.md`. Output: `{OUTPUT_DIR}/05-business-rules.md`"

9. **Phase 7** - Spawn `spec-phase7-nonfunctional`
   - Task prompt: "Estimate non-functional requirements. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/06-non-functional.md`"

Report "Phase N 完了: `{file_path}`" after each phase completes.

### Step 3: Final Consistency Check (Phase 8)

10. **Phase 8** - Spawn `spec-phase8-index`
    - Task prompt: "Generate index and check consistency of all docs in `{OUTPUT_DIR}/`. Output: `{OUTPUT_DIR}/_index.md`"

11. **Final review** - Request user confirmation
    - "全Phaseが完了しました。`{OUTPUT_DIR}/_index.md` にインデックスと整合性チェック結果があります。最終確認をお願いします。"

## Output Structure

```
{OUTPUT_DIR}/
├── _context.md              # Phase 0: Repository context
├── _index.md                # Phase 8: Index + consistency report
├── 00-overview.md           # Phase 1: System overview
├── 01-architecture.md       # Phase 2: Architecture
├── 02-data-model.md         # Phase 3: Data model
├── 03-api-specification.md  # Phase 4: API specification
├── 04-usecases/             # Phase 5: Use cases
│   ├── _index.md
│   └── UC-XXX-*.md
├── 05-business-rules.md     # Phase 6: Business rules
└── 06-non-functional.md     # Phase 7: Non-functional requirements
```

## Error Handling

- If an agent returns an error, report the error content to the user and ask for instructions
- If Phase 4 (API) reports no API exists, acknowledge the skip and continue to Phase 5
- If many estimation marks (`⚠️ 推定`) appear, warn the user about uncertainty level

## Individual Phase Re-execution

To re-execute a specific phase, spawn the corresponding agent directly with the appropriate prerequisites and output path. Previous phase outputs must already exist.

Consult **`../../references/phase-mapping.md`** for the full phase agent table (prerequisites, outputs, prompt format).

Example: "spec-phase3-datamodel を使って `{OUTPUT_DIR}/02-data-model.md` を再生成して"

For incremental updates based on PR/branch diffs, use the `spec-update` skill instead.

## リファレンスファイル

- **`../../references/phase-mapping.md`** - Phase別エージェント一覧 (前提条件、出力先、プロンプト形式)
- **`../../references/frontmatter-schema.md`** - docs/specs frontmatter の必須/オプションフィールド定義、doc_status 遷移ルール
- **`../../references/spec-template.md`** - type 別の仕様ドキュメントテンプレート (各エージェントが出力時に参照)
