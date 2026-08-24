# product-design-lens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** プロダクト設計レンズ19本をスキル `product-design-lens` として実装し、既存 `lens-review-cycle` と双方向の棲み分けを配線する。

**Architecture:** SKILL.md（実行モデル・フロー・裁定・終端条件）＋ references 3本（レンズカタログ・記録形式・進捗永続化）で構成する。既存 `lens-review-cycle` へは4点だけ手を入れ、実行モデル・FP レジストリ・収束条件・7レンズ構成には触れない。両スキルを `plugins/dev-tools/skills/` へ同期する。

**Tech Stack:** Markdown のみ。実行コードなし。検証は shell コマンド（`wc`・`diff`・`find`・`grep`）と、新セッションでのスキル発火実測。

**Spec:** `.docs/plans/product-design-lens-design.md`（同ディレクトリ・必ず併読すること）

## Global Constraints

spec と agent-toolkit `CLAUDE.md` から。すべてのタスクの要件に暗黙で含まれる。

- **SKILL.md は 500行以下**（agent-toolkit CLAUDE.md「スキルの構造規約」）
- **frontmatter 必須**: `name` / `description`。description はトリガーワードを含み、1024文字以内、三人称形式
- **外部参照は1階層まで**: `references/` の下にサブディレクトリを作らない。references 同士の参照は同一階層内なので可（既存 lens-review-cycle が8件行っている・実測済み）
- **エージェント固有の絶対パスを書かない**: `~/.claude/skills/` や `~/.codex/skills/` ではなく `~/.agents/skills/` を参照する
- **standards のルール本文を複製しない**: skill は絞り込み・判定・記録形式だけを持つ
- **`plugins/dev-tools/skills/` は直接編集しない**: `skills/` を正本とし `cp -R` で同期する
- **本文・コメントはすべて日本語**（技術用語・識別子は原語のまま）
- **既存 lens-review-cycle の非退行**: 実行モデル節・FP レジストリ・durable-state・収束条件（最大3ラウンド）・7レンズ構成に差分を出さない
- **standards リポジトリは変更しない**（spec §7 スコープ外）
- 作業ブランチは既存の worktree（`naoto24kawa/product-design-lens`）。**ブランチを切り直さない**

## ファイル構成

| ファイル | 責務 | 状態 |
|---|---|---|
| `skills/product-design-lens/SKILL.md` | 起動判定・実行フロー・裁定ルール・終端条件・完了レポート | 新規 |
| `skills/product-design-lens/references/lens-catalog.md` | 19レンズの問い・進め方・発動条件・実例 | 新規 |
| `skills/product-design-lens/references/correction-log-format.md` | corrections / not-doing / lens別 findings の形式 | 新規 |
| `skills/product-design-lens/references/progress-state.md` | progress.md の構造・再開判定 | 新規 |
| `skills/lens-review-cycle/SKILL.md` | description・冒頭節・完了レポートの3箇所を調整 | 変更 |
| `skills/lens-review-cycle/references/ambiguity-hunter.md` | 逆流ルールを追加 | 変更 |
| `plugins/dev-tools/skills/product-design-lens/` | 同期コピー | 新規 |
| `plugins/dev-tools/skills/lens-review-cycle/` | 同期コピー（再同期） | 変更 |
| `README.md` | スキル一覧へ追記 | 変更 |
| `CLAUDE.md` | 「整合性の維持対象」表へ同期対象を追記 | 変更 |

---

### Task 1: レンズカタログ（19本の正本）

先に作る。SKILL.md がこのファイルを参照するため、レンズ ID と名称がここで確定する。

**Files:**
- Create: `skills/product-design-lens/references/lens-catalog.md`
- Read: `.docs/plans/product-design-lens-design.md` §3.1・§3.2
- Read: `~/Downloads/プロダクト設計レンズ集.md`（レンズの問いと実例の出典）

**Interfaces:**
- Produces: レンズ ID（`A-1`〜`A-4` / `B-1`〜`B-5` / `C-1` `C-2` / `D-1`〜`D-8`）と各レンズの見出し文字列。Task 2・Task 3 がこの ID を参照する。
- Produces: 常設12本と条件付き7本の区分。Task 3 の終端条件がこの区分に依存する。

- [ ] **Step 1: 出典を読む**

`~/Downloads/プロダクト設計レンズ集.md` を全文読む。各レンズの「問い」「本文の指針」「> 効果:」ブロックを抽出する。

- [ ] **Step 2: `references/lens-catalog.md` を書く**

構成:

```markdown
# レンズカタログ

全19レンズ。常設12本は必ず通す。条件付き7本は発動条件を判定し、非該当なら理由つきで記録する。

## 常設レンズ（12本）

### A-1 機能要件

**問い**: 何ができて、何ができないか。

**進め方**: 境界を先に引く。「できないこと」を明示的に列挙する。できないことの集合が、そのまま不正対策・法務対策を兼ねることがある。

**この観点で出るもの**: 機能の境界、明示的な非対応、非対応が副次的に解決している問題

> **実例（1案件からの観測）**: 現地グッズ交換支援ツールでは「金銭を扱わない」という1つの判断が、転売対策・法務・責任の所在の3つを同時に解決していた。できないことを列挙して初めてこの繋がりが見えた。

（A-2〜C-2 の残り11本も同じ4ブロック構成で記述する。各レンズの「問い」「進め方」は出典 `~/Downloads/プロダクト設計レンズ集.md` の同 ID の節から書き起こす。出典の `> **効果**:` ブロックが実例ブロックの元になる。出典に実例が無いレンズは実例ブロックを省略してよい——無い実例を創作しない）

## 条件付きレンズ（7本）

### D-1 セキュリティ（攻撃者のレンズ）

**問い**: 悪意ある人間が、技術的にどう壊すか。

**発動条件**: ①アカウントを持つ ②ユーザー間で何かをやり取りする ③金銭または金銭的価値のあるものを扱う — **1つでも該当したら必須**

**通さないと**: 公開後に脆弱性が見つかり、信頼の回復に機能追加の何倍もかかる

**進め方**: 不正利用（A-2 で扱う「人の悪用」）とは別物として扱う。認証の迂回、データの盗み見、なりすまし、DoS、他人の操作の代行など、コードとプロトコルの穴を見る。

（D-2・D-4〜D-8 の残り6本も同じ4ブロック構成で記述する。発動条件は出典の各レンズの表「発動条件」行、「通さないと」は同表の「通さないと」行をそのまま使う。**D-3 計測はここに置かない**——常設へ昇格させたため）

## 通す順番

（spec §3.2 の擬似コードと根拠3点をそのまま転記する）
```

**必須の規律:**
- 実例は必ず `> **実例（1案件からの観測）**:` の引用ブロックに入れ、本文と混ぜない。ラベルを外すと一回性の一般化になる
- 常設レンズには「発動条件」ブロックを書かない（常設であることが自明でなくなるため）
- 条件付きレンズには必ず「発動条件」と「通さないと」を書く
- D-3 計測は**常設**に置く。元文書で D 層にあるのは当該案件で未実施だった履歴によるものであり、元文書自身が発動条件を「常に必要」と書いている

- [ ] **Step 3: レンズ数を検証する**

```bash
cd skills/product-design-lens
grep -cE '^### [ABCD]-[0-9]+ ' references/lens-catalog.md
```
Expected: `19`

```bash
awk '/^## 常設レンズ/,/^## 条件付きレンズ/' references/lens-catalog.md | grep -cE '^### [ABCD]-[0-9]+ '
```
Expected: `12`

- [ ] **Step 4: 実例ラベルの検証**

```bash
grep -c '実例（1案件からの観測）' references/lens-catalog.md
```
Expected: 1以上（実例を書いたレンズの数と一致すること）

```bash
grep -nE 'グッズ|交換会|三角トレード' references/lens-catalog.md | grep -v '実例（1案件からの観測）' | grep -v '^\s*>' 
```
Expected: 出力なし（案件固有語が実例ブロックの外に漏れていないこと）

- [ ] **Step 5: サブディレクトリを作っていないことを確認**

```bash
find skills/product-design-lens/references -mindepth 1 -type d | wc -l
```
Expected: `0`

- [ ] **Step 6: Commit**

```bash
git add skills/product-design-lens/references/lens-catalog.md
git commit -m "feat(product-design-lens): レンズカタログ19本を追加する"
```

---

### Task 2: 記録形式と進捗永続化の references

**Files:**
- Create: `skills/product-design-lens/references/correction-log-format.md`
- Create: `skills/product-design-lens/references/progress-state.md`
- Read: `.docs/plans/product-design-lens-design.md` §3.3・§3.5・§3.6
- Reference: `skills/lens-review-cycle/references/durable-state.md`（再開判定の書き方の参考。**内容を複製しない**）

**Interfaces:**
- Consumes: Task 1 のレンズ ID
- Produces: `progress.md` / `corrections.md` / `not-doing.md` / `lens/<id>.md` の各フォーマット。Task 3 の SKILL.md がこれらを参照する。
- Produces: 再開判定の手順名（SKILL.md の起動時判定が参照する）

- [ ] **Step 1: `references/correction-log-format.md` を書く**

3ファイルの形式を定める。

`corrections.md` のエントリ形式:

```markdown
### C-001 グッズマスタの価値

- **元の判断**: 参入障壁の本体。永続マスタへ投資する
- **訂正後**: 腐る。投資を絞る
- **どのレンズで**: B-3 競合 / B-5 時間軸
- **理由**: 既存プレイヤーが同等のマスタを既に持っており、鮮度でも勝てない
- **前提を変えたレンズ**: A-1（機能要件のスコープが変わる）
- **裁定日**: 2026-08-25
```

**規律**: 元の判断は消さない。訂正は追記であり上書きではない。`前提を変えたレンズ` は人間が指定した値だけを書き、エージェントが推測して埋めない（空欄可）。

`not-doing.md` のエントリ形式:

```markdown
### N-001 三角トレードの正式サポート

- **やらないと決めたこと**: 3者以上の循環マッチングを正式スコープに含めない
- **理由**: 12種級の規模ではシミュレーション上の効果が小さい
- **どのレンズで**: B-1 失敗
- **再検討トリガー**: 1イベントあたりの取扱種別が30を超えたら
- **裁定日**: 2026-08-25
```

**規律**: `再検討トリガー` は必須。空にできない。「いつか」「余裕ができたら」のような時期の明示されない語は不可——観測可能な事象か数値で書く。

`lens/<id>.md` の形式:

```markdown
# B-1 失敗（プレモータム）

**通過日**: 2026-08-25
**結果**: 訂正2件 / 未定義3件 / 却下1件

## 出たもの

### 訂正候補
1. ...（裁定: 採用 → C-001）

### 未定義
1. ...

## 出なかったこと

（このレンズで何も出なかった場合も「出なかった」と記録する。それ自体が情報——そこは問題がないか、問いが対象に合っていない）
```

- [ ] **Step 2: `references/progress-state.md` を書く**

`progress.md` の構造と再開判定を定める。

```markdown
# progress.md の構造と再開判定

## 保存先

`<対象リポジトリのルート>/.docs/product-lens/<product-name>/progress.md`

`<product-name>` は kebab-case。起動時に確定させ、以降変更しない（変更するとディレクトリが分裂する）。

## 構造

```markdown
# <プロダクト名> レンズ通過記録

**対象文書**: <パス、または「なし（対話で構想を引き出した）」>
**開始日**: YYYY-MM-DD
**最終更新**: YYYY-MM-DD

## 通すレンズ集合（起動時に確定）

| ID | レンズ | 区分 | 状態 |
|---|---|---|---|
| A-1 | 機能要件 | 常設 | 通過（YYYY-MM-DD） |
| D-1 | セキュリティ | 条件付き・該当（②ユーザー間でやり取りする） | 未通過 |
| D-8 | チーム | 条件付き・非該当（1人開発） | — |

## 再通過候補

| レンズ | 積んだ理由 | 由来の訂正 |
|---|---|---|
| A-1 | スコープが変わった | C-001 |

## 未裁定の訂正候補

（0件になることが終端条件の一部。1件でも残っていたら完了しない）
```

## 再開判定

`progress.md` が存在する場合:

1. `通すレンズ集合` の表を読む
2. 状態が「通過」でないレンズのうち、通す順番（`lens-catalog.md`）で最も早いものから再開する
3. `未裁定の訂正候補` に残りがあれば、レンズを進める前にその裁定から行う
4. 対象文書のパスが記録と食い違う場合は、**再開せず人間に確認する**（別プロダクトの記録へ追記する事故を防ぐ）

`progress.md` が無い場合は新規開始する。既存ディレクトリがあるのに `progress.md` だけ無い場合は、残骸の可能性があるため人間に確認する。
```

- [ ] **Step 3: 形式の自己検証**

```bash
cd skills/product-design-lens
grep -c '再検討トリガー' references/correction-log-format.md
```
Expected: 2以上（形式定義と規律の両方に登場すること）

```bash
find references -mindepth 1 -type d | wc -l
```
Expected: `0`

- [ ] **Step 4: Commit**

```bash
git add skills/product-design-lens/references/correction-log-format.md skills/product-design-lens/references/progress-state.md
git commit -m "feat(product-design-lens): 記録形式と進捗永続化の references を追加する"
```

---

### Task 3: SKILL.md（product-design-lens 本体）

**Files:**
- Create: `skills/product-design-lens/SKILL.md`
- Read: `.docs/plans/product-design-lens-design.md` §2〜§3 全体
- Reference: `skills/lens-review-cycle/SKILL.md`（構成の型。**内容を複製しない**）

**Interfaces:**
- Consumes: Task 1 のレンズ ID と常設／条件付きの区分、Task 2 の記録形式と再開判定
- Produces: スキル名 `product-design-lens`、description のトリガーワード群。Task 4 の lens-review-cycle 側がこのスキル名を参照する。

- [ ] **Step 1: frontmatter を書く**

```yaml
---
name: product-design-lens
description: 'This skill should be used when the user asks to "プロダクト設計のレンズを通す", "product design lens", "設計レンズ", "プロダクト構想をレビューする", "要件定義に外側の視点を入れる", "プレモータム", "この判断で合っているか確かめたい", "競合から見て勝てるか", "撤退基準を決める" — to run product-design lenses one at a time over a product concept so that decisions get corrected before implementation. Applies 12 standing lenses plus up to 7 conditional lenses whose activation conditions are evaluated at start. This skill is interactive: the human adjudicates each correction (採用 / 却下 / 保留). For detecting defects in an already-written artifact (code, specs, PRs) — ambiguity, contradiction, overfit, dangling references — use lens-review-cycle instead; that skill runs autonomously until flag count reaches zero. 判断の妥当性を外側から問うのがこのスキル、記述の健全性を内側で検査するのが lens-review-cycle。'
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep]
---
```

**規律**: description に「lens-review-cycle との棲み分け」を必ず含める。名前が近い2スキルが並ぶため、description がトリガー判定の分岐点になる。

- [ ] **Step 2: 本文を書く**

節構成:

```markdown
# Product Design Lens

プロダクトの構想・要件定義に対して、設計レンズを1本ずつ順に当て、**判断を訂正する機会を強制的に作る**手法。

内側からの検討では、一度書いた判断は補強される方向にしか動かない。自分が書いた根拠を自分で読み返しているだけだからである。レンズを変えると判断が下方修正される。このスキルの価値は網羅性ではなく、訂正の機会そのものにある。

## このスキルを使わない場合

**既に書かれた成果物の欠陥検出には使わない。** 曖昧さ・矛盾・過剰実装・宙吊り参照といった「記述が内部的に破綻していないか」を検査するのは `lens-review-cycle` である。

| | このスキル | lens-review-cycle |
|---|---|---|
| 問い | この判断は外の世界に照らして正しいか | この記述は内部的に破綻していないか |
| 成果 | 判断を書き換える | 記述を直す |
| 実行 | 対話（訂正の採否は人間が裁定） | 自律（ラウンド間の確認なし） |
| 終端 | 全レンズ通過＋未裁定0 | flag 0 |

順番がある——**判断を確定させてから（このスキル）、記述を締める（lens-review-cycle）**。

## 実行モデル

この節が実行形態の正本である。

- **このスキルは対話で実行する。** 訂正の採否を判定する客観基準が存在しないため（flag 0 に相当する終端が無い）、裁定は人間が行う。レンズごとに必ず人間へ返す。
- **サブエージェントを起動しない。** レンズを当てるのはこのセッション自身。裁定のたびに人間へ返るため、サブエージェントへ委譲する意味がない。
- 人間への提示は通常の応答で行う。選択肢提示ツール（Claude Code の `AskUserQuestion` 等）がある環境では使ってよいが、**無い環境でも同じ手順が成立するように書く**——このスキルは skills CLI 経由で Codex 等へも配布されるため、特定エージェント固有のツールを前提にしない。訂正候補の内容は必ず本文で示し、ツールは裁定（採用 / 却下 / 保留）の選択にだけ使う。

## ステップ1: 起動時の判定

（spec §3.3 の3項目の表をここに置く）

## ステップ2: 通すレンズ集合を確定する

条件付き7レンズの発動条件を判定する（発動条件は `references/lens-catalog.md`）。判定は人間に確認する——エージェントが単独で「非該当」と決めない。
確定した集合を `progress.md` へ記録する。**非該当も理由つきで記録する**（記録しないと「通し忘れ」と「該当なし」が区別できない）。

## ステップ3: レンズを1本ずつ当てる

`references/lens-catalog.md` の「通す順番」に従い、1本ずつ当てる。**複数のレンズをまとめて当てない**——裁定が積み上がると、後段のレンズが誤った前提の上で動く。

各レンズで:

1. そのレンズの問いで対象を検討する
2. 出たものを2分類して人間へ提示する
   - **訂正候補**: 既存の判断を覆すもの。「元の判断 → 訂正後 → なぜ」の形で示す
   - **未定義**: 穴・未決事項。判断が存在しないので訂正ではない
3. 訂正候補ごとに人間の裁定を得る（採用 / 却下 / 保留）
4. 裁定を記録する（形式は `references/correction-log-format.md`）
   - 採用 → `corrections.md` へ追記。**元の判断は消さない**
   - 却下 → `lens/<id>.md` へ却下理由つきで記録
   - 保留 → `not-doing.md` へ**再検討トリガーつき**で記録。トリガーが無い保留は受け付けない
5. `lens/<id>.md` へそのレンズの結果を書く。**何も出なかった場合も「出なかった」と記録する**——それ自体が情報（そこは問題がないか、問いが対象に合っていない）
6. `progress.md` の当該レンズを「通過」にする

## ステップ4: 再通過判定

採用された訂正が、既に通過したレンズの**前提**（そのレンズで確定させた判断）を変える場合、そのレンズを `progress.md` の「再通過候補」へ積む。

**どのレンズの前提を変えたかは人間が指定する。エージェントが推測しない。** 指定が無ければ空欄のままにする。

積んだだけでは再通過しない。全レンズを一巡した後に候補をまとめて提示し、通すかどうかを人間が決める。

## ステップ5: 終端判定と完了レポート

終端条件（3つすべてを満たすこと）:

```
常設12レンズが通過
  ＋ 条件付き7レンズが「通過」または「非該当（理由つき）」
  ＋ 未裁定の訂正候補が0（保留は再検討トリガーつきで裁定済み扱い）
```

満たさない場合は完了と報告しない。`progress.md` の未通過レンズと未裁定件数を示して継続する。

完了レポートの形式:

```
## レンズ通過完了

**対象**: <プロダクト名>
**通したレンズ**: 常設12 / 条件付きN（非該当M・理由は progress.md）

### 訂正（採用）

| ID | 元の判断 | 訂正後 | どのレンズで |
|---|---|---|---|

### やらないと決めたこと

| ID | 内容 | 再検討トリガー |
|---|---|---|

### 何も出なかったレンズ

（レンズ ID を列挙。問いが対象に合っていない可能性の指摘があれば添える）

### 記録先

`.docs/product-lens/<product-name>/`

---
判断が確定したので、この設計文書の記述を締めるなら lens-review-cycle を使う。
```

## 追加リソース

- `references/lens-catalog.md` — 19レンズの問い・進め方・発動条件・通す順番
- `references/correction-log-format.md` — corrections / not-doing / lens別 findings の形式
- `references/progress-state.md` — progress.md の構造と再開判定
```


- [ ] **Step 3: 行数上限を検証する**

```bash
wc -l skills/product-design-lens/SKILL.md
```
Expected: 500以下

- [ ] **Step 4: frontmatter を検証する**

```bash
head -1 skills/product-design-lens/SKILL.md
grep -c '^name: product-design-lens$' skills/product-design-lens/SKILL.md
grep -c '^description:' skills/product-design-lens/SKILL.md
```
Expected: 1行目が `---`、name が1件、description が1件

- [ ] **Step 5: 参照先が実在することを検証する**

```bash
cd skills/product-design-lens
for f in $(grep -ohE 'references/[a-z-]+\.md' SKILL.md | sort -u); do
  test -f "$f" && echo "OK  $f" || echo "DANGLING  $f"
done
```
Expected: すべて `OK`、`DANGLING` が0件

- [ ] **Step 6: 禁止パスが混入していないことを検証する**

```bash
grep -nE '~/\.claude/skills|~/\.codex/skills' skills/product-design-lens/SKILL.md skills/product-design-lens/references/*.md
```
Expected: 出力なし

- [ ] **Step 7: Commit**

```bash
git add skills/product-design-lens/SKILL.md
git commit -m "feat(product-design-lens): SKILL.md を追加する"
```

---

### Task 4: lens-review-cycle 側の4点調整

**Files:**
- Modify: `skills/lens-review-cycle/SKILL.md`（3箇所）
- Modify: `skills/lens-review-cycle/references/ambiguity-hunter.md`（1箇所）
- Read: `.docs/plans/product-design-lens-design.md` §4

**Interfaces:**
- Consumes: Task 3 が確定させたスキル名 `product-design-lens`
- Produces: 双方向の相互参照。Task 6 の rubric #5 がこれを検査する。

- [ ] **Step 1: 変更前の状態を記録する（非退行の基準）**

```bash
cd skills/lens-review-cycle
wc -l SKILL.md references/ambiguity-hunter.md
git rev-parse HEAD
```
記録した行数を控える。Step 6 の非退行チェックで使う。

- [ ] **Step 2: `description` に棲み分け1文を追加する**

`SKILL.md` の frontmatter `description` の末尾（閉じクォートの直前）へ次を追記する:

```
プロダクト構想段階で「その判断自体が正しいか」を外側から問い直す場合は、このスキルではなく product-design-lens を使う。
```

**規律**: description 全体で1024文字以内を保つ。超える場合は既存のトリガーワード列挙を削らず、追記文を短縮する。

- [ ] **Step 3: 冒頭へ「このスキルを使わない場合」節を追加する**

`# Lens Review Cycle` の導入段落の直後、`## 実行モデル` の直前へ挿入する:

```markdown
## このスキルを使わない場合

**まだ確定していない判断を訂正する用途には使わない。** 競合・法令・時間軸・失敗シナリオといった「文書の外」に照らして判断そのものを書き換えるのは `product-design-lens` である。このスキルは「文書の中」を見て記述の破綻を直す。

判断を確定させてから（product-design-lens）、記述を締める（このスキル）という順番になる。
```

- [ ] **Step 4: `references/ambiguity-hunter.md` へ逆流ルールを追加する**

ファイル末尾へ追記する:

```markdown
## 逆流: 判断の未検証を明文化させない

findings が「そもそもこの判断の根拠が無い」型だった場合、それは記述の曖昧さではなく**判断の未検証**である。明文化を求めず、`product-design-lens` への差し戻しとして報告する。

逆流経路が無い場合、次の失敗が起きる:

```
「根拠を明文化せよ」と指摘
  → もっともらしい根拠が後付けで書かれる
  → 誤った判断が「根拠つき」に格上げされて固定される
```

**判定の目安**: 明文化すれば解ける（暗黙の基準・未定義の境界・閾値の欠落）なら通常の finding。**何を書けば正しいかを決めるために文書の外を見る必要がある**なら差し戻し。

差し戻しは flag として報告し、修正案の欄に「product-design-lens の該当レンズで裁定が必要」と書く。オーケストレータはこれを修正せず、完了レポートへ持ち越す。
```

- [ ] **Step 5: ステップ6 完了レポートへ1行追加する**

`SKILL.md` の「完了レポートのフォーマット」のコードブロック内、`### optional 指摘（終了条件外）` の後ろへ追記する:

```
### 判断レンズへの差し戻し

{N}件（0件なら「なし」）
{1件以上ある場合のみ}: 判断の未検証が残っている。product-design-lens で裁定すること。
```

- [ ] **Step 6: 非退行を検証する**

```bash
cd skills/lens-review-cycle
git diff --stat
```
Expected: `SKILL.md` と `references/ambiguity-hunter.md` の2ファイルのみ変更

```bash
git diff -U0 SKILL.md | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)'
```
Expected: 変更行が Step 2・3・5 の3箇所のみ。次のいずれかに触れていたら**やり直す**——「実行モデル」節、FP レジストリ、durable-state、最大ラウンド数、ロール構成表の7行。

```bash
grep -nE '最大ラウンド数: 3|サブエージェント 1 名|並列起動はしない' SKILL.md
```
Expected: 変更前と同じ内容で存在すること（収束条件と実行モデルが無傷）

```bash
grep -cE '^\| [1-7] \|' SKILL.md
```
Expected: `7`（ロール構成表が7行のまま）

- [ ] **Step 7: 相互参照が両方向で実在することを検証する**

```bash
cd skills
grep -l 'product-design-lens' lens-review-cycle/SKILL.md lens-review-cycle/references/ambiguity-hunter.md
grep -l 'lens-review-cycle' product-design-lens/SKILL.md
test -d product-design-lens && test -d lens-review-cycle && echo "両スキルが実在"
```
Expected: 3ファイルすべてがヒットし、「両スキルが実在」が出力される

- [ ] **Step 8: Commit**

```bash
git add skills/lens-review-cycle/SKILL.md skills/lens-review-cycle/references/ambiguity-hunter.md
git commit -m "feat(lens-review-cycle): product-design-lens との棲み分けと逆流ルールを配線する"
```

---

### Task 5: 配布同期と索引の整合

**Files:**
- Create: `plugins/dev-tools/skills/product-design-lens/`（`cp -R` の結果）
- Modify: `plugins/dev-tools/skills/lens-review-cycle/`（再同期）
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Modify: `plugins/dev-tools/.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`

**Interfaces:**
- Consumes: Task 1〜4 の全成果物
- Produces: 同期済みの配布物。Task 6 の rubric #4 がバイト一致を検査する。

- [ ] **Step 1: 同期コピーを実行する**

```bash
cd <リポジトリルート>
cp -R skills/product-design-lens/ plugins/dev-tools/skills/product-design-lens/
cp -R skills/lens-review-cycle/ plugins/dev-tools/skills/lens-review-cycle/
```

- [ ] **Step 2: バイト一致を検証する**

```bash
diff -r skills/product-design-lens plugins/dev-tools/skills/product-design-lens && echo "product-design-lens: 一致"
diff -r skills/lens-review-cycle plugins/dev-tools/skills/lens-review-cycle && echo "lens-review-cycle: 一致"
```
Expected: 両方とも差分なしで「一致」が出力される

- [ ] **Step 3: `README.md` のスキル一覧へ追記する**

既存の `lens-review-cycle` の行を探し、同じ書式で `product-design-lens` の行を追加する。1行説明には棲み分けが分かる語を入れる（例: 「プロダクト構想へ設計レンズを順に当て、判断を訂正する（成果物の欠陥検出は lens-review-cycle）」）。

書式を実測してから合わせること:

```bash
grep -n 'lens-review-cycle' README.md
```

- [ ] **Step 4: `CLAUDE.md` の「整合性の維持対象」表へ追記する**

既存の行:

```
| skills/lens-review-cycle | plugins/dev-tools/skills/lens-review-cycle（同期コピー） |
```

の直後へ追加する:

```
| skills/product-design-lens | plugins/dev-tools/skills/product-design-lens（同期コピー） |
```

あわせて「編集ルール > skills/ 変更時」の項3に `product-design-lens` も同期対象であることを追記する。

- [ ] **Step 5: プラグインの version をインクリメントする**

スキル追加のため、2ファイルを**同じ値**にする。現在値を実測してから決めること:

```bash
grep -n '"version"' plugins/dev-tools/.claude-plugin/plugin.json
grep -n -A3 'dev-tools' .claude-plugin/marketplace.json | grep version
```

minor を1つ上げる（スキル追加のため）。両ファイルが同値であることを検証する:

```bash
diff <(grep -oE '"version": "[0-9.]+"' plugins/dev-tools/.claude-plugin/plugin.json) \
     <(grep -A5 '"name": "dev-tools"' .claude-plugin/marketplace.json | grep -oE '"version": "[0-9.]+"') \
  && echo "version 一致"
```
Expected: 「version 一致」

- [ ] **Step 6: Commit**

```bash
git add plugins/ README.md CLAUDE.md .claude-plugin/marketplace.json
git commit -m "chore(dev-tools): product-design-lens を配布へ同期し索引を整合させる"
```

---

### Task 6: 検証 rubric の実行と記録

**Files:**
- Create: `.docs/reviews/product-design-lens-verification.md`
- Read: `.docs/plans/product-design-lens-design.md` §6

**Interfaces:**
- Consumes: Task 1〜5 の全成果物

- [ ] **Step 1: rubric #1〜#5・#7 を実行して結果を記録する**

```bash
cd <リポジトリルート>
echo "=== #1 行数上限 ==="
wc -l skills/product-design-lens/SKILL.md

echo "=== #2 参照が1階層 ==="
find skills/product-design-lens/references -mindepth 1 -type d | wc -l
for f in $(grep -rhoE 'references/[a-z-]+\.md' skills/product-design-lens/ | sort -u); do
  test -f "skills/product-design-lens/$f" && echo "OK  $f" || echo "DANGLING  $f"
done

echo "=== #3 frontmatter ==="
grep -c '^name: product-design-lens$' skills/product-design-lens/SKILL.md
grep -c '^description:' skills/product-design-lens/SKILL.md

echo "=== #4 同期バイト一致 ==="
diff -r skills/product-design-lens plugins/dev-tools/skills/product-design-lens && echo "PASS"
diff -r skills/lens-review-cycle plugins/dev-tools/skills/lens-review-cycle && echo "PASS"

echo "=== #5 相互参照 ==="
grep -c 'product-design-lens' skills/lens-review-cycle/SKILL.md
grep -c 'lens-review-cycle' skills/product-design-lens/SKILL.md

echo "=== #7 非退行 ==="
grep -cE '^\| [1-7] \|' skills/lens-review-cycle/SKILL.md
grep -c '最大ラウンド数: 3' skills/lens-review-cycle/SKILL.md
```

Expected: #1 が500以下、#2 が `0` かつ DANGLING 0件、#3 が両方 `1`、#4 が両方 PASS、#5 が両方1以上、#7 が `7` と `1`

**いずれか1つでも期待値を外したら、そのタスクへ戻って修正する。** rubric を成果物に合わせて緩めない。

- [ ] **Step 2: rubric #6（発火実測）の手順書を書く**

このステップは worker が実行できない（新セッションが必要）。手順を記録し、司令塔へ引き渡す。

`.docs/reviews/product-design-lens-verification.md` へ:

```markdown
# product-design-lens 検証記録

## 自動検証（rubric #1〜#5・#7）

（Step 1 の出力を貼る。実行日を明記する）

## 手動検証（rubric #6: 発火実測）— 未実施

**実行者**: 司令塔（新セッションが必要なため worker は実行できない）

**手順**: 新しい Claude Code セッションを開き、次の2文をそれぞれ別セッションで入力して、起動されるスキルを確認する。

| 入力 | 期待して起動されるスキル |
|---|---|
| 「プロダクトの構想に設計レンズを通したい」 | product-design-lens |
| 「この PR のレビューサイクルを回して」 | lens-review-cycle |

**判定**: 両方向とも期待どおりなら PASS。片方でも誤ったスキルが起動したら、そのスキルの description を調整して再実測する。

**この検証が本命である理由**: description に棲み分けを書いても、実際にエージェントが正しく分岐するかは実測するまで分からない。名前が近いスキルを2つ並べるため、誤発火が起きるならここである。
```

- [ ] **Step 3: Commit**

```bash
git add .docs/reviews/product-design-lens-verification.md
git commit -m "docs(reviews): product-design-lens の検証記録を追加する"
```

---

## 完了後（worker のスコープ外・司令塔が実施）

1. rubric #6（発火実測）を新セッションで実行し、検証記録へ結果を追記する
2. `lens-review-cycle` を成果物へ適用する（対象が文章仕様のため #6 Ambiguity Hunter・#7 Altitude Checker が効く）
3. PR を作成する
4. マージ後、各マシンで `npx skills update -g` を実行して配布を反映する
