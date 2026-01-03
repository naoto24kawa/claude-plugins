// app/lib/session.ts
// セッション管理の設定
import { useSession } from '@tanstack/start'

/**
 * セッションデータの型定義
 */
export interface SessionData {
  userId: string
  email: string
  role: 'admin' | 'user'
}

/**
 * アプリケーション全体で使用するセッション設定
 *
 * @returns セッションオブジェクト
 *
 * @example
 * ```tsx
 * const session = await useAppSession()
 * await session.update({ userId: '1', email: 'user@example.com', role: 'user' })
 * console.log(session.data) // { userId: '1', email: 'user@example.com', role: 'user' }
 * await session.clear()
 * ```
 */
export function useAppSession() {
  return useSession<SessionData>({
    name: 'app-session',
    // SESSION_SECRETは32文字以上の強力な秘密鍵を使用（.env.localで設定）
    password: process.env.SESSION_SECRET!,
    cookie: {
      // 本番環境ではHTTPSを強制
      secure: process.env.NODE_ENV === 'production',

      // CSRF対策: 同一サイトからのリクエストのみ許可
      sameSite: 'lax',

      // XSS対策: JavaScriptからのアクセスを禁止
      httpOnly: true,

      // セッションの有効期限: 7日間（秒単位）
      maxAge: 60 * 60 * 24 * 7,

      // パス: アプリケーション全体で有効
      path: '/',
    },
  })
}
