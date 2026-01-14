import { useState, useEffect, useRef, memo } from 'react';
import { useIsMobile } from '../lib/useIsMobile';

/**
 * Single vertical slider component styled like audio mixer fader
 * Range: 0-10 with reversible labels
 * Optimized for mobile: uses local state during drag, CSS transforms on mobile
 * Desktop: uses height animation for better gradient rendering
 */
function PrioritySlider({ 
  config, 
  value, 
  percentage, 
  onChange, 
  onDragStart, 
  onToggleReverse, 
  isDark = false 
}) {
  const isReversed = value < 0;
  const absValue = Math.abs(value);
  const isActive = absValue !== 0;
  const isMobile = useIsMobile();
  
  // Local state for smooth drag (commits to store on pointerup)
  const [localValue, setLocalValue] = useState(absValue);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const localValueRef = useRef(localValue);
  const isReversedRef = useRef(isReversed);
  const isMobileRef = useRef(isMobile);
  const onChangeRef = useRef(onChange);
  const committedRef = useRef(false);
  
  // Sync local value when prop changes (but not during drag)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalValue(absValue);
    }
  }, [absValue]);

  // Keep refs in sync for stable debug + handlers
  useEffect(() => {
    localValueRef.current = localValue;
  }, [localValue]);
  useEffect(() => {
    isReversedRef.current = isReversed;
  }, [isReversed]);
  useEffect(() => {
    isMobileRef.current = isMobile;
  }, [isMobile]);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  // Select icon and label based on reversed state
  const Icon = isReversed ? config.negativeIcon : config.positiveIcon;
  const label = isReversed ? config.negativeLabel : config.positiveLabel;
  
  // Select gradient color based on theme and reversed state
  const gradientColor = isReversed 
    ? (isDark ? config.negativeColorDark : config.negativeColor)
    : (isDark ? config.colorDark : config.color);
  
  const currentIconColor = isReversed ? config.negativeIconColor : config.iconColor;

  // Use local value during drag, prop value otherwise
  const displayValueRaw = isDragging ? localValue : absValue;
  const displayValue = displayValueRaw !== 0
    ? (percentage !== undefined ? `${percentage}%` : displayValueRaw)
    : 'Off';
  
  const fillHeight = displayValueRaw * 10;
  const thumbBottom = fillHeight;
  // Mobile perf: avoid layout-driven `bottom:%` updates; track height is 100px on mobile (<640px).
  const mobileThumbTranslateY = 8 - fillHeight; // px, aligns thumb center to the value position

  const handlePointerDown = () => {
    setIsDragging(true);
    isDraggingRef.current = true;
    committedRef.current = false;
    onDragStart?.();
  };
  
  const handleChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setLocalValue(val);
    localValueRef.current = val;
    // On desktop: update store immediately for real-time sorting (lightweight, throttled)
    // On mobile: only update local state to avoid heavy sorting during drag
    if (!isMobile) {
      const newValue = isReversed ? -val : val;
      onChange(newValue);
    }
  };
  
  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      // On mobile: commit final value to store only on release (triggers sorting)
      // On desktop: value already updated in handleChange, but commit here for consistency
      const finalValue = isReversedRef.current ? -localValueRef.current : localValueRef.current;
      if (!committedRef.current) {
        committedRef.current = true;
        if (isMobileRef.current) {
          // On mobile, onChange was not called during drag, so commit now
          onChangeRef.current?.(finalValue);
        }
      }
      // On desktop, onChange was already called in handleChange, so this is just cleanup
      setIsDragging(false);
      isDraggingRef.current = false;
    }
  };
  
  // Handle pointer up/cancel globally (in case user releases outside)
  useEffect(() => {
    if (isDragging) {
      const handleGlobalPointerUp = () => {
        if (isDraggingRef.current) {
          // On mobile: commit final value to store only on release (triggers sorting)
          // On desktop: ensure state is synced
          const finalValue = isReversedRef.current ? -localValueRef.current : localValueRef.current;
          if (!committedRef.current) {
            committedRef.current = true;
            onChangeRef.current?.(finalValue);
          }
          setIsDragging(false);
          isDraggingRef.current = false;
        }
      };
      
      window.addEventListener('pointerup', handleGlobalPointerUp);
      window.addEventListener('pointercancel', handleGlobalPointerUp);
      
      return () => {
        window.removeEventListener('pointerup', handleGlobalPointerUp);
        window.removeEventListener('pointercancel', handleGlobalPointerUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5">
      {/* Value indicator at top */}
      <div 
        className={`
          font-mono text-sm font-medium min-w-[40px] text-center
          transition-colors duration-200
          ${displayValueRaw !== 0
            ? 'text-surface-600 dark:text-surface-400'
            : 'text-surface-400 dark:text-surface-500'
          }
        `}
      >
        {displayValue}
      </div>

      {/* Slider track container - responsive height */}
      <div className="relative h-[100px] sm:h-[110px] md:h-[120px] w-10 flex items-center justify-center">
        {/* Track background with gradient */}
        <div className="absolute inset-x-0 mx-auto w-2.5 h-full rounded-full bg-surface-300 dark:bg-surface-700 overflow-hidden">
          {/* Active fill - grows from bottom */}
          {/* On desktop: use height for better gradient rendering */}
          {/* On mobile: use scaleY transform for GPU acceleration */}
          {isMobile ? (
            <div
              className={`absolute left-0 right-0 bottom-0 bg-gradient-to-t origin-bottom transition-opacity duration-150 ${
                displayValueRaw !== 0 ? gradientColor : 'from-surface-400 to-surface-500'
              }`}
              style={{
                transform: `scaleY(${fillHeight / 100})`,
                opacity: displayValueRaw !== 0 ? 1 : 0.3,
              }}
            />
          ) : (
            <div
              className={`absolute left-0 right-0 bottom-0 bg-gradient-to-t ${
                isDragging ? 'transition-none' : 'transition-all duration-150'
              } ${
                displayValueRaw !== 0 ? gradientColor : 'from-surface-400 to-surface-500'
              }`}
              style={{
                height: `${fillHeight}%`,
                opacity: displayValueRaw !== 0 ? 1 : 0.3,
                willChange: 'height',
              }}
            />
          )}
        </div>

        {/* The actual range input - 0 to 10, step=1 for performance */}
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={localValue}
          onPointerDown={handlePointerDown}
          onChange={handleChange}
          onPointerUp={handlePointerUp}
          className="vertical-slider absolute opacity-0 cursor-pointer z-10"
          style={{ 
            writingMode: 'vertical-lr',
            direction: 'rtl',
            width: '40px',
            height: '100%',
          }}
        />

        {/* Custom thumb visualization */}
        {/* On desktop: use bottom position with transition */}
        {/* On mobile: use bottom position (still GPU-friendly) */}
        <div
          className={`
            absolute left-1/2 w-8 h-4 rounded-lg
            shadow-lg cursor-pointer pointer-events-none
            border-2 ${isDragging ? 'transition-colors duration-150' : 'transition-transform transition-colors duration-150'}
            ${displayValueRaw !== 0 
              ? `bg-gradient-to-b ${gradientColor} border-white/90` 
              : 'bg-surface-500 border-surface-400/50'
            }
          `}
          style={{
            bottom: isMobile ? 0 : `${thumbBottom}%`,
            transform: isMobile
              ? `translate(-50%, ${mobileThumbTranslateY}px)`
              : `translateX(-50%)`,
            marginBottom: isMobile ? 0 : '-8px',
            opacity: displayValueRaw !== 0 ? 1 : 0.6,
            willChange: 'transform',
          }}
        >
          {/* Grip lines */}
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
            <div className={`h-0.5 rounded-full ${displayValueRaw !== 0 ? 'bg-white/40' : 'bg-white/20'}`} />
            <div className={`h-0.5 rounded-full ${displayValueRaw !== 0 ? 'bg-white/40' : 'bg-white/20'}`} />
          </div>
        </div>
      </div>

      {/* Label and icon - clickable to toggle reverse */}
      <button
        onClick={onToggleReverse}
        className={`
          relative flex flex-col items-center gap-0.5 p-0.5 rounded-lg mt-0.5
          transition-all duration-200 hover:bg-surface-200/50 dark:hover:bg-surface-700/50
          active:scale-95 cursor-pointer select-none
        `}
        title={`Click to switch to ${isReversed ? config.positiveLabel : config.negativeLabel}`}
      >
        <div className="relative">
          <Icon 
            size={18} 
            className={`transition-colors ${displayValueRaw !== 0 ? currentIconColor : 'text-surface-400'}`} 
          />
          {isReversed && (
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
          )}
        </div>
        <span className={`
          text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap
          ${displayValueRaw !== 0 ? 'text-surface-800 dark:text-surface-100' : 'text-surface-500 dark:text-surface-400'}
        `}>
          {label}
        </span>
      </button>
    </div>
  );
}

export default memo(PrioritySlider);

