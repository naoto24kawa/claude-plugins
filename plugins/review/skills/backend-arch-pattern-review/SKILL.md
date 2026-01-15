---
name: backend-arch-pattern-review
description: Analyzes backend architecture patterns with 5 specialized agents (layer structure, DDD Building Blocks, dependencies, frontend patterns, Cloudflare config) and creates prioritized improvement plans considering trade-offs. Use when the user mentions "backend architecture review", "バックエンドアーキテクチャレビュー", "設計検証", "レイヤー構造", "DDD準拠", "依存関係分析", "Clean Architecture", "Onion Architecture", "API設計", or needs backend architecture evaluation.
context: fork
agents:
  - arch-layer-structure-checker
  - arch-ddd-pattern-checker
  - arch-dependency-checker
  - arch-frontend-pattern-checker
  - arch-cloudflare-config-checker
---

## アーキテクチャパターンレビューシステム

### 目次

1. [使用例](#使用例)
2. [専門エージェント一覧](#専門エージェント一覧)
3. [レビュータスク](#レビュータスク)
4. [実行手順](#実行手順検証付きワークフロー)
5. [デフォルト設定](#デフォルト設定)
6. [注意事項](#注意事項)

このスキルは、バックエンド/フロントエンドのアーキテクチャパターンを複数の専門エージェントで多角的にレビューし、トレードオフを考慮した現実的な改善計画を策定します。

## 実行方法

対象となるプロジェクトまたはディレクトリを指定して、以下の専門エージェントによるレビューを順次実行し、最終的に統合レポートを作成してください。

## 使用例

### 例 1: バックエンド全体のアーキテクチャレビュー

- **対象**: `apps/backend/src/`（またはプロジェクト固有のバックエンドパス）
- **状況**: 新規プロジェクト開始後のアーキテクチャ検証
- **期待**: Clean Architecture準拠状況とDDDパターンの評価

### 例 2: フロントエンドパターンのレビュー

- **対象**: `apps/frontend/src/`（またはプロジェクト固有のフロントエンドパス）
- **状況**: Feature-Sliced Design導入後の検証
- **期待**: Bounded Contextとの対応確認とルーティングパターン評価

### 例 3: Cloudflare設定のレビュー

- **対象**: プロジェクトルート
- **状況**: デプロイ前の設定検証
- **期待**: wrangler.jsonc、バインディング、環境変数の整合性確認

## 専門エージェント一覧

このスキルは以下の5つの専門エージェントを使用します。Task ツールの `subagent_type` パラメータで各エージェントを呼び出してください。

| エージェント名 | 役割 | 主な検証対象 |
|--------------|------|------------|
| `arch-layer-structure-checker` | レイヤー構造検証 | Domain/Application/Infrastructure/Presentation の4層構成 |
| `arch-ddd-pattern-checker` | DDDパターン検証 | Entity, Value Object, Aggregate Root, Repository 等 |
| `arch-dependency-checker` | 依存関係検証 | 依存方向、DIP準拠、循環依存 |
| `arch-frontend-pattern-checker` | フロントエンド検証 | Feature-Sliced Design、ルーティング、コンポーネント設計 |
| `arch-cloudflare-config-checker` | Cloudflare設定検証 | wrangler.jsonc、バインディング、環境変数（Cloudflare使用時のみ） |

**呼び出し例**:
```
Task ツールで subagent_type="arch-layer-structure-checker" を指定
```

## レビュータスク

### 1. 多角的アーキテクチャレビューの実施

以下の専門エージェントを並行または順次実行してレビューを収集：

- Task ツール (subagent_type: `arch-layer-structure-checker`) によるレイヤー構造 (Domain/Application/Infrastructure/Presentation) の検証
- Task ツール (subagent_type: `arch-ddd-pattern-checker`) による DDD Building Blocks (Entity、Value Object、Aggregate Root、Repository、Domain Service、Domain Event) の検証
- Task ツール (subagent_type: `arch-dependency-checker`) による依存関係の方向性とDIP準拠の検証
- Task ツール (subagent_type: `arch-frontend-pattern-checker`) による Feature-Sliced Design、ルーティング、コンポーネント設計の検証
- Task ツール (subagent_type: `arch-cloudflare-config-checker`) による Cloudflare設定 (Workers、D1、R2、Queues) の検証 (Cloudflare使用プロジェクトのみ)

### 2. レビュー結果の統合と分析

各エージェントのレビュー結果を収集後、トレードオフを考慮した統合分析を実施：

**主な分析観点**:

- 厳格なDDD vs 実用性のバランス
- レイヤー分離 vs 開発スピード
- 型安全性 vs 実装柔軟性
- フロントエンド/バックエンドの境界整合性

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

- アーキテクチャ準拠率
- 依存関係違反数
- レイヤー境界違反数
- 設定整合性スコア

**詳細な指標ガイド**: `./METRICS.md` を参照

## 実行手順（検証付きワークフロー）

### ステップ 0: プロジェクト規模の判定（必須）

レビュー対象の規模を判定し、以降のエージェントに期待値を伝達：

1. **ファイル数のカウント**
   - バックエンド: `apps/backend/src/**/*.ts` のファイル数
   - フロントエンド: `apps/frontend/src/**/*.tsx` のファイル数

2. **規模判定基準**

   | 規模 | ファイル数 | 期待するレイヤー構造 | DDDパターン適用 |
   |------|-----------|---------------------|----------------|
   | 小規模 | 〜20 | 柔軟（api/domain/db程度） | 最小限（Branded Types程度） |
   | 中規模 | 21〜100 | 基本的な分離（3層程度） | 必要な部分のみ |
   | 大規模 | 100超 | 厳格な4層分離 | フル適用を検討 |

3. **判定結果の伝達**
   - 各エージェント実行時に規模判定結果を明示
   - **小規模の場合**: 「シンプルさ優先」を指示
   - **中規模の場合**: 「バランス重視」を指示
   - **大規模の場合**: 「厳格な準拠」を指示

- **検証**: 規模判定が完了したことを確認
- **エラー時**: ファイル数不明の場合は「中規模」として進行

### ステップ 1: 対象の指定と準備

- レビュー対象のプロジェクト/ディレクトリを明確に指定
- **検証**: 対象が存在し、アクセス可能であることを確認
- **検証**: アーキテクチャドキュメント（`__docs__/`）の存在確認

### ステップ 2: エージェント実行

- 各専門エージェントを並行または順次実行（Task ツールで `subagent_type` を指定）
  - `arch-layer-structure-checker`
  - `arch-ddd-pattern-checker`
  - `arch-dependency-checker`
  - `arch-frontend-pattern-checker`
  - `arch-cloudflare-config-checker`（Cloudflare使用プロジェクトのみ）
- **検証**: すべてのエージェントが正常に完了したか確認
- **エラー時**: 失敗したエージェントのみ再実行、または部分的な結果で続行

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
  - 各優先度レベル（Critical/High/Medium/Low）にタスクが分類されているか確認
- **エラー時**: 手動で優先度を調整

### ステップ 5: レポート作成

- 優先度付きタスクリストと実装計画を作成
- REPORT_TEMPLATE.md の形式に従って出力
- **検証**:
  - レポートに必須セクション（優先度別タスク、実装計画、リスク評価）が含まれているか確認
  - 各タスクに工数見積もり（XS/S/M/L/XL）が付与されているか確認
- **出力**: 統合レポートを Markdown 形式で提供

## デフォルト設定

ユーザーから特別な指示がない限り、以下のデフォルト設定で実行：

### 実行方式

- **エージェント実行**: 5つすべてのエージェントを並行実行
- **失敗時の処理**: エラーが発生した場合、その旨を報告し、取得できた結果のみでレポート生成
- **対象範囲**: ユーザーが指定したディレクトリのみ

### 出力形式

- **レポート形式**: Markdown 形式の統合レポート
- **優先度基準**: Critical > High > Medium > Low の 4 段階で評価
- **工数表記**: XS（1時間未満）/ S（1-4時間）/ M（1-2日）/ L（3-5日）/ XL（1週間以上）

### 分析基準

- **トレードオフ判断**: セキュリティ > 保守性 > 一貫性 > 実装速度 の優先順位
- **実用性重視**: 理想的な設計より、現実的で実装可能な提案を優先
- **段階的改善**: 一度にすべてを修正するのではなく、Phase分けで段階的な改善計画を提示

## 注意事項

1. 対象ディレクトリを明確に指定してください
2. プロジェクトの規模と現状を考慮した現実的な提案を行います
3. アーキテクチャドキュメントが存在する場合、それを基準としてレビューします
4. 段階的な導入中のパターンについては、許容範囲を考慮します
5. 過度な抽象化よりも実用性を優先するケースも許容します
