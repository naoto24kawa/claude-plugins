# Honoバックエンドレビューの良い例・悪い例

このドキュメントは、hono-backend-review スキルの効果的な使用方法を具体例で示します。

---

## 目次

1. [レビュー依頼の良い例・悪い例](#レビュー依頼の良い例悪い例)
2. [対象指定の良い例・悪い例](#対象指定の良い例悪い例)
3. [DDD観点のレビュー例](#ddd観点のレビュー例)
4. [Cloudflare最適化のレビュー例](#cloudflare最適化のレビュー例)

---

## レビュー依頼の良い例・悪い例

### 悪い例 1: 曖昧な依頼

```
ユーザー: バックエンドをレビューして
```

**問題点**:

- 対象が不明確
- DDDなのかパフォーマンスなのか観点が不明
- Honoプロジェクトかどうかも不明

### 良い例 1: 明確な依頼

```
ユーザー: src/contexts/order/ のHonoバックエンドをレビューしてください。
新しい注文処理機能を実装したので、DDD設計とCloudflare Workers上での
パフォーマンスに問題がないか確認したいです。
```

**優れている点**:

- 対象ディレクトリが明確
- レビュー観点（DDD設計とパフォーマンス）が明示
- 実行環境（Cloudflare Workers）が明確

---

### 悪い例 2: 技術スタックの不一致

```
ユーザー: Express.jsで書いたAPIをレビューして
```

**問題点**:

- このスキルはHono専用
- Express.jsには別のレビュースキルが適切

### 良い例 2: 適切な技術スタック

```
ユーザー: Honoで実装したREST APIをレビューしてください。
Cloudflare Workersにデプロイ予定で、D1とR2を使用しています。
```

**優れている点**:

- Honoプロジェクトであることが明確
- デプロイ環境とバインディングが明示
- 適切なコンテキストが提供されている

---

## 対象指定の良い例・悪い例

### 悪い例 1: 範囲が広すぎる

```
対象: プロジェクト全体
```

**問題点**:

- フロントエンドコードも含まれる可能性
- 範囲が広すぎてフォーカスが定まらない

### 良い例 1: Bounded Context単位

```
対象: src/contexts/payment/
状況: 決済コンテキストのDDD準拠確認
期待: Entity/VO/Aggregateの設計評価とドメインイベント設計
```

**優れている点**:

- Bounded Context単位で範囲を限定
- DDD観点での具体的な期待値

---

## DDD観点のレビュー例

### 悪い例: アンチパターン

```typescript
// 貧血ドメインモデル
class Order {
  id: string;
  items: OrderItem[];
  status: string;
}

// ロジックがサービスに流出
class OrderService {
  calculateTotal(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  canCancel(order: Order): boolean {
    return order.status === 'pending';
  }
}
```

**問題点**:

- ドメインロジックがサービスに流出
- Orderがただのデータ構造
- ビジネスルールが分散

### 良い例: リッチドメインモデル

```typescript
// リッチドメインモデル
class Order {
  private constructor(
    private readonly id: OrderId,
    private readonly items: OrderItem[],
    private status: OrderStatus
  ) {}

  static create(items: OrderItem[]): Result<Order, OrderError> {
    if (items.length === 0) {
      return err(new EmptyOrderError());
    }
    return ok(new Order(OrderId.generate(), items, OrderStatus.Pending));
  }

  get total(): Money {
    return this.items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.zero()
    );
  }

  cancel(): Result<void, OrderError> {
    if (!this.status.canCancel()) {
      return err(new OrderNotCancellableError());
    }
    this.status = OrderStatus.Cancelled;
    return ok(undefined);
  }
}
```

**優れている点**:

- ドメインロジックがエンティティ内に凝集
- Value Object（OrderId, Money, OrderStatus）を活用
- 不変条件をコンストラクタで保証
- Result型でエラーハンドリング

---

## Cloudflare最適化のレビュー例

### 悪い例: エッジ非対応

```typescript
// Node.js依存のコード
import fs from 'fs';
import { Pool } from 'pg';

app.get('/data', async (c) => {
  const config = fs.readFileSync('./config.json');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const result = await pool.query('SELECT * FROM users');
  return c.json(result.rows);
});
```

**問題点**:

- `fs` モジュールはエッジで使用不可
- PostgreSQLへの直接接続は非対応
- `process.env` はエッジでは制限あり

### 良い例: エッジ最適化

```typescript
// Cloudflare Workersに最適化
app.get('/data', async (c) => {
  const db = c.env.DB; // D1バインディング
  const config = c.env.CONFIG; // 環境変数

  const result = await db
    .prepare('SELECT * FROM users WHERE active = ?')
    .bind(true)
    .all();

  return c.json(result.results);
});
```

**優れている点**:

- D1バインディングを使用
- 環境変数はBindingsから取得
- プリペアドステートメントでSQLインジェクション対策

---

## イベント駆動パターンの例

### 悪い例: 同期的な処理

```typescript
app.post('/orders', async (c) => {
  const order = await createOrder(c.req.json());
  await sendEmail(order.customer.email); // 遅延の原因
  await updateInventory(order.items); // 失敗するとロールバック必要
  await notifyWarehouse(order); // 外部依存
  return c.json(order);
});
```

**問題点**:

- すべての処理が同期的
- 1つでも失敗すると全体が失敗
- レスポンス時間が長くなる

### 良い例: イベント駆動

```typescript
app.post('/orders', async (c) => {
  const order = await createOrder(c.req.json());

  // イベントをキューに発行
  await c.env.ORDER_QUEUE.send({
    type: 'OrderCreated',
    payload: order.toJSON(),
    timestamp: Date.now()
  });

  return c.json(order, 201);
});

// 別のワーカーでイベント処理
export default {
  async queue(batch: MessageBatch, env: Env) {
    for (const message of batch.messages) {
      const event = message.body as DomainEvent;
      await processEvent(event, env);
      message.ack();
    }
  }
};
```

**優れている点**:

- 非同期でイベント処理
- 障害の影響を局所化
- リトライ可能
- レスポンス時間を短縮

---

## まとめ: 効果的なレビューのポイント

### レビュー前

1. **対象を明確に**: Bounded Context単位で指定
2. **技術スタック確認**: Hono + Cloudflare Workersか
3. **観点を明示**: DDD、パフォーマンス、イベント駆動など

### レビュー後

1. **Critical問題から対応**: セキュリティ、データ整合性
2. **段階的に改善**: DDDパターンの導入は慎重に
3. **効果測定**: レイテンシ、エラー率の改善を確認

---

このガイドを参考に、hono-backend-review スキルを効果的に活用してください。
