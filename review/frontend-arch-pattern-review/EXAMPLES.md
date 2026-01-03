# フロントエンドアーキテクチャレビューの良い例・悪い例

このドキュメントは、frontend-arch-pattern-review スキルの効果的な使用方法を具体例で示します。

---

## 目次

1. [レビュー依頼の良い例・悪い例](#レビュー依頼の良い例悪い例)
2. [Feature-Sliced Designの例](#feature-sliced-designの例)
3. [React Router loader/actionの例](#react-router-loaderactionの例)
4. [状態管理の例](#状態管理の例)
5. [Hono RPC連携の例](#hono-rpc連携の例)

---

## レビュー依頼の良い例・悪い例

### 悪い例 1: 曖昧な依頼

```
ユーザー: フロントエンドをレビューして
```

**問題点**:

- 対象が不明確
- どのパターンを基準にするか不明
- React Router使用有無も不明

### 良い例 1: 明確な依頼

```
ユーザー: apps/frontend/src/ のアーキテクチャをレビューしてください。
Feature-Sliced Designを採用しており、React Router v7のloader/actionパターンと
Hono RPCクライアントの使い方を確認したいです。
```

**優れている点**:

- 対象ディレクトリが明確
- 採用パターン（FSD）が明示
- 技術スタックが具体的

---

## Feature-Sliced Designの例

### 悪い例: 責務が不明確な構造

```
src/
├── components/
│   ├── Header.tsx
│   ├── UserCard.tsx
│   ├── OrderList.tsx
│   └── ProductForm.tsx      # 混在
├── hooks/
│   ├── useUser.ts
│   ├── useOrders.ts
│   └── useProducts.ts
├── pages/
│   ├── Home.tsx
│   ├── Profile.tsx
│   └── Orders.tsx
└── utils/
    └── helpers.ts            # 何でも入る
```

**問題点**:

- 機能ごとの境界がない
- 依存関係が複雑になりやすい
- スケールしにくい

### 良い例: FSD準拠の構造

```
src/
├── app/                      # アプリケーション層
│   ├── providers/
│   ├── routes/
│   └── styles/
├── pages/                    # ページ層
│   ├── home/
│   ├── profile/
│   └── orders/
├── widgets/                  # ウィジェット層
│   ├── header/
│   └── sidebar/
├── features/                 # フィーチャー層
│   ├── auth/
│   │   ├── ui/
│   │   ├── model/
│   │   └── api/
│   ├── order/
│   └── product/
├── entities/                 # エンティティ層
│   ├── user/
│   │   ├── ui/
│   │   ├── model/
│   │   └── api/
│   └── order/
└── shared/                   # 共有層
    ├── ui/
    ├── lib/
    └── api/
```

**優れている点**:

- 7層の明確な分離
- 依存方向が下向き（上位→下位のみ）
- 機能単位でのモジュール化
- スケーラブル

---

## React Router loader/actionの例

### 悪い例: useEffectでのデータ取得

```tsx
// pages/orders/OrderList.tsx
function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchOrders()
      .then(setOrders)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <OrderTable orders={orders} />;
}
```

**問題点**:

- ウォーターフォール読み込み
- ローディング/エラー状態を手動管理
- SSR非対応
- 重複コードが発生しやすい

### 良い例: loader/actionパターン

```tsx
// routes/orders.tsx
import { createRoute } from '@tanstack/react-router';
import { ordersRoute } from './orders.route';

export const ordersIndexRoute = createRoute({
  getParentRoute: () => ordersRoute,
  path: '/',
  loader: async ({ context }) => {
    // データ取得はloaderで
    const orders = await context.api.orders.$get().then(r => r.json());
    return { orders };
  },
  component: OrderList,
});

function OrderList() {
  // loaderの結果を型安全に取得
  const { orders } = ordersIndexRoute.useLoaderData();

  return <OrderTable orders={orders} />;
}

// フォーム送信はactionで
export const createOrderRoute = createRoute({
  getParentRoute: () => ordersRoute,
  path: '/new',
  component: CreateOrderForm,
});

function CreateOrderForm() {
  const navigate = useNavigate();

  const handleSubmit = async (data: CreateOrderDto) => {
    await api.orders.$post({ json: data });
    navigate({ to: '/orders' });
  };

  return <OrderForm onSubmit={handleSubmit} />;
}
```

**優れている点**:

- データ取得がルート定義と統合
- 型安全なデータアクセス
- SSR対応
- ローディング/エラー状態の自動管理

---

## 状態管理の例

### 悪い例: グローバル状態の乱用

```tsx
// store/globalStore.ts
interface GlobalState {
  user: User | null;
  orders: Order[];
  products: Product[];
  cart: CartItem[];
  ui: {
    sidebarOpen: boolean;
    modalOpen: boolean;
    theme: 'light' | 'dark';
  };
  // すべてがグローバル...
}

const useGlobalStore = create<GlobalState>((set) => ({
  // 巨大なストア
}));
```

**問題点**:

- すべてがグローバル状態
- 不要な再レンダリング
- テスト困難
- 状態の責務が不明確

### 良い例: 状態の適切な分類

```tsx
// サーバー状態: TanStack Query（またはloader）
// entities/order/api/useOrders.ts
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => api.orders.$get().then(r => r.json()),
  });
}

// クライアント状態（ローカル）: useState
function OrderFilter() {
  const [filter, setFilter] = useState<FilterState>({ status: 'all' });
  // このコンポーネント内でのみ使用
}

// クライアント状態（共有）: Context
// features/cart/model/CartContext.tsx
const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => [...prev, item]);
  }, []);

  return (
    <CartContext.Provider value={{ items, addItem }}>
      {children}
    </CartContext.Provider>
  );
}

// UI状態: ローカルまたはURL
function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;
  // ページネーションはURLで管理
}
```

**優れている点**:

- サーバー状態とクライアント状態を分離
- 適切なスコープで状態管理
- URLで共有可能な状態はURLで管理
- 必要最小限のグローバル状態

---

## Hono RPC連携の例

### 悪い例: 型安全でないAPI呼び出し

```tsx
// api/orders.ts
export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch('/api/orders');
  return res.json(); // 型チェックなし
}

export async function createOrder(data: unknown): Promise<Order> {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json(); // レスポンス型も不明
}
```

**問題点**:

- エンドポイントURLがハードコード
- リクエスト/レスポンス型が不明
- バックエンドとの型不整合を検出できない

### 良い例: Hono RPCクライアント

```tsx
// shared/api/client.ts
import { hc } from 'hono/client';
import type { AppType } from '@backend/index'; // バックエンドから型をインポート

export const api = hc<AppType>(import.meta.env.VITE_API_URL);

// 使用例: features/order/api/orderApi.ts
export async function getOrders() {
  const res = await api.orders.$get();
  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }
  return res.json(); // 型が自動推論される
}

export async function createOrder(data: CreateOrderDto) {
  const res = await api.orders.$post({ json: data });
  if (!res.ok) {
    const error = await res.json();
    throw new ValidationError(error.issues);
  }
  return res.json(); // Order型が返る
}

// loaderでの使用
export const ordersLoader = async () => {
  const orders = await api.orders.$get().then(r => {
    if (!r.ok) throw new Response('Failed', { status: r.status });
    return r.json();
  });
  return { orders };
};
```

**優れている点**:

- エンドツーエンドの型安全性
- バックエンド変更時にコンパイルエラー
- IDEでの自動補完
- エラーハンドリングが明示的

---

## コンポーネント設計の例

### 悪い例: 責務過多のコンポーネント

```tsx
function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState({});
  const [sort, setSort] = useState('date');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => { /* データ取得 */ }, [filter, sort, page]);

  const handleFilter = () => { /* フィルタロジック */ };
  const handleSort = () => { /* ソートロジック */ };
  const handlePageChange = () => { /* ページネーション */ };
  const handleDelete = () => { /* 削除処理 */ };
  const handleEdit = () => { /* 編集処理 */ };

  return (
    <div>
      {/* 500行のJSX */}
    </div>
  );
}
```

**問題点**:

- 単一責任の原則違反
- テスト困難
- 再利用不可
- 可読性が低い

### 良い例: 適切に分割されたコンポーネント

```tsx
// pages/orders/OrdersPage.tsx
function OrdersPage() {
  const { orders } = useLoaderData<typeof ordersLoader>();

  return (
    <PageLayout>
      <PageHeader title="注文一覧" />
      <OrderFilterBar />
      <OrderList orders={orders} />
      <Pagination />
    </PageLayout>
  );
}

// features/order/ui/OrderList.tsx
interface OrderListProps {
  orders: Order[];
}

function OrderList({ orders }: OrderListProps) {
  if (orders.length === 0) {
    return <EmptyState message="注文がありません" />;
  }

  return (
    <ul className="divide-y">
      {orders.map(order => (
        <OrderListItem key={order.id} order={order} />
      ))}
    </ul>
  );
}

// entities/order/ui/OrderListItem.tsx
interface OrderListItemProps {
  order: Order;
}

function OrderListItem({ order }: OrderListItemProps) {
  return (
    <li className="p-4 hover:bg-gray-50">
      <OrderStatusBadge status={order.status} />
      <OrderSummary order={order} />
      <OrderActions orderId={order.id} />
    </li>
  );
}
```

**優れている点**:

- 単一責任
- 再利用可能
- テスト容易
- Props型が明確

---

## まとめ: 効果的なレビューのポイント

### レビュー前

1. **FSD層を確認**: 7層のどこに配置されているか
2. **依存方向を確認**: 上位→下位のみか
3. **技術スタック確認**: React Router v7, Hono RPC使用か

### レビュー後

1. **依存関係違反から修正**: 下位→上位の依存を解消
2. **状態管理を整理**: サーバー/クライアント状態の分離
3. **型安全性を強化**: Hono RPC活用で型の一貫性

---

このガイドを参考に、frontend-arch-pattern-review スキルを効果的に活用してください。
