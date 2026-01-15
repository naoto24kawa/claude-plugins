# MCP Review Criteria

## Official Documentation

| 種類 | URL |
|------|-----|
| 仕様 & ベストプラクティス | https://docs.anthropic.com/en/docs/claude-code/mcp |

## WebSearch Keywords

```
Claude Code MCP Model Context Protocol configuration best practices site:docs.anthropic.com OR site:code.claude.com
```

## File Search Patterns

- `./.mcp.json` (プロジェクトルート)
- `**/.mcp.json` (ネストされた構造)

## Evaluation Dimensions

### 1. File Structure

**評価観点**:
- 有効なJSON構文
- 必須の `mcpServers` オブジェクト
- 正しいスキーマ

**チェックリスト**:
- [ ] 有効なJSON構文
- [ ] `mcpServers` オブジェクトが存在
- [ ] 各サーバーエントリが正しい構造
- [ ] トランスポート固有の要件を満たす

### 2. Security

**評価観点**:
- ハードコードされたシークレットなし
- 環境変数の適切な使用
- セキュアなヘッダー

**チェックリスト**:
- [ ] ハードコードされたAPIキーやトークンなし
- [ ] シークレットは環境変数 (`${VAR}`) を使用
- [ ] OAuth トークンは設定に含まない
- [ ] ヘッダーが適切にフォーマット
- [ ] 適切な場所でHTTPSを使用

**Bad Example**:
```json
{
  "mcpServers": {
    "api": {
      "type": "http",
      "headers": {
        "Authorization": "Bearer sk_live_abc123xyz789"
      }
    }
  }
}
```

**Good Example**:
```json
{
  "mcpServers": {
    "api": {
      "type": "http",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    }
  }
}
```

### 3. Scope Management

**評価観点**:
- 適切なスコープ選択 (local/project/user)

**推奨スコープ**:

| ユースケース | 推奨スコープ |
|-------------|-------------|
| チームコラボレーション | project (バージョン管理) |
| 個人設定・シークレット | local |
| プロジェクト横断ツール | user |

**チェックリスト**:
- [ ] 個人認証情報がprojectスコープにない
- [ ] チーム共有設定がバージョン管理されている
- [ ] シークレットはlocalスコープ

### 4. Transport Type

**評価観点**:
- 使用ケースに適したトランスポート

**Transport Types**:

| Type | 用途 | 要件 |
|------|------|------|
| stdio | ローカルプロセス (npx, uvx) | command, args |
| http | クラウドサービス・リモートAPI | url, headers |
| sse | (非推奨) | httpへの移行推奨 |

**チェックリスト**:
- [ ] stdio: コマンドが実行可能 (node, python, npx, uvx等)
- [ ] stdio: args配列が適切にフォーマット
- [ ] stdio: Windowsの場合 cmd /c ラッパーを検討
- [ ] http: 有効なHTTPSエンドポイント
- [ ] http: ヘッダーが適切に設定
- [ ] sse使用の場合は警告

### 5. Server Configuration

**評価観点**:
- コマンド/引数の妥当性
- URL形式
- ヘッダー設定

**stdio Server Example**:
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

**http Server Example**:
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

### 6. Environment Variables

**評価観点**:
- 正しい構文 (`${VAR}` または `${VAR:-default}`)
- ドキュメント化

**チェックリスト**:
- [ ] `${VAR}` または `${VAR:-default}` 構文を使用
- [ ] 必要な環境変数がドキュメント化
- [ ] 適切なデフォルト値
- [ ] URL、引数、ヘッダー内の変数参照が正しい

### 7. Common Pitfalls

**評価観点**:
- 既知の問題を回避

**チェックリスト**:
- [ ] Windows: npxに cmd /c ラッパー
- [ ] 実行可能パス: フルパス vs PATH解決
- [ ] OAuth: 認証ステップの設定
- [ ] スコープ競合: プロジェクト設定の承認
- [ ] 出力制限: 大量データ処理の考慮

## Output Format

```markdown
## MCP Configuration Review

**File**: {file_path}
**Overall Assessment**: {A-F}

### Overview
- サーバー数: {count}
- スコープ: {scope}
- トランスポートタイプ: {types}

### Findings by Priority

#### 🔴 Critical
- {security issues, invalid configuration}

#### 🟠 High
- {transport issues, missing requirements}

#### 🟡 Medium
- {best practice improvements}

#### 🟢 Low
- {optional optimizations}

### Security Assessment
{detailed security evaluation}

### Environment Variables
| 変数 | 用途 | 必須 |
|------|------|------|
| {VAR} | {purpose} | {yes/no} |

### Recommendations
1. {prioritized action items}
```

## Common Issues

### Critical
- ハードコードされたシークレット
- 無効なJSON構文

### High
- 非推奨のsseトランスポート
- 環境変数構文エラー

### Medium
- 不適切なスコープ選択
- デフォルト値の欠如

### Low
- ドキュメントの不足
- 最適でない設定パターン
