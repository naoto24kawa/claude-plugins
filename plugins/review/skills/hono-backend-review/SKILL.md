---
name: hono-backend-review
description: Reviews Hono backend implementations from DDD, event-driven, microservices, type safety, and Cloudflare optimization perspectives with 6 specialized agents. Creates prioritized improvement plans considering trade-offs. Use when the user mentions "backend review", "バックエンドレビュー", "DDD評価", "アーキテクチャ分析", "Hono品質チェック", "Cloudflare Workers", or needs Hono backend quality verification.
---

## Hono バックエンドレビューシステム

### 目次

1. [使用例](#使用例)
2. [レビュータスク](#レビュータスク)
3. [実行手順](#実行手順検証付きワークフロー)
4. [デフォルト設定](#デフォルト設定)
5. [注意事項](#注意事項)

このスキルは、Honoで実装されたバックエンドを6つの専門エージェントで多角的にレビューし、トレードオフを考慮した現実的な改善計画を策定します。

## 使用例

### 例 1: 単一サービスのレビュー
```
対象: src/contexts/order/
状況: 新機能実装後のアーキテクチャ確認
期待: DDD設計と型安全性の評価
```

### 例 2: マイクロサービス全体のレビュー
```
対象: services/
状況: 本番リリース前の品質監査
期待: 耐障害性とCloudflare最適化の確認
```

---

## レビュータスク

### 1. 多角的アーキテクチャレビューの実施

以下の専門エージェントを並行実行してレビューを収集：

- Task ツール (subagent_type: `hono-ddd-domain-reviewer`) による Entity/VO/集約の評価
- Task ツール (subagent_type: `hono-ddd-context-reviewer`) による Bounded Context の評価
- Task ツール (subagent_type: `hono-event-driven-reviewer`) による イベント駆動パターンの評価
- Task ツール (subagent_type: `hono-microservice-reviewer`) による サービス設計の評価
- Task ツール (subagent_type: `hono-type-safety-reviewer`) による Hono型安全性の評価
- Task ツール (subagent_type: `hono-edge-runtime-reviewer`) による Cloudflare最適化の評価

### 2. レビュー結果の統合と分析

各エージェントのレビュー結果を収集後、トレードオフを考慮した統合分析を実施：

**主な分析観点**:
- DDD厳格性 vs 実装シンプルさ
- イベント駆動 vs 同期処理
- マイクロサービス分割 vs モノリス保守性
- 型厳格性 vs 開発速度

**詳細な分析手法**: `./ANALYSIS_GUIDE.md` を参照

### 3. 統合レポートの作成

全レビュー結果を基に、`./REPORT_TEMPLATE.md` の形式で統合レポートを作成：

**必須セクション**:
- Critical / High / Medium / Low の優先度付きタスク
- Phase 1-4 の段階的実装計画
- トレードオフ分析
- リスク評価と軽減策

### 4. 成功指標の定義

**主要メトリクス**: `./METRICS.md` を参照

---

## 実行手順（検証付きワークフロー）

### ステップ 1: 対象の指定と準備
- レビュー対象のファイル/ディレクトリを明確に指定
- **検証**: 対象が存在し、Honoプロジェクトであることを確認

### ステップ 2: エージェント実行
- 6つの専門エージェントを並行実行 (Task ツールの subagent_type で指定)
  - `hono-ddd-domain-reviewer`
  - `hono-ddd-context-reviewer`
  - `hono-event-driven-reviewer`
  - `hono-microservice-reviewer`
  - `hono-type-safety-reviewer`
  - `hono-edge-runtime-reviewer`
- **検証**: すべてのエージェントが正常に完了したか確認
- **エラー時**: 失敗したエージェントのみ再実行

### ステップ 3: 結果収集と検証
- 各エージェントのレビュー結果を収集
- **検証**: 各エージェントの出力が有効な形式か確認

### ステップ 4: 統合分析
- トレードオフを考慮した統合分析を実施
- 相反する提案の調整と優先度付け

### ステップ 5: レポート作成
- 優先度付きタスクリストと実装計画を作成
- `REPORT_TEMPLATE.md` の形式に従って出力

---

## デフォルト設定

### 実行方式
- **エージェント実行**: 6つすべてを並行実行
- **失敗時の処理**: 取得できた結果のみでレポート生成
- **対象範囲**: 指定されたファイル/ディレクトリのみ

### 出力形式
- **レポート形式**: Markdown形式の統合レポート
- **優先度基準**: Critical > High > Medium > Low
- **工数表記**: XS / S / M / L / XL

### 分析基準
- **トレードオフ判断**: セキュリティ > 信頼性 > 保守性 > パフォーマンス
- **実用性重視**: 現実的で実装可能な提案を優先
- **段階的改善**: Phase分けで段階的な改善計画を提示

---

## 注意事項

1. 対象ファイルまたはディレクトリを明確に指定してください
2. Cloudflare Workers環境を前提としたレビューを行います
3. DDD/イベント駆動/マイクロサービスの成熟度に応じた提案を行います
4. 既存のCI/CDパイプラインとの整合性を考慮します
