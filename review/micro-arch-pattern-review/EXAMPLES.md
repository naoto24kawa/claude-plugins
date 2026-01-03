# アーキテクチャパターンレビューの良い例・悪い例

このドキュメントは、micro-arch-pattern-review スキルの効果的な使用方法を具体例で示します。

---

## 目次

1. [レビュー依頼の良い例・悪い例](#レビュー依頼の良い例悪い例)
2. [レイヤー構造の例](#レイヤー構造の例)
3. [依存関係の例](#依存関係の例)
4. [DDD Building Blocksの例](#ddd-building-blocksの例)

---

## レビュー依頼の良い例・悪い例

### 悪い例 1: 曖昧な依頼

```
ユーザー: アーキテクチャをチェックして
```

**問題点**:

- 対象が不明確
- どのアーキテクチャパターンを基準にするか不明
- 期待する成果物が不明確

### 良い例 1: 明確な依頼

```
ユーザー: apps/backend/src/ のアーキテクチャをレビューしてください。
Clean Architectureを採用しており、DDD準拠状況と依存関係の方向性を確認したいです。
```

**優れている点**:

- 対象ディレクトリが明確
- 採用しているパターン（Clean Architecture）が明示
- レビュー観点（DDD準拠、依存関係）が具体的

---

### 悪い例 2: 基準がない

```
ユーザー: 設計が良いか悪いか教えて
```

**問題点**:

- 「良い」「悪い」の基準が不明
- プロジェクトの目標が分からない
- 主観的な評価になりがち

### 良い例 2: 明確な基準

```
ユーザー: 以下の基準でアーキテクチャをレビューしてください：
- Onion Architectureの4層構造（Domain/Application/Infrastructure/Presentation）
- 依存関係の方向は外から内へ
- Domain層は外部依存がないこと
```

**優れている点**:

- 評価基準が明確
- アーキテクチャパターンが具体的
- 違反検出が容易

---

## レイヤー構造の例

### 悪い例: レイヤー違反

```
src/
├── controllers/
│   └── UserController.ts  # Repository直接使用
├── models/
│   └── User.ts            # ORMエンティティ = ドメインモデル
└── services/
    └── UserService.ts     # すべてのロジックがここに集中
```

```typescript
// controllers/UserController.ts
import { prisma } from '../db';  // インフラ依存

export class UserController {
  async getUser(id: string) {
    // コントローラーからDB直接アクセス（レイヤー違反）
    return prisma.user.findUnique({ where: { id } });
  }
}
```

**問題点**:

- レイヤー境界が不明確
- コントローラーがインフラに直接依存
- ドメインモデルとORMモデルが混同

### 良い例: 明確なレイヤー分離

```
src/
├── domain/
│   ├── entities/
│   │   └── User.ts              # 純粋なドメインモデル
│   ├── repositories/
│   │   └── UserRepository.ts    # インターフェース
│   └── services/
│       └── UserDomainService.ts # ドメインサービス
├── application/
│   ├── usecases/
│   │   └── GetUserUseCase.ts    # ユースケース
│   └── dto/
│       └── UserDto.ts           # データ転送オブジェクト
├── infrastructure/
│   ├── repositories/
│   │   └── PrismaUserRepository.ts  # 実装
│   └── db/
│       └── prisma.ts
└── presentation/
    └── controllers/
        └── UserController.ts    # HTTPハンドラー
```

```typescript
// domain/repositories/UserRepository.ts
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
}

// infrastructure/repositories/PrismaUserRepository.ts
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: UserId): Promise<User | null> {
    const data = await this.prisma.user.findUnique({ where: { id: id.value } });
    return data ? User.reconstruct(data) : null;
  }
}

// application/usecases/GetUserUseCase.ts
export class GetUserUseCase {
  constructor(private readonly userRepo: UserRepository) {}

  async execute(id: string): Promise<UserDto> {
    const user = await this.userRepo.findById(new UserId(id));
    if (!user) throw new UserNotFoundError(id);
    return UserDto.from(user);
  }
}
```

**優れている点**:

- 4層が明確に分離
- 依存関係が内向き
- Domain層は外部依存なし
- インターフェースで抽象化

---

## 依存関係の例

### 悪い例: 依存逆転違反

```typescript
// domain/services/OrderService.ts
import { PrismaClient } from '@prisma/client';  // インフラ依存
import { Stripe } from 'stripe';                 // 外部サービス依存

export class OrderService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly stripe: Stripe
  ) {}

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    // ドメイン層が具体的なインフラに依存
    const order = await this.prisma.order.create({ data: dto });
    await this.stripe.paymentIntents.create({ amount: order.total });
    return order;
  }
}
```

**問題点**:

- Domain層がPrisma（ORM）に依存
- 外部サービス（Stripe）に直接依存
- テスト困難
- 技術変更時の影響大

### 良い例: 依存性逆転

```typescript
// domain/services/OrderService.ts
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,      // インターフェース
    private readonly paymentGateway: PaymentGateway   // インターフェース
  ) {}

  async createOrder(command: CreateOrderCommand): Result<Order, OrderError> {
    const order = Order.create(command);
    if (order.isErr()) return order;

    const payment = await this.paymentGateway.authorize(order.value.total);
    if (payment.isErr()) return err(new PaymentFailedError());

    await this.orderRepo.save(order.value);
    return ok(order.value);
  }
}

// infrastructure/payment/StripePaymentGateway.ts
export class StripePaymentGateway implements PaymentGateway {
  constructor(private readonly stripe: Stripe) {}

  async authorize(amount: Money): Result<PaymentAuthorization, PaymentError> {
    const intent = await this.stripe.paymentIntents.create({
      amount: amount.toCents(),
      currency: amount.currency
    });
    return ok(new PaymentAuthorization(intent.id));
  }
}
```

**優れている点**:

- Domain層はインターフェースのみ依存
- 具体的な実装はInfrastructure層
- テスト容易（モック差し替え可能）
- 技術変更が容易

---

## DDD Building Blocksの例

### 悪い例: プリミティブ型の氾濫

```typescript
interface Order {
  id: string;
  customerId: string;
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  status: string;
  totalAmount: number;
}

function calculateTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

**問題点**:

- 原始型強迫観念（Primitive Obsession）
- ビジネスルールが分散
- 型安全性が低い
- 不正な値を防げない

### 良い例: Value Objectの活用

```typescript
// Value Objects
class OrderId {
  private constructor(private readonly value: string) {
    if (!value || value.length === 0) {
      throw new InvalidOrderIdError();
    }
  }
  static generate(): OrderId { return new OrderId(crypto.randomUUID()); }
  static from(value: string): OrderId { return new OrderId(value); }
  equals(other: OrderId): boolean { return this.value === other.value; }
}

class Money {
  private constructor(
    private readonly amount: number,
    readonly currency: Currency
  ) {
    if (amount < 0) throw new NegativeAmountError();
  }
  static of(amount: number, currency: Currency): Money {
    return new Money(amount, currency);
  }
  add(other: Money): Money {
    if (!this.currency.equals(other.currency)) {
      throw new CurrencyMismatchError();
    }
    return new Money(this.amount + other.amount, this.currency);
  }
  multiply(quantity: number): Money {
    return new Money(this.amount * quantity, this.currency);
  }
}

// Entity / Aggregate Root
class Order {
  private constructor(
    readonly id: OrderId,
    private readonly customerId: CustomerId,
    private items: OrderItem[],
    private status: OrderStatus
  ) {}

  get total(): Money {
    return this.items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.zero(Currency.JPY)
    );
  }

  addItem(item: OrderItem): Result<void, OrderError> {
    if (this.status.isFinalized()) {
      return err(new OrderFinalizedError());
    }
    this.items.push(item);
    return ok(undefined);
  }
}
```

**優れている点**:

- Value Objectで型安全性を確保
- ビジネスルールがモデル内に凝集
- 不正な状態を型レベルで防止
- 自己文書化されたコード

---

## Cloudflare設定のレビュー例

### 悪い例: 設定不整合

```jsonc
// wrangler.toml（古い形式）
name = "my-api"
main = "src/index.ts"

[vars]
DATABASE_URL = "postgresql://..."  // 秘密情報をハードコード

[[d1_databases]]
binding = "DB"
database_name = "prod-db"
database_id = "xxx"                // 本番IDをハードコード
```

**問題点**:

- 秘密情報がコードに含まれる
- 環境ごとの設定分離がない
- 古いTOML形式

### 良い例: 適切な設定管理

```jsonc
// wrangler.jsonc
{
  "name": "my-api",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "my-db"
      // database_idは環境変数で管理
    }
  ],
  "vars": {
    "ENVIRONMENT": "development"
  },
  "env": {
    "production": {
      "vars": {
        "ENVIRONMENT": "production"
      }
    }
  }
}
```

**優れている点**:

- 秘密情報は環境変数/シークレットで管理
- 環境ごとの設定を分離
- 最新のJSONC形式
- compatibility_dateで互換性を明示

---

## まとめ: 効果的なレビューのポイント

### レビュー前

1. **採用パターンを明示**: Clean/Onion/Hexagonal など
2. **対象範囲を限定**: 全体より特定のBounded Context
3. **評価基準を共有**: 何をもって準拠とするか

### レビュー後

1. **依存関係違反から修正**: 最も影響が大きい
2. **段階的にパターン導入**: 一度に全部は危険
3. **チームで合意形成**: アーキテクチャ決定は共有

---

このガイドを参考に、micro-arch-pattern-review スキルを効果的に活用してください。
