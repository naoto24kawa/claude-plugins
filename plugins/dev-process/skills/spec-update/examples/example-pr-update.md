# Example: spec-update Execution for PR #51

## Input

```
PR #51 の差分を仕様書に反映して
```

## Step 1: Diff Retrieval

```
変更ファイル (19件):
  src/graph/deepdive/nodes/analyze.ts
  src/graph/deepdive/nodes/notion-fetch.ts
  src/graph/deepdive/state.ts
  src/index.ts
  src/llm/prompts.ts
  src/notion/page-reader.ts
  src/slack/actions.ts
  src/slack/blocks.ts
  tests/unit/graph/deepdive/nodes/analyze.test.ts
  tests/unit/graph/deepdive/nodes/notion-append.test.ts
  ... (+ 9 test files)
```

## Step 2: Phase Mapping

```
src/graph/**     → Phase 2, 5, 6
src/index.ts     → Phase 2
src/llm/**       → Phase 2, 6
src/notion/**    → Phase 4, 5
src/slack/**     → Phase 4, 5
tests/**         → Phase 7
.docs/plans/**   → skip (documentation-only)
```

Affected phases: 2, 4, 5, 6, 7

## Step 3: Final Phase Set

- Always-run: Phase 0, Phase 8
- Conditional Phase 1: 5 phases affected (>= 3) → Phase 1 included
- Full re-gen check: Phase 3 not affected → not all phases, proceed

**Final execution set: Phase 0, 1, 2, 4, 5, 6, 7, 8**

## Step 5: Summary Report

```
## 差分更新完了

- 差分ソース: PR #51 (feat/notion-fetch-improvement)
- 変更ファイル数: 19件
- 実行Phase: Phase 0, 1, 2, 4, 5, 6, 7, 8
- 更新されたドキュメント:
  - .docs/specs/_context.md (Phase 0)
  - .docs/specs/00-overview.md (Phase 1)
  - .docs/specs/01-architecture.md (Phase 2)
  - .docs/specs/03-api-specification.md (Phase 4)
  - .docs/specs/04-usecases/ (Phase 5)
  - .docs/specs/05-business-rules.md (Phase 6)
  - .docs/specs/06-non-functional.md (Phase 7)
  - .docs/specs/_index.md (Phase 8)

.docs/specs/_index.md で整合性チェック結果を確認してください。
```
