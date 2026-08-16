# Review Cycle Log Format

完了したレビューサイクルの学習を、対象リポジトリの `.docs/reviews/review-cycle-log.md` へ追記する。既存エントリは変更せず、サイクルごとに末尾へ追加する。

## エントリフォーマット

```markdown
<!-- review-cycle:start {cycle-id} -->
## {YYYY-MM-DD} {対象の概要}
- **Cycle ID**: {state.md に保存した安定 ID}
- **対象 HEAD**: {サイクル完了時の git rev-parse HEAD}
- **総ラウンド数**: N
- **終了理由**: 全員 LGTM / 堂々巡り / ラウンド上限超過
- **レンズ別 flag 件数**: Security {n} / Core Logic {n} / Tests {n} / Domain {n} / Fresh Eyes {n} / Ambiguity {n|-} / Altitude {n|-}
- **確定した偽陽性**:
  - `{対象パスの JSON 配列 or N/A}` — {主張の概要} — {理由の要約}
<!-- review-cycle:end {cycle-id} -->
```

偽陽性が0件の場合は `- なし` と記録する。文章仕様を含まず #6 / #7 を起動しなかった場合は、それぞれの件数を `-` とする。

## 追記手順

1. `state.md` を `terminal-pending` にし、cycle ID を確定する。
2. `git rev-parse HEAD` で対象 HEAD を取得する。
3. 全ラウンドの findings ファイルを集計し、各レンズの flag 件数を数える。
4. `fp-registry.md` から確定した偽陽性の対象 JSON、主張、理由を省略・再解釈せず転記する。
5. 完全なエントリを `$REVIEW_DIR/cycle-log-entry.md` に書き、start / end marker と cycle ID を検証する。
6. ログに同じ cycle ID の完全な start / end marker が無い場合だけ末尾へ追記する。start だけがある部分エントリを検出した場合は fail-closed で停止する。
7. ログから同じ cycle ID の完全なエントリを読み返し、`state.md` を `log-appended` にしてから `$REVIEW_DIR` を削除する。

`terminal-pending` から再開した場合、同じ cycle ID の完全なエントリが既にあれば再追記せず `log-appended` へ進む。これにより追記成功後・cleanup 前の中断を冪等に再開する。

レンズ別件数は後から有効性を実測する材料に留め、レンズ構成を自動変更する入力には使わない。

## 最新エントリ

carry-over でいう「最新エントリ」は、完全な start / end marker を持つエントリのうちファイル末尾に最も近いものを指す。部分エントリは候補にしない。完全なエントリが1つも見つからない場合は、理由を1行記録して carry-over をスキップし、空の FP レジストリでサイクルを開始する（読み取り側は fail-open）。最新エントリ以外の偽陽性は候補にしない。carry-over の安全条件と FP への変換は `references/fp-registry-format.md` を参照する。
