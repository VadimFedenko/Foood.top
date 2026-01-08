import { useEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';

/**
 * Compact metric indicator for DishCard header (optionally editable).
 * @param {boolean} compact - Ultra-compact mode for mobile collapsed state
 * @param {string} label - Optional secondary label shown below value
 */
export default function MetricIndicator({
  icon: Icon,
  value,
  format = (v) => v,
  isEditing = false,
  onIncrement,
  onDecrement,
  onEditEnd,
  isOverridden = false,
  isAtMin = false,
  isAtMax = false,
  compact = false,
  label = null,
}) {
  const iconColor = isOverridden ? 'text-amber-500 dark:text-amber-400' : 'text-surface-600 dark:text-surface-200';
  const textColor = isOverridden ? 'text-amber-600 dark:text-amber-300' : 'text-surface-500 dark:text-surface-400';

  const holdRef = useRef({ timeoutId: null, intervalId: null });
  const endedRef = useRef(false);
  const listenersRef = useRef({ pointerup: null, pointercancel: null });

  const stopHold = (callEnd = true) => {
    if (holdRef.current.timeoutId) {
      window.clearTimeout(holdRef.current.timeoutId);
      holdRef.current.timeoutId = null;
    }
    if (holdRef.current.intervalId) {
      window.clearInterval(holdRef.current.intervalId);
      holdRef.current.intervalId = null;
    }
    // Ensure we never leak global listeners (e.g. component unmounts mid-hold).
    if (listenersRef.current.pointerup) {
      window.removeEventListener('pointerup', listenersRef.current.pointerup);
      listenersRef.current.pointerup = null;
    }
    if (listenersRef.current.pointercancel) {
      window.removeEventListener('pointercancel', listenersRef.current.pointercancel);
      listenersRef.current.pointercancel = null;
    }
    if (callEnd && !endedRef.current) {
      endedRef.current = true;
      onEditEnd?.();
    }
  };

  const startHold = (action) => {
    endedRef.current = false;
    stopHold(false);

    action?.();

    // Start repeating after a short delay (press-and-hold)
    holdRef.current.timeoutId = window.setTimeout(() => {
      holdRef.current.intervalId = window.setInterval(() => {
        action?.();
      }, 75);
    }, 320);

    const handlePointerUp = () => stopHold(true);
    listenersRef.current.pointerup = handlePointerUp;
    listenersRef.current.pointercancel = handlePointerUp;
    window.addEventListener('pointerup', handlePointerUp, { once: true });
    window.addEventListener('pointercancel', handlePointerUp, { once: true });
  };

  useEffect(() => {
    return () => stopHold(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Split formatted output into main value and unit (unit goes under the value)
  const formatted = format(value);
  let mainValue = formatted;
  let unit = label || null;

  // Only split if label is not provided and the string contains '/' but doesn't end with '/g' (simple units like cal/g stay together)
  if (!label && typeof formatted === 'string' && formatted.includes('/') && !formatted.endsWith('/g')) {
    const slashIndex = formatted.indexOf('/');
    mainValue = formatted.slice(0, slashIndex);
    unit = formatted.slice(slashIndex);
  }

  // Compact mode for mobile collapsed cards - minimal display
  if (compact) {
    return (
      <div className="flex items-center gap-0.5 text-[10px]">
        <Icon size={10} className={iconColor} />
        <span className={`font-mono ${textColor} leading-none`}>
          {mainValue}
        </span>
        {unit && (
          <span className="text-[8px] text-surface-400 leading-none">
            {unit}
          </span>
        )}
      </div>
    );
  }

  // Editing mode - responsive layout: vertical on mobile (<640px), horizontal on desktop
  if (isEditing) {
    return (
      <>
        {/* Mobile/Tablet: vertical layout with stretchable buttons (<480px) */}
        <div className="flex flex-col items-center gap-0.5 bg-surface-200/50 dark:bg-surface-700/50 rounded-lg px-1.5 py-1 min-w-[52px] mobile:hidden">
          {/* Icon + Value - top row */}
          <div className="flex items-center gap-1 w-full justify-center">
            <Icon size={12} className={iconColor} />
            <span className={`font-mono text-xs ${textColor} relative inline-flex flex-col items-center leading-none`}>
              <span>{mainValue}</span>
              {unit && (
                <span className="text-[8px] leading-none opacity-70 -mt-0.5">
                  {unit}
                </span>
              )}
            </span>
          </div>

          {/* Buttons row - bottom, stretchable */}
          <div className="flex items-center gap-1 w-full">
            {/* Increment button - stretches to fill available space */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (isAtMax) return;
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
                startHold(onIncrement);
              }}
              disabled={isAtMax}
              className={`
                flex-1 h-5 flex items-center justify-center rounded
                transition-colors
                ${
                  isAtMax
                    ? 'text-surface-400 dark:text-surface-600 cursor-not-allowed bg-transparent'
                    : 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/15 hover:bg-emerald-500/25 active:bg-emerald-500/35'
                }
              `}
            >
              <Plus size={12} />
            </button>

            {/* Divider */}
            <div className="w-px h-4 bg-surface-300 dark:bg-surface-600" />

            {/* Decrement button - stretches to fill available space */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (isAtMin) return;
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
                startHold(onDecrement);
              }}
              disabled={isAtMin}
              className={`
                flex-1 h-5 flex items-center justify-center rounded
                transition-colors
                ${
                  isAtMin
                    ? 'text-surface-400 dark:text-surface-600 cursor-not-allowed bg-transparent'
                    : 'text-rose-500 dark:text-rose-400 bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/35'
                }
              `}
            >
              <Minus size={12} />
            </button>
          </div>
        </div>

        {/* Desktop: horizontal layout (>=480px) */}
        <div className="hidden mobile:flex flex-row items-center gap-0.5 sm:gap-1 bg-surface-200/50 dark:bg-surface-700/50 rounded-lg px-1 py-0.5 sm:rounded-md">
          {/* Decrement button - left side */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (isAtMin) return;
              try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
              startHold(onDecrement);
            }}
            disabled={isAtMin}
            className={`
              w-5 h-5 flex items-center justify-center rounded
              transition-colors
              ${
                isAtMin
                  ? 'text-surface-400 dark:text-surface-600 cursor-not-allowed bg-transparent'
                  : 'text-rose-500 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30'
              }
            `}
          >
            <Minus size={14} className="w-3 h-3" />
          </button>

          {/* Icon + Value - center */}
          <div className="flex items-center gap-1 px-1">
            <Icon size={12} className={iconColor} />
            <span className={`font-mono text-xs ${textColor} relative inline-flex flex-col items-start leading-none`}>
              <span>{mainValue}</span>
              {unit && (
                <span className="text-[8px] leading-none opacity-70 -mt-0.5">
                  {unit}
                </span>
              )}
            </span>
          </div>

          {/* Increment button - right side */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (isAtMax) return;
              try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
              startHold(onIncrement);
            }}
            disabled={isAtMax}
            className={`
              w-5 h-5 flex items-center justify-center rounded
              transition-colors
              ${
                isAtMax
                  ? 'text-surface-400 dark:text-surface-600 cursor-not-allowed bg-transparent'
                  : 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30'
              }
            `}
          >
            <Plus size={14} className="w-3 h-3" />
          </button>
        </div>
      </>
    );
  }

  // Default non-editing state
  return (
    <div className="flex items-center gap-1 text-xs text-surface-500 dark:text-surface-400">
      <Icon size={12} className={iconColor} />
      <span className={`font-mono ${textColor} relative inline-flex flex-col items-start leading-none`}>
        <span>{mainValue}</span>
        {unit && (
          <span className="text-[8px] leading-none opacity-70 -mt-0.5">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}




