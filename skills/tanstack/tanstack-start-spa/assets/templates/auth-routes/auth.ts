// app/lib/auth.ts
// 認証関連のServer Functions
import { createServerFn } from '@tanstack/start'
import { redirect } from '@tanstack/react-router'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { useAppSession } from '~/lib/session'
import type { SessionData } from '~/lib/session'

// TODO: 実際のDBアクセスに置き換える
// import { db } from '~/lib/db'

// バリデーションスキーマ
const LoginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上必要です'),
})

const RegisterSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string()
    .min(8, 'パスワードは8文字以上必要です')
    .regex(/[A-Z]/, 'パスワードには大文字を含める必要があります')
    .regex(/[0-9]/, 'パスワードには数字を含める必要があります'),
  name: z.string().min(1, '名前は必須です'),
})

/**
 * ログイン処理
 */
export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator(LoginSchema)
  .handler(async ({ data }) => {
    // TODO: 実際のDB検索に置き換える
    // const user = await db.users.findUnique({
    //   where: { email: data.email },
    // })

    // 仮のユーザーデータ（開発用）
    const user = {
      id: '1',
      email: data.email,
      passwordHash: await bcrypt.hash('password123', 12),
      name: 'Test User',
      role: 'user' as const,
    }

    if (!user) {
      throw new Error('メールアドレスまたはパスワードが正しくありません')
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash)

    if (!validPassword) {
      throw new Error('メールアドレスまたはパスワードが正しくありません')
    }

    // セッションに保存
    const session = await useAppSession()
    await session.update({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // ダッシュボードにリダイレクト
    throw redirect({ to: '/dashboard' })
  })

/**
 * ログアウト処理
 */
export const logoutFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    const session = await useAppSession()
    await session.clear()

    // ログインページにリダイレクト
    throw redirect({ to: '/login' })
  })

/**
 * 現在のユーザー情報を取得
 */
export const getCurrentUserFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const session = await useAppSession()

    if (!session.data?.userId) {
      return null
    }

    // TODO: 実際のDB検索に置き換える
    // const user = await db.users.findUnique({
    //   where: { id: session.data.userId },
    //   select: {
    //     id: true,
    //     email: true,
    //     name: true,
    //     role: true,
    //   },
    // })

    // 仮のユーザーデータ（開発用）
    const user = {
      id: session.data.userId,
      email: session.data.email,
      name: 'Test User',
      role: session.data.role,
    }

    return user
  })

/**
 * ユーザー登録処理
 */
export const registerFn = createServerFn({ method: 'POST' })
  .inputValidator(RegisterSchema)
  .handler(async ({ data }) => {
    // TODO: 実際のDB検索に置き換える
    // const existing = await db.users.findUnique({
    //   where: { email: data.email },
    // })

    const existing = null // 仮

    if (existing) {
      throw new Error('このメールアドレスは既に登録されています')
    }

    // パスワードをハッシュ化（12 rounds推奨）
    const passwordHash = await bcrypt.hash(data.password, 12)

    // TODO: 実際のDB作成に置き換える
    // const user = await db.users.create({
    //   data: {
    //     email: data.email,
    //     name: data.name,
    //     passwordHash,
    //     role: 'user',
    //   },
    // })

    const user = {
      id: '1',
      email: data.email,
      name: data.name,
      passwordHash,
      role: 'user' as const,
    }

    // セッションに保存
    const session = await useAppSession()
    await session.update({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // ダッシュボードにリダイレクト
    throw redirect({ to: '/dashboard' })
  })
