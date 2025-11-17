# テスト品質改善の成功指標ガイド

テストコードのレビューと改善の効果を定量的に測定するための包括的な指標ガイドです。テスト実装特有のメトリクスを中心に、継続的な品質向上を支援します。

---

## 目次

1. [テストカバレッジメトリクス](#テストカバレッジメトリクス)
2. [テスト実行効率メトリクス](#テスト実行効率メトリクス)
3. [テスト保守性メトリクス](#テスト保守性メトリクス)
4. [テスト信頼性メトリクス](#テスト信頼性メトリクス)
5. [測定方法とツール](#測定方法とツール)
6. [目標設定のガイドライン](#目標設定のガイドライン)

---

## テストカバレッジメトリクス

### 1. 行カバレッジ（Line Coverage）

**定義**: テストで実行されたコード行の割合

**測定方法**:

```bash
# Jest
npm test -- --coverage

# Istanbul/nyc
nyc npm test

# Vitest
vitest --coverage
```

**目標値**:

- **重要なビジネスロジック**: 95%以上
- **全体**: 80%以上
- **Critical パス**: 100%
- **ユーティリティ**: 70%以上

**改善のヒント**:

- Critical/High 優先度のコードから優先的にカバー
- カバレッジレポートで未カバー箇所を特定
- エッジケース・境界値のテストを追加

---

### 2. 分岐カバレッジ（Branch Coverage）

**定義**: すべての条件分岐（if/else, switch など）がテストされた割合

**測定方法**:

```bash
# Jest で分岐カバレッジを確認
npm test -- --coverage --coverageReporters=text --coverageReporters=lcov

# カバレッジ閾値の設定
# jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 75
    }
  }
};
```

**目標値**:

- **全体**: 75%以上
- **重要なビジネスロジック**: 90%以上
- **エラーハンドリング**: 80%以上

**改善のヒント**:

- if/else の両方のパスをテスト
- switch 文のすべての case をカバー
- 三項演算子の true/false 両方をテスト
- 早期リターンのパスもカバー

---

### 3. 関数カバレッジ（Function Coverage）

**定義**: 少なくとも一度は呼び出された関数の割合

**測定方法**:

```bash
# Jest
npm test -- --coverage --collectCoverageFrom="src/**/*.{ts,tsx}"
```

**目標値**:

- **公開 API**: 95%以上
- **全体**: 85%以上
- **プライベート関数**: 70%以上

**改善のヒント**:

- 未使用の関数を削除（デッドコード）
- プライベート関数は公開関数経由でテスト
- ヘルパー関数もテストでカバー

---

### 4. 条件カバレッジ（Condition Coverage）

**定義**: 論理演算子（&&, ||）のすべての組み合わせがテストされた割合

**測定方法**:

```bash
# Istanbul で条件カバレッジを測定
nyc --all --reporter=lcov npm test
```

**目標値**:

- **重要なビジネスロジック**: 85%以上
- **全体**: 70%以上

**改善のヒント**:

- 複雑な条件式を分解してテスト
- 真偽の組み合わせを網羅（Truth Table）
- 境界値を含むテストケースを追加

---

### 5. ミューテーションスコア（Mutation Score）

**定義**: テストがコード変更（ミューテーション）を検出できた割合

**測定方法**:

```bash
# Stryker（TypeScript/JavaScript）
npx stryker run

# Stryker の設定
# stryker.conf.json
{
  "mutate": ["src/**/*.ts"],
  "mutator": "typescript",
  "testRunner": "jest",
  "thresholds": { "high": 80, "low": 60, "break": 50 }
}
```

**目標値**:

- **全体**: 70%以上が優秀
- **重要なビジネスロジック**: 80%以上
- **50%未満**: テストの質が低い

**改善のヒント**:

- アサーション（expect）を増やす
- エッジケース・境界値のテストを追加
- テストが実装の変更を検出できるか確認

---

## テスト実行効率メトリクス

### 1. テスト実行時間（Test Execution Time）

**定義**: すべてのテストを実行するのにかかる時間

**測定方法**:

```bash
# Jest でテスト実行時間を測定
npm test -- --verbose

# Vitest
vitest --reporter=verbose

# CI/CD パイプラインの実行時間をモニタリング
```

**目標値**:

- **単体テスト**: 2分以内
- **統合テスト**: 5分以内
- **E2Eテスト**: 10分以内
- **全テストスイート**: 15分以内

**改善のヒント**:

- テスト並列化（Jest の `--maxWorkers`）
- Setup/Teardown の最適化（beforeAll を活用）
- 重いテスト（E2E）を分離
- Mock を活用して外部依存を排除

---

### 2. フレーキーテスト数（Flaky Test Count）

**定義**: ランダムに成功/失敗するテストの数

**測定方法**:

```bash
# テストを複数回実行してフレーキーさを検出
npm test -- --runInBand --testNamePattern="suspicious test"

# Jest で繰り返し実行
for i in {1..10}; do npm test; done
```

**目標値**:

- **理想**: 0個
- **許容**: 全体の1%以下

**改善のヒント**:

- 非同期処理の適切な待機（await, waitFor）
- タイムアウトの調整
- テスト間の状態の分離（beforeEach でリセット）
- ランダム値の固定（seed の設定）

---

### 3. テスト並列度（Parallelization）

**定義**: 並列実行可能なテストの割合

**測定方法**:

```bash
# Jest で並列度を確認
npm test -- --maxWorkers=4

# Vitest
vitest --threads --poolOptions.threads.maxThreads=4
```

**目標値**:

- **並列実行可能なテスト**: 80%以上
- **直列実行が必要なテスト**: 20%以下

**改善のヒント**:

- テスト間の依存関係を排除
- グローバル状態を避ける
- 独立したテストデータを使用

---

### 4. Setup/Teardown 時間（Setup/Teardown Time）

**定義**: テスト前後の準備・後処理にかかる時間

**測定方法**:

```bash
# Jest で詳細なタイミング情報を取得
npm test -- --verbose --detectOpenHandles
```

**目標値**:

- **Setup**: 各テストあたり100ms以内
- **Teardown**: 各テストあたり50ms以内

**改善のヒント**:

- beforeAll を使って Setup を共有
- 不要な Teardown を削除
- データベース接続を再利用

---

## テスト保守性メトリクス

### 1. AAA構造準拠率（AAA Pattern Compliance）

**定義**: Arrange-Act-Assert パターンに準拠したテストの割合

**測定方法**:

```bash
# ESLint カスタムルールで測定
# またはコードレビューで手動チェック

# 自動チェック例（正規表現で検出）
grep -E "// Arrange|// Act|// Assert" tests/**/*.test.ts
```

**目標値**:

- **全体**: 80%以上
- **新規テスト**: 100%

**改善のヒント**:

- コメントで AAA セクションを明確に区切る
- 各セクションの責任を明確にする
- Act と Assert が混在しないよう注意

---

### 2. Test Builder使用率（Test Builder Usage）

**定義**: Test Data Builder パターンを使用しているテストの割合

**測定方法**:

```bash
# Builder クラスの使用箇所を検索
grep -r "Builder" tests/

# 複雑な Arrange（15行以上）の検出
```

**目標値**:

- **複雑なオブジェクト生成（10フィールド以上）**: Builder 使用率 90%以上
- **全体**: 30-50%（過度な使用も避ける）

**改善のヒント**:

- 複雑なデータ構造には Builder を導入
- 再利用可能な Builder を作成
- シンプルなケースは AAA で直接記述

---

### 3. Mock使用箇所（Mock Usage Count）

**定義**: Mock/Stub/Spy を使用している箇所の数

**測定方法**:

```bash
# Jest の Mock 関数を検索
grep -r "jest.fn\|jest.mock\|jest.spyOn" tests/

# Vitest
grep -r "vi.fn\|vi.mock\|vi.spyOn" tests/
```

**目標値**:

- **外部依存（API, DB, File）のみ**: Mock 使用を推奨
- **内部ロジック**: Mock 使用率 20%以下
- **過度な Mock**: 1テストあたり5個以下

**改善のヒント**:

- 外部依存のみ Mock
- 内部ロジックは実装またはFakeを使用
- Mock が多すぎる場合は設計を見直す

---

### 4. Test Doubleの種類分布（Test Double Distribution）

**定義**: Mock、Stub、Fake、Spy の使い分けの適切性

**測定方法**:

```bash
# コードレビューで手動チェック
# 各 Test Double の使用箇所を分類
```

**目標値**:

- **Mock（振る舞い検証）**: 20%
- **Stub（状態検証）**: 30%
- **Fake（実装に近い）**: 40%
- **Spy（部分的なモック）**: 10%

**改善のヒント**:

- 外部APIはStub
- RepositoryはFake
- 振る舞い検証が必要な場合のみMock
- 過度なMockを避ける

---

### 5. 重複テストコード率（Duplicate Test Code）

**定義**: 重複したテストコードの割合

**測定方法**:

```bash
# jscpd で測定
npx jscpd tests/ --min-tokens 30 --format "json"
```

**目標値**:

- **全体**: 10%以下
- **重複ブロック**: 30トークン以上を検出対象

**改善のヒント**:

- 共通のSetupをbeforeEach/beforeAllに抽出
- Test Data Builderで重複を削減
- ヘルパー関数を作成

---

## テスト信頼性メトリクス

### 1. 失敗テスト数（Failed Test Count）

**定義**: 現在失敗しているテストの数

**測定方法**:

```bash
# CI/CD ログで確認
# テスト結果レポートで追跡
```

**目標値**:

- **理想**: 0個
- **CI/CDパイプライン**: 失敗テストがあればビルド失敗

**改善のヒント**:

- 失敗テストを最優先で修正
- フレーキーテストと区別
- 失敗原因を分析（実装バグ or テストバグ）

---

### 2. 実装変更での破壊率（Test Breakage Rate）

**定義**: 実装コード変更時にテストが壊れる割合

**測定方法**:

```bash
# Git ログで追跡
# PR でのテスト修正数をモニタリング
git log --grep="fix test" --oneline | wc -l
```

**目標値**:

- **理想**: 10%以下
- **過度なMock使用**: 50%以上（要改善）

**改善のヒント**:

- Mock を減らし、Fake を増やす
- テストを実装の詳細に依存させない
- 振る舞いベースのテスト（What）、実装ベースのテスト（How）を避ける

---

### 3. 型安全性（Type Safety in Tests）

**定義**: テストコードでの `any` 使用率

**測定方法**:

```bash
# ESLint で any を検出
npx eslint tests/ --rule "@typescript-eslint/no-explicit-any: error"

# grep で any の使用箇所を検索
grep -r ": any" tests/ | wc -l
```

**目標値**:

- **理想**: 5%以下
- **許容**: 10%以下
- **外部ライブラリの型定義不足**: 例外として許容

**改善のヒント**:

- Partial<T>、Pick<T, K> を活用
- テスト専用型定義を作成
- Builder パターンで型安全性を確保

---

### 4. テスト名の明確性（Test Name Clarity）

**定義**: テスト名がテスト内容を明確に表している割合

**測定方法**:

```bash
# コードレビューで手動チェック
# テスト名の長さ、具体性を評価
```

**目標値**:

- **具体的なテスト名**: 80%以上
- **"should"、"正しく"などの曖昧な表現**: 20%以下

**改善のヒント**:

- "Given-When-Then" 形式で記述
- 具体的な入力値と期待値を含める
- 悪い例: "test user creation"
- 良い例: "新規ユーザー登録時にIDが自動採番される"

---

### 5. テスト保守コスト（Test Maintenance Cost）

**定義**: テスト修正にかかる時間と工数

**測定方法**:

```bash
# Git ログでテスト修正のコミット数を追跡
git log --grep="test" --oneline --since="1 month ago" | wc -l

# PR レビュー時間をモニタリング
```

**目標値**:

- **テスト修正時間**: 実装修正時間の20%以下
- **月あたりのテスト修正コミット**: 全体の10%以下

**改善のヒント**:

- 脆弱なテスト（Mock過多）を改善
- Test Builder で保守性向上
- テストコードのリファクタリングを定期的に実施

---

## 測定方法とツール

### 推奨ツール

#### カバレッジ測定

```bash
# Jest（最も一般的）
npm install --save-dev jest @types/jest
npm test -- --coverage

# Vitest（高速）
npm install --save-dev vitest @vitest/ui
vitest --coverage

# Istanbul/nyc
npm install --save-dev nyc
nyc npm test
```

#### ミューテーションテスト

```bash
# Stryker（TypeScript/JavaScript）
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
npx stryker run

# Stryker の設定例
{
  "mutate": ["src/**/*.ts", "!src/**/*.spec.ts"],
  "testRunner": "jest",
  "coverageAnalysis": "perTest"
}
```

#### コード重複検出

```bash
# jscpd
npm install --save-dev jscpd
npx jscpd tests/ --min-tokens 30
```

#### 静的解析

```bash
# ESLint（テスト専用ルール）
npm install --save-dev eslint @typescript-eslint/parser
npx eslint tests/ --rule "@typescript-eslint/no-explicit-any: error"
```

### CI/CD 統合

```yaml
# GitHub Actions 例
name: Test Quality
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests with coverage
        run: npm test -- --coverage
      - name: Check coverage threshold
        run: |
          npx jest --coverage --coverageThreshold='{"global":{"lines":80,"branches":75}}'
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v2
```

---

## 目標設定のガイドライン

### 初期段階（プロジェクト開始〜3ヶ月）

**優先指標**:

- 行カバレッジ: 70%以上
- 分岐カバレッジ: 65%以上
- テスト実行時間: 5分以内
- 失敗テスト数: 0個

**改善アプローチ**: 重要なビジネスロジックから優先的にカバー

---

### 成長段階（3ヶ月〜1年）

**優先指標**:

- 行カバレッジ: 80%以上
- 分岐カバレッジ: 75%以上
- ミューテーションスコア: 60%以上
- AAA構造準拠率: 70%以上
- Test Builder使用率: 30%以上（複雑なケース）

**改善アプローチ**: テスト品質とパフォーマンスのバランス

---

### 成熟段階（1年以上）

**優先指標**:

- 行カバレッジ: 85%以上
- 分岐カバレッジ: 80%以上
- ミューテーションスコア: 70%以上
- テスト実行時間: 2分以内（並列化）
- 実装変更での破壊率: 10%以下
- any 使用率: 5%以下

**改善アプローチ**: 継続的改善サイクルの確立、自動化

---

## 継続的改善サイクル

### 週次チェック

- 失敗テスト数
- カバレッジの変化
- テスト実行時間

### 月次レビュー

- ミューテーションスコア
- AAA構造準拠率
- Test Builder使用率
- 実装変更での破壊率

### 四半期評価

- 全メトリクスの総合評価
- 目標値の見直し
- チームスキル向上計画の策定
- テストレビュー基準の更新

---

## まとめ

テスト品質メトリクスの活用原則：

1. **カバレッジは手段、品質向上が目的**: 数値だけを追わない
2. **段階的な目標設定**: 現状から20-30%改善を目指す
3. **バランスを取る**: カバレッジ、速度、保守性のバランス
4. **継続的な測定**: 週次・月次・四半期でモニタリング
5. **チーム全体で共有**: メトリクスを可視化し、改善を促進

これらのメトリクスを活用して、テストコードの品質を継続的に向上させてください。
