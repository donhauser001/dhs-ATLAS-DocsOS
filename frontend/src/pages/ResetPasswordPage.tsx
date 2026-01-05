/**
 * ResetPasswordPage - 重置密码页面
 * Phase 4.2: Token 验证和密码更新
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthLayout, PasswordInput, PasswordStrengthMeter } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { verifyResetToken, resetPassword } from '@/api/auth';
import { getUserSettings } from '@/api/user-settings';

type PageState = 'verifying' | 'invalid' | 'valid' | 'success';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  
  // 页面状态
  const [pageState, setPageState] = useState<PageState>('verifying');
  const [email, setEmail] = useState('');
  
  // 表单状态
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 密码策略
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecial: true,
  });
  
  // 验证 Token
  useEffect(() => {
    async function verify() {
      if (!token) {
        setPageState('invalid');
        return;
      }
      
      try {
        const result = await verifyResetToken(token);
        
        if (result.valid) {
          setEmail(result.email || '');
          setPageState('valid');
        } else {
          setPageState('invalid');
        }
      } catch {
        setPageState('invalid');
      }
    }
    
    verify();
  }, [token]);
  
  // 加载密码策略
  useEffect(() => {
    getUserSettings().then(settings => {
      setPasswordPolicy({
        minLength: settings.password.minLength,
        requireUppercase: settings.password.requireUppercase,
        requireLowercase: settings.password.requireLowercase,
        requireNumbers: settings.password.requireNumbers,
        requireSpecial: settings.password.requireSpecial,
      });
    }).catch(() => {
      // 使用默认策略
    });
  }, []);
  
  // 验证密码强度
  function isPasswordValid(): boolean {
    if (password.length < passwordPolicy.minLength) return false;
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) return false;
    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) return false;
    if (passwordPolicy.requireNumbers && !/[0-9]/.test(password)) return false;
    if (passwordPolicy.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    return true;
  }
  
  // 提交重置
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!isPasswordValid()) {
      setError('密码不符合安全要求');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    setSubmitting(true);
    
    try {
      await resetPassword(token!, password);
      setPageState('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : '重置失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }
  
  // 验证中
  if (pageState === 'verifying') {
    return (
      <AuthLayout title="验证链接">
        <div className="flex flex-col items-center py-8">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400 mb-4" />
          <p className="text-slate-600">正在验证重置链接...</p>
        </div>
      </AuthLayout>
    );
  }
  
  // 链接无效
  if (pageState === 'invalid') {
    return (
      <AuthLayout title="链接无效" showBackToLogin>
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h3 className="text-lg font-medium text-slate-900 mb-2">重置链接无效</h3>
          <p className="text-slate-600 mb-6">
            该链接可能已过期或已被使用。请重新申请密码重置。
          </p>
          
          <Link to="/forgot-password">
            <Button className="w-full">重新申请</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }
  
  // 重置成功
  if (pageState === 'success') {
    return (
      <AuthLayout title="重置成功">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          
          <h3 className="text-lg font-medium text-slate-900 mb-2">密码已重置</h3>
          <p className="text-slate-600 mb-6">
            您的密码已成功重置，请使用新密码登录。
          </p>
          
          <Button 
            className="w-full"
            onClick={() => navigate('/login')}
          >
            前往登录
          </Button>
        </div>
      </AuthLayout>
    );
  }
  
  // 重置表单
  return (
    <AuthLayout 
      title="设置新密码" 
      subtitle={email ? `为账户 ${email} 设置新密码` : '设置您的新密码'}
    >
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 新密码 */}
        <div className="space-y-2">
          <Label htmlFor="password">新密码</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入新密码"
            required
            autoFocus
            autoComplete="new-password"
          />
          <PasswordStrengthMeter 
            password={password}
            minLength={passwordPolicy.minLength}
            requireUppercase={passwordPolicy.requireUppercase}
            requireLowercase={passwordPolicy.requireLowercase}
            requireNumbers={passwordPolicy.requireNumbers}
            requireSpecial={passwordPolicy.requireSpecial}
          />
        </div>
        
        {/* 确认密码 */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">确认新密码</Label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="请再次输入新密码"
            required
            autoComplete="new-password"
            className={confirmPassword && password !== confirmPassword ? 'border-red-300' : ''}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-red-500">两次输入的密码不一致</p>
          )}
        </div>
        
        {/* 提交按钮 */}
        <Button
          type="submit"
          className="w-full h-11"
          disabled={!isPasswordValid() || password !== confirmPassword || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              重置中...
            </>
          ) : (
            '重置密码'
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}

