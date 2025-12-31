/**
 * QueryPanel - 查询面板组件
 * 
 * 支持：
 * - 按 type 过滤
 * - 全文搜索（标题包含）
 * - 快捷键 Cmd+K 打开
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Loader2 } from 'lucide-react';
import { executeQuery, type QueryResponse } from '@/api/query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface QueryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BLOCK_TYPES = [
  { value: '', label: '全部类型' },
  { value: 'service', label: '服务' },
  { value: 'category', label: '分类' },
  { value: 'project', label: '项目' },
  { value: 'milestone', label: '里程碑' },
  { value: 'contact', label: '联系人' },
];

export function QueryPanel({ open, onOpenChange }: QueryPanelProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [results, setResults] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);
  
  // 执行搜索
  async function handleSearch() {
    if (!searchText.trim() && !selectedType) {
      setResults(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const query: Record<string, unknown> = {};
      
      if (selectedType) {
        query.type = selectedType;
      }
      
      if (searchText.trim()) {
        query.filter = {
          title: { $contains: searchText.trim() }
        };
      }
      
      query.limit = 20;
      
      const response = await executeQuery(query);
      setResults(response);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }
  
  // 键盘事件处理
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  }
  
  // 点击结果跳转
  function handleResultClick(document: string, anchor: string) {
    onOpenChange(false);
    navigate(`/workspace/${document}#${anchor}`);
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            搜索文档
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-4">
          {/* 搜索输入 */}
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="搜索标题..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm bg-background"
            >
              {BLOCK_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}
          
          {/* 搜索结果 */}
          {results && (
            <div className="flex-1 overflow-auto">
              <div className="text-sm text-muted-foreground mb-2">
                找到 {results.count} 个结果（{results.query_time_ms}ms）
              </div>
              
              {results.results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  未找到匹配的结果
                </div>
              ) : (
                <div className="border rounded-lg divide-y max-h-[400px] overflow-auto">
                  {results.results.map((result) => (
                    <button
                      key={`${result.document}#${result.anchor}`}
                      onClick={() => handleResultClick(result.document, result.anchor)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {String(result.data.title || result.anchor)}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {result.document} #{result.anchor}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded flex-shrink-0">
                        {String(result.data.type || 'unknown')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

