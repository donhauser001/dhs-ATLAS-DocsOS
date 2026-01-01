/**
 * 用户列表页
 * Phase 3.1: Principal + Profile 用户体系
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Search, RefreshCw, Briefcase, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  fetchPrincipals, 
  searchPrincipals, 
  rebuildPrincipalIndex,
  type PrincipalEntry 
} from '@/api/principals';

export function UsersPage() {
  const [principals, setPrincipals] = useState<PrincipalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);

  // 加载用户列表
  useEffect(() => {
    loadPrincipals();
  }, []);

  async function loadPrincipals() {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchPrincipals();
      setPrincipals(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  // 搜索
  async function handleSearch() {
    if (!searchQuery.trim()) {
      loadPrincipals();
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      const results = await searchPrincipals(searchQuery);
      setPrincipals(results);
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSearching(false);
    }
  }

  // 重建索引
  async function handleRebuildIndex() {
    setIsRebuilding(true);
    setError(null);
    
    try {
      await rebuildPrincipalIndex();
      await loadPrincipals();
    } catch (e) {
      setError(String(e));
    } finally {
      setIsRebuilding(false);
    }
  }

  // 按 Enter 搜索
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">用户管理</h1>
              <p className="text-sm text-slate-500">Principal + Profile 用户体系</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRebuildIndex}
                disabled={isRebuilding}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRebuilding ? 'animate-spin' : ''}`} />
                {isRebuilding ? '重建中...' : '重建索引'}
              </Button>
              <Link to="/workspace">
                <Button variant="ghost" size="sm">
                  返回 Workspace
                </Button>
              </Link>
            </div>
          </div>
          
          {/* 搜索栏 */}
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索用户（姓名、邮箱、手机）..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? '搜索中...' : '搜索'}
            </Button>
            {searchQuery && (
              <Button 
                variant="ghost" 
                onClick={() => { setSearchQuery(''); loadPrincipals(); }}
              >
                清除
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
          </div>
        ) : principals.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>暂无用户数据</p>
            <p className="text-sm mt-2">请先重建索引或添加用户文档</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {principals.map((principal) => (
              <Link 
                key={principal.id} 
                to={`/users/${principal.id}`}
                className="block"
              >
                <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-indigo-600" />
                      </div>
                      
                      {/* Info */}
                      <div>
                        <h3 className="font-medium text-slate-900">
                          {principal.display_name}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-4 text-sm text-slate-500">
                          {principal.emails.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {principal.emails[0]}
                            </span>
                          )}
                          {principal.phones.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {principal.phones[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Profile Count */}
                    <div className="flex items-center gap-2">
                      {principal.profile_count > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm text-slate-600">
                          <Briefcase className="w-4 h-4" />
                          {principal.profile_count} 档案
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs ${
                        principal.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {principal.status === 'active' ? '活跃' : principal.status}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Stats */}
        {!loading && principals.length > 0 && (
          <div className="mt-6 text-center text-sm text-slate-500">
            共 {principals.length} 个用户
          </div>
        )}
      </main>
    </div>
  );
}

export default UsersPage;

