# Phase Agent Reference

Shared reference for all spec plugin skills. Lists each phase agent with its prerequisites and output.

## Phase Mapping Table

| Phase | Agent | Prerequisites | Output |
|-------|-------|---------------|--------|
| 0 | spec-phase0-context | (none) | _context.md |
| 1 | spec-phase1-overview | _context.md | 00-overview.md |
| 2 | spec-phase2-architecture | _context.md, 00-overview.md | 01-architecture.md |
| 3 | spec-phase3-datamodel | _context.md, 00-overview.md | 02-data-model.md |
| 4 | spec-phase4-api | _context.md, 00-overview.md | 03-api-specification.md |
| 5 | spec-phase5-usecases | 00-overview.md, 01-architecture.md | 04-usecases/ |
| 6 | spec-phase6-rules | 00-overview.md, 01-architecture.md | 05-business-rules.md |
| 7 | spec-phase7-nonfunctional | _context.md, 00-overview.md | 06-non-functional.md |
| 8 | spec-phase8-index | All above files | _index.md |

## Task Prompt Format

Spawn each phase agent via the Task tool with this prompt structure:

```
"[Action description]. Prerequisites: `{OUTPUT_DIR}/[prereq files]`. Output: `{OUTPUT_DIR}/[output file]`"
```

Report "Phase N 完了: `{file_path}`" after each phase completes.
