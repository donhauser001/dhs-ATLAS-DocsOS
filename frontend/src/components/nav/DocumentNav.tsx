/**
 * DocumentNav - 多文档导航
 * 
 * Phase 3.0: UI 内功
 * 
 * 特点：
 * - 树形文档列表
 * - 快速切换文档
 * - 搜索过滤
 * - 收藏/最近访问
 */

import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Search,
  Clock,
  Plus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// ============================================================
// 类型定义
// ============================================================

export interface DocumentInfo {
  path: string;
  title: string;
  type: string;
  blocksCount: number;
  updatedAt: string;
}

interface DocumentNavProps {
  /** 文档列表 */
  documents: DocumentInfo[];
  /** 当前选中的文档路径 */
  currentPath?: string;
  /** 文档点击回调 */
  onDocumentSelect: (path: string) => void;
  /** 新建文档回调 */
  onCreateDocument?: () => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: TreeNode[];
  document?: DocumentInfo;
}

// ============================================================
// 主组件
// ============================================================

export function DocumentNav({
  documents,
  currentPath,
  onDocumentSelect,
  onCreateDocument,
}: DocumentNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['genesis'])
  );
  
  // 构建文件树
  const tree = useMemo(() => {
    return buildTree(documents);
  }, [documents]);
  
  // 过滤文档
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    
    const query = searchQuery.toLowerCase();
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.path.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);
  
  // 切换文件夹展开
  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  return (
    <div
      className="document-nav h-full flex flex-col"
      style={{
        backgroundColor: `var(--ui-nav-sidebar-bg)`,
        color: `var(--ui-nav-sidebar-text)`,
      }}
    >
      {/* 头部 */}
      <div className="nav-header p-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Folder size={16} />
          文档导航
        </h3>
        
        {/* 搜索框 */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: `var(--ui-nav-sidebar-text)` }}
          />
          <Input
            type="text"
            placeholder="搜索文档..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-sm"
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: `var(--ui-nav-sidebar-text)`,
            }}
          />
        </div>
      </div>
      
      {/* 快捷访问 */}
      <div className="quick-access p-3 border-b border-slate-700">
        <div className="flex items-center gap-2 text-xs opacity-60 mb-2">
          <Clock size={12} />
          快捷访问
        </div>
        <div className="space-y-1">
          {documents.slice(0, 3).map((doc) => (
            <QuickAccessItem
              key={doc.path}
              document={doc}
              isActive={doc.path === currentPath}
              onClick={() => onDocumentSelect(doc.path)}
            />
          ))}
        </div>
      </div>
      
      {/* 文档树 */}
      <div className="document-tree flex-1 overflow-y-auto p-2">
        {searchQuery.trim() ? (
          // 搜索结果
          <div className="search-results space-y-1">
            {filteredDocuments.map((doc) => (
              <TreeItem
                key={doc.path}
                node={{
                  name: doc.title,
                  path: doc.path,
                  isFolder: false,
                  children: [],
                  document: doc,
                }}
                level={0}
                isSelected={doc.path === currentPath}
                onSelect={() => onDocumentSelect(doc.path)}
              />
            ))}
            {filteredDocuments.length === 0 && (
              <div className="text-center py-4 text-sm opacity-50">
                无匹配结果
              </div>
            )}
          </div>
        ) : (
          // 树形视图
          <TreeView
            nodes={tree}
            level={0}
            currentPath={currentPath}
            expandedFolders={expandedFolders}
            onToggleFolder={toggleFolder}
            onDocumentSelect={onDocumentSelect}
          />
        )}
      </div>
      
      {/* 新建按钮 */}
      {onCreateDocument && (
        <div className="nav-footer p-3 border-t border-slate-700">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm"
            onClick={onCreateDocument}
            style={{
              color: `var(--ui-nav-sidebar-text)`,
            }}
          >
            <Plus size={14} className="mr-2" />
            新建文档
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 树形视图
// ============================================================

interface TreeViewProps {
  nodes: TreeNode[];
  level: number;
  currentPath?: string;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
  onDocumentSelect: (path: string) => void;
}

function TreeView({
  nodes,
  level,
  currentPath,
  expandedFolders,
  onToggleFolder,
  onDocumentSelect,
}: TreeViewProps) {
  return (
    <div className="tree-view">
      {nodes.map((node) => (
        <div key={node.path}>
          {node.isFolder ? (
            <>
              <FolderItem
                node={node}
                level={level}
                isExpanded={expandedFolders.has(node.path)}
                onToggle={() => onToggleFolder(node.path)}
              />
              {expandedFolders.has(node.path) && node.children.length > 0 && (
                <TreeView
                  nodes={node.children}
                  level={level + 1}
                  currentPath={currentPath}
                  expandedFolders={expandedFolders}
                  onToggleFolder={onToggleFolder}
                  onDocumentSelect={onDocumentSelect}
                />
              )}
            </>
          ) : (
            <TreeItem
              node={node}
              level={level}
              isSelected={node.path === currentPath}
              onSelect={() => onDocumentSelect(node.path)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 树节点组件
// ============================================================

function FolderItem({
  node,
  level,
  isExpanded,
  onToggle,
}: {
  node: TreeNode;
  level: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      className="folder-item w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-white/10 transition-colors"
      style={{ paddingLeft: `${level * 16 + 8}px` }}
      onClick={onToggle}
    >
      {isExpanded ? (
        <>
          <ChevronDown size={14} />
          <FolderOpen size={14} style={{ color: '#FBBF24' }} />
        </>
      ) : (
        <>
          <ChevronRight size={14} />
          <Folder size={14} style={{ color: '#FBBF24' }} />
        </>
      )}
      <span>{node.name}</span>
    </button>
  );
}

function TreeItem({
  node,
  level,
  isSelected,
  onSelect,
}: {
  node: TreeNode;
  level: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className="tree-item w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors"
      style={{
        paddingLeft: `${level * 16 + 8}px`,
        backgroundColor: isSelected ? `var(--ui-nav-sidebar-active-bg)` : 'transparent',
        color: isSelected ? `var(--ui-nav-sidebar-active-text)` : `var(--ui-nav-sidebar-text)`,
      }}
      onClick={onSelect}
    >
      <FileText size={14} style={{ color: `var(--color-brand-primary)` }} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

function QuickAccessItem({
  document,
  isActive,
  onClick,
}: {
  document: DocumentInfo;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors"
      style={{
        backgroundColor: isActive ? `var(--ui-nav-sidebar-active-bg)` : 'transparent',
        color: isActive ? `var(--ui-nav-sidebar-active-text)` : `var(--ui-nav-sidebar-text)`,
      }}
      onClick={onClick}
    >
      <FileText size={12} />
      <span className="truncate">{document.title}</span>
    </button>
  );
}

// ============================================================
// 辅助函数
// ============================================================

function buildTree(documents: DocumentInfo[]): TreeNode[] {
  const root: TreeNode[] = [];
  const folderMap = new Map<string, TreeNode>();
  
  for (const doc of documents) {
    const parts = doc.path.split('/');
    let currentPath = '';
    let currentLevel = root;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      
      if (i === parts.length - 1) {
        // 文件
        currentLevel.push({
          name: doc.title || part.replace('.md', ''),
          path: doc.path,
          isFolder: false,
          children: [],
          document: doc,
        });
      } else {
        // 文件夹
        let folder = folderMap.get(currentPath);
        if (!folder) {
          folder = {
            name: part,
            path: currentPath,
            isFolder: true,
            children: [],
          };
          folderMap.set(currentPath, folder);
          currentLevel.push(folder);
        }
        currentLevel = folder.children;
      }
    }
  }
  
  // 排序：文件夹在前，文件在后
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    }).map((node) => ({
      ...node,
      children: sortNodes(node.children),
    }));
  };
  
  return sortNodes(root);
}

export default DocumentNav;

