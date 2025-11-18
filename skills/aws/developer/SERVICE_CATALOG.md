# AWSサービスカタログ - 実装ガイド

このドキュメントは、各AWSサービスの実装パターン、ユースケース、ベストプラクティスをまとめたものです。

## 目次

1. [コンピューティングサービス](#コンピューティングサービス)
2. [ストレージサービス](#ストレージサービス)
3. [データベースサービス](#データベースサービス)
4. [ネットワーキングサービス](#ネットワーキングサービス)
5. [セキュリティサービス](#セキュリティサービス)
6. [監視・運用サービス](#監視運用サービス)

---

## コンピューティングサービス

### AWS Lambda

**ユースケース**:
- イベント駆動処理（S3アップロード、DynamoDBストリーム）
- REST API バックエンド（API Gateway連携）
- バッチ処理（スケジュールトリガー）
- データ変換・ETL処理

**実装パターン**:

1. **基本的なLambda関数（Node.js）**
```javascript
// index.mjs
export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // ビジネスロジック
    const result = await processEvent(event);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Success', result })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' })
    };
  }
};
```

2. **環境変数とSecrets Manager連携**
```javascript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const secretsManager = new SecretsManagerClient({});

const getSecret = async (secretName) => {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await secretsManager.send(command);
  return JSON.parse(response.SecretString);
};

export const handler = async (event) => {
  const dbCredentials = await getSecret(process.env.DB_SECRET_NAME);
  // データベース接続処理
};
```

**ベストプラクティス**:
- メモリサイズは実際の使用量に基づいて設定（オーバープロビジョニングを避ける）
- タイムアウトは処理時間 + バッファを考慮
- 環境変数で設定を外部化
- CloudWatch Logs でエラーログを記録
- Lambda Layers で共通ライブラリを分離
- プロビジョニング済み同時実行数でコールドスタート削減（重要な関数のみ）

**CDK実装例（TypeScript）**:
```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';

const myFunction = new lambda.Function(this, 'MyFunction', {
  runtime: lambda.Runtime.NODEJS_20_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset('lambda'),
  environment: {
    TABLE_NAME: table.tableName,
  },
  timeout: cdk.Duration.seconds(30),
  memorySize: 512,
  logRetention: logs.RetentionDays.ONE_WEEK,
  tracing: lambda.Tracing.ACTIVE, // X-Ray有効化
});
```

---

### Amazon ECS (Elastic Container Service)

**ユースケース**:
- マイクロサービスアーキテクチャ
- 長時間実行されるアプリケーション
- バッチ処理（大規模データ処理）
- CI/CD パイプライン統合

**実装パターン**:

1. **ECS Fargate + Application Load Balancer**

**タスク定義（JSON）**:
```json
{
  "family": "my-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/my-app",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

**CDK実装例（TypeScript）**:
```typescript
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

// VPC
const vpc = new ec2.Vpc(this, 'MyVpc', { maxAzs: 2 });

// ECS Cluster
const cluster = new ecs.Cluster(this, 'MyCluster', { vpc });

// Fargate Task Definition
const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
  memoryLimitMiB: 1024,
  cpu: 512,
});

const container = taskDefinition.addContainer('AppContainer', {
  image: ecs.ContainerImage.fromRegistry('my-app:latest'),
  logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'my-app' }),
  environment: {
    NODE_ENV: 'production',
  },
});

container.addPortMappings({ containerPort: 3000 });

// Fargate Service with ALB
const service = new ecs.FargateService(this, 'Service', {
  cluster,
  taskDefinition,
  desiredCount: 2,
});

const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
  vpc,
  internetFacing: true,
});

const listener = lb.addListener('Listener', { port: 80 });
listener.addTargets('ECS', {
  port: 3000,
  targets: [service],
  healthCheck: {
    path: '/health',
    interval: cdk.Duration.seconds(30),
  },
});
```

**ベストプラクティス**:
- Fargate を優先（サーバー管理不要）
- Auto Scaling の設定（CPU/メモリ使用率ベース）
- ヘルスチェックの適切な設定
- イメージスキャンの有効化（ECR）
- Secrets Manager でシークレット管理
- CloudWatch Container Insights 有効化

---

## ストレージサービス

### Amazon S3

**ユースケース**:
- 静的コンテンツホスティング（画像、動画、CSS/JS）
- データレイク構築
- バックアップとアーカイブ
- アプリケーションログの長期保存

**実装パターン**:

1. **バケット作成とライフサイクルポリシー**

**CDK実装例（TypeScript）**:
```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';

const bucket = new s3.Bucket(this, 'MyBucket', {
  bucketName: 'my-app-data-bucket',
  versioned: true, // バージョニング有効化
  encryption: s3.BucketEncryption.S3_MANAGED, // サーバーサイド暗号化
  blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // パブリックアクセスブロック
  lifecycleRules: [
    {
      id: 'TransitionToInfrequentAccess',
      transitions: [
        {
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(30),
        },
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(90),
        },
      ],
    },
    {
      id: 'DeleteOldVersions',
      noncurrentVersionExpiration: cdk.Duration.days(30),
    },
  ],
  cors: [
    {
      allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
      allowedOrigins: ['https://example.com'],
      allowedHeaders: ['*'],
    },
  ],
});
```

2. **イベント通知（Lambda連携）**

```typescript
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(processFunction),
  { prefix: 'uploads/', suffix: '.jpg' }
);
```

**ベストプラクティス**:
- バージョニング有効化（誤削除対策）
- ライフサイクルポリシーでコスト最適化
- S3 Object Lock（コンプライアンス要件時）
- S3 Transfer Acceleration（高速アップロード）
- S3 Intelligent-Tiering（アクセスパターン不明時）
- CloudFront と組み合わせて配信高速化

---

## データベースサービス

### Amazon DynamoDB

**ユースケース**:
- セッション管理
- リアルタイムレコメンデーション
- IoT データストア
- サーバーレスアプリケーションのデータストア

**実装パターン**:

1. **テーブル作成（シングルテーブル設計）**

**CDK実装例（TypeScript）**:
```typescript
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const table = new dynamodb.Table(this, 'MyTable', {
  tableName: 'my-app-table',
  partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // オンデマンドキャパシティ
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  pointInTimeRecovery: true, // PITR有効化
  stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES, // DynamoDB Streams
  removalPolicy: cdk.RemovalPolicy.RETAIN, // 削除保護
});

// GSI（グローバルセカンダリインデックス）
table.addGlobalSecondaryIndex({
  indexName: 'GSI1',
  partitionKey: { name: 'GSI1PK', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'GSI1SK', type: dynamodb.AttributeType.STRING },
  projectionType: dynamodb.ProjectionType.ALL,
});
```

2. **Lambda からのアクセス（AWS SDK v3）**

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// アイテム作成
export const createItem = async (item) => {
  const command = new PutCommand({
    TableName: process.env.TABLE_NAME,
    Item: item,
  });
  await docClient.send(command);
};

// アイテム取得
export const getItem = async (pk, sk) => {
  const command = new GetCommand({
    TableName: process.env.TABLE_NAME,
    Key: { PK: pk, SK: sk },
  });
  const response = await docClient.send(command);
  return response.Item;
};

// クエリ
export const queryItems = async (pk) => {
  const command = new QueryCommand({
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': pk,
    },
  });
  const response = await docClient.send(command);
  return response.Items;
};
```

**ベストプラクティス**:
- シングルテーブル設計を検討（関連エンティティを1テーブルに）
- オンデマンドキャパシティ vs プロビジョニングキャパシティの選択
- GSI の適切な設計（クエリパターンに基づく）
- Point-in-Time Recovery（PITR）有効化
- DynamoDB Streams で変更をトリガー
- バッチ操作（BatchGetItem、BatchWriteItem）でスループット向上

---

### Amazon RDS (Relational Database Service)

**ユースケース**:
- トランザクション処理
- 既存のリレーショナルデータベースのマイグレーション
- 複雑なクエリ・結合処理
- ACID 準拠が必要なアプリケーション

**実装パターン**:

1. **RDS PostgreSQL Multi-AZ構成**

**CDK実装例（TypeScript）**:
```typescript
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

// VPC
const vpc = new ec2.Vpc(this, 'MyVpc', { maxAzs: 2 });

// セキュリティグループ
const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
  vpc,
  description: 'Security group for RDS',
});

dbSecurityGroup.addIngressRule(
  ec2.Peer.ipv4(vpc.vpcCidrBlock),
  ec2.Port.tcp(5432),
  'Allow PostgreSQL access from VPC'
);

// RDS Instance
const instance = new rds.DatabaseInstance(this, 'MyDatabase', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15_3,
  }),
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  securityGroups: [dbSecurityGroup],
  multiAz: true, // Multi-AZ構成
  allocatedStorage: 20,
  storageType: rds.StorageType.GP3,
  storageEncrypted: true,
  backupRetention: cdk.Duration.days(7),
  deleteAutomatedBackups: false,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  credentials: rds.Credentials.fromGeneratedSecret('postgres'), // Secrets Manager
  enablePerformanceInsights: true, // Performance Insights
  monitoringInterval: cdk.Duration.seconds(60), // Enhanced Monitoring
});
```

2. **Lambda から RDS Proxy 経由で接続**

```typescript
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';

const rdsClient = new RDSDataClient({});

export const queryDatabase = async (sql, parameters = []) => {
  const command = new ExecuteStatementCommand({
    resourceArn: process.env.DB_CLUSTER_ARN,
    secretArn: process.env.DB_SECRET_ARN,
    database: 'mydb',
    sql,
    parameters,
  });

  const response = await rdsClient.send(command);
  return response.records;
};
```

**ベストプラクティス**:
- Multi-AZ 構成で高可用性確保
- Read Replica で読み取り性能向上
- RDS Proxy で接続プーリング（Lambda利用時）
- Automated Backup + スナップショット
- Performance Insights で性能分析
- Enhanced Monitoring で詳細メトリクス取得
- プライベートサブネット配置
- Secrets Manager で認証情報管理

---

## ネットワーキングサービス

### Amazon VPC (Virtual Private Cloud)

**実装パターン**:

**CDK実装例（TypeScript）**:
```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';

const vpc = new ec2.Vpc(this, 'MyVpc', {
  maxAzs: 2,
  natGateways: 1, // NAT Gateway数（コスト考慮）
  subnetConfiguration: [
    {
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
      cidrMask: 24,
    },
    {
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      cidrMask: 24,
    },
    {
      name: 'Isolated',
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      cidrMask: 28,
    },
  ],
});

// VPC Flow Logs
vpc.addFlowLog('FlowLog', {
  destination: ec2.FlowLogDestination.toCloudWatchLogs(),
});
```

**ベストプラクティス**:
- サブネットは Public / Private / Isolated に分離
- NAT Gateway はコスト考慮（開発環境は1つ、本番は冗長化）
- VPC Flow Logs でトラフィック監視
- Security Group は最小権限の原則
- Network ACL は必要に応じて追加の防御層として使用

---

## セキュリティサービス

### AWS IAM (Identity and Access Management)

**実装パターン**:

1. **Lambda 実行ロール（最小権限）**

**CDK実装例（TypeScript）**:
```typescript
import * as iam from 'aws-cdk-lib/aws-iam';

const lambdaRole = new iam.Role(this, 'LambdaRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
  ],
});

// DynamoDB テーブルへの読み書き権限
lambdaRole.addToPolicy(new iam.PolicyStatement({
  actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:Query'],
  resources: [table.tableArn],
}));

// Secrets Manager からシークレット取得
lambdaRole.addToPolicy(new iam.PolicyStatement({
  actions: ['secretsmanager:GetSecretValue'],
  resources: [secret.secretArn],
}));
```

2. **S3 バケットポリシー**

```typescript
bucket.addToResourcePolicy(new iam.PolicyStatement({
  actions: ['s3:GetObject'],
  resources: [bucket.arnForObjects('public/*')],
  principals: [new iam.AnyPrincipal()],
  conditions: {
    'StringLike': {
      'aws:Referer': ['https://example.com/*'],
    },
  },
}));
```

**ベストプラクティス**:
- 最小権限の原則（必要な権限のみ付与）
- リソースベースポリシーで細かい制御
- IAM ロールを優先（アクセスキーは避ける）
- MFA 有効化（人間のユーザー）
- IAM Access Analyzer で権限の過剰付与を検出
- タグベースのアクセス制御（ABAC）

---

## 監視・運用サービス

### Amazon CloudWatch

**実装パターン**:

1. **カスタムメトリクスとアラーム**

**CDK実装例（TypeScript）**:
```typescript
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';

// SNS トピック（通知先）
const topic = new sns.Topic(this, 'AlarmTopic');

// Lambda エラーアラーム
const errorMetric = myFunction.metricErrors({
  period: cdk.Duration.minutes(5),
});

const errorAlarm = new cloudwatch.Alarm(this, 'ErrorAlarm', {
  metric: errorMetric,
  threshold: 5,
  evaluationPeriods: 1,
  datapointsToAlarm: 1,
  alarmDescription: 'Lambda function errors exceeded threshold',
});

errorAlarm.addAlarmAction(new actions.SnsAction(topic));

// カスタムメトリクス（Lambda内から送信）
const customMetric = new cloudwatch.Metric({
  namespace: 'MyApp',
  metricName: 'OrdersProcessed',
  dimensionsMap: {
    Environment: 'production',
  },
});
```

2. **CloudWatch Logs Insights クエリ**

```
# エラーログを時系列で集計
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)

# レイテンシ分析
fields @timestamp, @duration
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), pct(@duration, 95)
```

**ベストプラクティス**:
- 主要メトリクスに CloudWatch Alarms 設定
- Log Retention 設定でコスト管理
- CloudWatch Logs Insights で高度なクエリ
- CloudWatch Synthetics でエンドポイント監視
- X-Ray で分散トレーシング

---

## デプロイとCLIスクリプト

このセクションでは、AWS CDK を使用したデプロイスクリプトと、AWS CLI を使用した運用スクリプトの例を提供します。

### CDK デプロイスクリプト

#### 1. 基本的なデプロイコマンド

```bash
#!/bin/bash
# deploy.sh - CDK スタックのデプロイスクリプト

set -e

STACK_NAME="MyAppStack"
PROFILE="default"
REGION="ap-northeast-1"

echo "🚀 Starting CDK deployment for ${STACK_NAME}..."

# 依存関係のインストール
echo "📦 Installing dependencies..."
npm install

# CDK Bootstrap（初回のみ必要）
echo "🔧 Checking CDK bootstrap..."
cdk bootstrap aws://ACCOUNT_ID/${REGION} --profile ${PROFILE}

# スタックの差分確認
echo "🔍 Checking stack diff..."
cdk diff ${STACK_NAME} --profile ${PROFILE}

# デプロイ実行
echo "🚢 Deploying stack..."
cdk deploy ${STACK_NAME} \
  --profile ${PROFILE} \
  --require-approval never \
  --outputs-file cdk-outputs.json

echo "✅ Deployment completed successfully!"
echo "📄 Outputs saved to cdk-outputs.json"
```

#### 2. 環境別デプロイスクリプト

```bash
#!/bin/bash
# deploy-env.sh - 環境ごとのデプロイスクリプト

set -e

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Usage: ./deploy-env.sh [dev|staging|prod]"
  exit 1
fi

case $ENVIRONMENT in
  dev)
    STACK_NAME="MyApp-Dev"
    PROFILE="dev"
    ;;
  staging)
    STACK_NAME="MyApp-Staging"
    PROFILE="staging"
    ;;
  prod)
    STACK_NAME="MyApp-Prod"
    PROFILE="prod"
    # 本番環境は承認が必要
    APPROVAL="--require-approval broadening"
    ;;
  *)
    echo "Invalid environment: $ENVIRONMENT"
    exit 1
    ;;
esac

echo "🌍 Deploying to ${ENVIRONMENT} environment..."

# CDK synth で CloudFormation テンプレート生成
cdk synth ${STACK_NAME} --profile ${PROFILE}

# デプロイ
cdk deploy ${STACK_NAME} \
  --profile ${PROFILE} \
  ${APPROVAL:-"--require-approval never"}

echo "✅ ${ENVIRONMENT} deployment completed!"
```

#### 3. スタック削除スクリプト

```bash
#!/bin/bash
# destroy.sh - CDK スタックの削除

set -e

STACK_NAME=$1
PROFILE=${2:-"default"}

if [ -z "$STACK_NAME" ]; then
  echo "Usage: ./destroy.sh STACK_NAME [PROFILE]"
  exit 1
fi

echo "⚠️  WARNING: This will destroy stack ${STACK_NAME}"
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "🗑️  Destroying stack ${STACK_NAME}..."
cdk destroy ${STACK_NAME} --profile ${PROFILE} --force

echo "✅ Stack destroyed successfully!"
```

### AWS CLI 運用スクリプト

#### 1. Lambda 関数の更新

```bash
#!/bin/bash
# update-lambda.sh - Lambda 関数コードの更新

FUNCTION_NAME=$1
ZIP_FILE=${2:-"function.zip"}

if [ -z "$FUNCTION_NAME" ]; then
  echo "Usage: ./update-lambda.sh FUNCTION_NAME [ZIP_FILE]"
  exit 1
fi

echo "📦 Creating deployment package..."
zip -r ${ZIP_FILE} index.mjs node_modules/

echo "🚀 Updating Lambda function: ${FUNCTION_NAME}..."
aws lambda update-function-code \
  --function-name ${FUNCTION_NAME} \
  --zip-file fileb://${ZIP_FILE}

echo "⏳ Waiting for update to complete..."
aws lambda wait function-updated \
  --function-name ${FUNCTION_NAME}

echo "✅ Lambda function updated successfully!"

# 関数の設定を表示
aws lambda get-function-configuration \
  --function-name ${FUNCTION_NAME} \
  --query '{Runtime:Runtime,MemorySize:MemorySize,Timeout:Timeout,LastModified:LastModified}'
```

#### 2. ECS サービスの更新

```bash
#!/bin/bash
# update-ecs-service.sh - ECS サービスの強制デプロイ

CLUSTER=$1
SERVICE=$2

if [ -z "$CLUSTER" ] || [ -z "$SERVICE" ]; then
  echo "Usage: ./update-ecs-service.sh CLUSTER SERVICE"
  exit 1
fi

echo "🔄 Forcing new deployment for ECS service..."
aws ecs update-service \
  --cluster ${CLUSTER} \
  --service ${SERVICE} \
  --force-new-deployment

echo "⏳ Waiting for deployment to stabilize..."
aws ecs wait services-stable \
  --cluster ${CLUSTER} \
  --services ${SERVICE}

echo "✅ ECS service updated successfully!"

# サービスの状態を表示
aws ecs describe-services \
  --cluster ${CLUSTER} \
  --services ${SERVICE} \
  --query 'services[0].{Status:status,RunningCount:runningCount,DesiredCount:desiredCount}'
```

#### 3. S3 バケットのバックアップ

```bash
#!/bin/bash
# backup-s3.sh - S3 バケットのバックアップ

SOURCE_BUCKET=$1
DEST_BUCKET=$2
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

if [ -z "$SOURCE_BUCKET" ] || [ -z "$DEST_BUCKET" ]; then
  echo "Usage: ./backup-s3.sh SOURCE_BUCKET DEST_BUCKET"
  exit 1
fi

BACKUP_PREFIX="backup-${TIMESTAMP}"

echo "💾 Backing up ${SOURCE_BUCKET} to ${DEST_BUCKET}/${BACKUP_PREFIX}..."

aws s3 sync \
  s3://${SOURCE_BUCKET}/ \
  s3://${DEST_BUCKET}/${BACKUP_PREFIX}/ \
  --storage-class GLACIER_INSTANT_RETRIEVAL

echo "✅ Backup completed!"
echo "📍 Backup location: s3://${DEST_BUCKET}/${BACKUP_PREFIX}/"
```

#### 4. リソースの健全性チェック

```bash
#!/bin/bash
# health-check.sh - AWS リソースの健全性チェック

REGION="ap-northeast-1"

echo "🔍 Checking AWS resource health in ${REGION}..."

# Lambda 関数のエラー率チェック
echo -e "\n📊 Lambda Functions Error Rate (last 1 hour):"
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=MyFunction \
  --statistics Sum \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --region ${REGION} \
  --query 'Datapoints[0].Sum'

# ECS サービスの状態チェック
echo -e "\n🐳 ECS Services Status:"
aws ecs list-services --cluster MyCluster --region ${REGION} \
  --query 'serviceArns[*]' --output text | \
  xargs -I {} aws ecs describe-services \
    --cluster MyCluster \
    --services {} \
    --region ${REGION} \
    --query 'services[0].{Name:serviceName,Status:status,Running:runningCount,Desired:desiredCount}' \
    --output table

# RDS インスタンスの状態チェック
echo -e "\n💾 RDS Instances Status:"
aws rds describe-db-instances \
  --region ${REGION} \
  --query 'DBInstances[*].{Name:DBInstanceIdentifier,Status:DBInstanceStatus,Engine:Engine,Version:EngineVersion}' \
  --output table

echo -e "\n✅ Health check completed!"
```

#### 5. CloudWatch Logs のクエリ

```bash
#!/bin/bash
# query-logs.sh - CloudWatch Logs Insights クエリの実行

LOG_GROUP=$1
HOURS_AGO=${2:-1}

if [ -z "$LOG_GROUP" ]; then
  echo "Usage: ./query-logs.sh LOG_GROUP [HOURS_AGO]"
  exit 1
fi

START_TIME=$(date -u -d "${HOURS_AGO} hours ago" +%s)
END_TIME=$(date -u +%s)

QUERY='fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20'

echo "🔍 Querying logs from ${LOG_GROUP} (last ${HOURS_AGO} hours)..."

QUERY_ID=$(aws logs start-query \
  --log-group-name ${LOG_GROUP} \
  --start-time ${START_TIME} \
  --end-time ${END_TIME} \
  --query-string "${QUERY}" \
  --query 'queryId' \
  --output text)

echo "⏳ Query ID: ${QUERY_ID}. Waiting for results..."

# クエリの完了を待つ
while true; do
  STATUS=$(aws logs get-query-results \
    --query-id ${QUERY_ID} \
    --query 'status' \
    --output text)

  if [ "$STATUS" = "Complete" ]; then
    break
  fi
  sleep 2
done

echo "✅ Query completed! Results:"
aws logs get-query-results \
  --query-id ${QUERY_ID} \
  --output table
```

### CI/CD パイプライン用スクリプト

#### GitHub Actions ワークフロー例

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

env:
  AWS_REGION: ap-northeast-1
  NODE_VERSION: '20'

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: CDK Diff
        run: npx cdk diff

      - name: CDK Deploy
        run: npx cdk deploy --require-approval never --outputs-file cdk-outputs.json

      - name: Upload outputs
        uses: actions/upload-artifact@v4
        with:
          name: cdk-outputs
          path: cdk-outputs.json
```

#### CodeBuild buildspec.yml 例

```yaml
# buildspec.yml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}

  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $ECR_REPOSITORY:$IMAGE_TAG .
      - docker tag $ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker image...
      - docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"my-container","imageUri":"%s"}]' $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
```

---

これらのスクリプトは実際の運用環境に合わせてカスタマイズしてください。環境変数、リージョン、リソース名などは適切な値に置き換えて使用してください。

---

## よくあるアンチパターンと回避策

このセクションでは、AWS実装でよく見られるアンチパターンと、その回避方法を示します。

### 1. Lambda 関数のアンチパターン

#### ❌ アンチパターン: Lambda 関数内でのデータベース接続プーリングなし

```javascript
// 悪い例：毎回新しい接続を作成
export const handler = async (event) => {
  const connection = await createNewDatabaseConnection(); // コールドスタートで遅延
  const result = await connection.query('SELECT * FROM users');
  await connection.close();
  return result;
};
```

**問題点**:
- 毎回接続を作成するためレイテンシが高い
- 接続数がすぐに上限に達する
- コールドスタートでさらに遅延が発生

#### ✅ ベストプラクティス: RDS Proxy または接続の再利用

```javascript
// 良い例：接続を再利用
let cachedConnection = null;

export const handler = async (event) => {
  if (!cachedConnection) {
    cachedConnection = await createDatabaseConnection();
  }
  const result = await cachedConnection.query('SELECT * FROM users');
  return result;
};
```

または、RDS Proxy を使用：

```typescript
import * as rds from 'aws-cdk-lib/aws-rds';

const proxy = new rds.DatabaseProxy(this, 'Proxy', {
  proxyTarget: rds.ProxyTarget.fromCluster(cluster),
  secrets: [secret],
  vpc,
});
```

---

#### ❌ アンチパターン: Lambda 関数に過剰な責任を持たせる

```javascript
// 悪い例：1つのLambda で複数の処理を実行
export const handler = async (event) => {
  // ユーザー登録
  await registerUser(event.user);

  // メール送信
  await sendWelcomeEmail(event.user.email);

  // サードパーティAPI呼び出し
  await notifyExternalSystem(event.user);

  // 分析データ送信
  await sendToAnalytics(event.user);

  return { success: true };
};
```

**問題点**:
- 単一障害点になる
- タイムアウトリスクが高い
- デバッグが困難
- 再利用性が低い

#### ✅ ベストプラクティス: Single Responsibility Principle

```javascript
// 良い例：各Lambdaは単一の責任のみ
export const registerUserHandler = async (event) => {
  const user = await registerUser(event.user);

  // 後続処理は EventBridge / SQS で非同期実行
  await eventBridge.putEvents({
    Entries: [{
      Source: 'user.registration',
      DetailType: 'UserRegistered',
      Detail: JSON.stringify({ userId: user.id, email: user.email })
    }]
  });

  return { userId: user.id };
};
```

---

### 2. DynamoDB のアンチパターン

#### ❌ アンチパターン: スキャン操作の多用

```javascript
// 悪い例：全テーブルスキャン
const result = await dynamodb.scan({
  TableName: 'Users',
  FilterExpression: 'email = :email',
  ExpressionAttributeValues: { ':email': 'user@example.com' }
}).promise();
```

**問題点**:
- 全テーブルを読み取るため非効率
- RCU（読み取りキャパシティユニット）を大量消費
- レイテンシが高い

#### ✅ ベストプラクティス: Query または GetItem を使用

```javascript
// 良い例：パーティションキーでQuery
const result = await dynamodb.query({
  TableName: 'Users',
  KeyConditionExpression: 'email = :email',
  ExpressionAttributeValues: { ':email': 'user@example.com' }
}).promise();
```

または、GSI（グローバルセカンダリインデックス）を使用：

```typescript
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const table = new dynamodb.Table(this, 'Users', {
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
});

// email でのクエリを可能にする GSI
table.addGlobalSecondaryIndex({
  indexName: 'EmailIndex',
  partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
});
```

---

#### ❌ アンチパターン: ホットパーティションの発生

```javascript
// 悪い例：日付をパーティションキーに使用
const item = {
  date: '2025-01-15', // パーティションキー（全リクエストが同じキーに集中）
  userId: 'user123',
  data: {...}
};
```

**問題点**:
- 同じ日のデータがすべて同じパーティションに集中
- スループットの不均衡
- パフォーマンス低下

#### ✅ ベストプラクティス: 分散されたパーティションキー設計

```javascript
// 良い例：ユーザーIDをパーティションキー、日付をソートキーに
const item = {
  userId: 'user123', // パーティションキー（分散される）
  timestamp: '2025-01-15T10:30:00Z', // ソートキー
  data: {...}
};
```

---

### 3. S3 のアンチパターン

#### ❌ アンチパターン: 不適切なストレージクラスの使用

```typescript
// 悪い例：すべてのオブジェクトを STANDARD に保存
const bucket = new s3.Bucket(this, 'MyBucket', {
  // ストレージクラス指定なし = すべて STANDARD
});
```

**問題点**:
- アクセス頻度が低いデータも高コストの STANDARD に保存
- 長期保存データでコストが膨らむ

#### ✅ ベストプラクティス: ライフサイクルポリシーの設定

```typescript
// 良い例：ライフサイクルポリシーで自動的に移行
const bucket = new s3.Bucket(this, 'MyBucket', {
  lifecycleRules: [
    {
      transitions: [
        {
          storageClass: s3.StorageClass.INFREQUENT_ACCESS,
          transitionAfter: cdk.Duration.days(30), // 30日後に IA へ
        },
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(90), // 90日後に Glacier へ
        },
      ],
      expiration: cdk.Duration.days(365), // 1年後に削除
    },
  ],
});
```

---

#### ❌ アンチパターン: バケットポリシーでの過度な権限付与

```json
// 悪い例：全世界に読み取り権限
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::my-bucket/*"
  }]
}
```

**問題点**:
- 機密データが漏洩するリスク
- セキュリティ監査で指摘される
- データ改ざんのリスク

#### ✅ ベストプラクティス: 最小権限の原則

```json
// 良い例：特定のIAMロールのみにアクセス権限
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::123456789012:role/MyAppRole"
    },
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::my-bucket/app-data/*",
    "Condition": {
      "IpAddress": {
        "aws:SourceIp": ["10.0.0.0/16"]
      }
    }
  }]
}
```

---

### 4. IAM のアンチパターン

#### ❌ アンチパターン: 過度に広範な権限

```json
// 悪い例：全サービスに対するフルアクセス
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "*",
    "Resource": "*"
  }]
}
```

**問題点**:
- セキュリティリスクが高い
- 意図しない操作による障害
- コンプライアンス違反

#### ✅ ベストプラクティス: 最小権限の原則

```json
// 良い例：必要な操作のみを許可
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query"
    ],
    "Resource": "arn:aws:dynamodb:ap-northeast-1:123456789012:table/MyTable"
  }]
}
```

---

### 5. VPC とネットワーキングのアンチパターン

#### ❌ アンチパターン: すべてのリソースをパブリックサブネットに配置

```typescript
// 悪い例：データベースをパブリックサブネットに
const database = new rds.DatabaseInstance(this, 'Database', {
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC }, // ❌
  publiclyAccessible: true, // ❌
});
```

**問題点**:
- 外部からの攻撃リスク
- セキュリティベストプラクティス違反
- データ漏洩のリスク

#### ✅ ベストプラクティス: プライベートサブネットの使用

```typescript
// 良い例：データベースはプライベートサブネット
const database = new rds.DatabaseInstance(this, 'Database', {
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }, // ✅
  publiclyAccessible: false, // ✅
});

// アプリケーションのみがアクセス可能
database.connections.allowFrom(appSecurityGroup, ec2.Port.tcp(3306));
```

---

#### ❌ アンチパターン: セキュリティグループで 0.0.0.0/0 を許可

```typescript
// 悪い例：全世界からのアクセスを許可
securityGroup.addIngressRule(
  ec2.Peer.anyIpv4(), // ❌
  ec2.Port.tcp(22),
  'Allow SSH from anywhere'
);
```

**問題点**:
- ブルートフォース攻撃のリスク
- 不正アクセスのリスク

#### ✅ ベストプラクティス: 信頼できるIPのみを許可

```typescript
// 良い例：特定のIPレンジのみを許可
securityGroup.addIngressRule(
  ec2.Peer.ipv4('10.0.0.0/16'), // ✅ 社内ネットワークのみ
  ec2.Port.tcp(22),
  'Allow SSH from corporate network'
);

// または、Systems Manager Session Manager を使用（SSH不要）
```

---

### 6. コスト最適化のアンチパターン

#### ❌ アンチパターン: 常時稼働するリソースの過剰プロビジョニング

```typescript
// 悪い例：本番と同じスペックの開発環境
const devDatabase = new rds.DatabaseInstance(this, 'DevDB', {
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.R5, ec2.InstanceSize.XLARGE8), // ❌ 高額
  allocatedStorage: 1000, // ❌ 過剰
  multiAz: true, // ❌ 開発環境では不要
});
```

**問題点**:
- 開発環境で不要な高コスト
- リソースの無駄

#### ✅ ベストプラクティス: 環境に応じたサイジング

```typescript
// 良い例：開発環境は最小構成
const devDatabase = new rds.DatabaseInstance(this, 'DevDB', {
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO), // ✅
  allocatedStorage: 20, // ✅
  multiAz: false, // ✅
  deletionProtection: false, // ✅ 開発環境は削除可能
});

// 夜間・週末は自動停止
const stopRule = new events.Rule(this, 'StopDevDB', {
  schedule: events.Schedule.cron({ hour: '21', minute: '0' }), // 毎日21時に停止
});
```

---

### まとめ

これらのアンチパターンを避け、ベストプラクティスに従うことで：
- **セキュリティ**: 最小権限、プライベートサブネット、暗号化
- **パフォーマンス**: 適切なインデックス、接続プーリング、キャッシング
- **コスト効率**: 適切なサイジング、ライフサイクルポリシー、自動停止
- **運用性**: モニタリング、アラート、自動復旧

を実現できます。

---

このカタログは、各AWSサービスの実装時に参照してください。必要に応じて、公式ドキュメントで最新の仕様を確認することを推奨します。
