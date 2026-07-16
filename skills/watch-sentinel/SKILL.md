---
name: watch-sentinel
description: Use when open PRs need code-sentinel quality+security review with false-positive filtering
user-invocable: true
metadata:
  author: nishikawa
  description: 未チェックの open PR を順番に取得し、code-sentinel（quality+security レンズ + 3票検証）でレビューして結果を PR にコメント、ラベルで状態管理するスキル。各 PR の実レビューは sentinel スキルに委譲する。
  dev: false
  tools: gh, node
  sentinel_root: ~/projects/naoto24kawa/code-sentinel
---

## 設定

`sentinel_root` に code-sentinel リポジトリ（ビルド済み）のパスを指定する。各 PR のレビューはこのリポジトリの CLI（`dist/cli/main.js`）と `sentinel` スキルを使う。

```yaml
sentinel_root: ~/projects/naoto24kawa/code-sentinel  # ビルド済みリポジトリのパス
```

## 概要

「未チェックの open PR を自動で code-sentinel レビューして進める」スキル。`watch:sentinel:checked` が付いていない open PR を番号昇順で処理し、quality/security の指摘（3票投票で偽陽性を除去済み）を PR にコメントしてラベルを更新する。

各 PR の実レビューは `sentinel` スキルに委譲する（このスキルは PR の Pick・コメント・ラベル管理という薄いラッパーに徹する）。

使わないとき: 特定の PR やコミットを手動でレビューしたい場合は直接 `sentinel` スキルを使う。

**このスキルはレビューのみを行う。コードの修正・Approve・マージはしない。**

## 呼び出し方

```
/watch-sentinel             # 未チェックの open PR を番号昇順で全件レビュー
/watch-sentinel max={N}     # 昇順ソート後、先頭 N 件まで処理
/watch-sentinel {N}         # PR #{N} を直接レビュー（ラベル状態に関わらず1件）
```

`/watch-sentinel max={N}` と `/watch-sentinel {N}` を同時指定した場合はエラーとして終了する。

継続運用したい場合は CC の `/loop` で上から駆動する（例: `/loop 30m /watch-sentinel`）。ループ機構はこのスキルでは定義しない。

## 前提

`sentinel_root` のリポジトリがビルド済みであること（`dist/cli/main.js` が存在する）。`sentinel` スキル（単発レビュー）が利用可能であること。

**このスキルは `gh pr checkout` を行わない。** sentinel は `git show <sha>:<path>` で PR の差分内容を読むため HEAD を切り替えない。したがって他の watch-* スキル等と同一 worktree で同時に実行しても作業を破壊しない。

---

## Workflow

### 前提: 引数解析・環境確認・ラベルの確保

**この前提節は呼び出しモードに関わらず常に最初に実行する**（直接指定モード `/watch-sentinel {N}` でもラベル未作成だと `--add-label` が失敗するため）。

まず引数を解析する。`max=N` と PR 番号 `{N}`（裸の数値）が両方指定された場合はエラーとして終了する。`max=N` は内部バッチループの上限、`{N}` は単一 PR 直接指定で、排他である。

`sentinel_root` を展開し、ビルド済み CLI の存在を確認する。`CODE_SENTINEL_ROOT` をエクスポートして sentinel の ingest に渡す。

```bash
SENTINEL_ROOT=$(eval echo <sentinel_root>)   # チルダ展開
if [ ! -f "$SENTINEL_ROOT/dist/cli/main.js" ]; then
  echo "[error] $SENTINEL_ROOT/dist/cli/main.js が見つかりません。code-sentinel をビルドしてください（cd $SENTINEL_ROOT && npm run build）"
  exit 1
fi
export CODE_SENTINEL_ROOT="$SENTINEL_ROOT"

REPO_PATH=$(git rev-parse --show-toplevel 2>/dev/null) \
  || { echo "[error] git リポジトリ内で実行してください"; exit 1; }
REPO_NAME=$(basename "$REPO_PATH")
```

状態遷移に使うラベルを冪等に確保する（存在しないラベルへの `--add-label` はエラーになるため）。

```bash
gh label create "watch:sentinel:active"  --color "e4e669" --description "watch-sentinel がレビュー中"       2>/dev/null || true
gh label create "watch:sentinel:checked" --color "0e8a16" --description "code-sentinel レビュー完了"        2>/dev/null || true
gh label create "watch:sentinel:warning" --color "e99695" --description "code-sentinel: 指摘あり（要確認）" 2>/dev/null || true
```

### Recovery（毎回 Pick の前に実行）

`watch:sentinel:active` が付いている PR が open のままなら、前セッションでの中断とみなしてリセットする。

```bash
gh pr list --label "watch:sentinel:active" --state open --json number \
  | jq '.[].number' | while read n; do
    gh pr edit "$n" --remove-label "watch:sentinel:active"
  done
```

### Pick（PR 番号を直接指定していない場合）

open PR のうち `watch:sentinel:checked` が付いていないものを番号昇順で取得する。`watch:sentinel:active` 付きはスキップ。`max=N` 指定があれば先頭 N 件に絞り、Workflow 全体をその件数分繰り返す（各ループで Pick → Review → Comment → Update を実行し、未チェック PR が0件になるか N 件に達したら終了する）。`max` 未指定なら全件処理する。

```bash
gh pr list --state open --json number,title,labels \
  --jq '[.[] | select(
    (.labels | map(.name) | contains(["watch:sentinel:checked"]) | not) and
    (.labels | map(.name) | contains(["watch:sentinel:active"])  | not)
  )] | sort_by(.number)'
```

対象 PR が0件なら「未チェックの open PR が見つかりません」と報告して終了する。

対象 PR の先頭1件を選択し、`watch:sentinel:active` を付ける。

```bash
gh pr edit {N} --add-label "watch:sentinel:active"
```

**直接指定モード (`/watch-sentinel {N}`)**: 前提節（環境確認・ラベル確保）と Recovery は通したうえで、Pick をスキップして PR #{N} をそのまま対象にする。ラベル状態に関わらず1件だけ処理する（`active` 付与 → Review → Comment → Update）。

### Review（sentinel スキルへ委譲）

> **sentinel スキルとの関係**: このステップのロール定義の正本は同リポの `sentinel` スキル（インストール先は `~/.agents/skills/sentinel/`）であり、watch-sentinel は sentinel スキルへの委譲を維持する。

PR ごとに専用の workDir を用意し、前回成果物が混ざらないよう作り直す（ledger は workDir 単位で蓄積するため、PR をまたいで再利用すると指摘が混在する）。

```bash
WORK_DIR="${TMPDIR:-/tmp}/code-sentinel-watch-${REPO_NAME}-pr{N}"
rm -rf "$WORK_DIR"

# fork PR でも git show が解決できるよう、PR head を HEAD 非切替で取得する（対象リポで実行）
git -C "$REPO_PATH" fetch origin "pull/{N}/head" --quiet 2>/dev/null || true
```

`sentinel` スキルを **Skill ツール**で起動する。`skill` は `sentinel`、`args` は `<repoPath> <prRef> <workDir>` の順（先頭にスキル名 `sentinel` を含めない）。具体値:

```
args: "<REPO_PATH> {N} <WORK_DIR>"
```

sentinel は review-request 生成 → quality/security サブエージェント → verify ×3 → ingest → レポート生成までを実行する（PR への自動コメントは行わない設計なので、コメントはこのスキルが担う）。

**sentinel の起動結果で分岐する**（REPORT ファイルの有無で判定しないこと。対象ファイル0件で正常スキップした場合もレポートは生成されないため）:

- **正常完了**（ingest まで到達。対象ファイル0件で `no files to patrol` と正常スキップした場合を含む）→ そのまま Comment へ進む。
- **失敗**（Skill 起動エラー・サブエージェント失敗・ingest 失敗等でレビューを完了できなかった）→ `watch:sentinel:active` を外し、**`watch:sentinel:checked` は付けず**、任意で PR にエラー旨をコメントして、この PR をスキップし次の Pick へ進む（**Comment / Update 節は実行しない**）。checked を付けないことで次回 Pick の再試行対象に残す。

```bash
# 失敗時のみ: active を外す（checked は付けない = 再 Pick 対象に残す）
gh pr edit {N} --remove-label "watch:sentinel:active"
```

### Comment

（sentinel 正常完了時のみ実行する。）sentinel が生成したレポートを特定し、confirmed finding 数を数える。レポートの finding 見出しは必ず `## [severity] lens/ruleId — file:line` 形式なので、`^## \[` で数える（タイトル本文が `## ` で始まる場合の誤カウントと、ヘッダ行 `# repo — date` の取りこぼしを両方防ぐ）。

```bash
REPORT=$(ls -t "$WORK_DIR/reports/${REPO_NAME}"/*.md 2>/dev/null | head -1)
if [ -n "$REPORT" ]; then
  COUNT=$(grep -c '^## \[' "$REPORT")   # finding 見出し = '## [severity] ...'
else
  COUNT=0   # 対象ファイル0件で正常スキップ = 指摘なし扱い
fi
```

PR にレビュー結果をコメントする。レポート本文に `%` 等が含まれてもクォートが崩れないよう、本文をファイルに組み立てて `--body-file` で投稿する。

```bash
BODY="$WORK_DIR/pr-comment.md"
if [ "$COUNT" -gt 0 ]; then
  {
    echo "## 🛡️ code-sentinel レビュー結果"
    echo
    echo "${COUNT} 件の指摘を検出しました（quality+security レンズ・3票投票で偽陽性除去済み）。"
    echo
    cat "$REPORT"
  } > "$BODY"
else
  {
    echo "## 🛡️ code-sentinel レビュー結果"
    echo
    echo "quality・security の指摘は検出されませんでした（3票投票で確定したもの）。"
  } > "$BODY"
fi
gh pr comment {N} --body-file "$BODY"
```

Approve・Changes Requested は付けない。マージは行わない。

### Update

PR ラベルを更新する。

```bash
# 指摘なし
gh pr edit {N} \
  --remove-label "watch:sentinel:active" \
  --add-label "watch:sentinel:checked"

# 指摘あり（COUNT > 0）
gh pr edit {N} \
  --remove-label "watch:sentinel:active" \
  --add-label "watch:sentinel:checked" \
  --add-label "watch:sentinel:warning"
```

指摘のある PR は `gh pr list --label "watch:sentinel:warning"` で一覧できる。

Update まで終えたら Pick に戻り、未チェック PR が0件になるか `max=N` に達するまで繰り返す。

---

## よくある間違い

- `watch:sentinel:active` を外し忘れる → PR が永久に Pick されなくなる。sentinel 失敗・fetch 失敗・どのステップで中断しても必ず外してからスキップする
- `watch:sentinel:checked` を付け忘れる → 次回 Pick でまた同じ PR を処理する
- PR ごとに workDir を作り直さない → ledger が PR をまたいで蓄積し、前の PR の指摘が混ざってコメントされる。必ず `rm -rf "$WORK_DIR"` してから sentinel を起動する
- Approve・Changes Requested を付ける → 付けない。判断は人間に委ねる
- 自動マージする → しない
- `CODE_SENTINEL_ROOT` を export し忘れる → sentinel の ingest が `dist/cli/main.js` を解決できず失敗する
- `gh pr checkout` する → このスキルでは不要。HEAD を切り替えると他の watch-* と競合する原因になる
- sentinel 失敗 PR に `checked` を付ける → 「指摘なし・完了」として確定し二度と Pick されない。失敗時は active を外すだけで checked は付けない（再試行対象に残す）
- コメントを二重投稿する → このスキルは sentinel が「PR へ自動コメントしない」前提でコメントを担う。sentinel 側がレポートを自動投稿する設定・版だと二重になる。委譲先 sentinel の自動コメント無効を前提とする

---

## Skills

- `sentinel` — 各 PR の実レビュー（quality/security レンズ + 3票検証 + レポート生成）の正本。このスキルが委譲する先
