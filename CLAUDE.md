# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## リポジトリの役割

**agent-toolkit** — 2つの配布物を持つモノレポ:

1. **`skills/`** — エージェント横断スキル（skills.sh / vercel-labs/skills CLI 互換）。Claude Code・Codex 等へ `npx skills add naoto24kawa/agent-toolkit -g` で配布される。**スキルの正本はここ**。`~/.agents/skills/` はインストール先であり編集しない。
2. **`plugins/`** — Claude Code プラグインマーケットプレース（`.claude-plugin/marketplace.json` が定義の正本）。

## ディレクトリ構造

```
.
├── .claude-plugin/
│   └── marketplace.json        # マーケットプレース定義（plugins/ の正本）
├── skills/                     # エージェント横断スキル（skills CLI が発見する場所）
│   └── <name>/SKILL.md         # + references/ 等
└── plugins/
    ├── dev-tools/              # agents/ (spec Phase 0-8, site-explorer), commands/, skills/
    └── elchika-tools/          # ローカル MCP サーバー (34ツール)
```

## 編集ルール

### skills/ 変更時
1. `skills/<name>/` を編集して push
2. 各マシンで `npx skills update -g` を実行して反映（自動では反映されない）
3. `parallel-review-cycle` を変更したら **`plugins/dev-tools/skills/parallel-review-cycle` へ同期コピー**する（`cp -R skills/parallel-review-cycle/ plugins/dev-tools/skills/parallel-review-cycle/`）。プラグイン側を直接編集しない
4. ルート `README.md` のスキル一覧と整合を取る

### plugins/ 変更時
1. `plugins/<プラグイン名>/` 配下を編集
2. marketplace.json のバージョン番号をインクリメント（スキル/エージェント追加削除時）
3. ルート `README.md` のプラグイン一覧と整合を取る

### marketplace.json の name は変更しない
`naoto24kawa-claude-plugins` はローカルの `installed_plugins.json` / `settings.json` にキーとして参照されており、変更すると既存インストールが孤立する。リポジトリ名とは独立。

### スキルの構造規約
- SKILL.md: YAML frontmatter 必須（`name`, `description`）
- description: トリガーワード含有、1024文字以内、三人称形式
- 行数上限: SKILL.md は 500行以下
- 外部参照: 1階層まで（SKILL.md → references/ 等）
- エージェント固有の絶対パスを書かない（`~/.claude/skills/` や `~/.codex/skills/` ではなく `~/.agents/skills/` を参照する）

## 整合性の維持対象

| 変更箇所 | 同期先 |
|----------|--------|
| skills/ のスキル追加・削除 | README.md のスキル一覧 |
| skills/parallel-review-cycle | plugins/dev-tools/skills/parallel-review-cycle（同期コピー） |
| marketplace.json の plugins 配列 | README.md のプラグイン一覧 |
| ディレクトリ構造変更 | CLAUDE.md のディレクトリ構造セクション |

## Git ワークフロー

- メインブランチ: `main`
- marketplace.json の変更はバージョン番号の更新を伴う
- スキル/エージェント/コマンドは自動検出されるため marketplace.json への個別登録は不要
