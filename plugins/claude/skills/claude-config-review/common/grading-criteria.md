# Grading Criteria

Claude Code設定レビューの統一グレーディング基準。

## Grade Definitions

| Grade | Score | Description | Action |
|-------|-------|-------------|--------|
| **A** | 90-100 | Excellent - 全ベストプラクティス準拠 | 維持・軽微な最適化のみ |
| **B** | 70-89 | Good - ほぼ準拠、軽微な改善余地 | 推奨改善を検討 |
| **C** | 50-69 | Needs Improvement - 複数の問題あり | 早期改善が必要 |
| **D** | 30-49 | Many Issues - 多数の違反、要大幅修正 | 優先的に修正 |
| **F** | 0-29 | Fail - 重大な問題、再設計推奨 | 即座に対応 |

## Scoring System

### Base Score

基準点: **70点**

### Modifier Weights

| Priority | Weight | Impact |
|----------|--------|--------|
| **Critical** | 2.0x | 機能しない、セキュリティリスク |
| **High** | 1.5x | 重大な品質問題 |
| **Medium** | 1.0x | 推奨改善事項 |
| **Low** | 0.5x | 最適化の余地 |

### Score Calculation

```
総合スコア = 基準点(70) + 加点 - 減点

加点: 各ベストプラクティス準拠項目 × 重み
減点: 各違反項目 × 重み
```

## Grade Assignment Rules

### Automatic Grade Caps

特定の条件で最高グレードが制限される:

| 条件 | 最高グレード |
|------|-------------|
| Critical 問題あり | D |
| Security 問題あり | D |
| 複数の High 問題 | C |
| Required フィールド欠如 | F |

### Dimension Weights

複数の評価次元がある場合:

1. **Security 次元が D または F** → Overall は D または F
2. **いずれかの次元が F、または複数の D** → Overall は C 以下
3. **全次元が B または A** → Overall は B または A
4. **混在** → 最低次元に重み付け

## Priority Definitions

### 🔴 Critical (Immediate Action Required)

**定義**: 設定が機能しない、またはセキュリティリスクがある

**Examples**:
- 必須フィールドの欠如
- ハードコードされたシークレット
- コマンドインジェクション脆弱性
- 無効な構文

**Action**: 即座に修正が必要

### 🟠 High (Fix Soon)

**定義**: 重大な品質問題、または機能に影響

**Examples**:
- ベストプラクティスの重大な違反
- エラーハンドリングの欠如
- 不適切なツール権限
- 曖昧または欠如した説明

**Action**: できるだけ早く修正

### 🟡 Medium (Recommended)

**定義**: 推奨される改善事項

**Examples**:
- ファイルサイズ超過 (500行超)
- 時間依存情報
- テンプレートの欠如
- ドキュメント不足

**Action**: 次のイテレーションで改善

### 🟢 Low (Optional)

**定義**: 最適化の余地

**Examples**:
- スタイルの一貫性
- 追加の例
- コメントの充実
- 構造の最適化

**Action**: 時間があれば改善

## Evaluation Examples

### Grade A Example

```
✅ 全必須フィールド存在
✅ セキュリティベストプラクティス準拠
✅ 明確な説明とトリガーワード
✅ 適切なファイルサイズ
✅ エラーハンドリング完備
✅ 具体的な例の提供

Score: 95/100
Grade: A
```

### Grade C Example

```
✅ 必須フィールド存在
✅ 基本的な機能は動作
⚠️ 説明が曖昧
⚠️ エラーハンドリング不足
⚠️ ファイルサイズ超過 (600行)
⚠️ 例の欠如

Score: 58/100
Grade: C
```

### Grade F Example

```
❌ 必須フィールド欠如
❌ 無効なJSON構文
❌ ハードコードされたシークレット

Score: 15/100
Grade: F
```

## Report Integration

レポートでのグレード表示:

```markdown
## Dimension Grades

| Dimension | Grade | Status |
|-----------|-------|--------|
| Security | A | ✅ |
| Structure | B | ✅ |
| Content | C | ⚠️ |
| Workflow | B | ✅ |

**Overall Grade**: B (72/100)

Status Emoji:
- ✅ = A-B (Good)
- ⚠️ = C (Needs Improvement)
- ❌ = D-F (Critical)
```

## Continuous Improvement

### Re-evaluation Workflow

1. **Initial Review**: 現状評価
2. **Implement Changes**: 優先度順に改善
3. **Re-Review**: 改善後の再評価
4. **Compare Scores**: 改善度の確認
5. **Iterate**: 目標グレード達成まで繰り返し

### Target Grades

| 用途 | 目標グレード |
|------|-------------|
| 本番環境 | B 以上 |
| チーム共有 | B 以上 |
| 個人利用 | C 以上 |
| プロトタイプ | D 以上 |
