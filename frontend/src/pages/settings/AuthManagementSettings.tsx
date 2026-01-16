/**
 * AuthManagementSettings - 用户认证管理
 * 
 * 整合以下设置板块：
 * - 注册设置
 * - 登录设置
 * - 密码策略
 * - 角色管理
 * 
 * 使用选项卡方式呈现
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, UserPlus, LogIn, KeyRound, ShieldCheck } from 'lucide-react';

// 导入子组件（内联实现，保持代码独立性）
import { RegistrationSettingsTab } from './auth-management/RegistrationSettingsTab';
import { LoginSettingsTab } from './auth-management/LoginSettingsTab';
import { PasswordPolicySettingsTab } from './auth-management/PasswordPolicySettingsTab';
import { RoleManagementSettingsTab } from './auth-management/RoleManagementSettingsTab';

// ============================================================
// 选项卡配置
// ============================================================

const TABS = [
  {
    id: 'registration',
    label: '注册设置',
    icon: UserPlus,
    description: '新用户注册配置',
  },
  {
    id: 'login',
    label: '登录设置',
    icon: LogIn,
    description: '登录方式和安全配置',
  },
  {
    id: 'password',
    label: '密码策略',
    icon: KeyRound,
    description: '密码复杂度和有效期',
  },
  {
    id: 'roles',
    label: '角色管理',
    icon: ShieldCheck,
    description: '配置用户角色和权限',
  },
];

// ============================================================
// 主组件
// ============================================================

export function AuthManagementSettings() {
  const [activeTab, setActiveTab] = useState('registration');

  return (
    <div className="h-full flex flex-col">
      {/* 页面标题 */}
      <div className="flex items-center gap-3 p-6 pb-0">
        <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/20">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">用户认证管理</h2>
          <p className="text-sm text-muted-foreground">管理用户注册、登录、密码策略和角色权限</p>
        </div>
      </div>

      {/* 选项卡 */}
      <div className="flex-1 overflow-hidden p-6 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* 选项卡列表 */}
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-slate-100/80">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 py-2.5 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* 选项卡内容 */}
          <div className="flex-1 mt-4 overflow-hidden bg-white rounded-xl border shadow-sm">
            <ScrollArea className="h-full">
              <TabsContent value="registration" className="m-0 p-0 h-full">
                <RegistrationSettingsTab />
              </TabsContent>

              <TabsContent value="login" className="m-0 p-0 h-full">
                <LoginSettingsTab />
              </TabsContent>

              <TabsContent value="password" className="m-0 p-0 h-full">
                <PasswordPolicySettingsTab />
              </TabsContent>

              <TabsContent value="roles" className="m-0 p-0 h-full">
                <RoleManagementSettingsTab />
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

export default AuthManagementSettings;




