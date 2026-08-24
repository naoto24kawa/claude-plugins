---
name: lens-review-cycle
description: 'This skill should be used when the user asks to "レンズレビュー", "lens review cycle", "専門家レビュー", "expert review cycle", "5人の専門家にレビューしてもらおう", "指摘が0になるまでレビュー", "レビューサイクルを回す", "繰り返しレビュー", or the legacy phrases "parallel review cycle" / "専門家並行レビュー" — to autonomously run sequential multi-lens review until findings reach zero. When the target includes prose rules/specs (CLAUDE.md, .docs/plans, SKILL.md, README, design docs), a 6th "Ambiguity Hunter" lens checks underspecification (implicit criteria, undefined boundaries, missing convergence conditions, dangling references) and a 7th "Altitude Checker" lens checks detail-level overfit (mechanism vocabulary leaking upward, one-off experiences generalized into rules). Triggers also: "仕様の曖昧さをチェック", "ルールの曖昧さ", "未明文化を洗い出す", "ambiguity check", "overfit チェック", "過剰実装チェック", "altitude check". プロダクト構想段階で「その判断自体が正しいか」を外側から問い直す場合は、このスキルではなく product-design-lens を使う。'
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep, Agent, mcp__plugin_ts-review-graph_ts-review-graph__get_minimal_context]
---

# Lens Review Cycle

5〜7 の専門レンズを **1 名のレビュアーに順に当てさせ**、指摘が 0 件になるまでラウンドを繰り返すレビュー手法。
レンズ（観点の分離と、レンズごとに独立した findings）が品質を支えており、エージェントの並列起動は支えていない。既定では並列起動しない。
セッションスコープの偽陽性レジストリにより、同じ誤判定が繰り返しエスカレートされることを防ぐ。
レビュー対象に文章仕様（CLAUDE.md / `.docs/plans` / スキル定義 / README / 設計書）が含まれる時は、6人目の **Ambiguity Hunter**（未明文化ハンター・詳細 → `references/ambiguity-hunter.md`）と、その対レンズである7人目の **Altitude Checker**（高度検査＝詳細レベルの overfit 検出・詳細 → `references/altitude-checker.md`）も起動する。明文化圧と抽象化圧を対にしてレビューの一方向膨張を防ぐ。

## このスキルを使わない場合

**まだ確定していない判断を訂正する用途には使わない。** 競合・法令・時間軸・失敗シナリオといった「文書の外」に照らして判断そのものを書き換えるのは `product-design-lens` である。このスキルは「文書の中」を見て記述の破綻を直す。

判断を確定させてから（product-design-lens）、記述を締める（このスキル）という順番になる。

## 実行モデル

この節が実行形態とモデル指定の正本である。

- **オーケストレータ**: セッションのモデルのまま（frontmatter で上書きしない）。集約・FP 照合・修正・コミットだけを行い、自分ではレンズを当てない（セッションモデルが高価な場合にトークンを食うため）。
- **レビュアー**: **サブエージェント 1 名**。`Agent` 呼び出し 1 回で、適用するレンズを全部渡し、順に当てさせる。`model` は**明示指定**する（親からの継承に任せない——ユーザーが途中で入力するとセッションのモデルへ戻り、ラウンドごとにレビュー品質が変わって収束判定が信用できなくなる）。
  - 既定は `model: "sonnet"`。
  - 対象がコードで、セキュリティ・データ破壊・課金に影響しうる変更を含むときは `model: "opus"`。
  - ユーザーが明示的にモデルを指定した場合はそれに従う。
- **並列起動はしない**。レンズごとに 1 名ずつ同時起動するのは、ユーザーが「並列で」と明示したときだけ（その場合も各呼び出しで `model` を明示する）。理由は「設計原則」節。
- `Agent` 相当を持たない環境（Codex 等）では、オーケストレータ自身がレンズを順に当ててよい。

## 自律実行の原則

**このスキルは全サイクルを自律的に実行する。ユーザーへの確認はしない。**

- ステップ 2〜5 を全スペシャリストが LGTM を返すまで繰り返す
- ラウンド間でユーザーに確認を求めない
- ユーザーが明示的に中断を要求した場合、堂々巡り検出時（ステップ5・エスカレーション）、または最大ラウンド数超過時（ステップ5）のみサイクルを終了する
- 完了後にまとめて報告する（途中経過は報告しない）

## 概要

```
Round N — レビュアー 1 名がレンズを順に当てる（各レンズの findings を別ファイルへ）
  1. Fresh Eyes        → finding or LGTM   ※最初に当てる（修正済み事項を読む前）
  2. Security          → finding or LGTM
  3. Core Logic        → finding or LGTM
  4. Tests             → finding or LGTM
  5. Domain            → finding or LGTM
  6. Ambiguity Hunter  → finding or LGTM   ※対象に文章仕様が含まれる時のみ
  7. Altitude Checker  → finding or LGTM   ※同上（#6 の対レンズ）
         ↓
  FP Registry 照合 → 既知FP は即棄却
         ↓
  真の指摘 → 修正 → テスト → 次ラウンドへ（確認なし）
         ↓
  全レンズ LGTM → 完了レポートを出力
```

## ステップ 1: durable state と FP レジストリを初期化する

サイクル開始時に worktree ごとの決定的な一時ディレクトリを選ぶ。

```bash
_wt=$(basename "$(git rev-parse --show-toplevel)")
REVIEW_DIR="/tmp/review-cycle-${_wt}"
```

`REVIEW_DIR` は symlink でなく実行ユーザー所有の mode 0700 であることを確認してから使う。同一 worktree では同時に複数サイクルを実行しない。`state.md` の対象 HEAD、対象ファイル集合、content fingerprint が今回と一致すれば再開し、完了済みラウンドと有効な findings 済みロールをスキップする。不一致または `state.md` が無い残骸は `${REVIEW_DIR}-abandoned-$(date +%s)` へ退避して新規開始する。パス生成・安全検査・状態構造・再開比較は `references/durable-state.md`、FP レジストリの初期化と前回ログからの安全な carry-over は `references/fp-registry-format.md` を参照する。

## ステップ 1.5: 最小コンテキストの取得（任意）

レビュー対象にコードが含まれ、対象リポジトリに `.ts-review-graph/graph.db` がある場合だけ、`get_minimal_context(changed_files, "review")` を1回呼ぶ。結果は全 specialist に「まず読むべき起点」として渡すが、読む範囲の制約にはしない。

グラフが無い、stale で拒否された、または MCP サーバーが未接続の場合は理由を1行記録し、**現行のレビュー動作を継続する**。文章仕様のみが対象なら呼び出さない。呼び出し形式とフォールバックは `references/minimal-context-feeder.md` を参照する。

## ステップ 2: レビュアー 1 名にレンズを順に当てさせる

`Agent` ツールを **1 回**呼び、適用するレンズを全部渡す。モデル指定は「実行モデル」節に従う（`model` を明示する）。
適用するレンズは **5 つ**（コードのみ対象の場合）または **7 つ**（レビュー対象に文章仕様が1つ以上含まれる場合は #6 Ambiguity Hunter と #7 Altitude Checker を追加）。
レビュアーには `Write` ツールを渡し、事前に `$REVIEW_DIR/round-N/` を作成する。レンズごとの完全な findings は `$REVIEW_DIR/round-N/<role>.md` へ書かせ（1 名が 5〜7 ファイルを書く）、応答本文は結論とパスだけにする。オーケストレータは応答本文でなくファイルを集約する。

レンズの適用順は **Fresh Eyes を最初**にする。修正済み事項は `$REVIEW_DIR/round-N/fixed-items.md` に置き、プロンプトで「Fresh Eyes の findings を書き終えるまで読まない」と指示する（別人を立てずに Fresh Eyes の独立性を順序で担保する）。

### ロール構成

各ラウンドで以下のレンズを順に当てる（#6・#7 は条件付き）。プロジェクトの特性に応じて Domain ロールをカスタマイズすること。

| # | ロール | フォーカス |
|---|--------|-----------|
| 1 | Security | 注入・パストラバーサル・情報漏洩 |
| 2 | Core Logic | ビジネスロジック・データ整合性 |
| 3 | Tests | テスト隔離・カバレッジ・アサーション |
| 4 | Domain | CLI/API/DB など対象固有の品質 |
| 5 | Fresh Eyes | 先入観なしの総合チェック |
| 6 | Ambiguity Hunter | 文章仕様の未明文化（暗黙基準・未定義境界・閾値なし主観語・収束条件欠落・重複定義・宙吊り参照・anti-gaming欠落）。**対象に文章仕様が含まれる時のみ起動**。詳細 → `references/ambiguity-hunter.md` |
| 7 | Altitude Checker | 文章仕様の詳細レベル overfit（固有語彙の漏れ・委譲可能な詳細の常駐・一回性の一般化・right altitude 違反・scope excess）。**対象に文章仕様が含まれる時のみ起動**（#6 の対レンズ）。詳細 → `references/altitude-checker.md` |

> **Fresh Eyes の注意**: Fresh Eyes は「修正済み事項」を読む前に当てる。修正済みのはずの問題が再浮上する場合、修正が不完全な可能性があるため。FP レジストリは渡す（確認済みの偽陽性は除外する）。

> **Ambiguity Hunter / Altitude Checker の注意**: コードのみが対象のサイクルでは当てない（LGTM 扱い）。対象に文章仕様が1つ以上含まれる場合のみ当てる。


ロール別のフォーカスエリアとプロンプトテンプレートは `references/specialist-roles.md` を参照。

### レビュアーへ伝える必須情報

レビュアーのプロンプトに必ず含めること:

1. **レビュー対象ファイル一覧** — 絶対パスで指定
2. **修正済み事項のパス** — 重複報告を防ぐため、前ラウンドまでに修正した内容を `$REVIEW_DIR/round-N/fixed-items.md` に列挙し、**Fresh Eyes の findings を書き終えてから読む**よう指示する（上記注意参照）
3. **設計上の事実** — 意図的な設計判断（「これは仕様」と分かっているもの）
4. **FP レジストリの内容** — `cat "$REVIEW_DIR/fp-registry.md"` で読み込んでプロンプトに展開
5. **最小コンテキスト** — ステップ1.5で取得できた場合だけ、「まず読むべき起点」であり範囲制約ではないと明記して添付
6. **レンズごとの findings の絶対パス** — オーケストレータが role ごとに解決した `{findings_path}` の一覧と適用順。これらのパス以外へ書かないよう明記する
7. **報告フォーマット** — flag が無ければ「LGTM」（optional 所見があれば「LGTM／optional: <概要>」と併記。**optional を `[ISSUE]` 形式で書かせない**）。flag がある場合のみ `[ISSUE] ファイル:行 / 確信度 / 問題 / 修正案` の形式。完全な報告は指定 findings ファイルへ書き、応答本文は「LGTM / flag N件＋パス」のみにする

### 確信度フィルタと scope フィルタ

レビュアーには「**確信度 80% 以上の問題のみ報告**」を明示する。これにより低品質な指摘のノイズを減らす。

あわせて `references/agent-output-principles.md`（同スキル内）の **scope フィルタ**を各プロンプトに含める——flag（correctness・セキュリティ・明示要件に影響。文章仕様では誤実装・誤運用・収束不能に至る欠陥を含む。**過剰実装は降格理由の欠落のみ flag**——判定条件は同ファイルの scope フィルタが正本）と optional（それ以外）を分離報告させる。**サイクル継続判定・LGTM 相当の判定は flag のみ**で行う（確信度は severity/scope と直交——100%確信のスタイル指摘で収束を妨げない）。optional は修正不要だが、記録は正本の記録先規定に従い**ディスクへ残す**（コード変更なら `INSPECTION_STATUS` 併記、それ以外はレビュー成果物、無ければ対象ルートの `.docs/reviews/`）。チャットの最終レポートには要約のみ載せる。

## ステップ 3: 結果を収集し FP レジストリと照合する

あるレンズの結果が返らない場合（エラー、タイムアウト、空応答、findings ファイル未作成・空・読取不能・形式不正）は LGTM として扱わない。有効性は `references/durable-state.md` の定義で検証する。欠けたレンズだけを 1 回だけ再依頼し（`Agent` を 1 回。並列起動はしない）、それでも返らなければラウンドを未完のまま停止し、ユーザーへ報告する。試行回数は `state.md` に永続化し、再開用の `REVIEW_DIR` は削除しない。

全レンズの findings ファイルが揃ったら:

1. **flag なし（LGTM または optional のみ）** → そのレンズは次ラウンド不要（ただし Fresh Eyes は毎ラウンド当てる）。optional は記録リストに積む
2. **flag あり** → FP レジストリと照合する

### FP 照合ルール

```
指摘の「主張」が FP レジストリのエントリとマッチする
  → 偽陽性として即棄却（修正しない）
  → 次ラウンドの「修正済み事項」にも追加しない

マッチしない（新規指摘）
  → ステップ 4 へ
```

マッチ判定は完全一致でなくてよい。「同じロジックへの同じ誤解」であれば同一とみなす。

## ステップ 4: 真の指摘を修正する

修正着手前に `git status` で予期しない変更が無いか確認する。

新規指摘を評価し:

- **flag された真の問題** → 修正し、テストを実行して通過を確認する（テストが無い文章仕様レビューでは修正内容の実ファイル反映を確認）
- **新しい偽陽性** → レジストリに追記する（フォーマットは `references/fp-registry-format.md` 参照）

修正前に対象事項を `pending` として `state.md` に書き、実ファイル反映と検証後にだけ `applied` へ更新する。再開時は一般の fingerprint 比較より先に `pending` の回復規則を適用する。

**#6 × #7 の裁定規則**: Ambiguity（曖昧だ）と Altitude（詳しすぎる）が同一箇所・関連箇所を指した場合、既定解は「**委譲先（正本・詳細レイヤー）で明文化し、原則文書には要約＋ポインタを残す**」。原則文書への詳細追記は最後の手段とする。

偽陽性の判定基準:
- 設計上の意図が反映されていない（ドキュメント化された仕様と矛盾する）
- コードの別の箇所に保護が存在する（多層防御で補完されている）
- ライブラリやフレームワークの保証に依存している

## ステップ 5: 継続判定（確認なし）

ユーザーへの確認は一切行わず、即座に次のアクションへ移る。

**最大ラウンド数: 3**（デフォルト。standards `AI_FIRST.md` §3 の収束条件と同じ値）。3ラウンドを超えても指摘が残る場合は、現在の状況をユーザーに報告してサイクルを停止する（残った指摘は修正か明示受容かをその場で決め、積み残さない）。

```
flag された真の指摘が 1 件以上あった → テスト実行 → ステップ 2 へ（次ラウンド、確認なし）
堂々巡り検出（FP レジストリ非該当の同一 flag が、修正後も2ラウンド連続で再出現） → 現状を報告してサイクル停止（ユーザーへエスカレーション。自律実行原則の例外）
全レンズが LGTM（flag 0。optional のみは LGTM 扱い） → ステップ 6 へ
ラウンド数が 3 を超過     → 現状報告してサイクル停止
```

ラウンド番号を R1, R2, R3 ... と管理し、各ラウンドの修正内容を記録しておく（最終レポートで使用）。

## ステップ 6: 学習ログ、クリーンアップ、完了レポート

全レンズ LGTM、堂々巡り、ラウンド上限超過は terminal な終了としてこのステップへ進む。レビュアーの再試行失敗とユーザー中断は paused とし、ログも cleanup も行わず `REVIEW_DIR` を保持する。

terminal な終了時は、対象リポジトリの `.docs/reviews/review-cycle-log.md` へラウンド数、終了理由、レンズ別 flag 件数、確定した偽陽性を**先に追記**する。形式と追記規則は `references/cycle-log-format.md` を参照する。レンズ実績は記録だけに使い、構成を自動変更しない。

ログへの書き出しを確認してから一時状態を削除し、サイクル全体のサマリーをユーザーに報告する。

```bash
rm -rf "$REVIEW_DIR"
```

### 完了レポートのフォーマット

以下の形式でまとめて報告する:

```
## レビュー完了

**総ラウンド数**: N ラウンド

### ラウンド別修正サマリー

| ラウンド | 指摘件数 | 修正内容 |
|---------|---------|---------|
| R1      | X 件    | {修正の概要} |
| R2      | Y 件    | {修正の概要} |
| ...     |         |         |
| RN      | 0 件    | 全員 LGTM |

### 偽陽性サマリー（FP レジストリ）

| ID     | 主張の概要 | 初出 |
|--------|-----------|------|
| FP-001 | {概要}    | R1 #X |
| ...    |           |       |

（FP が 0 件の場合は「偽陽性なし」と記載）

### テスト結果

最終ラウンド後のテスト: {通過数}/{総数}

### optional 指摘（終了条件外）

{N}件・記録先: {ディスク上のパス}

### 判断レンズへの差し戻し

{N}件（0件なら「なし」）
{1件以上ある場合のみ}: 判断の未検証が残っている。product-design-lens で裁定すること。
```

## 設計原則

### なぜ Checker エージェントは不要か

Checker（偽陽性チェッカー）は「偽陽性が私に到達してから止める」リアクティブな仕組み。
FP レジストリは「偽陽性が上がってくる前に止める」プロアクティブな仕組みであり、根本的に優れている。

- **既知 FP** → レジストリが防ぐ（Checker 不要）
- **未知 FP** → Checker も Specialist と同じコードを読んで同じ誤りをしうる（効果薄い）
- **真のバグ** → Specialist が正しく報告（Checker は単なるラグ）

### なぜレンズは 5〜7 で、レビュアーは 1 名か

専門分化（レンズ）が効く最小構成は 5〜7。同じレンズを 2 回当てても偽陽性が増えるだけ。
一方、レンズごとに**別のエージェントを並列起動する**必要は無い——findings の品質を支えているのは「レンズごとに観点を絞り、独立したファイルへ書く」ことであり、別人格ではない。
実測（2026-08-22、文書 PR 1 本）では 7 名×Opus×2 ラウンドでレビュアー 14 名分のコストが掛かり、R2 以降は収穫逓減だった。1 名が順に当てれば、コードを読む作業の重複（7 名が同じファイルを 7 回読む）も消える。
Fresh Eyes の独立性だけは別人格に依存していたので、「最初に当てる・修正済み事項を後から読む」という順序で代替する。

### FP レジストリの寿命

サイクル開始時に作成し、完了ログへの書き出し後に一時状態とともに削除する。次サイクルでは完了ログから安全条件を満たす偽陽性だけを carry-over する。繰り返す誤判定は、別途「設計上の事実」への昇格も検討する。

## 追加リソース

- **`references/specialist-roles.md`** — 5 ロールのフォーカスエリアとプロンプトテンプレート
- **`references/fp-registry-format.md`** — FP レジストリのエントリフォーマット・照合ルール・前回ログからの carry-over
- **`references/durable-state.md`** — `REVIEW_DIR` の生成と安全検査・state の構造と再開判定・findings ファイルの有効性
- **`references/minimal-context-feeder.md`** — ts-review-graph の起動条件・呼び出し・fail-open フォールバック
- **`references/cycle-log-format.md`** — サイクル横断ログの形式・追記規則
- **`references/ambiguity-hunter.md`** — #6 Ambiguity Hunter（文章仕様の曖昧さ）の7分類・出力・明文化案・起動条件
- **`references/altitude-checker.md`** — #7 Altitude Checker（詳細レベル overfit）の5分類・出力・移設案・#6 との裁定
