# agmsg 未読送信の可視化（v0）設計

## 概要

エージェント間メッセージ（agmsg）で「送ったのに受信側が一度も読まない＝未読で滞留」した状態を、**送信側に非ブロッキングで surface する** deterministic な hook を dev-tools plugin に追加する。可視化のみ。分類・自動復旧・再送は一切しない。

## 背景と痛点

- claude / codex の spawn・メッセージ送信がたまに失敗し、**気づかないことがある**（沈黙故障）。
- `send.sh` は fire-and-forget。`Sent to X` は「SQLite に INSERT した」であって「届いた／読まれた」ではない＝**偽成功シグナル**。
- 実運用で一番痛いのは復帰・再送が手動な点だが、その手前の「気づかない」を潰すのが 80/20 の核。

## Measure First で確定した事実（推測しない）

- agmsg の `messages` テーブルは既に `read_at` カラムと `idx_unread`（`read_at IS NULL` 部分索引）を持つ。
- 受信側が pull した瞬間、`inbox.sh:52` / `check-inbox.sh:156` が `read_at` を stamp する＝**transport 級の ack が既に存在する**。
- よって「送ったのに未読で滞留」は **DB を読むだけ**で検知でき、agmsg 本体の改造は不要。
- spawn 失敗は `spawn.sh` が既に readiness handshake で `status=timeout` / exit 3 を surface 済み → 二重に作らない。

## スコープ判断（なぜ v0 に絞るか）

自動復旧サブシステム（sidecar DB / rsend・rspawn ラッパ / 復旧ラダー / reconcile エンジン）は、
standards の解決手段優先順位で最下位の「自前実装」に相当し、かつ**失敗頻度を未計測**のまま建てるのは
Measure First を解決策自体に適用し忘れている＝オーバーエンジニアリング。
v0 で「沈黙故障→可視故障」に変え、**頻度を1週間 measure してから**自動化の要否を判断する。

## 非目標（v0 でやらないこと）

- sidecar/自前ストア、`rsend`/`rspawn` ラッパ、自動再送・自動 re-spawn、復旧の状態機械。
- liveness（tmux ペイン生死）判定。false-positive はデータで N を決めてから対処する。
- codex 側 sender の hook。一番痛い経路（orchestrator→codex への指示が未読）は Claude 側 Stop hook で捕まる。必要が実証されたら足す。
- spawn まわりの変更（既に exit 3 で surface 済み）。

## 機構

Claude Code の **Stop hook**（各ターン終了時に発火・**非ブロッキング**）で小スクリプトを実行する。

1. cwd から自分の agmsg identity を解決（`whoami.sh` と同じ経路、対話プロンプトなし）。未 join なら**何もせず exit 0**。
2. 未読の自送信を1クエリで抽出（UTC ISO8601 は辞書順＝時刻順なので文字列比較で可）:
   ```sql
   SELECT to_agent, count(*) AS n, min(created_at) AS oldest
   FROM messages
   WHERE from_agent IN (<自分の identity 群>)
     AND read_at IS NULL
     AND created_at < strftime('%Y-%m-%dT%H:%M:%SZ','now','-' || :N || ' seconds')
   GROUP BY to_agent;
   ```
3. 該当行があれば1行で surface（例: `⚠ agmsg 未読の送信: codex-impl 2件 (最古 6分前)`）。無ければ沈黙。
4. **計測**: 発火のたびに1行をログ追記（`ISO時刻, recipient, n, 最古age秒`）。これが v0 の本命成果。

### 確定した設計判断

| 項目 | 決定 | 根拠 |
|---|---|---|
| N（滞留閾値） | 暫定 **300s**、後決め | ログの age 分布の knee で決める。今 false-positive を先回りしない |
| 対象 | **Claude 側 sender のみ** | 最痛経路を Stop hook で捕捉。codex 送り手は必要実証後 |
| 家 | **dev-tools plugin**（新規スキルを作らない） | hook 1個＋スクリプト1本。20〜30行規模 |
| トリガ | **Stop hook・非ブロッキング（exit 0）** | 自律ターン境界でも発火。Stop を絶対にブロックしない（セッションを詰まらせない） |

### surface チャネルの未確定点（実装時に確定）

Stop hook で警告を可視化する正確な手段（stdout の FYI か JSON `systemMessage` か）は、実装時に
`plugin-dev:hook-development` skill の現行仕様に照らして確定する。**制約は非ブロッキングであること**（exit 2 で Stop を止めない）。
Stop の視認性が弱ければ `UserPromptSubmit`（stdout が次ターンの context に入る）併用を検討する。

## 変更一覧

| ファイル | 内容 |
|---|---|
| `plugins/dev-tools/hooks/hooks.json`（新規） | Stop フックに未読チェックスクリプトを command 型で登録（`${CLAUDE_PLUGIN_ROOT}` 参照） |
| `plugins/dev-tools/hooks/agmsg-unread-check.sh`（新規） | identity 解決 → 未読自送信クエリ → surface＋ログ追記。未 join・DB 不在・sqlite 失敗はサイレント exit 0 |
| `.claude-plugin/marketplace.json` | dev-tools のバージョンを `1.2.0` → `1.3.0` にバンプ |
| `README.md` | dev-tools の機能一覧に「agmsg 未読送信の可視化フック」を追記 |

## 成功基準（DoneCriteria）

1. 自分が送って未読・300s 超のメッセージがあるとき、Stop 後に1行の警告が surface される。
2. 未読が無い／未 join／DB 不在／sqlite エラー時は**サイレントに exit 0**（セッションを妨げない・偽陽性で騒がない）。
3. 発火のたびにログ（時刻・recipient・件数・最古age）が追記され、後日 `wc -l` / 集計で頻度を測れる。
4. `marketplace.json` の dev-tools version が上がり、`README.md` と整合する。
5. Stop を一度もブロックしない（exit 2 を返さない）。

## アンインストール

`hooks/hooks.json` からエントリを削る（またはスクリプト削除）だけ。agmsg 本体・DB・standards に残渣を残さない。

## Failure/Discipline（Harness Discipline 準拠）

- **fail-open（進行系）**: このフックは可観測性ゲートであり進行を止めない。identity 解決・DB オープン・クエリの失敗はすべて surface せず exit 0（沈黙）——通知が出ないだけで作業は継続。
- **偽成功/偽失敗**: `Sent to X` を信じず `read_at` の実体で判定。クエリはマスクや pipe を挟まず sqlite の生結果で判断。
- **上限/暴走なし**: ループを持たない単発パス。再送もしないので暴走面がない。

## 次段（データが要求したら）

1週間のログで頻度が高く手動再送が実際に苦痛なら、その一点だけ自動化を検討（YAGNI＝3回目で共通化）。
その際も agmsg 無改造・standards 側所有・上限＋surface の原則を維持する。
