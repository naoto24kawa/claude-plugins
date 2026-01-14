# Sub-agents Review Criteria

## Official Documentation

| 種類 | URL |
|------|-----|
| 仕様 & ベストプラクティス | https://code.claude.com/docs/en/sub-agents |

## WebSearch Keywords

```
Claude Code sub-agents best practices site:docs.claude.com OR site:code.claude.com
```

## File Search Patterns

- `.claude/subagents/*.json`
- `**/agents/*.md`
- `.claude/agents/*.md`

## Evaluation Dimensions

### 1. Single Responsibility Principle

**評価観点**:
- 1つの明確な目的を持つ
- 目的を1文で説明できる
- 無関係なタスクの混在なし

**チェックリスト**:
- [ ] 明確に定義された単一の目的
- [ ] 目的が1文で説明可能
- [ ] 説明に "and" や "or" で無関係な機能を列挙していない
- [ ] 名前が具体的 (避ける: "helper", "utility")

**Red Flags**:
- 複数の無関係な機能を列挙する説明
- "helper" や "utility" のような汎用的な名前
- 異なるドメインをカバーするシステムプロンプト

### 2. System Prompt Quality

**評価観点**:
- 具体的で実行可能な指示
- 具体的な例の提供
- 制約と制限の明示

**チェックリスト**:
- [ ] 具体的でアクション可能な指示
- [ ] 2-3個の具体的な入出力例
- [ ] スコープの境界が明示
- [ ] 期待される出力形式の指定
- [ ] 100語以上 (複雑なタスクの場合)

**Prompt Structure Template**:
```markdown
# [Sub-agent Name]

## Purpose
[単一の目的を1文で]

## Instructions
1. [ステップバイステップの手順]
2. [決定ポイントを含む]
3. [エッジケースの処理]

## Examples
### Example 1: [シナリオ]
Input: [サンプル入力]
Output: [期待される出力]

## Constraints
- DO: [許可されるアクション]
- DO NOT: [禁止されるアクション]
- When to escalate: [人間の入力が必要な条件]
```

### 3. Tool Access Restrictions

**評価観点**:
- 必要なツールのみを許可
- 高権限ツールの正当化

**チェックリスト**:
- [ ] 各ツールがコア目的を直接サポート
- [ ] "念のため" のツール許可なし
- [ ] Bash アクセスはシステム操作が必要な場合のみ
- [ ] Write/Edit は Read-only で十分な場合は使用しない

**Tool Categories by Risk**:

| リスク | ツール | 使用場面 |
|--------|--------|----------|
| High | Bash, Write, Edit, KillShell | 慎重に使用 |
| Medium | Glob, Grep, WebFetch | 検索・取得 |
| Low | Read, TodoWrite, AskUserQuestion | 安全 |

**Decision Matrix**:

| フォーカス | 必要なツール | 不要なツール |
|-----------|--------------|--------------|
| コードレビュー | Read, Grep, Glob | Write, Edit, Bash |
| ファイルフォーマット | Read, Edit | Bash, WebFetch |
| ドキュメント生成 | Read, Write, Glob | Bash, Edit |
| データ分析 | Read, Bash (データツール用) | Write, Edit |
| リサーチ | Read, WebFetch, Grep | Write, Edit, Bash |

### 4. Version Control Integration

**評価観点**:
- プロジェクトレベルのサブエージェントがバージョン管理されている
- チームメンバーが発見・利用可能

**チェックリスト**:
- [ ] 設定が `.claude/subagents/` または類似の場所に配置
- [ ] README.md でドキュメント化
- [ ] バージョン番号の付与
- [ ] 変更履歴の管理

**Directory Structure**:
```
.claude/
├── subagents/
│   ├── code-reviewer.json
│   ├── test-generator.json
│   └── api-documenter.json
└── README.md
```

### 5. Appropriate Foundation

**評価観点**:
- Claude生成エージェントをベースにしている
- カスタム追加が正当化されている

**チェックリスト**:
- [ ] Claude Code の組み込みエージェント生成を使用
- [ ] カスタマイズとその理由がドキュメント化
- [ ] 公式例を参照
- [ ] 既存のサブエージェントタイプの拡張を検討

## Output Format

### Standard Format (Detailed Review)

```markdown
#### Sub-agent: [Name]

**Purpose:** [1文の説明]

**Overall Assessment:** [概要]

**Detailed Findings:**

##### 1. Single Responsibility
- Status: ✅ Excellent / ⚠️ Needs Improvement / ❌ Critical Issue
- [具体的な所見]
- [該当する場合の推奨事項]

##### 2. System Prompt Quality
...

##### 3. Tool Access
...

##### 4. Version Control
...

##### 5. Foundation
...

**Priority Recommendations:**
1. [最優先の改善]
2. [次の優先度の改善]
```

### Quick Assessment Format

```markdown
**Sub-agent**: [Name]
**Overall**: [✅ Ready / ⚠️ Needs Minor Fixes / ❌ Major Issues]
**Brief Assessment**: [1文のサマリー]
**Top 3 Issues**:
1. [Issue 1]
2. [Issue 2]
3. [Issue 3]
**Recommended Action**: [最も重要な次のステップ]
```

## Common Issues

### Critical
- 無制限のツールアクセス
- セキュリティリスクのあるBashアクセス

### High
- 曖昧なシステムプロンプト
- 例の欠如
- 複数の無関係な責任

### Medium
- バージョン管理の欠如
- ドキュメントの不足

### Low
- カスタマイズの理由が未ドキュメント
- 最適でないツール選択
