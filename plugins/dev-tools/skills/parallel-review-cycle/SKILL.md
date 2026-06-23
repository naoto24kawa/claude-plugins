---
name: parallel-review-cycle
description: This skill should be used when the user asks to "5人の専門家にレビューしてもらおう", "専門家並行レビュー", "parallel expert review", "parallel review cycle", "expert review cycle", "指摘が0になるまでレビュー", "レビューサイクルを回す", "繰り返しレビュー", "keep reviewing until no issues", "iterative code review", "review this until it's clean", or wants to autonomously run multiple rounds of parallel specialist code review until all findings reach zero — without stopping to confirm between rounds.
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep, Agent]
---

# Parallel Expert Review Cycle

7名の専門レビュアーを並行ディスパッチし、指摘が 0 件になるまでラウンドを繰り返すレビュー手法。
セッションスコープの偽陽性レジストリにより、同じ誤判定が繰り返しエスカレートされることを防ぐ。

## 自律実行の原則

**このスキルは全サイクルを自律的に実行する。ユーザーへの確認はしない。**

- ステップ 2〜5 を全スペシャリストが LGTM を返すまで繰り返す
- ラウンド間でユーザーに確認を求めない
- ユーザーが明示的に中断を要求した場合のみサイクルを終了する
- 完了後にまとめて報告する（途中経過は報告しない）

## 概要

```
Round N
  ├─ Specialist #1 (Security)          → finding or LGTM
  ├─ Specialist #2 (Core Logic)        → finding or LGTM
  ├─ Specialist #3 (Tests)             → finding or LGTM
  ├─ Specialist #4 (Domain)            → finding or LGTM
  ├─ Specialist #5 (Fresh Eyes)        → finding or LGTM
  ├─ Specialist #6 (Quality+Security)  → finding or LGTM  ※ sentinel フロー
  └─ Specialist #7 (Structure)         → finding or LGTM  ※ sprawlens CLI
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

## ステップ 2: 5名のスペシャリストを並行ディスパッチする

`Agent` ツールを使い、5本の呼び出しを **単一メッセージ内** に並べて同時実行する。

### ロール構成

各ラウンドで以下の7ロールをディスパッチする。プロジェクトの特性に応じて Domain ロールをカスタマイズすること。

| # | ロール | フォーカス | 実装方法 |
|---|--------|-----------|---------|
| 1 | Security | 注入・パストラバーサル・情報漏洩 | Agent（コード読解） |
| 2 | Core Logic | ビジネスロジック・データ整合性 | Agent（コード読解） |
| 3 | Tests | テスト隔離・カバレッジ・アサーション | Agent（コード読解） |
| 4 | Domain | CLI/API/DB など対象固有の品質 | Agent（コード読解） |
| 5 | Fresh Eyes | 先入観なしの総合チェック | Agent（コード読解） |
| 6 | Quality+Security | quality/security レンズ + 3票検証 | `sentinel` スキルフロー |
| 7 | Structure | import グラフ構造劣化（循環依存・ハブ肥大化） | `sprawlens` CLI |

**#6/#7 の注意点:**
- #6 は `sentinel` スキルの実行フロー（review-request.json 生成 → サブエージェント × 2 → verify × 3票）を適用する。3票で confirmed となった finding のみを `[ISSUE]` として報告する
- #7 は `sprawlens` CLI を Bash で実行し、Blocking 条件（cycleCount +2以上等）を満たす場合のみ `[ISSUE]` として報告する。Warning のみの場合は LGTM 扱い
- #6/#7 には外部ツールが必要。未インストール時は「前提ツールが見つかりません」と報告して LGTM とし、ループを止めない

> **Fresh Eyes の注意**: Fresh Eyes には「修正済み事項」を渡さない。修正済みのはずの問題が再浮上する場合、修正が不完全な可能性があるため。FP レジストリは渡す（確認済みの偽陽性は除外する）。

> **#7 Structure の注意**: #7 には `file_list` の代わりに `BASE_SHA` と `HEAD_SHA` を渡す。sprawlens はリポジトリ全体を解析するため特定ファイルを指定しない。修正後は必ず再計測して構造が改善したことを確認してから LGTM を返すこと。


ロール別のフォーカスエリアとプロンプトテンプレートは `references/specialist-roles.md` を参照。

### スペシャリストへ伝える必須情報

各スペシャリストのプロンプトに必ず含めること:

1. **レビュー対象ファイル一覧** — 絶対パスで指定（#7 は不要。代わりに BASE_SHA / HEAD_SHA を渡す）
2. **修正済み事項** — 重複報告を防ぐため、前ラウンドまでに修正した内容を列挙
3. **設計上の事実** — 意図的な設計判断（「これは仕様」と分かっているもの）
4. **FP レジストリの内容** — `cat "$REVIEW_DIR/fp-registry.md"` で読み込んでプロンプトに展開
5. **報告フォーマット** — 問題がなければ「LGTM」。問題がある場合のみ `[ISSUE] ファイル:行 / 確信度 / 問題 / 修正案` の形式
6. **（#6/#7 のみ）外部ツールパス** — `CODE_SENTINEL_ROOT` / `sprawlens` CLI のパスを明記すること

### 確信度フィルタ

スペシャリストには「**確信度 80% 以上の問題のみ報告**」を明示する。これにより低品質な指摘のノイズを減らす。

## ステップ 3: 結果を収集し FP レジストリと照合する

各スペシャリストの結果が返ったら:

1. **LGTM のみ** → そのロールは次ラウンド不要（ただし Fresh Eyes は毎ラウンド実行）
2. **指摘あり** → FP レジストリと照合する

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

- **真の問題** → コードを修正し、テストを実行して通過を確認する
- **新しい偽陽性** → レジストリに追記する（フォーマットは `references/fp-registry-format.md` 参照）

偽陽性の判定基準:
- 設計上の意図が反映されていない（ドキュメント化された仕様と矛盾する）
- コードの別の箇所に保護が存在する（多層防御で補完されている）
- ライブラリやフレームワークの保証に依存している

## ステップ 5: 継続判定（確認なし）

ユーザーへの確認は一切行わず、即座に次のアクションへ移る。

**最大ラウンド数: 10**（デフォルト）。10ラウンドを超えても指摘が残る場合は、現在の状況をユーザーに報告してサイクルを停止する。

```
真の指摘が 1 件以上あった → テスト実行 → ステップ 2 へ（次ラウンド、確認なし）
全スペシャリストが LGTM   → ステップ 6 へ
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
```

## 設計原則

### なぜ Checker エージェントは不要か

Checker（偽陽性チェッカー）は「偽陽性が私に到達してから止める」リアクティブな仕組み。
FP レジストリは「偽陽性が上がってくる前に止める」プロアクティブな仕組みであり、根本的に優れている。

- **既知 FP** → レジストリが防ぐ（Checker 不要）
- **未知 FP** → Checker も Specialist と同じコードを読んで同じ誤りをしうる（効果薄い）
- **真のバグ** → Specialist が正しく報告（Checker は単なるラグ）

### なぜ 7 名か

5名（#1〜#5）はコード読解ベースの専門分化。#6/#7 は外部ツール駆動の観点を追加する。
- **#6 Quality+Security**: コード読解ベースの #1 Security と異なり、静的解析ルールを機械的に適用する。3票検証で偽陽性を事前除去するため FP レジストリへの昇格が少ない
- **#7 Structure**: 差分レビューでは見えない大域的な構造劣化を捉える唯一のロール。Blocking 閾値を超えた場合のみ修正ループに乗せることでノイズを抑制する
- Fresh Eyes を 2〜3 名にする方が ROI が高い（盲点の発見に有効）

### FP レジストリの寿命

サイクル開始時に作成し、サイクル完了時に削除する。プロジェクトを汚染しない。
同じ誤判定が次のサイクルで再発する場合は、「設計上の事実」として「修正済み事項」または CLAUDE.md に昇格させることを検討する。

## 追加リソース

- **`references/specialist-roles.md`** — 5 ロールのフォーカスエリアとプロンプトテンプレート
- **`references/fp-registry-format.md`** — FP レジストリのエントリフォーマットと照合ルール
