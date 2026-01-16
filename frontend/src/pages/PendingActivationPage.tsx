/**
 * PendingActivationPage - 等待激活提示页面
 * Phase 4.2: 提示用户检查邮箱、支持重发激活邮件
 */

import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { sendActivation } from '@/api/auth';

export function PendingActivationPage() {
  const location = useLocation();
  const stateEmail = (location.state as { email?: string })?.email || '';
  
  const [email, setEmail] = useState(stateEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  
  // 发送激活邮件
  async function handleResend() {
    if (!email || cooldown > 0) return;
    
    setError(null);
    setSending(true);
    
    try {
      await sendActivation(email);
      setSent(true);
      
      // 设置 60 秒冷却
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败，请稍后重试');
    } finally {
      setSending(false);
    }
  }
  
  return (
    <AuthLayout title="账户待激活" showBackToLogin>
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8 text-amber-600" />
        </div>
        
        <h3 className="text-lg font-medium text-slate-900 mb-2">请验证您的邮箱</h3>
        <p className="text-slate-600 mb-6">
          我们已向您的注册邮箱发送了激活链接。
          请检查收件箱（包括垃圾邮件）并点击链接完成激活。
        </p>
        
        {/* 成功提示 */}
        {sent && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">激活邮件已发送，请查收</p>
          </div>
        )}
        
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {/* 重发表单 */}
        <div className="bg-slate-50 rounded-lg p-4 text-left space-y-4">
          <p className="text-sm text-slate-600 font-medium">没收到邮件？重新发送</p>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">邮箱地址</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入注册邮箱"
            />
          </div>
          
          <Button
            onClick={handleResend}
            disabled={!email || sending || cooldown > 0}
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                发送中...
              </>
            ) : cooldown > 0 ? (
              `${cooldown}秒后可重新发送`
            ) : (
              '重新发送激活邮件'
            )}
          </Button>
        </div>
        
        {/* 帮助信息 */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-left">
          <p className="text-sm font-medium text-slate-700 mb-2">仍有问题？</p>
          <ul className="text-xs text-slate-500 space-y-1">
            <li>• 检查垃圾邮件/广告邮件文件夹</li>
            <li>• 确认邮箱地址输入正确</li>
            <li>• 等待几分钟后刷新收件箱</li>
            <li>• 如问题持续，请联系管理员</li>
          </ul>
        </div>
      </div>
    </AuthLayout>
  );
}





