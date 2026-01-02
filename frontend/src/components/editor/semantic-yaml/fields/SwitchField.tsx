/**
 * SwitchField - 开关控件
 */

import React from 'react';
import type { SemanticFieldProps } from '../types';

export const SwitchField: React.FC<SemanticFieldProps> = ({
  fieldKey,
  value,
  config,
  onChange,
  disabled,
}) => {
  const isChecked = Boolean(value);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      id={fieldKey}
      onClick={() => !disabled && !config.readonly && onChange(!isChecked)}
      disabled={disabled || config.readonly}
      className={`relative inline-flex h-6 w-11 items-center rounded-full 
                  transition-colors focus:outline-none focus:ring-2 
                  focus:ring-purple-500/20 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${isChecked ? 'bg-purple-600' : 'bg-slate-200'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white 
                    transition-transform shadow-sm
                    ${isChecked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
};

