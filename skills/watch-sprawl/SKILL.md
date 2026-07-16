---
name: watch-sprawl
description: Use when open PRs need structural (import graph) analysis with sprawlens
user-invocable: true
metadata:
  author: nishikawa
  description: open PR の import グラフ構造差分を sprawlens で計測し、循環依存・ハブ肥大化・エッジ密度の変化を PR にコメントするスキル。
  dev: false
  tools: gh, node
  sprawlens_bin: ~/projects/mizchi/sprawlens/packages/cli/dist/index.js
---

## 概要

PR ごとに sprawlens の `collect/analyze` を走らせ、base コミット（= PR 分岐点 merge-base）と head コミットの構造メトリクス差分を PR コメントとして投稿する。

diff レビューでは見えない大域的な構造劣化（循環依存の増加・ハブのファンイン急伸・エッジ密度上昇）を PR 単位で可視化する。

**このスキルは構造チェックのみを行う。コードの修正はしない。**

## 呼び出し方

```
/watch-sprawl             # 未チェックの open PR を順番に処理
/watch-sprawl max={N}     # 最大N件まで処理（繰り返し実行、未チェックPRが0件になるかN件に達したら終了）
/watch-sprawl {N}         # PR #{N} を直接指定（数値のみ = PR番号、max=N 形式 = 件数上限。両方指定した場合はエラーとして終了）
```

## 前提

sprawlens はローカルビルド済みのものを使う。バイナリは以下のパスにある。

```
~/projects/mizchi/sprawlens/packages/cli/dist/index.js
```

スキル内での呼び出しはすべて `node ~/projects/mizchi/sprawlens/packages/cli/dist/index.js` で行う。

**このスキルは watch-review / watch-issue と同一の worktree で同時実行しない。** `gh pr checkout` が HEAD を切り替えるため、同一 worktree での並行実行は互いの作業を破壊する。専用の worktree か別の作業ディレクトリで起動すること。

---

## Workflow

### 前提: 環境確認

`node ~/projects/mizchi/sprawlens/packages/cli/dist/index.js --version` が動くことを確認する。失敗した場合は「`~/projects/mizchi/sprawlens` をビルドしてください（`pnpm install && pnpm build`）」と報告して終了する。

ラベルを冪等に確保する。

```bash
gh label create "watch:sprawl:active"  --color "e4e669" --description "watch-sprawl が構造チェック中"   2>/dev/null || true
gh label create "watch:sprawl:checked" --color "0e8a16" --description "sprawl 構造チェック完了"         2>/dev/null || true
gh label create "watch:sprawl:warning" --color "e99695" --description "sprawl 構造チェック: 要確認あり" 2>/dev/null || true
```

### Recovery（毎回 Pick の前に実行）

`watch:sprawl:active` が付いている PR が open のままなら、前セッションでの中断とみなしてリセットする。

```bash
gh pr list --label "watch:sprawl:active" --state open --json number \
  | jq '.[].number' | while read n; do
    gh pr edit "$n" --remove-label "watch:sprawl:active"
  done
```

### Pick（PR 番号を直接指定していない場合）

open PR のうち `watch:sprawl:checked` が付いていないものを番号昇順で取得する。`watch:sprawl:active` 付きはスキップ。`max=N` 指定があれば先頭 N 件に絞り、Workflow 全体をその件数分繰り返す（各ループで Pick → Checkout → Collect → Analyze → Comment → Update を実行し、未チェックPRが0件になるかN件に達したら終了する）。

```bash
gh pr list --state open --json number,title,labels \
  --jq '[.[] | select(
    (.labels | map(.name) | contains(["watch:sprawl:checked"]) | not) and
    (.labels | map(.name) | contains(["watch:sprawl:active"])  | not)
  )] | sort_by(.number)'
```

対象 PR が0件なら「未チェックの open PR が見つかりません」と報告して終了する。

対象 PR の先頭1件を選択し、`watch:sprawl:active` を付ける。

```bash
gh pr edit {N} --add-label "watch:sprawl:active"
```

### Checkout

```bash
gh pr checkout {N}
```

checkout 失敗時はその PR をスキップして次へ進む。必ず active ラベルを外してからスキップすること。

```bash
gh pr edit {N} --remove-label "watch:sprawl:active"
```

### Collect

PR の base SHA と head SHA を取得する。取得失敗または空文字の場合は active を外してスキップする。

**base には `baseRefOid`（base ブランチの現在の tip）ではなく PR 分岐点（merge-base）を使う。** `baseRefOid` は base ブランチが PR 分岐後に進むと head の祖先ではなくなり、sprawlens の collect は HEAD から履歴を遡って採取するため base スナップショットに永久に到達できなくなる（毎回「スナップショット取得失敗」で空振りする）。merge-base なら常に head の祖先で必ず採取でき、かつ PR が導入した構造変化だけを差分として測れる（他 PR のマージ分が混ざらない）。**この処理は Checkout 後（HEAD が PR head になっている状態）で実行する。**

```bash
BASE_REF=$(gh pr view {N} --json baseRefOid --jq '.baseRefOid')
BASE_BRANCH=$(gh pr view {N} --json baseRefName --jq '.baseRefName')
HEAD_SHA=$(gh pr view {N} --json headRefOid --jq '.headRefOid')

if [ -z "$BASE_REF" ] || [ -z "$HEAD_SHA" ]; then
  gh pr edit {N} --remove-label "watch:sprawl:active"
  # 「SHA が取得できませんでした」と PR にコメントする
  exit 1  # このPRの処理をここで終了し、次のPRへ進む（後続の collect・analyze は実行しない）
fi

# base ブランチの tip から PR 分岐点（merge-base）を解決する。
# base オブジェクトがローカルに無いと merge-base は空になるので、その場合は base ブランチを fetch して再試行する。
BASE_SHA=$(git merge-base "$BASE_REF" HEAD 2>/dev/null)
if [ -z "$BASE_SHA" ]; then
  git fetch origin "$BASE_BRANCH" 2>/dev/null || true
  BASE_SHA=$(git merge-base "$BASE_REF" HEAD 2>/dev/null)
fi
# それでも解決できなければ baseRefOid をそのまま使う（後続の snapshot-missing フォールバックに委ねる）
if [ -z "$BASE_SHA" ]; then
  BASE_SHA="$BASE_REF"
fi

# SHA が 40 桁の 16 進数であることを検証する
if ! echo "$BASE_SHA" | grep -qE '^[0-9a-f]{40}$' || ! echo "$HEAD_SHA" | grep -qE '^[0-9a-f]{40}$'; then
  gh pr edit {N} --remove-label "watch:sprawl:active"
  # 「SHA 形式が不正です」と PR にコメントする
  exit 1  # このPRの処理をここで終了し、次のPRへ進む（後続の collect・analyze は実行しない）
fi
```

base から head までのコミット数を取得し、バッファを足して collect する。フォールバック値は 20（shallow clone 環境では git rev-list が truncated になることがあるため）。

```bash
DEPTH=$(git rev-list --count "${BASE_SHA}..HEAD" 2>/dev/null || echo 20)
node ~/projects/mizchi/sprawlens/packages/cli/dist/index.js collect . --commits $((DEPTH + 5))
node ~/projects/mizchi/sprawlens/packages/cli/dist/index.js analyze .
```

collect コマンドが非ゼロで終了した場合は active を外してスキップする。

```bash
# collect/analyze 失敗時
gh pr edit {N} --remove-label "watch:sprawl:active"
```

base/head のスナップショットファイルが存在するか確認する。結果は必ず変数に捕捉して空文字で判定すること。

```bash
BASE_SNAP=$(ls .codesprawl/snapshots/${BASE_SHA}*.json 2>/dev/null | head -1)
HEAD_SNAP=$(ls .codesprawl/snapshots/${HEAD_SHA}*.json 2>/dev/null | head -1)
```

どちらかが空文字の場合: `--commits 50` で1回だけ再 collect・analyze する。再 collect/analyze が非ゼロで終了した場合は `watch:sprawl:active` を外して Update に進む。それでもスナップショットが空文字の場合は「base/head スナップショットが取得できませんでした」と PR にコメントして Update に進む。

### Analyze

> **parallel-review-cycle との関係**: この Analyze ステップは `parallel-review-cycle` の `#7 Structure` スペシャリストと同一のロール定義（`references/specialist-roles.md #7`）を使用する。差分計算スクリプト・判定基準・Blocking/Warning 閾値は specialist-roles.md #7 が正本。

specialist-roles.md の `#7 Structure — 実行手順` に従い、BASE_SHA と HEAD_SHA の差分 JSON を取得する。具体的には:

1. sprawlens collect/analyze を実行してスナップショットを採取する
2. specialist-roles.md #7 の Python スクリプトで差分 JSON を計算する
3. 同 #7 の判定基準（Blocking/Warning 閾値テーブル）で評価する

出力 JSON に `error` キーが存在する場合は「スナップショットが取得できませんでした」と PR にコメントして Update に進む。

### Comment

PR に構造チェック結果をコメントする。

```markdown
## 構造チェック (sprawlens)

| 指標 | base | head | 差分 |
|---|---|---|---|
| LOC | {base.loc} | {head.loc} | {diff.loc:+d} |
| ファイル数 | {base.fileCount} | {head.fileCount} | {diff.fileCount:+d} |
| import エッジ | {base.importEdgeCount} | {head.importEdgeCount} | {diff.importEdgeCount:+d} |
| エッジ密度 | {density_base:.2f} | {density_head:.2f} | {diff.density:+.3f} |
| 循環依存 | {base.cycleCount} | {head.cycleCount} | {diff.cycleCount:+d} |
| max fan-in | {base.maxFanIn} | {head.maxFanIn} | {diff.maxFanIn:+d} |
| 最大連結成分 | {base.largestComponentSize} | {head.largestComponentSize} | {diff.largestComponentSize:+d} |

{Blocking があれば}
⛔ **Blocking**
- {指標名}: base={X}, head={Y}, 差分={Z}（閾値 {T} 超過）

{Warning があれば}
⚠️ **Warning**
- {指標名}: base={X}, head={Y}, 差分={Z}（閾値 {T} 超過）
  - 最大連結成分比率 Warning の場合: `最大連結成分比率: base={comp_ratio_base:.3f}, head={comp_ratio_head:.3f}, 差分={diff.largestCompRatio:+.3f}（閾値 +0.05 超過）`

{何もなければ}
✅ 構造上の問題は検出されませんでした。
```

Approve・Changes Requested は付けない。マージは行わない。

### Update

PR ラベルを更新する。

```bash
# Warning/Blocking なし
gh pr edit {N} \
  --remove-label "watch:sprawl:active" \
  --add-label "watch:sprawl:checked"

# Warning/Blocking あり
gh pr edit {N} \
  --remove-label "watch:sprawl:active" \
  --add-label "watch:sprawl:checked" \
  --add-label "watch:sprawl:warning"
```

---

## よくある間違い

- base/head スナップショットが見つからないのに analysis を続行する → 必ずファイル存在確認してから進む
- `watch:sprawl:active` を外し忘れる → PR が永久に Pick されなくなる。checkout 失敗・collect 失敗・SHA 取得失敗など、どのステップで中断しても必ず外してからスキップする
- `watch:sprawl:checked` を付け忘れる → 次回 Pick でまた同じ PR を処理する
- collect コマンドがクラッシュ・タイムアウトした場合も `watch:sprawl:active` を外してからスキップする
- Approve・Changes Requested を付ける → 付けない
- 自動マージする → しない
- 絶対値で異常判定する → 必ず差分（diff）で判定する。大きなリポジトリの絶対値は常に大きい
- watch-review / watch-issue と同一 worktree で同時起動する → `gh pr checkout` が競合して互いの作業を破壊する
- base に `baseRefOid`（base ブランチの tip）を直接使う → main が PR 分岐後に進むと head の祖先でなくなり base スナップショットに到達できず毎回空振りする。必ず merge-base に解決してから collect する
