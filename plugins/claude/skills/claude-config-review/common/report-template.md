# Review Report Template

Claude Code設定レビューの統一レポートテンプレート。

## Standard Report Structure

```markdown
# Configuration Review Report

**対象**: {target_type}
**ファイル**: {file_path}
**レビュー日時**: {timestamp}
**総合評価**: {overall_grade} ({score}/100)

---

## Executive Summary

{2-3文の概要: 主要な発見、全体的な品質、最優先のアクション}

---

## Evaluation Overview

### Dimension Grades

| 次元 | 評価 | スコア | 状態 |
|------|------|--------|------|
| {dimension_1} | {grade} | {score} | {emoji} |
| {dimension_2} | {grade} | {score} | {emoji} |
| ... | ... | ... | ... |

**Overall**: {overall_grade} ({total_score}/100)

Status Legend:
- ✅ A-B (Good)
- ⚠️ C (Needs Improvement)
- ❌ D-F (Critical)

---

## Detailed Analysis

### {Dimension 1} ({grade})

**所見**:
- {positive findings}
- {observations}

**問題**:
- {issue_1}
- {issue_2}

**推奨**:
- {recommendation_1}
- {recommendation_2}

### {Dimension 2} ({grade})

**所見**:
- ...

**問題**:
- ...

**推奨**:
- ...

[... 各次元の分析を繰り返し ...]

---

## Priority Improvements

### 🔴 Critical (即座に修正)

| # | 問題 | 影響 | 推奨アクション |
|---|------|------|---------------|
| 1 | {issue} | {impact} | {action} |

### 🟠 High (早急に修正)

| # | 問題 | 影響 | 推奨アクション |
|---|------|------|---------------|
| 1 | {issue} | {impact} | {action} |

### 🟡 Medium (推奨)

| # | 問題 | 影響 | 推奨アクション |
|---|------|------|---------------|
| 1 | {issue} | {impact} | {action} |

### 🟢 Low (オプション)

| # | 問題 | 影響 | 推奨アクション |
|---|------|------|---------------|
| 1 | {issue} | {impact} | {action} |

---

## Before / After Examples

### Issue: {issue_title}

**Before**:
```{language}
{problematic_code}
```

**After**:
```{language}
{corrected_code}
```

**Explanation**: {why this change improves the configuration}

---

## Improved Version (Optional)

完全な修正版が必要な場合:

```{language}
{complete_corrected_configuration}
```

---

## Best Practices Compliance

| ベストプラクティス | 状態 | コメント |
|------------------|------|---------|
| {practice_1} | ✅/❌ | {comment} |
| {practice_2} | ✅/❌ | {comment} |
| ... | ... | ... |

---

## References

- **Official Documentation**: {official_doc_url}
- **Best Practices**: {best_practices_url}

---

## Next Steps

1. [ ] {most_critical_action}
2. [ ] {second_priority_action}
3. [ ] {third_priority_action}

**Target Grade**: {target_grade} (現在: {current_grade})
```

## Quick Assessment Template

簡易レビュー用の短縮テンプレート:

```markdown
## Quick Assessment: {target_name}

**File**: {file_path}
**Overall**: {emoji} {grade}
**Status**: {Ready / Needs Minor Fixes / Major Issues}

**Summary**: {1文のサマリー}

**Top Issues**:
1. {priority} {issue_1}
2. {priority} {issue_2}
3. {priority} {issue_3}

**Recommended Action**: {最も重要な次のステップ}
```

## Multi-Target Summary Template

複数対象のレビューサマリー:

```markdown
# Multi-Target Review Summary

**レビュー日時**: {timestamp}
**対象数**: {count}

## Grade Distribution

| Grade | 数 | 対象 |
|-------|------|------|
| A | {n} | {list} |
| B | {n} | {list} |
| C | {n} | {list} |
| D | {n} | {list} |
| F | {n} | {list} |

## Common Issues

| 問題 | 発生数 | 優先度 |
|------|--------|--------|
| {issue_1} | {count} | {priority} |
| {issue_2} | {count} | {priority} |

## Best Practices Observed

- {positive_pattern_1}
- {positive_pattern_2}

## Overall Recommendations

1. {recommendation_1}
2. {recommendation_2}

## Individual Reports

### {Target 1}
[Quick Assessment]

### {Target 2}
[Quick Assessment]

...
```

## Usage Guidelines

### When to Use Standard Report

- 正式なレビュー
- チーム共有
- 品質評価記録
- 改善追跡

### When to Use Quick Assessment

- 迅速なチェック
- プリコミット検証
- 反復的なレビュー
- 進捗確認

### Report Generation Tips

1. **具体的に**: 抽象的な指摘ではなく、具体的なコード例を提供
2. **優先順位付け**: Critical → Low の順で整理
3. **アクション可能**: 各推奨事項は実行可能な形で記述
4. **コンテキスト考慮**: プロジェクト固有の要件を考慮
5. **建設的に**: 問題指摘だけでなく、改善方法を提供
