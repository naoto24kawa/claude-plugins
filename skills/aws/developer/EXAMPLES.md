# AWS実装例集

このドキュメントは、よくある実装パターンの完全な実装例を提供します。

## 目次

1. [サーバーレスREST API](#サーバーレスrest-api)
2. [コンテナベースWebアプリケーション](#コンテナベースwebアプリケーション)
3. [データパイプライン](#データパイプライン)
4. [マルチリージョン構成](#マルチリージョン構成)

---

## サーバーレスREST API

### アーキテクチャ

```
API Gateway → Lambda → DynamoDB
     ↓
 CloudWatch Logs
     ↓
  X-Ray
```

### ユースケース

- ユーザー管理API
- ToDo管理API
- 製品カタログAPI

### 完全な実装（CDK）

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';

export class ServerlessApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Lambda Function
    const handler = new lambda.Function(this, 'UserHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: table.tableName,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      tracing: lambda.Tracing.ACTIVE,
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant permissions
    table.grantReadWriteData(handler);

    // API Gateway
    const api = new apigateway.RestApi(this, 'UsersApi', {
      restApiName: 'Users Service',
      description: 'API for user management',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Lambda integration
    const integration = new apigateway.LambdaIntegration(handler);

    // /users resource
    const users = api.root.addResource('users');
    users.addMethod('GET', integration); // List users
    users.addMethod('POST', integration); // Create user

    // /users/{userId} resource
    const user = users.addResource('{userId}');
    user.addMethod('GET', integration); // Get user
    user.addMethod('PUT', integration); // Update user
    user.addMethod('DELETE', integration); // Delete user

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });
  }
}
```

### Lambda関数実装（Node.js）

```javascript
// lambda/index.mjs
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TABLE_NAME;

export const handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { httpMethod, resource, pathParameters, body } = event;

  try {
    let response;

    switch (`${httpMethod} ${resource}`) {
      case 'GET /users':
        response = await listUsers();
        break;
      case 'POST /users':
        response = await createUser(JSON.parse(body));
        break;
      case 'GET /users/{userId}':
        response = await getUser(pathParameters.userId);
        break;
      case 'PUT /users/{userId}':
        response = await updateUser(pathParameters.userId, JSON.parse(body));
        break;
      case 'DELETE /users/{userId}':
        response = await deleteUser(pathParameters.userId);
        break;
      default:
        return {
          statusCode: 404,
          body: JSON.stringify({ message: 'Not Found' }),
        };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};

const listUsers = async () => {
  const command = new ScanCommand({ TableName: TABLE_NAME });
  const response = await docClient.send(command);
  return { users: response.Items };
};

const createUser = async (data) => {
  const userId = uuidv4();
  const user = {
    userId,
    ...data,
    createdAt: new Date().toISOString(),
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: user,
  });
  await docClient.send(command);

  return { user };
};

const getUser = async (userId) => {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { userId },
  });
  const response = await docClient.send(command);

  if (!response.Item) {
    throw new Error('User not found');
  }

  return { user: response.Item };
};

const updateUser = async (userId, data) => {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { userId },
    UpdateExpression: 'set #name = :name, email = :email, updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#name': 'name',
    },
    ExpressionAttributeValues: {
      ':name': data.name,
      ':email': data.email,
      ':updatedAt': new Date().toISOString(),
    },
    ReturnValues: 'ALL_NEW',
  });
  const response = await docClient.send(command);

  return { user: response.Attributes };
};

const deleteUser = async (userId) => {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { userId },
  });
  await docClient.send(command);

  return { message: 'User deleted successfully' };
};
```

### デプロイ手順

```bash
# CDK プロジェクト初期化
cdk init app --language typescript

# 依存関係インストール
npm install

# Lambda 依存関係インストール
cd lambda && npm install uuid @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb

# CDK デプロイ
cdk deploy

# API URL を取得
# Output: ApiUrl = https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/
```

### テスト

```bash
# List users
curl https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/users

# Create user
curl -X POST https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Get user
curl https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/users/USER_ID

# Update user
curl -X PUT https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane@example.com"}'

# Delete user
curl -X DELETE https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/users/USER_ID
```

---

## コンテナベースWebアプリケーション

### アーキテクチャ

```
Route 53 → CloudFront → ALB → ECS Fargate (Multi-AZ)
                                     ↓
                               RDS PostgreSQL (Multi-AZ)
                                     ↓
                              ElastiCache Redis
```

### ユースケース

- Webアプリケーション
- マイクロサービス
- 管理画面

### 完全な実装（CDK）

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as logs from 'aws-cdk-lib/aws-logs';

export class WebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 2,
      natGateways: 2,
    });

    // ECR Repository
    const repository = new ecr.Repository(this, 'AppRepository', {
      repositoryName: 'my-web-app',
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // RDS PostgreSQL
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc,
      description: 'Security group for RDS',
    });

    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSecurityGroup],
      multiAz: true,
      allocatedStorage: 20,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      enablePerformanceInsights: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    // ElastiCache Redis
    const cacheSecurityGroup = new ec2.SecurityGroup(this, 'CacheSecurityGroup', {
      vpc,
      description: 'Security group for ElastiCache',
    });

    const cacheSubnetGroup = new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
      description: 'Subnet group for ElastiCache',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    const cacheCluster = new elasticache.CfnCacheCluster(this, 'CacheCluster', {
      cacheNodeType: 'cache.t4g.micro',
      engine: 'redis',
      numCacheNodes: 1,
      cacheSubnetGroupName: cacheSubnetGroup.ref,
      vpcSecurityGroupIds: [cacheSecurityGroup.securityGroupId],
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      containerInsights: true,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 1024,
      cpu: 512,
    });

    const container = taskDefinition.addContainer('AppContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'my-app',
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        NODE_ENV: 'production',
        REDIS_HOST: cacheCluster.attrRedisEndpointAddress,
      },
      secrets: {
        DB_HOST: ecs.Secret.fromSecretsManager(database.secret!, 'host'),
        DB_PORT: ecs.Secret.fromSecretsManager(database.secret!, 'port'),
        DB_NAME: ecs.Secret.fromSecretsManager(database.secret!, 'dbname'),
        DB_USER: ecs.Secret.fromSecretsManager(database.secret!, 'username'),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(database.secret!, 'password'),
      },
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // Fargate Service
    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
    });

    // Allow ECS to access RDS
    dbSecurityGroup.addIngressRule(
      service.connections.securityGroups[0],
      ec2.Port.tcp(5432),
      'Allow ECS to access RDS'
    );

    // Allow ECS to access ElastiCache
    cacheSecurityGroup.addIngressRule(
      service.connections.securityGroups[0],
      ec2.Port.tcp(6379),
      'Allow ECS to access ElastiCache'
    );

    // Application Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
      vpc,
      internetFacing: true,
    });

    const listener = lb.addListener('Listener', {
      port: 80,
    });

    listener.addTargets('ECS', {
      port: 3000,
      targets: [service],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // Auto Scaling
    const scaling = service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 70,
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: lb.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryUri', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI',
    });
  }
}
```

### アプリケーションコード（Node.js + Express）

```javascript
// app.js
import express from 'express';
import pg from 'pg';
import redis from 'redis';

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL client
const pgClient = new pg.Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pgClient.connect();

// Redis client
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST}:6379`,
});

redisClient.connect();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Get all users (with Redis caching)
app.get('/users', async (req, res) => {
  try {
    // Check cache
    const cached = await redisClient.get('users');
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Query database
    const result = await pgClient.query('SELECT * FROM users');
    const users = result.rows;

    // Cache result
    await redisClient.setEx('users', 60, JSON.stringify(users));

    res.json(users);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app .

EXPOSE 3000

CMD ["node", "app.js"]
```

### デプロイ手順

```bash
# CDK デプロイ
cdk deploy

# ECR URI を取得
ECR_URI=$(aws cloudformation describe-stacks \
  --stack-name WebAppStack \
  --query "Stacks[0].Outputs[?OutputKey=='ECRRepositoryUri'].OutputValue" \
  --output text)

# Docker イメージビルド
docker build -t my-web-app .

# ECR ログイン
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI

# イメージタグ付け
docker tag my-web-app:latest $ECR_URI:latest

# イメージプッシュ
docker push $ECR_URI:latest

# ECS サービス更新
aws ecs update-service \
  --cluster WebAppStack-ClusterXXXXXX \
  --service WebAppStack-ServiceXXXXXX \
  --force-new-deployment
```

---

## データパイプライン

### アーキテクチャ

```
S3 (Raw Data) → Lambda (Trigger) → Glue ETL Job → S3 (Processed Data) → Athena
```

### ユースケース

- ログ分析
- データウェアハウス構築
- ビジネスインテリジェンス

### 完全な実装（CDK）

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';

export class DataPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Buckets
    const rawBucket = new s3.Bucket(this, 'RawDataBucket', {
      bucketName: 'my-raw-data-bucket',
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          transitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    const processedBucket = new s3.Bucket(this, 'ProcessedDataBucket', {
      bucketName: 'my-processed-data-bucket',
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Glue Database
    const database = new glue.CfnDatabase(this, 'Database', {
      catalogId: this.account,
      databaseInput: {
        name: 'my_data_lake',
        description: 'Data Lake Database',
      },
    });

    // Glue Crawler
    const crawlerRole = new iam.Role(this, 'CrawlerRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
      ],
    });

    processedBucket.grantRead(crawlerRole);

    const crawler = new glue.CfnCrawler(this, 'Crawler', {
      name: 'my-data-crawler',
      role: crawlerRole.roleArn,
      databaseName: database.ref,
      targets: {
        s3Targets: [
          {
            path: `s3://${processedBucket.bucketName}/`,
          },
        ],
      },
      schemaChangePolicy: {
        updateBehavior: 'UPDATE_IN_DATABASE',
        deleteBehavior: 'LOG',
      },
    });

    // Lambda Trigger Function
    const triggerFunction = new lambda.Function(this, 'TriggerFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import boto3
import json

glue = boto3.client('glue')

def handler(event, context):
    print('Event:', json.dumps(event))

    # Start Glue Job
    response = glue.start_job_run(
        JobName='my-etl-job'
    )

    return {
        'statusCode': 200,
        'body': json.dumps({'jobRunId': response['JobRunId']})
    }
      `),
    });

    triggerFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['glue:StartJobRun'],
      resources: ['*'],
    }));

    // S3 Event Notification
    rawBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(triggerFunction),
      { prefix: 'input/', suffix: '.json' }
    );

    // Glue ETL Job
    const glueJobRole = new iam.Role(this, 'GlueJobRole', {
      assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
      ],
    });

    rawBucket.grantRead(glueJobRole);
    processedBucket.grantWrite(glueJobRole);

    const glueJob = new glue.CfnJob(this, 'ETLJob', {
      name: 'my-etl-job',
      role: glueJobRole.roleArn,
      command: {
        name: 'glueetl',
        scriptLocation: `s3://${rawBucket.bucketName}/scripts/etl.py`,
        pythonVersion: '3',
      },
      defaultArguments: {
        '--TempDir': `s3://${rawBucket.bucketName}/temp/`,
        '--job-bookmark-option': 'job-bookmark-enable',
        '--enable-metrics': 'true',
        '--enable-continuous-cloudwatch-log': 'true',
        '--RAW_BUCKET': rawBucket.bucketName,
        '--PROCESSED_BUCKET': processedBucket.bucketName,
      },
      glueVersion: '4.0',
      maxRetries: 1,
      timeout: 60,
    });

    // Outputs
    new cdk.CfnOutput(this, 'RawBucketName', {
      value: rawBucket.bucketName,
    });

    new cdk.CfnOutput(this, 'ProcessedBucketName', {
      value: processedBucket.bucketName,
    });
  }
}
```

### Glue ETL スクリプト（Python）

```python
# scripts/etl.py
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

args = getResolvedOptions(sys.argv, ['JOB_NAME', 'RAW_BUCKET', 'PROCESSED_BUCKET'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Read raw data
raw_data = glueContext.create_dynamic_frame.from_options(
    format_options={"multiline": False},
    connection_type="s3",
    format="json",
    connection_options={
        "paths": [f"s3://{args['RAW_BUCKET']}/input/"],
        "recurse": True
    }
)

# Transform data
transformed_data = raw_data.apply_mapping([
    ("id", "string", "id", "string"),
    ("name", "string", "name", "string"),
    ("timestamp", "string", "timestamp", "timestamp"),
    ("value", "long", "value", "long")
])

# Write processed data
glueContext.write_dynamic_frame.from_options(
    frame=transformed_data,
    connection_type="s3",
    format="parquet",
    connection_options={
        "path": f"s3://{args['PROCESSED_BUCKET']}/output/",
        "partitionKeys": ["timestamp"]
    }
)

job.commit()
```

---

## マルチリージョン構成

### アーキテクチャ

```
Route 53 (Geolocation Routing)
    ├─ us-east-1: CloudFront → ALB → ECS → Aurora Global (Primary)
    └─ ap-northeast-1: CloudFront → ALB → ECS → Aurora Global (Secondary)
```

### ユースケース

- グローバルサービス
- ディザスタリカバリ
- 低レイテンシ要件

**実装は省略（複雑なため、必要に応じてドキュメント参照）**

---

これらの実装例は、実際のプロダクション環境での使用を想定しています。各プロジェクトの要件に応じてカスタマイズしてください。
