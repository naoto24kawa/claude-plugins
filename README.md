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
| `lens-review-cycle` | 複数の専門レンズを 1 名のレビュアーに順に当て、指摘ゼロまで反復するレビューサイクル |
| `agent-team` | TEAM モードの Role Contract（役割定義）と dev-cycle 連携 |
| `sentinel` | 品質＋セキュリティレビュー（3-vote 偽陽性フィルタ付き） |
| `watch-sentinel` | オープン PR への sentinel レビュー適用 |
| `watch-sprawl` | オープン PR への構造（import graph）分析 |
| `watch-sprawlens-update` | mizchi/sprawlens の上流更新チェック |
| `standards-audit` | elchika-inc/standards 準拠チェック |
| `standards-sweep` | セッション終了前の宙吊り状態の検出（git / 共有状態 / dispatch 済み worker） |
| `documenting-verification` | 動作検証の実行と再現可能な検証資料の作成 |
| `delegation-spec` | worker へ渡す委任仕様の必須7節と検証チェックリスト |
| `dreaming` | ルール文書の棚卸し（肥大化・陳腐化・overfit の剪定） |
| `guarantee-ledger` | 壊してはいけない約束を宣言する保証台帳の文書規約と雛形 checker |
| `guarantee-pin-check` | 保証を意図的に壊して裏付けテストが赤くなることを確認する pin 確認手順 |
| `guarantee-interview` | 出自を持たない振る舞いを人間へ問うて裁定し、保証台帳へ昇格させる手順 |

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

### dev-tools (v1.7.0)

開発プロセス基盤のオールインワン。

- **site-explorer** — Web アプリの探索的 QA テストと GitHub Issue 自動登録
- **verification-documenter** — 動作検証を実行して手順・結果・エビデンスを再現可能な資料として残すエージェント（証跡の既定保存先は `.docs/reviews/`）
- **guardrails** — エージェントの安全装置。`kill-switch`（STOP ファイルで全ツール緊急停止）/ `path-allowlist`（書込先の制限）/ `rate-fuse`（呼び出し回数の上限）/ `audit-log`（実行の記録）と、hook でなくスキル本体へ組み込むときのパターン集（`hooks/guardrails/`）
  - **既定では配線しない**。ツール実行をブロックする挙動を含むため、使うときに `settings.example.json` を参照して明示的に配線する
- **skills** — `lens-review-cycle`（`skills/` 側が正本、プラグインへは同期コピー）

> v1.6.0 で tmux-manager と agmsg 未読送信フックを撤去した（エージェント間連絡の agmsg → Orca orchestration 移行に伴う。standards rev.63）。

> v1.7.0 で spec（文書生成の9エージェントと専用 references）を撤去した。スキル本体は 2026-06-13 に削除済みで、エージェントは起動経路を失ったまま残置されていた。

### elchika-tools (v1.0.0)

ローカル MCP サーバー。テキスト変換・エンコード/デコード・フォーマット・暗号・生成系の34ユーティリティ。データは外部送信されない。

## ライセンス

MIT
