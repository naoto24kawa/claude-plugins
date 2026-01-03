# フロントエンドアーキテクチャ 成功指標ガイド

---

## Feature-Sliced Design 指標

### レイヤー構造準拠率

| 指標 | 良好 | 要改善 | 計測方法 |
|------|------|--------|---------|
| レイヤー境界違反数 | 0件 | 1件以上 | import 分析 |
| Feature間依存 | 0件 | 1件以上 | 依存グラフ |
| shared への適切な配置 | 100% | 80%未満 | コードレビュー |

### 計測スクリプト

```bash
# Feature間の直接依存を検出
grep -r "from '../features/" src/features/

# shared への逆依存を検出
grep -r "from '../features/\|from '../app/" src/shared/
```

---

## React Router 指標

### loader/action カバレッジ

| 指標 | 良好 | 要改善 | 計測方法 |
|------|------|--------|---------|
| loader 定義率 | 100% | 80%未満 | ルートファイル分析 |
| action 使用率 | フォームで100% | 50%未満 | フォーム分析 |
| useLoaderData 型安全 | 100% | any使用あり | TypeScript分析 |

### 計測スクリプト

```bash
# loader 定義数
grep -r "export.*function loader\|export const loader" src/routes/ | wc -l

# action 定義数
grep -r "export.*function action\|export const action" src/routes/ | wc -l

# ルートファイル数
find src/routes -name "*.tsx" | wc -l
```

---

## 状態管理指標

### サーバー状態 vs クライアント状態

| 指標 | 良好 | 要改善 | 基準 |
|------|------|--------|------|
| API データの loader 管理 | 100% | 80%未満 | サーバー状態は loader |
| Context 分割 | 更新頻度別 | 単一 Context | パフォーマンス |
| Props Drilling | 3階層以下 | 4階層以上 | 保守性 |

### 計測スクリプト

```bash
# コンポーネント内の fetch 使用（loader 外）
grep -r "await fetch\|await apiClient" src/features/ --include="*.tsx" | grep -v "loader\|action"

# Context 数
grep -r "createContext" src/ | wc -l
```

---

## Hono RPC 指標

### 型安全なAPI呼び出し

| 指標 | 良好 | 要改善 | 計測方法 |
|------|------|--------|---------|
| Hono RPC 使用率 | 100% | 直接 fetch あり | コード分析 |
| response.ok チェック | 100% | チェック漏れ | コード分析 |
| any 使用 | 0件 | 1件以上 | TypeScript分析 |

### 計測スクリプト

```bash
# 直接 fetch の使用（Hono RPC 経由でない）
grep -r "fetch('/api\|fetch(\"/api" src/

# response.ok チェック漏れ
grep -r "apiClient\." src/ -A 5 | grep -v "response.ok\|if (!.*ok)"
```

---

## コンポーネント設計指標

### コンポーネント品質

| 指標 | 良好 | 要改善 | 基準 |
|------|------|--------|------|
| コンポーネント行数 | 150行以下 | 300行超 | 単一責任 |
| Props 数 | 10個以下 | 15個超 | 複雑さ |
| shadcn/ui 使用率 | UIは100% | 独自実装あり | 統一性 |

### 計測スクリプト

```bash
# 大きなコンポーネントを検出（200行以上）
find src -name "*.tsx" -exec wc -l {} + | awk '$1 > 200 { print }'

# shadcn/ui コンポーネント数
ls src/components/ui/ | wc -l
```

---

## 工数表記

| 記号 | 時間 | 例 |
|------|------|-----|
| XS | 1時間未満 | 命名修正、import 修正 |
| S | 1-4時間 | 小さなリファクタリング |
| M | 1-2日 | Feature 分割 |
| L | 3-5日 | ルーティング構造の変更 |
| XL | 1週間以上 | アーキテクチャ変更 |

---

## ダッシュボード構成例

```
┌─────────────────────────────────────────┐
│  FSD準拠ダッシュボード                   │
├─────────────────────────────────────────┤
│  レイヤー境界違反: 0件 ✅               │
│  Feature間依存: 0件 ✅                  │
│  shared 配置率: ████████░░ 85%          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  React Router ダッシュボード             │
├─────────────────────────────────────────┤
│  loader カバレッジ: 100% ✅              │
│  action カバレッジ: ████████░░ 80%      │
│  型安全性: 100% ✅                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  API連携ダッシュボード                   │
├─────────────────────────────────────────┤
│  Hono RPC 使用率: 100% ✅               │
│  エラーハンドリング: ████████░░ 85%     │
│  any 使用: 0件 ✅                        │
└─────────────────────────────────────────┘
```
