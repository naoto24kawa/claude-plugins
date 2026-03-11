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
