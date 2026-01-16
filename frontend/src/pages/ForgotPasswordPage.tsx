/**
 * ForgotPasswordPage - 找回密码页面
 * Phase 4.2: 输入邮箱发送重置链接
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '@/api/auth';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }
    
    setSubmitting(true);
    
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }
  
  // 发送成功状态
  if (sent) {
    return (
      <AuthLayout title="查收邮件" showBackToLogin>
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          
          <h3 className="text-lg font-medium text-slate-900 mb-2">重置链接已发送</h3>
          <p className="text-slate-600 mb-6">
            我们已向 <span className="font-medium">{email}</span> 发送了密码重置链接。
            请检查您的收件箱（包括垃圾邮件文件夹）。
          </p>
          
          <div className="bg-slate-50 rounded-lg p-4 text-left text-sm text-slate-600 space-y-2">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              链接有效期为 1 小时
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              每个链接只能使用一次
            </p>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500 mb-3">没收到邮件？</p>
            <Button
              variant="outline"
              onClick={() => {
                setSent(false);
                setError(null);
              }}
              className="w-full"
            >
              重新发送
            </Button>
          </div>
        </div>
      </AuthLayout>
    );
  }
  
  return (
    <AuthLayout 
      title="找回密码" 
      subtitle="输入注册邮箱，我们将发送重置链接"
      showBackToLogin
    >
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 邮箱输入 */}
        <div className="space-y-2">
          <Label htmlFor="email">邮箱地址</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入注册时使用的邮箱"
            required
            autoFocus
            autoComplete="email"
          />
        </div>
        
        {/* 提交按钮 */}
        <Button
          type="submit"
          className="w-full h-11"
          disabled={!email || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              发送中...
            </>
          ) : (
            '发送重置链接'
          )}
        </Button>
      </form>
      
      {/* 返回登录 */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <Link 
          to="/login" 
          className="flex items-center justify-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回登录
        </Link>
      </div>
    </AuthLayout>
  );
}





