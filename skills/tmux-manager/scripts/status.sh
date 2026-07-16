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
