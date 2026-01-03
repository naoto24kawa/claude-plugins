# スラッシュコマンドのベストプラクティス

## ファイル構造

### スコープ

**プロジェクトコマンド**: `.claude/commands/`
- リポジトリに保存され、チームと共有される
- プロジェクト固有のワークフローに使用
- バージョン管理下に置く

**個人用コマンド**: `~/.claude/commands/`
- すべてのプロジェクトで利用可能
- 個人的な作業スタイルや頻繁に使用するプロンプトに使用

### 名前空間

サブディレクトリで整理:
- `.claude/commands/frontend/component.md` → `/frontend/component`
- `.claude/commands/backend/api.md` → `/backend/api`

## フロントマター

### 必須フィールド

なし（すべてオプション）

### 推奨フィールド

#### `description`
- コマンドの簡潔な説明
- `/help`コマンドで表示される
- ユーザーがコマンドの目的を理解できるようにする

```yaml
---
description: "Create a new React component with TypeScript and tests"
---
```

#### `argument-hint`
- 予想される引数パターンを示す
- ユーザーに正しい使用方法を伝える

```yaml
---
argument-hint: "<component-name> [--functional|--class]"
---
```

### 高度なフィールド

#### `allowed-tools`
- 使用可能なツールを制限
- セキュリティと予測可能性の向上

```yaml
---
allowed-tools: [Read, Write, Edit, Bash]
---
```

#### `model`
- 特定モデルを選択
- `haiku` - 高速で低コスト、単純なタスク向け
- `sonnet` - バランスが良い（デフォルト）
- `opus` - 最高品質、複雑なタスク向け

```yaml
---
model: haiku
---
```

#### `disable-model-invocation`
- AIによる自動呼び出しを防止
- ユーザーが明示的に呼び出す必要がある

```yaml
---
disable-model-invocation: true
---
```

## 動的機能

### 引数処理

#### `$ARGUMENTS`
- すべての引数を1つの文字列としてキャプチャ

```markdown
Create a component named: $ARGUMENTS
```

使用例: `/component MyButton primary` → "MyButton primary"

#### 位置パラメータ (`$1`, `$2`, ...)
- 個別の引数にアクセス

```markdown
Component name: $1
Type: $2
```

使用例: `/component MyButton primary` → 名前="MyButton", タイプ="primary"

### Bash統合 (`!`プレフィックス)

- 実行前にコマンドを実行
- 出力はコンテキストに含まれる

```markdown
Current git status:
!git status

Please help me commit these changes.
```

**使用上の注意**:
- コマンドが失敗する可能性を考慮
- 長時間実行されるコマンドは避ける
- セキュリティリスクを評価

### ファイル参照 (`@`プレフィックス)

- ファイルコンテンツをコンテキストに含める

```markdown
Review this configuration:
@.eslintrc.json

Suggest improvements.
```

**使用上の注意**:
- 大きなファイルはコンテキストウィンドウを消費
- バイナリファイルは避ける
- 相対パスまたは絶対パスを使用

## スラッシュコマンド vs スキル

### スラッシュコマンドが適している場合

- シンプルなプロンプトの再利用
- 単一ファイルで完結
- 引数の簡単な置換
- プロジェクト固有の定型作業

### スキルが適している場合

- 複雑な多段階ワークフロー
- 複数のファイルやスクリプトが必要
- 自動検出とトリガーが望ましい
- ドメイン固有の知識が必要

## セキュリティのベストプラクティス

### コマンドインジェクション

**悪い例**:
```markdown
!rm -rf $1
```

ユーザーが`/cleanup ../important-dir`を実行すると危険

**良い例**:
```markdown
!rm -rf ./temp/$1
```

または引数をバリデーション:
```markdown
Delete directory: $1 (must be within ./temp/)
Ensure the path is safe before proceeding.
```

### ファイルアクセス

**悪い例**:
```markdown
@$1
```

任意のファイルを読み取れる可能性

**良い例**:
```markdown
@./configs/$1
```

特定ディレクトリに制限

### `allowed-tools`の活用

機密操作には制限を設定:

```yaml
---
allowed-tools: [Read, Grep]  # 読み取りのみ
---
```

## コマンド設計のガイドライン

### 明確性

- 目的が一目でわかる名前
- 詳細な`description`
- `argument-hint`で使用方法を示す

### 一貫性

- チーム内で命名規則を統一
- 引数の順序と形式を一貫させる
- 出力フォーマットを標準化

### シンプルさ

- 1つのコマンドは1つのことを行う
- 複雑な場合は複数コマンドに分割
- 非常に複雑な場合はスキルを検討

### ドキュメント

- コマンド内にコメントを含める
- 期待される入力と出力を明記
- エッジケースや制限事項を記載

## 良い例

### シンプルなコンポーネント生成

```markdown
---
description: "Create a new React component with TypeScript"
argument-hint: "<component-name>"
---

Create a new React component with the following specifications:

Component name: $1
Location: src/components/$1/

Include:
- TypeScript interface for props
- Functional component with proper typing
- CSS module
- Basic test file

Follow the existing project patterns.
```

### ドキュメント付きAPI作成

```markdown
---
description: "Generate API endpoint with OpenAPI spec"
argument-hint: "<endpoint-path> <method>"
model: sonnet
---

Current API documentation:
@./docs/api-spec.yaml

Create a new API endpoint:
- Path: $1
- Method: $2

Include:
1. Express route handler
2. Request/response validation
3. OpenAPI spec update
4. Integration test

Ensure consistency with existing endpoints.
```

### Git操作の自動化

```markdown
---
description: "Create feature branch with ticket number"
argument-hint: "<ticket-number>"
allowed-tools: [Bash]
---

Current branch:
!git branch --show-current

Create and checkout a new feature branch:
- Branch name format: feature/$1-description
- Based on: main

Ensure the branch doesn't already exist.
```
