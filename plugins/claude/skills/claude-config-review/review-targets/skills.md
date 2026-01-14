# Skills Review Criteria

## Official Documentation

| 種類 | URL |
|------|-----|
| 仕様 | https://code.claude.com/docs/en/skills |
| ベストプラクティス | https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices |

## WebSearch Keywords

```
Claude Code skills specification best practices site:docs.claude.com OR site:code.claude.com
```

## File Search Patterns

- `**/SKILL.md`
- `.claude/skills/*/SKILL.md`

## Evaluation Dimensions

### 1. Description Quality

**評価観点**:
- 三人称で記述されている
- 具体的な機能を列挙している
- トリガーワード ("Use when...") を含む
- 200-800文字の範囲 (1024文字以内必須)

**チェックリスト**:
- [ ] `name` フィールドが存在 (64文字以内)
- [ ] `description` フィールドが存在 (空でない、1024文字以内)
- [ ] 三人称記述 (避ける: "I can", "You can")
- [ ] トリガーワード含有
- [ ] 複数の関連キーワード

### 2. Progressive Disclosure

**評価観点**:
- SKILL.md が500行以下
- 詳細情報が外部ファイルに分離
- 参照が1階層のみ

**チェックリスト**:
- [ ] SKILL.md 500行以下 (700行超は要改善)
- [ ] 100行超のファイルに目次あり
- [ ] 参照深度1階層のみ
- [ ] 外部ファイルへの適切な分離

### 3. Content Quality

**評価観点**:
- 簡潔性 ("Context window is a public good")
- 時間依存情報を避ける
- 用語の一貫性

**チェックリスト**:
- [ ] 不要な情報を排除
- [ ] 固定日付・時間依存情報なし
- [ ] 同じ概念に同じ用語を使用
- [ ] 各セクションが明確な目的を持つ

### 4. Workflow

**評価観点**:
- 明確なステップ定義
- 各ステップに検証ポイント
- エラーハンドリング

**チェックリスト**:
- [ ] 番号付きまたはチェックリスト形式のステップ
- [ ] 各ステップに "Verification:" 記述
- [ ] "Solve, Don't Punt" 原則に従うエラー処理
- [ ] フォールバック動作の定義
- [ ] デフォルト設定の明示

### 5. Templates & Examples

**評価観点**:
- 出力テンプレートの提供
- 良い例と悪い例の対比

**チェックリスト**:
- [ ] 期待される出力形式が明確
- [ ] 入力/出力の例がある
- [ ] 良い例と悪い例の対比

### 6. Technical Details

**評価観点**:
- スクリプトの活用
- MCP ツール参照の正確性
- 依存関係の明示

**チェックリスト**:
- [ ] 事前作成スクリプトの活用 (適切な場合)
- [ ] MCP ツール参照は完全修飾名 (`ServerName:tool_name`)
- [ ] 必要なパッケージがリスト化

## Scoring

```
基準点: 70点
各項目: +/- ポイント
重み: Critical 2x, High 1.5x, Medium 1x, Low 0.5x

A: 90-100点
B: 70-89点
C: 50-69点
D: 30-49点
F: 0-29点
```

## Common Issues

### Critical
- `name` または `description` フィールドの欠如
- 無効なYAML frontmatter

### High
- 三人称でない記述
- トリガーワードなし
- エラーハンドリングの欠如

### Medium
- 500行超のSKILL.md
- 時間依存情報の存在
- テンプレートの欠如

### Low
- 例の不足
- スクリプト未活用
