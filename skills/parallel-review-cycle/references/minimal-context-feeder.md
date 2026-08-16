# Minimal Context Feeder

`ts-review-graph` はレビュー対象の理解を速める補助機構であり、レビューゲートそのものではない。

## 起動条件

次を両方満たす場合だけ起動する。

1. 対象ファイルにコードが1つ以上含まれる。
2. 対象リポジトリに `.ts-review-graph/graph.db` が存在する。

文章仕様だけをレビューする場合はスキップする。

## 呼び出し

全 specialist のディスパッチ前に、Claude Code plugin の MCP ツール `mcp__plugin_ts-review-graph_ts-review-graph__get_minimal_context` を次の引数で1回だけ呼ぶ。

```text
changed_files: [レビュー対象のリポジトリ相対パス]
mode: "review"
```

返されたファイル集合を各プロンプトへ次の見出しで添える。

```markdown
## まず読むべき起点（ts-review-graph）

{返された最小ファイルセット}

これは読み始める起点であり、レビュー範囲の制約ではありません。必要なら他のファイルも読んでください。
```

## fail-open フォールバック

次の場合は呼び出し結果を使わず、理由を1行記録して現行のレビュー動作を継続する。

- `.ts-review-graph/graph.db` が無い
- graph が stale として拒否された
- MCP サーバーが未接続またはツール呼び出しに失敗した

記録例:

```text
ts-review-graph: graph が無いためスキップ。現行のレビュー動作を継続する。
ts-review-graph: stale graph のためスキップ。現行のレビュー動作を継続する。
ts-review-graph: MCP 未接続のためスキップ。現行のレビュー動作を継続する。
```

この場で graph を構築したり、レビューを停止したり、最小集合を「これ以外は読むな」という制約へ変えたりしない。
