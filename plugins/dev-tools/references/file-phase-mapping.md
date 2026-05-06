# File Path to Phase Mapping

spec スキルの Update モードで使用するファイルパスパターンと影響フェーズのマッピングテーブル。

## マッピングテーブル

| パターン | 例 | 影響フェーズ |
|---|---|---|
| `**/migrations/**`, `**/schema.*`, `**/prisma/**`, `**/drizzle/**` | DB スキーマ・マイグレーション | Phase 3 (data model) |
| `**/routes/**`, `**/controllers/**`, `**/handlers/**`, `**/api/**`, `**/*.resolver.*` | API・ルーティング定義 | Phase 4 (API), Phase 5 (usecases) |
| `**/services/**`, `**/domain/**`, `**/usecases/**`, `**/business/**` | コアビジネスロジック | Phase 2 (architecture), Phase 5 (usecases), Phase 6 (rules) |
| `**/middleware/**`, `**/auth/**`, `**/guards/**` | 認証・ミドルウェア | Phase 4 (API), Phase 6 (rules) |
| `**/config/**`, `**/infra/**`, `**/*.toml`, `**/*.yaml`, `**/*.env*`, `**/Dockerfile*` | インフラ・設定 | Phase 7 (non-functional) |
| `**/package.json`, `**/go.mod`, `**/Cargo.toml`, `**/requirements.txt`, `**/pyproject.toml` | パッケージ・依存関係 | Phase 1 (overview) |
| `**/README*`, `**/CHANGELOG*`, `**/*.md` (docs only) | ドキュメントのみ | スキップ |

## マッピングの原則（パターン未一致時）

パターンに該当しないファイルは以下の原則でフェーズを判定する:

- **データ層**（DB / ORM / マイグレーション）→ Phase 3
- **API・ハンドラ**（HTTP / GraphQL / gRPC 定義）→ Phase 4, 5
- **コアビジネスロジック**（サービス / ドメイン / ユースケース）→ Phase 2, 5, 6
- **インフラ・設定**（CI/CD / Docker / 環境変数）→ Phase 7
- **パッケージ・依存関係**（manifest ファイル）→ Phase 1
- **ドキュメントのみ**（README / CHANGELOG）→ スキップ
- **判断不能**（真に曖昧な場合）→ ユーザーに確認

## 常に実行するフェーズ

- **Phase 0** (context) — 常に実行
- **Phase 8** (index) — 常に実行
- **Phase 1** (overview) — Phase 2-7 の3つ以上が影響を受ける場合に追加
