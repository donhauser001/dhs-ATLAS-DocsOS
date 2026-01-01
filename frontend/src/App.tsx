import { useEffect } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { GenesisPage } from './pages/genesis'
import { WorkspacePage, DocumentPage } from './pages/workspace'
import { UsersPage, UserDetailPage } from './pages/users'
import { LoginPage } from './pages/LoginPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { TokenProvider } from '@/components/tokens/TokenProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import '@/styles/tokens.css'

function Home() {
  const { user } = useAuthStore()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">ATLAS Runtime</h1>
        <p className="text-xl text-slate-400 mb-8">ADL 语言的运行环境</p>
        <div className="space-y-2 text-slate-500">
          <p>Phase 1 / Workspace</p>
          <p className="text-sm">多文档工作空间 + 可检索 + 可控写入</p>
        </div>
        <div className="mt-12 flex gap-4 justify-center">
          {user ? (
            <Link to="/workspace">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                进入 Workspace
              </Button>
            </Link>
          ) : (
            <Link to="/login">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                登录
              </Button>
            </Link>
          )}
          <Link to="/genesis">
            <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
              Genesis (Phase 0)
            </Button>
          </Link>
        </div>
        
        {user && (
          <div className="mt-8 text-slate-400">
            <span>欢迎, {user.name}</span>
            <span className="mx-2">|</span>
            <span className="text-slate-500">{user.role}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function App() {
  const { checkAuth } = useAuthStore()
  
  // 启动时检查认证状态
  useEffect(() => {
    checkAuth()
  }, [checkAuth])
  
  return (
    <TokenProvider>
      <TooltipProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/genesis" element={<GenesisPage />} />
          <Route path="/workspace" element={
            <ProtectedRoute>
              <WorkspacePage />
            </ProtectedRoute>
          } />
          <Route path="/workspace/*" element={
            <ProtectedRoute>
              <DocumentPage />
            </ProtectedRoute>
          } />
          {/* Phase 3.1: 用户管理页面 */}
          <Route path="/users" element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          } />
          <Route path="/users/:id" element={
            <ProtectedRoute>
              <UserDetailPage />
            </ProtectedRoute>
          } />
        </Routes>
      </TooltipProvider>
    </TokenProvider>
  )
}

export default App
