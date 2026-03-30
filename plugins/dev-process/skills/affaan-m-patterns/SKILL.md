---
name: affaan-m-patterns
description: >
  This skill should be used when the user asks to
  "affaan-mパターンをレビューしたい",
  "everything-claude-codeのパターンを確認",
  "affaan-mのパターンを適用したい",
  "affaan-mパターンの適用状況を確認",
  "パターンNを適用して",
  "affaan-m-patternsを実行",
  "取り込みパターンの一覧を見せて".
  Reviews and applies design patterns extracted from affaan-m/everything-claude-code
  to plugins in this repository.
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash, Agent, AskUserQuestion]
user-invocable: true
---

# affaan-m Patterns - everything-claude-code 設計パターン管理

[affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) から抽出した10個の設計パターンのレビューと適用を管理する。

## パターン一覧

| # | ファイル | パターン | 優先度 |
|---|---------|---------|--------|
| 1 | hook-profile-separation.md | Hook プロファイル分離 | 中 |
| 2 | config-protection-hook.md | Config Protection Hook | 高 |
| 3 | mcp-health-check-hook.md | MCP Health Check Hook | 低 |
| 4 | cost-tracking-hook.md | コスト追跡 Hook | 中 |
| 5 | pre-compact-state-save.md | PreCompact 状態保存 | 低 |
| 6 | strategic-compact-suggestion.md | 戦略的コンパクション提案 | 低 |
| 7 | quality-gate-hook.md | Quality Gate | 中 |
| 8 | agent-role-separation.md | エージェント役割分離 | 高 |
| 9 | context-window-management.md | コンテキスト管理戦略 | 参考 |
| 10 | hook-run-export.md | Hook run() エクスポート | 低 |

## パターンファイルの場所

すべてのパターンファイルは `.docs/references/affaan-m/` に格納されている。
インデックスは `.docs/references/affaan-m/README.md` を参照。

## ワークフロー

### モード 1: レビュー (デフォルト)

1. `.docs/references/affaan-m/README.md` を Read で読み込む
2. 全10パターンの適用状況を確認する:
   - git log で各パターンに関連するコミットを検索
   - 各パターンファイルの「適用先」セクションの記載内容を読み取る
3. 以下の形式でレポートを出力する:

```
## affaan-m パターン適用状況

| # | パターン | 状態 | 備考 |
|---|---------|------|------|
| 1 | Hook プロファイル分離 | 未適用 | - |
| 2 | Config Protection | 未適用 | plugin-dev への適用候補 |
| 8 | エージェント役割分離 | 適用済み | dev-process v2.1.0 で取り込み |
```

適用状況の判定基準:
- **適用済み**: git log にパターン取り込みに該当するコミットがある、またはプラグインのコードに該当機能が実装済み
- **未適用**: まだ取り込まれていない
- **見送り**: 意図的に取り込まないと判断された (理由を備考に記載)
- **設計知見**: プラグインに直接適用するものではなく、設計時の参考情報

4. ユーザーに次のアクションを提案する:
   - 未適用かつ優先度「高」のパターンを推奨
   - 適用条件 (UX影響の有無など前回の議論結果) があれば提示

### モード 2: 適用

ユーザーがパターン番号または名前を指定した場合:

1. 該当パターンファイルを `.docs/references/affaan-m/` から Read で読み込む
2. パターンの「適用先」セクションから対象プラグインを特定する
3. 対象プラグインの現状を確認する:
   - ディレクトリ構成 (Glob)
   - 既存の hooks.json, agents/, skills/ の内容
   - 既に類似の機能が存在しないか
4. 適用方針をユーザーに提示する:
   - 何を、どのプラグインの、どのファイルに追加/変更するか
   - UX への影響の有無
   - 必要なバージョン更新
5. ユーザーの承認を得てから実装に進む
6. 実装後、パターンファイルの「適用先」セクションに適用記録を追記する

### モード 3: 詳細確認

ユーザーがパターンの内容を詳しく知りたい場合:

1. 該当パターンファイルを Read で読み込む
2. 全セクション (概要、仕組み、設計の良さ、適用先) をそのまま提示する
3. 元リポジトリの該当コードを参照したい場合は URL を案内する:
   `https://github.com/affaan-m/everything-claude-code`

## 適用時の原則

- **プラグインは完成品であるべき**: パターンのつまみ食いではなく、既存プラグインの完成度を上げる方向で適用する
- **UX 影響の確認**: 開発者の操作フローが変わる変更は、ユーザーに明示して承認を得る
- **バージョン更新**: パターン適用で機能が追加された場合、marketplace.json のバージョンをインクリメントする
- **整合性維持**: CLAUDE.md のプラグイン構成表、README.md を同期する

## パターンの構造

各パターンファイルは以下の構造を持つ:

```markdown
# Pattern: パターン名
- 出典: リポジトリURL
- カテゴリ: 分類
- 取り込み優先度: 高/中/低

## 概要
## 仕組み
## 設計の良さ
## 適用先
```

この構造を利用して、レビューや適用計画を効率的に進める。
