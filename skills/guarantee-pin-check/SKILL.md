---
name: guarantee-pin-check
description: 'Use when 保証台帳の pin 未確認（unpinned）な保証をまとめて潰すとき。保証を意図的に壊して裏付けテストが赤くなることを観測し、証跡を台帳へ記入する多主体の手順。トリガー: 「pin 確認」「unpinned を潰す」「保証が本当に守られているか確かめる」「mutation で台帳を検証する」。台帳そのものの書式・出自ルールは guarantee-ledger を使う。'
---

# Guarantee Pin Check — 保証の pin 確認

## ① 目的と前提

pin 確認とは、保証台帳に載っている保証を意図的に壊し、その保証を裏付けるはずのテストが赤くなることを観測する行為である。`guarantee-ledger` の `check-guarantees.sh` が数える `unpinned`（`pin確認` 欄が空の行）を潰す対象とする。

なぜ必要か:

> テストが緑であることを保証の証拠にしない。緑は「テストが何も検査していない」場合にも出る。壊して赤くなることだけが、そのテストが保証を守っている証拠になる。

出自:

> この手順は manako の 1 回のキャンペーン（2026-08-14、G-001〜G-006）の実施記録から復元したものであり、n=1 である。

台帳の書式・列の意味・出自ルールは `guarantee-ledger` を使う。本スキルは pin 確認の実施手順だけを持つ。

## ② 手順（Step A〜D）

| Step | 内容 |
|---|---|
| A | 裏付けテストを読まずに（test-blind）、保証文と実装だけから mutant を設計する。網羅性を主張する保証は条件ごとに mutant を分ける |
| B | mutant を適用し、裏付けテストが赤くなることを確認する。exit code と失敗したテスト名を記録する |
| C | mutant を復元し、`git diff` が空であることを確認する |
| D | 台帳の `pin確認` 欄へ `YYYY-MM-DD <壊し方の散文>` を記入する |

Step A が test-blind である理由: テストを先に読むと、テストが検査している条件をなぞった mutant しか思いつかなくなり、「テストが検出できない壊し方」を発見できなくなる。

## ③ 多主体の規律

> mutant の作者 ≠ 実装の作者。実装を書いた agent 以外の人間、または fresh context の独立 agent が実施する。

包含関係の罠:

> 実施順の設計時に、裏付け索引の包含関係を確認する。先行する保証の索引が後続保証の裏付けを含む場合、後続の Step A をテスト未読の別主体が代行する。
>
> 実例: manako の G-001 の索引 `api-key-auth.test.ts::apiKeyAuth middleware` は G-002 の個別テストを内包していた。G-001 を先に検証した worker は G-002 の Step A を test-blind に実施できなくなり、該当テスト未読の司令塔が Step A だけを代行した。ファイル名だけでなく `describe` / `it` の包含関係を確認する。

## ④ 部分的な空手形の扱い

> mutant の一部が緑のままだった場合、`pin確認` を空欄のまま残す。「一部は pin できた」を pin 済みとして記入しない。緑のままだった条件を Action へ積む。
>
> 実例: manako の G-005 は 4 つの mutant のうち free 上限と未知プラン fallback は赤になったが、pro / business の上限を 1 増やす mutant は緑のままだった。台帳の `pin確認` は空欄のままとし、`unpinned=1` として残した。

## ⑤ 委任と記録

- 委任は `delegation-spec` スキルに従う
- 実施記録に残すもの: 各 mutant の内容、mutant 数、実行したテスト、exit code、判定、復元確認の結果
- 記録は台帳と同じリポジトリの `.docs/plans/` へ残す（チャットへ揮発させない）
