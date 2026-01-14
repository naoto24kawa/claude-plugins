---
name: claude-config-review
description: Reviews Claude Code configuration files against official documentation. Supports 6 target types (Skills, Sub-agents, MCP, Hooks, Slash commands, Plugins). Fetches latest best practices via WebFetch and generates A-F graded reports with actionable recommendations. Use when users mention "設定レビュー", "skill review", "agent review", "MCP check", "hooks validation", "command review", "plugin validation", "config review", or Claude Code configuration quality assessment.
allowed-tools: [Read, Glob, Grep, WebFetch, WebSearch, TodoWrite]
---

# Claude Code Configuration Reviewer

## Table of Contents

1. [Overview](#overview)
2. [Review Targets](#review-targets)
3. [Review Process](#review-process)
4. [Grading Criteria](#grading-criteria)
5. [Default Settings](#default-settings)
6. [Resources](#resources)
7. [Usage Examples](#usage-examples)
8. [Important Notes](#important-notes)

## Overview

Claude Code設定ファイルを公式ドキュメントに基づいてレビューする統合スキル。6種類のレビュー対象に対応し、実行時に最新のベストプラクティスを取得して評価を行う。

## Review Targets

| 対象 | 説明 | 対象ファイル |
|------|------|-------------|
| **Skills** | スキル定義 | `**/SKILL.md` |
| **Sub-agents** | サブエージェント設定 | `.claude/subagents/*.json`, `**/agents/*.md` |
| **MCP** | MCPサーバー設定 | `**/.mcp.json` |
| **Hooks** | フック設定 | `*/.claude/settings*.json` |
| **Slash commands** | スラッシュコマンド | `.claude/commands/*.md` |
| **Plugins** | プラグイン定義 | `.claude-plugin/marketplace.json` |

## Review Process

### Step 1: Select Review Target

ユーザーにレビュー対象を質問する。明示的に指定されている場合はその対象をレビュー。

**対話的選択**:
```
どのClaude Code設定をレビューしますか？

1. Skills - SKILL.mdファイル
2. Sub-agents - サブエージェント定義
3. MCP - .mcp.json設定
4. Hooks - settings.jsonのhooks設定
5. Slash commands - .claude/commands/*.md
6. Plugins - marketplace.json
7. All - 全て一括レビュー
```

**Verification**: ユーザーの選択を確認

### Step 2: Fetch Official Documentation

選択された対象の公式ドキュメントを取得する。

**手順**:
1. `review-targets/{target}.md` を読み込み、現時点のベストプラクティスを確認
2. WebFetchで公式ドキュメントを取得し、最新情報を補完
3. WebFetch失敗時はWebSearchでフォールバック

**公式ドキュメントURL**:

| 対象 | 仕様URL | ベストプラクティスURL |
|------|---------|---------------------|
| Skills | https://code.claude.com/docs/en/skills | https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices |
| Sub-agents | https://code.claude.com/docs/en/sub-agents | (同一ページ内) |
| MCP | https://code.claude.com/docs/en/mcp | (同一ページ内) |
| Hooks | https://code.claude.com/docs/en/hooks | (同一ページ内) |
| Slash commands | https://code.claude.com/docs/en/slash-commands | (同一ページ内) |
| Plugins | https://code.claude.com/docs/en/plugins | (同一ページ内) |

**WebFetch失敗時のフォールバック**:
```
WebSearchクエリ: "Claude Code {対象} specification best practices site:docs.claude.com OR site:code.claude.com"
```

**Verification**: ドキュメントの主要セクションが取得できたことを確認

**Error Handling**:
- WebFetch失敗: WebSearchでフォールバック検索
- WebSearch失敗: ローカルの `review-targets/{target}.md` のみで評価を続行し、ユーザーに通知

### Step 3: Locate Configuration Files

対象ファイルを検索する。

**検索パターン**:

| 対象 | Glob パターン |
|------|--------------|
| Skills | `**/SKILL.md` |
| Sub-agents | `.claude/subagents/*.json`, `**/agents/*.md` |
| MCP | `**/.mcp.json` |
| Hooks | `**/.claude/settings*.json`, `~/.claude/settings.json` |
| Slash commands | `.claude/commands/**/*.md` |
| Plugins | `.claude-plugin/marketplace.json` |

**Verification**: 対象ファイルが存在することを確認

**Error Handling**:
- ファイル未発見: 検索したパターンを報告し、ファイル作成を提案

### Step 4: Evaluate Against Best Practices

公式ドキュメントとローカルのベストプラクティスに基づいて評価する。

**評価手順**:
1. `review-targets/{target}.md` から評価基準を読み込み
2. 公式ドキュメントで取得した最新情報を追加考慮
3. 各評価次元でA-Fグレードを付与
4. 問題を優先度別に分類

**優先度分類**:
- 🔴 **Critical**: 機能しない、セキュリティリスク
- 🟠 **High**: 重大な品質問題
- 🟡 **Medium**: 推奨改善事項
- 🟢 **Low**: 最適化の余地

**Verification**: 全評価次元が評価されていることを確認

### Step 5: Generate Review Report

`common/report-template.md` に従ってレポートを生成する。

**レポート構造**:
```markdown
# Configuration Review Report

**対象**: {target}
**ファイル**: {file_path}
**総合評価**: {A-F}

---

## サマリー
{2-3文の概要}

## 評価次元

| 次元 | 評価 | 状態 |
|------|------|------|
| {dimension1} | {grade} | {emoji} |
| ... | ... | ... |

## 詳細分析

### {Dimension 1}
**所見**: ...
**問題**: ...
**推奨**: ...

...

## 優先改善事項

### Critical
- {issue}

### High
- {issue}

...

## 改善版 (必要な場合)
{corrected configuration}

---

**参照**: {official_doc_url}
```

**Verification**: レポートに全セクションが含まれていることを確認

## Grading Criteria

詳細は `common/grading-criteria.md` を参照。

### Summary

| グレード | スコア | 説明 |
|---------|--------|------|
| **A** | 90-100 | 全ベストプラクティス準拠 |
| **B** | 70-89 | ほぼ準拠、軽微な改善余地 |
| **C** | 50-69 | 複数の問題あり |
| **D** | 30-49 | 多数の違反、要大幅修正 |
| **F** | 0-29 | 重大な問題、再設計推奨 |

## Default Settings

Unless otherwise specified by the user, use the following defaults:

### Report Format
- **Output format**: Detailed markdown with A-F grades
- **Language**: Match user's language preference
- **Priority levels**: 4 tiers (Critical/High/Medium/Low)

### Documentation Fetch
- **Primary method**: WebFetch to official documentation URLs
- **Fallback**: WebSearch if WebFetch fails
- **Final fallback**: Local `review-targets/{target}.md` only

### Evaluation Approach
- **Rigor**: Strictly apply official best practices
- **Pragmatism**: Consider project-specific requirements when appropriate
- **Constructiveness**: Provide specific, actionable improvements with examples

### Output Behavior
- **Single target**: Generate detailed report for the specified target
- **All targets**: Generate individual reports + overall summary
- **Improvements**: Always include before/after examples for issues

## Resources

### review-targets/

対象別の評価基準と公式ドキュメントURL:
- `skills.md` - Skills評価基準
- `subagents.md` - Sub-agents評価基準
- `mcp.md` - MCP評価基準
- `hooks.md` - Hooks評価基準
- `slash-commands.md` - Slash commands評価基準
- `plugins.md` - Plugins評価基準

### common/

共通コンポーネント:
- `grading-criteria.md` - A-Fグレード詳細基準
- `report-template.md` - レポートテンプレート

## Usage Examples

### Example 1: Single Target Review

**User**: "スキルをレビューして"

**Process**:
1. Skills対象を確認
2. `review-targets/skills.md` を読み込み
3. WebFetchで公式ドキュメント取得
4. `**/SKILL.md` を検索
5. 評価実行、レポート生成

### Example 2: Multiple Targets

**User**: "全ての設定をレビューして"

**Process**:
1. 全6対象を順次レビュー
2. 各対象でStep 2-5を実行
3. 最後に全体サマリーを生成

### Example 3: Specific File

**User**: "このMCP設定をレビューして"

**Process**:
1. MCP対象を特定
2. 指定ファイルを読み込み
3. WebFetchで公式ドキュメント取得
4. 評価実行、レポート生成

### Example Output: Good vs Bad

**Good Report (Grade A Skill)**:
```markdown
# Configuration Review Report

**対象**: Skills
**ファイル**: ./my-skill/SKILL.md
**総合評価**: A (95/100)

## サマリー
全ベストプラクティスに準拠。Progressive Disclosure が適切に実装され、
明確なワークフローとエラーハンドリングを備えた高品質なスキル。

## 評価次元
| 次元 | 評価 | 状態 |
|------|------|------|
| Description Quality | A | ✅ |
| Progressive Disclosure | A | ✅ |
| Workflow | A | ✅ |

## 優先改善事項
なし - 全ベストプラクティスに準拠
```

**Issues Found (Grade C Skill)**:
```markdown
# Configuration Review Report

**対象**: Skills
**ファイル**: ./problematic-skill/SKILL.md
**総合評価**: C (58/100)

## サマリー
複数のベストプラクティス違反が検出された。Description の形式、
ファイルサイズ、エラーハンドリングに改善が必要。

## 優先改善事項

### 🟠 High
- Description が三人称でない ("I help you..." → "Helps users...")
- エラーハンドリングセクションがない

### 🟡 Medium
- SKILL.md が623行 (500行以下推奨)
- 目次がない (100行超のファイル)

## 改善版
---
# Before
description: I help you process files...

# After
description: Processes files and generates reports. Use when...
---
```

## Important Notes

1. **公式ドキュメント優先**: ローカルのベストプラクティスより公式ドキュメントを優先
2. **最新情報取得**: WebFetch/WebSearchで毎回最新情報を取得
3. **フォールバック**: 取得失敗時はローカル情報で継続、ユーザーに通知
4. **具体的改善提案**: 問題指摘だけでなく、具体的な修正例を提供
5. **コンテキスト考慮**: プロジェクト固有の要件を考慮した評価
