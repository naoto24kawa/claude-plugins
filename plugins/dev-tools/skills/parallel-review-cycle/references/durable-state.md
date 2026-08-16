# Durable State

レビューサイクルの進行状態を `REVIEW_DIR` へ落とし、中断後に同一対象から再開するための構造と規則。

## REVIEW_DIR の作成と安全検査

```bash
# worktree ごとの決定的パスを選ぶ
_worktree=$(git rev-parse --show-toplevel)
_wt=$(basename "$_worktree")
REVIEW_DIR="/tmp/review-cycle-${_wt}"

# 新規作成時は他ユーザーから読めない mode にする
if [ ! -e "$REVIEW_DIR" ]; then
  (umask 077 && mkdir "$REVIEW_DIR") || {
    printf 'review-cycle: REVIEW_DIR を作成できません: %s\n' "$REVIEW_DIR" >&2
    return 1 2>/dev/null || exit 1
  }
fi

# 再利用前に symlink・所有者・mode を fail-closed で検証する
_review_dir_ok=$(find "$REVIEW_DIR" -prune -type d -user "$(id -un)" -perm 700 -print 2>/dev/null)
if [ ! -d "$REVIEW_DIR" ] || [ -L "$REVIEW_DIR" ] || [ "$_review_dir_ok" != "$REVIEW_DIR" ]; then
  printf 'review-cycle: 安全でない REVIEW_DIR を拒否します: %s\n' "$REVIEW_DIR" >&2
  return 1 2>/dev/null || exit 1
fi

# cycle log への書き出し確認後、同じ安全検査を再実行してクリーンアップする
_review_dir_ok=$(find "$REVIEW_DIR" -prune -type d -user "$(id -un)" -perm 700 -print 2>/dev/null)
if [ ! -d "$REVIEW_DIR" ] || [ -L "$REVIEW_DIR" ] || [ "$_review_dir_ok" != "$REVIEW_DIR" ]; then
  printf 'review-cycle: cleanup 前の安全検査に失敗しました: %s\n' "$REVIEW_DIR" >&2
  return 1 2>/dev/null || exit 1
fi
rm -rf "$REVIEW_DIR"
```

main checkout では worktree basename が通常リポジトリ名になり、Orca 等の分離 worktree では worktree ディレクトリ名になる。同一 worktree 内で branch を切り替えた場合の古い状態は、下記の対象 HEAD・対象ファイル比較で退避する。

## 構造

```
$REVIEW_DIR/
  state.md
  fp-registry.md
  round-1/<role>.md
  round-2/<role>.md
```

`state.md` には次を記録する。

- 現ラウンド番号と状態（未完了 / 完了）
- 対象ファイルのリポジトリ相対パス一覧（集合比較できるよう辞書順）
- 対象 HEAD
- cycle ID と phase（`active` / `paused` / `terminal-pending` / `log-appended`）
- worktree の絶対パスと、対象ファイルごとの content fingerprint
- 修正事項ごとの状態（`pending` / `applied`）
- ロールごとの試行回数（0 / 1 / 2）と結果状態（pending / findings-received / failed）

`paused` は specialist の再試行失敗またはユーザー中断で意図的に保持した状態を指し、ログ追記も cleanup も行わない。これによりクラッシュで `active` のまま残った状態と区別できる。`terminal-pending` / `log-appended` は終了処理の checkpoint である。

## 再開判定

存在する通常ファイルの fingerprint は `present:<git hash-object -- path>`、存在しない削除対象は `absent` と記録する。対象パスの種別を判定できない場合は fail-closed で停止する。開始時に `state.md` の対象 HEAD、対象ファイル集合、worktree の絶対パス、content fingerprint を今回の値と比較する。

| 条件 | 動作 |
|---|---|
| すべて一致 | 再開する。完了済みラウンドをスキップし、未完了ラウンドでは有効な findings ファイルがあるロールを再ディスパッチしない |
| `state.md` はあるがいずれかが不一致 | `mv "$REVIEW_DIR" "${REVIEW_DIR}-abandoned-$(date +%s)"` で退避し、新規開始する |
| `state.md` が無い | 壊れた残骸として同様に退避し、新規開始する |

新規開始時はディレクトリと空の `fp-registry.md` を作り、最初のディスパッチ前に安定した cycle ID と `state.md` を書く。ディスパッチ前に `attempts` を増やし、findings 到着後に結果状態を更新する。再開時は valid findings がなく `attempts=1` なら2回目を実行し、`attempts=2` なら未完のまま停止する。

修正は `pending` を先に記録し、修正前 fingerprint と検証可能な期待状態も保存する。再開時は一般の fingerprint 不一致判定より先に `pending` を確認する。現在値が修正前 fingerprint と一致すれば再実行し、期待状態を満たせば `applied` と新 fingerprint を checkpoint する。どちらでもなければ状態を保持したまま fail-closed で停止する。`pending` がない説明不能な fingerprint 不一致だけを abandoned へ退避する。

## findings ファイルの有効性

有効な findings ファイルは、次をすべて満たすものに限る。

- 存在し、読取可能で、空でない
- 結論が `LGTM`、`LGTM／optional: ...`、または1件以上の flag のいずれかとして解釈できる
- 先頭行が `LGTM`、`LGTM／optional: ...`、または `flag N件` のいずれかである
- `flag N件` の場合、N と findings 内の `[ISSUE]` / `[AMBIGUITY]` / `[ALTITUDE]` ブロック数が一致する

条件を満たさないファイルは未作成と同じ失敗として扱い、ロール別の1回だけの再ディスパッチ規則へ送る。
