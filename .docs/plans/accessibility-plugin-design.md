# Accessibility Plugin Design

**Date:** 2026-03-11
**Status:** Approved

## Overview

Claude Code プラグインとして、Webアクセシビリティ(a11y)の静的コードレビューを行うエージェントを提供する。HTML / JSX / TSX / Vue / Svelte 等のテンプレートファイルを対象に、WCAG 2.2 Level A/AA/AAA の達成基準に照らして違反を検出し、具体的なコード修正案を提示する。

## Requirements

| 項目 | 内容 |
|------|------|
| 形態 | コードレビュー型(静的解析)エージェント |
| 対象 | 汎用(HTML / JSX / TSX / Vue / Svelte 等) |
| 基準 | WCAG 2.2 Level AAA まで可能な限り |
| 所属 | 新規 `accessibility` プラグイン |
| 出力 | 問題指摘 + 具体的なコード修正案 |

## Architecture

シンプルエージェント方式を採用する。エージェント1つ + referenceドキュメント1つで完結。

### Plugin Structure

```
plugins/accessibility/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   └── a11y-reviewer.md
├── references/
│   └── wcag-rules.md
└── README.md
```

### Components

#### plugin.json

```json
{
  "name": "accessibility",
  "version": "1.0.0",
  "description": "Web accessibility (a11y) code review agent based on WCAG 2.2"
}
```

#### a11y-reviewer.md (Agent)

**Frontmatter:**

```yaml
name: a11y-reviewer
description: |
  Reviews code for web accessibility (a11y) issues against WCAG 2.2 (A/AA/AAA).
  Analyzes HTML, JSX, TSX, Vue, and other template files for accessibility violations,
  providing specific fix suggestions with code examples.

  <example>
  Context: User wants accessibility review of changed files.
  user: "アクセシビリティをチェックして"
  assistant: "a11y-reviewer エージェントでコードのアクセシビリティを検査します。"
  <commentary>
  Dispatched when user requests accessibility review of code.
  </commentary>
  </example>

  <example>
  Context: PR review workflow includes a11y check.
  user: "PRをレビューして"
  assistant: "a11y-reviewer を含むレビューエージェントを起動します。"
  <commentary>
  Can be dispatched as part of a broader code review workflow.
  </commentary>
  </example>
model: sonnet
color: green
tools: ["Glob", "Grep", "Read"]
```

**Agent Flow:**

1. **対象ファイル収集:** 入力で指定されたファイル、またはgit diffから変更ファイルを特定。`*.html`, `*.jsx`, `*.tsx`, `*.vue`, `*.svelte` 等をフィルタ
2. **referenceの読み込み:** 同一プラグイン内の `references/wcag-rules.md` を Read して検査ルールを取得(エージェントは `${CLAUDE_PLUGIN_ROOT}/references/wcag-rules.md` で参照)
3. **ファイルごとに検査:** 各ファイルを Read し、ルールに照らして違反を検出
4. **結果出力:** 重大度別(critical / serious / moderate / minor)に分類し、修正案付きで報告

**Output Format:**

```markdown
## A11y Review Results

### Summary
- Critical: N件
- Serious: N件
- Moderate: N件
- Minor: N件

### Violations

#### [Critical] img要素にalt属性がありません (WCAG 1.1.1 Level A)
- **File:** src/components/Hero.tsx:15
- **Problem:** `<img src="hero.png" />` に代替テキストがない
- **Fix:**
  \`\`\`tsx
  <img src="hero.png" alt="メインビジュアル: サービスの概要イメージ" />
  \`\`\`

#### [Serious] コントラスト比が不足しています (WCAG 1.4.3 Level AA)
- **File:** src/styles/button.css:8
- **Problem:** `color: #999` on `background: #fff` (コントラスト比 2.85:1, 必要 4.5:1)
- **Fix:**
  \`\`\`css
  color: #595959; /* コントラスト比 7.0:1 */
  \`\`\`
```

#### wcag-rules.md (Reference)

WCAG 2.2の4原則に沿ってルールを体系的に記載する。静的解析で検出可能なルールに限定。

**構成:**
- 4原則ごとにセクション分け
- 各ルール: 達成基準番号 / レベル / 検出パターン / 修正例
- フレームワーク別(React / Vue / Svelte)の検出パターン差異を記載
- referenceファイルのため SKILL.md の500行制限は適用外。ただしコンテキスト消費を考慮し、超過時は原則別(perceivable/operable/understandable/robust)に分割する

**収録ルール:**

##### Perceivable (知覚可能)
| 達成基準 | Level | チェック内容 |
|----------|-------|-------------|
| 1.1.1 | A | img/area/input[type=image] の alt 欠落 |
| 1.3.1 | A | フォーム要素の label 欠落、見出し階層スキップ、セマンティック要素の不使用 |
| 1.3.5 | AA | autocomplete 属性の欠落(個人情報入力フィールド) |
| 1.4.3 | AA | テキストのコントラスト比 4.5:1 未満(CSSから検出可能な範囲) |
| 1.4.4 | AA | 固定px指定のフォントサイズ |
| 1.4.11 | AA | UI要素のコントラスト比 3:1 未満 |

##### Operable (操作可能)
| 達成基準 | Level | チェック内容 |
|----------|-------|-------------|
| 2.1.1 | A | onClick のみで onKeyDown/onKeyUp がないインタラクティブ要素 |
| 2.4.1 | A | スキップリンクの欠落 |
| 2.4.2 | A | title 要素の欠落 |
| 2.4.4 | A | 空のリンクテキスト、曖昧なリンクテキスト |
| 2.4.7 | AA | tabindex > 0 の使用(フォーカス順序の乱れ) |
| 2.5.3 | A | aria-label とvisibleテキストの不一致 |
| 2.5.8 | AA | ターゲットサイズに関する警告(CSS width/height から推定) |

##### Understandable (理解可能)
| 達成基準 | Level | チェック内容 |
|----------|-------|-------------|
| 3.1.1 | A | html の lang 属性欠落 |
| 3.1.2 | AA | 他言語テキストに lang 属性がない |
| 3.3.2 | A | フォーム入力のラベル・説明の欠落 |

##### Robust (堅牢)
| 達成基準 | Level | チェック内容 |
|----------|-------|-------------|
| 4.1.2 | A | カスタムUI の role/aria-* 欠落、無効な ARIA role、aria-hidden="true" のインタラクティブ要素 |
| 4.1.3 | AA | ステータスメッセージに role="status"/aria-live 欠落 |

上記は主要ルールの抜粋。実際の wcag-rules.md には Level AAA を含むより多くのルールと、フレームワーク別の検出パターン・修正例を記載する。

## Design Decisions

### Why Simple Agent (not multi-agent)?
- WCAGルールは1つのreferenceファイルに収まるサイズ
- Claudeのコード理解力でルール分岐ロジックを外部化する必要がない
- まずシンプルに始め、必要に応じてルール分離方式(reference 4分割)に拡張可能

### Why Agent (not Skill)?
- コードレビューは「入力 → 分析 → 出力」の単方向フローでエージェント向き
- 他のレビューワークフローからサブエージェントとして呼び出せる
- 複雑な対話フローは不要

### Why Reference File?
- WCAGルールを外部化することで、ルール追加・更新がエージェント本体に影響しない
- エージェントのプロンプトが肥大化しない
- 1階層参照ルール(SKILL.md -> reference/)に準拠

## Integration Points

- `feature-dev:code-reviewer` や `pr-review-toolkit:code-reviewer` から呼び出し可能(将来の連携先。現時点では単独実行が主なユースケース)
- git diff の結果を入力として受け取り、変更ファイルのみを対象にチェック
- 単独実行も可能(ディレクトリやファイルパスを指定)

## Implementation Notes

プラグイン追加時に以下の同期更新が必要:
- `marketplace.json` に accessibility プラグインを追加し、マーケットプレースバージョンをインクリメント
- `CLAUDE.md` のプラグイン構成表・ディレクトリ構造セクションを更新
- ルート `README.md` のプラグイン一覧を更新

## Marketplace Registration

`marketplace.json` に以下を追加:

```json
{
  "name": "accessibility",
  "description": "Web accessibility (a11y) code review agent based on WCAG 2.2 (A/AA/AAA)",
  "version": "1.0.0",
  "author": { "name": "naoto24kawa" },
  "source": "./plugins/accessibility",
  "category": "development"
}
```

## Risks and Mitigations

| リスク | 影響 | 対策 |
|--------|------|------|
| wcag-rules.md が肥大化する | コンテキスト消費大 | 4原則ごとにファイル分割(perceivable.md等)を検討 |
| 静的解析の限界(CSSコントラスト比等) | 偽陰性 | 限界を明示し、ブラウザ検査との併用を推奨 |
| フレームワーク固有パターンの網羅 | 検出漏れ | 主要フレームワーク(React/Vue/Svelte)から始め段階的に追加 |
