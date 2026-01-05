/**
 * LoginPage - 登录页面
 * Phase 4.2: 支持多凭证类型、状态处理、记住我功能
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { AuthLayout, PasswordInput } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Mail, User, Phone } from 'lucide-react';

type CredentialType = 'username' | 'email' | 'phone';

interface CredentialTypeOption {
  type: CredentialType;
  label: string;
  icon: typeof User;
  placeholder: string;
  inputType: string;
}

const credentialTypes: CredentialTypeOption[] = [
  { type: 'username', label: '用户名', icon: User, placeholder: '请输入用户名', inputType: 'text' },
  { type: 'email', label: '邮箱', icon: Mail, placeholder: '请输入邮箱地址', inputType: 'email' },
  { type: 'phone', label: '手机号', icon: Phone, placeholder: '请输入手机号码', inputType: 'tel' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error, login, clearError } = useAuthStore();
  
  const [credentialType, setCredentialType] = useState<CredentialType>('username');
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // 获取重定向目标
  const from = (location.state as { from?: string })?.from || '/workspace';
  
  // 如果已登录，重定向
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  // 从 localStorage 恢复记住的用户名
  useEffect(() => {
    const remembered = localStorage.getItem('atlas_remembered_credential');
    if (remembered) {
      const parsed = JSON.parse(remembered);
      setCredentialType(parsed.type || 'username');
      setCredential(parsed.value || '');
      setRememberMe(true);
    }
  }, []);

  // 根据错误类型显示不同的提示
  function getErrorDisplay() {
    if (!error) return null;
    
    // 检测账户状态相关错误
    if (error.includes('pending') || error.includes('待激活')) {
      return {
        type: 'pending',
        message: '您的账户尚未激活',
        action: (
          <Link to="/pending-activation" className="text-blue-600 hover:underline text-sm">
            前往激活 →
          </Link>
        ),
      };
    }
    
    if (error.includes('disabled') || error.includes('已禁用')) {
      return {
        type: 'disabled',
        message: '您的账户已被禁用',
        action: (
          <Link to="/account-status/disabled" className="text-blue-600 hover:underline text-sm">
            查看详情 →
          </Link>
        ),
      };
    }
    
    if (error.includes('locked') || error.includes('已锁定')) {
      return {
        type: 'locked',
        message: '您的账户已被锁定',
        action: (
          <Link to="/account-status/locked" className="text-blue-600 hover:underline text-sm">
            查看详情 →
          </Link>
        ),
      };
    }
    
    if (error.includes('expired') || error.includes('已过期')) {
      return {
        type: 'expired',
        message: '您的账户已过期',
        action: (
          <Link to="/account-status/expired" className="text-blue-600 hover:underline text-sm">
            查看详情 →
          </Link>
        ),
      };
    }
    
    return {
      type: 'error',
      message: error.replace('Error: ', ''),
      action: null,
    };
  }
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    
    // 记住登录凭证
    if (rememberMe) {
      localStorage.setItem('atlas_remembered_credential', JSON.stringify({
        type: credentialType,
        value: credential,
      }));
    } else {
      localStorage.removeItem('atlas_remembered_credential');
    }
    
    const success = await login(credential, password, credentialType);
    setSubmitting(false);
    
    if (success) {
      navigate(from, { replace: true });
    }
  }
  
  const currentCredentialOption = credentialTypes.find(t => t.type === credentialType)!;
  const errorDisplay = getErrorDisplay();
  
  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </AuthLayout>
    );
  }
  
  return (
    <AuthLayout title="欢迎回来" subtitle="登录您的 ATLAS 账户">
      {/* 错误提示 */}
      {errorDisplay && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          errorDisplay.type === 'error' 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
            errorDisplay.type === 'error' ? 'text-red-500' : 'text-amber-500'
          }`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              errorDisplay.type === 'error' ? 'text-red-700' : 'text-amber-700'
            }`}>
              {errorDisplay.message}
            </p>
            {errorDisplay.action && (
              <div className="mt-2">{errorDisplay.action}</div>
            )}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 凭证类型切换 */}
        <div className="flex rounded-lg bg-slate-100 p-1">
          {credentialTypes.map((option) => (
            <button
              key={option.type}
              type="button"
              onClick={() => {
                setCredentialType(option.type);
                setCredential('');
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                credentialType === option.type
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <option.icon className="h-4 w-4" />
              {option.label}
            </button>
          ))}
        </div>
        
        {/* 凭证输入 */}
        <div className="space-y-2">
          <Label htmlFor="credential">{currentCredentialOption.label}</Label>
          <Input
            id="credential"
            type={currentCredentialOption.inputType}
            value={credential}
            onChange={(e) => setCredential(e.target.value)}
            placeholder={currentCredentialOption.placeholder}
            required
            autoFocus
            autoComplete={credentialType === 'email' ? 'email' : 'username'}
          />
        </div>
        
        {/* 密码输入 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">密码</Label>
            <Link 
              to="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              忘记密码？
            </Link>
          </div>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            required
            autoComplete="current-password"
          />
        </div>
        
        {/* 记住我 */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <Label 
            htmlFor="remember" 
            className="text-sm text-slate-600 cursor-pointer"
          >
            记住我
          </Label>
        </div>
        
        {/* 登录按钮 */}
        <Button
          type="submit"
          className="w-full h-11 text-base"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              登录中...
            </>
          ) : (
            '登录'
          )}
        </Button>
      </form>
      
      {/* 注册链接 */}
      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-600">
          还没有账户？{' '}
          <Link 
            to="/register" 
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            立即注册
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
