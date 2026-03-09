# File Path to Phase Mapping Rules

Map changed file paths to affected specification phases. Customize this mapping for each project's directory structure.

## Default Mapping Rules

These rules cover common project structures. Adapt patterns to match the target project.

### Source Code Patterns

| File Path Pattern | Affected Phases | Rationale |
|------------------|----------------|-----------|
| Database/ORM files (`**/db/**`, `**/database/**`, `**/models/**`, `drizzle/**`, `prisma/**`, `migrations/**`) | Phase 3 (data-model) | Schema or migration changes affect data model documentation |
| Core logic/graph/workflow files (`**/graph/**`, `**/core/**`, `**/domain/**`, `**/services/**`) | Phase 2 (architecture), Phase 5 (usecases), Phase 6 (rules) | Business logic changes affect architecture, use cases, and rules |
| LLM/AI integration files (`**/llm/**`, `**/ai/**`, `**/ml/**`) | Phase 2 (architecture), Phase 6 (rules) | AI integration changes affect architecture and business rules |
| API/handler files (`**/api/**`, `**/routes/**`, `**/handlers/**`, `**/controllers/**`, `**/slack/**`) | Phase 4 (api), Phase 5 (usecases) | API endpoint changes affect API specification and use cases |
| External integration files (`**/integrations/**`, `**/external/**`, `**/notion/**`, `**/clients/**`) | Phase 4 (api), Phase 5 (usecases) | External service changes affect API specification and use cases |
| Monitoring/scheduler files (`**/monitor/**`, `**/cron/**`, `**/jobs/**`, `**/workers/**`) | Phase 2 (architecture), Phase 5 (usecases) | Background processing changes affect architecture and use cases |
| Entry point (`**/index.ts`, `**/main.ts`, `**/app.ts`, `**/server.ts`) | Phase 2 (architecture) | Entry point changes affect architecture documentation |

### Configuration Patterns

| File Path Pattern | Affected Phases | Rationale |
|------------------|----------------|-----------|
| Package/project config (`package.json`, `tsconfig.json`, `Cargo.toml`, `go.mod`, `*.lock`, `*.lockb`) | Phase 1 (overview) | Dependency or config changes affect system overview |
| Environment/infra config (`*.env*`, `docker*`, `Dockerfile*`, `.github/**`, `terraform/**`) | Phase 7 (non-functional) | Infrastructure changes affect non-functional requirements |
| Test files (`tests/**`, `test/**`, `__tests__/**`, `**/spec/**`, `*.test.*`, `*.spec.*`) | Phase 7 (non-functional) | Test structure changes affect non-functional requirements (testing strategy) |

### Skip Patterns

These file changes do not affect specification phases and can be skipped:

- Documentation files: `README.md`, `CHANGELOG.md`, `.docs/**` (non-specs), `docs/**`
- Configuration files: `.gitignore`, `.eslintrc*`, `.prettierrc*`, `*.config.js` (linter/formatter only)
- Asset files: `*.png`, `*.jpg`, `*.svg`, `*.ico`

## Customization Guide

To adapt the mapping for a specific project:

1. Identify the project's directory structure from `_context.md`
2. Map each top-level source directory to the most relevant phases
3. Apply the general principle: data layer → Phase 3, business logic → Phase 2/5/6, API layer → Phase 4/5, infrastructure → Phase 7
