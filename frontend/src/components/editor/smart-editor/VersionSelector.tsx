/**
 * 版本选择器组件
 */

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, ArrowUp, Minus, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  parseVersion, formatVersion,
  incrementMajor, incrementMinor, getVersionError,
} from './version-utils';

interface VersionSelectorProps {
  value: string;
  originalValue: string;
  onChange: (value: string) => void;
}

export function VersionSelector({ value, originalValue, onChange }: VersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customVersion, setCustomVersion] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 版本计算
  const parsedOriginal = parseVersion(originalValue);
  const originalVersionStr = formatVersion(parsedOriginal);
  const nextMinor = incrementMinor(parsedOriginal);
  const nextMajor = incrementMajor(parsedOriginal);
  const currentVersion = formatVersion(parseVersion(value));

  // 判断选中状态
  const isOriginal = currentVersion === originalVersionStr;
  const isMinor = currentVersion === nextMinor;
  const isMajor = currentVersion === nextMajor;
  const isCustom = !isOriginal && !isMinor && !isMajor;

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowCustomInput(false);
        setCustomError(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // 自动聚焦
  useEffect(() => {
    if (showCustomInput) inputRef.current?.focus();
  }, [showCustomInput]);

  const handleSelect = (v: string) => {
    onChange(v);
    setIsOpen(false);
    setShowCustomInput(false);
    setCustomError(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setCustomVersion(v);
    setCustomError(v.trim() ? getVersionError(v) : null);
  };

  const handleCustomSubmit = () => {
    const error = getVersionError(customVersion);
    if (error) return setCustomError(error);
    handleSelect(customVersion.trim());
    setCustomVersion('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-2 py-1.5 text-xs rounded border flex items-center justify-between gap-1',
          'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50',
          isOpen && 'border-blue-500 ring-1 ring-blue-500',
          !isOriginal && 'border-amber-300 bg-amber-50'
        )}
      >
        <span className="font-mono font-medium">{currentVersion}</span>
        {!isOriginal && <span className="text-amber-500 text-[10px]">已修改</span>}
        <ChevronDown className={cn('w-3 h-3 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden min-w-[220px]">
          <VersionOption
            icon={<Minus className="w-3 h-3 text-slate-500" />}
            iconBg="bg-slate-100"
            title="保持原始版本"
            subtitle={originalVersionStr}
            isSelected={isOriginal}
            onClick={() => handleSelect(originalVersionStr)}
          />
          <VersionOption
            icon={<ArrowUp className="w-3 h-3 text-green-600" />}
            iconBg="bg-green-100"
            title="小版本更新"
            subtitle={`${originalVersionStr} → ${nextMinor}`}
            subtitleColor="text-green-600"
            badge="Minor"
            isSelected={isMinor}
            selectedBg="bg-green-50"
            hoverBg="hover:bg-green-50"
            checkColor="text-green-500"
            onClick={() => handleSelect(nextMinor)}
          />
          <VersionOption
            icon={<ArrowUp className="w-3 h-3 text-orange-600" />}
            iconBg="bg-orange-100"
            title="大版本更新"
            subtitle={`${originalVersionStr} → ${nextMajor}`}
            subtitleColor="text-orange-600"
            badge="Major"
            isSelected={isMajor}
            selectedBg="bg-orange-50"
            hoverBg="hover:bg-orange-50"
            checkColor="text-orange-500"
            onClick={() => handleSelect(nextMajor)}
          />
          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => {
                setShowCustomInput(true);
                setCustomVersion(isCustom ? currentVersion : '');
              }}
              className={cn(
                "w-full px-3 py-2 text-left text-xs flex items-center gap-2",
                isCustom ? "bg-purple-50" : "hover:bg-purple-50"
              )}
            >
              <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
                <FileText className="w-3 h-3 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-700">自定义版本</div>
                <div className={isCustom ? "text-purple-600 font-mono" : "text-slate-400"}>
                  {isCustom ? currentVersion : '手动输入版本号'}
                </div>
              </div>
              {isCustom && <Check className="w-4 h-4 text-purple-500" />}
            </button>
          ) : (
            <CustomVersionInput
              value={customVersion}
              error={customError}
              inputRef={inputRef}
              onChange={handleCustomChange}
              onSubmit={handleCustomSubmit}
              onCancel={() => {
                setShowCustomInput(false);
                setCustomVersion('');
                setCustomError(null);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// 版本选项子组件
interface VersionOptionProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  subtitleColor?: string;
  badge?: string;
  isSelected: boolean;
  selectedBg?: string;
  hoverBg?: string;
  checkColor?: string;
  onClick: () => void;
}

function VersionOption({
  icon, iconBg, title, subtitle,
  subtitleColor = 'text-slate-400',
  badge, isSelected,
  selectedBg = 'bg-blue-50',
  hoverBg = 'hover:bg-slate-50',
  checkColor = 'text-blue-500',
  onClick,
}: VersionOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2 text-left text-xs flex items-center gap-2 border-b border-slate-100",
        isSelected ? selectedBg : hoverBg
      )}
    >
      <div className={cn('w-5 h-5 rounded flex items-center justify-center', iconBg)}>{icon}</div>
      <div className="flex-1">
        <div className="font-medium text-slate-700">{title}</div>
        <div className={cn('font-mono', subtitleColor)}>{subtitle}</div>
      </div>
      {isSelected ? (
        <Check className={cn('w-4 h-4', checkColor)} />
      ) : badge ? (
        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{badge}</span>
      ) : null}
    </button>
  );
}

// 自定义版本输入子组件
interface CustomVersionInputProps {
  value: string;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function CustomVersionInput({ value, error, inputRef, onChange, onSubmit, onCancel }: CustomVersionInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); onSubmit(); }
    else if (e.key === 'Escape') onCancel();
  };

  return (
    <div className="px-3 py-2 border-t border-slate-100">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center flex-shrink-0">
          <FileText className="w-3 h-3 text-purple-600" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="如 1.2.3"
          className={cn(
            "flex-1 px-2 py-1 text-xs font-mono rounded border outline-none",
            error ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-purple-500"
          )}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!!error || !value.trim()}
          className={cn(
            "px-2 py-1 text-xs rounded",
            error || !value.trim() ? "bg-slate-100 text-slate-400" : "bg-purple-600 text-white hover:bg-purple-700"
          )}
        >
          确定
        </button>
      </div>
      {error && (
        <p className="mt-1 text-[10px] text-red-500 flex items-center gap-1">
          <X className="w-3 h-3" />{error}
        </p>
      )}
      <p className="mt-1 text-[10px] text-slate-400">格式：x.y 或 x.y.z</p>
    </div>
  );
}

export default VersionSelector;

