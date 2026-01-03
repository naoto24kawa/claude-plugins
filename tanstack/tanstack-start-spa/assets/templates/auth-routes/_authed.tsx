// app/routes/_authed.tsx
// 認証が必要なページグループのレイアウト
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/start'
import { getCurrentUserFn, logoutFn } from '~/lib/auth'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn()

    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    return { user }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  const { user } = Route.useRouteContext()
  const logout = useServerFn(logoutFn)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      // logoutFnがredirectをthrowするため、ここには通常到達しない
      console.error('ログアウトエラー:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold">MyApp</h1>
              <div className="flex gap-4">
                <a href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  ダッシュボード
                </a>
                <a href="/settings" className="text-gray-600 hover:text-gray-900">
                  設定
                </a>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                ログアウト
              </button>
            </div>
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
