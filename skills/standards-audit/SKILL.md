---
name: standards-audit
description: Use when the user wants to check project compliance against naoto24kawa/standards. Triggers include "standards チェック", "standards に準拠しているか", "kickoff チェック", "プロジェクト開始のチェック", "progress チェック", "完了前の最終確認", "done チェック", "standards-audit", "project health", "セットアップ確認", "standards と比較して".
allowed-tools: [Read, Bash, Glob, Grep]
---

# Standards Health Check

プロジェクトの現在状態を standards と比較し、ギャップを報告する。**修正はしない — 比較と結果出力のみ。**

Standards 正本: `/Users/nishikawa/projects/naoto24kawa/standards/`

---

## ステップ 1: フェーズを確定する

引数またはコンテキストから以下のいずれかを判定する。不明な場合のみユーザーに確認する。非対話実行（CI / hook）の場合は `progress` をデフォルトとする。

| フェーズ | 使うタイミング |
|---------|--------------|
| `kickoff` | 新規プロジェクト開始直後（テンプレートコピー後） |
| `progress` | 開発途中の準拠確認 |
| `done` | リリース前・完了宣言前の最終確認 |

---

## ステップ 2: プロジェクト状態を収集する

以下を読む（存在しないファイルは「未作成」として記録する）:

```
README.md
AGENTS.md（または CLAUDE.md）
biome.json
.gitignore
pnpm-workspace.yaml  または  package.json
.github/workflows/ci.yml
.github/workflows/deploy.yml
.github/PULL_REQUEST_TEMPLATE.md
design-tokens.css のコピー先（`find . -name "index.css" -path "*/apps/*/src/*"` で探す）
apps/docs/src/content/docs/legal/  または  src/content/docs/legal/  （legal ディレクトリ）
```

---

## ステップ 3: フェーズ別チェックリストを評価する

各項目を ✅ PASS / ⚠️ WARN / ❌ FAIL で評価する。

### kickoff チェックリスト

**Contract（AI_FIRST.md §4 準拠）**
- [ ] `AGENTS.md` または `CLAUDE.md` が存在する
- [ ] `standards_version` フィールドがあり `YYYY-MM-DD (rev.N)` 形式
- [ ] dev 起動コマンドと URL が記載されている（UI を持つ場合）
- [ ] `dev-data-safety: local | shared` が明記されている（UI を持つ場合）
- [ ] routes / 主要ページ一覧が列挙されている（UI を持つ場合）
- [ ] Key Commands（test / check / deploy）が記載されている

**Stack & CI（PROJECT_RULES.md + templates 準拠）**
- [ ] `biome.json` が存在する
- [ ] `.gitignore` が存在する
- [ ] `.github/workflows/ci.yml` が存在する
- [ ] `.github/workflows/deploy.yml` が存在し `<DEPLOY_COMMAND>` プレースホルダーが置き換え済み
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` が存在し証跡マトリクスが 6 列（`light` / `dark` / `console` / `a11y tree` / `keyboard` を含む）

**Design（DESIGN.md §2 準拠）**
- [ ] `design-tokens.css` が `apps/web/src/index.css`（または同等パス）にコピー済み

**Docs（DOCS_OPS.md §1 準拠）**
- [ ] `README.md` が存在する（`templates/README.template.md` からコピー済み）
- [ ] README の `<owner>` / `<repo>` / `<project>` / `<一行説明>` プレースホルダーが残っていない
- [ ] standards バッジの日付文字列が `standards_version` と一致している
- [ ] webhook / 認証機能があれば `SECURITY.md` が `templates/SECURITY.md` からリポルートにコピー済み（`<your-email>` / `<owner>` / `<repo>` / `<N>（応答時間）` が実値済みであること）

**Legal（templates/legal/ checklist 準拠）**
- [ ] `legal/` ディレクトリが存在する（公開プロダクトの場合）
- [ ] `<product>` / `<your-domain>` / `mk_` プレースホルダーが残っていない

---

### progress チェックリスト

kickoff の全項目に加えて:

**Architecture（ARCHITECTURE.md 準拠）**
- [ ] `pnpm-workspace.yaml` が存在し `apps/` + `packages/` 構造になっている
- [ ] `apps/` 配下にビジネスロジックが混在していない（`packages/` に切り出し済みか）

**Design（DESIGN.md §3 準拠）**
- [ ] CSS ファイルに raw `oklch(` / `hsl(` が直書きされていない（`design-tokens.css` 以外）
- [ ] `text-` / `bg-` 等の Tailwind カラークラスに生パレット値（`text-zinc-900` 等）が直書きされていない — `text-foreground` 等のトークン参照を使う

---

### done チェックリスト

kickoff + progress の全項目に加えて:

**Contract（最終確認）**
- [ ] `standards_version` が最新 rev に更新されている（CHANGELOG.md の先頭 rev と一致）

**Legal（全項目突合）**
- [ ] 法務5点セット（terms / privacy / cookies / security / dpa）が全て存在する（公開プロダクトの場合）
- [ ] `security.mdx` のプレースホルダー（API Key プレフィックス・桁数・暗号パラメータ）が実装値に更新済み
- [ ] データ保持期間が実装定数と一致している

**Docs（DOCS_OPS.md 準拠）**
- [ ] `README.md` が存在しプロダクト名・概要・起動手順を含む
- [ ] webhook / 認証機能があれば Security Notes セクションが README にある
- [ ] webhook / 認証機能があれば `SECURITY.md` がリポルートに存在し `<your-email>` / `<owner>` / `<repo>` / `<N>（応答時間）` が実値済み

**Security（AUDIT.md セキュリティ機能一覧 準拠）**

各項目は N/A 条件に該当する場合は N/A として報告する。grep は `apps/api/src/` 配下を対象とする（パスはプロジェクトに応じて読み替える）。

- [ ] JWT 短命アクセストークン設定が存在する（`grep -rn "expiresIn\|exp:" apps/api/src/`）— **N/A: 認証なし・OAuth のみ**
- [ ] refresh token が httpOnly Cookie に保管されている（`grep -rn "httpOnly" apps/api/src/` がヒットする）— **N/A: 認証なし・OAuth のみ**
- [ ] localStorage への token 保存がない（`grep -rn "localStorage" apps/web/src/ | grep -i "token\|refresh\|access"` がヒットしない）— **N/A: 認証なし**
- [ ] Webhook HMAC-SHA256 署名検証が実装されている（`grep -rn "HMAC\|timingSafeEqual\|sha256" apps/api/src/`）— **N/A: Webhook 機能なし**
- [ ] SSRF 防止のプライベート IP ブロックが実装されている（`grep -rn "10\.\|172\.\|192\.168\|169\.254" apps/api/src/`）— **N/A: アウトバウンド HTTP なし**
- [ ] パスワードが PBKDF2-SHA-512 でハッシュ化されている（`grep -rn "pbkdf2\|PBKDF2\|SubtleCrypto" apps/api/src/` がヒットする）— **N/A: 認証なし・OAuth のみ**
- [ ] レートリミット binding が wrangler 設定に存在する（`grep -rn "RATE_LIMITER\|RateLimiter" wrangler*.toml apps/api/src/`）— **N/A: 認証なし**
- [ ] GDPR: アカウント削除ルート `/account/delete` が存在する（`grep -rn "account/delete\|account\.delete" apps/api/src/`）— **N/A: 個人データなし**
- [ ] GDPR: 同意バージョン管理が実装されている（`grep -rn "TERMS_VERSION\|termsAgreedAt" apps/` がヒットする）— **N/A: 個人データなし**
- [ ] `security.mdx` のインフラ認証テーブルが ARCHITECTURE.md §1 の正本と一致している（目視確認）— **N/A: security.mdx なし**

---

## ステップ 4: ヘルスレポートを出力する

以下のフォーマットで出力する:

```
## Standards Health Report  [kickoff | progress | done]
standards_version（参照）: <CHANGELOG.md の最新 rev>
プロジェクト standards_version: <AGENTS.md / CLAUDE.md の値 or 未記載>

| ドメイン      | 状態 | ギャップ                                        |
|--------------|------|-------------------------------------------------|
| Contract     | ❌   | dev-data-safety 宣言なし、routes 未記載          |
| Stack & CI   | ⚠️   | deploy.yml に <DEPLOY_COMMAND> が残っている       |
| Design       | ✅   |                                                 |
| Legal        | ❌   | <product> プレースホルダーが 3 箇所残っている     |
| Security     | ⚠️   | SSRF 防止未確認（アウトバウンド HTTP あり）       |

### 要対応（❌ FAIL）
1. ...

### 確認推奨（⚠️ WARN）
1. ...
```

状態の定義:
- ✅ PASS: チェック項目がすべて満たされている（N/A 含む）
- ⚠️ WARN: 軽微な未対応（プレースホルダー1箇所等）または「UI を持つ場合のみ」の項目が未確認
- ❌ FAIL: 必須項目が未対応
