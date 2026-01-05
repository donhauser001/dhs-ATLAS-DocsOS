/**
 * AuthLayout - 认证页面统一布局
 * Phase 4.2: 提供一致的认证页面视觉体验
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackToLogin?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg';
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showBackToLogin = false,
  maxWidth = 'md',
}: AuthLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className={`w-full ${maxWidthClasses[maxWidth]} relative z-10`}>
        <div className="text-center mb-8">
          <Link to="/" className="inline-block group">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-3xl font-bold text-white tracking-wide">ATLAS</span>
            </div>
            <p className="text-slate-400 text-sm">文档原生协作系统</p>
          </Link>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
          {(title || subtitle) && (
            <div className="px-8 pt-8 pb-6 text-center border-b border-slate-100">
              {title && <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>}
              {subtitle && <p className="text-slate-500 mt-2 text-sm">{subtitle}</p>}
            </div>
          )}
          <div className="p-8">{children}</div>
        </div>

        {showBackToLogin && (
          <div className="mt-6 text-center">
            <Link to="/login" className="text-slate-400 hover:text-white text-sm transition-colors inline-flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              返回登录
            </Link>
          </div>
        )}

        <div className="mt-8 text-center text-slate-500 text-xs">
          <p>© {new Date().getFullYear()} ATLAS · 文档原生协作系统</p>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
