# agent-toolkit

エージェント横断のスキル集（[skills.sh](https://www.skills.sh/) 互換）＋ Claude Code プラグインマーケットプレース。

| 役割 | 対象エージェント | インストール方法 |
|------|----------------|----------------|
| **Skills** (`skills/`) | Claude Code, Codex, Cursor ほか [skills CLI](https://github.com/vercel-labs/skills) 対応エージェント | `npx skills add elchika-inc/agent-toolkit -g` |
| **Plugins** (`plugins/`) | Claude Code 専用（hooks / commands / agents / MCP） | `/plugin marketplace add elchika-inc/agent-toolkit` |

## Skills

`npx skills add elchika-inc/agent-toolkit -g` で全スキルをインストール（`--skill <name>` で個別選択）。

| スキル | 概要 |
|--------|------|
| `parallel-review-cycle` | 専門家並行レビューを指摘ゼロまで反復するレビューサイクル |
| `agent-team` | TEAM モードの Role Contract（役割定義）と dev-cycle 連携 |
| `sentinel` | 品質＋セキュリティレビュー（3-vote 偽陽性フィルタ付き） |
| `watch-sentinel` | オープン PR への sentinel レビュー適用 |
| `watch-sprawl` | オープン PR への構造（import graph）分析 |
| `watch-sprawlens-update` | mizchi/sprawlens の上流更新チェック |
| `standards-audit` | elchika-inc/standards 準拠チェック |
| `documenting-verification` | 動作検証の実行と再現可能な検証資料の作成 |
| `tmux-manager` | tmux の状況可視化と残留掃除（human-gate 付き） |

### 更新の反映

正本はこのリポジトリの `skills/`。各マシンへは skills CLI で配布する。

```bash
# スキルを編集して push したあと、各マシンで
npx skills update -g
```

`~/.agents/skills/` 配下を直接編集しない（`skills update` で上書きされる）。

## Plugins（Claude Code 専用）

```bash
/plugin marketplace add elchika-inc/agent-toolkit
/plugin install dev-tools@naoto24kawa-claude-plugins
/plugin install elchika-tools@naoto24kawa-claude-plugins
```

> マーケットプレース名は既存インストールとの互換性維持のため `naoto24kawa-claude-plugins` のまま。

### dev-tools (v1.4.0)

開発プロセス基盤のオールインワン。

- **spec** — 9つのサブエージェント（Phase 0-8）による仕様書生成・差分更新・乖離検出
- **site-explorer** — Web アプリの探索的 QA テストと GitHub Issue 自動登録
- **tmux-manager** — tmux の可視化・残留掃除エージェント（`claude --agent` 起動用。手順の正本は `skills/tmux-manager`）
- **agmsg 未読送信フック** — 自分が送って未読で滞留した agmsg メッセージを Stop hook で surface（可視化のみ。`hooks/agmsg-unread-check.sh`）
  - 滞留 age が `AGMSG_UNREAD_STALE_SECS`（既定 300s）〜`AGMSG_UNREAD_MAX_AGE_SECS`（既定 24h）の範囲のものだけ通知する。上限は despawn 済み宛ての永久滞留を落とすためのもので、`0` で無効化できる
- **guardrails** — エージェントの安全装置。`kill-switch`（STOP ファイルで全ツール緊急停止）/ `path-allowlist`（書込先の制限）/ `rate-fuse`（呼び出し回数の上限）/ `audit-log`（実行の記録）と、hook でなくスキル本体へ組み込むときのパターン集（`hooks/guardrails/`）
  - **既定では配線しない**。ツール実行をブロックする挙動を含むため、使うときに `settings.example.json` を参照して明示的に配線する
- **skills** — `parallel-review-cycle`（`skills/` 側が正本、プラグインへは同期コピー）

### elchika-tools (v1.0.0)

ローカル MCP サーバー。テキスト変換・エンコード/デコード・フォーマット・暗号・生成系の34ユーティリティ。データは外部送信されない。

## ライセンス

MIT
