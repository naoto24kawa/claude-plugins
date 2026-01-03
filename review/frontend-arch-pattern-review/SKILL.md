---
name: frontend-arch-pattern-review
description: フロントエンドアーキテクチャを5つの専門エージェント（Feature-Sliced Design、React Router、状態管理、Hono RPC連携、コンポーネント設計）で分析し、トレードオフを考慮した優先度付き改善計画を策定。Use when the user mentions "frontend architecture", "フロントエンドアーキテクチャ", "Feature-Sliced", "FSD", "loader/action", "状態管理設計", "API連携", "React Router", or needs frontend architecture evaluation.
---

## フロントエンドアーキテクチャレビューシステム

### 目次

1. [対象技術スタック](#対象技術スタック)
2. [使用例](#使用例)
3. [レビュータスク](#レビュータスク)
4. [実行手順](#実行手順検証付きワークフロー)
5. [デフォルト設定](#デフォルト設定)
6. [注意事項](#注意事項)

このスキルは、フロントエンドのアーキテクチャパターンを複数の専門エージェントで多角的にレビューし、トレードオフを考慮した現実的な改善計画を策定します。

## 対象技術スタック

- **フレームワーク**: React（関数コンポーネント、Hooks）
- **ルーター**: React Router v7（loader/action パターン）
- **API連携**: Hono RPC Client（型安全なAPI呼び出し）
- **状態管理**: React標準（useState, useContext, useReducer）
- **UIライブラリ**: shadcn/ui

## 使用例

### 例 1: Feature構成のレビュー

```
対象: apps/frontend/src/
状況: Feature-Sliced Design導入後の検証
期待: レイヤー構造と依存方向の評価
```

### 例 2: ルーティング設計のレビュー

```
対象: apps/frontend/src/routes/
状況: React Router v7 移行後の検証
期待: loader/action パターンの適切性評価
```

### 例 3: API連携のレビュー

```
対象: apps/frontend/src/
状況: Hono RPC導入後の検証
期待: 型安全性とエラーハンドリングの評価
```

---

## レビュータスク

### 1. 多角的アーキテクチャレビューの実施

以下の専門エージェントを並行実行してレビューを収集：

- @agent-frontend-fsd-checker による Feature-Sliced Design の評価
- @agent-frontend-router-checker による React Router v7 パターンの評価
- @agent-frontend-state-checker による状態管理設計の評価
- @agent-frontend-api-checker による Hono RPC 連携の評価
- @agent-frontend-component-checker によるコンポーネント設計の評価

### 2. レビュー結果の統合と分析

各エージェントのレビュー結果を収集後、トレードオフを考慮した統合分析を実施：

**主な分析観点**:

- Feature分割粒度 vs 開発スピード
- loader でのデータ取得 vs クライアントサイドフェッチ
- サーバー状態 vs クライアント状態の境界
- 型安全性 vs 実装柔軟性

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

- Feature-Sliced Design準拠率
- loader/action カバレッジ
- 型安全なAPI呼び出し率
- コンポーネント再利用率

**詳細な指標ガイド**: `./METRICS.md` を参照

---

## 実行手順（検証付きワークフロー）

### ステップ 1: 対象の指定と準備

- レビュー対象のプロジェクト/ディレクトリを明確に指定
- **検証**: 対象が存在し、React プロジェクトであることを確認

### ステップ 2: エージェント実行

- 5つの専門エージェントを並行実行
  - @agent-frontend-fsd-checker
  - @agent-frontend-router-checker
  - @agent-frontend-state-checker
  - @agent-frontend-api-checker
  - @agent-frontend-component-checker
- **検証**: すべてのエージェントが正常に完了したか確認
- **エラー時**: 失敗したエージェントのみ再実行

### ステップ 3: 結果収集と検証

- 各エージェントのレビュー結果を収集
- **検証**: 各エージェントの出力が有効な形式であることを確認

### ステップ 4: 統合分析

- トレードオフを考慮した統合分析を実施
- 相反する提案の調整と優先度付け

### ステップ 5: レポート作成

- 優先度付きタスクリストと実装計画を作成
- REPORT_TEMPLATE.md の形式に従って出力

---

## デフォルト設定

### 実行方式

- **エージェント実行**: 5つすべてを並行実行
- **失敗時の処理**: 取得できた結果のみでレポート生成
- **対象範囲**: 指定されたディレクトリのみ

### 出力形式

- **レポート形式**: Markdown形式の統合レポート
- **優先度基準**: Critical > High > Medium > Low
- **工数表記**: XS（1時間未満）/ S（1-4時間）/ M（1-2日）/ L（3-5日）/ XL（1週間以上）

### 分析基準

- **トレードオフ判断**: 型安全性 > 保守性 > パフォーマンス > 開発速度
- **実用性重視**: 現実的で実装可能な提案を優先
- **段階的改善**: Phase分けで段階的な改善計画を提示

---

## 注意事項

1. 対象ディレクトリを明確に指定してください
2. React Router v7 を使用していない場合は該当エージェントをスキップ可能
3. Hono RPC を使用していない場合は該当エージェントをスキップ可能
4. 既存の ESLint/Prettier 設定との整合性を考慮します
