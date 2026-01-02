/**
 * TagsField - 标签列表控件
 */

import React, { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import type { SemanticFieldProps } from '../types';

export const TagsField: React.FC<SemanticFieldProps> = ({
  fieldKey,
  value,
  config,
  onChange,
  disabled,
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const tags = Array.isArray(value) ? value.filter(v => typeof v === 'string') : [];

  const addTag = () => {
    const newTag = inputValue.trim();
    if (newTag && !tags.includes(newTag)) {
      onChange([...tags, newTag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div
      id={fieldKey}
      className={`flex flex-wrap items-center gap-2 p-2 min-h-[42px] rounded-md 
                  border border-slate-200 bg-white
                  ${disabled || config.readonly ? 'bg-slate-50' : 'cursor-text'}
                  focus-within:ring-2 focus-within:ring-purple-500/20 focus-within:border-purple-500`}
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag, index) => (
        <span
          key={`${tag}-${index}`}
          className="inline-flex items-center gap-1 px-2 py-1 text-sm 
                     bg-purple-100 text-purple-700 rounded-md"
        >
          {tag}
          {!disabled && !config.readonly && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="hover:bg-purple-200 rounded p-0.5 transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </span>
      ))}
      
      {!disabled && !config.readonly && (
        <div className="flex items-center gap-1 flex-1 min-w-[100px]">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addTag}
            placeholder={tags.length === 0 ? '添加标签...' : ''}
            className="flex-1 min-w-[80px] bg-transparent text-sm outline-none"
          />
          {inputValue && (
            <button
              type="button"
              onClick={addTag}
              className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

