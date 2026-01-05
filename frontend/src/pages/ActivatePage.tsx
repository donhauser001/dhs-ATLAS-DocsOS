/**
 * ActivatePage - 账户激活页面
 * Phase 4.2: 验证激活 Token 并激活账户
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { verifyActivationToken, activateAccount } from '@/api/auth';

type PageState = 'verifying' | 'activating' | 'success' | 'invalid';

export function ActivatePage() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  
  const [pageState, setPageState] = useState<PageState>('verifying');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // 验证并激活
  useEffect(() => {
    async function verifyAndActivate() {
      if (!token) {
        setPageState('invalid');
        return;
      }
      
      try {
        // 验证 Token
        const verifyResult = await verifyActivationToken(token);
        
        if (!verifyResult.valid) {
          setPageState('invalid');
          return;
        }
        
        setEmail(verifyResult.email || '');
        setPageState('activating');
        
        // 激活账户
        const activateResult = await activateAccount(token);
        
        if (activateResult.success) {
          setPageState('success');
        } else {
          setError('激活失败，请重试');
          setPageState('invalid');
        }
        
      } catch (e) {
        setError(e instanceof Error ? e.message : '激活失败');
        setPageState('invalid');
      }
    }
    
    verifyAndActivate();
  }, [token]);
  
  // 验证中
  if (pageState === 'verifying') {
    return (
      <AuthLayout title="验证链接">
        <div className="flex flex-col items-center py-8">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400 mb-4" />
          <p className="text-slate-600">正在验证激活链接...</p>
        </div>
      </AuthLayout>
    );
  }
  
  // 激活中
  if (pageState === 'activating') {
    return (
      <AuthLayout title="激活账户">
        <div className="flex flex-col items-center py-8">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
          <p className="text-slate-600">正在激活您的账户...</p>
        </div>
      </AuthLayout>
    );
  }
  
  // 激活成功
  if (pageState === 'success') {
    return (
      <AuthLayout title="激活成功">
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          
          <h3 className="text-lg font-medium text-slate-900 mb-2">账户已激活</h3>
          <p className="text-slate-600 mb-6">
            {email ? (
              <>账户 <span className="font-medium">{email}</span> 已成功激活！</>
            ) : (
              '您的账户已成功激活！'
            )}
            <br />
            现在可以使用您的凭证登录了。
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
  
  // 链接无效
  return (
    <AuthLayout title="链接无效" showBackToLogin>
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        
        <h3 className="text-lg font-medium text-slate-900 mb-2">激活链接无效</h3>
        <p className="text-slate-600 mb-2">
          {error || '该链接可能已过期、已被使用或无效。'}
        </p>
        <p className="text-slate-500 text-sm mb-6">
          请重新请求发送激活邮件。
        </p>
        
        <div className="space-y-3">
          <Link to="/pending-activation" className="block">
            <Button className="w-full">重新发送激活邮件</Button>
          </Link>
          <Link to="/login" className="block">
            <Button variant="outline" className="w-full">返回登录</Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}

