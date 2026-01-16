/**
 * RegisterPage - 注册页面
 * Phase 4.2: 表单验证、凭证唯一性校验、密码强度指示
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { AuthLayout, PasswordInput, PasswordStrengthMeter } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { register, validateCredential } from '@/api/auth';
import { getUserSettings } from '@/api/user-settings';
import { debounce } from '@/lib/utils';

interface FieldValidation {
  valid: boolean | null;
  checking: boolean;
  message?: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  // 表单状态
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  // 验证状态
  const [usernameValidation, setUsernameValidation] = useState<FieldValidation>({ valid: null, checking: false });
  const [emailValidation, setEmailValidation] = useState<FieldValidation>({ valid: null, checking: false });
  const [phoneValidation, setPhoneValidation] = useState<FieldValidation>({ valid: null, checking: false });
  
  // 密码策略
  const [passwordPolicy, setPasswordPolicy] = useState({
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecial: true,
  });
  
  // 提交状态
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requiresActivation, setRequiresActivation] = useState(false);
  
  // 如果已登录，重定向
  useEffect(() => {
    if (user) {
      navigate('/workspace', { replace: true });
    }
  }, [user, navigate]);
  
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
  
  // 防抖验证用户名
  const debouncedValidateUsername = useCallback(
    debounce(async (value: string) => {
      if (!value || value.length < 3) {
        setUsernameValidation({ valid: false, checking: false, message: '用户名至少3个字符' });
        return;
      }
      
      try {
        const result = await validateCredential('username', value);
        setUsernameValidation({ 
          valid: result.valid, 
          checking: false, 
          message: result.valid ? undefined : '用户名已被使用'
        });
      } catch {
        setUsernameValidation({ valid: null, checking: false });
      }
    }, 500),
    []
  );
  
  // 防抖验证邮箱
  const debouncedValidateEmail = useCallback(
    debounce(async (value: string) => {
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setEmailValidation({ valid: false, checking: false, message: '请输入有效的邮箱地址' });
        return;
      }
      
      try {
        const result = await validateCredential('email', value);
        setEmailValidation({ 
          valid: result.valid, 
          checking: false, 
          message: result.valid ? undefined : '邮箱已被注册'
        });
      } catch {
        setEmailValidation({ valid: null, checking: false });
      }
    }, 500),
    []
  );
  
  // 防抖验证手机号
  const debouncedValidatePhone = useCallback(
    debounce(async (value: string) => {
      if (!value) {
        setPhoneValidation({ valid: null, checking: false });
        return;
      }
      
      if (!/^1[3-9]\d{9}$/.test(value)) {
        setPhoneValidation({ valid: false, checking: false, message: '请输入有效的手机号码' });
        return;
      }
      
      try {
        const result = await validateCredential('phone', value);
        setPhoneValidation({ 
          valid: result.valid, 
          checking: false, 
          message: result.valid ? undefined : '手机号已被注册'
        });
      } catch {
        setPhoneValidation({ valid: null, checking: false });
      }
    }, 500),
    []
  );
  
  // 处理用户名变化
  function handleUsernameChange(value: string) {
    setUsername(value);
    if (value.length >= 3) {
      setUsernameValidation({ valid: null, checking: true });
      debouncedValidateUsername(value);
    } else {
      setUsernameValidation({ valid: null, checking: false });
    }
  }
  
  // 处理邮箱变化
  function handleEmailChange(value: string) {
    setEmail(value);
    if (value.includes('@')) {
      setEmailValidation({ valid: null, checking: true });
      debouncedValidateEmail(value);
    } else {
      setEmailValidation({ valid: null, checking: false });
    }
  }
  
  // 处理手机号变化
  function handlePhoneChange(value: string) {
    setPhone(value);
    if (value.length >= 11) {
      setPhoneValidation({ valid: null, checking: true });
      debouncedValidatePhone(value);
    } else {
      setPhoneValidation({ valid: null, checking: false });
    }
  }
  
  // 验证密码强度
  function isPasswordValid(): boolean {
    if (password.length < passwordPolicy.minLength) return false;
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) return false;
    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) return false;
    if (passwordPolicy.requireNumbers && !/[0-9]/.test(password)) return false;
    if (passwordPolicy.requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
    return true;
  }
  
  // 检查表单是否可提交
  function canSubmit(): boolean {
    if (!username || !email || !password || !confirmPassword) return false;
    if (usernameValidation.valid === false || usernameValidation.checking) return false;
    if (emailValidation.valid === false || emailValidation.checking) return false;
    if (phone && (phoneValidation.valid === false || phoneValidation.checking)) return false;
    if (!isPasswordValid()) return false;
    if (password !== confirmPassword) return false;
    return true;
  }
  
  // 提交注册
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!canSubmit()) return;
    
    setSubmitting(true);
    
    try {
      const result = await register({
        username,
        email,
        phone: phone || undefined,
        password,
        name: name || undefined,
      });
      
      setSuccess(true);
      setRequiresActivation(result.requires_activation);
      
      // 根据是否需要激活决定跳转
      if (result.requires_activation) {
        // 显示成功信息，用户需要激活
      } else {
        // 直接跳转到登录页
        setTimeout(() => {
          navigate('/login', { state: { message: '注册成功，请登录' } });
        }, 2000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '注册失败');
    } finally {
      setSubmitting(false);
    }
  }
  
  // 渲染验证图标
  function renderValidationIcon(validation: FieldValidation) {
    if (validation.checking) {
      return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />;
    }
    if (validation.valid === true) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (validation.valid === false) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  }
  
  // 成功状态
  if (success) {
    return (
      <AuthLayout title="注册成功" showBackToLogin>
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          
          {requiresActivation ? (
            <>
              <h3 className="text-lg font-medium text-slate-900 mb-2">请验证您的邮箱</h3>
              <p className="text-slate-600 mb-4">
                我们已向 <span className="font-medium">{email}</span> 发送了一封激活邮件。
                请点击邮件中的链接完成账户激活。
              </p>
              <Link 
                to="/pending-activation" 
                state={{ email }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                没收到邮件？重新发送
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-slate-900 mb-2">欢迎加入 ATLAS</h3>
              <p className="text-slate-600 mb-4">
                您的账户已创建成功，正在跳转到登录页面...
              </p>
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" />
            </>
          )}
        </div>
      </AuthLayout>
    );
  }
  
  return (
    <AuthLayout title="创建账户" subtitle="注册一个新的 ATLAS 账户" maxWidth="lg">
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 用户名 */}
          <div className="space-y-2">
            <Label htmlFor="username">
              用户名 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="3-20个字符，字母数字下划线"
                required
                autoComplete="username"
                className={usernameValidation.valid === false ? 'border-red-300 focus:border-red-500' : ''}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {renderValidationIcon(usernameValidation)}
              </div>
            </div>
            {usernameValidation.message && (
              <p className="text-xs text-red-500">{usernameValidation.message}</p>
            )}
          </div>
          
          {/* 显示名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">显示名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="可选，您希望显示的名称"
              autoComplete="name"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 邮箱 */}
          <div className="space-y-2">
            <Label htmlFor="email">
              邮箱 <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="用于接收通知和找回密码"
                required
                autoComplete="email"
                className={emailValidation.valid === false ? 'border-red-300 focus:border-red-500' : ''}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {renderValidationIcon(emailValidation)}
              </div>
            </div>
            {emailValidation.message && (
              <p className="text-xs text-red-500">{emailValidation.message}</p>
            )}
          </div>
          
          {/* 手机号 */}
          <div className="space-y-2">
            <Label htmlFor="phone">手机号</Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="可选，用于接收短信通知"
                autoComplete="tel"
                className={phoneValidation.valid === false ? 'border-red-300 focus:border-red-500' : ''}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {renderValidationIcon(phoneValidation)}
              </div>
            </div>
            {phoneValidation.message && (
              <p className="text-xs text-red-500">{phoneValidation.message}</p>
            )}
          </div>
        </div>
        
        {/* 密码 */}
        <div className="space-y-2">
          <Label htmlFor="password">
            密码 <span className="text-red-500">*</span>
          </Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请设置密码"
            required
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
          <Label htmlFor="confirmPassword">
            确认密码 <span className="text-red-500">*</span>
          </Label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="请再次输入密码"
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
          className="w-full h-11 text-base"
          disabled={!canSubmit() || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              注册中...
            </>
          ) : (
            '创建账户'
          )}
        </Button>
        
        {/* 服务条款 */}
        <p className="text-xs text-slate-500 text-center">
          点击"创建账户"即表示您同意我们的
          <a href="#" className="text-blue-600 hover:underline">服务条款</a>
          和
          <a href="#" className="text-blue-600 hover:underline">隐私政策</a>
        </p>
      </form>
      
      {/* 登录链接 */}
      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-600">
          已有账户？{' '}
          <Link 
            to="/login" 
            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            立即登录
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}





