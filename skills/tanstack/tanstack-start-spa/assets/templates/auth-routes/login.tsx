// app/routes/login.tsx
// ログインページ
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/start'
import { loginFn, getCurrentUserFn } from '~/lib/auth'
import { z } from 'zod'
import React from 'react'

const LoginSearchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: LoginSearchSchema,
  beforeLoad: async ({ search }) => {
    const user = await getCurrentUserFn()

    // 既にログイン済みの場合はリダイレクト
    if (user) {
      throw redirect({ to: search.redirect || '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const search = Route.useSearch()
  const login = useServerFn(loginFn)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)

    try {
      await login({
        data: {
          email: formData.get('email') as string,
          password: formData.get('password') as string,
        },
      })

      // loginFnがredirectをthrowするため、通常ここには到達しない
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('ログインに失敗しました')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 space-y-4">
          <h1 className="text-2xl font-bold text-center mb-6">ログイン</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            アカウントをお持ちでない方は{' '}
            <a href="/register" className="text-blue-600 hover:underline">
              新規登録
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
