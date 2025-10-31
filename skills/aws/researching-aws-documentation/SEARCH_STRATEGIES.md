# AWS ドキュメント検索戦略ガイド

このドキュメントは、AWS公式ドキュメントを効率的に検索し、必要な情報を迅速に見つけるための戦略を提供します。

## 目次

1. [検索キーワードの選定](#検索キーワードの選定)
2. [ドキュメント構造の理解](#ドキュメント構造の理解)
3. [効率的な検索パターン](#効率的な検索パターン)
4. [バージョン・リージョン固有情報の探し方](#バージョンリージョン固有情報の探し方)
5. [複数ドキュメントの横断検索](#複数ドキュメントの横断検索)

---

## 検索キーワードの選定

### 基本原則

**効果的なキーワード**:
- サービス名 + 調査項目（例: "Lambda limits", "S3 encryption"）
- 具体的な機能名（例: "VPC Endpoints", "CloudFront signed URLs"）
- エラーメッセージそのまま（例: "AccessDenied", "ThrottlingException"）

**避けるべきキーワード**:
- 曖昧な表現（例: "how to", "what is"）
- 日本語キーワード（英語ドキュメントが最新）
- 長すぎるフレーズ

### カテゴリ別キーワード例

#### 1. 制限事項・クォータ

| 目的 | キーワード例 |
|------|------------|
| サービスクォータ | "[service] quotas", "[service] limits" |
| リソース制限 | "[service] maximum", "[service] restrictions" |
| スロットリング | "[service] throttling", "[service] rate limits" |

**具体例**:
- `Lambda quotas` → Lambda の同時実行数、メモリ制限等
- `DynamoDB limits` → テーブルサイズ、インデックス数等
- `API Gateway throttling` → リクエストレート制限

#### 2. API仕様

| 目的 | キーワード例 |
|------|------------|
| API全般 | "[service] API reference" |
| 特定API | "[service] [APIName]" (例: "S3 PutObject") |
| エラーコード | "[service] [APIName] errors" |

**具体例**:
- `DynamoDB BatchWriteItem` → API仕様、パラメータ、制限
- `Lambda Invoke errors` → エラーコードとトラブルシューティング
- `EC2 RunInstances request parameters` → リクエストパラメータ詳細

#### 3. ベストプラクティス

| 目的 | キーワード例 |
|------|------------|
| 一般的なベストプラクティス | "[service] best practices" |
| セキュリティ | "[service] security best practices" |
| パフォーマンス | "[service] performance optimization" |
| コスト | "[service] cost optimization" |

**具体例**:
- `S3 security best practices` → バケットポリシー、暗号化推奨事項
- `DynamoDB partition key design` → パーティションキー設計パターン
- `Lambda cold start optimization` → コールドスタート軽減策

#### 4. トラブルシューティング

| 目的 | キーワード例 |
|------|------------|
| エラー解決 | "[service] troubleshooting" |
| 特定エラー | "[service] [ErrorCode]" (例: "Lambda AccessDenied") |
| よくある問題 | "[service] common issues" |

**具体例**:
- `RDS connection timeout troubleshooting` → 接続タイムアウトの原因と解決策
- `Lambda OutOfMemory` → メモリ不足エラーの対処法
- `CloudFormation stack stuck in UPDATE_ROLLBACK_FAILED` → ロールバック失敗の対応

#### 5. 設定・構成

| 目的 | キーワード例 |
|------|------------|
| 初期設定 | "[service] getting started" |
| 詳細設定 | "[service] configuration" |
| 統合設定 | "[service A] [service B] integration" |

**具体例**:
- `Lambda environment variables` → 環境変数の設定方法
- `VPC endpoint for S3` → S3 VPCエンドポイント設定
- `Lambda RDS Proxy integration` → RDS Proxy連携設定

---

## ドキュメント構造の理解

### AWS ドキュメントの主要カテゴリ

#### 1. ユーザーガイド（User Guide）

**内容**:
- サービスの概要と機能説明
- チュートリアルとハウツー
- ベストプラクティス
- トラブルシューティング

**検索例**:
- "Lambda Developer Guide"
- "S3 User Guide"

**よく見るセクション**:
- Getting Started
- Concepts
- How To
- Quotas and Limits
- Security
- Best Practices
- Troubleshooting

#### 2. APIリファレンス（API Reference）

**内容**:
- APIのエンドポイント
- リクエスト/レスポンス形式
- パラメータ詳細
- エラーコード

**検索例**:
- "DynamoDB API Reference"
- "Lambda API Reference"

**構造**:
- Actions（API一覧）
- Data Types
- Common Parameters
- Common Errors

#### 3. CLI リファレンス（CLI Reference）

**内容**:
- AWS CLI コマンド
- オプションとパラメータ
- 使用例

**検索例**:
- "AWS CLI S3"
- "AWS CLI Lambda"

#### 4. SDK ドキュメント

**内容**:
- 各言語のSDK使用方法
- コードサンプル

**検索例**:
- "AWS SDK for JavaScript v3"
- "boto3 documentation"

#### 5. ホワイトペーパー

**内容**:
- アーキテクチャパターン
- Well-Architected Framework
- 業界別ソリューション

**検索例**:
- "AWS Well-Architected Framework"
- "AWS Security Best Practices"

---

## 効率的な検索パターン

### パターン1: トップダウン検索

**手順**:
1. サービス名でユーザーガイドを検索
2. 目次から関連セクションを特定
3. 該当セクションを詳細に読む

**適用場面**:
- サービス全体の理解が必要な場合
- 複数の関連機能を調査する場合

**例**:
```
目的: Lambda のベストプラクティスを知りたい

1. "Lambda Developer Guide" を検索
2. 目次から "Best Practices" セクションを特定
3. パフォーマンス、セキュリティ、コスト最適化の各サブセクションを読む
```

### パターン2: ダイレクト検索

**手順**:
1. 具体的なキーワードで直接検索
2. 該当ドキュメントを即座に確認

**適用場面**:
- 特定の情報のみが必要な場合
- 時間制約がある場合

**例**:
```
目的: Lambda の最大実行時間を確認したい

1. "Lambda quotas" を検索
2. Quotas ページの "Function execution time" を確認
3. 結果: 900秒（15分）
```

### パターン3: エラードリブン検索

**手順**:
1. エラーメッセージそのままで検索
2. Troubleshooting またはエラーコード一覧を確認
3. 原因と解決策を特定

**適用場面**:
- エラーが発生した場合
- トラブルシューティングが必要な場合

**例**:
```
エラー: "ResourceNotFoundException: The security token included in the request is invalid"

1. "ResourceNotFoundException security token invalid" を検索
2. IAM ユーザーガイドの Troubleshooting セクションを確認
3. 原因: アクセスキーの期限切れまたは無効化
4. 解決策: アクセスキーの再生成またはIAMロールの使用
```

### パターン4: 比較検索

**手順**:
1. 複数の選択肢を比較するドキュメントを検索
2. 各選択肢の特徴、メリット・デメリットを確認

**適用場面**:
- サービス選定時
- 実装方法の選択時

**例**:
```
目的: S3 vs EFS vs EBS の選択

1. "S3 vs EFS vs EBS" または "AWS storage options comparison" を検索
2. 各ストレージの特徴、ユースケース、料金を比較
3. ワークロードに最適なストレージを選択
```

---

## バージョン・リージョン固有情報の探し方

### バージョン固有情報

**確認すべきドキュメント**:
- リリースノート（Release Notes）
- What's New
- Deprecation Notices

**検索キーワード**:
- "[service] version [X.Y]"
- "[service] release notes"
- "[service] deprecated features"

**例**:
```
目的: Node.js 20 で利用可能な Lambda ランタイムの機能を確認

1. "Lambda Node.js 20 runtime" を検索
2. Lambda Runtimes ドキュメントを確認
3. サポートされるAWS SDK バージョン、環境変数、制限事項を確認
```

### リージョン固有情報

**確認すべきドキュメント**:
- Regional Services List
- サービスのリージョン可用性ページ

**検索キーワード**:
- "[service] available regions"
- "[service] regional availability"
- "AWS services by region"

**例**:
```
目的: ap-northeast-1 (東京) で利用可能な Graviton3 インスタンスタイプを確認

1. "EC2 Graviton3 regional availability" を検索
2. EC2 リージョン可用性ドキュメントを確認
3. 東京リージョンでサポートされているインスタンスファミリーを特定
```

### 非推奨機能の確認

**確認すべきドキュメント**:
- Deprecation Notices
- Migration Guides

**検索キーワード**:
- "[service] deprecated"
- "[service] end of support"
- "[old feature] migration [new feature]"

**例**:
```
目的: Lambda の Node.js 14 サポート終了日と移行方法を確認

1. "Lambda Node.js 14 deprecation" を検索
2. Deprecation Notice を確認
3. Node.js 18 または 20 への移行ガイドを確認
```

---

## 複数ドキュメントの横断検索

### 統合シナリオの調査

**検索戦略**:
1. 各サービスのユーザーガイドを個別に検索
2. 統合に関する専用ドキュメントを検索
3. ソリューションアーキテクチャ図を確認

**例**:
```
目的: Lambda + API Gateway + DynamoDB の統合方法を調査

1. "Lambda API Gateway integration" を検索
   → API Gateway で Lambda 関数を呼び出す方法

2. "Lambda DynamoDB SDK" を検索
   → Lambda から DynamoDB にアクセスする方法

3. "Serverless API architecture AWS" を検索
   → 統合されたアーキテクチャパターン
```

### ベストプラクティスの統合

**検索戦略**:
1. 各サービスのベストプラクティスを確認
2. Well-Architected Framework で全体設計を確認
3. ホワイトペーパーでアーキテクチャパターンを確認

**例**:
```
目的: マイクロサービスアーキテクチャのベストプラクティスを調査

1. "ECS best practices" を検索
2. "API Gateway best practices" を検索
3. "AWS Well-Architected Framework microservices" を検索
4. "Microservices on AWS whitepaper" を検索
```

---

## 検索のコツとヒント

### コツ1: 略称とフル名の両方を試す

| 略称 | フル名 |
|------|--------|
| EC2 | Elastic Compute Cloud |
| S3 | Simple Storage Service |
| RDS | Relational Database Service |
| ECS | Elastic Container Service |
| ALB | Application Load Balancer |

検索時は略称の方が効率的なことが多いですが、ヒットしない場合はフル名も試してください。

### コツ2: 英語での検索を優先

AWS 公式ドキュメントは英語が最新です。日本語ドキュメントは翻訳に時間がかかるため、最新機能は英語ドキュメントでのみ確認可能な場合があります。

### コツ3: FAQ ドキュメントを活用

多くのサービスには FAQ ドキュメントがあり、よくある質問と回答が整理されています。

**検索例**:
- "Lambda FAQ"
- "S3 FAQ"

### コツ4: AWS Knowledge Center を活用

よくあるトラブルシューティングやハウツーが記事形式でまとめられています。

**検索例**:
- "AWS Knowledge Center [問題の説明]"

### コツ5: ドキュメントの最終更新日を確認

ドキュメントが古い場合、情報が最新でない可能性があります。最終更新日を確認し、必要に応じて What's New で最新情報をチェックしてください。

---

## 検索効率化チェックリスト

効率的な検索のために、以下のチェックリストを活用してください：

- [ ] 検索キーワードは具体的で明確か
- [ ] サービス名 + 調査項目のパターンを使用しているか
- [ ] 英語キーワードを使用しているか
- [ ] 複数の検索パターン（略称、フル名）を試したか
- [ ] ドキュメントの種類（ユーザーガイド、API リファレンス等）を意識しているか
- [ ] バージョン・リージョン固有情報を確認したか
- [ ] ドキュメントの最終更新日を確認したか
- [ ] 必要に応じて複数のドキュメントを横断検索したか

---

## よくある調査パターンと詳細例

このセクションでは、実際の調査シナリオに基づいた具体的な例を示します。

### パターン1: サービス仕様・制限事項の調査

#### シナリオ: Lambda 実行時間の制限を確認

**調査手順**:

1. **検索**: `awslabs:aws-documentation-mcp-server:search_documentation` で "Lambda limits" または "Lambda quotas" を検索
2. **ドキュメント読み込み**: Lambda Developer Guide の Quotas セクションを `read_documentation` で取得
3. **情報抽出**: Function execution time の項目を確認

**回答例**:

```markdown
## Lambda 実行時間の制限

📚 **参照元**: AWS Lambda Developer Guide > Quotas

**最大実行時間**:
- デフォルト: 15分（900秒）
- 上限申請: 不可（ハードリミット）

**推奨事項**:
- 長時間実行が必要な場合: Step Functions + 複数Lambda の組み合わせ
- バッチ処理: AWS Batch または ECS を検討

🔗 https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html
```

### パターン2: APIリファレンスの調査

#### シナリオ: DynamoDB BatchWriteItem API の詳細

**調査手順**:

1. **検索**: "DynamoDB BatchWriteItem" で検索
2. **API リファレンス確認**: パラメータ、レスポンス、エラーコードを確認
3. **制限事項確認**: リクエストサイズ、アイテム数の制限を確認

**回答例**:

```markdown
## DynamoDB BatchWriteItem API

📚 **参照元**: Amazon DynamoDB API Reference > BatchWriteItem

**概要**:
複数のアイテムを一括で書き込み（Put）または削除（Delete）

**制限事項**:
- 最大25リクエスト（PutRequestまたはDeleteRequest）
- 最大16MBのリクエストサイズ
- 1アイテムあたり最大400KB

**リクエスト構文**:
```json
{
  "RequestItems": {
    "TableName": [
      {
        "PutRequest": {
          "Item": { "key": "value" }
        }
      }
    ]
  }
}
```

**エラーハンドリング**:
- UnprocessedItems: 失敗したアイテムを再試行
- ProvisionedThroughputExceededException: 指数バックオフで再試行

🔗 https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_BatchWriteItem.html
```

### パターン3: ベストプラクティスの調査

#### シナリオ: S3 セキュリティベストプラクティス

**調査手順**:

1. **検索**: "S3 security best practices" で検索
2. **セキュリティガイド確認**: 暗号化、アクセス制御、監査ログの推奨事項を確認
3. **実装例確認**: バケットポリシー、IAMポリシーの例を取得

**回答例**:

```markdown
## S3 セキュリティのベストプラクティス

📚 **参照元**: Amazon S3 User Guide > Security Best Practices

### 1. 暗号化

**保管時の暗号化**:
- SSE-S3（S3管理キー）: デフォルトで有効化推奨
- SSE-KMS（KMS管理キー）: 監査ログが必要な場合
- SSE-C（顧客管理キー）: 完全な鍵管理が必要な場合

**転送時の暗号化**:
- バケットポリシーで `aws:SecureTransport` 条件を使用してHTTPS強制

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyInsecureTransport",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::example-bucket/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

### 2. アクセス制御

**最小権限の原則**:
- IAMロールとポリシーで必要最小限の権限のみ付与
- S3 Access Analyzer でパブリックアクセスを検出

**バケットポリシー例（読み取り専用）**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOnlyAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/ReadOnlyRole"
      },
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::example-bucket",
        "arn:aws:s3:::example-bucket/*"
      ]
    }
  ]
}
```

### 3. 監査とモニタリング

**CloudTrail ログ**:
- S3 データイベントを記録してアクセス履歴を監査

**S3 アクセスログ**:
- バケットレベルのアクセスログを有効化
- ログバケットは別バケットに保存

**CloudWatch アラーム**:
- GetObject、PutObject のメトリクスを監視
- 異常なアクセスパターンを検知

### 4. データ保護

**バージョニング**:
- 誤削除や上書きからデータを保護
- MFA Delete で削除操作に多要素認証を要求

**オブジェクトロック**:
- WORM（Write Once Read Many）保護
- コンプライアンス要件がある場合に有効

🔗 https://docs.aws.amazon.com/AmazonS3/latest/userguide/security-best-practices.html
```

### パターン4: トラブルシューティング

#### シナリオ: Lambda タイムアウトエラー

**調査手順**:

1. **検索**: "Lambda timeout troubleshooting" または "Lambda Task timed out" で検索
2. **トラブルシューティングガイド確認**: よくある原因と解決策を確認
3. **ベストプラクティス確認**: タイムアウト回避のための設計パターンを確認

**回答例**:

```markdown
## Lambda タイムアウトのトラブルシューティング

📚 **参照元**: AWS Lambda Developer Guide > Troubleshooting

**エラーメッセージ**:
```
Task timed out after X.XX seconds
```

### よくある原因

**1. データベース接続の遅延**:
- RDS/Aurora への接続確立に時間がかかる
- コネクションプーリングが未使用

**解決策**:
- RDS Proxy を使用してコネクションプーリング
- Lambda のVPC設定を最適化（ENI作成時間の短縮）

**2. 外部API呼び出しの遅延**:
- サードパーティAPIのレスポンスが遅い
- ネットワークレイテンシが高い

**解決策**:
- タイムアウト値を適切に設定（デフォルト3秒 → 最大900秒）
- 非同期処理パターンを検討（SQS + Lambda）

**3. 処理ロジックの問題**:
- 大量データの処理
- 非効率なアルゴリズム

**解決策**:
- バッチ処理をStep Functionsで分割
- メモリ増量（CPU性能も向上）
- CloudWatch Logs でボトルネック特定

### ベストプラクティス

**タイムアウト値の設定**:
- 余裕を持った値を設定（処理時間の1.5倍程度）
- 最大900秒を超える場合は別サービス（ECS、Batch）を検討

**非同期処理**:
```javascript
// 長時間処理を別Lambda に委譲
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();

exports.handler = async (event) => {
  await lambda.invoke({
    FunctionName: 'long-running-task',
    InvocationType: 'Event', // 非同期実行
    Payload: JSON.stringify(event)
  }).promise();

  return { statusCode: 202, body: 'Processing started' };
};
```

**モニタリング**:
- CloudWatch Logs Insights で実行時間を分析
```
fields @timestamp, @duration
| filter @type = "REPORT"
| stats avg(@duration), max(@duration), pct(@duration, 95)
```

🔗 https://docs.aws.amazon.com/lambda/latest/dg/troubleshooting-invocation.html
```

### パターン5: 新機能・アップデート調査

#### シナリオ: Lambda SnapStart の新機能

**調査手順**:

1. **検索**: "Lambda SnapStart" で検索
2. **機能概要確認**: What's New、ブログ記事を確認
3. **使用方法確認**: ユーザーガイドで設定方法を確認
4. **制限事項確認**: サポートされるランタイム、制約を確認

**回答例**:

```markdown
## Lambda SnapStart の新機能

📚 **参照元**: AWS Lambda Developer Guide > SnapStart

### 概要

Lambda SnapStart は、Java関数のコールドスタート時間を大幅に短縮する機能です。

**仕組み**:
1. 関数の初期化処理を事前に実行
2. メモリとディスクの状態をスナップショット化
3. 新しい実行環境を起動する際にスナップショットから復元

**効果**:
- コールドスタート時間を最大90%削減
- レイテンシ要求が厳しいアプリケーションに有効

### サポート対象

**ランタイム**:
- Java 11（Corretto）
- Java 17（Corretto）

**リージョン**:
- 主要リージョンで利用可能（最新リージョンは順次追加）

### 有効化方法

**AWS CLI**:
```bash
aws lambda update-function-configuration \
  --function-name my-function \
  --snap-start ApplyOn=PublishedVersions
```

**AWS CDK (TypeScript)**:
```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';

new lambda.Function(this, 'MyFunction', {
  runtime: lambda.Runtime.JAVA_17,
  handler: 'com.example.Handler',
  code: lambda.Code.fromAsset('target/my-function.jar'),
  snapStart: lambda.SnapStartConf.ON_PUBLISHED_VERSIONS,
});
```

### 制限事項と考慮事項

**制限事項**:
- プロビジョニング済み同時実行数との併用不可
- Java ランタイムのみ対応
- 関数バージョンまたはエイリアスに対してのみ有効

**考慮事項**:
- 乱数生成やタイムスタンプはスナップショット復元時にリセット
- ネットワーク接続は復元されない（再接続が必要）
- 初期化処理で一時ファイルを作成している場合は注意

**ベストプラクティス**:
- `@PreWarm` アノテーションを使用して初期化処理を明示
- スナップショット復元後の状態を検証するテストを実装
- CloudWatch Logs で SnapStart の効果を測定

### 料金

- SnapStart 自体の追加料金は不要
- 通常のLambda 実行料金のみ

🔗 https://docs.aws.amazon.com/lambda/latest/dg/snapstart.html
```

---

## MCP ツール使用リファレンス

このセクションでは、`awslabs:aws-documentation-mcp-server` の各ツールの具体的な使用方法を示します。

### 利用可能なツール

1. **search_documentation**: ドキュメントを検索
2. **read_documentation**: 特定のドキュメントを詳細に読み込み
3. **recommend**: 推奨ドキュメントを取得

### 1. search_documentation の使用例

#### 基本的な検索

**目的**: Lambda の制限事項を検索

```
ツール: awslabs:aws-documentation-mcp-server:search_documentation
パラメータ:
{
  "query": "Lambda limits quotas"
}
```

**レスポンス例**:
```json
{
  "results": [
    {
      "title": "AWS Lambda quotas",
      "url": "https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html",
      "snippet": "Lambda limits include concurrent executions, function memory..."
    }
  ]
}
```

#### 特定のサービスとトピックでの検索

**目的**: DynamoDB のグローバルセカンダリインデックスの制限を検索

```
ツール: awslabs:aws-documentation-mcp-server:search_documentation
パラメータ:
{
  "query": "DynamoDB global secondary index limits"
}
```

#### API 仕様の検索

**目的**: S3 の PutObject API の詳細を検索

```
ツール: awslabs:aws-documentation-mcp-server:search_documentation
パラメータ:
{
  "query": "S3 PutObject API reference"
}
```

#### セキュリティベストプラクティスの検索

**目的**: RDS のセキュリティベストプラクティスを検索

```
ツール: awslabs:aws-documentation-mcp-server:search_documentation
パラメータ:
{
  "query": "RDS security best practices encryption"
}
```

#### トラブルシューティング情報の検索

**目的**: ECS タスク起動エラーのトラブルシューティング

```
ツール: awslabs:aws-documentation-mcp-server:search_documentation
パラメータ:
{
  "query": "ECS task failed to start troubleshooting"
}
```

### 2. read_documentation の使用例

#### ドキュメントの詳細読み込み

**目的**: Lambda Quotas ドキュメントの全文を取得

```
ツール: awslabs:aws-documentation-mcp-server:read_documentation
パラメータ:
{
  "url": "https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html"
}
```

**レスポンス例**:
```json
{
  "title": "AWS Lambda quotas",
  "content": "This section describes Lambda service quotas...",
  "sections": [
    {
      "heading": "Function configuration, deployment, and execution",
      "content": "Memory allocation: 128 MB to 10,240 MB..."
    },
    {
      "heading": "Lambda console and AWS CLI limits",
      "content": "Deployment package size: 50 MB (zipped)..."
    }
  ]
}
```

#### 特定のセクションに焦点を当てた読み込み

**目的**: API Gateway のスロットリング制限の詳細を取得

```
ツール: awslabs:aws-documentation-mcp-server:read_documentation
パラメータ:
{
  "url": "https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html"
}
```

### 3. recommend の使用例

#### 関連ドキュメントの推奨取得

**目的**: Lambda に関連する推奨ドキュメントを取得

```
ツール: awslabs:aws-documentation-mcp-server:recommend
パラメータ:
{
  "service": "Lambda",
  "topic": "best practices"
}
```

**レスポンス例**:
```json
{
  "recommendations": [
    {
      "title": "Best practices for working with AWS Lambda functions",
      "url": "https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html",
      "relevance": "high"
    },
    {
      "title": "Lambda function metrics",
      "url": "https://docs.aws.amazon.com/lambda/latest/dg/monitoring-metrics.html",
      "relevance": "medium"
    }
  ]
}
```

### ワークフロー例：包括的な調査

以下は、MCP ツールを組み合わせた包括的な調査ワークフローの例です。

#### シナリオ: DynamoDB の設計ベストプラクティスを調査

**ステップ1: 検索でドキュメントを特定**

```
ツール: awslabs:aws-documentation-mcp-server:search_documentation
パラメータ:
{
  "query": "DynamoDB partition key design best practices"
}
```

**ステップ2: 該当ドキュメントを詳細に読み込み**

```
ツール: awslabs:aws-documentation-mcp-server:read_documentation
パラメータ:
{
  "url": "https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html"
}
```

**ステップ3: 関連する推奨ドキュメントを取得**

```
ツール: awslabs:aws-documentation-mcp-server:recommend
パラメータ:
{
  "service": "DynamoDB",
  "topic": "performance optimization"
}
```

**ステップ4: 追加の詳細情報を取得**

```
ツール: awslabs:aws-documentation-mcp-server:search_documentation
パラメータ:
{
  "query": "DynamoDB read write capacity units calculation"
}
```

### 検索クエリ最適化のヒント

#### 効果的なクエリの構成

**良い例**:
- `Lambda cold start optimization`（具体的なトピック）
- `S3 bucket policy examples`（実用的な例を求める）
- `RDS Multi-AZ failover process`（具体的なプロセス）

**避けるべき例**:
- `How to use Lambda`（曖昧すぎる）
- `AWS best practices`（範囲が広すぎる）
- `What is S3`（基本概念のみ）

#### サービス名の指定

**推奨形式**:
```
{
  "query": "[Service] [Feature] [Topic]"
}
```

**例**:
- `EC2 Auto Scaling predictive scaling`
- `CloudFront signed cookies authentication`
- `Aurora Global Database latency`

#### エラーメッセージでの検索

エラーメッセージをそのまま検索クエリとして使用するのが効果的です：

```
ツール: awslabs:aws-documentation-mcp-server:search_documentation
パラメータ:
{
  "query": "ResourceNotFoundException: The security token included in the request is invalid"
}
```

### トラブルシューティング

#### ドキュメントが見つからない場合

1. **検索キーワードを変更**
   - サービスの略称とフル名を両方試す（EC2 vs Elastic Compute Cloud）
   - 同義語を試す（limits vs quotas, troubleshooting vs debugging）

2. **関連サービスを検索**
   - 統合されているサービスのドキュメントも確認
   - 例: Lambda が見つからない場合、API Gateway や EventBridge のドキュメントも確認

3. **What's New で最新情報を確認**
   ```
   ツール: awslabs:aws-documentation-mcp-server:search_documentation
   パラメータ:
   {
     "query": "[Service] what's new 2025"
   }
   ```

#### MCPツールが応答しない場合

1. クエリをシンプルにする
2. 複数の小さなクエリに分割する
3. 一般的な知識での回答を明記した上で提供

### ベストプラクティス

1. **段階的な検索**: 広範な検索から始めて、徐々に絞り込む
2. **複数ソースの確認**: ユーザーガイド、APIリファレンス、FAQを横断的に確認
3. **最新性の確認**: ドキュメントの最終更新日を確認し、必要に応じて What's New もチェック
4. **参照元の明示**: 回答時は必ずドキュメントのURL、セクション名、最終更新日を含める

---

この検索戦略ガイドと MCP ツール使用リファレンスを活用して、AWS公式ドキュメントから効率的に必要な情報を取得してください。
