# スキル内ガードレールパターン

Claude Code スキル（SKILL.md）の中に「安全規律」として組み込むパターン集。
hook として外から差し込む代わりに、スキル自身が守る形で設計する。

対応する hook 実装は同じディレクトリの各スクリプトを参照（`kill-switch.sh` / `path-allowlist.py` / `rate-fuse.py` / `audit-log.py`）。

---

## パターン 1: 停止チェック（kill-switch）

```bash
if [ -f "$MAIN_ROOT/.claude/watch/STOP" ]; then
  echo "STOP ファイルを検出しました。実行を中止します: $MAIN_ROOT/.claude/watch/STOP"
  exit 0
fi
```

`$MAIN_ROOT/.claude/watch/STOP` が存在すれば即終了する。
worktree 同期・健全性チェックより**前**に実行する（スキル更新で挙動が変わっても止まれるよう）。

```bash
touch "$MAIN_ROOT/.claude/watch/STOP"  # 停止
rm    "$MAIN_ROOT/.claude/watch/STOP"  # 再開
```

---

## パターン 2: 起票上限（rate-fuse）

各スキルは1イテレーションあたりの新規起票・PR 作成数を `MAX_NEW_ISSUES` で上限制御する。

**デフォルト値**:
- detect-only スキル（Issue 起票のみ）: `MAX_NEW_ISSUES=5`
- action スキル（PR 作成・マージ・push を伴う）: `MAX_NEW_ISSUES=3`

呼び出し時に `max=N` 引数で上書きできる。

**計上タイミング**: `gh issue create` / `gh pr create` が成功した時点でカウントする。
**超過時**: 残りエントリを `deferred` として報告し、起票せず終了する（次回イテレーションで再評価）。

---

## パターン 3: 書込先宣言（path-allowlist）

各スキルは実行開始時に「書いてよい場所」を1行で宣言する。宣言外への書込は行わない。

| スキル種別 | 許可する書込先 |
|-----------|--------------|
| detect-only | `.docs/log/`・`.docs/audit/`・GitHub Issue/Label API |
| ci / conflict / merge | 上記 + git push（watch 由来ブランチのみ）・GitHub PR API |
| issue / review | 上記 + コードファイル（Issue で指定されたスコープのみ） |

---

## パターン 4: 監査ログ（audit-log）

`gh issue create` / `gh pr create` / `git push` を実行する**直前**に追記する。

```bash
mkdir -p "$MAIN_ROOT/.docs/audit"
printf '%s\n' \
  "{\"ts\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"skill\":\"<スキル名>\",\"action\":\"<create-issue|create-pr|push>\",\"target\":\"<URL またはブランチ名>\"}" \
  >> "$MAIN_ROOT/.docs/audit/watch-log.jsonl"
```

操作が失敗した場合は追記しない（成功した操作のみ記録）。
`.docs/audit/` は `.gitignore` 対象（ローカル台帳）。

---

## スキルへの挿入テンプレート

`## Workflow` の最初の節（worktree 同期・健全性チェック等）より**前**に挿入する。
節名を `### 前提: セーフガードチェック` とすることで既存の Phase 番号体系と衝突しない。

```markdown
### 前提: セーフガードチェック

`~/projects/naoto24kawa/standards/skill-patterns/guardrails.md` のパターンをこの順で適用する。

1. **停止チェック**: `$MAIN_ROOT/.claude/watch/STOP` が存在すれば即終了（worktree 同期より先）
2. **起票上限の初期化**: `MAX_NEW_ISSUES=<N>`（呼び出し引数 `max=N` で上書き可）。カウンタを 0 に初期化
3. **書込先の確認**: このスキルが書いてよい場所は `<許可先を1行で記す>` のみ
```

監査ログ（パターン 4）は各 write 操作の直前に都度実行するため、この挿入節には含めない。
