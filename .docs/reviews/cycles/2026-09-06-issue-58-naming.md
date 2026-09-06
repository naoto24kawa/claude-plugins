<!-- review-cycle:start 2026-09-06-issue-58-naming -->
## 2026-09-06 Issue #58 スキルの呼び名の整合

- **Cycle ID**: 2026-09-06-issue-58-naming
- **対象 HEAD**: 8a362238267041c3692909ac69d8fc229a8ec131
- **総ラウンド数**: 1
- **終了理由**: 全員 LGTM
- **レンズ別 flag 件数**: Security 0 / Core Logic 0 / Tests 0 / Domain 0 / Fresh Eyes 0 / Ambiguity 0 / Altitude 0
- **確定した偽陽性**:
  - なし
- **最大ラウンド数**: 3
- **実施者**: Codex worker / Orca。委任仕様と lens-review-cycle の Codex 代替経路に従い、同一 worker が読み取り工程で7レンズを順に適用した。独立エージェントによるレビューではない。
- **読み取り工程の監査**: 書き込み系 tool call 0 件。全レンズの findings 確定後に state.md へ checkpoint し、その後に永続化した。
- **INSPECTION_STATUS**: PASS、flag 0 件、optional 0 件。
- **ACCEPTED_RISKS**: なし。
- **判断レンズへの差し戻し**: なし。
- **carry-over**: 前回ログの FP 候補3件は対象ファイル変更のため引き継がず、空のレジストリで開始した。
- **検証**: rubric 1〜10 の実測値と再現コマンドは [命名整合の検証](../2026-09-06-issue-58-naming-verification.md)。self-check は3ケース通過、負例の BROKEN 3件は baseline と同じ想定診断。

### R1 レンズ別 findings

#### fresh-eyes

LGTM
対象18ファイルの実体と委任仕様を突合した。命名置換、空レコード対応、配布コピー、version、README、検証資料が指定された範囲に収まる。既存の bash と rg を使う変更で、追加依存や別の実装層はない。flag 0 件、optional 0 件。

#### security

LGTM
check-guarantees.sh は既存の通常ファイル確認に読取可否の確認を加え、rg のエラーを exit 1 に保つ。変数の引用と既存の参照先チェックを維持し、検証資料には秘密値を含めていない。読取不可と rg exit 2 の負例も ERROR を返している。flag 0 件、optional 0 件。

#### core-logic

LGTM
rg が該当なしで exit 1 を返す場合は空文字列を既存ループへ渡す。空の ID は検査対象にならず、既存の集計出力が全件数 0 を返す。rg exit 2 以上は集計前に失敗し、有効行・壊れた行・退役行の処理と最終行の書式は変わらない。flag 0 件、optional 0 件。

#### tests

LGTM
新しい空レコード確認は checker 修正前に exit 1 となる red control を観測し、修正後は全件数 0 と exit 0 を assert する。正例 checked=2 / broken=0 と負例 broken=3 の baseline を保持した。不在・読取不可・rg exit 2 の独立した実行結果も検証資料に残っている。flag 0 件、optional 0 件。

#### domain

LGTM
保証レコードという呼称を本文と README に揃え、name と既存のトリガー語を維持した。fixture の表・ID・出自は保持される。lens-review-cycle の正本と plugin コピーは同一で、dev-tools の JSON 2 箇所が 1.14.0。marketplace 全体の 7.5.0 据え置き理由も記録されている。flag 0 件、optional 0 件。

#### ambiguity-hunter

LGTM
3スキルの冒頭は同じ standards の参照と旧称説明を持ち、他の本文に旧称は残らない。空の開始時に表ヘッダが不要という文と checked=0 の挙動が一致する。レビュードキュメントは1サイクル1ファイルの既存書込規則を指し、後から書き換えない扱いも既存の完了済みファイル再利用と整合する。⑨移植限界と⑫境界は保持され、見出し変更で壊れる他スキルの参照はない。flag 0 件、optional 0 件。

#### altitude-checker

LGTM
呼び名の正本を standards DOCS_OPS §3 に置き、追加は委任仕様が求めた短い参照文と空レコードの導入説明に留まる。既存のスキル責務・規則を拡張せず、検証手順と環境固有の実測値はレビュー資料へ分離されている。flag 0 件、optional 0 件。

<!-- review-cycle:end 2026-09-06-issue-58-naming -->
