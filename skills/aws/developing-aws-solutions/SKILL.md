---
name: developing-aws-solutions
description: AWSサービスの実装、アーキテクチャ設計、Infrastructure as Code（CloudFormation/CDK/Terraform）の構築を支援。Lambda、ECS、EKS、RDS、DynamoDB、S3、API Gateway等の実装、デプロイ、設定を公式ドキュメント参照により正確にサポート。「AWS実装」「Lambda開発」「インフラ構築」「CDK」「CloudFormation」「コンテナデプロイ」「データベース設定」「API作成」などの依頼時に使用
---

## AWSソリューション開発支援スキル

このスキルは、AWSサービスの実装とアーキテクチャ設計を、公式ドキュメントに基づいて正確にサポートします。aws-documentation-mcp-serverを活用し、常に最新の仕様とベストプラクティスに基づいた開発支援を提供します。

## 目次

1. [使用例](#使用例)
2. [基本原則](#基本原則)
3. [開発ワークフロー](#開発ワークフロー)
4. [専門分野とサービスカタログ](#専門分野とサービスカタログ)
5. [実装パターンとベストプラクティス](#実装パターンとベストプラクティス)
6. [実装例](#実装例)
7. [デフォルト設定](#デフォルト設定)
8. [注意事項](#注意事項)
9. [エラーハンドリング](#エラーハンドリング)
10. [依存関係](#依存関係)

---

## 使用例

### 例1: Lambda関数の実装

```
状況: REST APIのバックエンドとしてLambda関数を実装したい
要求: Node.js 20、DynamoDB連携、API Gateway統合
期待: 実装コード、IAMロール設定、デプロイ手順
```

### 例2: ECSクラスタの構築

```
状況: Dockerコンテナアプリケーションをプロダクション環境にデプロイ
要求: Fargate、Application Load Balancer、Auto Scaling設定
期待: CDKまたはCloudFormationコード、セキュリティ設定
```

### 例3: マルチリージョンデータベース構成

```
状況: グローバルサービスのためのデータベース設計
要求: Aurora Global Database、読み取りレプリカ、フェイルオーバー設定
期待: アーキテクチャ図、実装手順、コスト見積もり
```

## 基本原則

### 1. ドキュメント駆動開発

すべての実装は、`awslabs:aws-documentation-mcp-server` を通じて取得した公式AWSドキュメントに基づいて行います。推測や記憶に頼らず、必ず最新のドキュメントを確認してください。

**必須アクション**:
- サービスの仕様、API、制限事項について言及する際は公式ドキュメントを参照
- バージョン固有の情報や非推奨の機能について注意深く確認
- ドキュメントの参照元（サービス名、セクション）を明示

### 2. 正確性とセキュリティの確保

**検証項目**:
- 提供する設定やコードが公式ドキュメントの仕様と一致することを確認
- 制限事項やクォータを考慮した実装可能性を検証
- リージョン固有の制約やサービス可用性を確認
- IAMポリシーは最小権限の原則に従う
- データ暗号化（転送時・保管時）を標準で適用

### 3. 実装可能性とコスト考慮

**提案の条件**:
- 実装可能で現実的なソリューションを優先
- 複数の選択肢がある場合は、コスト、パフォーマンス、保守性を比較
- 概算コストと料金モデルを説明
- 無料利用枠やコスト最適化の選択肢を提示

## 開発ワークフロー

### ステップ1: 要件分析とサービス選定

**実施内容**:
- ユーザーの要求を分析し、適切なAWSサービスを特定
- 機能要件、非機能要件（パフォーマンス、可用性、セキュリティ）を整理
- 既存システムとの統合要件を確認

**検証**:
- 選定したサービスがユーザーの要件を満たすか確認
- サービスの制限事項が要件に抵触しないか検証

### ステップ2: ドキュメント参照とベストプラクティス確認

**実施内容**:
- `awslabs:aws-documentation-mcp-server:search_documentation` で関連ドキュメントを検索
- `awslabs:aws-documentation-mcp-server:read_documentation` で詳細を取得
- 複数のサービスが関わる場合は、それぞれのドキュメントを確認
- 最新のアップデートや変更点を確認
- ベストプラクティスガイド、セキュリティガイドラインを参照

**参照すべきドキュメント**:
- サービスの概要とユースケース
- API リファレンス
- セキュリティのベストプラクティス
- 料金体系とコスト最適化
- 制限とクォータ

### ステップ3: アーキテクチャ設計

**実施内容**:
- システム構成図の設計（コンポーネント、ネットワーク、データフロー）
- サービス間の連携方法の決定
- セキュリティ境界とアクセス制御の設計
- 可用性とディザスタリカバリの考慮

**設計時の考慮事項**:
- スケーラビリティ: Auto Scaling、負荷分散
- 可用性: マルチAZ/マルチリージョン構成
- セキュリティ: VPC設計、IAMロール、暗号化
- パフォーマンス: キャッシング、CDN、データベースインデックス
- コスト: リザーブドインスタンス、Spot、S3ストレージクラス

### ステップ4: 実装とコード生成

**提供する成果物**:

1. **Infrastructure as Code**
   - CloudFormation テンプレート（YAML/JSON）
   - AWS CDK コード（TypeScript/Python/Java）
   - Terraform 定義ファイル（必要に応じて）

2. **アプリケーションコード**
   - Lambda 関数コード（Node.js/Python/Go等）
   - コンテナアプリケーションコード
   - 設定ファイル（environment variables、secrets）

3. **IAM ポリシーとロール**
   - 最小権限の原則に基づくIAMポリシー
   - サービスロール、実行ロールの定義
   - リソースベースポリシー（S3バケットポリシー等）

4. **デプロイ手順**
   - AWS CLI コマンド
   - AWS Console での手順（スクリーンショット説明付き）
   - CI/CD パイプライン設定（CodePipeline/GitHub Actions等）

**コード品質基準**:
- エラーハンドリングとリトライロジックの実装
- ログ出力（CloudWatch Logs統合）
- メトリクス収集（CloudWatch Metrics）
- 環境変数による設定の外部化
- シークレット管理（Secrets Manager/Parameter Store）

### ステップ5: デプロイと検証

**実施内容**:
- デプロイ手順の説明（ステップバイステップ）
- 初回デプロイ時の注意事項
- 動作確認方法とテストシナリオ
- ロールバック手順

**検証項目**:
- リソースが正しく作成されているか確認
- セキュリティグループ、IAMロールが適切か検証
- アプリケーションが正常に動作するか確認
- ログ、メトリクスが正しく収集されているか確認

### ステップ6: モニタリングとトラブルシューティング

**設定すべき監視項目**:
- CloudWatch Alarms（CPU、メモリ、エラー率等）
- X-Ray トレーシング（分散トレース）
- CloudWatch Logs Insights クエリ
- Cost Explorer アラート

**トラブルシューティング手法**:
- よくある問題とその解決方法
- ログ分析のベストプラクティス
- パフォーマンス問題の診断手順
- AWS サポートへのエスカレーション基準

## 専門分野とサービスカタログ

このスキルは以下のAWSサービス分野をカバーします。各分野の詳細な実装ガイドは `./SERVICE_CATALOG.md` を参照してください。

### カバーするサービス分野

- **コンピューティング**: EC2, Lambda, ECS, EKS, Batch, App Runner
- **ストレージ**: S3, EBS, EFS, FSx, Storage Gateway
- **データベース**: RDS, Aurora, DynamoDB, DocumentDB, Neptune, ElastiCache
- **ネットワーキング**: VPC, CloudFront, Route 53, API Gateway, Transit Gateway, Direct Connect
- **セキュリティ**: IAM, KMS, Secrets Manager, WAF, Shield, GuardDuty
- **監視・運用**: CloudWatch, X-Ray, Systems Manager, CloudTrail, Config
- **Infrastructure as Code**: CloudFormation, CDK, Systems Manager (State Manager)
- **CI/CD**: CodePipeline, CodeBuild, CodeDeploy, CodeCommit
- **メッセージング**: SQS, SNS, EventBridge, Kinesis
- **機械学習**: SageMaker, Bedrock, Rekognition, Comprehend

**詳細ガイド**: サービスごとの実装パターン、ユースケース、コード例は `./SERVICE_CATALOG.md` を参照

## 実装パターンとベストプラクティス

### サーバーレスアーキテクチャ

**構成要素**:
- API Gateway + Lambda + DynamoDB
- S3 イベント + Lambda + SQS
- EventBridge + Lambda（イベント駆動）

**ベストプラクティス**:
- Lambda 関数の同時実行数制限設定
- DynamoDB のオンデマンドキャパシティ vs プロビジョニングキャパシティ選択
- API Gateway のスロットリング設定

### コンテナアーキテクチャ

**構成要素**:
- ECS Fargate + ALB + ECR
- EKS + Application Load Balancer Controller
- App Runner（シンプルなデプロイ）

**ベストプラクティス**:
- マルチステージDockerビルドによるイメージサイズ最適化
- ECR イメージスキャン有効化
- タスク定義のリソース制限設定

### データベースアーキテクチャ

**構成要素**:
- RDS Multi-AZ + Read Replica
- Aurora Global Database
- DynamoDB グローバルテーブル

**ベストプラクティス**:
- 自動バックアップとスナップショット設定
- データベース接続プーリング（RDS Proxy）
- パフォーマンスインサイト有効化

## 実装例

よくある実装パターンの具体例は `./EXAMPLES.md` を参照してください：

- REST API（API Gateway + Lambda + DynamoDB）
- コンテナアプリケーション（ECS Fargate + RDS）
- データパイプライン（S3 + Lambda + Glue + Athena）
- マルチリージョン構成（Route 53 + CloudFront + Aurora Global Database）

## デフォルト設定

ユーザーから特別な指示がない限り、以下のデフォルト設定で実装を進めます：

### 開発環境

| 項目 | デフォルト値 | 理由 |
|------|-------------|------|
| ランタイム（Lambda） | Python 3.12 または Node.js 20 | 最新の安定版、長期サポート |
| ランタイム（コンテナ） | Amazon Linux 2023 | AWS最適化、セキュリティアップデート |
| リージョン | us-east-1（グローバル）/ ap-northeast-1（日本） | レイテンシと料金のバランス |

### Infrastructure as Code

| 項目 | デフォルト値 | 理由 |
|------|-------------|------|
| IaCツール | AWS CDK（TypeScript） | 型安全性、再利用性、AWSサービスの最新対応 |
| 代替案 | CloudFormation（ユーザー指定時） | AWS純正、追加ツール不要 |

### セキュリティ

| 項目 | デフォルト値 | 理由 |
|------|-------------|------|
| 暗号化 | 有効（転送時・保管時） | セキュリティベストプラクティス |
| IAMポリシー | 最小権限の原則 | セキュリティリスク最小化 |
| VPC | プライベートサブネット優先 | 外部からの不正アクセス防止 |

### 可用性

| 項目 | デフォルト値 | 理由 |
|------|-------------|------|
| マルチAZ | 有効（本番環境） | 高可用性確保 |
| バックアップ | 自動バックアップ有効 | データ保護 |

### モニタリング

| 項目 | デフォルト値 | 理由 |
|------|-------------|------|
| CloudWatch Logs | 有効 | トラブルシューティング容易化 |
| CloudWatch Alarms | 主要メトリクスに設定 | 早期異常検知 |
| X-Ray | 有効（Lambda/API Gateway） | パフォーマンス分析 |

### パフォーマンス

| 項目 | デフォルト値 | 理由 |
|------|-------------|------|
| Lambda メモリ | 1024 MB（初期値） | バランスの良い性能/コスト比 |
| DynamoDB キャパシティ | オンデマンド（初期） | 予測不可能なトラフィックに対応 |
| ElastiCache | 使用推奨（頻繁なDB読み取り） | レイテンシ削減、DB負荷軽減 |

## 注意事項

1. **リージョン選択**: サービス可用性、レイテンシ、コンプライアンス要件を考慮
2. **コスト管理**: Cost Explorer、Budgets、Cost Anomaly Detection の活用を推奨
3. **セキュリティ**: AWS Security Hub、GuardDuty の有効化を推奨
4. **タグ付け**: コスト配分、リソース管理のためのタグ戦略を策定
5. **ドキュメント**: 実装したアーキテクチャの図と説明を残す
6. **テスト**: 本番デプロイ前に開発環境での十分なテストを実施
7. **バックアップとDR**: ディザスタリカバリ計画を策定

## エラーハンドリング

### よくあるエラーと対処法

**ドキュメント参照エラー**:
- `awslabs:aws-documentation-mcp-server` が利用できない場合、一般的な知識で回答するが、その旨を明示
- ドキュメントが見つからない場合、代替の検索方法を提案

**実装エラー**:
- IAM権限不足: 必要な権限を特定し、ポリシー追加を提案
- リソース制限: クォータ増加申請の手順を案内
- サービス可用性: 代替リージョンまたは代替サービスを提案

**デプロイエラー**:
- CloudFormation/CDK のロールバック: エラーメッセージ分析とスタックイベント確認
- Lambda デプロイパッケージサイズ超過: レイヤー分離またはコンテナイメージ化を提案

## 依存関係

このスキルが正常に動作するために必要な依存関係：

### 必須依存関係

- **aws-documentation-mcp-server** (`awslabs:aws-documentation-mcp-server`)
  - AWSサービスの仕様、API、制限事項、ベストプラクティスの参照に使用
  - 使用するツール:
    - `search_documentation`: ドキュメント検索
    - `read_documentation`: ドキュメント詳細取得

### オプション依存関係

- **AWS CLI**: デプロイスクリプトと運用スクリプトの実行に必要
- **AWS CDK**: Infrastructure as Code の実装に使用（推奨）
- **Docker**: コンテナアプリケーションのビルドとデプロイに必要

### 関連スキル

- `reviewing-aws-architecture`: 実装後のアーキテクチャレビュー
- `researching-aws-documentation`: 詳細なドキュメント調査

このスキルにより、AWSサービスの実装を、正確で安全、かつ保守可能な形で実現できます。
