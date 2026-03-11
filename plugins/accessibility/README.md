# accessibility

WCAG 2.2 Level A/AA/AAA 対応の Web アクセシビリティ(a11y)静的コードレビューエージェント。

## 概要

HTML / JSX / TSX / Vue / Svelte 等のテンプレートファイルとCSSを対象に、WCAG 2.2 の達成基準に照らしてアクセシビリティ違反を検出し、具体的なコード修正案を提示する。

## インストール

```bash
/plugin install accessibility@naoto24kawa-claude-plugins
```

## エージェント (1体)

| エージェント | 用途 |
|-------------|------|
| a11y-reviewer | コードのアクセシビリティ違反を検出し修正案を提示 |

## 使い方

```
アクセシビリティをチェックして
```

Agent ツールでサブエージェントとして呼び出す:

```
a11y-reviewer エージェントで src/ のアクセシビリティをチェックして
```

## チェック対象

### WCAG 4原則

| 原則 | 主なチェック項目 |
|------|-----------------|
| Perceivable | 代替テキスト、コントラスト比、テキストリサイズ |
| Operable | キーボード操作、フォーカス管理、リンクテキスト |
| Understandable | 言語指定、ラベル、エラーメッセージ |
| Robust | ARIA属性、セマンティックHTML、ステータスメッセージ |

### 対応フレームワーク

HTML, React (JSX/TSX), Vue, Svelte, Astro, ERB, EJS, Handlebars, Pug

### 対応ファイル

- テンプレート: `*.html`, `*.jsx`, `*.tsx`, `*.vue`, `*.svelte` 等
- スタイル: `*.css`, `*.scss`, `*.sass`, `*.less`

## ディレクトリ構成

```
accessibility/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   └── a11y-reviewer.md
├── references/
│   └── wcag-rules.md
└── README.md
```
