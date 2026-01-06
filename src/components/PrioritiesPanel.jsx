import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  Heart, 
  DollarSign, 
  Clock, 
  Beef, 
  Flame, 
  Leaf 
} from 'lucide-react';
import WorldMapWidget from './WorldMapWidget';
import { ECONOMIC_ZONES } from '../lib/RankingEngine';
import { useIsMobile } from '../lib/useIsMobile';

/**
 * Priority slider configuration
 * Each slider ranges from -10 to +10
 */
const PRIORITY_CONFIG = [
  { 
    key: 'taste', 
    label: 'Taste', 
    icon: Utensils, 
    color: 'from-orange-400 to-amber-500',
    iconColor: 'text-orange-400',
    description: 'Flavor & enjoyment'
  },
  { 
    key: 'health', 
    label: 'Health', 
    icon: Heart, 
    color: 'from-red-400 to-red-500',
    iconColor: 'text-red-400',
    description: 'Nutritional value'
  },
  { 
    key: 'cheapness', 
    label: 'Budget', 
    icon: DollarSign, 
    color: 'from-emerald-400 to-teal-500',
    iconColor: 'text-emerald-400',
    description: 'Lower cost'
  },
  { 
    key: 'speed', 
    label: 'Speed', 
    icon: Clock, 
    color: 'from-blue-400 to-cyan-500',
    iconColor: 'text-blue-400',
    description: 'Quick to make'
  },
  { 
    key: 'satiety', 
    label: 'Satiety', 
    icon: Beef, 
    color: 'from-amber-400 to-orange-500',
    iconColor: 'text-amber-400',
    description: 'Filling & satisfying'
  },
  { 
    key: 'lowCalorie', 
    label: 'Low-Cal', 
    icon: Flame, 
    color: 'from-purple-400 to-purple-500',
    iconColor: 'text-purple-400',
    description: 'Lower kcal/100g'
  },
  { 
    key: 'ethics', 
    label: 'Ethics', 
    icon: Leaf, 
    color: 'from-lime-400 to-green-500',
    iconColor: 'text-lime-400',
    description: 'Ethical sourcing'
  },
];

/**
 * Single vertical slider component styled like audio mixer fader
 */
function VerticalSlider({ config, value, onChange, onDragStart }) {
  const Icon = config.icon;
  const isActive = value !== 0;
  const isPositive = value > 0;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Value indicator at top */}
      <div 
        className={`
          font-mono text-sm font-semibold min-w-[40px] text-center
          transition-colors duration-200
          ${isActive 
            ? isPositive 
              ? 'text-emerald-400' 
              : 'text-rose-400' 
            : 'text-surface-400'
          }
        `}
      >
        {value === 10 ? 'max' : value === -10 ? 'min' : (value > 0 ? '+' : '') + value}
      </div>

      {/* Slider track container */}
      <div className="relative h-[140px] w-10 flex items-center justify-center">
        {/* Track background with gradient */}
        <div className="absolute inset-x-0 mx-auto w-2 h-full rounded-full bg-surface-300 dark:bg-surface-700 overflow-hidden">
          {/* Active fill - positive values (grow upward from center) */}
          {value >= 0 && (
            <motion.div
              className={`absolute left-0 right-0 bottom-1/2 bg-gradient-to-t ${config.color}`}
              initial={false}
              animate={{
                height: `${value * 5}%`,
              }}
              transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
            />
          )}
          {/* Active fill - negative values (grow downward from center) */}
          {value < 0 && (
            <motion.div
              className={`absolute left-0 right-0 top-1/2 bg-gradient-to-b ${config.color}`}
              initial={false}
              animate={{
                height: `${Math.abs(value) * 5}%`,
              }}
              transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
            />
          )}
          {/* Zero line marker */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-surface-400 dark:bg-surface-500 -translate-y-0.5" />
        </div>

        {/* The actual range input */}
        <input
          type="range"
          min="-10"
          max="10"
          step="0.1"
          value={value}
          onPointerDown={onDragStart}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (val >= -1.5 && val < -1.2) {
              onChange(-1);
            } else if (val > 1.2 && val <= 1.5) {
              onChange(1);
            } else if (val >= -1.2 && val <= 1.2) {
              onChange(0);
            } else {
              onChange(Math.round(val));
            }
          }}
          className="vertical-slider absolute opacity-0 cursor-pointer z-10"
          style={{ 
            writingMode: 'vertical-lr',
            direction: 'rtl',
            width: '40px',
            height: '140px',
          }}
        />

        {/* Custom thumb visualization */}
        <motion.div
          className={`
            absolute left-1/2 -translate-x-1/2 w-8 h-4 rounded-md
            bg-gradient-to-b ${config.color}
            shadow-lg cursor-pointer pointer-events-none
            border-2 border-white/90
          `}
          initial={false}
          animate={{
            top: `${50 - (value * 5)}%`,
          }}
          transition={{ type: 'tween', duration: 0.15, ease: 'easeOut' }}
          style={{ marginTop: '-8px' }}
        >
          {/* Grip lines */}
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
            <div className="h-0.5 bg-white/40 rounded-full" />
            <div className="h-0.5 bg-white/40 rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Label and icon */}
      <div className="flex flex-col items-center gap-1">
        <Icon 
          size={18} 
          className={`transition-colors ${isActive ? config.iconColor : 'text-surface-400'}`} 
        />
        <span className={`
          text-xs font-medium transition-colors
          ${isActive ? 'text-surface-800 dark:text-surface-100' : 'text-surface-500 dark:text-surface-400'}
        `}>
          {config.label}
        </span>
      </div>
    </div>
  );
}

/**
 * Chip showing active priority in collapsed state
 */
function PriorityChip({ config, value }) {
  const Icon = config.icon;
  const isPositive = value > 0;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
        text-xs font-semibold
        ${isPositive 
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
        }
      `}
    >
      <Icon size={12} />
      <span>{config.label}</span>
      <span className="font-mono">{value === 10 ? 'max' : value === -10 ? 'min' : (value > 0 ? '+' : '') + value}</span>
    </motion.div>
  );
}

/**
 * Chip showing selected economic zone in collapsed state
 */
function ZoneChip({ zoneId }) {
  const zone = ECONOMIC_ZONES[zoneId];
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30"
    >
      <span className="text-sm">{zone.emoji}</span>
      <span>{zone.name}</span>
    </motion.div>
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
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const lite = isMobile || reduceMotion;
  
  // Draft state for smooth slider interaction without triggering list recalc
  const [draft, setDraft] = useState(priorities);
  const [isDragging, setIsDragging] = useState(false);
  
  // Keep ref to latest draft for commit on pointerup
  const draftRef = useRef(draft);
  useEffect(() => { draftRef.current = draft; }, [draft]);
  
  // Track when a dish card was expanded to prevent false scroll triggers
  const lastExpandedAtRef = useRef(0);
  
  // Sync draft with external priorities when not dragging
  // (e.g., on initial load or external reset)
  useEffect(() => {
    if (!isDragging) {
      setDraft(priorities);
    }
  }, [priorities, isDragging]);
  
  // Global pointerup listener to commit draft when drag ends
  useEffect(() => {
    if (!isDragging) return;
    
    const handlePointerUp = () => {
      setIsDragging(false);
      // Commit the draft to parent (triggers list recalculation)
      onPrioritiesChange(draftRef.current);
    };
    
    window.addEventListener('pointerup', handlePointerUp, { once: true });
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [isDragging, onPrioritiesChange]);

  // Auto-collapse on scroll down (> 30px), expand again when near top
  useEffect(() => {
    const scrollable =
      document.querySelector('main .overflow-y-auto') ||
      document.querySelector('.overflow-y-auto');

    if (!scrollable) return;

    const handleScroll = () => {
      const currentScrollY = scrollable.scrollTop;

      // Игнорируем авто-скролл события сразу после открытия карточки
      // (когда сворачивание панели вызывает изменение layout и scrollTop)
      const timeSinceExpansion = Date.now() - lastExpandedAtRef.current;
      const justExpanded = expandedDish && timeSinceExpansion < 600;

      // Если пользователь скроллит вверх и близко к верху (<= 10px)
      if (currentScrollY <= 10) {
        // Если карточка блюда открыта, закрываем её и открываем панель priorities
        // Но только если это не ложное срабатывание от изменения layout
        if (expandedDish && !justExpanded) {
          if (onCollapseExpandedDish) {
            onCollapseExpandedDish();
          }
          setIsExpanded(true);
        }
        // Если панель свернута и карточка не открыта, разворачиваем панель
        else if (!isExpanded && !expandedDish) {
          setIsExpanded(true);
        }
      }
      // Collapse once пользователь ушел дальше 30px вниз (только если карточка не открыта)
      else if (isExpanded && currentScrollY > 30 && !expandedDish) {
        setIsExpanded(false);
      }
    };

    scrollable.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollable.removeEventListener('scroll', handleScroll);
    };
  }, [isExpanded, onCollapseExpandedDish, expandedDish]);

  // Если раскрылась карточка блюда — сворачиваем панель
  useEffect(() => {
    if (expandedDish && isExpanded) {
      lastExpandedAtRef.current = Date.now();
      setIsExpanded(false);
    }
  }, [expandedDish, isExpanded]);

  // Use draft for display (smooth updates during drag)
  const displayed = draft;
  
  // Get active priorities (non-zero values)
  const activePriorities = PRIORITY_CONFIG.filter(
    config => displayed[config.key] !== 0
  );
  
  // Check if all priorities are zero
  const allPrioritiesZero = Object.values(displayed).every(v => v === 0);

  const handleDragStart = () => {
    if (!isDragging) setIsDragging(true);
  };

  const handleSliderChange = (key, value) => {
    // Update only the draft state (no parent update yet)
    setDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const resetPriorities = {};
    PRIORITY_CONFIG.forEach(config => {
      resetPriorities[config.key] = 0;
    });
    // Reset is immediate (not a drag), so update both draft and parent
    setDraft(resetPriorities);
    onPrioritiesChange(resetPriorities);
  };

  return (
    <div className="glass border-b border-surface-300/50 dark:border-surface-700/50">
      {/* Header - always visible */}
      <div className="px-4 py-3">
        {isExpanded ? (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4 items-center">
            {/* Left header: priorities */}
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-surface-800 dark:text-surface-100">
                My Priorities
              </h2>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 
                           hover:text-surface-700 dark:hover:text-surface-200 
                           hover:bg-surface-200/50 dark:hover:bg-surface-700/50 
                           rounded-lg transition-colors"
              >
                Reset All
              </motion.button>
            </div>

            {/* Right header: map */}
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-surface-800 dark:text-surface-100">
                Economic Zone
              </h2>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg hover:bg-surface-200/50 dark:hover:bg-surface-700/50 transition-colors"
                aria-label="Collapse panels"
              >
                <ChevronUp size={20} className="text-surface-500 dark:text-surface-300" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setIsExpanded(true);
                if (onCollapseExpandedDish) {
                  onCollapseExpandedDish();
                }
              }}
              className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
            >
              <h2 className="font-display font-semibold text-lg text-surface-800 dark:text-surface-100 whitespace-nowrap">
                My Priorities
              </h2>
              {(activePriorities.length > 0 || selectedZone) && (
                <div className="flex flex-wrap gap-1.5 min-w-0">
                  {lite ? (
                    <>
                      {activePriorities.map(config => (
                        <div
                          key={config.key}
                          className={`
                            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                            text-xs font-semibold
                            ${displayed[config.key] > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }
                          `}
                        >
                          <config.icon size={12} />
                          <span>{config.label}</span>
                          <span className="font-mono">
                            {displayed[config.key] === 10 ? 'max' : displayed[config.key] === -10 ? 'min' : (displayed[config.key] > 0 ? '+' : '') + displayed[config.key]}
                          </span>
                        </div>
                      ))}
                      {selectedZone && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <span className="text-sm">{ECONOMIC_ZONES[selectedZone]?.emoji}</span>
                          <span>{ECONOMIC_ZONES[selectedZone]?.name}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {activePriorities.map(config => (
                        <PriorityChip
                          key={config.key}
                          config={config}
                          value={displayed[config.key]}
                        />
                      ))}
                      {selectedZone && <ZoneChip key="zone" zoneId={selectedZone} />}
                    </AnimatePresence>
                  )}
                </div>
              )}
            </button>
            <button
              onClick={() => {
                setIsExpanded(true);
                if (onCollapseExpandedDish) {
                  onCollapseExpandedDish();
                }
              }}
              className="p-2 rounded-lg hover:bg-surface-200/50 dark:hover:bg-surface-700/50 transition-colors"
            >
              <ChevronDown size={20} className="text-surface-500 dark:text-surface-300" />
            </button>
          </div>
        )}
      </div>

      {/* Main content: left priorities + right economic zone map */}
      {lite ? (
        isExpanded ? (
          <div className="overflow-hidden">
            <div className="px-4 pb-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Left: priorities board (wide) */}
                <div className="flex-1 bg-white/60 dark:bg-surface-800/80 rounded-xl p-4 border border-surface-300/50 dark:border-surface-700/50 shadow-sm dark:shadow-none">
                  {/* Scale markers on the side */}
                  <div className="flex">
                    {/* Left scale */}
                    <div className="hidden sm:flex flex-col justify-between h-[140px] pr-3 py-1 text-[10px] text-surface-500 dark:text-surface-500 font-mono">
                      <span>+10</span>
                      <span>+5</span>
                      <span>0</span>
                      <span>-5</span>
                      <span>-10</span>
                    </div>

                    {/* Sliders grid */}
                    <div className="flex-1 flex justify-around items-start gap-1 sm:gap-4 overflow-x-auto pb-2">
                      {PRIORITY_CONFIG.map(config => (
                        <VerticalSlider
                          key={config.key}
                          config={config}
                          value={displayed[config.key]}
                          onChange={(val) => handleSliderChange(config.key, val)}
                          onDragStart={handleDragStart}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Helper text */}
                  <div className="mt-3 pt-3 border-t border-surface-300/50 dark:border-surface-700/50 flex justify-between text-[11px] text-surface-500">
                    <span>↑ Maximize / Prefer</span>
                    <span>↓ Minimize / Avoid</span>
                  </div>
                  
                  {/* Hint when all priorities are zero */}
                  {allPrioritiesZero && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs text-amber-600 dark:text-amber-300/90 text-center">
                        💡 Adjust the sliders above to rank dishes by your preferences. 
                        All dishes currently show a neutral score (50).
                      </p>
                    </div>
                  )}
                </div>

                {/* Right: economic zone (square) */}
                <div className="md:w-[260px] bg-white/60 dark:bg-surface-800/80 rounded-xl p-3 border border-surface-300/50 dark:border-surface-700/50 shadow-sm dark:shadow-none">
                  <div className="w-full" style={{ height: '180px' }}>
                    <WorldMapWidget
                      variant="square"
                      selectedZone={selectedZone}
                      onZoneSelect={onZoneChange}
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-200">
                    <span className="text-lg">{ECONOMIC_ZONES[selectedZone]?.emoji}</span>
                    <span className="truncate">{ECONOMIC_ZONES[selectedZone]?.name}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-surface-500 dark:text-surface-400 leading-snug">
                    Select an economic zone to calculate local prices
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
              <div className="px-4 pb-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Left: priorities board (wide) */}
                  <div className="flex-1 bg-white/60 dark:bg-surface-800/80 rounded-xl p-4 border border-surface-300/50 dark:border-surface-700/50 shadow-sm dark:shadow-none">
                    {/* Scale markers on the side */}
                    <div className="flex">
                      {/* Left scale */}
                      <div className="hidden sm:flex flex-col justify-between h-[140px] pr-3 py-1 text-[10px] text-surface-500 dark:text-surface-500 font-mono">
                        <span>+10</span>
                        <span>+5</span>
                        <span>0</span>
                        <span>-5</span>
                        <span>-10</span>
                      </div>

                      {/* Sliders grid */}
                      <div className="flex-1 flex justify-around items-start gap-1 sm:gap-4 overflow-x-auto pb-2">
                        {PRIORITY_CONFIG.map(config => (
                          <VerticalSlider
                            key={config.key}
                            config={config}
                            value={displayed[config.key]}
                            onChange={(val) => handleSliderChange(config.key, val)}
                            onDragStart={handleDragStart}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Helper text */}
                    <div className="mt-3 pt-3 border-t border-surface-300/50 dark:border-surface-700/50 flex justify-between text-[11px] text-surface-500">
                      <span>↑ Maximize / Prefer</span>
                      <span>↓ Minimize / Avoid</span>
                    </div>
                    
                    {/* Hint when all priorities are zero */}
                    {allPrioritiesZero && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                      >
                        <p className="text-xs text-amber-600 dark:text-amber-300/90 text-center">
                          💡 Adjust the sliders above to rank dishes by your preferences. 
                          All dishes currently show a neutral score (50).
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Right: economic zone (square) */}
                  <div className="md:w-[260px] bg-white/60 dark:bg-surface-800/80 rounded-xl p-3 border border-surface-300/50 dark:border-surface-700/50 shadow-sm dark:shadow-none">
                    <div className="w-full" style={{ height: '180px' }}>
                      <WorldMapWidget
                        variant="square"
                        selectedZone={selectedZone}
                        onZoneSelect={onZoneChange}
                      />
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-200">
                      <span className="text-lg">{ECONOMIC_ZONES[selectedZone]?.emoji}</span>
                      <span className="truncate">{ECONOMIC_ZONES[selectedZone]?.name}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-surface-500 dark:text-surface-400 leading-snug">
                      Select an economic zone to calculate local prices
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}



