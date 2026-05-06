# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## リポジトリの役割

Claude Code プラグインマーケットプレース。8つのプラグインを `plugins/` 配下に格納する。

## プラグイン構成 (信頼できるソース: `.claude-plugin/marketplace.json`)

| プラグイン | バージョン | コンポーネント | カテゴリ |
|-----------|-----------|--------------|----------|
| automation | 1.0.0 | agents:3, commands:3 | productivity |
| minio-plan-files | 2.2.0 | skills:7 | productivity |
| notify | 2.0.0 | skills:1, hooks:1 | productivity |
| observability | 1.0.0 | skills:2 | productivity |
| dev-process | 2.3.0 | skills:7, agents:9 | productivity |
| plugin-dev | 1.0.0 | skills:2, agents:2, hooks:1 | development |
| accessibility | 1.0.0 | agents:1 | development |
| consulting | 1.0.0 | agents:7 | productivity |
| site-explorer | 1.0.0 | agents:1, commands:1 | productivity |

## ディレクトリ構造

```
.
├── .claude-plugin/
│   └── marketplace.json        # マーケットプレース定義 (公式形式v3)
└── plugins/
    ├── automation/             # agents/, commands/
    ├── minio-plan-files/       # skills/ (7スキル: minio-setup, plan-submit/fetch/done/fail/wait/status)
    ├── notify/                 # skills/notify-setup/, hooks/hooks.json
    ├── observability/          # skills/setup/, skills/observability-audit/
    │                           # reference/, templates/ は各スキル配下
    ├── dev-process/            # skills/ (5), agents/ (9: Phase 0-8), references/
    ├── plugin-dev/             # skills/ (2), agents/ (2), hooks/hooks.json
    ├── accessibility/          # agents/a11y-reviewer, references/wcag-rules
    └── consulting/             # agents/ (7: legal, pricing, tech, security, marketing, product, finance)
```

## 編集ルール

### プラグイン変更時の手順
1. `plugins/<プラグイン名>/` 配下のファイルを編集
2. marketplace.json のバージョン番号をインクリメント (スキル/エージェント追加削除時)
3. 該当プラグインの `README.md` があれば更新
4. ルート `README.md` のプラグイン一覧と整合を取る

### コンポーネントの自動検出
- skills: `source` ディレクトリの `skills/*/SKILL.md` から自動検出
- agents: `source` ディレクトリの `agents/*.md` から自動検出
- commands: `source` ディレクトリの `commands/*.md` から自動検出
- hooks: plugin.json で明示的に定義

### スキルの構造規約
- SKILL.md: YAML frontmatter 必須 (`name`, `description`, `allowed-tools`)
- name: gerund形式またはケバブケース
- description: トリガーワード含有、1024文字以内、三人称形式
- 行数上限: SKILL.md は 500行以下
- 外部参照: 1階層まで (SKILL.md -> reference/ or templates/)

### エージェントの構造規約
- YAML frontmatter 必須 (`name`, `description`)
- 1ファイル = 1エージェント

## 整合性の維持対象

変更時に以下の整合性を保つこと:

| 変更箇所 | 同期先 |
|----------|--------|
| marketplace.json の plugins 配列 | README.md のプラグイン一覧、CLAUDE.md のプラグイン構成表 |
| スキル/エージェントの追加・削除 | marketplace.json のバージョン、該当プラグインの README.md |
| plugins/ ディレクトリ構造変更 | CLAUDE.md のディレクトリ構造セクション |

## Git ワークフロー

- メインブランチ: `main`
- marketplace.json の変更はバージョン番号の更新を伴う
- スキル/エージェント/コマンドは自動検出されるため marketplace.json への個別登録は不要
