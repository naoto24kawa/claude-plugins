# Plugins (Marketplace) Review Criteria

## Official Documentation

| 種類 | URL |
|------|-----|
| 仕様 & ベストプラクティス | https://docs.anthropic.com/en/docs/claude-code/plugins |
| マーケットプレース作成 | https://docs.anthropic.com/en/docs/claude-code/plugin-marketplaces |
| プラグインリファレンス | https://docs.anthropic.com/en/docs/claude-code/plugins-reference |

## WebSearch Keywords

```
Claude Code plugins marketplace configuration best practices site:docs.anthropic.com OR site:code.claude.com
```

## File Search Patterns

- `.claude-plugin/marketplace.json`

## Evaluation Dimensions

### 1. JSON Structure

**評価観点**:
- 有効なJSON構文
- 必須フィールドの存在
- 正しいスキーマ参照

**Top-Level Structure (公式形式v3)**:
```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "marketplace-name",
  "version": "1.0.0",
  "description": "Marketplace description",
  "owner": {
    "name": "Owner Name",
    "email": "email@example.com"
  },
  "plugins": [...]
}
```

**チェックリスト**:
- [ ] 有効なJSON構文
- [ ] `$schema` フィールドが存在 (推奨)
- [ ] `name` フィールドが存在 (kebab-case)
- [ ] `version` フィールドが存在 (マーケットプレース自体のバージョン)
- [ ] `description` フィールドが存在 (マーケットプレースの説明)
- [ ] `owner` オブジェクトが存在 (`name` 必須)
- [ ] `plugins` 配列が存在

### 2. Plugin Entries

**評価観点**:
- 各プラグインエントリの正確性
- 自動検出に対応した構造

**Plugin Entry Structure (公式形式)**:
```json
{
  "name": "plugin-name",
  "description": "Plugin description",
  "version": "1.0.0",
  "author": {
    "name": "Author Name",
    "email": "author@example.com"
  },
  "source": "./plugins/plugin-name",
  "category": "productivity"
}
```

**Required Fields**:
- `name` - プラグイン識別子 (kebab-case)
- `source` - プラグインディレクトリパス (自動検出のベース)

**Recommended Fields**:
- `description` - プラグイン説明
- `version` - セマンティックバージョン (例: "1.0.0")
- `author` - 著者情報 (name, email)
- `category` - カテゴリ (productivity, development, learning, security など)

**非推奨/削除されたFields**:
- ~~`agents`~~ - source ディレクトリから自動検出
- ~~`skills`~~ - source ディレクトリから自動検出
- ~~`mcpServers`~~ - source ディレクトリから自動検出

**チェックリスト**:
- [ ] `name` が kebab-case
- [ ] `source` がプラグインディレクトリを指す
- [ ] `version` がセマンティックバージョン形式
- [ ] `description` が明確
- [ ] `category` が適切に設定されている
- [ ] `agents`/`skills` 配列を使用していない (非推奨)

### 3. Directory Structure Validation

**評価観点**:
- source ディレクトリが正しい構造を持つ
- 自動検出が正常に機能する構造

**推奨ディレクトリ構造**:
```
plugins/
└── plugin-name/
    ├── skills/           # スキル (自動検出)
    │   └── skill-name/
    │       └── SKILL.md
    ├── agents/           # エージェント (自動検出)
    │   └── agent-name.md
    ├── commands/         # コマンド (自動検出)
    │   └── command-name.md
    └── .mcp.json         # MCP設定 (自動検出)
```

**チェックリスト**:
- [ ] `source` ディレクトリが存在する
- [ ] `skills/` ディレクトリ内の各サブディレクトリに `SKILL.md` が存在
- [ ] `agents/` ディレクトリ内のファイルが `.md` 形式
- [ ] パスが `./` プレフィックスで相対パス

### 4. Naming Conventions

**評価観点**:
- 一貫した命名規則

**チェックリスト**:
- [ ] マーケットプレース名が kebab-case
- [ ] 全プラグイン名が kebab-case
- [ ] スペースや特殊文字なし
- [ ] camelCase や snake_case を避ける

**Good Examples**:
- `my-plugin-name`
- `code-review-tools`

**Bad Examples**:
- `myPluginName` (camelCase)
- `my_plugin_name` (snake_case)
- `My Plugin Name` (スペース)

### 5. Version Format

**評価観点**:
- セマンティックバージョニング

**Format**: `MAJOR.MINOR.PATCH`
- 例: `"1.0.0"`, `"1.2.3"`

**チェックリスト**:
- [ ] マーケットプレース自体に `version` あり
- [ ] 全プラグインに `version` あり
- [ ] `MAJOR.MINOR.PATCH` 形式
- [ ] 数値のみ (プレフィックスなし)

### 6. Category Assignment

**評価観点**:
- 適切なカテゴリ分類

**公式カテゴリ**:
- `productivity` - 生産性向上ツール
- `development` - 開発ツール
- `learning` - 学習・教育
- `security` - セキュリティ関連

**チェックリスト**:
- [ ] 全プラグインに `category` が設定されている
- [ ] カテゴリがプラグインの目的に適合している

## Output Format

```markdown
## Marketplace Validation Report

**File**: .claude-plugin/marketplace.json
**Overall Status**: ✅ PASSED / ❌ FAILED

### Overview
- マーケットプレース名: {name}
- バージョン: {version}
- オーナー: {owner}
- プラグイン数: {count}

### Validation Results

#### JSON Structure
- Status: ✅ / ❌
- $schema: ✅ / ❌
- Top-level version: ✅ / ❌
- Top-level description: ✅ / ❌
- {findings}

#### Plugin Entries
| プラグイン | name | version | source | category |
|-----------|------|---------|--------|----------|
| {plugin1} | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ |

#### Directory Structure
- 検証したプラグイン数: {count}
- 有効: {valid_count}
- 無効: {invalid_count}

##### Missing Directories
- {path}: {reason}

#### Naming Conventions
- Status: ✅ / ⚠️
- {findings}

### Issues

#### ❌ Errors (Must Fix)
1. {error}

#### ⚠️ Warnings (Recommended)
1. {warning}

### Recommendations
1. {action item}
```

## Common Issues

### Critical
- 無効なJSON構文
- 必須フィールドの欠如
- source ディレクトリが存在しない

### High
- `$schema` フィールドの欠如
- トップレベル `version` の欠如
- 非推奨の `agents`/`skills` 配列を使用

### Medium
- `category` の欠如
- `author` 情報の欠如
- バージョン形式の不正

### Low
- `description` の欠如
- オーナーメールの欠如

## Fix Examples

### Issue: "Missing $schema field"

**原因**: 公式形式v3で推奨される `$schema` フィールドがない

**解決**:
```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "my-marketplace",
  ...
}
```

### Issue: "Using deprecated agents/skills arrays"

**原因**: 旧形式の `agents` や `skills` 配列を使用している

**解決**:
1. `agents` と `skills` 配列を削除
2. `source` フィールドでプラグインディレクトリを指定
3. プラグインディレクトリ内に `agents/` と `skills/` ディレクトリを作成
4. スキルとエージェントは自動検出される

**Before**:
```json
{
  "name": "my-plugin",
  "source": "./",
  "agents": ["./my-plugin/agents/agent.md"],
  "skills": ["./my-plugin/skill"]
}
```

**After**:
```json
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin",
  "category": "productivity"
}
```

### Issue: "Missing top-level version"

**原因**: マーケットプレース自体のバージョンが指定されていない

**解決**:
```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "my-marketplace",
  "version": "1.0.0",
  "description": "My marketplace description",
  ...
}
```

### Issue: "Name should be in kebab-case"

**原因**: プラグインまたはマーケットプレース名が誤った形式

**解決**:
- 小文字とハイフンを使用: `my-plugin-name`
- 避ける: camelCase, snake_case, スペース
