# ワークフローサマリーテンプレート

ワークフロー完了時に生成するサマリーのテンプレート。

## Issue 作成のみ

```markdown
## ワークフロー完了: Issue 作成

### 作成された Issue
- **Issue**: #{issue_number} - {issue_title}
- **URL**: {issue_url}

### 内容
- **種類**: {type} (feat/change/remove/fix)
- **概要**: {summary}

### 次のステップ
- [ ] 仕様をレビュー・承認
- [ ] 実装を開始
- [ ] 実装完了後に PR を作成
```

## PR 作成のみ

```markdown
## ワークフロー完了: PR 作成

### 作成された PR
- **PR**: #{pr_number} - {pr_title}
- **URL**: {pr_url}

### 内容
- **種類**: {type}
- **変更ファイル数**: {file_count}
- **関連 Issue**: {related_issue}

### 次のステップ
- [ ] PR レビューを依頼
- [ ] CI の完了を確認
- [ ] レビュー対応
- [ ] マージ
```

## フルワークフロー

```markdown
## ワークフロー完了: Issue → 実装 → PR

### 作成されたもの

| 種類 | 番号 | タイトル | URL |
|------|------|---------|-----|
| Issue | #{issue_number} | {issue_title} | {issue_url} |
| PR | #{pr_number} | {pr_title} | {pr_url} |

### 実装サマリー

- **総タスク数**: {total_tasks}
- **完了タスク数**: {completed_tasks}
- **変更ファイル数**: {file_count}
- **追加行数**: +{additions}
- **削除行数**: -{deletions}

### 技術的な決定事項

| 決定事項 | 選択 | 理由 |
|---------|------|------|
| {decision_1} | {choice_1} | {reason_1} |
| {decision_2} | {choice_2} | {reason_2} |

### 次のステップ
- [ ] PR レビューを依頼
- [ ] CI の完了を確認
- [ ] レビュー対応
- [ ] マージ
- [ ] Issue を Close 確認
```

## エラー/中断時

```markdown
## ワークフロー中断

### 状態
- **フェーズ**: {current_phase} (Issue作成/実装/PR作成)
- **進捗**: {progress}%

### 完了済み
- {completed_item_1}
- {completed_item_2}

### 未完了
- {pending_item_1}
- {pending_item_2}

### 再開方法
{resume_instructions}
```

## 使用方法

1. ワークフロー完了時に該当テンプレートを選択
2. プレースホルダーを実際の値で置換
3. ユーザーに共有

### プレースホルダー一覧

| プレースホルダー | 説明 | 取得方法 |
|-----------------|------|---------|
| `{issue_number}` | Issue 番号 | `gh issue create` の出力 |
| `{issue_title}` | Issue タイトル | 作成時に指定 |
| `{issue_url}` | Issue URL | `gh issue create` の出力 |
| `{pr_number}` | PR 番号 | `gh pr create` の出力 |
| `{pr_title}` | PR タイトル | 作成時に指定 |
| `{pr_url}` | PR URL | `gh pr create` の出力 |
| `{type}` | 変更種類 | feat/fix/change/remove |
| `{file_count}` | 変更ファイル数 | `git diff --stat` |
| `{additions}` | 追加行数 | `git diff --stat` |
| `{deletions}` | 削除行数 | `git diff --stat` |
