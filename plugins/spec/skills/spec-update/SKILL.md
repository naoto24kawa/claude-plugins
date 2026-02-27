---
name: spec-update
description: This skill should be used when the user asks to "PRの差分を仕様書に反映して", "spec-updateを実行して", "仕様書を差分更新して", "update specs from PR", "#51 の変更を仕様書に反映", "仕様書をPRに合わせて更新", "specを差分更新", "ブランチの差分から仕様書を更新", "仕様書を部分更新して", "incremental spec update". Analyzes PR or branch diffs to determine which specification phases are affected, then re-executes only those phase agents for incremental spec updates.
allowed-tools: ["Task", "Bash", "Read", "Write"]
---

# Incremental Specification Update from PR/Branch Diffs

Analyze code changes from a PR or branch diff to determine which specification documents need updating, then re-execute only the affected phase agents.

## Overview

This skill does not perform code analysis directly. Instead, it retrieves diffs, maps changed files to affected specification phases, and dispatches the corresponding phase agents via the Task tool. Only affected phases are re-executed, making updates faster than full regeneration.

### Design Principles

- **Minimal re-execution**: Only affected phases run, not the full pipeline
- **Deterministic mapping**: File path patterns determine which phases are affected
- **Always-run phases**: Phase 0 (context) and Phase 8 (index) always run to maintain consistency
- **File-based interface**: Phases communicate through Markdown files, same as spec-coordinator

## Prerequisites Check

Before starting, verify that specification documents already exist:

1. Check that `.docs/specs/` (or the user-specified output directory) exists
2. Check that `_context.md` and `00-overview.md` exist in the output directory
3. If either is missing, inform the user: "仕様書がまだ生成されていません。先に `spec-coordinator` で全体生成を実行してください。"
4. Stop execution if prerequisites are not met

## Output Directory

Use the same output directory as spec-coordinator:

1. If the user specifies a custom directory, use it
2. Otherwise, use the default: `.docs/specs/`

## Input Resolution

### Default Branch Detection

Before resolving input, detect the repository's default branch:

```bash
git symbolic-ref refs/remotes/origin/HEAD | sed 's|refs/remotes/origin/||'
```

Fall back to `main` (or `master` if `main` does not exist). Use the detected branch as `{DEFAULT_BRANCH}` in all subsequent commands.

Determine the diff source from user input. Support the following formats:

| Input Format | Example | Resolution |
|-------------|---------|------------|
| PR number | `#51`, `51` | `gh pr diff 51` |
| PR URL | `https://github.com/org/repo/pull/51` | Extract PR number, then `gh pr diff 51` |
| Branch name | `feat/my-feature` | `git diff {DEFAULT_BRANCH}...feat/my-feature` |
| No input (default) | (none) | `git diff {DEFAULT_BRANCH}...HEAD` |

## Execution Flow

### Step 1: Retrieve Diff and Changed Files

1. **Get the diff** based on input resolution:
   - For PR: `gh pr diff {PR_NUMBER}`
   - For branch/default: `git diff {BASE}...{TARGET}`
   - If the primary command fails, try the alternative (e.g., `git diff origin/{DEFAULT_BRANCH}...HEAD`)

2. **Get changed file list**:
   - For PR: `gh pr view {PR_NUMBER} --json files --jq '.files[].path'`
   - For branch/default: `git diff {BASE}...{TARGET} --name-only`

3. Report to user: "差分を取得しました。変更ファイル数: N 件"

### Step 2: Map Changed Files to Affected Phases

Apply the mapping rules from **`references/file-phase-mapping.md`** to each changed file path. A phase is affected if any changed file matches its pattern. Read the reference file at the start of execution to load the mapping rules.

The general mapping principle:
- Data layer changes (DB, ORM, migrations) → Phase 3
- Core business logic changes → Phase 2, 5, 6
- API/handler changes → Phase 4, 5
- Infrastructure/config changes → Phase 7
- Package/dependency changes → Phase 1

**For files not matching any pattern:** Apply the general mapping principle above based on the file's role in the codebase. If the changes are documentation-only (e.g., README.md, CHANGELOG.md), skip them as they do not affect specification phases. If the role is truly ambiguous, ask the user which phases should be updated.

### Step 3: Determine Final Phase Set

1. **Always include**: Phase 0 (context) and Phase 8 (index)
2. **Conditional Phase 1**: If 3 or more other phases (2-7) are affected, also include Phase 1 (overview)
3. **Full re-gen threshold**: If ALL phases 2-7 are affected, ask the user:
   - "全てのPhase(2-7)が影響を受けています。`spec-coordinator` で全体再生成を実行しますか? それともこのまま差分更新を続けますか?"
   - Wait for user response. If they choose full re-gen, instruct them to run `spec-coordinator` instead and stop execution.

4. Report the execution plan to user:
   - "以下のPhaseを再実行します: Phase 0, Phase 2, Phase 5, Phase 8"
   - Include the reason for each phase (which file patterns triggered it)

### Step 4: Execute Affected Phase Agents

Execute phases in order (0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8). Skip phases not in the affected set.

**Note:** Use the existing file as-is when a prerequisite phase is not in the affected set. Only affected documents are regenerated.

For each affected phase, spawn the corresponding agent via the Task tool:

1. **Phase 0** - Spawn `spec-phase0-context` agent
   - Task prompt: "Generate repository context. Output: `{OUTPUT_DIR}/_context.md`"
   - Report: "Phase 0 完了: `{OUTPUT_DIR}/_context.md`"

2. **Phase 1** - Spawn `spec-phase1-overview` agent (if included)
   - Task prompt: "Generate system overview. Prerequisites: `{OUTPUT_DIR}/_context.md`. Output: `{OUTPUT_DIR}/00-overview.md`"
   - Report: "Phase 1 完了: `{OUTPUT_DIR}/00-overview.md`"

3. **Phase 2** - Spawn `spec-phase2-architecture` agent (if affected)
   - Task prompt: "Generate architecture doc. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/01-architecture.md`"
   - Report: "Phase 2 完了: `{OUTPUT_DIR}/01-architecture.md`"

4. **Phase 3** - Spawn `spec-phase3-datamodel` agent (if affected)
   - Task prompt: "Generate data model doc. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/02-data-model.md`"
   - Report: "Phase 3 完了: `{OUTPUT_DIR}/02-data-model.md`"

5. **Phase 4** - Spawn `spec-phase4-api` agent (if affected)
   - Task prompt: "Generate API specification. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/03-api-specification.md`"
   - Note: If the agent reports no API exists, acknowledge the skip and continue
   - Report: "Phase 4 完了: `{OUTPUT_DIR}/03-api-specification.md`"

6. **Phase 5** - Spawn `spec-phase5-usecases` agent (if affected)
   - Task prompt: "Generate use case docs. Prerequisites: `{OUTPUT_DIR}/00-overview.md`, `{OUTPUT_DIR}/01-architecture.md`. Output directory: `{OUTPUT_DIR}/04-usecases/`"
   - Report: "Phase 5 完了: `{OUTPUT_DIR}/04-usecases/`"

7. **Phase 6** - Spawn `spec-phase6-rules` agent (if affected)
   - Task prompt: "Extract business rules. Prerequisites: `{OUTPUT_DIR}/00-overview.md`, `{OUTPUT_DIR}/01-architecture.md`. Output: `{OUTPUT_DIR}/05-business-rules.md`"
   - Report: "Phase 6 完了: `{OUTPUT_DIR}/05-business-rules.md`"

8. **Phase 7** - Spawn `spec-phase7-nonfunctional` agent (if affected)
   - Task prompt: "Estimate non-functional requirements. Prerequisites: `{OUTPUT_DIR}/_context.md`, `{OUTPUT_DIR}/00-overview.md`. Output: `{OUTPUT_DIR}/06-non-functional.md`"
   - Report: "Phase 7 完了: `{OUTPUT_DIR}/06-non-functional.md`"

9. **Phase 8** - Spawn `spec-phase8-index` agent (always)
   - Task prompt: "Generate index and check consistency of all docs in `{OUTPUT_DIR}/`. Output: `{OUTPUT_DIR}/_index.md`"
   - Report: "Phase 8 完了: `{OUTPUT_DIR}/_index.md`"

### Step 5: Summary Report

After all phases complete, present a summary:

```
## 差分更新完了

- 差分ソース: PR #51 (or branch name, etc.)
- 変更ファイル数: N 件
- 実行Phase: Phase 0, 2, 5, 8
- 更新されたドキュメント:
  - `{OUTPUT_DIR}/_context.md` (Phase 0)
  - `{OUTPUT_DIR}/01-architecture.md` (Phase 2)
  - `{OUTPUT_DIR}/04-usecases/` (Phase 5)
  - `{OUTPUT_DIR}/_index.md` (Phase 8)

`{OUTPUT_DIR}/_index.md` で整合性チェック結果を確認してください。
```

## Phase Mapping Reference

Consult **`../../references/phase-mapping.md`** for the full phase agent table (prerequisites, outputs, prompt format). This reference is shared with spec-coordinator.

## Additional Resources

### Reference Files

- **`references/file-phase-mapping.md`** - File path to phase mapping rules (default patterns + customization guide)
- **`../../references/phase-mapping.md`** - Phase agent table with prerequisites and outputs (shared with spec-coordinator)

### Examples

- **`examples/example-pr-update.md`** - Complete execution example for PR #51 showing diff retrieval, phase mapping, and summary report

## Error Handling

- If an agent returns an error, report the error content to the user and ask for instructions
- If Phase 4 (API) reports no API exists, acknowledge the skip and continue to the next phase
- If the diff command fails, try the alternative approach:
  - `gh pr diff` failure → try `git diff origin/{DEFAULT_BRANCH}...HEAD`
  - `git diff` failure → try `gh pr list --head {BRANCH} --json number` to find a PR number, then `gh pr diff`
- If no changed files are found, inform the user: "差分が見つかりませんでした。ブランチやPR番号を確認してください。"
