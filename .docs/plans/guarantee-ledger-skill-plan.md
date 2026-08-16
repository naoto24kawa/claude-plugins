# 保証台帳スキル 実装計画（成果物 1: agent-toolkit）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** manako で試作した保証台帳の運用ルールを `agent-toolkit` の 2 スキルへ移し、出自ルールを組み込んだ雛形 checker と自己検証用 fixture を同梱する。

**Architecture:** `skills/guarantee-ledger/`（コアの文書規約・導入手順・雛形 scripts・fixture）と `skills/guarantee-pin-check/`（pin 確認の多主体手順）の 2 スキル。checker は manako の 2 本をコピーし、出自列の空検査とファイル実在検査だけを追加する。fixture 台帳に対して checker を実行することで、スキル単体で自己検証が閉じる。

**Tech Stack:** bash（checker）、markdown（SKILL.md・fixture）、`npx skills`（配布）

**Spec:** `.docs/plans/guarantee-ledger-skill-design.md`

## Global Constraints

- 本文・コメントはすべて日本語で書く。技術用語とコード識別子は原語のまま。
- `SKILL.md` の `description` に `: `（コロン + 半角空白）を含む場合はシングルクォートで囲む。囲まないと skills CLI が静かにスキップする（URISK-077）。
- コミットは Conventional Commits（`feat:` / `fix:` / `docs:` / `chore:` / `test:` / `refactor:`）。1 コミット 1 論理変更。
- `main` へ直接コミットしない。作業ブランチは `naoto24kawa/guarantee-ledger-skill`。
- 設計文書の本文を `SKILL.md` へ丸ごと複製しない。汎用ルールの正本は `SKILL.md` へ移し、設計文書は経緯と判断根拠を持つ。
- 検証コマンドに pipe を挟まない。`&&` や `;` で連結しない。1 コマンドずつ実行し `echo "exit=$?"` で個別に確認する。
- 成功条件に変動する値（テスト件数・ファイル数）を焼き込まない。
- 作業ディレクトリは `/Users/nishikawa/orca/workspaces/agent-toolkit/guarantee-ledger-skill`。以降の相対パスはすべてここを起点とする。

---

## File Structure

| ファイル | 責務 |
|---|---|
| `skills/guarantee-ledger/SKILL.md` | 台帳の文書規約・出自ルール・載せる/載せない・導入手順・移植限界 |
| `skills/guarantee-ledger/scripts/check-guarantees.sh` | 索引の実在検査（雛形）。出自の空検査とファイル実在検査を追加 |
| `skills/guarantee-ledger/scripts/check-guarantee-cochange.sh` | 実装変更に対する台帳行の更新漏れ検査（雛形）。無改修 |
| `skills/guarantee-ledger/fixtures/guarantees.md` | 6 列の worked example。雛形 scripts の自己検証に使う |
| `skills/guarantee-ledger/fixtures/impl/example.ts` | fixture 台帳の `対応実装` が指す先 |
| `skills/guarantee-ledger/fixtures/tests/example.test.ts` | fixture 台帳の `裏付けテスト` が指す先 |
| `skills/guarantee-ledger/fixtures/decisions/example-design.md` | fixture 台帳の `出自` が指す先 |
| `skills/guarantee-pin-check/SKILL.md` | pin 確認の Step A〜D、多主体の振り付け、安全規則 |

`ROOT` は `check-guarantees.sh` 内で `$(cd "$(dirname "$0")/.." && pwd -P)` として解決される。スクリプトを `skills/guarantee-ledger/scripts/` へ置くと `ROOT` は `skills/guarantee-ledger/` になるため、`fixtures/` 配下の相対パスがそのまま解決できる（実測で確認済みの挙動）。

---

## Task 1: 雛形 scripts と fixture、出自検査の追加

**Files:**
- Create: `skills/guarantee-ledger/scripts/check-guarantees.sh`（manako からコピーし改修）
- Create: `skills/guarantee-ledger/scripts/check-guarantee-cochange.sh`（manako からコピー、無改修）
- Create: `skills/guarantee-ledger/fixtures/guarantees.md`
- Create: `skills/guarantee-ledger/fixtures/impl/example.ts`
- Create: `skills/guarantee-ledger/fixtures/tests/example.test.ts`
- Create: `skills/guarantee-ledger/fixtures/decisions/example-design.md`

**Interfaces:**
- Produces: `check-guarantees.sh` は `checked=N broken=N unpinned=N` を stdout の最終行へ出力し、`broken > 0` で exit 1。Task 2 の SKILL.md がこの出力形式と exit code 契約を記述する。
- Produces: fixture 台帳の 6 列書式（`ID` / `保証` / `対応実装` / `裏付けテスト` / `pin確認` / `出自`）。Task 2 の SKILL.md がこの列順を規定する。

- [ ] **Step 1: 雛形 scripts を manako からコピーする**

```bash
mkdir -p skills/guarantee-ledger/scripts
cp /Users/nishikawa/projects/elchika-inc/manako/scripts/check-guarantees.sh skills/guarantee-ledger/scripts/check-guarantees.sh
echo "cp1_exit=$?"
cp /Users/nishikawa/projects/elchika-inc/manako/scripts/check-guarantee-cochange.sh skills/guarantee-ledger/scripts/check-guarantee-cochange.sh
echo "cp2_exit=$?"
```

- [ ] **Step 2: 雛形の既定値をスキル用に変える**

`skills/guarantee-ledger/scripts/check-guarantees.sh` の 7〜8 行目を書き換える。

変更前:
```bash
LEDGER="${LEDGER:-.docs/guarantees.md}"
TEST_DIR="${TEST_DIR:-apps/api/tests}"
```

変更後:
```bash
# 導入時はプロジェクトの実パスへ書き換える。既定値は同梱 fixture を指す。
LEDGER="${LEDGER:-fixtures/guarantees.md}"
TEST_DIR="${TEST_DIR:-fixtures/tests}"
```

`check-guarantee-cochange.sh` の `LEDGER` も同様に `fixtures/guarantees.md` へ変える。`BASE_REF` は `origin/main` のまま変えない。

- [ ] **Step 3: fixture の参照先ファイルを作る**

`skills/guarantee-ledger/fixtures/impl/example.ts`:
```typescript
// fixture 用のダミー実装。台帳の `対応実装` 列が指す先として実在することだけが要件。
export function example(): string {
  return "example";
}
```

`skills/guarantee-ledger/fixtures/tests/example.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { example } from "../impl/example";

describe("example behavior", () => {
  it("returns the example value", () => {
    expect(example()).toBe("example");
  });
});
```

`skills/guarantee-ledger/fixtures/decisions/example-design.md`:
```markdown
# fixture 用の裁定文書

台帳の `出自` 列が指す先として実在することだけが要件。

## example の戻り値を固定する

`example()` は常に `"example"` を返す。呼び出し側がこの値へ依存してよい。
```

- [ ] **Step 4: 失敗する fixture 台帳を作る（出自が空の行を含む）**

`skills/guarantee-ledger/fixtures/guarantees.md`:
```markdown
# 保証台帳（fixture）

雛形 scripts の自己検証に使う worked example。実在のプロジェクトの保証ではない。

## example

| ID | 保証 | 対応実装 | 裏付けテスト | pin確認 | 出自 |
|---|---|---|---|---|---|
| G-001 | `example()` は常に `"example"` を返す | `fixtures/impl/example.ts` | `example.test.ts::example behavior` | 2026-08-17 戻り値を別の文字列へ変えて赤を確認 | `fixtures/decisions/example-design.md::example の戻り値を固定する` |
| G-002 | 出自を持たない行（この行は Step 5 で BROKEN になることを確認するために置く） | `fixtures/impl/example.ts` | `example.test.ts::example behavior` | | |
```

- [ ] **Step 5: 検査を実行し、出自が空の行が見逃されることを確認する（失敗するテスト）**

```bash
cd skills/guarantee-ledger
bash scripts/check-guarantees.sh
echo "exit=$?"
```

Expected: `checked=2 broken=0 unpinned=1`、exit 0。

**これが失敗しているテストである。** G-002 は出自が空なのに `BROKEN` にならず素通りする。この時点で `broken=1` が出るなら、既に出自検査が実装されているので Step 6 の実装は不要（その場合は Step 6 を飛ばさず、実装差分が無いことを確認してから Step 7 へ進む）。

- [ ] **Step 6: 出自検査を実装する**

`skills/guarantee-ledger/scripts/check-guarantees.sh` の、裏付けテスト（`ref`）を取り出すブロックの**直前**へ次を挿入する。挿入位置の目印は `ref=$(printf '%s\n' "$line" | awk -F'|' '{print $5}' ...)` の行。

```bash
  # 出自（7列目）。空と参照先ファイルの不在を検出する。
  # 見出しの実在は検査しない。形式検査を意味検査と誤認させないため（設計文書「機械検査の境界」）。
  provenance=$(printf '%s\n' "$line" | awk -F'|' '{print $7}' | sed 's/`//g; s/^[[:space:]]*//; s/[[:space:]]*$//')
  if [ -z "$provenance" ]; then
    echo "BROKEN: 出自が空: $id" >&2
    failed=$((failed + 1))
    continue
  fi
  case "$provenance" in
    *"::"*) ;;
    *)
      echo "BROKEN: 出自の形式が不正: $id :: $provenance" >&2
      failed=$((failed + 1))
      continue
      ;;
  esac
  provenance_path="${provenance%%::*}"
  case "$provenance_path" in
    ""|/*|../*|*/../*|*/..)
      echo "BROKEN: 出自の形式が不正: $id :: $provenance_path" >&2
      failed=$((failed + 1))
      continue
      ;;
  esac
  if [ -L "$provenance_path" ] || [ ! -f "$provenance_path" ]; then
    echo "BROKEN: 出自の参照先が無い: $id :: $provenance_path" >&2
    failed=$((failed + 1))
    continue
  fi
  resolved_provenance_path=$(realpath "$provenance_path")
  case "$resolved_provenance_path" in
    "$ROOT"/*) ;;
    *)
      echo "BROKEN: 出自の形式が不正: $id :: $provenance_path" >&2
      failed=$((failed + 1))
      continue
      ;;
  esac
```

`${provenance%%::*}` は**最初の `::`** で分割する。見出しに `::` が含まれても壊れない。

- [ ] **Step 7: 検査を実行し、出自が空の行が BROKEN になることを確認する**

```bash
cd skills/guarantee-ledger
bash scripts/check-guarantees.sh
echo "exit=$?"
```

Expected: stderr に `BROKEN: 出自が空: G-002`、stdout に `checked=1 broken=1 unpinned=1`、exit 1。

`unpinned` が 1 になるのは、`pin確認` のカウントが出自検査より前に実行されるためである（G-002 は pin 空でカウントされた後、出自で `BROKEN` になる）。`checked` は最後まで到達した行だけを数えるため 1 になる。

- [ ] **Step 8: fixture の G-002 に出自を与えて緑にする**

`skills/guarantee-ledger/fixtures/guarantees.md` の G-002 行を次へ置き換える。

```markdown
| G-002 | `example()` の戻り値は呼び出し側が依存してよい安定値である | `fixtures/impl/example.ts` | `example.test.ts::example behavior` | | `fixtures/decisions/example-design.md::example の戻り値を固定する` |
```

- [ ] **Step 9: 緑を確認する**

```bash
cd skills/guarantee-ledger
bash scripts/check-guarantees.sh
echo "exit=$?"
```

Expected: `checked=2 broken=0 unpinned=1`、exit 0。`unpinned=1` は G-002 が pin 未確認であることを示す正常な状態（fixture として、pin 済みと未 pin の両方を例示している）。

- [ ] **Step 10: 出自パスの不在を mutation で確認する**

fixture の G-001 の出自を、実在しないパスへ一時的に書き換える。

```markdown
| G-001 | ... | `fixtures/decisions/does-not-exist.md::example の戻り値を固定する` |
```

```bash
cd skills/guarantee-ledger
bash scripts/check-guarantees.sh
echo "exit=$?"
```

Expected: stderr に `BROKEN: 出自の参照先が無い: G-001 :: fixtures/decisions/does-not-exist.md`、stdout に `checked=1 broken=1 unpinned=1`、exit 1。

- [ ] **Step 11: 復元して緑を確認する**

fixture の G-001 の出自を `fixtures/decisions/example-design.md::example の戻り値を固定する` へ戻す。

```bash
cd skills/guarantee-ledger
bash scripts/check-guarantees.sh
echo "exit=$?"
```

Expected: `checked=2 broken=0 unpinned=1`、exit 0。

```bash
cd /Users/nishikawa/orca/workspaces/agent-toolkit/guarantee-ledger-skill
git diff --stat
echo "exit=$?"
```

Expected: mutation の痕跡が残っていないこと（`fixtures/guarantees.md` が Step 8 の状態であること）。

- [ ] **Step 12: cochange 雛形が fixture で動くことを確認する**

```bash
cd skills/guarantee-ledger
bash scripts/check-guarantee-cochange.sh
echo "exit=$?"
```

Expected: stdout の最終行が `cochange_checked=2 cochange_warn=<数値>` の形であり、exit code が 0 または 2 であること。

判定は exit code で行う。`cochange_warn` の値そのものは成功条件にしない（fixture の実装ファイルが新規追加されたため警告が出るのは正常な状態であり、値は作業の進み方で変わる）。**exit 1 なら失敗**であり、台帳の読み取りか base ref の解決に失敗している。exit 2 の場合は stderr の `COCHANGE_WARN:` 行を記録して次へ進む。

- [ ] **Step 13: コミット**

```bash
cd /Users/nishikawa/orca/workspaces/agent-toolkit/guarantee-ledger-skill
git add skills/guarantee-ledger/scripts skills/guarantee-ledger/fixtures
git commit -m "feat: 保証台帳の雛形 checker と自己検証用 fixture を追加する"
echo "exit=$?"
```

---

## Task 2: `guarantee-ledger` の SKILL.md

**Files:**
- Create: `skills/guarantee-ledger/SKILL.md`

**Interfaces:**
- Consumes: Task 1 の `scripts/`、`fixtures/`、`checked=N broken=N unpinned=N` の出力形式
- Produces: `guarantee-pin-check` への参照（Task 3 がこの名前で参照される）

- [ ] **Step 1: frontmatter を書く**

```markdown
---
name: guarantee-ledger
description: 'Use when プロジェクトへ保証台帳（guarantee ledger）を導入する・保証を追記する・台帳の機械検査を配線するとき。壊してはいけない約束を一枚の文書へ宣言し、実装とテストへ索引を張り、その約束の出自（指示・判断の出来事）を必須にする。トリガー: 「保証台帳」「guarantee ledger」「壊してはいけない振る舞いを台帳にする」「保証を追記する」「台帳の検査を入れる」。pin 確認の実施手順は guarantee-pin-check を使う。'
---
```

`description` に `: `（「トリガー: 」）を含むため、**シングルクォートで囲む**（Global Constraints）。

- [ ] **Step 2: ①目的と責務分割を書く**

次の要素を必ず含める。

- 台帳とは何か（壊してはいけない約束の宣言 + 実装とテストへの索引）
- 面ごとの「形の正本」と台帳の関係。逐語で入れる文:
  > その面にインターフェース定義があるなら、それが形の正本である。台帳はそれを読んでも分からない振る舞いだけを持つ。
- 形の正本が無い面の分岐: (1) 先に形の正本を作る (2) その面を台帳の対象外とする
- 出自ルール。逐語で入れる文:
  > 保証は、指示・判断の出来事へ遡れるものだけを載せる。実装とテストが存在しても、遡れなければ載せない。実装が指示の隙間を埋めた振る舞いは、正しく動いていても保証ではない。
- 復元の天井。逐語で入れる文:
  > 事後棚卸しが復元できるのは、過去の判断がテストへ化石化した分までである。規範の新規宣言はやりとり（レビュー・設計判断）からしか来ない。迷ったら載せない。
- 出自ルールの理由（実装から拾うとエージェントが指示されずに決めた振る舞いが契約へ昇格し、誤りを台帳が守る側へ回る）

- [ ] **Step 3: ②表書式と面のセクションを書く**

6 列の表を規定する。列順は `ID` / `保証` / `対応実装` / `裏付けテスト` / `pin確認` / `出自`。各列の内容は設計文書の「表書式」節の表をそのまま使う。

面のセクションについて逐語で入れる文:
> 保証が生まれてからセクションを作る。空のセクションを先に置かない。保証 0 件の面は、セクションが存在しないことで表現される。

出自列の形式制約を書く:

- 形式は `<リポジトリルートからの相対パス>::<見出し>` の一形式
- `::` は**最初の 1 つ**で分割する。見出しに `::` が含まれても壊れない
- 見出しに `|` を含むものは表セルを壊すため使えない
- PR やレビューでの裁定も、まず `.docs/reviews/` か `.docs/plans/` へ書いてから参照する。逐語で入れる文:
  > 文書に残らないやりとりは保証にできない。

書式例として `fixtures/guarantees.md` を参照させる（本文へ表を再掲しない）。

- [ ] **Step 4: ③ID 体系を書く**

- ID は `G-###` の連番
- 欠番は再利用しない
- 保証をやめるときは行を削除せず `(retired: YYYY-MM-DD 理由)` を付けて残す
- 理由を逐語で入れる: 「破棄した約束を削除すると、後から見たときに『そんな約束は最初から無かった』という履歴へ化ける」
- 並行採番の衝突: rebase 後に台帳全体の G-ID 重複と単調増加を確認し、`main` に存在する ID を保持したまま、自ブランチで追加した衝突 ID だけを現在の最大 ID の次から繰り下げる。繰り下げ後も単調増加させ、空いたように見える番号を再利用しない

- [ ] **Step 5: ④載せる/載せないの二段の門を書く**

| 段 | 判定 |
|---|---|
| 第 1 門（出自） | ユーザー指示・設計文書の決定・レビュー裁定・PR rubric のいずれかへ遡れるか。遡れなければ載せない |
| 第 2 門（書き方） | 条件分岐の振る舞い / 検証の網羅性 / 副作用の有無・冪等性 / エラーコード語彙の安定性 / 存在秘匿・テナント分離 |

載せないもの: 形の正本が持つ内容（path・HTTP method・フィールド名と型・単純なステータスコード一覧）、内部実装。

逆ルールを逐語で入れる:
> 実装もテストも存在するのに指示へ遡れないものは載せない。

昇格経路を逐語で入れる:
> 観測は昇格させない。裁定が昇格させる。中間の振る舞いを保証したければ、まず判断の出来事を作る（レビューで裁定する / 設計文書へ決定として書く）。それから台帳へ載せる。

**CLI や画面に固有の判定基準を書かない。** 原則だけを書く。

- [ ] **Step 6: ⑤テスト索引形式と⑥必須フィールドを書く**

- 索引は `<ファイル名>::<describe>` または `<ファイル名>::<describe> > <it>`
- 複数テストが 1 保証を裏付けるなら `describe` 単位
- 1 索引で保証全体を裏付けられないなら保証を分割する
- 索引に件数・行番号など変動する値を書かない（正しいテスト追加で台帳が陳腐化するため）
- `対応実装`・`裏付けテスト`・`出自` は必須。空欄と不在パスは checker が `BROKEN` とする
- 「約束したいがテストが無い」振る舞いは台帳へ載せず Action へ積む。検出結果を握りつぶさない

- [ ] **Step 7: ⑦pin 確認の意味と限界を書く**

- `pin確認` は保証を意図的に壊して裏付けテストが赤くなることを観測した証跡。`YYYY-MM-DD <壊し方の散文>` を記録し、mutation patch 自体は保存しない
- 限界を逐語で入れる:
  > pin 確認が示すのは、その 1 つの壊し方を裏付けテストが検出できることまでであり、保証の実効性全体を証明するものではない。
- 実施手順は `guarantee-pin-check` スキルを使う（ここには手順を書かない）

- [ ] **Step 8: ⑧導入手順を書く**

1. `scripts/check-guarantees.sh` と `scripts/check-guarantee-cochange.sh` をプロジェクトへコピーし、`LEDGER` / `TEST_DIR` / `BASE_REF` を実パスへ書き換える
2. 台帳を空で開始する。または指示の情報源（`.docs/plans` の決定・PR rubric・レビュー裁定・risk-registry）から起こす
3. プロジェクトの `CLAUDE.md` / `AGENTS.md` へ追記トリガーを 1 行加える
4. PR 前チェックへ checker を配線し、exit code 契約を明記する

禁止事項を逐語で入れる:
> 実装とテストを掃いて保証を起こす手順（初回棚卸し）は行わない。台帳が空であることは「まだ何も約束していない」という正しい状態を表す。

- [ ] **Step 9: ⑨機械検査の境界と移植限界を書く**

判定の基準を逐語で入れる:
> 機械はポインタの健全性を検査する。意味は人間が検査する。テストは pin が検査する。

checker が検査すること: 対応実装・裏付けテスト・出自の実在、テスト索引の `describe` / `it` 宣言の実在、pin 確認の日付形式。

**意図的に検査しないこと**（理由つきで書く）:
- 出自の見出しの実在 — 形式検査を意味検査と誤認させるため。もっともらしい見出しを指していれば通る
- `describe` と `it` の所属関係 — 同一ファイル内に独立に存在すれば通る
- テストの中身が保証を実証しているか — pin 確認の担当
- 台帳の主張範囲（「12 endpoint」等）の被覆

移植限界:
- vitest 形式の `describe` / `it` / `test` 宣言をパースする前提
- テスト索引のファイル名部分にサブディレクトリを含められない
- ID は `G-` + 3 桁固定

exit code 契約: 0 = 続行 / 2（cochange のみ）= WARN（PR をブロックしない）/ それ以外の非 0 = FAIL。

- [ ] **Step 10: ⑩⑪⑫を書く**

⑩ 段階 2 エージェント突合: 台帳と実装を読み合わせ、差異を `missing` / `partial` / `contradicts` / `unrequested` へ分類する。`unrequested` は指示の中間で生まれた振る舞いの検出器である。**この段階はまだ一度も実行されていない。**

⑪ 効果判定 rubric: 台帳へ保証を追加する PR で出自が実際に記入され、その出自が既存の判断の出来事を指しているかを確認する。出自欄が「台帳更新のために作られただけの文書」を指すようになったら形骸化と判定する。

⑫ `decision-test-chain` との境界: テスト注釈 → 設計見出しの一方通行で「注釈が付いたテスト = 意図的な仕様、注釈のないテスト = たまたまそうなっている挙動」を判別する別機構が todoke で並走している。同じ判別線を逆向きに引いた実装であり、アドレス体系（`<path>::<見出し>`）も共有する。**機構は統合しない。** 合否判定が持ち越し中である。

- [ ] **Step 11: skills CLI が発見することを確認する**

```bash
cd /Users/nishikawa/orca/workspaces/agent-toolkit/guarantee-ledger-skill
rg -n '^description:' skills/guarantee-ledger/SKILL.md
echo "exit=$?"
```

Expected: `description:` の値がシングルクォートで始まりシングルクォートで終わること。`: ` を含むのに囲まれていなければ修正する。

- [ ] **Step 12: コミット**

```bash
git add skills/guarantee-ledger/SKILL.md
git commit -m "feat: guarantee-ledger スキルを追加する"
echo "exit=$?"
```

---

## Task 3: `guarantee-pin-check` の SKILL.md

**Files:**
- Create: `skills/guarantee-pin-check/SKILL.md`

**Interfaces:**
- Consumes: `guarantee-ledger` の `pin確認` 列の記法（`YYYY-MM-DD <壊し方の散文>`）
- Produces: なし（終端スキル）

- [ ] **Step 1: frontmatter を書く**

```markdown
---
name: guarantee-pin-check
description: 'Use when 保証台帳の pin 未確認（unpinned）な保証をまとめて潰すとき。保証を意図的に壊して裏付けテストが赤くなることを観測し、証跡を台帳へ記入する多主体の手順。トリガー: 「pin 確認」「unpinned を潰す」「保証が本当に守られているか確かめる」「mutation で台帳を検証する」。台帳そのものの書式・出自ルールは guarantee-ledger を使う。'
---
```

- [ ] **Step 2: 目的と前提を書く**

- pin 確認とは何か: 保証を意図的に壊して裏付けテストが赤くなることを観測する行為
- なぜ必要か（逐語で入れる）:
  > テストが緑であることを保証の証拠にしない。緑は「テストが何も検査していない」場合にも出る。壊して赤くなることだけが、そのテストが保証を守っている証拠になる。
- 出自（逐語で入れる）:
  > この手順は manako の 1 回のキャンペーン（2026-08-14、G-001〜G-006）の実施記録から復元したものであり、n=1 である。

- [ ] **Step 3: Step A〜D を書く**

| Step | 内容 |
|---|---|
| A | 裏付けテストを読まずに（test-blind）、保証文と実装だけから mutant を設計する。網羅性を主張する保証は条件ごとに mutant を分ける |
| B | mutant を適用し、裏付けテストが赤くなることを確認する。exit code と失敗したテスト名を記録する |
| C | mutant を復元し、`git diff` が空であることを確認する |
| D | 台帳の `pin確認` 欄へ `YYYY-MM-DD <壊し方の散文>` を記入する |

Step A が test-blind である理由を書く: テストを先に読むと、テストが検査している条件をなぞった mutant しか思いつかなくなり、「テストが検出できない壊し方」を発見できなくなる。

- [ ] **Step 4: 多主体の規律を書く**

逐語で入れる:
> mutant の作者 ≠ 実装の作者。実装を書いた agent 以外の人間、または fresh context の独立 agent が実施する。

包含関係の罠を書く（実例つき）:
> 実施順の設計時に、裏付け索引の包含関係を確認する。先行する保証の索引が後続保証の裏付けを含む場合、後続の Step A をテスト未読の別主体が代行する。
>
> 実例: manako の G-001 の索引 `api-key-auth.test.ts::apiKeyAuth middleware` は G-002 の個別テストを内包していた。G-001 を先に検証した worker は G-002 の Step A を test-blind に実施できなくなり、該当テスト未読の司令塔が Step A だけを代行した。ファイル名だけでなく `describe` / `it` の包含関係を確認する。

- [ ] **Step 5: 部分的な空手形の扱いを書く**

逐語で入れる:
> mutant の一部が緑のままだった場合、`pin確認` を空欄のまま残す。「一部は pin できた」を pin 済みとして記入しない。緑のままだった条件を Action へ積む。
>
> 実例: manako の G-005 は 4 つの mutant のうち free 上限と未知プラン fallback は赤になったが、pro / business の上限を 1 増やす mutant は緑のままだった。台帳の `pin確認` は空欄のままとし、`unpinned=1` として残した。

- [ ] **Step 6: 委任と記録を書く**

- 委任は `delegation-spec` スキルに従う
- 実施記録に残すもの: 各 mutant の内容、mutant 数、実行したテスト、exit code、判定、復元確認の結果
- 記録は台帳と同じリポジトリの `.docs/plans/` へ残す（チャットへ揮発させない）

- [ ] **Step 7: description の引用符を確認する**

```bash
cd /Users/nishikawa/orca/workspaces/agent-toolkit/guarantee-ledger-skill
rg -n '^description:' skills/guarantee-pin-check/SKILL.md
echo "exit=$?"
```

Expected: シングルクォートで囲まれていること。

- [ ] **Step 8: コミット**

```bash
git add skills/guarantee-pin-check/SKILL.md
git commit -m "feat: guarantee-pin-check スキルを追加する"
echo "exit=$?"
```

---

## Task 4: 配布の検証と完了ゲート

**Files:**
- Modify: なし（検証のみ。不備が見つかった場合のみ該当ファイルを修正する）

**Interfaces:**
- Consumes: Task 1〜3 の全成果物

- [ ] **Step 1: 両スキルの frontmatter が揃っていることを確認する**

```bash
cd /Users/nishikawa/orca/workspaces/agent-toolkit/guarantee-ledger-skill
rg -n '^name:|^description:' skills/guarantee-ledger/SKILL.md skills/guarantee-pin-check/SKILL.md
echo "exit=$?"
```

Expected: 各ファイルに `name:` と `description:` が 1 つずつ。`name` の値がディレクトリ名と一致すること。

- [ ] **Step 2: 既存スキルと同じ構造であることを確認する**

```bash
cd /Users/nishikawa/orca/workspaces/agent-toolkit/guarantee-ledger-skill
ls skills/delegation-spec
echo "exit=$?"
ls skills/guarantee-ledger
echo "exit=$?"
ls skills/guarantee-pin-check
echo "exit=$?"
```

Expected: `SKILL.md` が各ディレクトリ直下に存在すること。

- [ ] **Step 3: fixture に対する checker が緑であることを再確認する**

```bash
cd skills/guarantee-ledger
bash scripts/check-guarantees.sh
echo "exit=$?"
```

Expected: `checked=2 broken=0 unpinned=1`、exit 0。

- [ ] **Step 4: 出自検査の mutation を再実行する（完了ゲート）**

これは Task 1 Step 10 と同じ検証を、全タスク完了後の状態で独立に再実行するものである。**skip しない。**

fixture の G-001 の出自を空にする。

```bash
cd skills/guarantee-ledger
bash scripts/check-guarantees.sh
echo "exit=$?"
```

Expected: `BROKEN: 出自が空: G-001`、exit 1。

出自を実在しないパスへ書き換える。

```bash
cd skills/guarantee-ledger
bash scripts/check-guarantees.sh
echo "exit=$?"
```

Expected: `BROKEN: 出自の参照先が無い: G-001 :: <書き換えたパス>`、exit 1。

復元する。

```bash
cd skills/guarantee-ledger
bash scripts/check-guarantees.sh
echo "exit=$?"
```

Expected: `checked=2 broken=0 unpinned=1`、exit 0。

```bash
cd /Users/nishikawa/orca/workspaces/agent-toolkit/guarantee-ledger-skill
git status --porcelain
echo "exit=$?"
```

Expected: 出力が空（mutation の痕跡が残っていないこと）。

- [ ] **Step 5: 設計文書との突合**

設計文書 `.docs/plans/guarantee-ledger-skill-design.md` の「成功基準（rubric）> 完了条件」1〜2 を読み、満たされているか確認する。3〜6 は成果物 2（manako）の判定であり、本計画の対象外。

- [ ] **Step 6: 未使用ファイルが残っていないことを確認する**

```bash
cd /Users/nishikawa/orca/workspaces/agent-toolkit/guarantee-ledger-skill
git status --porcelain
echo "exit=$?"
git log --oneline origin/main..HEAD
echo "exit=$?"
```

Expected: 作業ツリーが clean。コミットは設計文書 2 本 + Task 1〜3 の 3 本。

---

## 本計画のスコープ外

- manako 側の変更（再裁定文書、台帳の 6 列移行、checker への出自検査、design.md の降格、AGENTS.md の参照追加）は**別計画**とする。本計画のマージ後に着手する
- `npx skills update -g` による配布は、PR マージ後に人間が実行する
- 台帳 → 検証仕様書の変換、段階 2 エージェント突合の初回実行、`decision-test-chain` の合否判定
