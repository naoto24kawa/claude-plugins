# tmux-manager skill 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** tmux 全体の可視化と残留掃除を Claude Code の会話から行える skill を作る。

**Architecture:** 収集・突合は deterministic なシェルスクリプト（`status.sh`、読み取り専用）に固定し、解釈・報告・human-gate 付き掃除の対話は SKILL.md の指示で Claude が担う。kill 系ヘルパーは作らない（agmsg `despawn.sh` と tmux 標準コマンドで足りる）。

**Tech Stack:** bash（macOS `/bin/bash` 3.2 互換）、tmux、agmsg の `run/` 状態ファイル群。

**Spec:** `~/.agents/skills/tmux-manager/docs/2026-07-16-tmux-manager-design.md`

## Global Constraints

- bash 3.2 互換: 連想配列・`${var,,}`・`readarray` 等の bash4+ 機能は使用禁止
- `status.sh` は読み取り専用 — いかなる変更・削除もしない
- SKILL.md 本文・スクリプトコメントは日本語（技術用語は原語のまま）
- `~/.agents/skills/` は git 管理外 → コミットステップなし。各タスク末尾の検証が完了ゲート
- agmsg `run/` の形式の正本: `agmsg/scripts/lib/actas-lock.sh`（`actas.<enc>.session` / `spawn.<enc>` / `cc-instance.<pid>`）、`spawn.sh`（spawn record = `<tmux_id>\t<project>\t<type>`）
- `status.sh` は環境変数 `AGMSG_RUN` で run/ ディレクトリを差し替え可能（既定: `$HOME/.agents/skills/agmsg/run`）。検証は fixture ディレクトリで行い、実 run/ を汚さない

---

### Task 1: scripts/status.sh — 収集・突合・ラベル付け

**Files:**
- Create: `~/.agents/skills/tmux-manager/scripts/status.sh`

**Interfaces:**
- Consumes: tmux CLI（`ls` / `list-panes -a` / `list-windows -a`）、`$AGMSG_RUN` 配下の `spawn.*` / `role-session.*` / `watch.*.pid` / `actas.*.session` / `cc-instance.*`
- Produces: stdout に `== SERVER ==` `== PANES ==` `== STALE ==` `== LIVE-GUARD ==` の4セクション（TSV 行）。常に exit 0（tmux 停止中でも）。Task 2 の SKILL.md はこの出力形式に依存する

- [ ] **Step 1: status.sh を書く**

```bash
#!/usr/bin/env bash
# status.sh — tmux と agmsg の状態を突合して一覧表示する（読み取り専用）
#
# 出力: SERVER / PANES / STALE / LIVE-GUARD の4セクション（TSV 行）。
# agmsg run/ の形式の正本: agmsg/scripts/lib/actas-lock.sh・spawn.sh・despawn.sh
#   spawn.<enc>          : "<tmux_id>\t<project>\t<type>"（%N=pane, @N=window）
#   actas.<enc>.session  : 1行目 = 所有者 instance id
#   cc-instance.<pid>    : instance id を含む（pid 生存 && 一致 = 所有者生存）
#   watch.<session>.<pid>.pid / role-session.<enc> : watcher pid / メンバー情報
# 環境変数 AGMSG_RUN で run/ を差し替え可能（検証用）。常に exit 0。
set -u

AGMSG_RUN="${AGMSG_RUN:-$HOME/.agents/skills/agmsg/run}"

# ---------- SERVER ----------
echo "== SERVER =="
server=down
if ! command -v tmux >/dev/null 2>&1; then
  printf 'tmux\tnot-installed\n'
elif tmux ls >/dev/null 2>&1; then
  printf 'tmux\trunning\n'
  server=up
else
  printf 'tmux\tnot-running\n'
fi

# ---------- spawn record 読み込み ----------
# 行形式: <tmux_id>\t<team/name>\t<record_file>（bash 3.2 互換のため連想配列不使用）
spawn_lines=""
spawn_errors=""
if [ -d "$AGMSG_RUN" ]; then
  for f in "$AGMSG_RUN"/spawn.*; do
    [ -f "$f" ] || continue
    enc="${f##*/spawn.}"
    member="${enc/__//}"
    id=""
    IFS=$'\t' read -r id _proj _type < "$f" || true
    if [ -z "$id" ]; then
      spawn_errors="${spawn_errors}error:\tunreadable-spawn-record\t${f}
"
      continue
    fi
    spawn_lines="${spawn_lines}${id}	${member}	${f}
"
  done
fi

# 所有者 instance id が生きているか。
# cc-instance.<pid> のどれかが id を含み、かつその pid が生存していれば生きている。
lock_owner_alive() {
  local owner="$1" f pid
  [ -n "$owner" ] || return 1
  for f in "$AGMSG_RUN"/cc-instance.*; do
    [ -f "$f" ] || continue
    grep -qF "$owner" "$f" 2>/dev/null || continue
    pid="${f##*.}"
    case "$pid" in ''|*[!0-9]*) continue ;; esac
    kill -0 "$pid" 2>/dev/null && return 0
  done
  return 1
}

# ---------- PANES ----------
echo "== PANES =="
if [ "$server" = up ]; then
  tmux list-panes -a -F '#{pane_id}|#{window_id}|#{session_name}|#{pane_current_command}|#{pane_pid}|#{pane_title}' 2>/dev/null |
  while IFS='|' read -r pane win sess cmd pid title; do
    if [ -z "$pane" ]; then
      printf '?\t?\tunknown\t?\t?\t?\n'
      continue
    fi
    member="$(printf '%s' "$spawn_lines" | awk -F'\t' -v p="$pane" -v w="$win" '$1==p || $1==w { print $2; exit }')"
    if [ -n "$member" ]; then label="agmsg:$member"; else label="manual"; fi
    # 自分自身のペインは掃除候補から外せるように self を付ける
    [ "$pane" = "${TMUX_PANE:-}" ] && label="$label,self"
    printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$pane" "$sess" "$label" "$cmd" "$pid" "$title"
  done
else
  echo "(none)"
fi

# ---------- STALE ----------
echo "== STALE =="
stale_out=""
[ -n "$spawn_errors" ] && stale_out="$spawn_errors"

live_ids=""
if [ "$server" = up ]; then
  live_ids="$( { tmux list-panes -a -F '#{pane_id}'; tmux list-windows -a -F '#{window_id}'; } 2>/dev/null )"
fi

# 1) spawn record が指す tmux id が存在しない
while IFS=$'\t' read -r id member f; do
  [ -n "$id" ] || continue
  if [ "$server" != up ] || ! printf '%s\n' "$live_ids" | grep -qxF "$id"; then
    stale_out="${stale_out}stale-spawn-record\t${member}\t${id}\t${f}
"
  fi
done <<EOF
$spawn_lines
EOF

# 2) watcher pid が死んでいる
for f in "$AGMSG_RUN"/watch.*.pid; do
  [ -f "$f" ] || continue
  pid="$(head -1 "$f" 2>/dev/null)"
  case "$pid" in ''|*[!0-9]*) pid="" ;; esac
  if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
    stale_out="${stale_out}stale-watch-pid\t${f}\tpid=${pid:-unreadable}
"
  fi
done

# 3) role-session に「生きた spawn record」も「生きた actas lock」もない
for f in "$AGMSG_RUN"/role-session.*; do
  [ -f "$f" ] || continue
  enc="${f##*/role-session.}"
  live=0
  sp="$AGMSG_RUN/spawn.${enc}"
  if [ -f "$sp" ]; then
    spid=""
    IFS=$'\t' read -r spid _p _t < "$sp" || true
    if [ -n "$spid" ] && [ "$server" = up ] && printf '%s\n' "$live_ids" | grep -qxF "$spid"; then
      live=1
    fi
  fi
  lock="$AGMSG_RUN/actas.${enc}.session"
  if [ "$live" = 0 ] && [ -f "$lock" ]; then
    owner="$(head -1 "$lock" 2>/dev/null)"
    lock_owner_alive "$owner" && live=1
  fi
  [ "$live" = 0 ] && stale_out="${stale_out}stale-role-session\t${enc/__//}\t${f}
"
done

if [ -n "$stale_out" ]; then
  printf '%b' "$stale_out"
else
  echo "(none)"
fi

# ---------- LIVE-GUARD ----------
# actas lock 一覧。alive のメンバーは現役 = 掃除候補に含めてはいけない。
echo "== LIVE-GUARD =="
guard_out=""
for f in "$AGMSG_RUN"/actas.*.session; do
  [ -f "$f" ] || continue
  enc="${f##*/actas.}"; enc="${enc%.session}"
  owner="$(head -1 "$f" 2>/dev/null)"
  if lock_owner_alive "$owner"; then st="alive"; else st="owner-dead"; fi
  guard_out="${guard_out}${enc/__//}\t${st}\t${owner:-unreadable}
"
done
if [ -n "$guard_out" ]; then
  printf '%b' "$guard_out"
else
  echo "(none)"
fi

exit 0
```

- [ ] **Step 2: 実行権限を付ける**

Run: `chmod +x ~/.agents/skills/tmux-manager/scripts/status.sh`

- [ ] **Step 3: 検証シナリオ① — fixture で stale 検出を確認**

fixture を作って実行する（実 run/ に触らない）:

```bash
FIX=$(mktemp -d)
# 存在しない pane %999 を指す spawn record
printf '%%999\t/tmp/proj\tclaude-code\n' > "$FIX/spawn.demo__worker"
# 死んだ pid の watch ファイル
echo 99999 > "$FIX/watch.deadsession.99999.pid"
# 対応する生きた実体のない role-session
printf 'session=x\nname=worker\nteam=demo\n' > "$FIX/role-session.demo__worker"
AGMSG_RUN="$FIX" ~/.agents/skills/tmux-manager/scripts/status.sh
rm -rf "$FIX"
```

Expected: STALE セクションに `stale-spawn-record  demo/worker  %999  ...`、`stale-watch-pid ... pid=99999`、`stale-role-session  demo/worker ...` の3行。LIVE-GUARD は `(none)`。exit 0。

- [ ] **Step 4: 検証シナリオ② — tmux 停止中の挙動**

Run: `AGMSG_RUN=$(mktemp -d) ~/.agents/skills/tmux-manager/scripts/status.sh; echo "exit=$?"`
Expected: `SERVER` に `tmux not-running`（または環境により `running`）、空 fixture なので STALE/LIVE-GUARD は `(none)`、`exit=0`。
（tmux サーバーが動いていた場合はこのシナリオはスキップし、シナリオ③で代替）

- [ ] **Step 5: 検証シナリオ③ — 手動セッションが manual で載る**

```bash
tmux new -d -s mgr-test
AGMSG_RUN=$(mktemp -d) ~/.agents/skills/tmux-manager/scripts/status.sh
tmux kill-session -t mgr-test
```

Expected: PANES に `%N  mgr-test  manual  ...` の行が出る。後片付けの kill-session 後、再実行すると消えている。

- [ ] **Step 6: 検証シナリオ④ — 実データで実行（読み取り専用の確認）**

Run: `~/.agents/skills/tmux-manager/scripts/status.sh`
Expected: 実 run/ の内容が出る。事前に把握済みの過去の残骸（role-session 2件のうち生きた実体がないもの）が STALE に載る。実行前後で `ls -la ~/.agents/skills/agmsg/run/ | md5` が変わらない（読み取り専用の実体確認）。

---

### Task 2: SKILL.md — トリガー・掃除フロー・安全規則

**Files:**
- Create: `~/.agents/skills/tmux-manager/SKILL.md`

**Interfaces:**
- Consumes: Task 1 の `scripts/status.sh` の4セクション出力形式
- Produces: skill 定義（frontmatter の name/description がトリガー判定に使われる）

- [ ] **Step 1: SKILL.md を書く**

````markdown
---
name: tmux-manager
description: tmux の状況可視化と残留掃除。「tmux の状況を見せて」「tmux で何が動いてる？」「エージェント生き残ってる？」「tmux/残骸を掃除して」「孤児ペインを消して」などで使用。tmux 全体と agmsg の状態を突合して報告し、ユーザー承認を得てから掃除する。
---

# tmux-manager — tmux の可視化と残留掃除

tmux が「裏で動いたまま」になる不安を解消するための skill。
収集は `scripts/status.sh`（読み取り専用・deterministic）が行い、
解釈・報告・掃除の対話はこの指示に従って Claude が行う。

## 手順

1. **収集**: `~/.agents/skills/tmux-manager/scripts/status.sh` を実行する。
2. **報告**: 出力を整形して全体像を報告する。ラベルの意味:
   - `agmsg:<team>/<name>` — agmsg が spawn したエージェントのペイン
   - `manual` — 手動作成のセッション/ペイン
   - `,self` サフィックス — このセッション自身のペイン
   - `unknown` — 突合不能（隠さずそのまま見せる）
3. **掃除候補の提示**: 以下を候補として一覧提示する。
   - `agmsg:` ラベルのうち LIVE-GUARD で `alive` でないもの（孤児エージェント）
   - `manual` のセッション（要否はユーザーに聞く。勝手に候補へ入れない）
   - STALE セクションの各ファイル
4. **human-gate（skip 不可）**: 対象一覧を見せてユーザーの明示承認を得る。
   「全部消して」と言われても、必ず一覧提示 → 承認の順を守る。
5. **実行**:
   - agmsg 管理下 → `~/.agents/skills/agmsg/scripts/despawn.sh <team> <from> <name>` を優先
     （graceful。`<from>` は自分の agmsg 名。応答しない/codex メンバーは `--force` を付ける）
   - 手動セッション → `tmux kill-session -t <name>` / ペイン単位は `tmux kill-pane -t '%N'`
   - stale ファイル → `rm <file>`
6. **検証**: `status.sh` を再実行し、対象が消えたことを出力の実体で確認して報告する。
   コマンドの exit 0 を根拠にしない。

## 安全規則（必ず守る）

- kill・rm の前に必ずユーザー承認（human-gate、skip 不可）
- LIVE-GUARD で `alive` のメンバーとそのペインは掃除候補に**含めない**（現役の誤殺防止）
- `,self` の付いたペイン（自分自身）は掃除候補に**含めない**
- agmsg 管理下のペインを直接 `kill-pane` しない（despawn.sh 経由。--force も despawn.sh の --force を使う）
- 掃除実行で1件失敗しても残りは続行し、失敗した対象を報告する

## 将来枠（未実装・提案しない限り触れない)

起動の定型化・セッション終了時の自動片付けはスコープ外。
求められたら設計書（docs/2026-07-16-tmux-manager-design.md）の将来枠を参照。
````

- [ ] **Step 2: frontmatter の妥当性確認**

Run: `head -5 ~/.agents/skills/tmux-manager/SKILL.md`
Expected: `---` で始まり、`name: tmux-manager` と `description:` が1行ずつある（YAML として単純な key: value のみ）。

---

### Task 3: 登録と統合確認

**Files:**
- Create: `~/.claude/skills/tmux-manager`（symlink）

**Interfaces:**
- Consumes: Task 1・2 の成果物一式
- Produces: Claude Code / Codex から発見可能な skill

- [ ] **Step 1: symlink で登録する**

既存スキルと同じ相対パス形式で張る:

```bash
ln -s ../../.agents/skills/tmux-manager ~/.claude/skills/tmux-manager
```

- [ ] **Step 2: symlink を検証する**

Run: `ls -la ~/.claude/skills/tmux-manager && ls ~/.claude/skills/tmux-manager/`
Expected: symlink が `../../.agents/skills/tmux-manager` を指し、`SKILL.md` `docs` `scripts` が見える。

- [ ] **Step 3: skill パス経由の実行確認**

Run: `~/.claude/skills/tmux-manager/scripts/status.sh | head -5`
Expected: `== SERVER ==` から始まる出力（symlink 越しに動く）。

- [ ] **Step 4: ユーザーへの引き継ぎ事項を報告する**

skill 一覧への反映は**次回セッション起動時**（スキル一覧はセッション開始時に読み込まれるため）。今セッションでも `status.sh` の直接実行で機能は使えることを伝える。

---

## Self-Review 結果

- **Spec coverage**: SERVER/PANES/STALE/LIVE-GUARD の4セクション → Task 1。掃除フロー・安全規則・human-gate → Task 2。配置と登録 → Task 3。テスト4シナリオ → Task 1 Step 3-6。将来枠は未実装（スコープどおり）
- **Placeholder scan**: コード・コマンド・期待値すべて実体を記載済み
- **Type consistency**: セクション名・ラベル文字列（`agmsg:` / `manual` / `,self` / `stale-*` / `alive`）は Task 1 の出力と Task 2 の参照で一致
