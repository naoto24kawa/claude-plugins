# スラッシュコマンドの良い例・悪い例

## 良い例

### 例1: シンプルなコンポーネント生成

**ファイル**: `.claude/commands/component.md`

```markdown
---
description: "Create a new React component with TypeScript"
argument-hint: "<component-name>"
---

Create a new React functional component with the following specifications:

Component name: $1
Location: src/components/$1/

Files to create:
1. $1.tsx - Main component file
   - TypeScript interface for props
   - Functional component with proper typing
   - Export default

2. $1.module.css - CSS module
   - Basic styling structure

3. $1.test.tsx - Test file
   - Import and render test
   - Props validation test

Follow the existing project patterns and naming conventions.
```

**評価: A**

**理由**:
- 明確な`description`と`argument-hint`
- 引数（`$1`）を適切に使用
- 期待される出力が詳細に記載
- セキュリティリスクなし
- 単一ファイルで完結
- プロジェクトスコープに適している

---

### 例2: 文脈を含むレビュー依頼

**ファイル**: `.claude/commands/review-with-context.md`

```markdown
---
description: "Review code changes with full project context"
argument-hint: "<file-path>"
model: sonnet
---

File to review:
@$1

Current git diff:
!git diff HEAD

Project coding standards:
@./.github/CODING_STANDARDS.md

Please review the file for:
1. Adherence to project coding standards
2. Potential bugs or edge cases
3. Performance implications
4. Security vulnerabilities
5. Test coverage gaps

Provide specific, actionable feedback with line numbers.
```

**評価: A**

**理由**:
- `@`プレフィックスで関連ファイルをコンテキストに含める
- `!`プレフィックスで現在の変更を確認
- ファイルパスは引数として渡されるが、制限は暗黙的（改善の余地あり）
- レビュー観点が明確
- `model: sonnet`で適切な品質を確保

---

### 例3: 安全なGit操作

**ファイル**: `.claude/commands/git/feature-branch.md`

```markdown
---
description: "Create and checkout a feature branch with ticket number"
argument-hint: "<ticket-number>"
allowed-tools: [Bash]
---

Current branch:
!git branch --show-current

Ticket number: $1

Create a new feature branch:
- Branch name: feature/$1
- Based on: main (ensure you're up to date with origin/main)

Steps:
1. Verify the ticket number format (e.g., PROJ-123)
2. Check if branch already exists
3. Create and checkout the new branch
4. Set upstream tracking

Do NOT proceed if:
- Current branch is not main
- Uncommitted changes exist
- Branch already exists
```

**評価: A**

**理由**:
- 名前空間を使用（`git/`）
- `allowed-tools`でBashのみに制限
- 現在の状態を確認してからアクション
- 明確な前提条件とエラーケース
- 安全なGit操作

---

### 例4: API生成（引数なし）

**ファイル**: `.claude/commands/api/generate-endpoint.md`

```markdown
---
description: "Generate a new REST API endpoint with OpenAPI spec"
model: sonnet
---

Current API specification:
@./docs/openapi.yaml

Existing routes:
!find ./src/routes -name "*.ts" -type f

Please help me create a new API endpoint.

I will specify:
1. HTTP method (GET, POST, PUT, DELETE)
2. Path (e.g., /api/users/:id)
3. Request/response schemas
4. Authentication requirements

Generate:
1. Express route handler in src/routes/
2. Request validation middleware
3. Response schemas
4. OpenAPI spec update
5. Integration test

Ensure consistency with existing patterns.
```

**評価: B**

**理由**:
- 引数を使用しない会話型アプローチ
- `argument-hint`がないのは意図的（会話型）
- `@`と`!`を効果的に使用
- 詳細な出力要件
- わずかに複雑（スキル化を検討する価値あり）

---

## 悪い例

### 例1: フロントマターなし

**ファイル**: `.claude/commands/deploy.md`

```markdown
Deploy the application to production.
```

**評価: D**

**問題点**:
- フロントマターなし
- 説明が不十分
- デプロイ手順が明確でない
- セキュリティや確認手順なし
- 引数やオプションなし

**改善案**:
```markdown
---
description: "Deploy application to production with safety checks"
model: sonnet
allowed-tools: [Bash, Read]
disable-model-invocation: true
---

Pre-deployment checks:
!npm test
!npm run build

Current branch:
!git branch --show-current

Deployment checklist:
1. All tests passing
2. On main branch
3. No uncommitted changes
4. Version bumped in package.json

Proceed with deployment to production:
!npm run deploy:prod

Verify deployment:
!curl https://api.example.com/health
```

---

### 例2: 危険なコマンドインジェクション

**ファイル**: `.claude/commands/cleanup.md`

```markdown
---
description: "Clean up temporary files"
---

!rm -rf $1
```

**評価: F**

**問題点**:
- 重大なセキュリティリスク（任意のディレクトリ削除可能）
- 引数のバリデーションなし
- `allowed-tools`制限なし
- エラーハンドリングなし
- 確認プロセスなし

**改善案**:
```markdown
---
description: "Clean up temporary files in designated directories"
argument-hint: "<temp-dir-name>"
allowed-tools: [Bash]
---

Temporary directory to clean: $1

Safety checks:
1. Directory must be within ./temp/
2. Directory must exist
3. Confirm before deletion

List files to be deleted:
!ls -la ./temp/$1

Please confirm deletion of ./temp/$1 before proceeding.
If confirmed, execute: rm -rf ./temp/$1
```

---

### 例3: 任意のファイル読み取り

**ファイル**: `.claude/commands/show-file.md`

```markdown
---
description: "Show file contents"
---

@$1
```

**評価: F**

**問題点**:
- 任意のファイルアクセス可能（セキュリティリスク）
- `.env`、秘密鍵など機密ファイルを読み取れる
- ファイルパス制限なし
- 説明が不十分

**改善案**:
```markdown
---
description: "Show configuration file contents from ./config directory"
argument-hint: "<config-file-name>"
allowed-tools: [Read]
---

Configuration file: $1

Display contents of ./config/$1

Ensure the file exists and is within the ./config/ directory.
```

---

### 例4: 過度に複雑なコマンド

**ファイル**: `.claude/commands/full-stack-setup.md`

```markdown
---
description: "Set up full-stack application"
---

Create a full-stack application with:

1. Backend setup:
   - Express server
   - PostgreSQL database
   - Authentication (JWT)
   - API routes
   - Middleware
   - Error handling

2. Frontend setup:
   - React with TypeScript
   - Redux state management
   - Material-UI components
   - Routing
   - API integration

3. DevOps setup:
   - Docker configuration
   - CI/CD pipeline
   - Environment variables
   - Deployment scripts

4. Testing setup:
   - Unit tests
   - Integration tests
   - E2E tests
   - Test coverage reports

5. Documentation:
   - README
   - API documentation
   - Architecture diagrams
   - Deployment guide

Generate all necessary files and configurations.
```

**評価: D**

**問題点**:
- 明らかにスキルとして実装すべき複雑さ
- 多段階ワークフロー
- 複数の技術スタック
- スクリプトや設定ファイルが多数必要
- 単一コマンドとしては範囲が広すぎる

**改善案**:
スキルとして実装し、以下に分割:
- `skills/full-stack-setup/SKILL.md`
- `skills/full-stack-setup/scripts/setup-backend.sh`
- `skills/full-stack-setup/scripts/setup-frontend.sh`
- `skills/full-stack-setup/assets/docker-compose.yml`
- `skills/full-stack-setup/references/architecture.md`

または、個別のスラッシュコマンドに分割:
- `/setup/backend` - バックエンドのみ
- `/setup/frontend` - フロントエンドのみ
- `/setup/docker` - Docker設定のみ

---

### 例5: YAMLフォーマットエラー

**ファイル**: `.claude/commands/test.md`

```markdown
---
description: Run tests
model: haiku
allowed-tools: [Bash
---

!npm test
```

**評価: F**

**問題点**:
- YAMLフォーマットエラー（`allowed-tools`の`]`が欠落）
- コマンドがパースエラーで実行不可能

**改善案**:
```markdown
---
description: "Run tests with coverage report"
model: haiku
allowed-tools: [Bash]
---

Run test suite:
!npm test

Generate coverage report:
!npm run test:coverage

Review the test results and coverage percentage.
```

---

### 例6: 説明が曖昧

**ファイル**: `.claude/commands/fix.md`

```markdown
---
description: "Fix it"
---

Fix the problem.
```

**評価: F**

**問題点**:
- 説明が極めて曖昧（"Fix it"では何も分からない）
- コマンドの目的が不明
- コンテキストなし
- 実行可能なアクションなし

**改善案**:
```markdown
---
description: "Fix TypeScript type errors in current file"
argument-hint: "<file-path>"
model: sonnet
---

File to fix:
@$1

Current TypeScript errors:
!npx tsc --noEmit

Fix all TypeScript type errors in $1:
1. Identify type mismatches
2. Add missing type annotations
3. Resolve any type conflicts
4. Ensure strict mode compliance

Verify fixes with: npx tsc --noEmit
```

---

## 比較表

| 項目 | 良い例 | 悪い例 |
|------|--------|--------|
| **フロントマター** | 明確な`description`、適切な`argument-hint` | なし、または曖昧 |
| **引数処理** | `$1`、`$2`を明確に使用、バリデーション | バリデーションなし、危険な使用 |
| **動的機能** | `!`と`@`を安全に使用 | 危険なコマンド、任意のファイルアクセス |
| **セキュリティ** | パス制限、`allowed-tools`、確認手順 | 制限なし、脆弱性あり |
| **複雑さ** | 単一ファイル、シンプルなワークフロー | 多段階、複雑すぎる |
| **ドキュメント** | 期待される入力・出力が明確 | 説明不足、曖昧 |

## まとめ

**良いスラッシュコマンドの特徴**:
1. 明確なメタデータ（`description`、`argument-hint`）
2. 安全な引数処理とバリデーション
3. 動的機能の適切な使用（`!`、`@`）
4. セキュリティ考慮（パス制限、`allowed-tools`）
5. 適切な複雑さ（単一ファイル、シンプルなワークフロー）
6. 詳細なドキュメントと明確な期待値

**悪いスラッシュコマンドの特徴**:
1. メタデータなし、または曖昧
2. 引数のバリデーションなし
3. 危険なBashコマンドや任意のファイルアクセス
4. セキュリティリスクを考慮していない
5. 複雑すぎる（スキルとして実装すべき）
6. 説明不足、実行不可能
