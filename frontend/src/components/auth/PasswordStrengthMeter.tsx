/**
 * PasswordStrengthMeter - 密码强度指示器
 * Phase 4.2: 实时显示密码强度和改进建议
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecial?: boolean;
  showRequirements?: boolean;
  className?: string;
}

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: {
    label: string;
    met: boolean;
  }[];
}

export function PasswordStrengthMeter({
  password,
  minLength = 8,
  requireUppercase = true,
  requireLowercase = true,
  requireNumbers = true,
  requireSpecial = true,
  showRequirements = true,
  className,
}: PasswordStrengthMeterProps) {
  const strength = useMemo((): StrengthResult => {
    const requirements: { label: string; met: boolean; weight: number }[] = [];
    
    // 长度要求
    requirements.push({
      label: `至少 ${minLength} 个字符`,
      met: password.length >= minLength,
      weight: 1,
    });
    
    // 大写字母
    if (requireUppercase) {
      requirements.push({
        label: '包含大写字母',
        met: /[A-Z]/.test(password),
        weight: 1,
      });
    }
    
    // 小写字母
    if (requireLowercase) {
      requirements.push({
        label: '包含小写字母',
        met: /[a-z]/.test(password),
        weight: 1,
      });
    }
    
    // 数字
    if (requireNumbers) {
      requirements.push({
        label: '包含数字',
        met: /[0-9]/.test(password),
        weight: 1,
      });
    }
    
    // 特殊字符
    if (requireSpecial) {
      requirements.push({
        label: '包含特殊字符',
        met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        weight: 1,
      });
    }
    
    // 计算得分
    const totalWeight = requirements.reduce((sum, r) => sum + r.weight, 0);
    const metWeight = requirements.filter(r => r.met).reduce((sum, r) => sum + r.weight, 0);
    const ratio = metWeight / totalWeight;
    
    let score: number;
    let label: string;
    let color: string;
    
    if (password.length === 0) {
      score = 0;
      label = '';
      color = 'bg-slate-200';
    } else if (ratio < 0.25) {
      score = 1;
      label = '非常弱';
      color = 'bg-red-500';
    } else if (ratio < 0.5) {
      score = 2;
      label = '弱';
      color = 'bg-orange-500';
    } else if (ratio < 0.75) {
      score = 3;
      label = '中等';
      color = 'bg-yellow-500';
    } else if (ratio < 1) {
      score = 3;
      label = '较强';
      color = 'bg-lime-500';
    } else {
      score = 4;
      label = '强';
      color = 'bg-green-500';
    }
    
    return {
      score,
      label,
      color,
      requirements: requirements.map(({ label, met }) => ({ label, met })),
    };
  }, [password, minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecial]);

  if (!password) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* 强度条 */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">密码强度</span>
          {strength.label && (
            <span className={cn('text-xs font-medium', {
              'text-red-600': strength.score === 1,
              'text-orange-600': strength.score === 2,
              'text-yellow-600': strength.score === 3 && strength.label === '中等',
              'text-lime-600': strength.score === 3 && strength.label === '较强',
              'text-green-600': strength.score === 4,
            })}>
              {strength.label}
            </span>
          )}
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                'h-full flex-1 rounded-full transition-all duration-300',
                level <= strength.score ? strength.color : 'bg-slate-200'
              )}
            />
          ))}
        </div>
      </div>

      {/* 要求列表 */}
      {showRequirements && (
        <div className="space-y-1">
          {strength.requirements.map((req, idx) => (
            <div
              key={idx}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors',
                req.met ? 'text-green-600' : 'text-slate-400'
              )}
            >
              {req.met ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <X className="w-3.5 h-3.5" />
              )}
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PasswordStrengthMeter;





