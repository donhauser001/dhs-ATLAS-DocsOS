/**
 * RatingField - 星级评分控件
 */

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import type { SemanticFieldProps } from '../types';

export const RatingField: React.FC<SemanticFieldProps> = ({
  fieldKey,
  value,
  config,
  onChange,
  disabled,
}) => {
  const maxRating = config.max || 5;
  const currentRating = typeof value === 'number' ? value : 0;
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : currentRating;

  return (
    <div className="flex items-center gap-1" id={fieldKey}>
      {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !disabled && !config.readonly && onChange(star)}
          onMouseEnter={() => !disabled && !config.readonly && setHoverRating(star)}
          onMouseLeave={() => setHoverRating(null)}
          disabled={disabled || config.readonly}
          className="p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed"
        >
          <Star
            size={20}
            className={`transition-colors ${
              star <= displayRating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-slate-300'
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-slate-500">
        {currentRating}/{maxRating}
      </span>
    </div>
  );
};

