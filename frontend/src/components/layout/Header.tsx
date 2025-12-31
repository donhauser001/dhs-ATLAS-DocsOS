import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth'
import { usePageStore } from '@/stores/page'
import { useChatStore } from '@/stores/chat'
import { logout as logoutApi } from '@/api/auth'
import { Search, Bell, LogOut, User, ChevronDown, Shield, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { title, subtitle } = usePageStore()
  const { isOpen: chatOpen, togglePanel: toggleChat } = useChatStore()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleLogout = async () => {
    try {
      await logoutApi()
    } catch {
      // ignore
    }
    logout()
    navigate('/login')
  }

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      admin: '管理员',
      member: '成员',
    }
    return map[role] || role
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background/50 px-6">
      {/* Left: Title */}
      <div className="flex items-center gap-4">
        {title && (
          <>
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <>
                <div className="h-5 w-px bg-border" />
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </>
            )}
          </>
        )}
      </div>

      {/* Right: Search + Actions + User */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索..."
            className="pl-9 h-9 bg-muted/50 border-transparent focus:border-border"
          />
        </div>

        {/* AI Assistant Button */}
        <Button
          variant={chatOpen ? 'default' : 'ghost'}
          size="sm"
          onClick={toggleChat}
          className={cn(
            'gap-2 h-9 px-3',
            chatOpen && 'bg-primary text-primary-foreground'
          )}
          title="AI 助手 (⌘J)"
        >
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">AI 助手</span>
          <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘J
          </kbd>
        </Button>

        {/* Divider */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            3
          </span>
        </Button>

        {/* User Dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-2 h-9"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {user?.name?.[0] || <User className="h-3.5 w-3.5" />}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-sm font-medium leading-none">{user?.name}</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border bg-popover shadow-lg overflow-hidden">
                <div className="p-3 border-b bg-muted/30">
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                  <Badge variant="secondary" className="mt-2">
                    <Shield className="h-3 w-3 mr-1" />
                    {user?.role && getRoleLabel(user.role)}
                  </Badge>
                </div>
                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    退出登录
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
