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

---

# v1: 滞留 age の上限を追加（2026-07-31 / dev-tools 1.3.1）

v0 が「後決め」としていた閾値を、溜まったログの実測で確定した。

## 観測

計測ログ 7日分・15,711行・発火 1,236 回の age 分布:

| age バケット | 記録行数 | 割合 |
|---|---|---|
| < 1h | 377 | 2% |
| 1h〜24h | 2,450 | 16% |
| 1d〜7d | 7,483 | 48% |
| > 7d | 5,401 | 34% |

**1日超が 82%**。その滞留分（自送信 32 件・最古 365 時間）を明細で確認したところ:

- 内容は全件が「【終了確認】」「完了ゲート通過」「撤収してほしい」等の**作業完了・撤収通知**
- 宛先は全件が **despawn 済み**（`team.sh` 実測で moonqr / v5-partners / takometa / naoto24kawa いずれもメンバーは自分1名のみ）

## 判断

宛先が離脱すると `read_at` は**永久に NULL** のまま残る。この状態で警告文が促す「相手の生存確認 / 再送」は**実行主体が存在せず、取れるアクションがない**。
v0 の下限（300s）だけでは、これが恒久ノイズとして毎ターン surface され続ける（alert fatigue でフック全体が無視されるようになる）。

| 項目 | 決定 | 根拠 |
|---|---|---|
| 滞留 age の**上限** | **86,400s（24h）**、`AGMSG_UNREAD_MAX_AGE_SECS` で可変・`0` で無効 | 分布の knee が 1d。24h 超は全件 despawn 済み宛てでアクション不能 |
| 下限 N | **300s のまま据え置き** | 「稼働中の相手が数分〜数時間読んでいない」という本来の検出力はここが担う。分布の 18%（<24h）は正当な発火 |
| 宛先の生存フィルタ | **採らない** | 今回のデータでは 24h 上限と結果が一致し、team config 読取と fail-open 分岐でフックが太る（YAGNI） |
| 既存滞留分の既読化 | **しない** | 上限導入で自動的に窓外へ出る。DB を書き換えないので agmsg の履歴が無傷 |

## 設定ミス時の挙動（fail-open）

上限 ≤ 下限に設定すると抽出窓が空になり、「未読ゼロ」と見分けのつかない無出力に化ける。
これは Harness Discipline の「握りつぶしで 0 件化」に当たるため、その場合は**上限を無効化して全件 surface** する（可視化フックは進行系＝検出側に倒す）。

## 検証（実測・6ケース）

| # | 条件 | 期待 | 結果 |
|---|---|---|---|
| 0 | `bash -n` | 構文 OK | exit 0 |
| 1 | 既定 24h | 無出力（滞留は全件 43h 超） | 0 バイト・exit 0 |
| 2 | 上限 50h | 43〜48h の 7 件のみ残り、54.7h の `segopt` は落ちる | 期待どおり（窓が両側で機能） |
| 3 | 上限 0（無効） | v0 と同一の 21 宛先 | 宛先リストが baseline と `diff` 完全一致 |
| 4 | 上限 `abc`（不正値） | 既定 24h に落ちる | 無出力・exit 0 |
| 5 | 上限 100（≤ 下限） | 静かな 0 件化ではなく全件 | 21 宛先を surface |

ケース 1 の「無出力」単独では*フックが壊れて常に 0 件*でも同じ結果になるため、ケース 2・3 を正の検証として対にしている。
