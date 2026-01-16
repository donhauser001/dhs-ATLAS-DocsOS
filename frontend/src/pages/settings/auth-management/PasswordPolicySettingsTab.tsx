/**
 * PasswordPolicySettingsTab - 密码策略选项卡
 * 配置密码复杂度和有效期
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { getUserSettings, updateUserSettings, type PasswordSettings } from '@/api/user-settings';

export function PasswordPolicySettingsTab() {
  const [settings, setSettings] = useState<PasswordSettings | null>(null);
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
      setSettings(data.password);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载设置失败');
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof PasswordSettings>(
    field: K,
    value: PasswordSettings[K]
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
      await updateUserSettings({ password: settings });
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
        {/* 最小长度 */}
        <div className="space-y-2">
          <Label>最小长度</Label>
          <Input
            type="number"
            min={6}
            max={32}
            value={settings.min_length}
            onChange={(e) => updateField('min_length', parseInt(e.target.value) || 8)}
          />
          <p className="text-xs text-muted-foreground">
            密码至少需要包含的字符数（建议 8-16）
          </p>
        </div>

        {/* 复杂度要求 */}
        <div className="space-y-4">
          <Label className="text-base">复杂度要求</Label>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>要求包含大写字母</Label>
              <p className="text-sm text-muted-foreground">
                至少包含一个大写字母 (A-Z)
              </p>
            </div>
            <Switch
              checked={settings.require_uppercase}
              onCheckedChange={(checked) => updateField('require_uppercase', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>要求包含小写字母</Label>
              <p className="text-sm text-muted-foreground">
                至少包含一个小写字母 (a-z)
              </p>
            </div>
            <Switch
              checked={settings.require_lowercase}
              onCheckedChange={(checked) => updateField('require_lowercase', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>要求包含数字</Label>
              <p className="text-sm text-muted-foreground">
                至少包含一个数字 (0-9)
              </p>
            </div>
            <Switch
              checked={settings.require_number}
              onCheckedChange={(checked) => updateField('require_number', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>要求包含特殊字符</Label>
              <p className="text-sm text-muted-foreground">
                至少包含一个特殊字符 (!@#$%^&* 等)
              </p>
            </div>
            <Switch
              checked={settings.require_special}
              onCheckedChange={(checked) => updateField('require_special', checked)}
            />
          </div>
        </div>

        {/* 密码有效期 */}
        <div className="space-y-2">
          <Label>密码有效期（天）</Label>
          <Input
            type="number"
            min={0}
            max={365}
            value={settings.max_age_days || 0}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              updateField('max_age_days', value > 0 ? value : null);
            }}
          />
          <p className="text-xs text-muted-foreground">
            设置为 0 表示永不过期。建议设置为 90 天以提高安全性。
          </p>
        </div>

        {/* 历史密码数量 */}
        <div className="space-y-2">
          <Label>历史密码限制</Label>
          <Input
            type="number"
            min={0}
            max={24}
            value={settings.history_count}
            onChange={(e) => updateField('history_count', parseInt(e.target.value) || 0)}
          />
          <p className="text-xs text-muted-foreground">
            新密码不能与最近 N 次使用的密码相同。设置为 0 表示不限制。
          </p>
        </div>

        {/* 预览 */}
        <div className="p-4 bg-slate-50 rounded-lg">
          <Label className="text-sm text-slate-600 mb-2 block">当前策略预览</Label>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>• 密码长度至少 {settings.min_length} 个字符</li>
            {settings.require_uppercase && <li>• 必须包含大写字母</li>}
            {settings.require_lowercase && <li>• 必须包含小写字母</li>}
            {settings.require_number && <li>• 必须包含数字</li>}
            {settings.require_special && <li>• 必须包含特殊字符</li>}
            {settings.max_age_days && <li>• 密码 {settings.max_age_days} 天后过期</li>}
            {settings.history_count > 0 && <li>• 不能重复使用最近 {settings.history_count} 次的密码</li>}
          </ul>
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

export default PasswordPolicySettingsTab;




