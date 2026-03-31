# Dismissed Security Patterns

Full codebase security review (2026-03-31, baseline commit: dc6860a) で調査済み・棄却済みの脆弱性候補。
コードに変更がない限り再調査不要。

## 1. SSRF DNS Rebinding (ssrf-guard.ts + http.ts)

**概要**: DoH検証(`assertSafeUrl`)と`fetch()`間のTOCTOUギャップ
**棄却理由**:
- Cloudflare Workers の `fetch()` はランタイムレベルでプライベートIP(RFC1918, loopback, link-local, metadata)への接続をブロック
- 入力時に `BLOCKED_HOSTS` + `PRIVATE_IP_HOST_REGEX` でZodバリデーション
- `redirect: "manual"` でリダイレクトベースSSRFも防御
- **結論**: CF Workers環境では実質exploitable でない

**再調査トリガー**: fetch()のオプション変更、redirect設定変更、新しいチェッカー追加

## 2. Login Lockout Race Condition (auth.ts KV非アトミック)

**概要**: KVのread-then-writeパターンで並行ログイン試行がロックアウトを迂回する可能性
**棄却理由**:
- Turnstile CAPTCHAトークンが単回使用(並行攻撃の根本的制約)
- IP rate limit 30req/min (`authRateLimit`)
- パスワード複雑性要件(8+文字, 英数混合)
- KV eventual consistency は既知の制約でドキュメント化済み
- **結論**: 補償制御で実質リスクなし

**再調査トリガー**: Turnstile削除、rate limit変更、ロックアウトロジック変更

## 3. MFA Encryption Key Fallback (mfa.ts → JWT_SECRET)

**概要**: `MFA_ENCRYPTION_KEY` 未設定時に `JWT_SECRET` にフォールバック
**棄却理由**:
- HKDF-SHA256によるドメイン分離実装済み(salt: `manako-mfa-encryption`, info: `totp-secret`)
- JWT_SECRET漏洩時は既にフルアカウント乗っ取りが可能(MFAバイパスは追加脅威にならない)
- 両方ともCF Workers encrypted secret storage
- **結論**: Defense-in-depth改善であり脆弱性ではない

**再調査トリガー**: HKDF実装変更、暗号化方式変更、MFA_ENCRYPTION_KEY必須化

## 4. Turnstile Fail-Open (turnstile.ts)

**概要**: Turnstile API障害時にCAPTCHAスキップ
**棄却理由**:
- 意図的設計(JSDoc + テストケースでドキュメント化)
- Worker-to-CF内部通信を外部から妨害不可
- rate limit + lockout で補償
- プロジェクト全体の可用性優先アーキテクチャ
- **結論**: 設計判断であり脆弱性ではない

**再調査トリガー**: fail-open方針変更、Turnstile必須化

## 5. Monitor Config Data Exposure (public-api.ts)

**概要**: GET /monitors がカスタムHTTPヘッダー含むフルconfig返却
**棄却理由**:
- `Authorization` ヘッダーはZodスキーマでブロック済み
- ユーザー自身のデータを自身のAPIキーで取得(設計通り)
- Dashboard APIと同一の返却内容
- **結論**: 意図的な動作

**再調査トリガー**: httpConfigSchemaのブロックリスト変更、新しいconfig項目追加

## 6. KV Rate Limiter Fail-Open (複数箇所)

**概要**: heartbeat-receiver, auth.ts, contact.ts でKV障害時にrate limitスキップ
**棄却理由**:
- プロジェクト全体の可用性優先設計(全箇所で同一パターン)
- LOW severity
- **結論**: アーキテクチャ方針

**再調査トリガー**: fail-open方針変更
