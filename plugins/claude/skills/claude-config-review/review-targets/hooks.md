# Hooks Review Criteria

## Official Documentation

| 種類 | URL |
|------|-----|
| 仕様 & ベストプラクティス | https://docs.anthropic.com/en/docs/claude-code/hooks |

## WebSearch Keywords

```
Claude Code hooks configuration best practices site:docs.anthropic.com OR site:code.claude.com
```

## File Search Patterns

- `~/.claude/settings.json` (ユーザーワイド)
- `.claude/settings.json` (プロジェクト固有)
- `.claude/settings.local.json` (ローカルオーバーライド)

## Hook Events

| Event | トリガータイミング | 用途 |
|-------|------------------|------|
| `PreToolUse` | ツール実行前 | 検証、セキュリティチェック、フォーマット |
| `PostToolUse` | ツール実行後 | 検証、通知、クリーンアップ |
| `UserPromptSubmit` | ユーザー入力送信時 | 入力検証、ログ |
| `Stop` | メインエージェント停止時 | 分析、クリーンアップ |
| `SubagentStop` | サブエージェント停止時 | タスク完了追跡 |
| `SessionStart` | セッション開始時 | 初期化、環境設定 |
| `SessionEnd` | セッション終了時 | クリーンアップ、レポート |
| `Notification` | 通知送信時 | カスタム統合 |
| `PreCompact` | コンテキスト圧縮前 | 状態保存 |

## Evaluation Dimensions

### 1. Security

**評価観点**:
- コマンドインジェクション防止
- 変数の適切なクォート
- シークレット保護

**チェックリスト**:
- [ ] JSON入力構造の検証
- [ ] 絶対パスの使用 (PATH依存なし)
- [ ] シェル変数のクォート (`"$VARIABLE"`)
- [ ] `.env` ファイルや認証情報のコミットなし
- [ ] 最小限の権限
- [ ] タイムアウトの設定

**Security Principles**:
1. **入力を信頼しない** - 常にJSON入力構造を検証
2. **絶対パス使用** - PATH依存のスクリプト参照を避ける
3. **変数クォート** - インジェクション防止: `"$VARIABLE"` not `$VARIABLE`
4. **シークレット保護** - `.env`ファイルや認証情報をコミットしない
5. **権限制限** - 最小限の必要なアクセス権
6. **タイムアウト設定** - 無期限ハングを防止 (デフォルト: 60秒)

### 2. Performance

**評価観点**:
- 適切なタイムアウト値
- 効率的な処理パターン

**チェックリスト**:
- [ ] タイムアウト設定あり
- [ ] タイムアウトが短すぎない (>1000ms)
- [ ] タイムアウトが長すぎない (<600000ms)
- [ ] 重い処理の最適化

**Timeout Guidelines**:

| 処理タイプ | 推奨タイムアウト |
|-----------|-----------------|
| 高速チェック | 1000-5000ms |
| 中程度の操作 | 5000-30000ms |
| 重い処理 | 30000-120000ms |

### 3. Correctness

**評価観点**:
- 正しい終了コード
- 適切なJSON出力

**Exit Codes**:

| コード | 意味 | 動作 |
|--------|------|------|
| 0 | 承認 | アクションを許可、stdoutをユーザーに表示 |
| 2 | ブロック | アクションを拒否、stderrをClaudeにフィードバック |
| その他 | 非ブロッキングエラー | stderrをユーザーに表示、アクション続行 |

**チェックリスト**:
- [ ] 正しい終了コードの使用
- [ ] JSON構造が正しい
- [ ] イベント名が正確
- [ ] 必須フィールドが存在

**Valid Event Names**:
- `PreToolUse`, `PostToolUse`, `UserPromptSubmit`
- `Stop`, `SubagentStop`
- `SessionStart`, `SessionEnd`
- `Notification`, `PreCompact`

### 4. Best Practices

**評価観点**:
- 明確な命名
- ドキュメント化
- バージョン管理

**チェックリスト**:
- [ ] フックの目的が明確
- [ ] ドキュメント化されている
- [ ] `.local.json` は git-ignored
- [ ] インクリメンタルにテスト
- [ ] `claude --debug` でデバッグ可能

**Configuration Files Location** (優先順):
1. `~/.claude/settings.json` - ユーザーワイドグローバル
2. `.claude/settings.json` - プロジェクト固有 (バージョン管理)
3. `.claude/settings.local.json` - ローカルオーバーライド (git-ignored)

## Hook Configuration Structure

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "type": "command",
        "matcher": "Write|Edit",
        "command": "/path/to/script.sh",
        "timeout": 30000
      }
    ]
  }
}
```

**Required Fields**:
- `type`: `"command"` または `"prompt"`
- `command` (command type) または `prompt` (prompt type)

**Optional Fields**:
- `matcher`: ツール名やパターン (regex対応)
- `timeout`: ミリ秒単位のタイムアウト

**Matcher Patterns Examples**:
- `"Write"` - Write ツールのみ
- `"Write|Edit"` - Write または Edit
- `"Notebook.*"` - Notebook で始まるツール
- `"mcp__.*"` - MCP ツール全般

## Output Format

```markdown
## Hooks Configuration Review

**File**: {file_path}
**Overall Assessment**: {A-F}

### Overview
- フック数: {count}
- イベントタイプ: {types}
- 設定場所: {location}

### Findings by Category

#### Security
- Status: ✅ / ⚠️ / ❌
- {findings}

#### Performance
- Status: ✅ / ⚠️ / ❌
- {findings}

#### Correctness
- Status: ✅ / ⚠️ / ❌
- {findings}

#### Best Practices
- Status: ✅ / ⚠️ / ❌
- {findings}

### Priority Recommendations

#### Critical
- {security issues}

#### High
- {correctness issues}

#### Medium
- {performance improvements}

#### Low
- {best practice enhancements}
```

## Common Issues

### Critical
- コマンドインジェクションの脆弱性
- クォートされていない変数
- 露出したシークレット

### High
- 不正な終了コード
- 無効なイベント名
- 必須フィールドの欠如

### Medium
- タイムアウト未設定
- 非効率なパターン

### Low
- ドキュメント不足
- 命名の一貫性

## Dependencies

### Required
- `jq` - JSON処理ツール

### Optional (Templates用)
- `prettier` - JS/TSフォーマット
- `black` - Pythonフォーマット
- `gofmt` - Goフォーマット
