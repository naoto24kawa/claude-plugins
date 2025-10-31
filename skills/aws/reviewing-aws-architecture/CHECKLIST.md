# AWS Well-Architected Framework チェックリスト

このドキュメントは、アーキテクチャレビュー時に使用する具体的なチェックリストを提供します。各項目にチェックマークを付けて評価してください。

## 使用方法

- ✅ 準拠している
- ⚠️ 部分的に準拠（改善推奨）
- ❌ 準拠していない（要対応）
- N/A 該当なし

---

## 1. 運用の優秀性チェックリスト

### 1.1 運用の準備

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 1.1.1 | ワークロードの運用優先度が定義されている | ビジネスクリティカル度に基づく優先度付け | □ |
| 1.1.2 | すべてのリソースに必須タグが付与されている | `Environment`, `Owner`, `CostCenter` 等 | □ |
| 1.1.3 | Infrastructure as Code (IaC) を使用している | CloudFormation, CDK, Terraform | □ |
| 1.1.4 | IaC テンプレートがバージョン管理されている | Git リポジトリで管理 | □ |
| 1.1.5 | 運用手順書が文書化されている | デプロイ、障害対応、バックアップ復元等 | □ |
| 1.1.6 | ランブック（障害対応手順）が整備されている | よくある障害シナリオと対応手順 | □ |

### 1.2 モニタリングとログ

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 1.2.1 | CloudWatch Logs が有効化されている | Lambda, ECS, API Gateway 等 | □ |
| 1.2.2 | ログ保持期間が適切に設定されている | コンプライアンス要件に基づく設定 | □ |
| 1.2.3 | 主要メトリクスに CloudWatch Alarms が設定されている | CPU, メモリ, エラー率, レイテンシ等 | □ |
| 1.2.4 | アラーム通知先が設定されている | SNS トピック経由でメール/Slack/PagerDuty | □ |
| 1.2.5 | CloudWatch Logs Insights クエリが準備されている | トラブルシューティング用の定型クエリ | □ |
| 1.2.6 | X-Ray トレーシングが有効化されている | Lambda, API Gateway, ECS 等 | □ |
| 1.2.7 | CloudWatch Container Insights が有効化されている（コンテナ環境） | ECS, EKS | □ |

### 1.3 自動化

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 1.3.1 | CI/CD パイプラインが構築されている | CodePipeline, GitHub Actions, GitLab CI 等 | □ |
| 1.3.2 | デプロイが自動化されている | 手動操作なしでデプロイ可能 | □ |
| 1.3.3 | 自動テストが実装されている | ユニットテスト, 統合テスト, E2Eテスト | □ |
| 1.3.4 | ロールバック手順が自動化されている | デプロイ失敗時の自動ロールバック | □ |
| 1.3.5 | Systems Manager でパッチ管理が自動化されている | Patch Manager | □ |
| 1.3.6 | Systems Manager Run Command で運用タスクが自動化されている | 定型作業の自動化 | □ |

### 1.4 継続的改善

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 1.4.1 | インシデント後にポストモーテムを実施している | 根本原因分析と再発防止策 | □ |
| 1.4.2 | 運用メトリクスが定期的にレビューされている | MTTR, MTTD, デプロイ頻度等 | □ |
| 1.4.3 | 改善アクションが追跡されている | Jira, GitHub Issues 等で管理 | □ |
| 1.4.4 | ゲームデイ（障害訓練）を実施している | 年2回以上 | □ |

---

## 2. セキュリティチェックリスト

### 2.1 アイデンティティとアクセス管理

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 2.1.1 | ルートアカウントの使用が制限されている | 日常的な使用なし、MFA 必須 | □ |
| 2.1.2 | IAM ユーザーにMFAが設定されている | 人間のユーザー100% | □ |
| 2.1.3 | IAM ロールを使用している | アクセスキーではなくロールを優先 | □ |
| 2.1.4 | 最小権限の原則が適用されている | 必要な権限のみ付与 | □ |
| 2.1.5 | IAM ポリシーが定期的にレビューされている | 年2回以上 | □ |
| 2.1.6 | 未使用の IAM ユーザー/ロールが削除されている | 90日以上未使用 | □ |
| 2.1.7 | 未使用のアクセスキーが削除されている | 90日以上未使用 | □ |
| 2.1.8 | IAM パスワードポリシーが強化されている | 最小長12文字以上、複雑性要件 | □ |
| 2.1.9 | IAM Access Analyzer が有効化されている | 外部共有リソースの検出 | □ |

### 2.2 検知と対応

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 2.2.1 | CloudTrail がすべてのリージョンで有効化されている | マルチリージョントレイル | □ |
| 2.2.2 | CloudTrail ログが S3 に保管されている | ログ改ざん防止（S3 Object Lock） | □ |
| 2.2.3 | GuardDuty が有効化されている | 脅威検出 | □ |
| 2.2.4 | Security Hub が有効化されている | セキュリティスコア、統合管理 | □ |
| 2.2.5 | AWS Config が有効化されている | コンプライアンス監視 | □ |
| 2.2.6 | Config ルールが設定されている | セキュリティベストプラクティス監視 | □ |
| 2.2.7 | VPC Flow Logs が有効化されている | ネットワークトラフィック監視 | □ |
| 2.2.8 | セキュリティアラートが通知される | SNS, EventBridge 経由 | □ |
| 2.2.9 | インシデント対応手順が文書化されている | ランブック、エスカレーションパス | □ |

### 2.3 ネットワーク保護

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 2.3.1 | VPC でネットワークが分離されている | 本番/ステージング/開発 | □ |
| 2.3.2 | プライベートサブネットが使用されている | DB, アプリサーバー等 | □ |
| 2.3.3 | セキュリティグループが最小権限で設定されている | 必要なポート/IPのみ許可 | □ |
| 2.3.4 | 0.0.0.0/0 からのアクセスが制限されている | 必要最小限のリソースのみ | □ |
| 2.3.5 | Network ACL が適切に設定されている（必要に応じて） | 追加の防御層 | □ |
| 2.3.6 | AWS WAF が有効化されている（公開API/Webサイト） | SQLインジェクション、XSS対策 | □ |
| 2.3.7 | AWS Shield Standard が有効になっている | デフォルトで有効 | □ |
| 2.3.8 | ELB でセキュアな TLS ポリシーが使用されている | TLS 1.2 以上 | □ |

### 2.4 データ保護

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 2.4.1 | S3 バケットがデフォルトで暗号化されている | SSE-S3 または SSE-KMS | □ |
| 2.4.2 | S3 パブリックアクセスがブロックされている | すべてのバケット | □ |
| 2.4.3 | S3 バージョニングが有効化されている | 重要データ | □ |
| 2.4.4 | RDS インスタンスが暗号化されている | 保管時の暗号化 | □ |
| 2.4.5 | EBS ボリュームが暗号化されている | すべてのボリューム | □ |
| 2.4.6 | データ転送時の暗号化が強制されている | TLS/SSL | □ |
| 2.4.7 | Secrets Manager でシークレットが管理されている | パスワード, APIキー等 | □ |
| 2.4.8 | KMS キーのローテーションが有効化されている | 自動ローテーション | □ |
| 2.4.9 | バックアップが暗号化されている | RDS スナップショット等 | □ |

---

## 3. 信頼性チェックリスト

### 3.1 基盤

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 3.1.1 | マルチAZ 構成が採用されている（本番環境） | RDS, ECS, ALB 等 | □ |
| 3.1.2 | 複数の Availability Zone にリソースが分散されている | 単一AZ障害への耐性 | □ |
| 3.1.3 | Service Quotas が監視されている | クォータ使用率80%でアラート | □ |
| 3.1.4 | 適切な VPC 設計がされている | パブリック/プライベートサブネット | □ |
| 3.1.5 | DNS フェイルオーバーが設定されている（必要に応じて） | Route 53 ヘルスチェック | □ |

### 3.2 ワークロードアーキテクチャ

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 3.2.1 | シングルポイントオブフェイルが排除されている | 冗長化 | □ |
| 3.2.2 | ロードバランサーが使用されている | ALB, NLB | □ |
| 3.2.3 | ヘルスチェックが適切に設定されている | エンドポイント、頻度、閾値 | □ |
| 3.2.4 | Auto Scaling が設定されている | 需要変動への対応 | □ |
| 3.2.5 | ステートレスなアプリケーション設計 | セッションはElastiCacheやDynamoDB | □ |
| 3.2.6 | サービス間の疎結合が実現されている | SQS, SNS, EventBridge | □ |

### 3.3 変更管理

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 3.3.1 | Infrastructure as Code で変更が管理されている | CloudFormation, CDK | □ |
| 3.3.2 | すべての変更がバージョン管理されている | Git | □ |
| 3.3.3 | デプロイ戦略が定義されている | ブルー/グリーン、カナリア | □ |
| 3.3.4 | ロールバック手順が整備されている | すべてのデプロイ | □ |
| 3.3.5 | 変更がテスト環境で検証されている | 本番前のステージング環境テスト | □ |

### 3.4 障害管理

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 3.4.1 | データベースの自動バックアップが有効化されている | RDS, DynamoDB | □ |
| 3.4.2 | バックアップ保持期間が適切に設定されている | 7日以上推奨 | □ |
| 3.4.3 | 定期的にバックアップ復元テストが実施されている | 四半期に1回以上 | □ |
| 3.4.4 | S3 オブジェクトのバージョニングが有効化されている | 重要データ | □ |
| 3.4.5 | RTO/RPO 目標が定義されている | 復旧時間目標、復旧ポイント目標 | □ |
| 3.4.6 | ディザスタリカバリ計画が策定されている | DR手順書 | □ |
| 3.4.7 | DR訓練が実施されている | 年1回以上 | □ |

---

## 4. パフォーマンス効率チェックリスト

### 4.1 リソース選択

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 4.1.1 | 適切な EC2 インスタンスタイプが選択されている | ワークロードに応じた選択 | □ |
| 4.1.2 | Lambda のメモリ設定が最適化されている | コスト vs パフォーマンスのバランス | □ |
| 4.1.3 | 適切なストレージタイプが選択されている | SSD vs HDD、ストレージクラス | □ |
| 4.1.4 | 適切なデータベースエンジンが選択されている | RDS vs DynamoDB vs Aurora | □ |

### 4.2 モニタリングと分析

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 4.2.1 | RDS Performance Insights が有効化されている | データベースパフォーマンス分析 | □ |
| 4.2.2 | X-Ray トレーシングが有効化されている | 分散トレーシング | □ |
| 4.2.3 | CloudWatch Metrics が収集されている | CPU, メモリ, ディスク, ネットワーク | □ |
| 4.2.4 | アプリケーションレベルのメトリクスが収集されている | カスタムメトリクス | □ |
| 4.2.5 | Synthetic Monitoring が実装されている | CloudWatch Synthetics | □ |

### 4.3 最適化

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 4.3.1 | CloudFront が使用されている（静的コンテンツ） | CDN | □ |
| 4.3.2 | ElastiCache が使用されている（頻繁にアクセスされるデータ） | Redis, Memcached | □ |
| 4.3.3 | データベースインデックスが最適化されている | クエリパフォーマンス向上 | □ |
| 4.3.4 | Lambda Cold Start が軽減されている | プロビジョニング済み同時実行数 | □ |
| 4.3.5 | コンテナイメージサイズが最適化されている | マルチステージビルド | □ |

### 4.4 レビューと改善

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 4.4.1 | Compute Optimizer の推奨事項が定期的にレビューされている | 四半期に1回以上 | □ |
| 4.4.2 | パフォーマンステストが定期的に実施されている | 負荷テスト、ストレステスト | □ |
| 4.4.3 | 新しいAWSサービスが評価されている | パフォーマンス向上の機会 | □ |

---

## 5. コスト最適化チェックリスト

### 5.1 クラウド財務管理

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 5.1.1 | すべてのリソースにコストタグが付与されている | `CostCenter`, `Project` | □ |
| 5.1.2 | Cost Explorer でコストが分析されている | 月次レビュー | □ |
| 5.1.3 | AWS Budgets が設定されている | プロジェクト/環境ごと | □ |
| 5.1.4 | Cost Anomaly Detection が有効化されている | 異常なコスト増加の検出 | □ |
| 5.1.5 | コストレポートが定期的に作成されている | 月次 | □ |

### 5.2 費用対効果の高いリソース

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 5.2.1 | Savings Plans が購入されている | EC2, Lambda, Fargate | □ |
| 5.2.2 | Reserved Instances が購入されている（該当する場合） | RDS, ElastiCache等 | □ |
| 5.2.3 | Spot Instances が活用されている | バッチ処理、開発環境 | □ |
| 5.2.4 | S3 Intelligent-Tiering が活用されている | アクセスパターン不明なデータ | □ |
| 5.2.5 | S3 Glacier が活用されている | アーカイブデータ | □ |

### 5.3  需要と供給の一致

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 5.3.1 | Auto Scaling が設定されている | EC2, ECS, Lambda | □ |
| 5.3.2 | スケジュールベースのスケーリングが設定されている | 予測可能な需要変動 | □ |
| 5.3.3 | 開発/ステージング環境が営業時間外に停止されている | 夜間・週末停止 | □ |
| 5.3.4 | サーバーレスアーキテクチャが活用されている | Lambda, Fargate | □ |

### 5.4 継続的な最適化

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 5.4.1 | 未使用 Elastic IP が削除されている | アタッチされていないEIP | □ |
| 5.4.2 | 未使用 EBS ボリュームが削除されている | アタッチされていないボリューム | □ |
| 5.4.3 | 古いスナップショットが削除されている | ライフサイクルポリシー | □ |
| 5.4.4 | Trusted Advisor の推奨事項が定期的にレビューされている | 月次 | □ |
| 5.4.5 | Compute Optimizer の推奨事項が適用されている | インスタンスサイズ最適化 | □ |
| 5.4.6 | 過剰プロビジョニングが検出されている | CPU使用率10%未満等 | □ |
| 5.4.7 | データ転送コストが最適化されている | VPC Endpoint, CloudFront活用 | □ |

---

## 6. 持続可能性チェックリスト

### 6.1 リージョン選択

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 6.1.1 | 再生可能エネルギー比率が高いリージョンが選択されている | us-west-2, eu-central-1, ca-central-1 等 | □ |
| 6.1.2 | ユーザーとの距離とエネルギー効率のバランスが考慮されている | レイテンシと炭素排出量のトレードオフ | □ |
| 6.1.3 | AWS Customer Carbon Footprint Tool で炭素排出量が追跡されている | 定期的な測定 | □ |

### 6.2 リソースの適切なサイジング

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 6.2.1 | AWS Compute Optimizer の推奨事項が適用されている | EC2, Lambda のサイジング最適化 | □ |
| 6.2.2 | リソース使用率が適切な範囲にある | CPU/メモリ使用率 40%以上 | □ |
| 6.2.3 | 過剰プロビジョニングが排除されている | 低使用率リソースの削減 | □ |
| 6.2.4 | サーバーレスアーキテクチャが活用されている | Lambda, Fargate で未使用リソースを削減 | □ |
| 6.2.5 | アイドル時間のリソースが適切に停止されている | 24時間稼働の必要性を再評価 | □ |

### 6.3 データ管理とストレージ最適化

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 6.3.1 | S3 Intelligent-Tiering が活用されている | アクセスパターンに応じた自動最適化 | □ |
| 6.3.2 | S3 ライフサイクルポリシーが設定されている | 不要なデータの自動削除・アーカイブ | □ |
| 6.3.3 | データ圧縮が実装されている | ログ、バックアップの圧縮 | □ |
| 6.3.4 | 不要なデータが定期的に削除されている | データ保持ポリシーの適用 | □ |

### 6.4 ハードウェアとソフトウェアの効率

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 6.4.1 | AWS Graviton プロセッサが活用されている | ARM ベース、60%エネルギー効率向上 | □ |
| 6.4.2 | 最新世代のインスタンスタイプが使用されている | m7g, c7g, r7g 等 | □ |
| 6.4.3 | EBS gp3 が使用されている（gp2 からの移行） | 同パフォーマンスで20%エネルギー削減 | □ |
| 6.4.4 | コードが効率的に最適化されている | プロファイリングツールでボトルネック特定 | □ |

### 6.5 エネルギー効率の高いアーキテクチャパターン

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 6.5.1 | イベント駆動アーキテクチャが採用されている | EventBridge + Lambda で常時稼働を回避 | □ |
| 6.5.2 | キャッシング戦略が実装されている | CloudFront, ElastiCache でコンピューティング削減 | □ |
| 6.5.3 | 非同期処理が活用されている | SQS, EventBridge でリソース使用を平準化 | □ |

### 6.6 開発とデプロイメントの最適化

| # | 項目 | 詳細 | 状態 |
|---|------|------|------|
| 6.6.1 | 開発/テスト環境が最小限のリソースで構築されている | 本番と同サイズを回避 | □ |
| 6.6.2 | 開発環境が非営業時間に自動停止されている | 夜間・週末停止で50%削減 | □ |
| 6.6.3 | CI/CD パイプラインが効率化されている | ビルド時間の最小化 | □ |

---

## レビュー結果サマリー

各柱のスコアを計算し、総合評価を行います：

| 柱 | チェック項目数 | 準拠数 | 準拠率 | 評価 |
|----|--------------|--------|--------|------|
| 運用の優秀性 | 20 | - | -% | - |
| セキュリティ | 30 | - | -% | - |
| 信頼性 | 25 | - | -% | - |
| パフォーマンス効率 | 20 | - | -% | - |
| コスト最適化 | 25 | - | -% | - |
| 持続可能性 | 22 | - | -% | - |
| **合計** | **142** | - | -% | - |

### 評価基準

- **Excellent（優秀）**: 90%以上
- **Good（良好）**: 70-89%
- **Fair（普通）**: 50-69%
- **Poor（不良）**: 50%未満

---

## レビュー自動化スクリプト

このセクションでは、Well-Architected Framework のレビューを自動化・効率化するための AWS CLI スクリプトを提供します。

### 1. セキュリティグループ監査スクリプト

広範な IP レンジ（0.0.0.0/0）を許可しているセキュリティグループを検出します。

```bash
#!/bin/bash
# check-security-groups.sh - セキュリティグループの監査

REGION=${1:-"ap-northeast-1"}

echo "🔍 Checking Security Groups in ${REGION}..."
echo ""

# すべてのセキュリティグループを取得
SG_LIST=$(aws ec2 describe-security-groups --region ${REGION} --query 'SecurityGroups[*].[GroupId,GroupName]' --output text)

echo "Security Groups with 0.0.0.0/0 access:"
echo "========================================"
echo ""

while IFS=$'\t' read -r GROUP_ID GROUP_NAME; do
  # 0.0.0.0/0 を許可しているルールをチェック
  RISKY_RULES=$(aws ec2 describe-security-groups \
    --group-ids ${GROUP_ID} \
    --region ${REGION} \
    --query "SecurityGroups[0].IpPermissions[?contains(IpRanges[].CidrIp, '0.0.0.0/0')].[FromPort,ToPort,IpProtocol]" \
    --output text)

  if [ -n "$RISKY_RULES" ]; then
    echo "⚠️  Group: ${GROUP_NAME} (${GROUP_ID})"
    echo "   Ports: ${RISKY_RULES}"
    echo ""
  fi
done <<< "$SG_LIST"

echo "✅ Security group audit completed!"
```

### 2. 未使用リソース検出スクリプト

コスト削減のため、未使用の Elastic IP、EBS ボリューム、古いスナップショットを検出します。

```bash
#!/bin/bash
# detect-unused-resources.sh - 未使用リソースの検出

REGION=${1:-"ap-northeast-1"}
SNAPSHOT_AGE_DAYS=${2:-90}

echo "🔍 Detecting unused resources in ${REGION}..."
echo ""

# 1. 未使用 Elastic IP
echo "📍 Unattached Elastic IPs:"
echo "=========================="
aws ec2 describe-addresses --region ${REGION} \
  --query 'Addresses[?AssociationId==`null`].[PublicIp,AllocationId]' \
  --output table

# 2. 未使用 EBS ボリューム
echo ""
echo "💾 Unattached EBS Volumes:"
echo "=========================="
aws ec2 describe-volumes --region ${REGION} \
  --filters Name=status,Values=available \
  --query 'Volumes[*].[VolumeId,Size,VolumeType,CreateTime]' \
  --output table

# 3. 古いスナップショット
echo ""
echo "📸 Old Snapshots (older than ${SNAPSHOT_AGE_DAYS} days):"
echo "======================================================"
CUTOFF_DATE=$(date -u -d "${SNAPSHOT_AGE_DAYS} days ago" +%Y-%m-%d)

aws ec2 describe-snapshots --region ${REGION} \
  --owner-ids self \
  --query "Snapshots[?StartTime<'${CUTOFF_DATE}'].[SnapshotId,VolumeSize,StartTime,Description]" \
  --output table

# 4. 未使用 NAT Gateway
echo ""
echo "🌐 NAT Gateways with no traffic (last 7 days):"
echo "=============================================="
for NAT_ID in $(aws ec2 describe-nat-gateways --region ${REGION} --query 'NatGateways[?State==`available`].NatGatewayId' --output text); do
  BYTES=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/NATGateway \
    --metric-name BytesOutToSource \
    --dimensions Name=NatGatewayId,Value=${NAT_ID} \
    --statistics Sum \
    --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 604800 \
    --region ${REGION} \
    --query 'Datapoints[0].Sum')

  if [ "$BYTES" = "null" ] || [ "$BYTES" = "0.0" ] || [ -z "$BYTES" ]; then
    echo "⚠️  NAT Gateway: ${NAT_ID} (No traffic detected)"
  fi
done

echo ""
echo "✅ Unused resource detection completed!"
```

### 3. コスト分析スクリプト

月間コストが高額なリソースを特定し、最適化の機会を発見します。

```bash
#!/bin/bash
# analyze-costs.sh - コスト分析

# 過去30日間のコストを取得
echo "💰 Analyzing AWS costs for the last 30 days..."
echo ""

# サービス別コスト
echo "📊 Cost by Service:"
echo "==================="
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --query 'ResultsByTime[0].Groups[?Metrics.BlendedCost.Amount>`10`].[Keys[0],Metrics.BlendedCost.Amount,Metrics.BlendedCost.Unit]' \
  --output table

# リージョン別コスト
echo ""
echo "🌏 Cost by Region:"
echo "=================="
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=REGION \
  --query 'ResultsByTime[0].Groups[?Metrics.BlendedCost.Amount>`5`].[Keys[0],Metrics.BlendedCost.Amount]' \
  --output table

# Savings Plans / Reserved Instances のカバレッジ
echo ""
echo "📈 Savings Plans Coverage:"
echo "=========================="
aws ce get-savings-plans-coverage \
  --time-period Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --query 'SavingsPlansCoverages[0].Coverage' \
  --output table

echo ""
echo "✅ Cost analysis completed!"
echo "💡 Tip: Review high-cost services for optimization opportunities"
```

### 4. Well-Architected Tool レビュー自動化

AWS Well-Architected Tool を使用したワークロードレビューを自動化します。

```bash
#!/bin/bash
# well-architected-review.sh - Well-Architected Tool レビュー

WORKLOAD_NAME=$1
REGION=${2:-"ap-northeast-1"}

if [ -z "$WORKLOAD_NAME" ]; then
  echo "Usage: ./well-architected-review.sh WORKLOAD_NAME [REGION]"
  exit 1
fi

echo "🏗️  Starting Well-Architected review for: ${WORKLOAD_NAME}"
echo ""

# ワークロードを検索
WORKLOAD_ID=$(aws wellarchitected list-workloads --region ${REGION} \
  --query "WorkloadSummaries[?WorkloadName=='${WORKLOAD_NAME}'].WorkloadId" \
  --output text)

if [ -z "$WORKLOAD_ID" ]; then
  echo "❌ Workload not found: ${WORKLOAD_NAME}"
  echo "Creating new workload..."

  WORKLOAD_ID=$(aws wellarchitected create-workload \
    --workload-name "${WORKLOAD_NAME}" \
    --description "Automated review workload" \
    --environment PRODUCTION \
    --regions ${REGION} \
    --region ${REGION} \
    --query 'WorkloadId' \
    --output text)

  echo "✅ Created workload: ${WORKLOAD_ID}"
fi

echo "📋 Workload ID: ${WORKLOAD_ID}"
echo ""

# すべてのレンズを取得
echo "🔍 Available lenses:"
aws wellarchitected list-lenses --region ${REGION} \
  --query 'LensSummaries[*].[LensAlias,LensName]' \
  --output table

# Well-Architected Framework レンズでレビューを開始
echo ""
echo "🚀 Starting review with Well-Architected Framework lens..."

# マイルストーンを作成
MILESTONE_NAME="review-$(date +%Y%m%d-%H%M%S)"
aws wellarchitected create-milestone \
  --workload-id ${WORKLOAD_ID} \
  --milestone-name ${MILESTONE_NAME} \
  --region ${REGION}

echo "✅ Milestone created: ${MILESTONE_NAME}"

# リスク件数をカウント
echo ""
echo "📊 Risk Summary:"
aws wellarchitected get-workload \
  --workload-id ${WORKLOAD_ID} \
  --region ${REGION} \
  --query 'Workload.RiskCounts'

echo ""
echo "✅ Well-Architected review completed!"
echo "💡 View detailed results in AWS Console:"
echo "   https://console.aws.amazon.com/wellarchitected/workloads/${WORKLOAD_ID}"
```

### 5. Trusted Advisor チェック結果取得

Trusted Advisor の推奨事項を取得し、改善が必要な項目を特定します。

```bash
#!/bin/bash
# trusted-advisor-check.sh - Trusted Advisor チェック結果の取得

echo "🔍 Fetching Trusted Advisor recommendations..."
echo ""

# すべてのチェックを取得
CHECKS=$(aws support describe-trusted-advisor-checks \
  --language en \
  --query 'checks[*].[id,name,category]' \
  --output text)

echo "📊 Trusted Advisor Checks with Issues:"
echo "======================================"
echo ""

while IFS=$'\t' read -r CHECK_ID CHECK_NAME CATEGORY; do
  # チェック結果を取得
  RESULT=$(aws support describe-trusted-advisor-check-result \
    --check-id ${CHECK_ID} \
    --query 'result.{Status:status,ResourcesProcessed:resourcesSummary.resourcesProcessed,ResourcesFlagged:resourcesSummary.resourcesFlagged}' \
    --output json)

  STATUS=$(echo $RESULT | jq -r '.Status')
  FLAGGED=$(echo $RESULT | jq -r '.ResourcesFlagged')

  # エラーまたは警告があるチェックのみ表示
  if [ "$STATUS" = "error" ] || [ "$STATUS" = "warning" ] && [ "$FLAGGED" != "0" ]; then
    echo "⚠️  [$CATEGORY] $CHECK_NAME"
    echo "   Status: $STATUS, Flagged Resources: $FLAGGED"
    echo ""
  fi
done <<< "$CHECKS"

echo "✅ Trusted Advisor check completed!"
echo "💡 Tip: Address flagged items to improve your architecture"
```

### 6. リソースタグコンプライアンスチェック

必須タグが適用されているかをチェックし、タグ付け戦略の遵守を確認します。

```bash
#!/bin/bash
# check-tag-compliance.sh - タグコンプライアンスチェック

REGION=${1:-"ap-northeast-1"}
REQUIRED_TAGS=("Environment" "Owner" "CostCenter")

echo "🏷️  Checking tag compliance in ${REGION}..."
echo "Required tags: ${REQUIRED_TAGS[@]}"
echo ""

# EC2 インスタンスのタグチェック
echo "🖥️  EC2 Instances without required tags:"
echo "========================================"

for INSTANCE_ID in $(aws ec2 describe-instances --region ${REGION} \
  --query 'Reservations[*].Instances[*].InstanceId' --output text); do

  TAGS=$(aws ec2 describe-tags --region ${REGION} \
    --filters "Name=resource-id,Values=${INSTANCE_ID}" \
    --query 'Tags[*].Key' --output text)

  MISSING_TAGS=()
  for REQUIRED_TAG in "${REQUIRED_TAGS[@]}"; do
    if [[ ! " ${TAGS} " =~ " ${REQUIRED_TAG} " ]]; then
      MISSING_TAGS+=("$REQUIRED_TAG")
    fi
  done

  if [ ${#MISSING_TAGS[@]} -gt 0 ]; then
    echo "⚠️  Instance: ${INSTANCE_ID}"
    echo "   Missing tags: ${MISSING_TAGS[@]}"
    echo ""
  fi
done

# S3 バケットのタグチェック
echo "🪣 S3 Buckets without required tags:"
echo "===================================="

for BUCKET in $(aws s3api list-buckets --query 'Buckets[*].Name' --output text); do
  TAGS=$(aws s3api get-bucket-tagging --bucket ${BUCKET} 2>/dev/null | \
    jq -r '.TagSet[].Key' 2>/dev/null || echo "")

  MISSING_TAGS=()
  for REQUIRED_TAG in "${REQUIRED_TAGS[@]}"; do
    if [[ ! " ${TAGS} " =~ " ${REQUIRED_TAG} " ]]; then
      MISSING_TAGS+=("$REQUIRED_TAG")
    fi
  done

  if [ ${#MISSING_TAGS[@]} -gt 0 ]; then
    echo "⚠️  Bucket: ${BUCKET}"
    echo "   Missing tags: ${MISSING_TAGS[@]}"
    echo ""
  fi
done

echo "✅ Tag compliance check completed!"
```

---

### スクリプト使用方法

すべてのスクリプトは実行権限を付与してから使用してください：

```bash
chmod +x check-security-groups.sh
chmod +x detect-unused-resources.sh
chmod +x analyze-costs.sh
chmod +x well-architected-review.sh
chmod +x trusted-advisor-check.sh
chmod +x check-tag-compliance.sh
```

定期的なレビューのため、これらのスクリプトを cron または AWS EventBridge で自動実行することを推奨します。

---

このチェックリストと自動化スクリプトを活用して、体系的なアーキテクチャレビューを実施してください。
