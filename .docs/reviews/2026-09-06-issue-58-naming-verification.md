# Issue #58 命名整合の検証

## 成功基準（検証前に固定）

委任仕様の rubric 1〜10 を正本とし、各コマンドをパイプなしで単独実行して終了コードと実出力を記録する。

| # | 成功基準 |
|---|---|
| 1 | guarantee 系の「台帳」は description の旧トリガーと各本文冒頭の旧称説明だけ。fixtures・scripts・README は 0 件 |
| 2 | sentinel / watch-sentinel の「台帳」の件数とファイル内容が origin/main と同じ |
| 3 | self-check.sh が exit 0 |
| 4 | 表のない一時ファイルは exit 0、最終行が `checked=0 broken=0 unpinned=0 指示=0 選択=0` |
| 5 | 存在しない LEDGER は `ERROR:` を出して exit 1 |
| 6 | 正例 fixture の checked / broken が origin/main と同じ |
| 7 | lens-review-cycle 正本と plugin コピーの `diff -r` が exit 0 |
| 8 | dev-tools の version `1.14.0` が指定の JSON 2 箇所に存在 |
| 9 | 正本の SKILL.md と cycle-log-format.md の「レビュードキュメント」が各 1 件 |
| 10 | 編集対象 SKILL.md が各 500 行以下、description が各 1024 文字以内 |

追加で、読めないファイルと rg の exit 2 を成功へ変換しないこと、fixture の構造・name・⑨移植限界・⑫の境界を保持することを確認する。

## 開始時の実体と裁定

- baseline: `f424c8cc3dd722f838605172ccd229417029481a`（開始時 HEAD = origin/main）、作業ツリー clean。
- 実ブランチ: `naoto24kawa/docs-58-naming-alignment`。司令塔は Orca が作成した名前の保持を裁定した。
- 委任仕様の rubric 6 をそのまま実行すると `ERROR: skills/guarantee-ledger/fixtures/guarantees.md が存在しない`、exit 1。checker は自身の親ディレクトリへ cd する。
- `LEDGER=fixtures/guarantees.md TEST_DIR=fixtures/tests bash skills/guarantee-ledger/scripts/check-guarantees.sh` は `checked=2 broken=0 unpinned=1 指示=1 選択=1`、exit 0。
- baseline の self-check は exit 0。正例は checked=2 / broken=0、負例は checked=0 / broken=3 / unpinned=3 / 指示=1 / 選択=1。負例の 3 件の BROKEN は意図した診断。
- 司令塔は rubric 6 を上記 ROOT 相対パスへ、rubric 4・5 の LEDGER を絶対パスへ補正することを裁定した。TEST_DIR は `fixtures/tests` に統一した。
- 司令塔は今回の委任仕様を正本として Issue #58 本文を同期した。再取得した本文で「レビュードキュメント」と checker の 0 行許容を確認した。

## 実装上の判断

- 既存の bash 組み込み `[ -r ]` と `case` で読取可否と rg の終了コードを分け、空レコードにも既存の集計処理を使う。依存・自前パーサーは追加しない。
- `self-check.sh` へ表のないレコードの確認を 1 ケース追加した。終了コードに加えて、全件数 0 の出力そのものを assert する。実装前の red control は exit 1、実装後は exit 0。
- marketplace 全体の version は `7.5.0` を据え置いた。CLAUDE.md の具体的な同期規定は `plugins[].version` と各 `plugin.json` の同値更新であり、全体 version の追加更新を求める規定はない。dev-tools の 2 箇所を同じ変更で `1.13.0` → `1.14.0` とした。
- 裁量による本文調整は⑧の追記に接続する句点だけ。スキル名・既存トリガー・フォルダ構造を維持した。

## 検証結果

実行日: 2026-09-06。以下の終了コードはコマンド単位で取得した。rg の exit 1 は該当なしを表し、負例の checker exit 1 も期待どおりの結果である。

| # | 実測値 | exit code |
|---|---|---|
| 1 | 許可された 5 行のみ。本文の旧称説明 3 行と、ledger / pin-check の description 2 行。fixtures・scripts・README は 0 件 | 主検索 0、0 件確認 1 |
| 2 | sentinel 1 行 / watch-sentinel 0 行。origin/main も 1 / 0、対象ファイルの差分なし | 現在の検索 0、baseline の検索 0、差分検査 0 |
| 3 | self-check: PASS、3 ケース。正例 checked=2 / broken=0、負例 checked=0 / broken=3、空レコード全件数 0 | 0 |
| 4 | `checked=0 broken=0 unpinned=0 指示=0 選択=0` | 0 |
| 5 | `ERROR: <一時ディレクトリ>/missing-record.md が存在しない` | 1 |
| 6 | `checked=2 broken=0 unpinned=1 指示=1 選択=1`。baseline と最終行全体が一致 | baseline 0、変更後 0 |
| 7 | 正本と plugin コピーの再帰差分 0 件 | 0 |
| 8 | `1.14.0` が plugin.json:3 と marketplace.json:14 の 2 件 | 0 |
| 9 | SKILL.md:202 と cycle-log-format.md:3 に各 1 件 | 0 |
| 10 | 下表のとおり。すべて上限以内 | wc 0、YAML 解析・長さ検査 0 |

| SKILL.md | 行数 | description 文字数 |
|---|---:|---:|
| skills/guarantee-ledger | 228 | 240 |
| skills/guarantee-interview | 192 | 274 |
| skills/guarantee-pin-check | 56 | 205 |
| skills/lens-review-cycle | 281 | 787 |
| plugins/dev-tools/skills/lens-review-cycle | 281 | 787 |

### 再現コマンド

cwd はリポジトリルート。各行を単独実行する。4・5 の `$record_tmp` は worktree 外で `mktemp -d` により作った絶対パスを使う。

```bash
# 1
rg -n '台帳' skills/guarantee-ledger skills/guarantee-interview skills/guarantee-pin-check README.md
rg -n '台帳' skills/guarantee-ledger/fixtures skills/guarantee-ledger/scripts README.md
# 2
rg -n '台帳' skills/sentinel skills/watch-sentinel
git grep -n '台帳' f424c8cc3dd722f838605172ccd229417029481a -- skills/sentinel skills/watch-sentinel
git diff --exit-code f424c8cc3dd722f838605172ccd229417029481a -- skills/sentinel skills/watch-sentinel
# 3
bash skills/guarantee-ledger/scripts/self-check.sh
# 4・5 の準備
record_tmp=$(mktemp -d)
printf '# x\n\n本文\n' > "$record_tmp/empty-record.md"
# 4
LEDGER="$record_tmp/empty-record.md" TEST_DIR=fixtures/tests bash skills/guarantee-ledger/scripts/check-guarantees.sh
# 5
LEDGER="$record_tmp/missing-record.md" TEST_DIR=fixtures/tests bash skills/guarantee-ledger/scripts/check-guarantees.sh
# 6（baseline のコマンドも開始時の同じ worktree・同じパスで実行）
LEDGER=fixtures/guarantees.md TEST_DIR=fixtures/tests bash skills/guarantee-ledger/scripts/check-guarantees.sh
# 7
diff -r skills/lens-review-cycle plugins/dev-tools/skills/lens-review-cycle
# 8
rg -n '"version": "1.14.0"' plugins/dev-tools/.claude-plugin/plugin.json .claude-plugin/marketplace.json
# 9
rg -n 'レビュードキュメント' skills/lens-review-cycle/SKILL.md skills/lens-review-cycle/references/cycle-log-format.md
# 10
wc -l skills/guarantee-ledger/SKILL.md skills/guarantee-interview/SKILL.md skills/guarantee-pin-check/SKILL.md skills/lens-review-cycle/SKILL.md plugins/dev-tools/skills/lens-review-cycle/SKILL.md
```

description は PyYAML で各 frontmatter を解析し、`len(description) <= 1024`、baseline と `name` および既存のトリガー列が一致することを assert した。`skill-creator/scripts/quick_validate.py` は上表の 5 ディレクトリへ個別実行し、すべて `Skill is valid!`、exit 0。

### 追加確認と限界

- 読取不可: 一時ファイルを mode 000 にし、実効 UID 501 で checker を実行。`ERROR: 保証レコードを読み取れない`、exit 1。
- rg の exit 2: 一時ディレクトリに「検証用: rg の読取エラー」を stderr へ出して exit 2 する rg を置き、そのコマンドだけ PATH の先頭へ追加。checker は元の stderr と `ERROR: 保証レコードの表を読み取れない` を出し、exit 1。成功の集計行は出ない。
- fixture は全 5 ファイルを baseline と突合し、語の置換以外の差分なし（変更 4、変更なし 1）。表・行・ID・出自の構造を保持した。
- ⑨の「移植限界」と⑫の `decision-test-chain` の境界は baseline とバイト一致。
- `rg -n '台帳' skills/` の残存は上記の許可された 5 行と sentinel の 1 行。旧称を含む他スキルからの見出し参照はない。
- `bash -n`（3 スクリプト）、JSON 2 ファイルの解析と version 一致、`git diff --check` は各 exit 0。
- self-check 負例の BROKEN 3 件は既存 baseline と同じ診断。checker の 0 行許容以外の意味検査・cochange ロジックは変更していない。
- 各マシンへの配布と cache 実体の確認、main へのマージはこの worker の実施範囲外。
