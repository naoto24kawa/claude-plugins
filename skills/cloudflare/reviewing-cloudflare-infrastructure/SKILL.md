---
name: reviewing-cloudflare-infrastructure
description: Cloudflare インフラのパフォーマンス、セキュリティ、信頼性、コスト最適化の観点からレビュー・評価し、ベストプラクティス適用の具体的改善提案を行う。「インフラレビュー」「パフォーマンス最適化」「セキュリティ評価」「コスト削減」「キャッシュ戦略」「CDN設定」などの依頼時に使用
---

## Cloudflare インフラレビュースキル

このスキルは、Cloudflare インフラストラクチャを体系的に評価し、パフォーマンス、セキュリティ、信頼性、コスト最適化の観点からベストプラクティスに基づいた改善提案を提供します。

## 使用例

### 例1: CDN パフォーマンスレビュー

```
状況: Web サイトの読み込み速度が遅い
要求: キャッシュ設定、CDN 設定、パフォーマンス最適化の評価
期待: 現状分析、ボトルネック特定、具体的な改善策
```

### 例2: セキュリティ監査

```
状況: WAF と DDoS Protection の設定を監査したい
要求: セキュリティルールの評価、脆弱性チェック
期待: リスク評価、推奨設定、実装手順
```

### 例3: コスト最適化レビュー

```
状況: Cloudflare の月額料金が高騰している
要求: Workers 実行時間、R2 ストレージ、帯域幅の最適化
期待: コスト分析、削減策、ROI 改善提案
```

## レビューの6つの柱

このスキルは、Cloudflareのエッジファースト、Zero Trust、開発者体験重視の思想に基づいた6つの柱でインフラを評価します。詳細は `./REVIEW_PILLARS.md` を参照してください。

### 1. エッジファースト・アーキテクチャ

**評価項目**:
- キャッシュ戦略とヒット率（90%以上目標）
- オリジンへのリクエスト最小化
- グローバルエッジネットワーク活用
- Workers によるエッジコンピューティング

**Cloudflareの特性**: 300+のエッジロケーションでの処理を最優先

### 2. Zero Trust セキュリティ

**評価項目**:
- WAF（Cloudflare Managed + OWASP）と DDoS Protection
- Cloudflare Access（Zero Trust Network Access）
- Bot Management と Rate Limiting
- SSL/TLS 1.3、セキュリティヘッダー

**Cloudflareの特性**: 「信頼せず、常に検証する」が基本原則

### 3. 開発者体験

**評価項目**:
- Workers 開発の生産性（TypeScript、Miniflare）
- デプロイの簡単さ（wrangler CLI、10秒以内）
- モニタリングとデバッグ（Analytics、Logpush）
- CI/CD 統合（GitHub Actions、プレビュー環境）

**Cloudflareの特性**: シンプルなデプロイ、ゼロコールドスタート

### 4. エンドユーザーパフォーマンス

**評価項目**:
- TTFB（Time to First Byte）100ms未満
- Core Web Vitals（LCP、FID、CLS）
- HTTP/3、QUIC、Brotli 圧縮
- Image Optimization、Polish

**Cloudflareの特性**: エッジでの高速処理による体感速度向上

### 5. コスト効率

**評価項目**:
- 無料枠の最大活用（Workers: 100,000 req/day）
- R2 Egress 無料化の活用
- Workers CPU 時間最適化
- 適切な料金プラン選択

**Cloudflareの特性**: 無料枠が充実、R2 egress 無料

### 6. 信頼性とレジリエンス

**評価項目**:
- Load Balancing、Health Checks
- Always Online（オリジンダウン時のキャッシュ配信）
- Workers エラーハンドリング
- グローバル冗長性（エニーキャスト）

**Cloudflareの特性**: 300+のエッジロケーションによる自動冗長

## レビューワークフロー

### ステップ1: 現状把握

**実施内容**:
- MCP サーバーでゾーン設定を取得
- DNS レコード、Page Rules、Workers Routes を確認
- Analytics でトラフィックパターンを分析
- 現在の料金プランとリソース使用状況を確認

### ステップ2: エッジファースト・アーキテクチャ評価

**評価観点**:
- キャッシュヒット率（目標: 90%以上）
- オリジンリクエスト削減率
- Workers によるエッジ処理割合
- グローバルエッジネットワーク活用状況

**Cloudflare特有の指標**:
- エッジでのレスポンス率: 80%以上
- Workers CPU 時間: 10ms/50ms 制限内
- コールドスタート: ゼロ（Cloudflare の特性）

### ステップ3: Zero Trust セキュリティ評価

**評価観点**:
- WAF（Cloudflare Managed + OWASP）の有効性
- Cloudflare Access（ZTNA）の適用状況
- DDoS Protection の設定（L3/L4、L7）
- Bot Management と Rate Limiting

**Cloudflare特有のチェック項目**:
- DDoS 検出時間: 3秒以内（自動）
- ミティゲーション時間: 10秒以内
- Zero Trust アクセス: 内部アプリの100%適用

### ステップ4: 開発者体験評価

**評価観点**:
- Workers 開発の生産性（TypeScript 使用率）
- デプロイ時間（目標: 10秒以内）
- CI/CD 自動化状況
- モニタリングとデバッグツール活用

**Cloudflare特有の指標**:
- wrangler CLI 活用
- プレビュー環境（Pages）自動生成
- Workers Analytics 有効化

### ステップ5: エンドユーザーパフォーマンス評価

**評価観点**:
- TTFB（Time to First Byte）100ms未満
- Core Web Vitals（LCP、FID、CLS）
- HTTP/3、QUIC 有効化
- 圧縮、Minify、Image Optimization

**使用するツール**:
- Web Analytics
- Lighthouse / PageSpeed Insights
- Workers Analytics

### ステップ6: コスト効率評価

**評価観点**:
- 無料枠活用状況（Workers、R2、Pages）
- R2 Egress 無料化の活用
- Workers CPU 時間最適化
- 料金プランの適切性

**Cloudflare特有のコスト指標**:
- R2 Egress: Cloudflare 経由で0円
- Workers 無料枠: 100,000 req/day 活用

### ステップ7: 信頼性とレジリエンス評価

**評価観点**:
- Load Balancing、Health Checks 設定
- Always Online 有効化
- Workers エラーハンドリング
- グローバル冗長性（エニーキャスト）

**Cloudflare特有の信頼性指標**:
- グローバル可用性: 99.99%以上
- エッジロケーション: 300+で自動分散
- 単一障害点: なし

### ステップ8: 改善提案

**提案内容**:
- 優先度付きの改善リスト
- 具体的な設定変更手順
- 期待される効果と ROI
- 実装スケジュール

## レビュー結果レポート

レビュー結果は以下の形式で提供します：

```markdown
# Cloudflare インフラレビューレポート

## エグゼクティブサマリー
- 総合評価: B+（80/100点）
- 主要な発見事項: [...]
- 優先度高の改善項目: [...]

## 詳細評価（6つの柱）

### 1. エッジファースト・アーキテクチャ: 85/100
- キャッシュヒット率: 75%（目標: 90%）
- オリジンリクエスト削減: 改善余地あり
- 改善提案: [...]

### 2. Zero Trust セキュリティ: 90/100
- WAF: Cloudflare Managed + OWASP 有効
- Cloudflare Access: 一部アプリで未適用
- 改善提案: [...]

### 3. 開発者体験: 75/100
- デプロイ時間: 15秒（目標: 10秒以内）
- CI/CD: 手動デプロイが残存
- 改善提案: [...]

### 4. エンドユーザーパフォーマンス: 88/100
- TTFB: 120ms（目標: 100ms未満）
- Core Web Vitals: LCP 改善が必要
- 改善提案: [...]

### 5. コスト効率: 80/100
- 無料枠活用: 良好
- R2 Egress: 最適化済み
- 改善提案: [...]

### 6. 信頼性とレジリエンス: 92/100
- Load Balancing: 適切に設定
- Workers エラー率: 0.05%（目標達成）
- 改善提案: [...]

[詳細は続く]
```

## ベストプラクティスチェックリスト

体系的なレビューのため、`./CHECKLIST.md` のチェックリストを使用します。Cloudflareの特性に基づいた120項目以上のチェックポイントで網羅的に評価します。

### チェックリストの構成（Cloudflare 6つの柱）

- **エッジファースト・アーキテクチャ**: 25項目
- **Zero Trust セキュリティ**: 30項目
- **開発者体験**: 20項目
- **エンドユーザーパフォーマンス**: 20項目
- **コスト効率**: 15項目
- **信頼性とレジリエンス**: 20項目

## 自動化スクリプト

レビューを効率化するための自動化スクリプトは `./CHECKLIST.md` の末尾に記載されています：

- キャッシュヒット率チェック
- セキュリティ設定監査
- コスト分析レポート
- パフォーマンスベンチマーク

## デフォルト設定

ユーザーから特別な指示がない限り、以下のデフォルト設定でレビューを進めます：

### レビュー範囲

| 項目 | デフォルト値 | 説明 |
|------|-------------|------|
| 評価柱 | 全5柱 | パフォーマンス、セキュリティ、信頼性、コスト、運用 |
| 詳細レベル | サマリー | 詳細分析が必要な場合は明示的に指定 |
| 優先度フィルター | Critical/High | Medium/Low は要望に応じて含める |

### レポート形式

| 項目 | デフォルト値 | 説明 |
|------|-------------|------|
| 形式 | Markdown テーブル | チェックリスト形式 |
| スコアリング | 100点満点 | 各柱の評価スコア |
| 改善提案 | 優先度順 | Critical → High → Medium → Low |

### 評価基準

| 項目 | デフォルト値 | 説明 |
|------|-------------|------|
| キャッシュヒット率 | 90%以上 | パフォーマンス目標 |
| Workers エラー率 | 0.1%未満 | 信頼性目標 |
| TLS バージョン | TLS 1.3 | セキュリティ推奨 |
| TTFB | 100ms未満 | パフォーマンス目標 |

## 依存関係

このスキルが正常に動作するために必要な依存関係：

### 必須依存関係

- **cloudflare-mcp-server** (`cloudflare:mcp-server-cloudflare`)
  - Cloudflare リソース情報の取得に使用
  - 使用するツール:
    - ゾーン設定取得
    - DNS レコード確認
    - Analytics データ取得

### オプション依存関係

- **wrangler CLI**: 設定確認とデプロイに使用
- **Lighthouse CLI**: パフォーマンス測定に使用

### 関連スキル

- `developing-cloudflare-solutions`: レビュー後の改善実装
- `researching-cloudflare-resources`: 詳細なリソース情報取得

## 注意事項

1. **MCP サーバー**: レビューは MCP サーバー経由で取得したリソース情報に基づく
2. **本番環境**: 変更は必ずステージング環境で検証してから適用
3. **実装支援**: レビュー後の実装支援が必要な場合は、`developing-cloudflare-solutions` スキルを使用
4. **コスト試算**: 改善提案には概算コストを含めるが、正確な見積もりは Cloudflare Dashboard で確認

このスキルにより、Cloudflare インフラストラクチャを体系的に評価し、ベストプラクティスに基づいた改善を実現できます。
