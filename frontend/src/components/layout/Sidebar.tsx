import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuthStore } from '@/stores/auth'
import {
  Home,
  FolderKanban,
  ClipboardList,
  Settings,
  FileText,
  Receipt,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  Building2,
  Briefcase,
  Building,
  CircleDollarSign,
  Package,
  Percent,
  FileStack,
} from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const navItems = [
  { to: '/', icon: Home, label: '首页' },
  { to: '/projects', icon: FolderKanban, label: '项目' },
  { to: '/tasks', icon: ClipboardList, label: '任务' },
]

const secondaryItems = [
  { to: '/proposals', icon: FileText, label: '提案', disabled: true },
  { to: '/finance', icon: Receipt, label: '财务', disabled: true },
]

const organizationItems = [
  { to: '/organization/employees', icon: Users, label: '员工列表' },
  { to: '/organization/departments', icon: Building2, label: '部门管理' },
  { to: '/organization/positions', icon: Briefcase, label: '职位设置' },
  { to: '/organization/company', icon: Building, label: '企业资料' },
]

const pricingItems = [
  { to: '/pricing/services', icon: Package, label: '服务清单' },
  { to: '/pricing/addons', icon: FileText, label: '附加项' },
  { to: '/pricing/policies', icon: Percent, label: '价格政策' },
  { to: '/pricing/templates', icon: FileStack, label: '报价模板', disabled: true },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.role === 'admin'
  const location = useLocation()
  const [orgExpanded, setOrgExpanded] = useState(
    location.pathname.startsWith('/organization')
  )
  const [pricingExpanded, setPricingExpanded] = useState(
    location.pathname.startsWith('/pricing')
  )

  const isOrgActive = location.pathname.startsWith('/organization')
  const isPricingActive = location.pathname.startsWith('/pricing')

  return (
    <aside
      className={cn(
        'flex flex-col rounded-2xl bg-background/80 backdrop-blur-xl border shadow-lg transition-all duration-300 shrink-0',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex h-14 items-center border-b border-border/50',
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            'rounded-xl bg-primary flex items-center justify-center',
            collapsed ? 'w-9 h-9 rounded-xl' : 'w-8 h-8'
          )}>
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          {!collapsed && (
            <span className="font-semibold text-base tracking-tight">ATLAS</span>
          )}
        </div>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 折叠状态下的展开按钮 - 放在底部设置上方 */}

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </nav>

        <div className="my-3 mx-3 h-px bg-border/50" />

        <nav className="space-y-1 px-2">
          {secondaryItems.map((item) => (
            <NavItem key={item.to} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Pricing Management */}
        <div className="my-3 mx-3 h-px bg-border/50" />
        <nav className="space-y-1 px-2">
          {collapsed ? (
            <NavLink
              to="/pricing/services"
              className={cn(
                'flex items-center justify-center rounded-xl p-2.5 text-sm font-medium transition-all',
                'hover:bg-accent hover:text-accent-foreground',
                isPricingActive
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'text-muted-foreground'
              )}
            >
              <CircleDollarSign className="h-[18px] w-[18px]" />
            </NavLink>
          ) : (
            <>
              <button
                onClick={() => setPricingExpanded(!pricingExpanded)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  'hover:bg-accent hover:text-accent-foreground',
                  isPricingActive
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <div className="flex items-center gap-3">
                  <CircleDollarSign className="h-[18px] w-[18px]" />
                  <span>服务定价</span>
                </div>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    pricingExpanded && 'rotate-180'
                  )}
                />
              </button>

              <div className={cn(
                'overflow-hidden transition-all duration-200',
                pricingExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
              )}>
                <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-border/50 pl-3">
                  {pricingItems.map((item) => (
                    <SubNavItem key={item.to} item={item} />
                  ))}
                </div>
              </div>
            </>
          )}
        </nav>

        {/* Organization Management - Admin Only */}
        {isAdmin && (
          <>
            <div className="my-3 mx-3 h-px bg-border/50" />
            <nav className="space-y-1 px-2">
              {collapsed ? (
                <NavLink
                  to="/organization/employees"
                  className={cn(
                    'flex items-center justify-center rounded-xl p-2.5 text-sm font-medium transition-all',
                    'hover:bg-accent hover:text-accent-foreground',
                    isOrgActive
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'text-muted-foreground'
                  )}
                >
                  <Building2 className="h-[18px] w-[18px]" />
                </NavLink>
              ) : (
                <>
                  <button
                    onClick={() => setOrgExpanded(!orgExpanded)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      'hover:bg-accent hover:text-accent-foreground',
                      isOrgActive
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-[18px] w-[18px]" />
                      <span>组织管理</span>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform duration-200',
                        orgExpanded && 'rotate-180'
                      )}
                    />
                  </button>

                  <div className={cn(
                    'overflow-hidden transition-all duration-200',
                    orgExpanded ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                  )}>
                    <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-border/50 pl-3">
                      {organizationItems.map((item) => (
                        <SubNavItem key={item.to} item={item} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </nav>
          </>
        )}
      </ScrollArea>

      {/* Bottom Section */}
      <div className="border-t border-border/50 p-2 space-y-1">
        {/* 折叠状态下的展开按钮 */}
        {collapsed && (
          <button
            onClick={onToggle}
            className="flex w-full items-center justify-center rounded-xl p-2.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            <ChevronRight className="h-[18px] w-[18px]" />
          </button>
        )}
        
        {/* Settings */}
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
              'hover:bg-accent hover:text-accent-foreground',
              isActive
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground',
              collapsed && 'justify-center px-2.5'
            )
          }
        >
          <Settings className="h-[18px] w-[18px]" />
          {!collapsed && <span>设置</span>}
        </NavLink>
      </div>
    </aside>
  )
}

// 主导航项
function NavItem({ 
  item, 
  collapsed 
}: { 
  item: { to: string; icon: React.ElementType; label: string; disabled?: boolean }
  collapsed: boolean 
}) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
          item.disabled
            ? 'pointer-events-none opacity-40'
            : 'hover:bg-accent hover:text-accent-foreground',
          isActive
            ? 'bg-accent text-accent-foreground shadow-sm'
            : 'text-muted-foreground',
          collapsed && 'justify-center px-2.5'
        )
      }
    >
      <item.icon className="h-[18px] w-[18px]" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  )
}

// 子导航项
function SubNavItem({ 
  item 
}: { 
  item: { to: string; icon: React.ElementType; label: string; disabled?: boolean }
}) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-medium transition-all',
          item.disabled
            ? 'pointer-events-none opacity-40'
            : 'hover:bg-accent/50 hover:text-accent-foreground',
          isActive
            ? 'bg-accent/70 text-accent-foreground'
            : 'text-muted-foreground'
        )
      }
    >
      <item.icon className="h-4 w-4" />
      <span>{item.label}</span>
    </NavLink>
  )
}
