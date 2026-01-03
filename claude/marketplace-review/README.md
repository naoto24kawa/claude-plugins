# marketplace-review

`.claude-plugin/marketplace.json` の構造を検証し、すべての参照ファイルパスの存在を確認するスキルです。

## 概要

このスキルは、Claude Code マーケットプレース定義ファイル（`.claude-plugin/marketplace.json`）を検証し、JSON 構造、必須フィールド、命名規則、バージョン形式、ファイルパスの存在を包括的にチェックします。マーケットプレース公開前の品質保証に最適です。

## インストール

### 前提条件

Claude Code CLI がインストールされている必要があります。

### マーケットプレースの追加

```bash
/plugin marketplace add naoto24kawa/claude-plugins
```

### プラグインのインストール

```bash
/plugin install claude@naoto24kawa-claude-plugins
```

## 主な機能

- **JSON 構造検証**: 有効な JSON 構文と適切な構造の確認
- **必須フィールドチェック**: `name`、`owner`、`plugins` の存在確認
- **命名規則検証**: ケバブケース形式の確認
- **バージョン形式検証**: セマンティックバージョニング（e.g., "0.1.0"）の確認
- **ファイルパス存在確認**: すべての参照パスが実際のファイル/ディレクトリに対応していることを確認

## 使用タイミング

このスキルは以下のような場合に使用します：

- `.claude-plugin/marketplace.json` を作成または更新する時
- 新しいプラグイン、スキル、エージェントをマーケットプレースに追加する時
- マーケットプレース設定を公開前にレビューする時
- プラグインインストール問題をトラブルシューティングする時
- marketplace.json のすべてのパスが実際のファイルと一致することを確認する時

## ファイル構成

```
claude/marketplace-review/
├── README.md                        # このファイル
├── SKILL.md                         # メインスキル定義
└── scripts/
    └── validate_marketplace.py     # Python 検証スクリプト
```

## 使い方

### 基本的な使用方法

1. **スキルの呼び出し**
   ```
   「marketplace-review スキルを使って設定を検証してください」
   ```

2. **検証の実行**
   スキルは自動的に以下を実行します：
   ```bash
   python3 scripts/validate_marketplace.py .claude-plugin/marketplace.json
   ```

3. **検証結果の確認**
   - ✅ **PASSED** - すべてのチェックが成功
   - ⚠️ **Warnings** - 非クリティカルな問題（推奨される改善）
   - ❌ **Errors** - クリティカルな問題（修正必須）

### 検証される項目

#### トップレベル構造

- `name` (必須) - マーケットプレース識別子（ケバブケース）
- `owner` (必須) - `name` とオプションで `email` を含むオブジェクト
- `plugins` (必須) - プラグイン定義の配列

#### 各プラグインエントリ

**必須フィールド:**
- `name` - プラグイン識別子（ケバブケース）
- `source` - プラグインソースの場所

**オプションフィールド:**
- `description` - プラグインの説明
- `version` - セマンティックバージョン（e.g., "0.1.0"）
- `agents` - エージェントファイルパスの配列
- `skills` - スキルディレクトリパスの配列
- `mcpServers` - MCP サーバー設定パス

#### パス検証

**エージェントパス** (`agents` 配列):
- 文字列の配列である必要がある
- 各パスは既存の `.md` ファイルを指す必要がある
- 例: `"./review/ts-code-review/agents/review-srp-reviewer.md"`

**スキルパス** (`skills` 配列):
- 文字列の配列である必要がある
- 各パスは既存のディレクトリを指す必要がある
- ディレクトリには `SKILL.md` ファイルが含まれている必要がある
- 例: `"./review/ts-code-review"`

**MCP サーバーパス** (`mcpServers`):
- 文字列である必要がある
- 既存の `.json` ファイルを指す必要がある
- 例: `"./test/test-with-playwright/.mcp.json"`

## 検証プロセス

### Step 1: マーケットプレースファイルの検索

リポジトリルートの `.claude-plugin/marketplace.json` を検索します。

**検証**: マーケットプレース JSON ファイルが予想される場所に存在することを確認

**エラー時**:
- リポジトリルートディレクトリにいるか確認
- `.claude-plugin/` ディレクトリが存在するか確認
- ファイルが存在しない場合は作成が必要

### Step 2: 検証スクリプトの実行

検証スクリプトを実行：

```bash
python3 scripts/validate_marketplace.py .claude-plugin/marketplace.json
```

スクリプトは以下をチェック：
1. JSON 構文の有効性
2. 必須フィールドの存在
3. 命名規則（ケバブケース）
4. バージョン形式（セマンティックバージョニング）
5. すべての参照パスの存在

**検証**: スクリプトがエラーなく開始し、実行を完了することを確認

**エラー時**:
- Python 3 がインストールされているか確認（`python3 --version`）
- スキルディレクトリに対するスクリプトパスが正しいか確認
- ファイルのアクセス権限がスクリプト実行を許可しているか確認

### Step 3: 結果のレビュー

検証ツールは以下を出力：
- ✅ **PASSED** - すべてのチェックが成功
- ⚠️ **Warnings** - 非クリティカルな問題（推奨される改善）
- ❌ **Errors** - クリティカルな問題（修正必須）

**検証**: すべての報告されたエラーと警告を理解する

**次のステップ**: エラーが存在する場合は Step 4 に進む；警告のみまたは成功の場合は警告への対応を検討

### Step 4: 問題の修正

各エラーまたは警告に対して、スクリプトは以下を提供：
- 問題の明確な説明
- 予想されるファイルパスの場所
- 問題を引き起こしている特定のプラグインまたはフィールド

**検証**: 各問題を修正した後、検証スクリプトを再実行して解決を確認

## 一般的な問題と解決策

### 問題: "Agent file not found"

**原因:** `agents` 配列内のパスが実際のファイルの場所と一致しない

**解決策:**
1. リポジトリ内の実際のファイルパスを確認
2. marketplace.json のパスを一致するように更新
3. 相対パスには `./` プレフィックスを使用することを確認

### 問題: "Missing SKILL.md in skill directory"

**原因:** スキルディレクトリは存在するが、必須の SKILL.md ファイルがない

**解決策:**
1. スキルディレクトリに SKILL.md を作成
2. `name` と `description` を含む必須の YAML frontmatter を含める

### 問題: "MCP server file not found"

**原因:** mcpServers パスが既存の .mcp.json ファイルを指していない

**解決策:**
1. 指定されたパスに .mcp.json が存在することを確認
2. 必要に応じて marketplace.json のパスを更新
3. 存在しない場合は .mcp.json を作成

### 問題: "Name should be in kebab-case"

**原因:** プラグインまたはマーケットプレース名が不正な形式を使用している

**解決策:**
- 小文字とハイフンを使用: `my-plugin-name`
- 避ける: camelCase、snake_case、スペース

## ワークフロー例

新しいプラグインを marketplace.json に追加する時：

1. name、description、version、source でプラグインエントリを追加
2. 各エージェントマークダウンファイルのパスを `agents` 配列に追加
3. 各スキルディレクトリのパスを `skills` 配列に追加
4. プラグインが MCP 設定を含む場合は `mcpServers` パスを追加
5. 検証スクリプトを実行: `python3 scripts/validate_marketplace.py .claude-plugin/marketplace.json`
6. 報告されたエラーを修正
7. ベストプラクティスのための警告に対応
8. 検証が成功したら変更をコミット

## デフォルト動作

特にユーザーが指定しない限り、以下のデフォルト設定を使用：

### スクリプト実行
- **スクリプトパス**: `scripts/validate_marketplace.py`（スキルディレクトリからの相対パス）
- **ターゲットファイル**: `.claude-plugin/marketplace.json`（リポジトリルート）
- **作業ディレクトリ**: リポジトリルートディレクトリ
- **Python バージョン**: Python 3（任意のバージョン）

### 出力形式
- **成功**: ✅ マークと "Validation PASSED" メッセージ
- **警告**: ⚠️ マークと警告メッセージのリスト
- **エラー**: ❌ マークとエラーメッセージのリスト
- **詳細レベル**: ファイルパスと特定の問題を含む完全な詳細レポート

### 終了コード
- **0**: 検証成功（エラーなし、警告は許可）
- **1**: 検証失敗（1つ以上のエラーが見つかった）

## リソース

### scripts/validate_marketplace.py

marketplace.json の構造とファイルパスの包括的なチェックを実行する Python 検証スクリプト。コンテキストにロードせずに直接実行できます。

**使用方法:**
```bash
python3 scripts/validate_marketplace.py <path-to-marketplace.json>
```

**出力:**
- 詳細な検証レポート
- エラーと警告のリスト
- 成功の場合は終了コード 0、失敗の場合は 1

## 注意事項

1. **ファイルの場所**: `.claude-plugin/marketplace.json` はリポジトリルートに配置
2. **パス形式**: 相対パスは `./` から始める形式を使用
3. **命名規則**: すべての名前はケバブケース形式
4. **バージョン管理**: marketplace.json の変更はバージョン番号の更新を伴う
5. **Python 依存**: 検証スクリプトは Python 3 を必要とします

## 関連リンク

- [SKILL.md](./SKILL.md) - 実行フローと詳細な検証プロセス
- [scripts/validate_marketplace.py](./scripts/validate_marketplace.py) - Python 検証スクリプト

---

このスキルにより、マーケットプレース定義の品質を客観的に評価し、プラグイン公開前の問題を未然に防ぐことができます。
