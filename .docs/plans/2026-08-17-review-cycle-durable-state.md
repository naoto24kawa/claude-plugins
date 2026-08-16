# parallel-review-cycle durable state 設計メモ

## 目的

`parallel-review-cycle` の進行状態をセッション外へ保存し、中断後に同一対象から再開できるようにする。あわせて、完了したサイクルの偽陽性を安全条件付きで次サイクルへ引き継ぎ、TypeScript コードレビューでは `ts-review-graph` の最小コンテキストを任意の起点として利用する。

## 判断

- 作業中の状態は `/tmp/review-cycle-<worktree basename>` に置く。委任仕様の当初案である `repo basename + branch` は、Orca worktree では repo 名でなく worktree 名を取得して名前が二重になることが実測で判明した。司令塔裁定により branch 成分を落とし、worktree ごとの分離を優先した。
- `state.md` は再開判定とラウンド進捗、`round-N/<role>.md` は specialist の生データ、`.docs/reviews/review-cycle-log.md` は完了したサイクル間の学習に責務を分ける。reference も同じ軸で分け、`durable-state.md` が `REVIEW_DIR` の生成・安全検査・再開・findings 有効性を、`fp-registry-format.md` が FP の形式・照合・carry-over を持つ。
- state の phase は `active` / `paused` / `terminal-pending` / `log-appended` の4値とする。`paused`（再試行失敗・ユーザー中断で意図的に保持）が無いと、クラッシュで `active` のまま残った状態と区別できない。
- specialist の欠落はレビューゲートの判定不能なので fail-closed とする。一方、`ts-review-graph` はコンテキスト供給だけを担うため、利用不能でも従来のレビューを続ける fail-open とする。
- `ts-review-graph` が返すファイル集合は「まず読むべき起点」であり、レビュー可能範囲の制約にはしない。最小集合だけに限定すると、横断的な欠陥を見落とすためである。
- 偽陽性の横断引き継ぎは、記録 HEAD が実在し、対象ファイルがその HEAD 以降に変更されていない場合だけ許可する。判定不能または `N/A` は引き継がない。
- `Write` を持つ specialist が対象外ファイルへ書く可能性への備えは、**ステップ4冒頭の `git status` 確認1行**に留める。レビュー中に一度は worktree 全体 snapshot の比較機構を入れたが、`.DS_Store` やエディタの swap ファイルが1つ現れるだけでラウンドが止まる誤停止経路があり、レビュースキルの責務でもないため司令塔裁定で削除した。
- carry-over の読み取りは fail-open、個々の FP の引き継ぎ判定は fail-closed とする。ログが壊れているだけでサイクル自体が回らなくなる経路を作らないため、両者を明確に分ける。
- terminal ログは cycle ID と start / end marker を持ち、`terminal-pending` → `log-appended` の checkpoint で重複追記と部分追記を検出する。

## 解決手段の優先順位と降格理由

- 状態保存には Git や外部サービスの追加機構を導入せず、既存のファイルシステムと Git コマンドを使う。サイクル中の一時状態と完了後のリポジトリ履歴を分離でき、追加依存が不要なためである。
- `ts-review-graph` は既存 MCP ツールを条件付き利用し、自前の依存グラフ解析は実装しない。
- ログ解析専用スクリプトは追加しない。現時点の要件は Markdown の最新エントリと少数の偽陽性を扱うだけで、スクリプトの保守コストを正当化しないためである。

## 完了基準 rubric

1. `skills/parallel-review-cycle` と `plugins/dev-tools/skills/parallel-review-cycle` の再帰差分がない。
2. `SKILL.md` から参照するすべての `references/*.md` が実在する。
3. 決定的 `REVIEW_DIR` 生成と、偽陽性 carry-over の HEAD・対象ファイル判定をこの worktree で実行できる。
4. `SKILL.md` は要約と参照ポインタを中心とし、変更前234行から大幅に増えず、500行上限を満たす。
5. `ts-review-graph` が無い、stale、未接続の場合に従来のレビューを続けることが明記されている。

## 対象外

- レビューモデル、Checker 不要論、5名構成の根拠、レンズ構成 router、最大ラウンド数10は変更しない。
- `standards` リポジトリは変更しない。
- レンズ別実績に基づく自動的な構成変更は行わない。
- マージ後に必要な `npx skills update -g` は本作業では実行しない。

## 今回のレビュー実行環境

この worker は Orca Dispatch 配下だが、子 Task を作成する coordinator Run は bind されていない。司令塔裁定により、Codex の collaboration subagents を `Agent` 相当として使い、同一 worktree 上で最大3並列の波状実行を行う。specialist は対象ファイルを読み、各自の findings ファイルだけを書き、製品ファイルの修正はオーケストレータが単独で行う。実行モデルはこの Codex セッションの既定モデルであり、Opus 7並列ではない。

## ACCEPTED_RISKS

- **同一 worktree の同時サイクル**: 決定的パスは1 worktree につき1つであり、汎用 agent 環境にはサイクル所有者を証明できる共通 lease ID がない。同一 worktree では同時に1サイクルだけという運用契約を採用し、既存状態が別の稼働中サイクルか判定できない場合は停止する。独自 lock / lease 実装は本タスクの要件外で、誤った stale 判定が再開可能性を壊すため追加しない。
- **リポジトリ内ログの真正性**: carry-over は委任仕様どおり「HEAD 実在＋対象ファイル未変更」を必須にし、dirty worktree も未変更判定へ含める。ただし、信頼済み base ref や署名を追加条件にはしないため、過去のコミット権限を持つ攻撃者によるログ poisoning は完全には防げない。ログを対象リポジトリに置く明示要件と2条件を維持し、PRで履歴を人間が確認する前提で受容する。
- **specialist が control state を書き換えうる（R3 #1 / #3 却下）**: specialist に渡す `Write` は role 固有の findings パス以外にも到達しうる。`REVIEW_DIR` は実行ユーザー所有の mode 0700 であることを symlink 検査つきで確認しており、`/tmp` 共有領域という実在する攻撃面はここで塞がっている。その内側で findings ファイルごとに owner / mode / regular file を再検証しても、守る相手は「自分が起動した自分のサブエージェント」であり、信頼境界の外側からの攻撃を防ぐわけではない。path-scoped writer は汎用 agent 環境に共通の仕組みが無く、実装すれば本タスクの範囲を超える機構を新設することになる。受容し、specialist が対象外へ書いた場合はステップ4冒頭の `git status` 確認で気づく設計とする。
- **SKILL.md 本体の裸の `rm -rf "$REVIEW_DIR"`（R3 #4 却下）**: reference 側の安全検査つき cleanup を迂回できる形で本体に残っている。迂回する主体はオーケストレータ自身であり、`REVIEW_DIR` は同ステップ内で決定的に生成した自分の所有ディレクトリである。本体を検査つきの長いスニペットに差し替えると「SKILL.md は要約＋ポインタ」という成功基準4と衝突するため、本体は最小の掲示に留め、正本を `references/durable-state.md` に置く形で受容する。
- **cycle ID の生成・再利用規則を規定しない（R3 #6 却下）**: 衝突困難な ID 生成規則も resume 時の再利用手順も明文化していない。サイクルの同一性は「決定的な `REVIEW_DIR` パス＋`state.md` の対象 HEAD・対象ファイル集合・content fingerprint」が既に担っており、cycle ID はログの追記冪等性のためのラベルにすぎない。実際の運用では task / dispatch ID のように呼び出し側が持つ安定 ID をそのまま使えるため、独自の採番規則を足すのは重複機構になる。受容する。
- **cycle-log 追記経路は fail-closed のまま（R3 #7 の残り）**: 読み取り（carry-over）は fail-open へ倒したが、`cycle-log-format.md` の追記手順で「同じ cycle ID の start だけがある部分エントリ」を検出した場合は停止する規定を残している。これは書き込み前のゲートであり、部分追記の上へさらに追記するとログが壊れるため。停止しても現サイクルの成果物（findings・修正）は失われず、`REVIEW_DIR` も保持される。

## レビュー記録

最大3ラウンドを実行したが、R3で9件の flag が残ったため、委任仕様の上限で打ち切った。

| ラウンド | flag 件数 | 結果 |
|---|---:|---|
| R1 | 16 | 状態遷移、findings 完全性、carry-over、`REVIEW_DIR` 安全境界を修正 |
| R2 | 14 | crash 境界、untracked、path 表現、cleanup fail-closed、worktree snapshot を修正（snapshot は完了ゲートで削除） |
| R3 | 9 | Security 3 / Tests 1 / Domain 2 / Ambiguity 3。Core Logic と Fresh Eyes は LGTM、Altitude は R1 LGTM 後に規定どおり省略 |

### R3 の未解決 flag と判定

R3 で残った7件は司令塔の完了ゲートで精査し、次のとおり裁定した。追加のレビューサイクルは実行していない。

| # | 指摘 | 判定 | 根拠 |
|---|---|---|---|
| 1 | specialist の `Write` が control state へ届く | 却下 | `REVIEW_DIR` は自分が所有する mode 0700。symlink + owner + mode の検査が `/tmp` 共有領域の実在する攻撃面をカバーしている。その内側で per-file の owner / mode を検証するのは自分の道具に対する防御であり、flag の定義（correctness・セキュリティ・明示要件への影響）を満たさない |
| 2 | worktree snapshot に ignored / metadata / Git state が含まれない | moot | 拡張対象の snapshot 機構そのものを削除した |
| 3 | findings path の実体検証不足（regular file / symlink / owner / mode） | 却下 | #1 と同じ |
| 4 | SKILL.md 本体の裸の `rm -rf` | 却下 | #1 と同じ。迂回する主体は自分自身 |
| 5 | paused phase が state schema にない | 修正 | 実在する不整合。SKILL.md ステップ6 は `paused` を使うが、phase enum が3値だった |
| 6 | cycle ID の生成・再利用規則が不足 | 却下 | 決定的パス＋state fingerprint が同一性そのもの。学習ログは既に task / dispatch ID を持つ |
| 7 | 部分 cycle-log entry で永久停止 | 修正 | 唯一の実バグ。carry-over の読み取りを fail-open にした |

打ち切りの判断はレビュー実施者側で完結させ、却下4件は下記 ACCEPTED_RISKS に根拠つきで記録する。

## 完了時の実測（判定反映後に再実行）

構成が変わったため、レビュー打ち切り時点の実測値は無効として全項目を取り直した。

1. `diff -rq skills/parallel-review-cycle plugins/dev-tools/skills/parallel-review-cycle` → 出力なし、exit 0。
2. `SKILL.md` から参照される `references/*.md` は8件（`agent-output-principles` / `altitude-checker` / `ambiguity-hunter` / `cycle-log-format` / `durable-state` / `fp-registry-format` / `minimal-context-feeder` / `specialist-roles`）。`test -f` は全件 exit 0。`references/` 配下からの相互参照4件も全件 exit 0 で、宙吊り参照・孤立ファイルはない。
3. 決定的パス生成 → `REVIEW_DIR=/tmp/review-cycle-review-cycle-durable-state`、exit 0。隔離ディレクトリでの初期化試験は `mkdir` exit 0・`find` の安全検査が自パスに一致・mode `drwx------`・`touch fp-registry.md` exit 0・cleanup exit 0（空レジストリに対する `grep -c` は count 0 / exit 1 を返すため、reference の `|| echo "0"` が必要）。carry-over 判定は、HEAD 実在 exit 0 / 不在 SHA exit 128、未変更ファイル（`ambiguity-hunter.md`）は全 diff exit 0・`status` 出力なしで引き継ぐ経路、変更済みファイル（`SKILL.md`）は `git diff --quiet <head>` exit 1・`status` が ` M` で引き継がない経路、untracked（`durable-state.md`）は `git cat-file -e <head>:<path>` exit 128 で引き継がない経路を通った。
4. `wc -l skills/parallel-review-cycle/SKILL.md` → 250行（変更前234行、+16行）。詳細は `fp-registry-format.md` 125行 / `durable-state.md` 84行 / `cycle-log-format.md` 38行の reference 側にある。
5. graph 無し / stale / MCP 未接続の3ケースすべてに「現行のレビュー動作を継続する」が `SKILL.md` と `minimal-context-feeder.md` に実在。
6. `grep -rn snapshot skills/parallel-review-cycle/` → 該当なし（exit 1）。snapshot 機構は残っていない。
7. `ls -d /tmp/review-cycle-*` → 9個。uuid 形式1個、`mktemp` サフィックス形式8個。いずれも完了時の `rm -rf` に到達せず死んだサイクルの痕跡であり、ランダム名のため誰も再開できなかった。本変更が解こうとしている問題の実在証拠。

`skills` CLI の validator は既存どおり `Unexpected key(s) in SKILL.md frontmatter: effort, model` を返す。除外事項により frontmatter を変更していないため、互換 validator の既知制約として記録する。
