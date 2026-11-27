import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../../utils/cn';

/**
 * Reusable Star Rating component (both display-only and interactive)
 */
export function RatingStars({
  value = 0,
  max = 5,
  size = 'sm',
  interactive = false,
  onChange,
  className,
}) {
  const [hovered, setHovered] = useState(0);

  const sizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const activeValue = interactive && hovered > 0 ? hovered : Number(value) || 0;

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      onMouseLeave={() => interactive && setHovered(0)}
    >
      {Array.from({ length: max }).map((_, idx) => {
        const starNum = idx + 1;
        const isFilled = starNum <= Math.round(activeValue);

        if (!interactive) {
          return (
            <Star
              key={starNum}
              className={cn(
                sizeMap[size] || sizeMap.sm,
                isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-100'
              )}
            />
          );
        }

        return (
          <button
            key={starNum}
            type="button"
            onClick={() => onChange?.(starNum)}
            onMouseEnter={() => setHovered(starNum)}
            aria-label={`Đánh giá ${starNum} sao`}
            className="p-0.5 focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                sizeMap[size] || sizeMap.md,
                isFilled ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export default RatingStars;

