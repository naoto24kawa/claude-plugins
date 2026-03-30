# affaan-m 設計パターンリファレンス

[affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) から抽出した設計パターン集。

- **調査日**: 2026-03-30
- **バージョン**: v1.9.0 時点
- **ライセンス**: MIT
- **規模**: Star 116k+ / Skills 135 / Agents 30 / Commands 60 / Hooks 20+

## パターン一覧

| # | ファイル | パターン | 取り込み優先度 |
|---|---------|---------|--------------|
| 1 | [hook-profile-separation.md](./hook-profile-separation.md) | Hook プロファイル分離 | 中 |
| 2 | [config-protection-hook.md](./config-protection-hook.md) | Config Protection Hook | **高** |
| 3 | [mcp-health-check-hook.md](./mcp-health-check-hook.md) | MCP Health Check Hook | 低 |
| 4 | [cost-tracking-hook.md](./cost-tracking-hook.md) | コスト追跡 Hook | 中 |
| 5 | [pre-compact-state-save.md](./pre-compact-state-save.md) | PreCompact 状態保存 | 低 |
| 6 | [strategic-compact-suggestion.md](./strategic-compact-suggestion.md) | 戦略的コンパクション提案 | 低 |
| 7 | [quality-gate-hook.md](./quality-gate-hook.md) | Quality Gate | 中 |
| 8 | [agent-role-separation.md](./agent-role-separation.md) | エージェント役割分離 | **高** |
| 9 | [context-window-management.md](./context-window-management.md) | コンテキストウィンドウ管理戦略 | 参考 |
| 10 | [hook-run-export.md](./hook-run-export.md) | Hook の run() エクスポート | 低 |

## 注意事項

- ライセンスは MIT のため、コード引用・改変は自由
- 135スキル中の多数は作者の個人プロジェクト特化 (物流、投資、SNS 等) であり汎用性なし
- 「全部入り」ではなく、パターンの選択的取り込みを推奨
- SessionStart hook のインライン巨大 JS は可読性が低く、アンチパターンとして参考
