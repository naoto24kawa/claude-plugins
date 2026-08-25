# product-design-lens 検証記録

## 自動検証（rubric #1〜#5・#7）

**実行日**: 2026-08-25

```text
=== #1 行数上限 ===
     124 skills/product-design-lens/SKILL.md
=== #2 参照が1階層 ===
       0
OK  references/correction-log-format.md
OK  references/lens-catalog.md
OK  references/progress-state.md
=== #3 frontmatter ===
1
1
=== #4 同期バイト一致 ===
PASS
PASS
=== #5 相互参照 ===
4
5
=== #7 非退行 ===
7
1
1
2
```

判定:

- #1: 124行で500行以下。
- #2: references配下のサブディレクトリは0件。参照先3ファイルはすべて `OK` で、`DANGLING` は0件。
- #3: `name` と `description` は各1件。
- #4: `product-design-lens` と `lens-review-cycle` は、いずれも正本とプラグイン配布先が一致。
- #5: `lens-review-cycle` から `product-design-lens` は4件、逆方向は5件で、両方向とも1件以上。
- #7: ロール構成表は7行。`最大ラウンド数: 3` は1件、`サブエージェント 1 名` は1件、`並列起動はしない` は2件で、変更前の実測値と一致。

## lens-review-cycle の非退行検証

Task 3 完了時点の `e48dbe9` を比較元として、変更範囲を確認した。

```text
 skills/lens-review-cycle/SKILL.md                       | 13 ++++++++++++-
 skills/lens-review-cycle/references/ambiguity-hunter.md | 16 ++++++++++++++++
 2 files changed, 28 insertions(+), 1 deletion(-)
```

`git diff -U0 e48dbe9 -- skills/lens-review-cycle/SKILL.md` の変更箇所は、計画どおり frontmatter `description`、冒頭の「このスキルを使わない場合」、完了レポートの「判断レンズへの差し戻し」の3箇所だった。`実行モデル`、FPレジストリ、durable-state、最大ラウンド数、ロール構成表には変更が無い。

変更前のdescription行が1024 code pointsだったため、司令塔の裁定に従い、トリガー列挙と実行契約を保持する意味保存圧縮を行った。圧縮後の行全体は802 code pointsで、機械検査の結果は次のとおりだった。

```text
description-line-codepoints=802
OK  "レンズレビュー"
OK  "lens review cycle"
OK  "専門家レビュー"
OK  "expert review cycle"
OK  "5人の専門家にレビューしてもらおう"
OK  "指摘が0になるまでレビュー"
OK  "レビューサイクルを回す"
OK  "繰り返しレビュー"
OK  "parallel review cycle"
OK  "専門家並行レビュー"
OK  "仕様の曖昧さをチェック"
OK  "ルールの曖昧さ"
OK  "未明文化を洗い出す"
OK  "ambiguity check"
OK  "overfit チェック"
OK  "過剰実装チェック"
OK  "altitude check"
OK  multiple autonomous review rounds
OK  without between-round confirmation
OK  One reviewer applies 5 lenses sequentially
OK  parallel agents only when the user explicitly asks
OK  For prose targets
OK  Ambiguity Hunter
OK  Altitude Checker
OK  product-design-lens
```

圧縮でdescriptionから除いたのは、`underspecification` と `detail-level overfit` の例示括弧、ならびに同じ実行契約を冗長に表していた語句である。各レンズの詳細は本文とreferencesに残り、複数ラウンド、ラウンド間確認なし、1名が5レンズを順次適用、並列はユーザー明示時のみ、文章仕様ではAmbiguity HunterとAltitude Checkerを追加する、という5つの実行契約はdescriptionにも残っている。

## 負の検査のpositive control

案件固有語の引用ブロック外漏れを検出する検査に対し、`lens-catalog.md` の末尾へ意図的に `案件のグッズを例に説明する。` を追加した。再実行した検査は引用記号 `>` の無い違反行を次のとおり検出した。

```text
220:案件のグッズを例に説明する。
```

違反行を削除して検査を再実行し、最終状態ではヒットした3行すべてが `> **実例（1案件からの観測）**:` で始まる引用行へ戻ったことを確認した。

## レビューサイクル

Sonnetのレビュアー1名が7レンズを順次適用し、最大3ラウンドの範囲で2ラウンド実施した。

| レンズ | R1 flag | R2 flag |
|---|---:|---:|
| Fresh Eyes | 1 | 0 |
| Security | 1 | 0 |
| Core Logic | 1 | 0 |
| Tests | 1 | 0 |
| Domain | 0 | 0 |
| Ambiguity Hunter | 1 | 0 |
| Altitude Checker | 0 | 0 |

R1のflag 5件をすべて修正し、R2で全レンズflag 0のクリーンラウンドを通過したため終了した。受容したflagと確定した偽陽性は無い。

Domainのoptional 1件として、`.claude-plugin/marketplace.json` のdev-tools説明文へ `product-design-lens` を列挙する案がR1・R2で継続した。明示要件と `CLAUDE.md` の整合性維持契約の対象外で、機能上の破綻も無いため、変更せずoptionalとして記録した。

## 手動検証（rubric #6: 発火実測）— 未実施

**実行者**: 司令塔（新セッションが必要なためworkerは実行できない）

**手順**: 新しいClaude Codeセッションを開き、次の2文をそれぞれ別セッションで入力して、起動されるスキルを確認する。

| 入力 | 期待して起動されるスキル |
|---|---|
| 「プロダクトの構想に設計レンズを通したい」 | product-design-lens |
| 「このPRのレビューサイクルを回して」 | lens-review-cycle |

**判定**: 両方向とも期待どおりならPASS。片方でも誤ったスキルが起動したら、そのスキルのdescriptionを調整して再実測する。

**この検証が本命である理由**: descriptionに棲み分けを書いても、実際にエージェントが正しく分岐するかは実測するまで分からない。名前が近いスキルを2つ並べるため、誤発火が起きるならここである。
