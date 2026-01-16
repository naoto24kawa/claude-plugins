# PR 作成判断基準

plan/実装から PR を作成する際の判断基準と手順。

## PR 作成の前提条件

### 必須条件

| 条件 | 確認方法 |
|------|---------|
| コード変更がある | `git diff HEAD` |
| 変更がコミットされている | `git status` で untracked/modified なし |
| feature ブランチにいる | `git branch --show-current` ≠ main |

### 推奨条件

| 条件 | 確認方法 |
|------|---------|
| テストがパス | `npm test` 等 |
| lint エラーなし | `npm run lint` 等 |
| 関連 Issue が存在 | `gh issue list` で確認 |

## 前提条件が満たされていない場合

### コミットされていない変更がある

```bash
# 確認
git status

# 対処
git add .
git commit -m "<type>: <message>"
```

ユーザーに確認: 「未コミットの変更があります。コミットしますか?」

### main ブランチにいる

```bash
# 確認
git branch --show-current

# 対処
git checkout -b feature/<name>
```

ユーザーに確認: 「main ブランチにいます。新しいブランチを作成しますか?」

### リモートにプッシュされていない

```bash
# 確認
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null

# 対処
git push -u origin <branch>
```

自動でプッシュを実行。

## plan/実装から PR への変換

### 抽出する情報

| ソース | PR の項目 |
|--------|----------|
| 関連 Issue | Related Issue |
| plan の概要 | Summary |
| 変更ファイル | Technical Changes |
| 技術的判断 | 技術的な決定事項 |
| 影響範囲 | Affected Areas |

### 技術的決定事項の抽出

実装中に行った判断を整理:

| 判断ポイント | 抽出元 |
|-------------|--------|
| ライブラリ選択 | import 文、package.json |
| アーキテクチャパターン | コード構造 |
| 状態管理方法 | Context/Store の使用 |
| エラーハンドリング | try-catch、エラー境界 |

### 変更ファイルの整理

```bash
# 変更ファイル一覧
git diff main --name-only

# 各ファイルの変更概要
git diff main --stat
```

ファイルごとに変更内容を簡潔に記述:
- `src/components/Button.tsx` - ダークモード対応のスタイル追加
- `src/contexts/ThemeContext.tsx` - 新規作成、テーマ管理

## Issue との紐付け

### フルワークフローの場合

Step 3 で作成した Issue 番号を自動設定:
```markdown
Closes #123
```

### 既存 Issue がある場合

ユーザーに確認:
「関連する Issue はありますか? (例: #123)」

### Issue がない場合

```markdown
## Related Issue

なし (リファクタリング/軽微な修正)
```

## PR 作成チェックリスト

### 必須項目

- [ ] タイトルが `<type>: <概要>` 形式
- [ ] Summary が記入されている
- [ ] 変更ファイルが列挙されている
- [ ] Type がチェックされている

### 推奨項目

- [ ] Related Issue が紐付けられている
- [ ] 技術的な決定事項が記録されている
- [ ] アーキテクチャへの影響がチェックされている
- [ ] Testing 方法が記載されている

## エラーハンドリング

| エラー | 対処 |
|--------|------|
| `gh: command not found` | GitHub CLI のインストールを案内 |
| `authentication required` | `gh auth login` を案内 |
| `pull request already exists` | 既存 PR の URL を提示 |
| `no commits between main and HEAD` | 変更がないことを報告 |
