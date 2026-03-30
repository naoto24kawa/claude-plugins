# Accessibility Plugin Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** WCAG 2.2 Level AAA 対応の静的アクセシビリティコードレビューエージェントを新規プラグインとして作成する

**Architecture:** シンプルエージェント方式。エージェント1つ(a11y-reviewer.md) + WCAGルール参照ドキュメント1つ(wcag-rules.md)で完結する。エージェントは対象ファイルを Glob/Grep/Read で収集・読み込み、wcag-rules.md のルールに照らして違反を検出し、修正案付きで報告する。

**Tech Stack:** Claude Code Plugin (Markdown + YAML frontmatter + JSON)

**Spec:** `.docs/plans/accessibility-plugin-design.md`

---

## Chunk 1: プラグインの骨格作成

### Task 1: ディレクトリ構造と plugin.json の作成

**Files:**
- Create: `plugins/accessibility/.claude-plugin/plugin.json`

- [ ] **Step 1: ディレクトリ構造を作成**

```bash
mkdir -p plugins/accessibility/.claude-plugin
mkdir -p plugins/accessibility/agents
mkdir -p plugins/accessibility/references
```

- [ ] **Step 2: plugin.json を作成**

`plugins/accessibility/.claude-plugin/plugin.json`:

```json
{
  "name": "accessibility",
  "version": "1.0.0",
  "description": "Web accessibility (a11y) code review agent based on WCAG 2.2"
}
```

- [ ] **Step 3: ディレクトリ構造を確認**

```bash
find plugins/accessibility -type f -o -type d | sort
```

Expected:
```
plugins/accessibility
plugins/accessibility/.claude-plugin
plugins/accessibility/.claude-plugin/plugin.json
plugins/accessibility/agents
plugins/accessibility/references
```

- [ ] **Step 4: コミット**

```bash
git add plugins/accessibility/.claude-plugin/plugin.json
git commit -m "feat(accessibility): プラグインの骨格を作成"
```

---

### Task 2: WCAGルール参照ドキュメントの作成

**Files:**
- Create: `plugins/accessibility/references/wcag-rules.md`

これはエージェントが Read して検査基準とするreferenceドキュメント。WCAG 2.2 の4原則に沿って、静的解析で検出可能なルールを体系的に記載する。各ルールには達成基準番号、レベル、検出パターン(コード例)、修正例を含める。

- [ ] **Step 1: wcag-rules.md を作成**

`plugins/accessibility/references/wcag-rules.md`:

```markdown
# WCAG 2.2 Static Analysis Rules

静的コード解析で検出可能なWCAG 2.2ルール一覧。
エージェントはこのドキュメントを参照して、対象コードの違反を検出する。

## 重大度の定義

| 重大度 | 説明 |
|--------|------|
| critical | アクセシビリティを完全に阻害する (スクリーンリーダーで情報にアクセスできない等) |
| serious | 主要な障壁となる (キーボード操作不能、コントラスト不足等) |
| moderate | 部分的に影響する (ラベル欠落、見出し階層の乱れ等) |
| minor | ベストプラクティスからの逸脱 (推奨属性の欠落等) |

---

## 1. Perceivable (知覚可能)

### 1.1.1 Non-text Content (Level A) [critical]

全ての非テキストコンテンツに代替テキストを提供する。

**検出パターン:**

HTML:
- `<img>` に `alt` 属性がない
- `<img alt="">` で装飾的でない画像 (src にアイコン名やロゴ名を含む場合は警告)
- `<area>` に `alt` 属性がない
- `<input type="image">` に `alt` 属性がない
- `<object>` に代替コンテンツがない
- `<svg>` に `<title>` または `aria-label` がない

React/JSX/TSX:
- `<img />` に `alt` prop がない
- `<Image />` (Next.js等) に `alt` prop がない

Vue:
- `<img :src="...">` に `alt` 属性がない
- `<img v-bind:src="...">` に `alt` 属性がない

**修正例:**
```html
<!-- NG -->
<img src="logo.png">
<svg viewBox="0 0 24 24">...</svg>

<!-- OK -->
<img src="logo.png" alt="会社ロゴ">
<img src="decorative-line.png" alt="" role="presentation">
<svg viewBox="0 0 24 24" aria-label="検索"><title>検索</title>...</svg>
```

### 1.3.1 Info and Relationships (Level A) [serious]

情報、構造、関係性がプログラム的に決定可能であること。

**検出パターン:**

見出し階層:
- `<h1>` の後に `<h3>` が来る (h2 スキップ)
- `<h2>` の後に `<h4>` が来る (h3 スキップ)
- 見出し要素が1つもない

フォームのラベル:
- `<input>` / `<select>` / `<textarea>` に対応する `<label>` がない
- `<label>` に `for` 属性がない、または対応する `id` を持つ要素がない
- React: `htmlFor` prop が欠落

セマンティクス:
- `<div onclick>` や `<span onclick>` でボタンの代用 → `<button>` を推奨
- テーブルレイアウトの使用 (レイアウト目的の `<table>`)
- `<b>` / `<i>` の使用 → `<strong>` / `<em>` を推奨

**修正例:**
```html
<!-- NG: ラベル欠落 -->
<input type="email" id="email">

<!-- OK -->
<label for="email">メールアドレス</label>
<input type="email" id="email">

<!-- NG: div をボタンとして使用 -->
<div onclick="submit()">送信</div>

<!-- OK -->
<button type="button" onclick="submit()">送信</button>
```

### 1.3.5 Identify Input Purpose (Level AA) [moderate]

個人情報を扱う入力フィールドの目的をプログラム的に特定可能にする。

**検出パターン:**
- `name`, `email`, `tel`, `address` 等のフィールド名/id を持つ `<input>` に `autocomplete` 属性がない

**修正例:**
```html
<!-- NG -->
<input type="text" name="name">
<input type="email" name="email">

<!-- OK -->
<input type="text" name="name" autocomplete="name">
<input type="email" name="email" autocomplete="email">
```

### 1.4.3 Contrast (Minimum) (Level AA) [serious]

テキストと背景のコントラスト比が 4.5:1 以上 (大文字テキストは 3:1 以上)。

**検出パターン:**
- CSS で `color` と `background-color` が同時に定義されている場合、コントラスト比を計算
- インラインスタイルの `color` / `background-color`
- Tailwind CSS のテキスト/背景色クラスの組み合わせ (例: `text-gray-300 bg-white`)

**注意:** CSS変数、テーマ、動的スタイルの場合は計算不可能。その場合は手動確認を推奨として報告する。

**修正例:**
```css
/* NG: コントラスト比 2.85:1 */
.button { color: #999; background-color: #fff; }

/* OK: コントラスト比 7.0:1 */
.button { color: #595959; background-color: #fff; }
```

### 1.4.4 Resize Text (Level AA) [moderate]

テキストが支援技術なしで200%までリサイズ可能であること。

**検出パターン:**
- `font-size` が固定 `px` 値で指定されている (例: `font-size: 14px`)
- `line-height` が固定 `px` 値で指定されている

**修正例:**
```css
/* NG */
body { font-size: 16px; }

/* OK */
body { font-size: 1rem; }
```

### 1.4.6 Contrast (Enhanced) (Level AAA) [minor]

テキストと背景のコントラスト比が 7:1 以上 (大文字テキストは 4.5:1 以上)。

**検出パターン:** 1.4.3 と同じパターンで、より厳しいコントラスト比で判定。

### 1.4.11 Non-text Contrast (Level AA) [serious]

UI コンポーネントと画像のコントラスト比が 3:1 以上。

**検出パターン:**
- `border-color` のコントラスト比が背景に対して 3:1 未満
- `outline-color` のコントラスト比が背景に対して 3:1 未満
- フォーカスインジケータのカスタムスタイルでコントラスト比が不足

### 1.4.12 Text Spacing (Level AA) [moderate]

テキスト間隔の調整を妨げないこと。

**検出パターン:**
- `line-height` / `letter-spacing` / `word-spacing` に `!important` 付きの固定値
- `overflow: hidden` と固定サイズの組み合わせ (テキスト拡大時にはみ出す可能性)

---

## 2. Operable (操作可能)

### 2.1.1 Keyboard (Level A) [critical]

全ての機能がキーボードで操作可能であること。

**検出パターン:**

HTML:
- `onclick` があるが `onkeydown` / `onkeyup` / `onkeypress` がない非インタラクティブ要素
- `<div>` や `<span>` に `onclick` があるが `tabindex` がない
- `<div>` に `onclick` + `tabindex` があるが `role` がない

React/JSX:
- `onClick` があるが `onKeyDown` / `onKeyUp` がない (非 `<button>`, 非 `<a>` 要素)
- `<div onClick={...}>` に `role` と `tabIndex` がない

Vue:
- `@click` / `v-on:click` があるが `@keydown` がない非インタラクティブ要素

**修正例:**
```jsx
{/* NG */}
<div onClick={handleClick}>クリック</div>

{/* OK: button を使用 (推奨) */}
<button onClick={handleClick}>クリック</button>

{/* OK: ARIA 付きで div を使用 (非推奨だが許容) */}
<div role="button" tabIndex={0} onClick={handleClick} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e) }}>クリック</div>
```

### 2.4.1 Bypass Blocks (Level A) [serious]

繰り返しコンテンツをスキップする手段を提供すること。

**検出パターン:**
- ページレイアウト内にスキップリンク (`<a href="#main">`, `<a href="#content">` 等) がない
- `<main>` 要素が存在しない
- `<nav>` 要素が存在しない (ナビゲーションがある場合)

### 2.4.2 Page Titled (Level A) [serious]

ページに説明的なタイトルがあること。

**検出パターン:**
- `<title>` 要素が `<head>` 内に存在しない
- `<title>` 要素が空
- React: `<Helmet>` や `document.title` の設定がない (検出困難、警告として報告)

### 2.4.4 Link Purpose (Level A) [serious]

リンクの目的がリンクテキストから判断可能であること。

**検出パターン:**
- `<a>` の内部テキストが空
- `<a>` の内部テキストが "こちら", "ここ", "click here", "more", "read more", "詳細", "リンク" のみ
- `<a>` に `href` があるが中身がアイコンのみで `aria-label` がない

**修正例:**
```html
<!-- NG -->
<a href="/docs">こちら</a>
<a href="/profile"><i class="icon-user"></i></a>

<!-- OK -->
<a href="/docs">ドキュメントを見る</a>
<a href="/profile" aria-label="プロフィール"><i class="icon-user"></i></a>
```

### 2.4.6 Headings and Labels (Level AA) [moderate]

見出しとラベルが内容を説明していること。

**検出パターン:**
- 空の見出し要素 (`<h1></h1>`, `<h2></h2>` 等)
- 見出し内にテキストがなくアイコンのみ

### 2.4.7 Focus Visible (Level AA) [serious]

キーボードフォーカスが視覚的に確認可能であること。

**検出パターン:**
- `outline: none` / `outline: 0` を設定しているが `:focus-visible` 等の代替スタイルがない
- `*:focus { outline: none }` のようなグローバルリセット

**修正例:**
```css
/* NG */
button:focus { outline: none; }

/* OK */
button:focus-visible { outline: 2px solid #4A90D9; outline-offset: 2px; }
```

### 2.5.3 Label in Name (Level A) [serious]

可視ラベルを含むUIコンポーネントの accessible name に可視テキストが含まれること。

**検出パターン:**
- `aria-label` の値が可視テキストと完全に異なる
- 例: ボタンの表示テキストが "検索" だが `aria-label="find items"` のようにラベルが全く異なる場合

### 2.5.8 Target Size (Minimum) (Level AA) [moderate]

タッチターゲットのサイズが最低24x24 CSSピクセルであること。

**検出パターン:**
- `<button>`, `<a>`, `<input>` に明示的に `width` / `height` / `min-width` / `min-height` が 24px 未満で指定されている場合に警告
- `padding: 0` のボタン/リンク

**注意:** 実際のレンダリングサイズは静的解析で正確に判定できないため、警告レベルで報告。

---

## 3. Understandable (理解可能)

### 3.1.1 Language of Page (Level A) [serious]

ページのデフォルト言語が指定されていること。

**検出パターン:**
- `<html>` に `lang` 属性がない
- `<html lang="">` (空)

**修正例:**
```html
<!-- NG -->
<html>

<!-- OK -->
<html lang="ja">
```

### 3.1.2 Language of Parts (Level AA) [moderate]

ページ内の異なる言語テキストに `lang` 属性が指定されていること。

**検出パターン:**
- ページの主言語と異なる言語のテキストブロックに `lang` 属性がない (静的解析では検出困難、ヒューリスティックとして Latin テキストが日本語ページに存在する場合に警告)

### 3.2.5 Change on Request (Level AAA) [minor]

コンテキストの変更はユーザーのリクエストによってのみ行われること。

**検出パターン:**
- `<select onchange="location.href=...">` のような自動ナビゲーション
- `<input onfocus="...">` でフォーカス時にコンテキスト変更

### 3.3.1 Error Identification (Level A) [serious]

入力エラーが自動検出された場合、エラー項目が特定され、ユーザーにテキストで説明されること。

**検出パターン:**
- `<form>` 内に `required` 属性のある `<input>` があるが、`aria-describedby` / `aria-errormessage` がない
- バリデーション関連の error state に `aria-invalid` がない

### 3.3.2 Labels or Instructions (Level A) [serious]

ユーザー入力が必要なとき、ラベルまたは説明が提供されること。

**検出パターン:**
- `<input>` に `<label>`, `aria-label`, `aria-labelledby`, `title`, `placeholder` のいずれもない
- `placeholder` のみでラベルがない (アクセシビリティ上問題: placeholder は消えるため)

**修正例:**
```html
<!-- NG: placeholder のみ -->
<input type="text" placeholder="名前を入力">

<!-- OK: label あり -->
<label for="name">名前</label>
<input type="text" id="name" placeholder="名前を入力">
```

### 3.3.8 Accessible Authentication (Minimum) (Level AA) [moderate]

認知機能テストに依存しない認証手段を提供すること。

**検出パターン:**
- CAPTCHA 要素 (`<div class="captcha">`, `<div class="g-recaptcha">` 等) の検出 → 代替手段の有無を確認する警告

---

## 4. Robust (堅牢)

### 4.1.2 Name, Role, Value (Level A) [critical]

全てのUIコンポーネントの名前と役割がプログラム的に決定可能であること。

**検出パターン:**

無効な ARIA:
- 存在しない `role` 値の使用
- `aria-hidden="true"` が付いたインタラクティブ要素 (`<button>`, `<a>`, `<input>`)
- `role="presentation"` / `role="none"` が付いたインタラクティブ要素
- `aria-labelledby` / `aria-describedby` の参照先 ID が同一ファイル内に存在しない

有効な role 値一覧 (主要):
`alert`, `alertdialog`, `application`, `article`, `banner`, `button`, `cell`, `checkbox`, `columnheader`, `combobox`, `complementary`, `contentinfo`, `definition`, `dialog`, `directory`, `document`, `feed`, `figure`, `form`, `grid`, `gridcell`, `group`, `heading`, `img`, `link`, `list`, `listbox`, `listitem`, `log`, `main`, `marquee`, `math`, `menu`, `menubar`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, `navigation`, `none`, `note`, `option`, `presentation`, `progressbar`, `radio`, `radiogroup`, `region`, `row`, `rowgroup`, `rowheader`, `scrollbar`, `search`, `searchbox`, `separator`, `slider`, `spinbutton`, `status`, `switch`, `tab`, `table`, `tablist`, `tabpanel`, `term`, `textbox`, `timer`, `toolbar`, `tooltip`, `tree`, `treegrid`, `treeitem`

**修正例:**
```html
<!-- NG: aria-hidden に button -->
<div aria-hidden="true">
  <button>送信</button>
</div>

<!-- NG: 無効な role -->
<div role="popup">内容</div>

<!-- OK -->
<div role="dialog" aria-label="確認ダイアログ">内容</div>
```

### 4.1.3 Status Messages (Level AA) [serious]

ステータスメッセージが支援技術に伝達可能であること。

**検出パターン:**
- 動的に表示されるメッセージ要素 (`.toast`, `.notification`, `.alert`, `.message`, `.status`, `.error`, `.success`) に `role="status"` / `role="alert"` / `aria-live` がない
- フォーム送信後の成功/エラーメッセージに `aria-live` がない

**修正例:**
```html
<!-- NG -->
<div class="success-message">保存しました</div>

<!-- OK -->
<div class="success-message" role="status" aria-live="polite">保存しました</div>
<div class="error-message" role="alert" aria-live="assertive">入力エラーがあります</div>
```

---

## 5. Framework-Specific Patterns

### React / JSX / TSX

| パターン | 検出 | 修正 |
|----------|------|------|
| `<img />` に `alt` なし | `alt` prop 追加 | `<img src={src} alt="説明" />` |
| `htmlFor` の欠落 | `<label>` に `htmlFor` なし | `<label htmlFor="id">` |
| `onClick` without keyboard | `onClick` のみの非button | `<button>` に変更、または `onKeyDown` 追加 |
| Fragment に key なし (リスト) | `<>` で key がない | `<Fragment key={id}>` |
| `tabIndex` の正の値 | `tabIndex={1}` 等 | `tabIndex={0}` または削除 |

### Vue

| パターン | 検出 | 修正 |
|----------|------|------|
| `<img :src>` に `alt` なし | `alt` 属性追加 | `<img :src="src" alt="説明">` |
| `@click` without keyboard | `@click` のみの非button | `<button>` に変更、または `@keydown` 追加 |
| `v-html` の使用 | XSS + a11y リスク | 代替手段を検討、aria 属性が失われる可能性を警告 |

### Svelte

| パターン | 検出 | 修正 |
|----------|------|------|
| `<img src={src}>` に `alt` なし | `alt` 属性追加 | `<img src={src} alt="説明">` |
| `on:click` without keyboard | `on:click` のみの非button | `<button>` に変更、または `on:keydown` 追加 |
```

- [ ] **Step 2: 行数を確認**

```bash
wc -l plugins/accessibility/references/wcag-rules.md
```

Expected: 400行前後 (500行を大幅に超えていないこと)

- [ ] **Step 3: コミット**

```bash
git add plugins/accessibility/references/wcag-rules.md
git commit -m "feat(accessibility): WCAGルール参照ドキュメントを追加

WCAG 2.2 Level A/AA/AAAの静的解析可能なルールを4原則+フレームワーク別に整理"
```

---

## Chunk 2: エージェント定義とプラグイン登録

### Task 3: a11y-reviewer エージェントの作成

**Files:**
- Create: `plugins/accessibility/agents/a11y-reviewer.md`

- [ ] **Step 1: エージェントファイルを作成**

`plugins/accessibility/agents/a11y-reviewer.md`:

```markdown
---
name: a11y-reviewer
description: |
  Reviews code for web accessibility (a11y) issues against WCAG 2.2 (A/AA/AAA).
  Analyzes HTML, JSX, TSX, Vue, Svelte and other template files for accessibility
  violations, providing specific fix suggestions with code examples.

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
tools: ["Glob", "Grep", "Read"]
model: sonnet
color: green
---

あなたは Web アクセシビリティ(a11y)の静的コードレビュー専門エージェントです。
HTML / JSX / TSX / Vue / Svelte 等のテンプレートファイルを WCAG 2.2 (A/AA/AAA) の達成基準に照らして検査し、違反を検出して具体的な修正案を提示します。

## 役割

1. 対象ファイルを特定し、アクセシビリティ関連のコードパターンを検査する
2. WCAG 2.2 の達成基準に基づいて違反を検出する
3. 各違反に対して重大度を判定し、具体的なコード修正案を提示する
4. 検出結果をサマリーと詳細の2段構成で報告する

## 実行フロー

### Step 1: WCAGルールの読み込み

`${CLAUDE_PLUGIN_ROOT}/references/wcag-rules.md` を Read してルール一覧を取得する。

### Step 2: 対象ファイルの収集

入力に応じて対象ファイルを決定する:

- **ファイルパス指定あり:** 指定されたファイルを直接対象にする
- **ディレクトリ指定あり:** そのディレクトリ内の対象拡張子のファイルを Glob で収集する
- **git diff 指定あり:** 差分ファイルリストから対象拡張子をフィルタする
- **指定なし:** 現在のリポジトリ全体から対象拡張子を Glob で収集する

**対象拡張子:**
`*.html`, `*.htm`, `*.jsx`, `*.tsx`, `*.vue`, `*.svelte`, `*.astro`, `*.erb`, `*.ejs`, `*.hbs`, `*.pug`

**CSS も対象:**
`*.css`, `*.scss`, `*.sass`, `*.less` (コントラスト比、フォーカススタイル、テキストサイズの検査)

### Step 3: ファイルごとに検査

各ファイルを Read し、wcag-rules.md のルールに照らして以下を検出する:

1. **パターンマッチ:** ルールで定義されたコードパターンとの照合
2. **コンテキスト判断:** 周辺コードから意図を推定し、誤検出を抑制する
3. **フレームワーク判定:** ファイル拡張子とコード構文からフレームワークを判定し、該当するフレームワーク固有パターンも適用する

### Step 4: 結果出力

検出した違反を以下のフォーマットで報告する。

## 出力形式

```markdown
## A11y Review Results

### Summary
- Critical: N件
- Serious: N件
- Moderate: N件
- Minor: N件
- Total: N件

### Violations

#### [Critical] 問題の概要 (WCAG X.X.X Level X)
- **File:** path/to/file.ext:行番号
- **Problem:** 具体的な問題の説明
- **Fix:**
  ```言語
  修正後のコード
  ```

(重大度の高い順に列挙)

### Notes
- 静的解析の限界により検出できない項目の一覧
- 手動確認を推奨する箇所
```

## 誤検出の抑制

以下の場合は違反として報告しない:

- `<img alt="">` で `role="presentation"` または `role="none"` が付いている場合 (装飾画像)
- `aria-hidden="true"` の要素内のインタラクティブ要素が、同一コンポーネント内に代替の可視要素がある場合
- `tabindex="-1"` はプログラム的フォーカス管理として許容する

## 注意事項

- 出力はすべて日本語で行う
- 違反がない場合は「違反は検出されませんでした」と報告し、手動確認の推奨事項を添える
- CSSのコントラスト比チェックでは、CSS変数やテーマ使用時は計算不可能であることを明記する
- 大量のファイルがある場合は重大度 critical / serious に絞って報告し、moderate / minor は件数のみサマリーに記載する
```

- [ ] **Step 2: frontmatter の形式を確認**

エージェントファイルが正しいYAML frontmatterを持つことを Grep で確認:

```bash
head -30 plugins/accessibility/agents/a11y-reviewer.md
```

Expected: `---` で始まり、`name`, `description`, `tools`, `model`, `color` が含まれること

- [ ] **Step 3: コミット**

```bash
git add plugins/accessibility/agents/a11y-reviewer.md
git commit -m "feat(accessibility): a11y-reviewer エージェントを追加

WCAG 2.2 Level A/AA/AAA対応の静的コードレビューエージェント。
対象: HTML/JSX/TSX/Vue/Svelte/CSS"
```

---

### Task 4: README.md の作成

**Files:**
- Create: `plugins/accessibility/README.md`

- [ ] **Step 1: README.md を作成**

`plugins/accessibility/README.md`:

```markdown
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
```

- [ ] **Step 2: コミット**

```bash
git add plugins/accessibility/README.md
git commit -m "docs(accessibility): README.md を追加"
```

---

### Task 5: marketplace.json の更新

**Files:**
- Modify: `.claude-plugin/marketplace.json`

- [ ] **Step 1: marketplace.json に accessibility プラグインを追加**

`plugins` 配列の末尾に追加し、マーケットプレース `version` を `"5.1.0"` にインクリメント、`description` にアクセシビリティを追記:

```json
{
  "name": "accessibility",
  "description": "Web accessibility (a11y) code review agent based on WCAG 2.2 (A/AA/AAA). Analyzes HTML, JSX, TSX, Vue, Svelte and CSS for accessibility violations with specific fix suggestions.",
  "version": "1.0.0",
  "author": {
    "name": "naoto24kawa",
    "email": "naoto24kawa@gmail.com"
  },
  "source": "./plugins/accessibility",
  "category": "development"
}
```

marketplace.json の `version` を `"5.0.0"` → `"5.1.0"` に更新。
marketplace.json の `description` にアクセシビリティの言及を追加。

- [ ] **Step 2: JSON の妥当性を確認**

```bash
python3 -c "import json; json.load(open('.claude-plugin/marketplace.json'))" && echo "Valid JSON"
```

Expected: `Valid JSON`

- [ ] **Step 3: コミット**

```bash
git add .claude-plugin/marketplace.json
git commit -m "feat(marketplace): accessibility プラグインを登録

marketplace v5.0.0 -> v5.1.0"
```

---

### Task 6: CLAUDE.md の更新

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: プラグイン構成表に accessibility を追加**

`## プラグイン構成` テーブルに行を追加:

```
| accessibility | 1.0.0 | agents:1 | development |
```

`リポジトリの役割` セクションの「6つのプラグイン」を「7つのプラグイン」に変更。

- [ ] **Step 2: ディレクトリ構造セクションを更新**

`## ディレクトリ構造` の `plugins/` 配下に追加:

```
    ├── accessibility/          # agents/a11y-reviewer, references/wcag-rules
```

- [ ] **Step 3: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md にaccessibilityプラグインを追加"
```

---

### Task 7: ルート README.md の更新

**Files:**
- Modify: `README.md`

- [ ] **Step 1: プラグイン一覧に accessibility を追加**

`## プラグイン一覧` セクションの末尾 (plugin-dev の後) に追加:

```markdown
### accessibility (v1.0.0)

WCAG 2.2 Level A/AA/AAA 対応の Web アクセシビリティ静的コードレビュー。

**エージェント (1つ):** a11y-reviewer (HTML/JSX/TSX/Vue/Svelte/CSSのa11y検査 + 修正案提示)
```

- [ ] **Step 2: クイックスタートにインストールコマンドを追加**

```bash
/plugin install accessibility@naoto24kawa-claude-plugins
```

- [ ] **Step 3: 冒頭の説明文を更新**

「6つのプラグインで」→「7つのプラグインで」に変更。
「プラグイン開発支援を提供する」の前に「アクセシビリティ検査、」を追加。

- [ ] **Step 4: コミット**

```bash
git add README.md
git commit -m "docs: README.md にaccessibilityプラグインを追加"
```

---

## Chunk 3: 検証と最終確認

### Task 8: 整合性の最終確認

- [ ] **Step 1: ファイル構造を確認**

```bash
find plugins/accessibility -type f | sort
```

Expected:
```
plugins/accessibility/.claude-plugin/plugin.json
plugins/accessibility/README.md
plugins/accessibility/agents/a11y-reviewer.md
plugins/accessibility/references/wcag-rules.md
```

- [ ] **Step 2: marketplace.json の plugins 数を確認**

```bash
python3 -c "import json; data=json.load(open('.claude-plugin/marketplace.json')); print(f'Plugins: {len(data[\"plugins\"])}'); [print(f'  - {p[\"name\"]} v{p[\"version\"]}') for p in data['plugins']]"
```

Expected: `Plugins: 7` で accessibility が含まれること

- [ ] **Step 3: CLAUDE.md のプラグイン数確認**

```bash
grep -c "^\|" CLAUDE.md | head -1
```

プラグイン構成表に7行のデータ行があること (ヘッダー + セパレータを除く)

- [ ] **Step 4: README.md にインストールコマンドが含まれることを確認**

```bash
grep "accessibility" README.md
```

Expected: インストールコマンドとプラグイン一覧の両方に出現

- [ ] **Step 5: エージェントの frontmatter が有効であることを確認**

```bash
head -1 plugins/accessibility/agents/a11y-reviewer.md
```

Expected: `---` (YAML frontmatter の開始)

- [ ] **Step 6: 全体のコミット履歴を確認**

```bash
git log --oneline -8
```

Expected: Task 1-7 の各コミットが含まれること
