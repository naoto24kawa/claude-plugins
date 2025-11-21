---
type: component
title: [ComponentName] コンポーネント仕様書
version: 1.0.0
updated: YYYY-MM-DD
tags: []
related: []
dependencies: []
---

# [ComponentName] コンポーネント仕様書

## 概要

**責務**: [このコンポーネントの単一の責任を簡潔に記述]

**カテゴリ**: [UI / フォーム / レイアウト / データ表示 / フィードバック]

**再利用性**: [高 / 中 / 低]

---

## Props定義

```typescript
interface [ComponentName]Props {
  // 必須Props
  [propName]: [type];           // [説明]

  // 任意Props
  [propName]?: [type];          // [説明]、デフォルト: [value]

  // イベントハンドラ
  on[Event]?: (data: [type]) => void;  // [説明]

  // スタイル
  className?: string;           // カスタムCSSクラス
  style?: React.CSSProperties;  // インラインスタイル

  // その他
  children?: React.ReactNode;   // 子要素
}
```

### Props詳細

| Prop名 | 型 | 必須 | デフォルト値 | 説明 |
|--------|---|------|------------|------|
| [prop] | [type] | ✓ | - | [説明] |
| [prop] | [type] | - | [value] | [説明] |

---

## State定義（内部状態を持つ場合）

```typescript
interface [ComponentName]State {
  [stateName]: [type];          // [説明]
}
```

### State更新トリガー

| State | 更新トリガー | 説明 |
|-------|------------|------|
| [state] | [イベント名] | [説明] |

---

## イベントハンドラ一覧

### on[Event]

**トリガー**: [ユーザーアクション / 内部処理]

**引数**:
```typescript
{
  [field]: [type];
}
```

**実行タイミング**: [onChange / onClick / onSubmit / onBlur]

**副作用**: [状態更新 / API呼び出し / なし]

---

## バリデーション（フォーム系コンポーネントの場合）

### バリデーションルール

| フィールド | ルール | エラーメッセージ |
|-----------|--------|----------------|
| [field] | [rule] | [message] |

### バリデーションタイミング

- [ ] onChange（入力中）
- [ ] onBlur（フォーカス離脱時）
- [ ] onSubmit（送信時）

### エラー表示方法

**表示位置**: [フィールド下 / フィールド横 / フォーム上部]

**表示スタイル**: [テキスト / アイコン + テキスト / ツールチップ]

**エラー時のUI変更**:
- [ ] 入力フィールドの枠線を赤に
- [ ] エラーアイコンを表示
- [ ] エラーメッセージを表示

### 非同期バリデーション

**対象フィールド**: [email / username]

**バリデーション方法**: [API呼び出し / デバウンス処理]

**ローディング表示**: [スピナー / プログレスバー]

---

## 使用例

### 基本的な使用例

```tsx
import { [ComponentName] } from '@/components/[ComponentName]';

function ExamplePage() {
  const handleEvent = (data: [type]) => {
    console.log(data);
  };

  return (
    <[ComponentName]
      [prop]={[value]}
      on[Event]={handleEvent}
    />
  );
}
```

### バリエーション

#### バリエーション1: [説明]

```tsx
<[ComponentName]
  [prop]={[value]}
  variant="[variant]"
/>
```

#### バリエーション2: [説明]

```tsx
<[ComponentName]
  [prop]={[value]}
  size="[size]"
  disabled
/>
```

---

## 状態別の見た目

### デフォルト状態

[説明または画像]

### ホバー状態

[説明または画像]

### フォーカス状態

[説明または画像]

### 無効化状態（disabled）

[説明または画像]

### ローディング状態

[説明または画像]

### エラー状態

[説明または画像]

---

## アクセシビリティ要件

### ARIA属性

```tsx
<[element]
  role="[role]"
  aria-label="[label]"
  aria-describedby="[id]"
  aria-invalid={hasError}
  aria-required={isRequired}
/>
```

### キーボード操作

| キー | 動作 |
|-----|------|
| Enter | [動作] |
| Escape | [動作] |
| Tab | [動作] |
| Arrow Keys | [動作] |

### スクリーンリーダー対応

- [ ] フォームフィールドに適切なラベル
- [ ] エラーメッセージが読み上げられる
- [ ] ローディング状態が通知される
- [ ] 動的なコンテンツ変更が通知される（aria-live）

### カラーコントラスト

- [ ] WCAG AA基準を満たす（コントラスト比 4.5:1以上）
- [ ] エラー状態は色だけでなくアイコンやテキストでも表現

---

## 依存する他コンポーネント

| コンポーネント | 用途 |
|--------------|------|
| [Component] | [用途] |

---

## スタイリング

### デフォルトスタイル

```css
.[component-class] {
  /* デフォルトスタイル */
}
```

### カスタマイズ可能なCSS変数

```css
--[component]-color: [value];
--[component]-size: [value];
--[component]-spacing: [value];
```

### Tailwind CSS クラス（使用している場合）

```tsx
const baseClasses = "...";
const variantClasses = {
  primary: "...",
  secondary: "...",
};
```

---

## Props変更時の副作用

| Prop | 変更時の動作 |
|------|------------|
| [prop] | [副作用の説明] |

---

## 再レンダリング条件

- [ ] Props変更時
- [ ] State変更時
- [ ] Context変更時
- [ ] 親コンポーネント再レンダリング時

### パフォーマンス最適化

- [ ] `React.memo`を使用
- [ ] `useMemo`でメモ化
- [ ] `useCallback`でコールバック関数をメモ化
- [ ] 不要な再レンダリングを防ぐ

---

## テスト要件

### 単体テスト

- [ ] Props渡しのテスト
- [ ] イベントハンドラ呼び出しのテスト
- [ ] 状態遷移のテスト
- [ ] エラー状態のテスト

### ビジュアルリグレッションテスト

- [ ] デフォルト状態
- [ ] 各バリエーション
- [ ] エラー状態
- [ ] ローディング状態

### アクセシビリティテスト

- [ ] ARIA属性の検証
- [ ] キーボード操作の検証
- [ ] スクリーンリーダーテスト

---

## エラーハンドリング

### エラー境界（Error Boundary）

**必要性**: [必要 / 不要]

**理由**: [理由]

### エラー時の表示

**表示内容**: [エラーメッセージ / フォールバックUI]

**復旧方法**: [リトライボタン / ページリロード]

---

## AI実装時の注意事項

### 設計上の制約
- [制約事項を列挙]

### パフォーマンス考慮事項
- [大量データ表示時の仮想化]
- [画像の遅延読み込み]

### セキュリティ考慮事項
- [ ] XSS対策（ユーザー入力のサニタイゼーション）
- [ ] 機密情報の表示制御

---

## 変更履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0.0 | YYYY-MM-DD | 初版作成 |
