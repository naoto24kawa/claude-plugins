# トレーサビリティチェックリスト

## PR チェック

```bash
gh pr list --state merged --limit 20 --json number,title,body
```

各 PR について:
- [ ] body に `closes #XX` または `Closes #XX` が含まれるか
- [ ] 紐づく Issue が存在するか

## コミットメッセージチェック

```bash
git log --oneline -50
```

各コミットについて:
- [ ] Conventional Commits 形式か (`<type>(<scope>): <subject>`)
- [ ] footer に `refs #XX` または `closes #XX` が含まれるか (git log --format=%B -1 <hash> で確認)

## 追跡チェーンの完全性

理想的な追跡チェーン:

```
docs/specs/ の記述
  <- git log -> commit (refs/closes #XX)
    -> PR (closes #XX)
      -> Issue (refs notion-xxx)
```

途中が途切れている箇所を断裂として報告する。
