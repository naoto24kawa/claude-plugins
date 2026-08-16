---
name: parallel-review-cycle
description: 'This skill should be used when the user asks to "5人の専門家にレビューしてもらおう", "専門家並行レビュー", "parallel expert review", "parallel review cycle", "指摘が0になるまでレビュー", "レビューサイクルを回す", "繰り返しレビュー", or wants to autonomously run multiple rounds of parallel specialist code review until all findings reach zero — without stopping to confirm between rounds. When the review target includes prose rules/specs (CLAUDE.md, .docs/plans, SKILL.md/index.md, README, design docs), a 6th "Ambiguity Hunter" lens also checks for underspecification — implicit criteria, undefined boundaries, threshold-less subjective terms, missing convergence conditions, duplicate definitions, dangling references — and a 7th "Altitude Checker" lens (its counterpart) checks for detail-level overfit — mechanism-specific vocabulary leaking upward, delegable details living in principle docs, one-off experiences generalized into permanent rules. Triggers also: "仕様の曖昧さをチェック", "ルールの曖昧さ", "未明文化を洗い出す", "ambiguity check", "overfit チェック", "過剰実装チェック", "altitude check".'
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep, Agent]
model: opus
effort: high
---

# Parallel Expert Review Cycle

5名の専門レビュアーを並行ディスパッチし、指摘が 0 件になるまでラウンドを繰り返すレビュー手法。
セッションスコープの偽陽性レジストリにより、同じ誤判定が繰り返しエスカレートされることを防ぐ。
レビュー対象に文章仕様（CLAUDE.md / `.docs/plans` / スキル定義 / README / 設計書）が含まれる時は、6人目の **Ambiguity Hunter**（未明文化ハンター・詳細 → `references/ambiguity-hunter.md`）と、その対レンズである7人目の **Altitude Checker**（高度検査＝詳細レベルの overfit 検出・詳細 → `references/altitude-checker.md`）も起動する。明文化圧と抽象化圧を対にしてレビューの一方向膨張を防ぐ。

## 実行モデル

レビューは推論の深さが結果を支配するため、**Opus** で実行する。この節がモデル指定の正本であり、
frontmatter の `model` / `effort` はこの節を Claude Code 上で自動適用するためのショートカットである。

- **オーケストレータ**: frontmatter の `model: opus` / `effort: high` で指定済み。
- **スペシャリスト**: `Agent` 呼び出しで `model: "opus"` を**明示指定**する。親からの継承に
  任せない——frontmatter の override はそのターンの残りしか効かず、ユーザーが途中で入力すると
  セッションのモデルへ戻り、ラウンドごとにレビュー品質が変わって収束判定が信用できなくなる。
- ユーザーが明示的にモデルを指定した場合はそれに従う。
- `Agent` 相当を持たない環境（Codex 等。frontmatter の `model` も無視される）では
  既定モデルで実行してよい。

## 自律実行の原則

**このスキルは全サイクルを自律的に実行する。ユーザーへの確認はしない。**

- ステップ 2〜5 を全スペシャリストが LGTM を返すまで繰り返す
- ラウンド間でユーザーに確認を求めない
- ユーザーが明示的に中断を要求した場合、堂々巡り検出時（ステップ5・エスカレーション）、または最大ラウンド数超過時（ステップ5）のみサイクルを終了する
- 完了後にまとめて報告する（途中経過は報告しない）

## 概要

```
Round N
  ├─ Specialist #1 (Security)     → finding or LGTM
  ├─ Specialist #2 (Core Logic)   → finding or LGTM
  ├─ Specialist #3 (Tests)        → finding or LGTM
  ├─ Specialist #4 (Domain)       → finding or LGTM
  ├─ Specialist #5 (Fresh Eyes)   → finding or LGTM
  ├─ Specialist #6 (Ambiguity Hunter) → finding or LGTM  ※対象に文章仕様が含まれる時のみ
  └─ Specialist #7 (Altitude Checker) → finding or LGTM  ※同上（#6 の対レンズ）
         ↓
  FP Registry 照合 → 既知FP は即棄却
         ↓
  真の指摘 → 修正 → テスト → 次ラウンドへ（確認なし）
         ↓
  全員 LGTM → 完了レポートを出力
```

## ステップ 1: FP レジストリを初期化する

サイクル開始時に一時ディレクトリを作成し、空のレジストリを用意する。

```bash
# uuidgen (macOS/BSD) または /proc/sys/kernel/random/uuid (Linux) でポータブルに生成
_uuid=$(uuidgen 2>/dev/null | tr '[:upper:]' '[:lower:]' \
  || cat /proc/sys/kernel/random/uuid 2>/dev/null \
  || date +%s%N)
REVIEW_DIR="/tmp/review-cycle-${_uuid}"
mkdir -p "$REVIEW_DIR"
touch "$REVIEW_DIR/fp-registry.md"
```

レジストリのフォーマット詳細は `references/fp-registry-format.md` を参照。

## ステップ 2: スペシャリストを並行ディスパッチする

`Agent` ツールを使い、各呼び出しを **単一メッセージ内** に並べて同時実行する。
モデル指定は「実行モデル」節に従う（各 `Agent` 呼び出しで `model` を明示する）。
ディスパッチ数は **5本**（コードのみ対象の場合）または **7本**（レビュー対象に文章仕様が1つ以上含まれる場合は #6 Ambiguity Hunter と #7 Altitude Checker を追加）。

### ロール構成

各ラウンドで以下のロールをディスパッチする（#6・#7 は条件付き）。プロジェクトの特性に応じて Domain ロールをカスタマイズすること。

| # | ロール | フォーカス |
|---|--------|-----------|
| 1 | Security | 注入・パストラバーサル・情報漏洩 |
| 2 | Core Logic | ビジネスロジック・データ整合性 |
| 3 | Tests | テスト隔離・カバレッジ・アサーション |
| 4 | Domain | CLI/API/DB など対象固有の品質 |
| 5 | Fresh Eyes | 先入観なしの総合チェック |
| 6 | Ambiguity Hunter | 文章仕様の未明文化（暗黙基準・未定義境界・閾値なし主観語・収束条件欠落・重複定義・宙吊り参照・anti-gaming欠落）。**対象に文章仕様が含まれる時のみ起動**。詳細 → `references/ambiguity-hunter.md` |
| 7 | Altitude Checker | 文章仕様の詳細レベル overfit（固有語彙の漏れ・委譲可能な詳細の常駐・一回性の一般化・right altitude 違反・scope excess）。**対象に文章仕様が含まれる時のみ起動**（#6 の対レンズ）。詳細 → `references/altitude-checker.md` |

> **Fresh Eyes の注意**: Fresh Eyes には「修正済み事項」を渡さない。修正済みのはずの問題が再浮上する場合、修正が不完全な可能性があるため。FP レジストリは渡す（確認済みの偽陽性は除外する）。

> **Ambiguity Hunter / Altitude Checker の注意**: コードのみが対象のサイクルではディスパッチしない（LGTM 扱い）。対象に文章仕様が1つ以上含まれる場合のみディスパッチする。


ロール別のフォーカスエリアとプロンプトテンプレートは `references/specialist-roles.md` を参照。

### スペシャリストへ伝える必須情報

各スペシャリストのプロンプトに必ず含めること:

1. **レビュー対象ファイル一覧** — 絶対パスで指定
2. **修正済み事項** — 重複報告を防ぐため、前ラウンドまでに修正した内容を列挙（**Fresh Eyes には渡さない**——上記注意参照）
3. **設計上の事実** — 意図的な設計判断（「これは仕様」と分かっているもの）
4. **FP レジストリの内容** — `cat "$REVIEW_DIR/fp-registry.md"` で読み込んでプロンプトに展開
5. **報告フォーマット** — flag が無ければ「LGTM」（optional 所見があれば「LGTM／optional: <概要>」と併記。**optional を `[ISSUE]` 形式で書かせない**）。flag がある場合のみ `[ISSUE] ファイル:行 / 確信度 / 問題 / 修正案` の形式

### 確信度フィルタと scope フィルタ

スペシャリストには「**確信度 80% 以上の問題のみ報告**」を明示する。これにより低品質な指摘のノイズを減らす。

あわせて `references/agent-output-principles.md`（同スキル内）の **scope フィルタ**を各プロンプトに含める——flag（correctness・セキュリティ・明示要件に影響。文章仕様では誤実装・誤運用・収束不能に至る欠陥を含む。**過剰実装**は「インフラ・標準機能・既存ライブラリで足りるのに自前実装へ降りていて、その降格理由が成果物に無い」場合のみ flag——「もっとシンプルにできる」という主観的な簡素化案は optional に留める（主観を flag にすると収束しない））と optional（それ以外）を分離報告させる。**サイクル継続判定・LGTM 相当の判定は flag のみ**で行う（確信度は severity/scope と直交——100%確信のスタイル指摘で収束を妨げない）。optional は修正不要だが、記録は正本の記録先規定に従い**ディスクへ残す**（コード変更なら `INSPECTION_STATUS` 併記、それ以外はレビュー成果物、無ければ対象ルートの `.docs/reviews/`）。チャットの最終レポートには要約のみ載せる。

## ステップ 3: 結果を収集し FP レジストリと照合する

各スペシャリストの結果が返ったら:

1. **flag なし（LGTM または optional のみ）** → そのロールは次ラウンド不要（ただし Fresh Eyes は毎ラウンド実行）。optional は記録リストに積む
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

新規指摘を評価し:

- **flag された真の問題** → 修正し、テストを実行して通過を確認する（テストが無い文章仕様レビューでは修正内容の実ファイル反映を確認）
- **新しい偽陽性** → レジストリに追記する（フォーマットは `references/fp-registry-format.md` 参照）

**#6 × #7 の裁定規則**: Ambiguity（曖昧だ）と Altitude（詳しすぎる）が同一箇所・関連箇所を指した場合、既定解は「**委譲先（正本・詳細レイヤー）で明文化し、原則文書には要約＋ポインタを残す**」。原則文書への詳細追記は最後の手段とする。

偽陽性の判定基準:
- 設計上の意図が反映されていない（ドキュメント化された仕様と矛盾する）
- コードの別の箇所に保護が存在する（多層防御で補完されている）
- ライブラリやフレームワークの保証に依存している

## ステップ 5: 継続判定（確認なし）

ユーザーへの確認は一切行わず、即座に次のアクションへ移る。

**最大ラウンド数: 10**（デフォルト）。10ラウンドを超えても指摘が残る場合は、現在の状況をユーザーに報告してサイクルを停止する。

```
flag された真の指摘が 1 件以上あった → テスト実行 → ステップ 2 へ（次ラウンド、確認なし）
堂々巡り検出（FP レジストリ非該当の同一 flag が、修正後も2ラウンド連続で再出現） → 現状を報告してサイクル停止（ユーザーへエスカレーション。自律実行原則の例外）
全スペシャリストが LGTM（flag 0。optional のみは LGTM 扱い） → ステップ 6 へ
ラウンド数が 10 を超過     → 現状報告してサイクル停止
```

ラウンド番号を R1, R2, R3 ... と管理し、各ラウンドの修正内容を記録しておく（最終レポートで使用）。

## ステップ 6: クリーンアップと完了レポート

FP レジストリを削除し、サイクル全体のサマリーをユーザーに報告する。

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
```

## 設計原則

### なぜ Checker エージェントは不要か

Checker（偽陽性チェッカー）は「偽陽性が私に到達してから止める」リアクティブな仕組み。
FP レジストリは「偽陽性が上がってくる前に止める」プロアクティブな仕組みであり、根本的に優れている。

- **既知 FP** → レジストリが防ぐ（Checker 不要）
- **未知 FP** → Checker も Specialist と同じコードを読んで同じ誤りをしうる（効果薄い）
- **真のバグ** → Specialist が正しく報告（Checker は単なるラグ）

### なぜ 5 名か

専門分化が効く最小構成。同じロールを 2 名にしても偽陽性が増えるだけ。
Fresh Eyes を 2〜3 名にする方が ROI が高い（盲点の発見に有効）。

### FP レジストリの寿命

サイクル開始時に作成し、サイクル完了時に削除する。プロジェクトを汚染しない。
同じ誤判定が次のサイクルで再発する場合は、「設計上の事実」として「修正済み事項」または CLAUDE.md に昇格させることを検討する。

## 追加リソース

- **`references/specialist-roles.md`** — 5 ロールのフォーカスエリアとプロンプトテンプレート
- **`references/fp-registry-format.md`** — FP レジストリのエントリフォーマットと照合ルール
- **`references/ambiguity-hunter.md`** — #6 Ambiguity Hunter（文章仕様の曖昧さ）の7分類・出力・明文化案・起動条件
- **`references/altitude-checker.md`** — #7 Altitude Checker（詳細レベル overfit）の5分類・出力・移設案・#6 との裁定
