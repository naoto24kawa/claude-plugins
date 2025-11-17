# テスト改善の具体例

このドキュメントは、テストコードレビューでよく見られる問題とその改善例を示します。ビフォー・アフターの比較により、具体的な改善手法を理解できます。

---

## 目次

1. [AAA構造の明確化](#aaa構造の明確化)
2. [Test Data Builderの導入](#test-data-builderの導入)
3. [Mock から Fake への移行](#mockからfakeへの移行)
4. [型安全性の向上](#型安全性の向上)
5. [テスト名の改善](#テスト名の改善)
6. [テスト実行速度の改善](#テスト実行速度の改善)

---

## AAA構造の明確化

### 例 1: AAA 構造が不明確

#### ❌ 悪い例

```typescript
test("ユーザー作成", async () => {
  const userData = { name: "田中", email: "tanaka@example.com" };
  const user = await createUser(userData);
  expect(user.id).toBeDefined();
  const savedUser = await findUserById(user.id);
  expect(savedUser.name).toBe("田中");
  expect(savedUser.email).toBe("tanaka@example.com");
});
```

**問題点**:

- Arrange、Act、Assert が混在
- どこが準備で、どこが実行で、どこが検証か不明確
- テストの意図が理解しづらい

#### ✅ 良い例

```typescript
test("ユーザー作成", async () => {
  // Arrange
  const userData = { name: "田中", email: "tanaka@example.com" };

  // Act
  const user = await createUser(userData);

  // Assert
  expect(user.id).toBeDefined();
  expect(user.name).toBe("田中");
  expect(user.email).toBe("tanaka@example.com");
});
```

**改善点**:

- AAA の各セクションをコメントで明確に区切り
- Arrange: テストデータの準備
- Act: テスト対象の実行（1回のみ）
- Assert: 結果の検証（複数可）

---

### 例 2: Arrange が肥大化

#### ❌ 悪い例

```typescript
test("プレミアムユーザーの割引計算", () => {
  const user = {
    id: "user-123",
    name: "田中 太郎",
    email: "tanaka@example.com",
    plan: "premium",
    roles: ["admin", "editor"],
    subscription: {
      id: "sub-456",
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      status: "active",
    },
    preferences: {
      language: "ja",
      timezone: "Asia/Tokyo",
      notifications: true,
    },
  };
  const order = {
    id: "order-789",
    userId: user.id,
    items: [
      { productId: "prod-1", quantity: 2, price: 1000 },
      { productId: "prod-2", quantity: 1, price: 5000 },
    ],
    total: 7000,
  };
  const discount = calculateDiscount(user, order);
  expect(discount).toBe(700); // 10% 割引
});
```

**問題点**:

- Arrange が 20 行以上で読みづらい
- 複雑なオブジェクト生成がテストの本質を隠している
- 他のテストでも同じデータ生成を繰り返す

#### ✅ 良い例（Test Data Builder 使用）

```typescript
// UserBuilder.ts
class UserBuilder {
  private user: Partial<User> = {
    id: "user-123",
    name: "テストユーザー",
    email: "test@example.com",
    plan: "basic",
  };

  withPremiumPlan(): this {
    this.user.plan = "premium";
    return this;
  }

  withRoles(...roles: string[]): this {
    this.user.roles = roles;
    return this;
  }

  build(): User {
    return this.user as User;
  }
}

// テスト
test("プレミアムユーザーの割引計算", () => {
  // Arrange
  const user = new UserBuilder().withPremiumPlan().build();
  const order = { total: 7000 };

  // Act
  const discount = calculateDiscount(user, order);

  // Assert
  expect(discount).toBe(700); // 10% 割引
});
```

**改善点**:

- Arrange が 3 行に簡潔化
- Builder パターンで再利用可能
- テストの意図が明確（プレミアムプランの割引テスト）

---

## Test Data Builderの導入

### 例 3: 複数テストでの Builder 活用

#### ❌ 悪い例（重複したデータ生成）

```typescript
test("通常ユーザーの割引なし", () => {
  const user = { id: "1", name: "田中", plan: "basic" };
  const discount = calculateDiscount(user, { total: 1000 });
  expect(discount).toBe(0);
});

test("プレミアムユーザーの10%割引", () => {
  const user = { id: "2", name: "鈴木", plan: "premium" };
  const discount = calculateDiscount(user, { total: 1000 });
  expect(discount).toBe(100);
});

test("VIPユーザーの20%割引", () => {
  const user = { id: "3", name: "佐藤", plan: "vip" };
  const discount = calculateDiscount(user, { total: 1000 });
  expect(discount).toBe(200);
});
```

**問題点**:

- 同じようなデータ生成が 3 回繰り返される
- プランだけが違うのに全体を書き直している

#### ✅ 良い例（Builder でDRY原則を適用）

```typescript
class UserBuilder {
  private user: Partial<User> = {
    id: "test-user",
    name: "テストユーザー",
    plan: "basic",
  };

  withBasicPlan(): this {
    this.user.plan = "basic";
    return this;
  }

  withPremiumPlan(): this {
    this.user.plan = "premium";
    return this;
  }

  withVIPPlan(): this {
    this.user.plan = "vip";
    return this;
  }

  build(): User {
    return this.user as User;
  }
}

describe("ユーザープランごとの割引計算", () => {
  const order = { total: 1000 };

  test("通常ユーザーの割引なし", () => {
    const user = new UserBuilder().withBasicPlan().build();
    expect(calculateDiscount(user, order)).toBe(0);
  });

  test("プレミアムユーザーの10%割引", () => {
    const user = new UserBuilder().withPremiumPlan().build();
    expect(calculateDiscount(user, order)).toBe(100);
  });

  test("VIPユーザーの20%割引", () => {
    const user = new UserBuilder().withVIPPlan().build();
    expect(calculateDiscount(user, order)).toBe(200);
  });
});
```

**改善点**:

- 重複コードを削減（DRY 原則）
- プランの違いが明確
- 新しいプランの追加が容易

---

## MockからFakeへの移行

### 例 4: 過度な Mock による脆弱なテスト

#### ❌ 悪い例

```typescript
test("ユーザー情報の取得と表示", async () => {
  // Arrange
  const mockRepository = {
    findById: jest.fn().mockResolvedValue({
      id: "123",
      name: "田中",
    }),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockFormatter = {
    formatUserName: jest.fn().mockReturnValue("田中 様"),
  };

  const service = new UserService(mockRepository, mockFormatter);

  // Act
  const result = await service.displayUser("123");

  // Assert
  expect(mockRepository.findById).toHaveBeenCalledWith("123");
  expect(mockFormatter.formatUserName).toHaveBeenCalledWith("田中");
  expect(result).toBe("田中 様");
});
```

**問題点**:

- 過度な Mock で実装の詳細に依存
- `findById` や `formatUserName` の呼び出しを検証（How のテスト）
- 実装が少し変わるだけでテストが壊れる
- Mock の設定が複雑で保守コストが高い

#### ✅ 良い例（Fake Repository + 振る舞いベースのテスト）

```typescript
// FakeUserRepository.ts
class FakeUserRepository implements UserRepository {
  private users = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  seed(...users: User[]): void {
    users.forEach((user) => this.users.set(user.id, user));
  }

  clear(): void {
    this.users.clear();
  }
}

// テスト
test("ユーザー情報の取得と表示", async () => {
  // Arrange
  const repository = new FakeUserRepository();
  repository.seed({ id: "123", name: "田中" });
  const service = new UserService(repository);

  // Act
  const result = await service.displayUser("123");

  // Assert
  expect(result).toContain("田中"); // What のテスト（結果の検証）
});
```

**改善点**:

- Fake Repository で実装に近い環境
- 実装の詳細（How）ではなく、結果（What）をテスト
- 実装変更に強い（内部ロジックが変わってもテストは通る）
- Mock の設定が不要で保守性が高い

---

### 例 5: Mock と Fake の使い分け

#### ✅ 良い例（外部依存は Mock、内部は Fake）

```typescript
test("ユーザー登録時にメール送信", async () => {
  // Arrange: 外部API（メール送信）は Mock
  const mockEmailService = {
    send: jest.fn().mockResolvedValue(true),
  };

  // Arrange: 内部依存（Repository）は Fake
  const repository = new FakeUserRepository();
  const service = new UserService(repository, mockEmailService);

  // Act
  const user = await service.registerUser({
    name: "田中",
    email: "tanaka@example.com",
  });

  // Assert: 振る舞いの検証（What）
  expect(user.id).toBeDefined();
  expect(user.name).toBe("田中");

  // Assert: 外部APIの呼び出し確認（Mock は必要最小限）
  expect(mockEmailService.send).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "tanaka@example.com",
      subject: expect.stringContaining("登録完了"),
    })
  );
});
```

**改善点**:

- 外部依存（メール送信）のみ Mock
- 内部依存（Repository）は Fake で実装に近い環境
- バランスの取れたテスト設計

---

## 型安全性の向上

### 例 6: any の削減

#### ❌ 悪い例

```typescript
test("ユーザー作成", () => {
  const userData: any = {
    name: "田中",
  };

  const result: any = createUser(userData);
  expect(result.name).toBe("田中");
});
```

**問題点**:

- `any` で型安全性を失う
- タイポやフィールド名の間違いを検出できない
- IDE の補完が効かない

#### ✅ 良い例（Partial と型ヘルパー）

```typescript
type TestUserData = Pick<User, "name" | "email">;

function createTestUser(data: Partial<TestUserData> = {}): User {
  return {
    id: "test-id",
    name: data.name ?? "テストユーザー",
    email: data.email ?? "test@example.com",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;
}

test("ユーザー作成", () => {
  // Arrange
  const userData = createTestUser({ name: "田中" });

  // Act
  const result = createUser(userData);

  // Assert
  expect(result.name).toBe("田中");
});
```

**改善点**:

- `any` を排除
- 型安全性を確保（タイポを防ぐ）
- IDE の補完が効く
- テスト専用ヘルパーで簡潔化

---

## テスト名の改善

### 例 7: テスト名の明確化

#### ❌ 悪い例

```typescript
test("user creation", () => {
  // ...
});

test("正しく動作する", () => {
  // ...
});

test("should work", () => {
  // ...
});
```

**問題点**:

- テスト名が曖昧
- 何をテストしているのか不明
- 失敗時に原因が分かりづらい

#### ✅ 良い例（Given-When-Then 形式）

```typescript
test("新規ユーザー登録時にIDが自動採番される", () => {
  // ...
});

test("重複したメールアドレスの場合はエラーを返す", () => {
  // ...
});

test("プレミアムプランのユーザーは10%割引が適用される", () => {
  // ...
});

// describe でグループ化
describe("ユーザー登録", () => {
  test("正常系: 新規ユーザーが作成される", () => {
    // ...
  });

  test("異常系: メールアドレスが重複している場合はエラー", () => {
    // ...
  });

  test("境界値: 名前が100文字の場合は許容される", () => {
    // ...
  });
});
```

**改善点**:

- テスト名が具体的
- 失敗時に何が問題か一目で分かる
- describe でグループ化し、構造を明確に

---

## テスト実行速度の改善

### 例 8: Setup の最適化

#### ❌ 悪い例

```typescript
describe("ユーザーサービス", () => {
  test("ユーザー作成", async () => {
    const db = await connectDatabase(); // 毎回接続
    const repository = new UserRepository(db);
    // ...
    await db.close();
  });

  test("ユーザー更新", async () => {
    const db = await connectDatabase(); // 毎回接続
    const repository = new UserRepository(db);
    // ...
    await db.close();
  });

  test("ユーザー削除", async () => {
    const db = await connectDatabase(); // 毎回接続
    const repository = new UserRepository(db);
    // ...
    await db.close();
  });
});
```

**問題点**:

- 毎回 DB 接続・切断（重い処理）
- テスト実行時間が長い
- 重複したSetup

#### ✅ 良い例（beforeAll で Setup 共有）

```typescript
describe("ユーザーサービス", () => {
  let db: Database;
  let repository: UserRepository;

  beforeAll(async () => {
    // 全テストで1回だけDB接続
    db = await connectDatabase();
    repository = new UserRepository(db);
  });

  afterAll(async () => {
    // 全テスト後にDB切断
    await db.close();
  });

  beforeEach(async () => {
    // 各テスト前にデータをクリア
    await repository.clear();
  });

  test("ユーザー作成", async () => {
    // Arrange, Act, Assert のみ
    const user = await repository.create({ name: "田中" });
    expect(user.id).toBeDefined();
  });

  test("ユーザー更新", async () => {
    const user = await repository.create({ name: "田中" });
    const updated = await repository.update(user.id, { name: "鈴木" });
    expect(updated.name).toBe("鈴木");
  });
});
```

**改善点**:

- beforeAll でDB接続を1回だけ実行
- beforeEach でデータクリア（テスト間の独立性確保）
- テスト実行時間が大幅に短縮

---

### 例 9: テスト並列化

#### ❌ 悪い例（直列実行）

```typescript
describe("APIエンドポイント", () => {
  test("GET /users", async () => {
    // 5秒かかる
  });

  test("POST /users", async () => {
    // 5秒かかる
  });

  test("PUT /users/:id", async () => {
    // 5秒かかる
  });

  test("DELETE /users/:id", async () => {
    // 5秒かかる
  });
});

// 合計: 20秒
```

#### ✅ 良い例（並列実行）

```typescript
describe("APIエンドポイント", () => {
  test.concurrent("GET /users", async () => {
    // 5秒かかる
  });

  test.concurrent("POST /users", async () => {
    // 5秒かかる
  });

  test.concurrent("PUT /users/:id", async () => {
    // 5秒かかる
  });

  test.concurrent("DELETE /users/:id", async () => {
    // 5秒かかる
  });
});

// 合計: 5秒（並列実行）
```

**改善点**:

- `test.concurrent` で並列実行
- テスト実行時間が 1/4 に短縮
- CI/CD パイプラインの高速化

---

## まとめ

テスト改善のベストプラクティス：

1. **AAA構造を明確に**: コメントで区切り、可読性を向上
2. **Test Builder を適切に使用**: 複雑なデータ生成のみBuilder
3. **Mock は必要最小限**: 外部依存のみMock、内部はFake
4. **型安全性を確保**: `any` を避け、型ヘルパーを活用
5. **テスト名を具体的に**: Given-When-Then 形式で明確化
6. **Setup を最適化**: beforeAll/beforeEach で共有
7. **並列化で高速化**: test.concurrent を活用

これらの例を参考に、テストコードの品質を継続的に向上させてください。
