# Observability Audit チェックリスト

## パターン共通チェック

### LOG-001: Pino 導入

- 検査方法: `package.json` で `"pino"` を検索
- OK: pino パッケージが dependencies に存在
- NG: pino 未導入
- 修正提案: `npm install pino` を実行

### LOG-002: 構造化JSON出力

- 検査方法: Pino の設定ファイルを Grep で検索し、transport/prettifier 設定を確認
- OK: 本番設定で JSON 出力
- WARN: prettifier が本番設定に残っている
- NG: Pino の設定が存在しない、または JSON 出力が無効化されている
- 修正提案: NODE_ENV=production で prettifier を無効化

### LOG-003: severity 統一

- 検査方法: `console.log` / `console.error` の残存を Grep し、Pino の severity level (info/warn/error/fatal) の一貫性を確認
- OK: info/warn/error/fatal が統一的に使用されている
- WARN: console.log/console.error が混在
- NG: ログ出力が存在しない、または severity レベルの使い分けがない
- 修正提案: Pino の logger インスタンスに統一

### TRACE-001: OpenTelemetry SDK 導入

- 検査方法: `package.json` で `@opentelemetry` を検索
- OK: @opentelemetry/sdk-node (または sdk-trace-node) が存在
- NG: OTel 未導入
- 修正提案: `npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node`

### TRACE-002: OTel SDK 初期化

- 検査方法: `NodeSDK` または `registerInstrumentations` の import を Grep
- OK: エントリポイントで初期化されている
- NG: パッケージはあるが初期化コードがない
- 修正提案: エントリポイントに SDK 初期化コードを追加

## パターン依存チェック

### TRACE-003: trace_id 付与 (trace_id: required の場合)

- 検査方法: HTTP ハンドラで trace_id をレスポンスヘッダまたはログに含めているか Grep
- OK: trace_id が出力されている
- WARN: OTel の自動計装に任せている(明示的な出力なし)
- NG: trace_id が一切出力されていない

### TRACE-004: Context Propagation (architecture: microservices の場合)

- 検査方法: HTTP クライアント呼び出しで W3C Trace Context ヘッダを伝播しているか確認
- OK: OTel の HTTP instrumentation が有効
- WARN: OTel auto-instrumentation に依存しているが、手動 HTTP クライアント呼び出しが一部存在する
- NG: 手動 HTTP 呼び出しで context が失われている

### TRACE-005: 分散トレース収集設定 (repair_input: distributed_trace の場合)

- 検査方法: OTel エクスポーター設定を確認 (X-Ray / Axiom OTLP)
- OK: エクスポーター設定が存在
- WARN: エクスポーター設定はあるがエンドポイントが未設定またはダミー値
- NG: エクスポーター未設定

## 設計原則チェック

### DESIGN-001: 修復アクション3層定義

- 検査方法: `.docs/observability-design.md` の repair_actions を確認
- OK: immediate / approval / proposal_only が全て定義済み
- WARN: 一部空
- NG: 設計ドキュメントに定義なし

### DESIGN-002: Gitスナップショット手順

- 検査方法: `.docs/` 配下にロールバック手順またはスナップショット方針の記載があるか
- OK: 手順が文書化されている
- WARN: 設計ドキュメントで git_snapshot: true だが手順未文書化

### DESIGN-003: 修復履歴RAG設定

- 検査方法: repair_history_rag: true なら DB 接続設定を検索
- OK: PostgreSQL / Supabase の接続設定が存在
- WARN: repair_history_rag: true だが接続設定なし(設計段階として段階的改善を促す)
- NG: repair_history_rag: false に設定すべきなのに true のまま放置されている
