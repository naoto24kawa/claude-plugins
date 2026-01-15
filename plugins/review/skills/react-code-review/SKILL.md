---
name: react-code-review
description: Reviews React components with 6 specialized agents (component design, performance, state management, accessibility, testability, shadcn/ui) and creates prioritized improvement plans considering trade-offs. Use when the user mentions "React review", "Reactレビュー", "コンポーネント品質", "パフォーマンス改善", "a11y確認", "accessibility", "shadcn", or needs React component quality verification.
context: fork
agents:
  - react-component-design-reviewer
  - react-performance-reviewer
  - react-state-management-reviewer
  - react-accessibility-reviewer
  - react-testability-reviewer
  - react-shadcn-reviewer
---

## React コードレビューシステム

### 目次

1. [対象技術スタック](#対象技術スタック)
2. [使用例](#使用例)
3. [レビュータスク](#レビュータスク)
4. [実行手順](#実行手順検証付きワークフロー)
5. [デフォルト設定](#デフォルト設定)
6. [注意事項](#注意事項)

このスキルは、Reactで実装されたコンポーネントを複数の専門エージェントで多角的にレビューし、トレードオフを考慮した現実的な改善計画を策定します。

## 対象技術スタック

- **フレームワーク**: React（関数コンポーネント、Hooks）
- **状態管理**: React標準（useState, useContext, useReducer）
- **UIライブラリ**: shadcn/ui
- **バリデーション**: Zod + React Hook Form

## 使用例

### 例 1: 単一コンポーネントのレビュー

```
対象: src/components/UserProfile.tsx
状況: 新機能実装後の品質確認
期待: 設計とパフォーマンスの評価
```

### 例 2: フォームコンポーネントのレビュー

```
対象: src/features/auth/LoginForm.tsx
状況: shadcn/ui を使ったフォーム実装
期待: ベストプラクティス準拠の確認
```

### 例 3: 機能全体のレビュー

```
対象: src/features/dashboard/
状況: ダッシュボード機能の品質監査
期待: 包括的な品質評価と改善計画
```

---

## レビュータスク

### 1. 多角的コードレビューの実施

以下の専門エージェントを並行実行してレビューを収集：

- Task ツール (subagent_type: `react-component-design-reviewer`) によるコンポーネント設計の評価
- Task ツール (subagent_type: `react-performance-reviewer`) によるパフォーマンスの評価
- Task ツール (subagent_type: `react-state-management-reviewer`) による状態管理の評価
- Task ツール (subagent_type: `react-accessibility-reviewer`) によるアクセシビリティの評価
- Task ツール (subagent_type: `react-testability-reviewer`) によるテスト容易性の評価
- Task ツール (subagent_type: `react-shadcn-reviewer`) による shadcn/ui ベストプラクティスの評価

### 2. レビュー結果の統合と分析

各エージェントのレビュー結果を収集後、トレードオフを考慮した統合分析を実施：

**主な分析観点**:

- コンポーネント分割 vs KISS（シンプルさ）
- メモ化 vs 可読性
- 状態管理の集中 vs 分散
- アクセシビリティ vs 開発速度
- テスト容易性 vs 実装コスト

**詳細な分析手法**: `./ANALYSIS_GUIDE.md` を参照

### 3. 統合レポートの作成

全レビュー結果を基に、`./REPORT_TEMPLATE.md` の形式で統合レポートを作成：

**必須セクション**:

- Critical / High / Medium / Low の優先度付きタスク
- Phase 1-4 の段階的実装計画
- トレードオフ分析
- リスク評価と軽減策
- 成功指標

### 4. 成功指標の定義

改善効果を測定するための指標を設定：

**主要メトリクス**:

- レンダリングパフォーマンス（初回レンダリング時間、再レンダリング頻度）
- アクセシビリティスコア（Lighthouse a11y スコア）
- テストカバレッジ（コンポーネント単位）
- コンポーネント複雑度（Props数、JSXネスト深度）

**詳細な指標ガイド**: `./METRICS.md` を参照

---

## 実行手順（検証付きワークフロー）

### ステップ 1: 対象の指定と準備

- レビュー対象のファイル/ディレクトリを明確に指定
- **検証**: 対象が存在し、Reactコンポーネントであることを確認

### ステップ 2: エージェント実行

- 6つの専門エージェントを並行実行 (Task ツールの subagent_type で指定)
  - `react-component-design-reviewer`
  - `react-performance-reviewer`
  - `react-state-management-reviewer`
  - `react-accessibility-reviewer`
  - `react-testability-reviewer`
  - `react-shadcn-reviewer`
- **検証**: すべてのエージェントが正常に完了したか確認
- **エラー時**: 失敗したエージェントのみ再実行

### ステップ 3: 結果収集と検証

- 各エージェントのレビュー結果を収集
- **検証**:
  - 各エージェントの出力が有効な形式であることを確認
  - 空の結果や不完全な出力がないか確認
- **エラー時**: 不完全な結果は除外し、取得できた結果のみで分析

### ステップ 4: 統合分析

- トレードオフを考慮した統合分析を実施
- 相反する提案の調整と優先度付け
- **検証**:
  - 相反する提案がリストアップされているか確認
  - 各優先度レベル (Critical/High/Medium/Low) にタスクが分類されているか確認
- **エラー時**: 手動で優先度を調整

### ステップ 5: レポート作成

- 優先度付きタスクリストと実装計画を作成
- REPORT_TEMPLATE.md の形式に従って出力
- **検証**:
  - レポートに必須セクション (優先度別タスク、実装計画、リスク評価) が含まれているか確認
  - 各タスクに工数見積もり (XS/S/M/L/XL) が付与されているか確認
- **出力**: 統合レポートを Markdown 形式で提供

---

## デフォルト設定

### 実行方式

- **エージェント実行**: 6つすべてを並行実行
- **失敗時の処理**: 取得できた結果のみでレポート生成
- **対象範囲**: 指定されたファイル/ディレクトリのみ

### 出力形式

- **レポート形式**: Markdown形式の統合レポート
- **優先度基準**: Critical > High > Medium > Low
- **工数表記**: XS（1時間未満）/ S（1-4時間）/ M（1-2日）/ L（3-5日）/ XL（1週間以上）

### 分析基準

- **トレードオフ判断**: アクセシビリティ > パフォーマンス > 保守性 > コード美観
- **実用性重視**: 現実的で実装可能な提案を優先
- **段階的改善**: Phase分けで段階的な改善計画を提示

---

## 注意事項

1. 対象ファイルまたはディレクトリを明確に指定してください
2. shadcn/ui を使用していない場合は react-shadcn-reviewer をスキップ可能
3. 既存のESLint/Prettier設定との整合性を考慮します
4. チームのスキルレベルと利用可能なリソースを考慮します
