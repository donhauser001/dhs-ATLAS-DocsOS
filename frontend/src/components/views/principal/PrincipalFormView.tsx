/**
 * PrincipalFormView - 用户编辑表单视图
 * 
 * 以表单形式编辑用户信息
 */

import { useState, useMemo } from 'react';
import { User, Mail, Phone, Plus, X, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLabels } from '@/providers/LabelProvider';
import type { ViewProps } from '@/registry/types';
import { cn } from '@/lib/utils';

// 状态选项
const STATUS_OPTIONS = [
  { value: 'active', label: '活跃' },
  { value: 'inactive', label: '未激活' },
  { value: 'suspended', label: '已暂停' },
  { value: 'pending', label: '待审核' },
];

interface FormData {
  displayName: string;
  id: string;
  status: string;
  emails: string[];
  phones: string[];
}

export function PrincipalFormView({ document, onSave, onCancel }: ViewProps) {
  const { getLabel } = useLabels();

  // 解析初始数据
  const initialData = useMemo((): FormData => {
    const block = document.blocks[0];
    const machine = block?.machine || {};
    const identity = machine.identity as {
      emails?: string[];
      phones?: string[];
    } || {};

    return {
      displayName: machine.display_name as string || '',
      id: machine.id as string || '',
      status: machine.status as string || 'active',
      emails: identity.emails || [],
      phones: identity.phones || [],
    };
  }, [document]);

  const [formData, setFormData] = useState<FormData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // 检查是否有变更
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  // 更新表单数据
  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 添加邮箱
  const addEmail = () => {
    if (newEmail && !formData.emails.includes(newEmail)) {
      updateField('emails', [...formData.emails, newEmail]);
      setNewEmail('');
    }
  };

  // 删除邮箱
  const removeEmail = (email: string) => {
    updateField('emails', formData.emails.filter(e => e !== email));
  };

  // 添加电话
  const addPhone = () => {
    if (newPhone && !formData.phones.includes(newPhone)) {
      updateField('phones', [...formData.phones, newPhone]);
      setNewPhone('');
    }
  };

  // 删除电话
  const removePhone = (phone: string) => {
    updateField('phones', formData.phones.filter(p => p !== phone));
  };

  // 保存
  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      // 构建更新数据
      const updates = {
        machine: {
          display_name: formData.displayName,
          id: formData.id,
          status: formData.status,
          identity: {
            emails: formData.emails,
            phones: formData.phones,
          },
        },
      };
      await onSave(updates);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* 表单头部 */}
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold">编辑用户</h2>
              <p className="text-sm text-gray-500">@{formData.id || '新用户'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="gap-1"
            >
              <Save className="w-4 h-4" />
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>

        {/* 表单内容 */}
        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">基本信息</h3>
            <div className="space-y-4">
              {/* 显示名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  显示名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="请输入显示名称"
                />
              </div>

              {/* 用户ID */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  用户ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => updateField('id', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
                  placeholder="例如: u-zhangsan"
                />
                <p className="text-xs text-gray-400 mt-1">
                  建议格式: u-姓名拼音，用于系统唯一标识
                </p>
              </div>

              {/* 状态 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  状态
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 联系方式 */}
          <section>
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              联系方式
            </h3>

            {/* 邮箱列表 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                邮箱
              </label>
              <div className="space-y-2">
                {formData.emails.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="flex-1">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="添加邮箱地址"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmail}
                    disabled={!newEmail}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 电话列表 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                电话
              </label>
              <div className="space-y-2">
                {formData.phones.map((phone, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                  >
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="flex-1">{phone}</span>
                    <button
                      type="button"
                      onClick={() => removePhone(phone)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPhone())}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="添加电话号码"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPhone}
                    disabled={!newPhone}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 底部操作栏 */}
        <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {hasChanges ? '有未保存的更改' : '无更改'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? '保存中...' : '保存更改'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrincipalFormView;

