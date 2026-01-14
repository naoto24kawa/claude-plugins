# Project Audit Report Template

プロジェクト全体の Claude 設定を一括監査するためのレポートテンプレート。

## レポート構造

```markdown
# Project Audit Report

**プロジェクト**: {project_name}
**監査日時**: {datetime}
**総合スコア**: {score}/100 ({grade})

---

## 検出された設定ファイル

| カテゴリ | ファイル数 | 平均スコア |
|---------|----------|-----------|
| Skills | X | XX |
| Sub-agents | X | XX |
| MCP | X | XX |
| Hooks | X | XX |
| Slash commands | X | XX |
| Plugins | X | XX |
| CLAUDE.md | X | - |

**合計**: {total_files} ファイル

---

## 全体サマリー

### 強み
- {strength_1}
- {strength_2}
- {strength_3}

### 改善が必要な領域
- {area_1}: {issue_summary}
- {area_2}: {issue_summary}

---

## 問題リスト (優先度順)

### 🔴 Critical
| ファイル | 問題 | 推奨対応 |
|---------|------|---------|
| {file} | {issue} | {recommendation} |

### 🟠 High
| ファイル | 問題 | 推奨対応 |
|---------|------|---------|
| {file} | {issue} | {recommendation} |

### 🟡 Medium
| ファイル | 問題 | 推奨対応 |
|---------|------|---------|
| {file} | {issue} | {recommendation} |

### 🟢 Low
| ファイル | 問題 | 推奨対応 |
|---------|------|---------|
| {file} | {issue} | {recommendation} |

---

## 改善提案

### 即時対応 (Critical/High)
1. {task_1}
2. {task_2}

### 推奨改善 (Medium)
1. {task_1}
2. {task_2}

### 将来検討 (Low)
1. {task_1}

---

**詳細**: 各ファイルの詳細レポートは個別に生成されています
```

## セクション説明

### 検出された設定ファイル

プロジェクト内で検出された Claude 関連の設定ファイルをカテゴリ別に集計:

| カテゴリ | 検索パターン |
|---------|-------------|
| Skills | `**/SKILL.md` |
| Sub-agents | `.claude/subagents/*.json`, `**/agents/*.md` |
| MCP | `**/.mcp.json` |
| Hooks | `**/.claude/settings*.json` |
| Slash commands | `.claude/commands/**/*.md` |
| Plugins | `.claude-plugin/marketplace.json` |
| CLAUDE.md | `**/CLAUDE.md` |

### 総合スコア計算

```
総合スコア = Σ(カテゴリスコア × ファイル数) / 総ファイル数
```

- 各ファイルは 0-100 のスコアで評価
- カテゴリ平均は小数点以下切り捨て
- 総合スコアから A-F グレードを算出

### 問題の優先度分類

| 優先度 | 基準 |
|--------|------|
| 🔴 Critical | 機能しない、セキュリティリスク、即時対応必須 |
| 🟠 High | 重大な品質問題、近日中に対応推奨 |
| 🟡 Medium | 推奨改善事項、計画的に対応 |
| 🟢 Low | 最適化の余地、余裕があれば対応 |

### 改善提案の構成

1. **即時対応**: Critical/High の問題に対する具体的なアクション
2. **推奨改善**: Medium の問題に対する改善ステップ
3. **将来検討**: Low の問題に対する最適化案

## 使用例

### シンプルなサマリー (デフォルト)

```markdown
# Project Audit Report

**プロジェクト**: my-app
**監査日時**: 2024-01-15 10:30:00
**総合スコア**: 78/100 (B)

---

## 検出された設定ファイル

| カテゴリ | ファイル数 | 平均スコア |
|---------|----------|-----------|
| Skills | 3 | 85 |
| Sub-agents | 5 | 72 |
| MCP | 1 | 90 |
| Hooks | 1 | 65 |
| CLAUDE.md | 2 | - |

**合計**: 12 ファイル

---

## 全体サマリー

### 強み
- Skills が全体的に高品質 (平均85点)
- MCP 設定が適切に構成されている
- Progressive Disclosure パターンが一貫して適用されている

### 改善が必要な領域
- Hooks: エラーハンドリングが不十分
- Sub-agents: description の形式が不統一

---

## 問題リスト (優先度順)

### 🔴 Critical
(なし)

### 🟠 High
| ファイル | 問題 | 推奨対応 |
|---------|------|---------|
| .claude/settings.json | hooks にタイムアウト未設定 | timeout フィールドを追加 |

### 🟡 Medium
| ファイル | 問題 | 推奨対応 |
|---------|------|---------|
| agents/reviewer.md | description が日本語 | 英語三人称に変更 |
| agents/analyzer.md | description が日本語 | 英語三人称に変更 |

### 🟢 Low
| ファイル | 問題 | 推奨対応 |
|---------|------|---------|
| skills/helper/SKILL.md | 目次がない | 100行超のため目次追加推奨 |

---

## 改善提案

### 即時対応 (Critical/High)
1. `.claude/settings.json` の hooks に `timeout: 30000` を追加

### 推奨改善 (Medium)
1. 5つのエージェントの description を英語三人称形式に統一
2. トリガーワードを description に追加

### 将来検討 (Low)
1. 長いスキルファイルに目次を追加

---

**詳細**: 各ファイルの詳細レポートは個別に生成されています
```

## 注意事項

1. **CLAUDE.md は評価対象外**: 存在確認のみ行い、スコアには含めない
2. **ファイルが見つからない場合**: 該当カテゴリは「0 ファイル」と表示し、作成を提案
3. **問題がない場合**: 該当優先度セクションに「(なし)」と表示
4. **詳細レポート**: 必要に応じて各ファイルの詳細レポートを別途生成可能
