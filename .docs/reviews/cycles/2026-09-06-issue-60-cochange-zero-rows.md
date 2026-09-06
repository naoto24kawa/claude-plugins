<!-- review-cycle:start 2026-09-06-issue-60-cochange-zero-rows -->
## 2026-09-06 Issue #60 check-guarantee-cochange.sh の表の行 0 許容

- **Cycle ID**: 2026-09-06-issue-60-cochange-zero-rows
- **対象 HEAD**: 9283bd2a54450c28e742caaebdf874ecd184f548（origin/main 9283bd2 上の未コミット差分 3 ファイルを対象。コミットは本ログと同時）
- **総ラウンド数**: 1
- **終了理由**: 全員 LGTM
- **レンズ別 flag 件数**: Security 0 / Core Logic 0 / Tests 0 / Domain 0 / Fresh Eyes 0 / Ambiguity 0 / Altitude 0
- **確定した偽陽性**:
  - なし
- **最大ラウンド数**: 2（委任仕様の指定）
- **実施者**: Claude Code worker / Orca（task_f8bd95fff286）。オーケストレータ（worker 本人）が Explore サブエージェント 1 名（model: sonnet、読み取り専用）に 7 レンズを順に当てさせ、応答ブロックを role 別に永続化してから集約した。レビュアーは self-check の実行と、修正前分岐へ戻したコピー（リポジトリ外の別 git リポジトリ）での red 再現を自ら実測している。
- **INSPECTION_STATUS**: PASS、flag 0 件、optional 0 件。
- **ACCEPTED_RISKS**: なし。
- **判断レンズへの差し戻し**: なし。
- **carry-over**: 前回サイクル（2026-09-06-issue-58-naming）の偽陽性は 0 件のため、空のレジストリで開始した。
- **検証**: 委任仕様 rubric 1〜6 の実測値は 本 Issue の PR 本文。self-check は 4 ケース通過、fixtures × origin/main の cochange は変更前後とも `cochange_checked=2 cochange_warn=0` exit 0。

### R1 レンズ別 findings

#### fresh-eyes

LGTM

読んだもの: `check-guarantee-cochange.sh` 全文、`self-check.sh` 全文、`SKILL.md` 全文、対比用に `check-guarantees.sh` 全文と `fixtures/guarantees.md`。加えて自分で `bash scripts/self-check.sh` を実行し（`self-check: PASS` / exit 0 / 最終行 `cochange_checked=0 cochange_warn=0` を確認）、修正前の分岐（`0) ;; 1) fail ...; *) fail ...`）へ一時的に戻したコピーをスクラッチ側の別 git リポジトリで作り、同じ空表シナリオで `exit 1` かつ `ERROR: 保証レコードの表を読み取れない` になることを実測した。つまり新しい self-check ケースは修正前で red、修正後で green になる。

差分は Issue の要旨どおり最小で、`check-guarantees.sh` の `rows_exit` 判定（`0|1) ;; *) ...`）と完全に同じ形へ揃えている。早期 return（`rg_status -eq 1` で `summary; exit 0`）は一見 `case` と重複しているように見えるが、これは必要な設計である。表 0 行のケースをそのまま後続処理へ流すと、self-check の空レコードテストのように `$LEDGER` がリポジトリ外の mktemp パスを指す場合に `git diff ... -- "$LEDGER"` が `outside repository` で fatal し、意図せず fail してしまう（実測済み）。この早期 exit がその「差分収集そのものを踏ませない」役割を担っており、過剰実装ではなく必然。

コメント（「表の行のみ...0 行は許容し、読取エラーは fail-closed にする」「表の行が 0 なら...0 件で終える」）は正確でコードの意図と一致しており、削除・簡略化すべき冗長さは見当たらない。SKILL.md の 1 文修正も情報追加のみで既存文と矛盾しない。

#### security

LGTM

`check-guarantee-cochange.sh` の変更箇所を中心に確認した。`$LEDGER` はすべて `"$LEDGER"` とダブルクォートで参照されており、変更前から一貫してクォート漏れは無い（`rg '^\|' "$LEDGER"` も同様）。新設した早期 exit 分岐（`if [ "$rg_status" -eq 1 ]; then summary; exit 0; fi`）は変数展開や外部コマンド呼び出しを一切追加しておらず、インジェクション面・パストラバーサル面ともに新規のリスクは無い。

一時ファイルについても、この早期 exit パスは `changed_files` / `untracked_files` / `ledger_diff` の `mktemp` 呼び出しより前で終了するため、新たな一時ファイルを一切作らない（trap のクリーンアップ対象も増えない）。`self-check.sh` の追加ケースも新規の一時ファイル作成をせず、既存の `$empty_ledger_file`（既存の trap でカバー済み）を再利用しているだけで、リークや二重削除のリスクは無い。

`$LEDGER` の値は環境変数由来で、CI 設定者・スクリプト起動者という信頼済みの入力を前提とする既存の脅威モデルのままであり、この diff によって信頼境界は変わっていない。情報漏洩の観点でも、エラーメッセージの文言変更（`保証レコードの表検査に失敗` → `保証レコードの表を読み取れない`）は機微情報を含まず、`check-guarantees.sh` の既存メッセージと文言を揃えただけである。

#### core-logic

LGTM

`rg` の終了コード契約（0=一致あり、1=一致なし、2 以上=エラー）は ripgrep の標準仕様どおりであり、`case "$rg_status" in 0|1) ;; *) fail ... ;; esac` は「1（不一致=0行）を正常系として扱い、2 以上だけを fail-closed にする」という意図を正しく実装している。これは兄弟スクリプト `check-guarantees.sh` の `case "$rows_exit" in 0|1) ;; *) ... esac`（55-60行目）と完全に一致する記述で、委任仕様の要求（同一の終了コード判定へ揃える）を満たしている。

早期 exit の位置（`BASE_REF` の解決確認より後、`changed_files=$(mktemp)` などの差分収集より前）を確認した。`rg` 実行前に既に「ファイル読取不可」（34-36行目）と「base ref 解決不能」（38-40行目）の分岐を通過済みであるため、行0のケースでも base ref 検証はスキップされず、既存の fail-closed 経路は変更されていない。`summary()` は `checked`/`warned` の初期値（ともに0）をそのまま出力するため、早期 exit 時の出力は必ず `cochange_checked=0 cochange_warn=0` になり、要求どおり。

既存経路の不変性も確認した。行が1件以上ある場合（`rg_status=0`）は case が no-op で通過し、`if rg_status -eq 1` も false のため、以降の差分収集・突合ロジックへそのまま進む（変更なし）。ファイル不在・読取不可、base ref 解決不能の各分岐も diff の範囲外で、コード上も変更されていない。`summary` の呼び出し規約（`checked`/`warned` を出力してから exit）もこれまでと同じパターンを踏襲している。

自分で以下を実測して確認した:
- 修正後の `self-check.sh` 実行: `self-check: PASS`、exit 0、`cochange_checked=0 cochange_warn=0`。
- 修正前の分岐へ戻した一時コピー（別 git リポジトリ）で同じ空表シナリオを実行: `ERROR: 保証レコードの表を読み取れない` と表示され exit 1（旧バグを再現）。

#### tests

LGTM

追加された `self-check.sh` の新ケース（「表の無い保証レコードで cochange を検査する」）は退行検知として機能することを実測で確認した。修正前のコード（`case` を `0) ;; 1) fail ...; *) fail ...` に戻したもの）へこのテストを当てると、`empty_cochange_exit` が 1 になり `[ "$empty_cochange_exit" -ne 0 ]` が真になって `failed=1` が立つ（red）。修正後のコードでは `exit 0` かつ出力が `cochange_checked=0 cochange_warn=0` に一致し green になる。つまり期待どおり修正前で red・修正後で green になる regression test になっている。

アサーションは exit code と出力文字列の完全一致の両方を見ており厳密（`-ne 0` の OR 条件で片方でも崩れれば FAIL）。件数のような変動する値は使っておらず、固定文字列 `'cochange_checked=0 cochange_warn=0'` で判定しているため陳腐化しにくい。

一時ファイルの扱いも問題ない。新ケースは新規の `mktemp` を呼ばず、既存の `$empty_ledger_file`（40行目で作成、44行目の trap でカバー済み）を再利用しているだけなので、trap の対象漏れやクリーンアップの重複は発生しない。`LEDGER="$empty_ledger_file" BASE_REF=HEAD` という組み合わせにより、既存 `origin/main` 依存を避けて必ず解決可能な `HEAD` を使う設計判断も委任仕様どおり。

既存3ケース（正例・負例・表無しの `check-guarantees.sh` 検査）への影響も無い。新ケースは既存ケースの後ろに追記されているだけで、共有変数（`failed`, `empty_ledger_file`）の再代入や上書きは無く、実行順序に依存する副作用も見当たらない。実測でも既存3ケースは従来どおりの出力（`checked=2 broken=0 unpinned=1 指示=1 選択=1` 等）のままだった。

#### domain

LGTM

`check-guarantee-cochange.sh` の終了コード判定を `check-guarantees.sh` の該当箇所（50-60行目）と全く同じ形（`case ... in 0|1) ;; *) ... ;; esac`）へ揃えており、CLI 2本の一貫性という観点で狙いどおりの修正になっている。エラーメッセージの文言も `保証レコードの表を読み取れない: $LEDGER` に統一され、`check-guarantees.sh` 側の `ERROR: 保証レコードの表を読み取れない: $LEDGER`（57行目）と表現が揃っている（`check-guarantee-cochange.sh` 側は既存の `fail()` ヘルパーを使うため `ERROR:` プレフィックスと `summary` 出力が自動で付く点も既存動作のまま）。

追加されたコメント2行（「表の行のみ...」「表の行が0なら...」）は、`check-guarantees.sh` の51行目のコメント「表の行のみ（| で始まる行）を読み取る。0 行は許容し、読取エラーは fail-closed にする。」と表現・粒度が揃っており、2スクリプト間でコメントスタイルの乖離が無い。

stderr/stdout の使い分け（`fail()` はエラーを stderr、`summary()` は stdout）、exit code 規約（0=続行、1=FAIL、2=WARN。今回追加した0行ケースは「続行」相当なので0を返すのが正しい）も SKILL.md ⑨「exit code 契約」の記述と整合している。既存の `check-guarantee-cochange.sh` の他の `fail` 呼び出し・`case` パターン（84-90行目、94-101行目、111-116行目）と比べても、今回追加した分岐は同じイディオムを踏襲しており異質さは無い。

#### ambiguity-hunter

LGTM

対象は SKILL.md 143行目の1文のみ：「保証レコードを空で開始する。または指示の情報源（`.docs/plans` の決定・PR rubric・レビュー裁定・risk-registry）から起こす。レコードを空で開始したとき両 checker（`check-guarantees.sh` は `checked=0`、`check-guarantee-cochange.sh` は `cochange_checked=0`）は exit 0 になる（表ヘッダも不要）。」

7パターンを個別に確認した。
1. 暗黙の基準: 「空で開始したとき」という条件と、それぞれの checker の出力トークンが具体的に書かれており、読み手が別の基準を補う余地は無い。
2. 未定義の境界: 「空」＝表の行が0件、という意味は前後の文脈（同スキル全体で `rg '^\|'` による表行検査を前提にしている）と一致し曖昧さは無い。
3. 閾値なしの主観語: 主観的な形容語は含まれない。
4. 収束条件の欠落: この文はプロセスの収束を扱う文ではなく該当しない。
5. 重複・競合定義: ⑨「出力形式」節（195行目、`check-guarantees.sh` 用）や「exit code 契約」節（201行目）と突き合わせたが、`checked=0` と `cochange_checked=0` をそれぞれ正しい checker に紐付けており矛盾は無い。
6. 宙吊り参照: `check-guarantees.sh` と `check-guarantee-cochange.sh` はともに `scripts/` 配下に実在し（142行目でも同じ2ファイル名が既出）、参照切れは無い。
7. anti-gaming欠落: この文はテスト成功基準や rubric ではなく、該当しない。

80%以上の確信度で報告すべき曖昧さは見つからなかった。

#### altitude-checker

LGTM

同じ143行目の1文を5パターンで確認した。
1. 固有語彙の漏れ: スクリプトファイル名（`check-guarantees.sh` / `check-guarantee-cochange.sh`）は同じ ⑧ 導入手順の直前の文（142行目）で既に列挙されている固有名であり、この節自体が「導入手順」という具体的な作業レベルの節である。文脈と乖離した固有語彙の混入ではない。
2. 委譲可能な詳細の常駐: `checked=0` / `cochange_checked=0` という出力トークンは ⑨「出力形式」節に既に定義されている低レベル詳細だが、導入手順の節で「レコードを空で始めたら何が起きるか」を示す目的で再掲するのは、修正前の文（`checker は checked=0 で exit 0`）が既に同種の再掲をしており、今回はそれを両 checker 分に拡張しただけである。新たに常駐させた詳細ではなく、既存文の対称性を補っただけ。
3. 一回性の一般化: 特定の1事例から過度に一般化した記述ではない。
4. right altitude 違反: ⑧ は「導入手順」という具体的な作業ステップを書く節であり、この高度の文に checker の具体的な挙動（exit 0 になる条件）を書くのは節の目的と一致する。
5. scope excess: 文の範囲は「空で開始したときの挙動」のみに閉じており、他の挙動（行1件以上のケースやWARNの詳細など）へ範囲を広げていない。

80%以上の確信度で報告すべき overfit は見つからなかった。

<!-- review-cycle:end 2026-09-06-issue-60-cochange-zero-rows -->
