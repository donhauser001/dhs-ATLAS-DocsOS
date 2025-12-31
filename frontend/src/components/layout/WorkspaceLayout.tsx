/**
 * WorkspaceLayout - 三栏布局容器
 * 
 * 布局结构：
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Header                                                      │
 * ├────────────┬────────────────────────────────┬───────────────┤
 * │  Sidebar   │         Content                │   Anchors     │
 * │  (240px)   │         (flex-1)               │   (220px)     │
 * └────────────┴────────────────────────────────┴───────────────┘
 */

import { ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, FolderOpen, Search, LogOut, User } from 'lucide-react';
import { QueryPanel } from '@/components/query/QueryPanel';
import { useAuthStore } from '@/stores/auth-store';

interface WorkspaceLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
  anchors?: ReactNode;
}

export function WorkspaceLayout({ sidebar, content, anchors }: WorkspaceLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  
  // 全局快捷键 Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  async function handleLogout() {
    await logout();
    navigate('/login');
  }
  
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="font-semibold text-lg tracking-tight">
            ATLAS
          </Link>
          <span className="text-muted-foreground text-sm">Workspace</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="gap-2"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">搜索</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 text-xs">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
          
          {user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l">
              <div className="flex items-center gap-1 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{user.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {user.role}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 border-r flex-shrink-0 flex flex-col">
          <div className="p-3 border-b">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <FolderOpen className="h-4 w-4" />
              <span>文档目录</span>
            </div>
          </div>
          <ScrollArea className="flex-1">
            {sidebar}
          </ScrollArea>
        </aside>
        
        {/* Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            {content}
          </ScrollArea>
        </main>
        
        {/* Anchors Panel (optional) */}
        {anchors && (
          <aside className="w-56 border-l flex-shrink-0 flex flex-col">
            <div className="p-3 border-b">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>文档结构</span>
              </div>
            </div>
            <ScrollArea className="flex-1">
              {anchors}
            </ScrollArea>
          </aside>
        )}
      </div>
      
      {/* Query Panel */}
      <QueryPanel open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
