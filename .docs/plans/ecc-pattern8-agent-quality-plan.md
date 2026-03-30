# dev-process エージェント品質改善 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** everything-claude-code の Pattern 8 (エージェント役割分離) から「確信度の段階化」と「誤抽出パターンの明示」を dev-process の9エージェントに取り込み、仕様書の出力品質を向上させる

**Architecture:** 各エージェントの .md ファイル末尾の Quality Standards セクションに、確信度ガイドラインと誤抽出パターンを追加する。新ファイル作成なし。UX への影響なし (出力の質が上がるのみ)

**Tech Stack:** Markdown (エージェント定義ファイル)

---

## 変更方針

### 1. 確信度の段階化

現状: `⚠️ 推定` マークのみ (二値: 確定 or 推定)

改善後: 3段階で記載の確信度を明示する

| レベル | マーク | 基準 | 扱い |
|--------|--------|------|------|
| 確定 | (なし) | コード・設定ファイルから直接確認できる | そのまま記載 |
| 高確信 | `⚠️ 推定` | 複数の間接的証拠 (命名規則、テスト、コメント等) から推論 | 記載し、根拠を付記 |
| 低確信 | 記載しない | 単一の曖昧な手がかりのみ | 仕様書に含めない |

**要点: 低確信の情報は書かない。** 仕様書のノイズを減らす。

### 2. 誤抽出パターンの明示

各フェーズに固有の「これをドキュメントに含めるな」リストを追加する。

---

## ファイル構成

全変更は既存ファイルへの追記のみ:

```
plugins/dev-process/agents/
├── spec-phase0-context.md      # 変更なし (事実収集のみで推定なし)
├── spec-phase1-overview.md     # Task 1
├── spec-phase2-architecture.md # Task 2
├── spec-phase3-datamodel.md    # Task 3
├── spec-phase4-api.md          # Task 4
├── spec-phase5-usecases.md     # Task 5
├── spec-phase6-rules.md        # Task 6
├── spec-phase7-nonfunctional.md # Task 7
└── spec-phase8-index.md        # Task 8
```

Phase 0 は事実の列挙のみ (推定判断なし) のため変更不要。

---

### Task 1: Phase 1 (overview) に確信度ガイドと誤抽出パターンを追加

**Files:**
- Modify: `plugins/dev-process/agents/spec-phase1-overview.md:88-93`

- [ ] **Step 1: Quality Standards セクションに確信度ガイドラインを追記**

`spec-phase1-overview.md` 末尾の `**Quality Standards:**` セクションに以下を追加:

```markdown
**Confidence Guidelines:**
- Only include features confirmed by routing definitions, exports, or test coverage
- Do not include features inferred solely from file/directory names without code evidence
- If unsure whether something is a feature or an internal utility, omit it from the feature list

**False Extraction Patterns (do NOT include these):**
- Build/dev tooling (linters, formatters, bundler configs) as "features"
- Test utilities and fixtures as system components
- Deprecated code behind feature flags or commented out
- Third-party library internals exposed through re-exports
```

- [ ] **Step 2: 変更を確認**

ファイルを読み直し、既存の Quality Standards と矛盾がないことを確認する。

- [ ] **Step 3: Commit**

```bash
git add plugins/dev-process/agents/spec-phase1-overview.md
git commit -m "feat(dev-process): add confidence guidelines to phase1 overview agent"
```

---

### Task 2: Phase 2 (architecture) に確信度ガイドと誤抽出パターンを追加

**Files:**
- Modify: `plugins/dev-process/agents/spec-phase2-architecture.md:90-97`

- [ ] **Step 1: Quality Standards セクションに追記**

`spec-phase2-architecture.md` 末尾の `**Quality Standards:**` セクションに以下を追加:

```markdown
**Confidence Guidelines:**
- Only document dependencies confirmed by import/require statements or DI configuration
- Do not infer architectural patterns from directory names alone; verify with actual code flow
- If a layer boundary is ambiguous (e.g., service calling another service directly), document the ambiguity rather than guessing the intended pattern

**False Extraction Patterns (do NOT include these):**
- node_modules or vendor directory structure as project modules
- Generated code directories (e.g., .next/, dist/, build/) as architectural layers
- Type-only imports as runtime dependencies
- Dev dependencies (test frameworks, linters) as system modules
```

- [ ] **Step 2: 変更を確認**

- [ ] **Step 3: Commit**

```bash
git add plugins/dev-process/agents/spec-phase2-architecture.md
git commit -m "feat(dev-process): add confidence guidelines to phase2 architecture agent"
```

---

### Task 3: Phase 3 (data model) に確信度ガイドと誤抽出パターンを追加

**Files:**
- Modify: `plugins/dev-process/agents/spec-phase3-datamodel.md:97-104`

- [ ] **Step 1: Quality Standards セクションに追記**

`spec-phase3-datamodel.md` 末尾の `**Quality Standards:**` セクションに以下を追加:

```markdown
**Confidence Guidelines:**
- Prioritize migration files and schema definitions over TypeScript interfaces
- If a type definition exists but no corresponding migration or DB query references it, it may be a DTO, not a persisted entity. Mark with `⚠️ 推定` or omit
- Do not document relationships not confirmed by foreign keys, JOIN queries, or ORM relation decorators

**False Extraction Patterns (do NOT include these):**
- In-memory data structures (caches, session stores) as persisted entities
- Request/Response DTOs as database entities
- Configuration objects or environment variable types as data models
- Test fixture factory types as real entities
```

- [ ] **Step 2: 変更を確認**

- [ ] **Step 3: Commit**

```bash
git add plugins/dev-process/agents/spec-phase3-datamodel.md
git commit -m "feat(dev-process): add confidence guidelines to phase3 datamodel agent"
```

---

### Task 4: Phase 4 (API) に確信度ガイドと誤抽出パターンを追加

**Files:**
- Modify: `plugins/dev-process/agents/spec-phase4-api.md:125-131`

- [ ] **Step 1: Quality Standards セクションに追記**

`spec-phase4-api.md` 末尾の `**Quality Standards:**` セクションに以下を追加:

```markdown
**Confidence Guidelines:**
- Only document endpoints confirmed by routing definitions (router.get, app.post, @Controller decorators, etc.)
- Request/response types must be confirmed by handler signatures, validation schemas, or test assertions
- Do not guess authentication requirements; only document middleware actually applied to routes

**False Extraction Patterns (do NOT include these):**
- Health check endpoints (/health, /ready) as business API endpoints (list them separately under "共通仕様")
- Framework-generated debug endpoints (e.g., Next.js /_next/, Swagger UI routes)
- Internal RPC or inter-service communication as public API
- Stale OpenAPI definitions that don't match actual routing code
```

- [ ] **Step 2: 変更を確認**

- [ ] **Step 3: Commit**

```bash
git add plugins/dev-process/agents/spec-phase4-api.md
git commit -m "feat(dev-process): add confidence guidelines to phase4 api agent"
```

---

### Task 5: Phase 5 (use cases) に確信度ガイドと誤抽出パターンを追加

**Files:**
- Modify: `plugins/dev-process/agents/spec-phase5-usecases.md:110-116`

- [ ] **Step 1: Quality Standards セクションに追記**

`spec-phase5-usecases.md` 末尾の `**Quality Standards:**` セクションに以下を追加:

```markdown
**Confidence Guidelines:**
- Only create use cases for flows with confirmed entry points (routes, CLI commands, event handlers)
- Sequence diagrams must reflect actual code call chains, not assumed architecture
- If a flow's alternative/exception path cannot be confirmed from code, omit it rather than speculate

**False Extraction Patterns (do NOT include these):**
- CRUD operations as separate use cases when they are simple REST resource endpoints with no business logic (summarize as a single "Resource Management" use case instead)
- Admin/backoffice operations inferred from database tables but with no UI or API evidence
- Background jobs or cron tasks as user-facing use cases (document under a separate "System Operations" section if needed)
```

- [ ] **Step 2: 変更を確認**

- [ ] **Step 3: Commit**

```bash
git add plugins/dev-process/agents/spec-phase5-usecases.md
git commit -m "feat(dev-process): add confidence guidelines to phase5 usecases agent"
```

---

### Task 6: Phase 6 (business rules) に確信度ガイドと誤抽出パターンを追加

**Files:**
- Modify: `plugins/dev-process/agents/spec-phase6-rules.md:93-101`

- [ ] **Step 1: Quality Standards セクションに追記**

`spec-phase6-rules.md` 末尾の `**Quality Standards:**` セクションに以下を追加:

```markdown
**Confidence Guidelines:**
- Only document rules where the business intent is clear from variable names, comments, test names, or domain context
- Constants without clear business meaning (e.g., buffer sizes, retry counts) belong in non-functional requirements (Phase 7), not here
- If a validation rule's purpose is ambiguous, check test code for assertion messages that explain intent

**False Extraction Patterns (do NOT include these):**
- Framework-generated validation (e.g., ORM-level NOT NULL constraints without explicit business reason) as business rules
- Type system constraints (TypeScript type narrowing, enum exhaustiveness checks) as business validation
- Infrastructure constants (port numbers, connection pool sizes, timeout values) as business constants
- Library default configuration values as project-specific business rules
- Guard clauses for null/undefined that are defensive programming, not business logic
```

- [ ] **Step 2: 変更を確認**

- [ ] **Step 3: Commit**

```bash
git add plugins/dev-process/agents/spec-phase6-rules.md
git commit -m "feat(dev-process): add confidence guidelines to phase6 rules agent"
```

---

### Task 7: Phase 7 (non-functional) に確信度ガイドと誤抽出パターンを追加

**Files:**
- Modify: `plugins/dev-process/agents/spec-phase7-nonfunctional.md:119-125`

- [ ] **Step 1: Quality Standards セクションに追記**

`spec-phase7-nonfunctional.md` 末尾の `**Quality Standards:**` セクションに以下を追加:

```markdown
**Confidence Guidelines:**
- Only document implementations confirmed by actual code (middleware registration, configuration files, dependency usage)
- Do not infer security measures from the presence of a dependency alone; verify it is actually imported and used
- For `⚠️ 未検出` items, verify absence by searching for common implementation patterns (at least 3 search terms per category) before marking

**False Extraction Patterns (do NOT include these):**
- Dependencies listed in package.json but never imported in source code as "implemented" measures
- Example/sample configuration files (e.g., .env.example) as actual security configurations
- Development-only tools (e.g., nodemon, ts-node-dev) as production deployment infrastructure
- Test-only security configurations (e.g., CORS allow-all in test setup) as production security measures
```

- [ ] **Step 2: 変更を確認**

- [ ] **Step 3: Commit**

```bash
git add plugins/dev-process/agents/spec-phase7-nonfunctional.md
git commit -m "feat(dev-process): add confidence guidelines to phase7 nonfunctional agent"
```

---

### Task 8: Phase 8 (index) に確信度ベースの整合性チェックを追加

**Files:**
- Modify: `plugins/dev-process/agents/spec-phase8-index.md:111-117`

- [ ] **Step 1: Quality Standards セクションに追記**

`spec-phase8-index.md` 末尾の `**Quality Standards:**` セクションに以下を追加:

```markdown
**Confidence-Based Consistency Checks:**
- If the same item appears in multiple documents with different confidence levels, align to the lowest confidence (e.g., if Phase 1 states a feature as confirmed but Phase 5 has no corresponding use case, re-evaluate whether the feature truly exists)
- Flag documents where the ratio of `⚠️ 推定` items exceeds 50% of total items; this indicates the source code may lack sufficient evidence for that phase's analysis
- In the estimation list ("推定事項一覧"), group items by confidence impact: items affecting multiple documents first
```

- [ ] **Step 2: 変更を確認**

- [ ] **Step 3: Commit**

```bash
git add plugins/dev-process/agents/spec-phase8-index.md
git commit -m "feat(dev-process): add confidence-based checks to phase8 index agent"
```

---

### Task 9: marketplace.json のバージョン更新と README 更新

**Files:**
- Modify: `.claude-plugin/marketplace.json`
- Modify: `plugins/dev-process/README.md`

- [ ] **Step 1: marketplace.json の dev-process バージョンをインクリメント**

dev-process のバージョンを `2.0.0` → `2.1.0` に更新する。
(スキル/エージェントの追加削除はなく、既存エージェントの品質改善のためマイナーバージョン)

- [ ] **Step 2: README.md に品質ガイドラインの記載を追加**

`plugins/dev-process/README.md` に以下のセクションを追加:

```markdown
## エージェント品質ガイドライン

全仕様書生成エージェント (Phase 1-8) に以下の品質基準が組み込まれています:

### 確信度の段階化

| レベル | マーク | 基準 |
|--------|--------|------|
| 確定 | (なし) | コード・設定ファイルから直接確認 |
| 高確信 | `⚠️ 推定` | 複数の間接的証拠から推論 |
| 低確信 | 記載しない | 証拠不十分のため仕様書に含めない |

### 誤抽出パターン

各フェーズに「仕様書に含めるべきでない項目」が定義されています:
- フレームワークのボイラープレートをビジネスロジックと誤認しない
- 開発ツール・テスト専用設定を本番構成と混同しない
- 依存関係の存在だけで「実装済み」と判断しない
```

- [ ] **Step 3: Commit**

```bash
git add .claude-plugin/marketplace.json plugins/dev-process/README.md
git commit -m "feat(dev-process): bump version to 2.1.0 with quality guidelines"
```
