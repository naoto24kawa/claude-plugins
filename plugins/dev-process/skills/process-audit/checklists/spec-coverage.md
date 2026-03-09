# 仕様カバレッジチェックリスト

## area 網羅性チェック

1. コードベースから機能領域を推定する

```bash
# ディレクトリ構成から推定
ls -d src/*/  app/*/  pages/*/  2>/dev/null
```

2. docs/specs/ の area 一覧を取得する

```bash
grep -r "^area:" docs/specs/ | sort -u
```

3. コードにあるが docs/specs/ にない area を「未文書化」として報告する

## 鮮度チェック

各 docs/specs/ ファイルについて:

- [ ] `doc_status: draft` で `updated` が30日以上前 -> 「draft 放置」として警告
- [ ] `doc_status: deprecated` -> 棚卸し対象として報告

## related 整合性

各 docs/specs/ ファイルの `related` フィールドについて:

- [ ] 参照先のファイルが存在するか
- [ ] 参照先の Issue が存在するか (`gh issue view #XX`)
