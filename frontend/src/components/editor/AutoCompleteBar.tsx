/**
 * AutoCompleteBar - 自动补齐提示栏
 * 
 * Phase 3.5: 智能编辑器
 * 
 * 功能：
 * - 显示缺失字段提示
 * - 提供一键补齐按钮
 * - 显示补齐状态
 */

import { useState } from 'react';
import { AlertCircle, Zap, CheckCircle2, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAutoCompleteState, type MissingField } from '@/stores/editorStore';

interface AutoCompleteBarProps {
  /** 缺失字段列表 */
  missingFields?: MissingField[];
  /** 补齐回调 */
  onAutoComplete?: () => Promise<void>;
  /** 关闭回调 */
  onDismiss?: () => void;
}

export function AutoCompleteBar({
  missingFields: propsMissingFields,
  onAutoComplete,
  onDismiss,
}: AutoCompleteBarProps) {
  const { missingFields: storeMissingFields, autoCompleteEnabled } = useAutoCompleteState();
  const missingFields = propsMissingFields || storeMissingFields;
  
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  // 如果没有缺失字段或已关闭，不显示
  if (!autoCompleteEnabled || missingFields.length === 0 || dismissed || applied) {
    return null;
  }
  
  // 按类别分组
  const grouped = missingFields.reduce((acc, field) => {
    acc[field.category] = acc[field.category] || [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, MissingField[]>);
  
  const handleAutoComplete = async () => {
    setIsApplying(true);
    try {
      await onAutoComplete?.();
      setApplied(true);
    } catch (error) {
      console.error('Auto-complete failed:', error);
    } finally {
      setIsApplying(false);
    }
  };
  
  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };
  
  // 成功状态
  if (applied) {
    return (
      <div className="mx-4 mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">
            已补齐 {missingFields.length} 个字段
          </span>
        </div>
        <button
          onClick={() => setApplied(false)}
          className="text-green-500 hover:text-green-700"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }
  
  return (
    <div className="mx-4 mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <div className="text-sm font-medium text-amber-800">
              检测到缺少字段
            </div>
            <div className="mt-1 text-xs text-amber-600">
              {Object.entries(grouped).map(([category, fields]) => (
                <span key={category} className="mr-3">
                  {getCategoryLabel(category)}: {fields.map(f => f.label).join('、')}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoComplete}
            disabled={isApplying}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
              'bg-amber-100 text-amber-800 hover:bg-amber-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isApplying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {isApplying ? '补齐中...' : '一键补齐'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-amber-400 hover:text-amber-600 transition-colors"
            title="关闭提示"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* 详细信息 */}
      <div className="mt-3 pt-3 border-t border-amber-200">
        <div className="text-xs text-amber-700 space-y-1">
          {missingFields.slice(0, 5).map((field, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="font-mono bg-amber-100 px-1 rounded">{field.key}</span>
              <span>→</span>
              <span className="font-medium">{formatSuggestedValue(field.suggestedValue)}</span>
              <span className="text-amber-500">({field.reason})</span>
            </div>
          ))}
          {missingFields.length > 5 && (
            <div className="text-amber-500 italic">
              还有 {missingFields.length - 5} 个字段...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 获取类别标签
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    structural: '结构字段',
    metadata: '元数据',
    function: '功能声明',
  };
  return labels[category] || category;
}

/**
 * 格式化建议值
 */
function formatSuggestedValue(value: unknown): string {
  if (value === null || value === undefined) return '(空)';
  if (typeof value === 'string') return value.length > 30 ? value.slice(0, 30) + '...' : value;
  if (Array.isArray(value)) return `[${value.length} 项]`;
  if (typeof value === 'object') return '{...}';
  return String(value);
}

export default AutoCompleteBar;

