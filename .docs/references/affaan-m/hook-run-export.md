# Pattern: Hook の run() エクスポート

- **出典**: [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- **カテゴリ**: Hook 設計 / パフォーマンス
- **取り込み優先度**: 低

## 概要

Hook スクリプトを `module.exports = { run }` 形式にし、ラッパーから `require()` で直接呼び出す。

## 利点

- `spawnSync()` より ~50-100ms 高速 (プロセス起動コストなし)
- stdin/stdout のパイプ処理が不要
- エラーハンドリングが直接的

## 互換性

- `run()` が存在しない場合は従来の `spawnSync()` にフォールバック
- 段階的な移行が可能

## コード構造

```javascript
// hook-script.js
async function run(input) {
  // input: parsed stdin JSON
  // return: { exitCode: 0, stdout: "...", stderr: "..." }
}

// CLI entrypoint (legacy support)
if (require.main === module) {
  const input = JSON.parse(fs.readFileSync(0, 'utf8'));
  run(input).then(result => {
    process.stdout.write(result.stdout || '');
    process.exit(result.exitCode || 0);
  });
}

module.exports = { run };
```

## 適用先

notify プラグイン等の Node.js ベース Hook に適用可能。
