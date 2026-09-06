# 保証レコード（fixture・負例）

`self-check.sh` が出自検査の退行を検出するための負例。実在のプロジェクトの保証ではない。
このファイルへ `bash scripts/check-guarantees.sh` を通すと exit 1 になることが期待値である。

## example

| ID | 保証 | 対応実装 | 裏付けテスト | pin確認 | 出自種別 | 出自 |
|---|---|---|---|---|---|---|
| G-001 | 出自が空の行（出自検査の空チェックを検出する） | `fixtures/impl/example.ts` | `example.test.ts::example behavior` | | 指示 | |
| G-002 | 出自の参照先が実在しない行（出自検査のファイル実在チェックを検出する） | `fixtures/impl/example.ts` | `example.test.ts::example behavior` | | 選択 | `fixtures/decisions/does-not-exist.md::存在しない見出し` |
| G-003 | 出自種別が語彙外の行（出自種別検査を検出する） | `fixtures/impl/example.ts` | `example.test.ts::example behavior` | | 提案 | `fixtures/decisions/example-design.md::example の戻り値を固定する` |
