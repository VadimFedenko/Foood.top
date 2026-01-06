import { Minus, Plus } from 'lucide-react';

/**
 * Compact metric indicator for DishCard header (optionally editable).
 */
export default function MetricIndicator({
  icon: Icon,
  value,
  format = (v) => v,
  isEditing = false,
  onIncrement,
  onDecrement,
  isOverridden = false,
  isAtMin = false,
  isAtMax = false,
}) {
  const iconColor = isOverridden ? 'text-amber-500 dark:text-amber-400' : 'text-surface-600 dark:text-surface-200';
  const textColor = isOverridden ? 'text-amber-600 dark:text-amber-300' : 'text-surface-500 dark:text-surface-400';

  // Split formatted output into main value and unit (unit goes under the value)
  const formatted = format(value);
  let mainValue = formatted;
  let unit = null;

  if (typeof formatted === 'string' && formatted.includes('/')) {
    const slashIndex = formatted.indexOf('/');
    mainValue = formatted.slice(0, slashIndex);
    unit = formatted.slice(slashIndex);
  }

  return (
    <div
      className={`
        flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400
        ${isEditing ? 'bg-surface-200/50 dark:bg-surface-700/50 rounded-md px-1 py-0.5' : ''}
      `}
    >
      {isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDecrement?.();
          }}
          disabled={isAtMin}
          className={`
            w-5 h-5 flex items-center justify-center rounded
            transition-colors
            ${
              isAtMin
                ? 'text-surface-400 dark:text-surface-600 cursor-not-allowed'
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-300 dark:hover:bg-surface-600'
            }
          `}
        >
          <Minus size={12} />
        </button>
      )}

      <Icon size={12} className={iconColor} />
      <span className={`font-mono ${textColor} relative inline-flex flex-col items-start leading-none`}>
        <span>{mainValue}</span>
        {unit && (
          <span className="text-[8px] leading-none opacity-70 -mt-0.5">
            {unit}
          </span>
        )}
      </span>

      {isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onIncrement?.();
          }}
          disabled={isAtMax}
          className={`
            w-5 h-5 flex items-center justify-center rounded
            transition-colors
            ${
              isAtMax
                ? 'text-surface-400 dark:text-surface-600 cursor-not-allowed'
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-300 dark:hover:bg-surface-600'
            }
          `}
        >
          <Plus size={12} />
        </button>
      )}
    </div>
  );
}




