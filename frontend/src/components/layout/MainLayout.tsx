import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ChatPanel } from '@/components/chat'
import { useChatStore } from '@/stores/chat'
import { useCmdKey } from '@/hooks/useHotkeys'
import { cn } from '@/lib/utils'

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed'

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    return saved === 'true'
  })

  const chatOpen = useChatStore((s) => s.isOpen)
  const toggleChat = useChatStore((s) => s.togglePanel)

  // 快捷键：Cmd/Ctrl + J 唤出/关闭 AI 助手（在输入框中也可用）
  useCmdKey('j', () => toggleChat(), { enableOnInput: true })

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed))
  }, [sidebarCollapsed])

  return (
    <div className="flex h-screen bg-muted/50 p-8 gap-4">
      {/* Floating Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden rounded-2xl bg-background shadow-sm border transition-all duration-300',
          chatOpen && 'mr-0'
        )}
      >
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      {/* AI Chat Panel */}
      <ChatPanel />
    </div>
  )
}
