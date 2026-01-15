# Slash Commands Review Criteria

## Official Documentation

| 種類 | URL |
|------|-----|
| 仕様 & ベストプラクティス | https://docs.anthropic.com/en/docs/claude-code/slash-commands |

## WebSearch Keywords

```
Claude Code slash commands configuration best practices site:docs.anthropic.com OR site:code.claude.com
```

## File Search Patterns

- `.claude/commands/*.md`
- `.claude/commands/**/*.md`
- `~/.claude/commands/*.md` (個人用)

## Evaluation Dimensions

### 1. Frontmatter Quality

**評価観点**:
- YAML形式の正確性
- 必須フィールドの存在
- 適切なフィールド値

**Frontmatter Fields**:

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `description` | 推奨 | コマンドの目的 |
| `argument-hint` | 条件付き | 引数使用時は必須 |
| `model` | オプション | haiku/sonnet/opus |
| `allowed-tools` | オプション | ツール制限 |
| `disable-model-invocation` | オプション | 自動起動防止 |

**チェックリスト**:
- [ ] `---` デリミタで囲まれている
- [ ] 有効なYAML構文
- [ ] `description` が存在し明確
- [ ] 引数使用時は `argument-hint` あり
- [ ] タスク複雑度に適した `model` 選択

### 2. Argument Handling

**評価観点**:
- 正しい変数構文
- 引数の説明
- 検証・ガイダンス

**Argument Variables**:
- `$ARGUMENTS` - 全引数
- `$1`, `$2`, ... - 個別引数

**チェックリスト**:
- [ ] `$ARGUMENTS` vs `$1`, `$2` の正しい使用
- [ ] 期待される引数の明確な説明
- [ ] 引数値の検証・ガイダンス
- [ ] デフォルト値の処理
- [ ] 必須/オプションの明確化

### 3. Dynamic Features

**評価観点**:
- Bash コマンドの安全な使用
- ファイル参照の適切な使用
- エラーハンドリング

**Prefixes**:
- `!` - Bash コマンド実行
- `@` - ファイル参照

**チェックリスト**:
- [ ] `!` prefix (Bash) の安全な使用
- [ ] 危険なコマンド (`rm -rf` 等) なし
- [ ] エラーハンドリングあり
- [ ] 長時間実行コマンドなし
- [ ] `@` prefix のファイルパス制限

### 4. Scope and Structure

**評価観点**:
- 適切なスコープ選択
- 名前空間の活用
- ファイル命名の一貫性

**Scope**:

| 場所 | スコープ | 用途 |
|------|---------|------|
| `.claude/commands/` | プロジェクト | チーム共有 |
| `~/.claude/commands/` | 個人 | 個人用ツール |

**チェックリスト**:
- [ ] コマンド目的に適したスコープ
- [ ] サブディレクトリによる名前空間整理
- [ ] 一貫したファイル命名
- [ ] 単一責任の原則

### 5. Skill Boundary

**評価観点**:
- スラッシュコマンドに適した複雑度
- 単一ファイルで完結

**Slash Command vs Skill**:

| 特徴 | Slash Command | Skill |
|------|---------------|-------|
| 複雑度 | 低〜中 | 高 |
| ファイル | 単一 | 複数可 |
| ステップ | シンプル | マルチステップ |
| 外部依存 | なし | スクリプト可 |

**チェックリスト**:
- [ ] スラッシュコマンドに適した複雑度
- [ ] 単一ファイルで完結
- [ ] 外部スクリプト依存なし
- [ ] 複雑すぎる場合はスキル化を推奨

### 6. Security and Best Practices

**評価観点**:
- コマンドインジェクション防止
- ファイルアクセス制限
- 入力検証

**チェックリスト**:
- [ ] コマンドインジェクション防止
- [ ] ファイルアクセス制限
- [ ] 必要時の `allowed-tools` 設定
- [ ] 入力検証
- [ ] 危険な操作への警告

## Output Format

```markdown
# Slash Command Review Report

**Command**: {command-name}
**File**: {file-path}
**Overall Grade**: {A-F}

---

## Summary
{2-3文の概要}

## Dimension Grades

| Dimension | Grade | Status |
|-----------|-------|--------|
| Frontmatter Quality | {A-F} | {emoji} |
| Argument Handling | {A-F} | {emoji} |
| Dynamic Features | {A-F} | {emoji} |
| Scope and Structure | {A-F} | {emoji} |
| Skill Boundary | {A-F} | {emoji} |
| Security & Best Practices | {A-F} | {emoji} |

**Overall Grade**: {A-F}

{emoji} = ✅ (A-B), ⚠️ (C), ❌ (D-F)

---

## Detailed Analysis

### 1. Frontmatter Quality ({Grade})
**Findings**: ...
**Issues**: ...
**Recommendations**: ...

[... 各次元の分析 ...]

---

## Priority Improvements

### Critical (Fix Immediately)
- {security issues}

### High (Fix Soon)
- {functionality issues}

### Medium (Recommended)
- {best practice violations}

### Low (Optional)
- {style improvements}

---

## Improved Version
{必要な場合、修正版を提供}
```

## Grading Logic

**Overall Grade Determination**:
1. いずれかの次元がF、または複数のD → Overall は C以下
2. Security次元がDまたはF → Overall は DまたはF
3. 全次元がBまたはA → Overall は BまたはA
4. 混在 → 最低次元に重み付け

## Common Issues

### Critical
- コマンドインジェクション脆弱性
- 制限なしのファイルアクセス

### High
- `argument-hint` なしで引数使用
- エラーハンドリングなし

### Medium
- 曖昧な `description`
- 不適切なモデル選択

### Low
- 名前空間の未整理
- ドキュメント不足
