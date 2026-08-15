---
trigger: manual
created: 2026-08-12
autonomy: manual
---

# Agent Plugins 仕様 (agent-plugins.org v1.0.0) への追随判断

2026-08-12 に調査。**結論: 現時点では追随しない。下記の監視トリガーが引かれたら加算的に対応する。**

## Agent Plugins v1.0.0 とは

Vercel が提案し、AWS / Anysphere（Cursor）/ GitHub / Microsoft / OpenAI / Vercel の representatives が協働で策定したベンダー中立のプラグイン梱包標準。初期 TSC は AWS / Cursor / Microsoft / OpenAI / Vercel の Core Maintainers で構成される。Agent Skills と MCP サーバーを1つのディレクトリに束ねる規約のみを定め、**インストール・配布・マーケットプレース・ポリシー・クライアント固有機能はすべてスコープ外**。

```
my-plugin/
├── plugin.json          # 必須。必須フィールドは $schema と name のみ
│                        #   name: 1-64文字、小文字英数字・ハイフン・ピリオド
│                        #   任意: version, description, author, homepage,
│                        #         repository, license, keywords, extensions
├── skills/<name>/SKILL.md   # Agent Skills 仕様準拠。非再帰探索（直下の子のみ）
├── mcp.json             # $schema + mcpServers。stdio / streamable-http / sse(deprecated)
└── com.example.client/  # クライアント固有拡張（リバースドメイン名前空間）
                         # 未実装の名前空間はクライアントが検証せず無視する
```

## このリポジトリとの差分（2026-08-12 実測）

| 項目 | agent-toolkit の現状 | Agent Plugins v1.0.0 | 差分 |
|---|---|---|---|
| 横断スキル | `skills/<name>/SKILL.md`（11個） | 同じ | **既に一致** |
| プラグイン内スキル | `plugins/dev-tools/skills/` | 同じ | **既に一致** |
| プラグイン manifest | `plugins/*/.claude-plugin/plugin.json` | プラグインルート直下の `plugin.json` | 位置が違う |
| MCP 定義 | `plugins/elchika-tools/.mcp.json` | `mcp.json`（先頭ドット無し） | ファイル名が違う |
| agents / commands / hooks | `plugins/dev-tools/` 配下に実在 | portable な置き場が存在しない | 拡張名前空間へ退避が必要 |
| marketplace | `.claude-plugin/marketplace.json` (v7.0.0) | 概念自体が存在しない | 対応物なし |

つまり**価値の中心である skills 層はすでに準拠済み**で、不足しているのは薄い封筒（plugin.json）だけ。

### 他エージェント側が実際に何を読むか（2026-08-13 実測）

Codex v0.145 に当リポジトリの marketplace（`naoto24kawa-claude-plugins`）を追加し、`dev-tools` を導入して実測した。

- **読まれた**: `plugins/dev-tools/skills/` のスキルのみ（`dev-tools:parallel-review-cycle` として露出）
- **読まれなかった**: `agents/`（spec Phase 0-8・site-explorer・verification-documenter）、`commands/`
- **副作用**: 横断 `skills/` 経由で既に配布済みの `parallel-review-cycle` と二重に見え、スキル枠を圧迫した

上表の「agents / commands / hooks は portable な置き場が存在しない」を、仕様上だけでなく**実装上も**裏付ける結果。Claude 以外のクライアントは現状 skills 層しか消費しないため、agents / commands を portable 化する動機は仕様側にも実装側にも無い。逆に skills 層は Claude 形式のままでも他エージェントへ届いており、この点でも追随の緊急性は低い。

検証後、導入は完全にロールバックした（Codex 側 `config.toml` は導入前と diff ゼロ）。

## 追随しない理由

1. **読み手がいない。** このリポジトリの出荷経路は skills CLI（`npx skills update -g`）と Claude Code marketplace の2つ。**2026-08-13 の再確認で、次の3点を実測した。**
   - Agent Plugins の初期 TSC は AWS / Cursor / Microsoft / OpenAI / Vercel で、Anthropic は TSC にも1.0.0策定の collaborators にも不在だった。
   - `anthropics/claude-code` の `CHANGELOG.md` に、「Agent Plugins」、`agent-plugins`、プラグインルート直下の `plugin.json` への言及はなく、Claude Code のネイティブ対応は確認できなかった。
   - `vercel-labs/skills`（skills CLI）は Agent Plugins 形式を採用しておらず、むしろ `.claude-plugin/plugin.json` を Plugin Manifest Discovery に使用している。エコシステム側のツールが現行構成と噛み合っており、追随の緊急性は低い。

   **この3点は揮発性が高いので、本 action を実行する際は必ず再確認する。**
2. **モノレポの形が合わない。** 仕様は「1プラグイン = 1ディレクトリ + ルート plugin.json」モデル。当リポジトリは2つのプラグイン + トップレベル横断 `skills/` を marketplace.json で束ねた構造で、その束ね方に対応する概念が仕様側に無い。採用するならリポジトリルートではなく `plugins/*` 各ディレクトリ単位。
3. **同期コストが増える。** `.mcp.json` を `mcp.json` にリネームすると Claude Code が読めなくなるため両方置く＝二重管理。当リポジトリは既に `parallel-review-cycle` の同期コピー規約という手動同期を1本抱えている。

## 監視トリガー（いずれか1つで本 action を起動する）

**2026-08-13 再確認: 以下3つのトリガーはすべて未達。**

- [ ] Claude Code が Agent Plugins のネイティブ対応を発表した
- [ ] skills CLI（vercel-labs/skills）がこの形式を採用した ← **Vercel 発案のため最も先に来る可能性が高い**
- [ ] Anthropic が TSC に参加した

## 実行時の手順（加算的移行）

仕様公式の example リポジトリも「既存の動作するファイルを消さずに `plugin.json` を追加して検証する」加算的アプローチを推奨している。

1. 上記「追随しない理由 1」の3つの事実（Anthropic の TSC 参加状況 / Claude Code のネイティブ対応状況 / skills CLI の Agent Plugins 形式採用状況）を再確認する
2. `plugins/dev-tools/plugin.json` を追加（`.claude-plugin/plugin.json` と併存させ、削除しない）
3. `plugins/elchika-tools/plugin.json` を追加（同上）
4. `plugins/elchika-tools/mcp.json` を追加（`.mcp.json` と併存。transport type を明示する）
5. agents / commands / hooks は portable な置き場が無いため、`.claude-plugin/` 側に残すか拡張名前空間へ寄せるかを決める
6. **両方の経路（skills CLI / Claude Code marketplace）で実際にインストールできることを実測してから**、旧ファイルの削除可否を判断する
7. marketplace.json のバージョンをバンプする（CLAUDE.md の編集ルール）

## 出典

- https://agent-plugins.org/
- https://github.com/agentplugins/agent-plugins-spec/blob/main/spec/1.0.0.md
- https://github.com/agentplugins/agent-plugins-example （移行ガイド）
- https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
- https://github.com/vercel-labs/skills
- https://vercel.com/blog/introducing-agent-plugins
- https://agent-plugins.org/plugin-authors
