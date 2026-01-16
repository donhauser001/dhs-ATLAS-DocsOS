/**
 * EmailSettings - 邮件服务配置页面
 * Phase 4.2: 配置 SMTP 邮件服务
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
import { Loader2, Save, RotateCcw, Mail, Send, CheckCircle2, XCircle } from 'lucide-react';
import { getUserSettings, updateUserSettings, type EmailSettingsSafe } from '@/api/user-settings';

const PRESET_PROVIDERS = [
  { id: 'qq', name: 'QQ邮箱', smtp: 'smtp.qq.com', port: 465 },
  { id: '163', name: '163邮箱', smtp: 'smtp.163.com', port: 465 },
  { id: 'gmail', name: 'Gmail', smtp: 'smtp.gmail.com', port: 587 },
  { id: 'outlook', name: 'Outlook', smtp: 'smtp.office365.com', port: 587 },
  { id: 'aliyun', name: '阿里企业邮', smtp: 'smtp.mxhichina.com', port: 465 },
];

interface EmailFormState extends Omit<EmailSettingsSafe, 'smtp'> {
  auth_code: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
}

export function EmailSettings() {
  const [settings, setSettings] = useState<EmailFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getUserSettings();
      const email = data.email;
      
      setSettings({
        enabled: email.enabled,
        provider: email.provider,
        preset_provider: email.preset_provider,
        account: email.account || '',
        auth_code: '', // 安全原因不返回
        sender_name: email.sender_name,
        sender_email: email.sender_email,
        smtp_host: email.smtp?.host || '',
        smtp_port: email.smtp?.port || 587,
        smtp_secure: email.smtp?.secure ?? true,
        smtp_user: email.smtp?.user || '',
        smtp_pass: '', // 安全原因不返回
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载设置失败');
    } finally {
      setLoading(false);
    }
  }

  // 更新字段
  function updateField<K extends keyof EmailFormState>(
    field: K, 
    value: EmailFormState[K]
  ) {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
    setIsDirty(true);
    setSuccess(false);
    setTestResult(null);
  }

  // 切换预设服务商时更新默认值
  function handlePresetChange(presetId: string) {
    const preset = PRESET_PROVIDERS.find(p => p.id === presetId);
    if (!preset || !settings) return;
    
    setSettings({
      ...settings,
      preset_provider: presetId as EmailFormState['preset_provider'],
      smtp_host: preset.smtp,
      smtp_port: preset.port,
      smtp_secure: preset.port === 465,
    });
    setIsDirty(true);
    setSuccess(false);
    setTestResult(null);
  }

  // 保存设置
  async function handleSave() {
    if (!settings) return;
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      // 构建邮件设置对象
      const emailUpdate: Record<string, unknown> = {
        enabled: settings.enabled,
        provider: settings.provider,
        sender_name: settings.sender_name,
        sender_email: settings.sender_email,
      };
      
      if (settings.provider === 'preset') {
        emailUpdate.preset_provider = settings.preset_provider;
        emailUpdate.account = settings.account;
        if (settings.auth_code) {
          emailUpdate.auth_code = settings.auth_code;
        }
      } else {
        emailUpdate.smtp = {
          host: settings.smtp_host,
          port: settings.smtp_port,
          secure: settings.smtp_secure,
          user: settings.smtp_user,
          ...(settings.smtp_pass && { pass: settings.smtp_pass }),
        };
      }
      
      await updateUserSettings({ email: emailUpdate as never });
      setIsDirty(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  // 测试邮件配置
  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    
    try {
      const res = await fetch('/api/settings/email/test', {
        method: 'POST',
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (data.success) {
        setTestResult({ success: true, message: '连接测试成功' });
      } else {
        setTestResult({ success: false, message: data.error || '连接测试失败' });
      }
    } catch (e) {
      setTestResult({ success: false, message: '测试请求失败' });
    } finally {
      setTesting(false);
    }
  }

  // 重置
  async function handleReset() {
    await loadSettings();
    setIsDirty(false);
    setTestResult(null);
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
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Mail className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">邮件服务</h2>
          <p className="text-sm text-muted-foreground">配置 SMTP 邮件发送服务</p>
        </div>
      </div>

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
        {/* 启用邮件服务 */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">启用邮件服务</Label>
            <p className="text-sm text-muted-foreground">
              启用后可发送激活邮件、密码重置邮件等
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => updateField('enabled', checked)}
          />
        </div>

        {settings.enabled && (
          <>
            {/* 服务商选择 */}
            <div className="space-y-2">
              <Label>服务商类型</Label>
              <Select
                value={settings.provider}
                onValueChange={(value: 'preset' | 'smtp') => updateField('provider', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preset">预设服务商</SelectItem>
                  <SelectItem value="smtp">自定义 SMTP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {settings.provider === 'preset' ? (
              <>
                {/* 预设服务商 */}
                <div className="space-y-2">
                  <Label>邮件服务商</Label>
                  <Select
                    value={settings.preset_provider}
                    onValueChange={handlePresetChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择服务商" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_PROVIDERS.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 邮箱账号 */}
                <div className="space-y-2">
                  <Label>邮箱账号</Label>
                  <Input
                    value={settings.account}
                    onChange={(e) => updateField('account', e.target.value)}
                    placeholder="your-email@example.com"
                  />
                </div>

                {/* 授权码 */}
                <div className="space-y-2">
                  <Label>授权码</Label>
                  <Input
                    type="password"
                    value={settings.auth_code}
                    onChange={(e) => updateField('auth_code', e.target.value)}
                    placeholder="留空则保持原有授权码"
                  />
                  <p className="text-xs text-muted-foreground">
                    请在邮箱设置中开启 SMTP 服务并获取授权码
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* 自定义 SMTP */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP 主机</Label>
                    <Input
                      value={settings.smtp_host}
                      onChange={(e) => updateField('smtp_host', e.target.value)}
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>端口</Label>
                    <Input
                      type="number"
                      value={settings.smtp_port}
                      onChange={(e) => updateField('smtp_port', parseInt(e.target.value) || 587)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>使用 SSL/TLS</Label>
                    <p className="text-sm text-muted-foreground">
                      端口 465 通常需要启用
                    </p>
                  </div>
                  <Switch
                    checked={settings.smtp_secure}
                    onCheckedChange={(checked) => updateField('smtp_secure', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>用户名</Label>
                  <Input
                    value={settings.smtp_user}
                    onChange={(e) => updateField('smtp_user', e.target.value)}
                    placeholder="SMTP 认证用户名"
                  />
                </div>

                <div className="space-y-2">
                  <Label>密码</Label>
                  <Input
                    type="password"
                    value={settings.smtp_pass}
                    onChange={(e) => updateField('smtp_pass', e.target.value)}
                    placeholder="留空则保持原有密码"
                  />
                </div>
              </>
            )}

            {/* 发件人设置 */}
            <div className="pt-4 border-t">
              <Label className="text-base mb-4 block">发件人信息</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>发件人名称</Label>
                  <Input
                    value={settings.sender_name}
                    onChange={(e) => updateField('sender_name', e.target.value)}
                    placeholder="ATLAS 系统"
                  />
                </div>
                <div className="space-y-2">
                  <Label>发件人邮箱</Label>
                  <Input
                    value={settings.sender_email}
                    onChange={(e) => updateField('sender_email', e.target.value)}
                    placeholder="noreply@example.com"
                  />
                </div>
              </div>
            </div>

            {/* 测试结果 */}
            {testResult && (
              <div className={`p-4 rounded-lg flex items-center gap-2 ${
                testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                {testResult.message}
              </div>
            )}
          </>
        )}

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
          {settings.enabled && (
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testing || isDirty}
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  测试中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  测试连接
                </>
              )}
            </Button>
          )}
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

export default EmailSettings;





