# 保証レコード（fixture）

雛形 scripts の自己検証に使う worked example。実在のプロジェクトの保証ではない。

## example

| ID | 保証 | 対応実装 | 裏付けテスト | pin確認 | 出自種別 | 出自 |
|---|---|---|---|---|---|---|
| G-001 | `example()` は常に `"example"` を返す | `fixtures/impl/example.ts` | `example.test.ts::example behavior` | 2026-08-17 戻り値を別の文字列へ変えて赤を確認 | 指示 | `fixtures/decisions/example-design.md::example の戻り値を固定する` |
| G-002 | `example()` の戻り値は呼び出し側が依存してよい安定値である | `fixtures/impl/example.ts` | `example.test.ts::example behavior` | | 選択 | `fixtures/decisions/example-design.md::example の戻り値を固定する` |
