---
name: security-review-context
description: This skill should be used when the user asks to "セキュリティレビュー", "security review", "security-review", "脆弱性チェック", "差分セキュリティチェック", "前回のレビューから変更があるか確認", "セキュリティの差分確認", "棄却パターン確認", "dismissed patterns", "security baseline", "CF Workers セキュリティ". Provides review baseline (last full review commit, dismissed patterns) and Cloudflare Workers security knowledge to enable efficient diff-based security reviews.
allowed-tools: [Read, Grep, Glob, Bash]
---

# Security Review Context

Manako コードベースのセキュリティレビューを差分ベースで効率化するための補助スキル。
外部の `/security-review` コマンド (Claude Code plugin) と併用し、過去のレビュー結果と CF Workers 固有の知見を提供する。

## Review Baseline

### Last Full Review

> **NOTE**: フルレビュー実施後は必ずこのセクションを更新すること。手順は末尾の「Baseline Update Procedure」参照。

- **Date**: 2026-03-31
- **Baseline commit**: `dc6860a` (main branch)
- **Result**: 高信頼度(>=80%)の脆弱性 0 件、候補 6 件を棄却
- **Reviewed areas**: auth, RBAC, SSRF, XSS, SQLi, IDOR, crypto, webhook, status page, admin, public API

### Diff-Based Review Workflow

セキュリティレビュー実行時、以下のワークフローで差分に集中する:

1. **変更範囲の特定**
   ```
   git log --oneline dc6860a..HEAD
   git diff --stat dc6860a..HEAD
   ```

2. **セキュリティ影響のあるファイルを抽出**
   - `apps/api/src/routes/` - APIルート(認証・認可)
   - `apps/api/src/middleware/` - auth, RBAC, rate limit, turnstile, sudo
   - `packages/shared/src/ssrf-guard.ts` - SSRF防御
   - `packages/shared/src/crypto.ts` - 暗号処理
   - `packages/db/src/schema.ts` - DBスキーマ(新テーブル/カラム)
   - `apps/monitor-worker/src/checkers/` - モニターチェッカー
   - `apps/status-page/` - 公開エンドポイント(XSS)
   - `apps/heartbeat-receiver/` - 公開エンドポイント
   - `apps/api/src/lib/monitor-config.ts` - 入力バリデーション

3. **棄却済みパターンとの照合** - `references/dismissed-patterns.md` を参照し、変更のないパターンはスキップ。変更が再調査トリガーに該当する場合は `references/dismissed-patterns.md` の詳細コンテキストで再評価し、棄却維持ならエントリを更新、実脆弱性なら報告に含める

4. **新規コードのレビュー** - 変更のあったファイルのみ詳細レビュー

## Dismissed Patterns (Quick Reference)

以下は前回のフルレビューで棄却済み。変更がない限り再調査不要:

| # | Pattern | Location | Skip condition |
|---|---------|----------|---------------|
| 1 | SSRF DNS Rebinding | ssrf-guard.ts + checkers/ | CF Workers fetch()保護。チェッカー追加・redirect設定変更がなければスキップ |
| 2 | Login lockout race | auth.ts KV | Turnstile + rate limit。認証フロー変更がなければスキップ |
| 3 | MFA key fallback | mfa.ts | HKDF domain separation。暗号実装変更がなければスキップ |
| 4 | Turnstile fail-open | turnstile.ts | 意図的設計。fail-open方針変更がなければスキップ |
| 5 | Config data exposure | public-api.ts | Authorization header ブロック済み。スキーマ変更がなければスキップ |
| 6 | KV rate limiter fail-open | 複数箇所 | 可用性優先設計。方針変更がなければスキップ |

詳細な棄却理由と再調査トリガー条件は **`references/dismissed-patterns.md`** を参照。

## CF Workers Security Context

セキュリティレビュー時の判断に以下の知見を活用する:

- **SSRF**: `fetch()` がランタイムレベルでプライベートIP接続をブロック。アプリレベルの `assertSafeUrl()` は defense-in-depth
- **Command injection**: Workers にシェルアクセスなし。構造的に不可能
- **File operations**: ファイルシステムなし。path traversal / LFI 不可
- **KV atomicity**: KV は非アトミック。rate limiting / lockout は近似値。補償制御の有無で評価
- **Fail-open**: Worker-to-CF 内部通信は外部から妨害困難。可用性優先の設計判断として評価

詳細は **`references/cloudflare-workers-security.md`** を参照。

## Security Invariants to Verify

差分に以下のパターン破壊がないか確認する:

- **Tenant isolation**: 全クエリで `team_id` WHERE 句
- **SQL injection防御**: Drizzle ORM パラメータ化クエリ、raw SQL なし
- **XSS防御**: `escapeHtml()` / `escapeXml()` 適用、React unsafe HTML API 不使用
- **IDOR防御**: `team_id` + resource ID 複合チェック
- **Auth chain**: `jwtAuth` -> `mfaPendingGuard` -> `planCheck` -> RBAC
- **Password hash**: PBKDF2-SHA512, 100k iterations, timing-safe compare
- **Refresh token rotation**: KV失効管理
- **Stripe webhook**: signature verification + idempotency

## Baseline Update Procedure

フルレビュー実施後、以下を更新する:

1. この SKILL.md の `Last Full Review` セクション(date, commit, result)
2. `references/dismissed-patterns.md` に新たな棄却候補を追加
3. `references/cloudflare-workers-security.md` に新たな知見を追加(該当時)
4. Memory の `project_security_review.md` を同期更新(存在する場合)
