# インフラ健全性チェックリスト

## 必須ファイル

| ファイル | 確認方法 |
|--------|---------|
| CLAUDE.md (Dev Process Rules セクション) | Grep で `# Dev Process Rules` を検索 |
| .github/ISSUE_TEMPLATE/specification.yml | Glob で存在確認 |
| .github/PULL_REQUEST_TEMPLATE.md | Glob で存在確認 |
| .github/workflows/pr-check.yml | Glob で存在確認 |
| .github/workflows/weekly-check.yml | Glob で存在確認 |
| docs/specs/ | Bash で `ls docs/specs/` |

## CLAUDE.md 内容チェック

Dev Process Rules セクションに以下が含まれているか:

- [ ] Issue ルール
- [ ] コミットメッセージ規約
- [ ] PR ルール
- [ ] docs/specs ルール
- [ ] 言語使い分け

## Actions 有効性チェック

```bash
# ワークフローが有効か
gh workflow list
```

disabled になっているワークフローがあれば警告する。
