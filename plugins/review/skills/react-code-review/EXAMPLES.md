# React コードレビュー使用例

## 良い依頼の例

### 例1: 単一コンポーネントのレビュー

```
対象: src/components/UserProfile.tsx
状況: 新機能実装後の品質確認
期待: 設計とパフォーマンスの評価
```

**ポイント**:
- 対象ファイルが明確
- レビューの目的が明記
- 期待する評価観点が指定

### 例2: フォームコンポーネントのレビュー

```
対象: src/features/auth/LoginForm.tsx
状況: shadcn/ui を使ったフォーム実装
期待: React Hook Form + Zod のベストプラクティス準拠確認
```

**ポイント**:
- 使用技術が明記（shadcn/ui）
- 具体的な確認観点（RHF + Zod）

### 例3: 機能全体のレビュー

```
対象: src/features/dashboard/
状況: ダッシュボード機能の品質監査
期待: 包括的な品質評価と改善計画
除外: テストファイル（*.test.tsx）
```

**ポイント**:
- ディレクトリ単位での指定
- 除外条件の明記

---

## 悪い依頼の例

### 例1: 対象が不明確

```
❌ 「コードをレビューして」
```

**問題**: 対象ファイル/ディレクトリが不明

```
✅ 「src/components/Button.tsx をレビューして」
```

### 例2: 目的が不明確

```
❌ 「src/features/ を全部見て」
```

**問題**: 何を評価すべきか不明

```
✅ 「src/features/auth/ のパフォーマンスを評価して」
```

### 例3: 範囲が広すぎる

```
❌ 「プロジェクト全体をレビュー」
```

**問題**: 現実的でない範囲

```
✅ 「src/components/ のうち、最近変更したファイルをレビュー」
```

---

## シナリオ別使用ガイド

### シナリオ1: 新コンポーネント実装後

**状況**: 新しいコンポーネントを実装した直後

**推奨依頼**:
```
対象: src/components/NewFeature.tsx
状況: 新規実装完了、マージ前レビュー
期待: 設計と状態管理の妥当性確認
```

**重点エージェント**:
- react-component-design-reviewer
- react-state-management-reviewer

### シナリオ2: パフォーマンス問題発生時

**状況**: ユーザーから「遅い」との報告

**推奨依頼**:
```
対象: src/features/dashboard/
状況: パフォーマンス問題の報告あり
期待: ボトルネックの特定と最適化提案
```

**重点エージェント**:
- react-performance-reviewer

### シナリオ3: アクセシビリティ監査

**状況**: WCAG準拠の確認が必要

**推奨依頼**:
```
対象: src/components/
状況: アクセシビリティ監査
期待: WCAG AA準拠の確認と改善提案
```

**重点エージェント**:
- react-accessibility-reviewer

### シナリオ4: shadcn/ui 移行時

**状況**: 既存UIをshadcn/uiに移行中

**推奨依頼**:
```
対象: src/components/forms/
状況: shadcn/ui への移行作業
期待: 移行後のベストプラクティス準拠確認
```

**重点エージェント**:
- react-shadcn-reviewer

### シナリオ5: テスト追加前の準備

**状況**: テストカバレッジを上げたい

**推奨依頼**:
```
対象: src/features/user/
状況: テスト追加の準備
期待: テスト容易性の評価とリファクタリング提案
```

**重点エージェント**:
- react-testability-reviewer

---

## エージェントのスキップ

特定のエージェントをスキップしたい場合:

```
対象: src/components/InternalTool.tsx
状況: 社内ツールの実装レビュー
期待: 設計とパフォーマンスの評価
スキップ: react-accessibility-reviewer（内部ツールのため簡易対応）
```

**スキップ可能なケース**:
- `react-shadcn-reviewer`: shadcn/ui を使用していない場合
- `react-accessibility-reviewer`: 内部ツールで基本対応のみで良い場合

**スキップ不可**:
- 公開サービスでは全エージェントの実行を推奨
