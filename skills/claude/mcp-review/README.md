# mcp-review

MCP (Model Context Protocol) サーバー設定（.mcp.json）をベストプラクティスに照らして検証し、セキュリティとスコープ管理を評価するスキルです。

## 概要

このスキルは、MCP サーバー設定を7つの観点から評価し、セキュリティリスク、スコープ管理の適切性、環境変数の使用方法、トランスポートタイプの適切性、一般的な落とし穴を特定します。新しい設定の作成支援と既存設定のレビューの両方をサポートします。

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

### 7つの検証観点

1. **ファイル構造**: 有効な JSON、適切な mcpServers オブジェクト、正しいスキーマ
2. **セキュリティ**: ハードコードされたシークレットなし、適切な環境変数使用、安全なヘッダー
3. **スコープ管理**: 適切なスコープ選択（local/project/user）
4. **トランスポートタイプ**: ユースケースに応じた正しいトランスポート（stdio/http/sse）
5. **サーバー設定**: command/args の有効性、URL 形式、ヘッダー
6. **環境変数**: 適切な `${VAR}` 構文、フォールバック値 `${VAR:-default}`
7. **一般的な落とし穴**: Windows cmd /c ラッパー、実行可能パス、OAuth セットアップ

### 設定作成支援

新しい MCP 設定を作成する際のガイドを提供：

- **サーバータイプの決定**: クラウドサービス（http）かローカルプロセス（stdio）か
- **スコープの選択**: project（チーム共同作業）、local（個人設定）、user（プロジェクト横断）
- **設定の生成**: 適切な構造での .mcp.json 作成
- **セットアップ手順の文書化**: 必須環境変数、インストールコマンド、認証ステップ

## 使用タイミング

このスキルは以下のような場合に使用します：

- 既存の .mcp.json 設定をレビューする時
- 新しい MCP サーバー設定を作成する時
- MCP 接続または認証の問題をトラブルシューティングする時
- セキュリティベストプラクティスに従っているか確認する時
- 環境変数の使用方法を検証する時
- トランスポートタイプの適切性をチェックする時

## ファイル構成

```
skills/claude/mcp-review/
├── README.md                      # このファイル
├── SKILL.md                       # メインスキル定義
└── references/                    # 詳細リファレンス
    ├── best-practices.md         # MCP 設定のベストプラクティス
    ├── security-checklist.md     # セキュリティ評価基準
    ├── common-pitfalls.md        # 既知の問題と解決策
    └── report-template.md        # 検証レポート構造
```

## 使い方

### 基本的な使用方法

1. **スキルの呼び出し**
   ```
   「mcp-review スキルを使って設定を検証してください」
   ```

2. **設定ファイルの検索**
   スキルは以下の場所を検索します：
   - プロジェクトルート: `./.mcp.json`
   - スキルディレクトリ: `./skills/*/.mcp.json`
   - ネスト構造: `./skills/*/**/.mcp.json`

3. **検証結果の確認**
   優先度別の発見事項：
   - 🔴 **Critical**: セキュリティ問題、無効な設定
   - 🟠 **High**: トランスポートタイプの問題、必須要件の欠落
   - 🟡 **Medium**: ベストプラクティスの改善
   - 🟢 **Low**: オプションの最適化

### 検証プロセス

#### Step 1: 設定ファイルの検索

プロジェクト内の MCP 設定ファイルを検索します。

**検証**: 少なくとも1つの .mcp.json ファイルが存在することを確認

**エラー時**:
- ファイルが見つからない場合、新しい設定の作成を提案
- 複数のファイルが見つかった場合、どれをレビューするか質問するか、すべてをレビュー

#### Step 2: 構造の解析と検証

JSON 設定をロードして解析：

1. 有効な JSON 構文の確認
2. 必須の `mcpServers` オブジェクトの確認
3. サーバーエントリ構造の検証
4. トランスポート固有の要件の確認

**検証**: JSON が有効で MCP スキーマに従っていることを確認

**エラー時**:
- 行番号付きの JSON 構文エラーを報告
- 欠落している必須フィールドを特定
- 不明または非推奨のフィールドにフラグを立てる

#### Step 3: セキュリティレビュー

`references/security-checklist.md` のチェックリストを使用してセキュリティ側面を評価：

**クリティカルチェック**:
- ✅ ハードコードされた API キーやトークンなし
- ✅ シークレットは環境変数を使用（`${VAR}` 構文）
- ✅ OAuth トークンが設定内にない
- ✅ セキュアヘッダーが適切にフォーマットされている
- ✅ URL は適切な場所で HTTPS を使用

**検証**: すべての機密データが環境変数を使用

**エラー時**:
- ハードコードされたシークレットを CRITICAL としてフラグ
- 環境変数の代替案を提案
- 適切なシークレット管理を推奨

#### Step 4: トランスポート設定の検証

トランスポートタイプの適切性をチェック：

**stdio（ローカルプロセス）**:
- 用途: ローカルスクリプト、npx パッケージ、uvx パッケージ
- コマンドは実行可能である必要がある（node、python、npx、uvx など）
- args 配列が適切にフォーマットされている
- Windows: 必要に応じて cmd /c ラッパーをチェック

**http（クラウドサービス）**:
- 用途: リモート API、クラウド MCP サーバー
- URL は有効な HTTPS エンドポイントである必要がある
- ヘッダーが適切に設定されている
- 必要に応じて OAuth セットアップ

**sse（非推奨）**:
- 警告でフラグ: HTTP トランスポートが推奨
- 可能であれば移行ガイダンスを提供

**検証**: トランスポートタイプがユースケースと一致

**エラー時**:
- sse の非推奨について警告
- sse サーバー用の http 代替案を提案
- stdio のコマンド実行可能性を検証

#### Step 5: 環境変数のレビュー

環境変数の使用方法をチェック：

1. 適切な構文の確認: `${VAR}` または `${VAR:-default}`
2. 必須環境変数の文書化
3. 適切なデフォルト値の確認
4. 以下での変数参照の検証：
   - サーバー URL
   - コマンド引数
   - ヘッダー

**検証**: すべての変数が正しい構文を使用し、ドキュメント化されている

**エラー時**:
- 不正な変数構文にフラグを立てる
- 適切な場所にデフォルトの追加を推奨
- 必須環境変数のリストを作成

#### Step 6: 一般的な落とし穴のチェック

`references/common-pitfalls.md` の既知の問題に対して設定をレビュー：

- **Windows 互換性**: npx 用の cmd /c ラッパー
- **実行可能パス**: フルパス vs. PATH 解決
- **OAuth セットアップ**: 認証ステップの欠落
- **スコープの競合**: プロジェクト設定が承認されていない
- **出力制限**: 大きなデータ処理の考慮事項

**検証**: 設定が一般的なミスを回避

**エラー時**:
- 検出された各落とし穴に対する具体的な修正を提供
- 関連ドキュメントへのリンク
- 予防策を提案

#### Step 7: 検証レポートの生成

`references/report-template.md` のテンプレートを使用して包括的なレポートを作成：

**レポート構造**:
1. **概要**: 設定サマリー、スコープ、サーバー数
2. **優先度別の発見事項**: Critical / High / Medium / Low
3. **セキュリティ評価**: 詳細なセキュリティ評価
4. **設定の推奨事項**: 具体的な改善
5. **環境変数**: 必須変数リスト
6. **次のステップ**: 優先順位付きのアクションアイテム

## 一般的なパターン

### セキュリティ: シークレット管理

**❌ 避けるべき - ハードコードされたシークレット:**
```json
{
  "mcpServers": {
    "api": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer sk_live_abc123xyz789"
      }
    }
  }
}
```

**✅ 推奨 - 環境変数:**
```json
{
  "mcpServers": {
    "api": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

### スコープ: Project vs Local

**❌ 避けるべき - プロジェクトスコープの個人認証情報:**
```json
// .mcp.json (バージョン管理される)
{
  "mcpServers": {
    "personal-api": {
      "headers": {
        "Authorization": "Bearer ${MY_PERSONAL_KEY}"
      }
    }
  }
}
```

**✅ 推奨 - 個人認証情報にはローカルスコープを使用:**
```bash
# ローカルスコープに追加
claude mcp add --transport http personal-api --scope local \
  --env MY_PERSONAL_KEY=actual_key \
  https://api.example.com/mcp
```

## トランスポートタイプの選択

### stdio (ローカルプロセス)

**用途**: ローカルスクリプト、npx パッケージ、Python ツール

**設定例**:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx",
      "args": ["-y", "package-name@latest"]
    }
  }
}
```

### http (クラウドサービス)

**用途**: リモート API、クラウド MCP サーバー

**設定例**:
```json
{
  "mcpServers": {
    "server-name": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

## スコープの選択ガイド

- **project**: チーム共同作業、バージョン管理される設定、共有ツール
- **local**: 個人設定、シークレット、個人的なカスタマイズ
- **user**: プロジェクト横断ツール、ユーザー全体で使用するツール

## 重要な注意事項

- **セキュリティ優先**: ハードコードされたシークレットを含む .mcp.json を決してコミットしない
- **スコープの認識**: プロジェクトスコープはチームの承認が必要；シークレットにはローカルを使用
- **環境変数**: 機密データには常に `${VAR}` 構文を使用
- **Windows 互換性**: ネイティブ Windows では npx に cmd /c を追加
- **OAuth セットアップ**: Claude Code で認証のために /mcp コマンドが必要
- **テスト**: 設定後は /mcp コマンドでサーバー接続を検証
- **ドキュメント**: 詳細なガイダンスは references/best-practices.md を参照

## リソース

このスキルには包括的な検証のための参照ドキュメントが含まれています：

### references/

- **best-practices.md**: MCP 設定のベストプラクティスとパターン
- **security-checklist.md**: セキュリティ評価基準
- **common-pitfalls.md**: 既知の問題と解決策
- **report-template.md**: 検証レポート構造

検証中に必要に応じてこれらの参照をロードして、徹底的な評価と正確な推奨事項を確保します。

## 関連リンク

- [SKILL.md](./SKILL.md) - 実行フローと詳細な検証プロセス
- [references/best-practices.md](./references/best-practices.md) - ベストプラクティスガイド
- [references/security-checklist.md](./references/security-checklist.md) - セキュリティチェックリスト
- [references/common-pitfalls.md](./references/common-pitfalls.md) - 一般的な問題と解決策
- [references/report-template.md](./references/report-template.md) - レポートテンプレート

---

このスキルにより、MCP サーバー設定の品質を客観的に評価し、安全で効率的な外部サービス統合を実現できます。
