import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  Heart, 
  DollarSign, 
  Timer, 
  Flame, 
  Leaf,
  Cookie,
  Skull,
  Banknote,
  Hourglass,
  Zap,
  AlertTriangle
} from 'lucide-react';
import WorldMapWidget from './WorldMapWidget';
import { ECONOMIC_ZONES } from '../lib/RankingEngine';

/**
 * Priority slider configuration
 * Each slider ranges from 0 to 10 visually, with reversed mode for negative values
 */
const PRIORITY_CONFIG = [
  { 
    key: 'taste', 
    positiveLabel: 'Tasty',
    negativeLabel: 'Niche',
    positiveIcon: Utensils, 
    negativeIcon: Cookie,
    color: 'from-orange-300 to-orange-500',
    colorDark: 'from-orange-500 to-orange-400',
    negativeColor: 'from-rose-300 to-rose-500',
    negativeColorDark: 'from-rose-500 to-rose-400',
    iconColor: 'text-orange-400',
    negativeIconColor: 'text-rose-400',
    description: 'Flavor & enjoyment'
  },
  { 
    key: 'health', 
    positiveLabel: 'Healthy',
    negativeLabel: 'Junky',
    positiveIcon: Heart, 
    negativeIcon: Skull,
    color: 'from-red-300 to-red-500',
    colorDark: 'from-red-500 to-red-400',
    negativeColor: 'from-purple-300 to-purple-500',
    negativeColorDark: 'from-purple-500 to-purple-400',
    iconColor: 'text-red-400',
    negativeIconColor: 'text-purple-400',
    description: 'Nutritional value'
  },
  { 
    key: 'cheapness', 
    positiveLabel: 'Cheap',
    negativeLabel: 'Costly',
    positiveIcon: DollarSign, 
    negativeIcon: Banknote,
    color: 'from-emerald-300 to-emerald-500',
    colorDark: 'from-emerald-500 to-emerald-400',
    negativeColor: 'from-amber-300 to-amber-500',
    negativeColorDark: 'from-amber-500 to-amber-400',
    iconColor: 'text-emerald-400',
    negativeIconColor: 'text-amber-400',
    description: 'Lower cost'
  },
  { 
    key: 'speed', 
    positiveLabel: 'Speedy',
    negativeLabel: 'Timey',
    positiveIcon: Timer, 
    negativeIcon: Hourglass,
    color: 'from-blue-300 to-blue-500',
    colorDark: 'from-blue-500 to-blue-400',
    negativeColor: 'from-indigo-300 to-indigo-500',
    negativeColorDark: 'from-indigo-500 to-indigo-400',
    iconColor: 'text-blue-400',
    negativeIconColor: 'text-indigo-400',
    description: 'Quick to make'
  },
  { 
    key: 'lowCalorie', 
    positiveLabel: 'Low-Cal',
    negativeLabel: 'High-Cal',
    positiveIcon: Flame, 
    negativeIcon: Zap,
    color: 'from-purple-300 to-purple-500',
    colorDark: 'from-purple-500 to-purple-400',
    negativeColor: 'from-orange-300 to-red-500',
    negativeColorDark: 'from-orange-500 to-red-400',
    iconColor: 'text-purple-400',
    negativeIconColor: 'text-orange-400',
    description: 'Lower kcal/100g'
  },
  { 
    key: 'ethics', 
    positiveLabel: 'Ethical',
    negativeLabel: 'Unethical',
    positiveIcon: Leaf, 
    negativeIcon: AlertTriangle,
    color: 'from-lime-300 to-green-500',
    colorDark: 'from-lime-500 to-green-400',
    negativeColor: 'from-red-300 to-red-600',
    negativeColorDark: 'from-red-600 to-red-500',
    iconColor: 'text-lime-400',
    negativeIconColor: 'text-red-400',
    description: 'Ethical sourcing'
  },
];

/**
 * Calculate percentage contribution of each priority
 */
function calculatePercentages(priorities) {
  const total = PRIORITY_CONFIG.reduce((sum, config) => {
    return sum + Math.abs(priorities[config.key] || 0);
  }, 0);
  
  if (total === 0) return {};
  
  const percentages = {};
  PRIORITY_CONFIG.forEach(config => {
    const absValue = Math.abs(priorities[config.key] || 0);
    percentages[config.key] = Math.round((absValue / total) * 100);
  });
  
  return percentages;
}

// Small delay before committing priorities to parent (which triggers ranking/sorting).
// This lets the slider's last framer-motion tween finish without being interrupted by heavy computation.
const COMMIT_DELAY_MS = 150;

/**
 * Single vertical slider component styled like audio mixer fader
 * Now with 0-10 range and reversible labels
 */
function VerticalSlider({ config, value, percentage, onChange, onDragStart, onToggleReverse }) {
  const isReversed = value < 0;
  const absValue = Math.abs(value);
  const isActive = absValue !== 0;
  
  // Check if dark theme is active
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Select icon and label based on reversed state
  const Icon = isReversed ? config.negativeIcon : config.positiveIcon;
  const label = isReversed ? config.negativeLabel : config.positiveLabel;
  
  // Select gradient color based on theme and reversed state
  const gradientColor = isReversed 
    ? (isDark ? config.negativeColorDark : config.negativeColor)
    : (isDark ? config.colorDark : config.color);
  
  const currentIconColor = isReversed ? config.negativeIconColor : config.iconColor;

  // Format display value
  const displayValue = isActive 
    ? (percentage !== undefined ? `${percentage}%` : absValue)
    : 'Off';

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5">
      {/* Value indicator at top */}
      <div 
        className={`
          font-mono text-sm font-medium min-w-[40px] text-center
          transition-colors duration-200
          ${isActive 
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
        <div className="absolute inset-x-0 mx-auto w-2 h-full rounded-full bg-surface-300 dark:bg-surface-700 overflow-hidden">
          {/* Active fill - grows from bottom */}
          <motion.div
            className={`absolute left-0 right-0 bottom-0 bg-gradient-to-t ${isActive ? gradientColor : 'from-surface-400 to-surface-500'}`}
            initial={false}
            animate={{
              height: `${absValue * 10}%`,
              opacity: isActive ? 1 : 0.3,
            }}
            transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
          />
        </div>

        {/* The actual range input - 0 to 10 */}
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={absValue}
          onPointerDown={onDragStart}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            const roundedVal = Math.round(val);
            // Preserve the sign (reversed state)
            const newValue = isReversed ? -roundedVal : roundedVal;
            onChange(newValue);
          }}
          className="vertical-slider absolute opacity-0 cursor-pointer z-10"
          style={{ 
            writingMode: 'vertical-lr',
            direction: 'rtl',
            width: '40px',
            height: '100%',
          }}
        />

        {/* Custom thumb visualization */}
        <motion.div
          className={`
            absolute left-1/2 -translate-x-1/2 w-8 h-4 rounded-md
            shadow-lg cursor-pointer pointer-events-none
            border-2
            ${isActive 
              ? `bg-gradient-to-b ${gradientColor} border-white/90` 
              : 'bg-surface-500 border-surface-400/50'
            }
          `}
          initial={false}
          animate={{
            bottom: `${absValue * 10}%`,
            opacity: isActive ? 1 : 0.6,
          }}
          transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
          style={{ marginBottom: '-8px' }}
        >
          {/* Grip lines */}
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
            <div className={`h-0.5 rounded-full ${isActive ? 'bg-white/40' : 'bg-white/20'}`} />
            <div className={`h-0.5 rounded-full ${isActive ? 'bg-white/40' : 'bg-white/20'}`} />
          </div>
        </motion.div>
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
            className={`transition-colors ${isActive ? currentIconColor : 'text-surface-400'}`} 
          />
          {isReversed && (
            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
          )}
        </div>
        <span className={`
          text-[10px] sm:text-xs font-medium transition-colors whitespace-nowrap
          ${isActive ? 'text-surface-800 dark:text-surface-100' : 'text-surface-500 dark:text-surface-400'}
        `}>
          {label}
        </span>
      </button>
    </div>
  );
}

/**
 * Compact priority icon for collapsed state on mobile
 * Shows icon with percentage indicator and reversed state support
 */
function CompactPriorityIcon({ config, value, percentage }) {
  const isReversed = value < 0;
  const Icon = isReversed ? config.negativeIcon : config.positiveIcon;
  const label = isReversed ? config.negativeLabel : config.positiveLabel;
  const currentIconColor = isReversed ? config.negativeIconColor : config.iconColor;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div 
        className={`
          relative w-8 h-8 rounded-lg flex items-center justify-center
          ${isReversed 
            ? 'bg-rose-500/20 border border-rose-500/40' 
            : 'bg-emerald-500/20 border border-emerald-500/40'
          }
        `}
      >
        <Icon size={16} className={currentIconColor} />
        {/* Small percentage badge */}
        <div 
          className={`
            absolute -top-1 -right-1 min-w-[18px] h-3.5 px-1
            rounded text-[9px] font-bold flex items-center justify-center
            ${isReversed 
              ? 'bg-rose-500 text-white' 
              : 'bg-emerald-500 text-white'
            }
          `}
        >
          {percentage !== undefined ? `${percentage}%` : Math.abs(value)}
        </div>
      </div>
      <span className="text-[9px] text-surface-400 font-medium truncate max-w-[44px]">
        {label}
      </span>
    </div>
  );
}

/**
 * Compact zone indicator for collapsed state on mobile
 */
function CompactZoneIcon({ zoneId }) {
  const zone = ECONOMIC_ZONES[zoneId];
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center
          bg-blue-500/20 border border-blue-500/40"
      >
        <span className="text-base">{zone.emoji}</span>
      </div>
      <span className="text-[9px] text-surface-400 font-medium truncate max-w-[40px]">
        {zone.name}
      </span>
    </div>
  );
}

/**
 * Main Priorities Panel Component
 * Collapsible audio-mixer style priority sliders
 * 
 * Optimization: Uses draft state during slider drag to avoid
 * expensive re-renders. Only commits to parent on pointer release.
 */
export default function PrioritiesPanel({ 
  priorities, 
  onPrioritiesChange, 
  selectedZone, 
  onZoneChange,
  expandedDish,
  onCollapseExpandedDish,
  onExpandedChange,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const reduceMotion = useReducedMotion();
  const lite = reduceMotion;
  const zoneButtonElementRef = useRef(null);
  const zoneDropdownRef = useRef(null);
  
  const [draft, setDraft] = useState(priorities);
  const [isDragging, setIsDragging] = useState(false);
  const draftRef = useRef(draft);
  const commitTimeoutRef = useRef(null);
  const isPendingCommitRef = useRef(false);
  const lastExpandedAtRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const pullDownTimerRef = useRef(null);
  const isPullingDownRef = useRef(false);
  const touchStartYRef = useRef(null);
  const isExpandedRef = useRef(isExpanded);
  const expandedDishRef = useRef(expandedDish);
  
  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { isExpandedRef.current = isExpanded; }, [isExpanded]);
  useEffect(() => { expandedDishRef.current = expandedDish; }, [expandedDish]);

  useEffect(() => {
    return () => {
      if (commitTimeoutRef.current) {
        clearTimeout(commitTimeoutRef.current);
        commitTimeoutRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    // Don't sync draft with priorities if there's a pending commit or dragging
    if (!isDragging && !isPendingCommitRef.current) {
      setDraft(priorities);
    }
  }, [priorities, isDragging]);
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handlePointerUp = () => {
      setIsDragging(false);
      if (commitTimeoutRef.current) {
        clearTimeout(commitTimeoutRef.current);
        commitTimeoutRef.current = null;
      }
      const commitValue = { ...draftRef.current };
      isPendingCommitRef.current = true;
      commitTimeoutRef.current = setTimeout(() => {
        onPrioritiesChange(commitValue);
        commitTimeoutRef.current = null;
        isPendingCommitRef.current = false;
      }, COMMIT_DELAY_MS);
    };
    
    window.addEventListener('pointerup', handlePointerUp, { once: true });
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [isDragging, onPrioritiesChange]);

  // Helper function to check if at top
  const getScrollable = () => {
    return document.querySelector('main .overflow-y-auto') ||
           document.querySelector('.overflow-y-auto');
  };

  useEffect(() => {
    const scrollable = getScrollable();
    if (!scrollable) return;

    const cancelPullDownTimer = () => {
      if (pullDownTimerRef.current) {
        clearTimeout(pullDownTimerRef.current);
        pullDownTimerRef.current = null;
      }
      isPullingDownRef.current = false;
    };

    const handleScroll = () => {
      const currentScrollY = scrollable.scrollTop;
      const previousScrollY = lastScrollYRef.current;
      const scrollDelta = currentScrollY - previousScrollY;
      const isScrollingDown = scrollDelta > 0;

      // Update last scroll position
      lastScrollYRef.current = currentScrollY;

      // Cancel pull-down if scrolling down
      if (isScrollingDown) {
        cancelPullDownTimer();
      }

      // Collapse when scrolling down past threshold
      if (isExpandedRef.current && currentScrollY > 30 && !expandedDishRef.current) {
        setIsExpanded(false);
        cancelPullDownTimer();
      }
    };

    // Initialize scroll position
    lastScrollYRef.current = scrollable.scrollTop;

    scrollable.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollable.removeEventListener('scroll', handleScroll);
      cancelPullDownTimer();
    };
  }, []);

  // Handle wheel events (mouse wheel) for pull-down detection
  useEffect(() => {
    const scrollable = getScrollable();
    if (!scrollable) return;

    const cancelPullDownTimer = () => {
      if (pullDownTimerRef.current) {
        clearTimeout(pullDownTimerRef.current);
        pullDownTimerRef.current = null;
      }
      isPullingDownRef.current = false;
    };

    const startPullDownTimer = () => {
      // Don't start if already expanded
      if (isExpandedRef.current) {
        cancelPullDownTimer();
        return;
      }

      cancelPullDownTimer();
      isPullingDownRef.current = true;
      pullDownTimerRef.current = setTimeout(() => {
        // Check again before expanding
        if (isExpandedRef.current) {
          pullDownTimerRef.current = null;
          isPullingDownRef.current = false;
          return;
        }

        const timeSinceExpansion = Date.now() - lastExpandedAtRef.current;
        const justExpanded = expandedDishRef.current && timeSinceExpansion < 600;
        
        if (expandedDishRef.current && !justExpanded) {
          onCollapseExpandedDish?.();
          setIsExpanded(true);
        } else if (!expandedDishRef.current) {
          setIsExpanded(true);
        }
        
        pullDownTimerRef.current = null;
        isPullingDownRef.current = false;
      }, 30);
    };

    const isAtTop = () => {
      return scrollable.scrollTop <= 10;
    };

    const handleWheel = (e) => {
      // Don't handle if already expanded
      if (isExpandedRef.current) {
        cancelPullDownTimer();
        return;
      }

      // Check if scrolling up (negative deltaY) and at top
      if (e.deltaY < 0 && isAtTop()) {
        startPullDownTimer();
      } else {
        cancelPullDownTimer();
      }
    };

    scrollable.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      scrollable.removeEventListener('wheel', handleWheel);
      cancelPullDownTimer();
    };
  }, [onCollapseExpandedDish]);

  // Handle touch events for pull-down detection on mobile
  useEffect(() => {
    const scrollable = getScrollable();
    if (!scrollable) return;

    const cancelPullDownTimer = () => {
      if (pullDownTimerRef.current) {
        clearTimeout(pullDownTimerRef.current);
        pullDownTimerRef.current = null;
      }
      isPullingDownRef.current = false;
    };

    const startPullDownTimer = () => {
      // Don't start if already expanded
      if (isExpandedRef.current) {
        cancelPullDownTimer();
        return;
      }

      cancelPullDownTimer();
      isPullingDownRef.current = true;
      pullDownTimerRef.current = setTimeout(() => {
        // Check again before expanding
        if (isExpandedRef.current) {
          pullDownTimerRef.current = null;
          isPullingDownRef.current = false;
          return;
        }

        const timeSinceExpansion = Date.now() - lastExpandedAtRef.current;
        const justExpanded = expandedDishRef.current && timeSinceExpansion < 600;
        
        if (expandedDishRef.current && !justExpanded) {
          onCollapseExpandedDish?.();
          setIsExpanded(true);
        } else if (!expandedDishRef.current) {
          setIsExpanded(true);
        }
        
        pullDownTimerRef.current = null;
        isPullingDownRef.current = false;
      }, 30);
    };

    const isAtTop = () => {
      return scrollable.scrollTop <= 10;
    };

    const handleTouchStart = (e) => {
      // Don't handle if already expanded
      if (isExpandedRef.current) {
        touchStartYRef.current = null;
        return;
      }

      if (isAtTop()) {
        touchStartYRef.current = e.touches[0].clientY;
      } else {
        touchStartYRef.current = null;
      }
    };

    const handleTouchMove = (e) => {
      // Don't handle if already expanded
      if (isExpandedRef.current) {
        cancelPullDownTimer();
        touchStartYRef.current = null;
        return;
      }

      if (touchStartYRef.current === null) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartYRef.current;

      // If user is pulling down (touch moving down, which means scrolling up)
      if (deltaY > 0 && isAtTop()) {
        startPullDownTimer();
      } else {
        cancelPullDownTimer();
      }
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = null;
      cancelPullDownTimer();
    };

    scrollable.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollable.addEventListener('touchmove', handleTouchMove, { passive: true });
    scrollable.addEventListener('touchend', handleTouchEnd, { passive: true });
    scrollable.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      scrollable.removeEventListener('touchstart', handleTouchStart);
      scrollable.removeEventListener('touchmove', handleTouchMove);
      scrollable.removeEventListener('touchend', handleTouchEnd);
      scrollable.removeEventListener('touchcancel', handleTouchEnd);
      cancelPullDownTimer();
    };
  }, [onCollapseExpandedDish]);

  useEffect(() => {
    if (expandedDish && isExpanded) {
      lastExpandedAtRef.current = Date.now();
      setIsExpanded(false);
    }
  }, [expandedDish, isExpanded]);

  // Notify parent about expanded state changes
  useEffect(() => {
    if (onExpandedChange) {
      onExpandedChange(isExpanded);
    }
  }, [isExpanded, onExpandedChange]);

  const closeDropdown = () => {
    setIsZoneDropdownOpen(false);
    setDropdownPosition(null);
    zoneButtonElementRef.current = null;
  };
  
  const handleZoneButtonClick = (event) => {
    const buttonElement = event.currentTarget;
    const previousButton = zoneButtonElementRef.current;
    zoneButtonElementRef.current = buttonElement;
  
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  
    // Клик по той же кнопке — закрываем, по другой — открываем/перепозиционируем
    setIsZoneDropdownOpen((wasOpen) =>
      wasOpen && previousButton === buttonElement ? false : true
    );
  };
  
  useEffect(() => {
    if (!isZoneDropdownOpen) return;
  
    const buttonRef = zoneButtonElementRef.current;
    
    const handleClickOutside = (event) => {
      if (
        buttonRef && !buttonRef.contains(event.target) &&
        zoneDropdownRef.current && !zoneDropdownRef.current.contains(event.target)
      ) {
        closeDropdown();
      }
    };

    const handleScroll = (event) => {
      let element = event.target;
      while (element && element !== document.body) {
        if (element === zoneDropdownRef.current) {
          return;
        }
        element = element.parentElement;
      }
      closeDropdown();
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isZoneDropdownOpen]);

  const displayed = draft;
  const activePriorities = PRIORITY_CONFIG.filter(
    config => displayed[config.key] !== 0
  );
  const allPrioritiesZero = Object.values(displayed).every(v => v === 0);
  
  // Calculate percentages for display
  const percentages = useMemo(() => calculatePercentages(displayed), [displayed]);

  const handleDragStart = () => {
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
      commitTimeoutRef.current = null;
    }
    isPendingCommitRef.current = false;
    if (!isDragging) setIsDragging(true);
  };

  const handleSliderChange = (key, value) => {
    setDraft(prev => ({ ...prev, [key]: value }));
  };
  
  // Toggle between positive and negative (reversed) state
  const handleToggleReverse = (key) => {
    setDraft(prev => {
      const currentValue = prev[key];
      // If zero, set to a default value in the new direction
      if (currentValue === 0) {
        return { ...prev, [key]: -5 }; // Start reversed at 5
      }
      // Otherwise flip the sign
      return { ...prev, [key]: -currentValue };
    });
    
    // Commit the change after a short delay
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
      commitTimeoutRef.current = null;
    }
    isPendingCommitRef.current = true;
    commitTimeoutRef.current = setTimeout(() => {
      onPrioritiesChange({ ...draftRef.current });
      commitTimeoutRef.current = null;
      isPendingCommitRef.current = false;
    }, COMMIT_DELAY_MS);
  };

  const handleReset = () => {
    const resetPriorities = {};
    PRIORITY_CONFIG.forEach(config => {
      resetPriorities[config.key] = 0;
    });
    if (commitTimeoutRef.current) {
      clearTimeout(commitTimeoutRef.current);
      commitTimeoutRef.current = null;
    }
    isPendingCommitRef.current = false;
    setIsDragging(false);
    setDraft(resetPriorities);
    onPrioritiesChange(resetPriorities);
  };

  return (
    <div className="bg-white dark:bg-surface-800 border-b border-surface-300/50 dark:border-surface-700/50">
      {/* Header - always visible */}
      <div className="px-4 py-2">
        {isExpanded ? (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_260px] gap-4 items-center">
            {/* Left header: priorities - на мобильных включает кнопку сворачивания */}
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display font-semibold text-lg text-surface-800 dark:text-surface-100 whitespace-nowrap">
                My Priorities
              </h2>
              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 
                             hover:text-surface-700 dark:hover:text-surface-200 
                             hover:bg-surface-200/50 dark:hover:bg-surface-700/50 
                             rounded-lg transition-colors whitespace-nowrap"
                >
                  Reset
                </motion.button>
                {/* Кнопка сворачивания для узких экранов - внутри того же flex контейнера */}
                <button
                  onClick={() => {
                    setIsExpanded(!isExpanded);
                    if (pullDownTimerRef.current) {
                      clearTimeout(pullDownTimerRef.current);
                      pullDownTimerRef.current = null;
                    }
                  }}
                  className="sm:hidden p-2 rounded-lg hover:bg-surface-200/50 dark:hover:bg-surface-700/50 transition-colors flex-shrink-0"
                  aria-label="Collapse panels"
                >
                  <ChevronUp size={20} className="text-surface-500 dark:text-surface-300" />
                </button>
              </div>
            </div>

            {/* Right header: map - скрываем на узких экранах */}
            <div className="hidden sm:flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-surface-800 dark:text-surface-100">
                Economic Zone
              </h2>
              <button
                onClick={() => {
                  setIsExpanded(!isExpanded);
                  if (pullDownTimerRef.current) {
                    clearTimeout(pullDownTimerRef.current);
                    pullDownTimerRef.current = null;
                  }
                }}
                className="p-2 rounded-lg hover:bg-surface-200/50 dark:hover:bg-surface-700/50 transition-colors"
                aria-label="Collapse panels"
              >
                <ChevronUp size={20} className="text-surface-500 dark:text-surface-300" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Collapsed view - compact icon grid for all screens */}
            <div>
              <button
                onClick={() => {
                  setIsExpanded(true);
                  if (pullDownTimerRef.current) {
                    clearTimeout(pullDownTimerRef.current);
                    pullDownTimerRef.current = null;
                  }
                  if (onCollapseExpandedDish) {
                    onCollapseExpandedDish();
                  }
                }}
                className="w-full flex flex-col min-[480px]:flex-row items-start min-[480px]:items-center justify-between gap-2 min-[480px]:gap-3 hover:opacity-80 transition-opacity"
              >
                {/* First row: "My Priorities" + chevron (always in one line) */}
                <div className="flex items-center justify-between gap-3 w-full min-[480px]:w-auto min-[480px]:flex-1 min-[480px]:min-w-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <h2 className="font-display font-semibold text-sm min-[480px]:text-lg text-surface-800 dark:text-surface-100 whitespace-nowrap">
                      My Priorities
                    </h2>
                    {/* Compact icons row - показываем только на широких экранах, рядом с текстом */}
                    <div className="hidden min-[480px]:flex items-center gap-1.5 overflow-x-auto py-1 hide-scrollbar">
                      {activePriorities.length > 0 ? (
                        activePriorities.map(config => (
                          <CompactPriorityIcon
                            key={config.key}
                            config={config}
                            value={displayed[config.key]}
                            percentage={percentages[config.key]}
                          />
                        ))
                      ) : (
                        <span className="text-xs text-surface-400 italic">No priorities set</span>
                      )}
                      {selectedZone && <CompactZoneIcon zoneId={selectedZone} />}
                    </div>
                  </div>
                  <ChevronDown size={20} className="text-surface-500 dark:text-surface-300 flex-shrink-0" />
                </div>
                {/* Compact icons row - показываем только на узких экранах, под текстом */}
                <div className="flex min-[480px]:hidden items-center gap-1.5 overflow-x-auto py-1 hide-scrollbar w-full">
                  {activePriorities.length > 0 ? (
                    activePriorities.map(config => (
                      <CompactPriorityIcon
                        key={config.key}
                        config={config}
                        value={displayed[config.key]}
                        percentage={percentages[config.key]}
                      />
                    ))
                  ) : (
                    <span className="text-xs text-surface-400 italic">No priorities set</span>
                  )}
                  {selectedZone && <CompactZoneIcon zoneId={selectedZone} />}
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main content: left priorities + right economic zone map */}
      {lite ? (
        isExpanded ? (
          <div className="overflow-hidden">
            <div className="px-4 pb-2.5">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                {/* Left: priorities board (wide) */}
                <div className="flex-1 bg-white/60 dark:bg-surface-800/80 rounded-xl p-1.5 sm:p-2 border border-surface-300/50 dark:border-surface-700/50 shadow-sm dark:shadow-none flex flex-col">
                  {/* Sliders grid */}
                  <div className="flex justify-around items-start gap-0.5 sm:gap-2 sm:gap-3 overflow-x-auto hide-scrollbar">
                    {PRIORITY_CONFIG.map(config => (
                      <VerticalSlider
                        key={config.key}
                        config={config}
                        value={displayed[config.key]}
                        percentage={percentages[config.key]}
                        onChange={(val) => handleSliderChange(config.key, val)}
                        onDragStart={handleDragStart}
                        onToggleReverse={() => handleToggleReverse(config.key)}
                      />
                    ))}
                  </div>
                  
                  {/* Hint when all priorities are zero */}
                  {allPrioritiesZero && (
                    <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-300/90 text-center">
                        💡 Adjust the sliders above to rank dishes by your preferences. 
                        All dishes currently show a neutral score (50).
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: economic zone (square) - скрываем карту на узких экранах */}
                <div className="hidden sm:block sm:w-[260px] bg-white/60 dark:bg-surface-800/80 rounded-xl p-2 sm:p-3 border border-surface-300/50 dark:border-surface-700/50 shadow-sm dark:shadow-none flex flex-col">
                  <div className="w-full relative flex-shrink-0 flex-1" style={{ height: '140px' }}>
                    <WorldMapWidget
                      variant="square"
                      selectedZone={selectedZone}
                      onZoneSelect={onZoneChange}
                    />
                    <div className="absolute -bottom-1 left-1 text-[9px] text-surface-500 dark:text-surface-400 leading-snug pointer-events-none z-10 whitespace-nowrap">
                      Select an economic zone to calculate local prices
                    </div>
                  </div>

                  <div className="mt-auto pt-3 relative flex-shrink-0">
                    <button
                      onClick={handleZoneButtonClick}
                      className="flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:opacity-80 transition-opacity w-full text-left"
                    >
                      <span className="text-lg">{ECONOMIC_ZONES[selectedZone]?.emoji}</span>
                      <span className="truncate flex-1">{ECONOMIC_ZONES[selectedZone]?.name}</span>
                      <ChevronDown 
                        size={16} 
                        className={`text-surface-500 dark:text-surface-400 transition-transform ${isZoneDropdownOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null
      ) : (
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-2.5">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  {/* Left: priorities board (wide) */}
                  <div className="flex-1 bg-white/60 dark:bg-surface-800/80 rounded-xl p-1.5 sm:p-2 border border-surface-300/50 dark:border-surface-700/50 shadow-sm dark:shadow-none flex flex-col">
                    {/* Sliders grid */}
                    <div className="flex justify-around items-start gap-0.5 sm:gap-2 sm:gap-3 overflow-x-auto hide-scrollbar">
                      {PRIORITY_CONFIG.map(config => (
                        <VerticalSlider
                          key={config.key}
                          config={config}
                          value={displayed[config.key]}
                          percentage={percentages[config.key]}
                          onChange={(val) => handleSliderChange(config.key, val)}
                          onDragStart={handleDragStart}
                          onToggleReverse={() => handleToggleReverse(config.key)}
                        />
                      ))}
                    </div>
                    
                    {/* Hint when all priorities are zero */}
                    {allPrioritiesZero && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
                      >
                        <p className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-300/90 text-center">
                          Adjust the sliders above to rank dishes by your preferences.
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Right: economic zone (square) - скрываем карту на узких экранах */}
                  <div className="hidden sm:block sm:w-[260px] bg-white/60 dark:bg-surface-800/80 rounded-xl p-2 sm:p-3 border border-surface-300/50 dark:border-surface-700/50 shadow-sm dark:shadow-none flex flex-col">
                    <div className="w-full relative flex-shrink-0 flex-1" style={{ height: '140px' }}>
                      <WorldMapWidget
                        variant="square"
                        selectedZone={selectedZone}
                        onZoneSelect={onZoneChange}
                      />
                      <div className="absolute -top-1 right-1 text-[9px] text-surface-500 dark:text-surface-400 leading-snug pointer-events-none z-10 whitespace-nowrap">
                        Select a region to calculate prices
                      </div>
                    </div>

                    <div className="mt-auto pt-3 relative flex-shrink-0">
                      <button
                        onClick={handleZoneButtonClick}
                        className="flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-200 hover:opacity-80 transition-opacity w-full text-left"
                      >
                        <span className="text-lg">{ECONOMIC_ZONES[selectedZone]?.emoji}</span>
                        <span className="truncate flex-1">{ECONOMIC_ZONES[selectedZone]?.name}</span>
                        <ChevronDown 
                          size={16} 
                          className={`text-surface-500 dark:text-surface-400 transition-transform ${isZoneDropdownOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {isZoneDropdownOpen && dropdownPosition && createPortal(
        <div 
          ref={zoneDropdownRef}
          className="fixed bg-white dark:bg-surface-800 rounded-lg border border-surface-300 dark:border-surface-700 shadow-lg z-[100] max-h-64 overflow-y-auto"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
          }}
        >
          {Object.entries(ECONOMIC_ZONES).map(([zoneId, zone]) => (
            <button
              key={zoneId}
              onClick={() => {
                onZoneChange(zoneId);
                closeDropdown();
              }}
              className={`
                w-full px-3 py-2 text-left text-sm flex items-center gap-2
                transition-colors
                ${selectedZone === zoneId
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700'
                }
              `}
            >
              <span className="text-lg">{zone.emoji}</span>
              <span className="flex-1">{zone.name}</span>
              {selectedZone === zoneId && (
                <span className="text-blue-500">✓</span>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}



