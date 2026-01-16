/**
 * LoginSettingsTab - 登录设置选项卡
 * 配置用户登录相关选项
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { getUserSettings, updateUserSettings, type LoginSettings } from '@/api/user-settings';

const LOGIN_METHOD_OPTIONS = [
  { id: 'username', label: '用户名' },
  { id: 'email', label: '邮箱' },
  { id: 'phone', label: '手机号' },
] as const;

export function LoginSettingsTab() {
  const [settings, setSettings] = useState<LoginSettings | null>(null);
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
      setSettings(data.login);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载设置失败');
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof LoginSettings>(
    field: K,
    value: LoginSettings[K]
  ) {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    setIsDirty(true);
    setSuccess(false);
  }

  function toggleLoginMethod(method: 'username' | 'email' | 'phone') {
    if (!settings) return;

    const methods = [...settings.allowed_methods];
    const index = methods.indexOf(method);

    if (index > -1) {
      if (methods.length > 1) {
        methods.splice(index, 1);
      }
    } else {
      methods.push(method);
    }

    updateField('allowed_methods', methods);
  }

  async function handleSave() {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateUserSettings({ login: settings });
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
        {/* 允许的登录方式 */}
        <div className="space-y-3">
          <Label>允许的登录方式</Label>
          <div className="space-y-2">
            {LOGIN_METHOD_OPTIONS.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`method-${option.id}`}
                  checked={settings.allowed_methods.includes(option.id)}
                  onCheckedChange={() => toggleLoginMethod(option.id)}
                  disabled={settings.allowed_methods.length === 1 && settings.allowed_methods.includes(option.id)}
                />
                <label
                  htmlFor={`method-${option.id}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            至少选择一种登录方式
          </p>
        </div>

        {/* 锁定前失败次数 */}
        <div className="space-y-2">
          <Label>锁定前允许的失败次数</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={settings.lockout_attempts}
            onChange={(e) => updateField('lockout_attempts', parseInt(e.target.value) || 5)}
          />
          <p className="text-xs text-muted-foreground">
            连续登录失败达到此次数后，账户将被临时锁定
          </p>
        </div>

        {/* 锁定时长 */}
        <div className="space-y-2">
          <Label>锁定时长（分钟）</Label>
          <Input
            type="number"
            min={1}
            max={1440}
            value={settings.lockout_duration_minutes}
            onChange={(e) => updateField('lockout_duration_minutes', parseInt(e.target.value) || 30)}
          />
          <p className="text-xs text-muted-foreground">
            账户锁定后，需要等待此时间后才能重新尝试登录
          </p>
        </div>

        {/* 会话有效期 */}
        <div className="space-y-2">
          <Label>会话有效期（天）</Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={settings.session_duration_days}
            onChange={(e) => updateField('session_duration_days', parseInt(e.target.value) || 7)}
          />
          <p className="text-xs text-muted-foreground">
            用户登录后，会话将在此时间后过期，需要重新登录
          </p>
        </div>

        {/* 记住我功能 */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">启用"记住我"功能</Label>
            <p className="text-sm text-muted-foreground">
              允许用户选择延长登录会话的有效期
            </p>
          </div>
          <Switch
            checked={settings.remember_me_enabled}
            onCheckedChange={(checked) => updateField('remember_me_enabled', checked)}
          />
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

export default LoginSettingsTab;




