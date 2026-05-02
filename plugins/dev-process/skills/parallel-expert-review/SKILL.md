---
name: parallel-expert-review
description: This skill should be used when the user asks to "5人の専門家にレビューしてもらおう", "専門家並行レビュー", "parallel expert review", "expert review cycle", "指摘が0になるまでレビュー", "レビューサイクルを回す", "繰り返しレビュー", "keep reviewing until no issues", "iterative code review", "review this until it's clean", or wants to run multiple rounds of parallel specialist code review until all findings reach zero.
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep, Agent]
---

# Parallel Expert Review Cycle

5名の専門レビュアーを並行ディスパッチし、指摘が 0 件になるまでラウンドを繰り返すレビュー手法。
セッションスコープの偽陽性レジストリにより、同じ誤判定が繰り返しエスカレートされることを防ぐ。

## 概要

```
Round N
  ├─ Specialist #1 (Security)     → finding or LGTM
  ├─ Specialist #2 (Core Logic)   → finding or LGTM
  ├─ Specialist #3 (Tests)        → finding or LGTM
  ├─ Specialist #4 (Domain)       → finding or LGTM
  └─ Specialist #5 (Fresh Eyes)   → finding or LGTM
         ↓
  FP Registry 照合 → 既知FP は即棄却
         ↓
  真の指摘 → 修正 → テスト → 次ラウンドへ
         ↓
  全員 LGTM → 完了
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

各ラウンドで以下の5ロールをディスパッチする。プロジェクトの特性に応じて Domain ロールをカスタマイズすること。

| # | ロール | フォーカス |
|---|--------|-----------|
| 1 | Security | 注入・パストラバーサル・情報漏洩 |
| 2 | Core Logic | ビジネスロジック・データ整合性 |
| 3 | Tests | テスト隔離・カバレッジ・アサーション |
| 4 | Domain | CLI/API/DB など対象固有の品質 |
| 5 | Fresh Eyes | 先入観なしの総合チェック |

> **Fresh Eyes の注意**: Fresh Eyes には「修正済み事項」を渡さない。修正済みのはずの問題が再浮上する場合、修正が不完全な可能性があるためッピ🐙 FP レジストリは渡す（確認済みの偽陽性は除外する）。

ロール別のフォーカスエリアとプロンプトテンプレートは `references/specialist-roles.md` を参照。

### スペシャリストへ伝える必須情報

各スペシャリストのプロンプトに必ず含めること:

1. **レビュー対象ファイル一覧** — 絶対パスで指定
2. **修正済み事項** — 重複報告を防ぐため、前ラウンドまでに修正した内容を列挙
3. **設計上の事実** — 意図的な設計判断（「これは仕様」と分かっているもの）
4. **FP レジストリの内容** — `cat "$REVIEW_DIR/fp-registry.md"` で読み込んでプロンプトに展開
5. **報告フォーマット** — 問題がなければ「LGTM」。問題がある場合のみ `[ISSUE] ファイル:行 / 確信度 / 問題 / 修正案` の形式

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

## ステップ 5: 継続判定

```
全スペシャリストが LGTM → サイクル完了 → ステップ 6 へ
真の指摘が 1 件以上あった → テスト実行後 → ステップ 2 へ（次ラウンド）
```

ラウンド番号を R1, R2, R3 ... と管理し、どのラウンドで何を修正したかを追跡する。

## ステップ 6: クリーンアップ

サイクル完了後、一時ディレクトリを削除する。

```bash
rm -rf "$REVIEW_DIR"
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
