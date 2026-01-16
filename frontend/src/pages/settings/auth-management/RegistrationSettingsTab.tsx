/**
 * RegistrationSettingsTab - 注册设置选项卡
 * 配置新用户注册相关选项
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { getUserSettings, updateUserSettings, type RegistrationSettings } from '@/api/user-settings';

export function RegistrationSettingsTab() {
  const [settings, setSettings] = useState<RegistrationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError(null);

    try {
      const data = await getUserSettings();
      setSettings(data.registration);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载设置失败');
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof RegistrationSettings>(
    field: K,
    value: RegistrationSettings[K]
  ) {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    setIsDirty(true);
    setSuccess(false);
  }

  async function handleSave() {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateUserSettings({ registration: settings });
      setIsDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    await loadSettings();
    setIsDirty(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        {error || '无法加载设置'}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* 成功提示 */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm">
          设置已保存
        </div>
      )}

      <div className="space-y-6">
        {/* 新用户默认状态 */}
        <div className="space-y-2">
          <Label>新用户默认状态</Label>
          <Select
            value={settings.default_status}
            onValueChange={(value: 'pending' | 'active') => updateField('default_status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">待激活</SelectItem>
              <SelectItem value="active">直接启用</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            选择"待激活"时，新用户需要完成激活流程后才能登录
          </p>
        </div>

        {/* 激活方式 */}
        <div className="space-y-2">
          <Label>激活方式</Label>
          <Select
            value={settings.activation_method}
            onValueChange={(value: 'manual' | 'email' | 'first_login') => updateField('activation_method', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">邮箱验证</SelectItem>
              <SelectItem value="manual">管理员手动激活</SelectItem>
              <SelectItem value="first_login">首次登录自动激活</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {settings.activation_method === 'email' && '用户需要点击邮件中的激活链接'}
            {settings.activation_method === 'manual' && '管理员需要在用户管理中手动启用用户'}
            {settings.activation_method === 'first_login' && '用户首次成功登录后自动激活'}
          </p>
        </div>

        {/* 允许自助注册 */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">允许自助注册</Label>
            <p className="text-sm text-muted-foreground">
              启用后，用户可以自行注册账户
            </p>
          </div>
          <Switch
            checked={settings.allow_self_register}
            onCheckedChange={(checked) => updateField('allow_self_register', checked)}
          />
        </div>

        {/* 需要邮箱验证 */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">需要邮箱验证</Label>
            <p className="text-sm text-muted-foreground">
              注册时验证邮箱地址的有效性
            </p>
          </div>
          <Switch
            checked={settings.require_email_verification}
            onCheckedChange={(checked) => updateField('require_email_verification', checked)}
          />
        </div>

        {/* 用户文档目录 */}
        <div className="space-y-2">
          <Label>用户文档存放目录</Label>
          <Input
            value={settings.user_document_directory}
            onChange={(e) => updateField('user_document_directory', e.target.value)}
            placeholder="例如: 联系人"
          />
          <p className="text-xs text-muted-foreground">
            新用户的认证文档将保存在此目录下
          </p>
        </div>

        {/* 文档命名规则 */}
        <div className="space-y-2">
          <Label>文档命名规则</Label>
          <Select
            value={settings.document_naming}
            onValueChange={(value: 'username' | 'user_id' | 'email_prefix') => updateField('document_naming', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="username">用户名</SelectItem>
              <SelectItem value="user_id">用户ID</SelectItem>
              <SelectItem value="email_prefix">邮箱前缀</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            示例：{settings.document_naming === 'username' ? 'zhangsan.md' :
              settings.document_naming === 'user_id' ? 'U20260106001.md' :
                'zhangsan@example.md'}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!isDirty || saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存设置
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RegistrationSettingsTab;




