import { useMemo, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ECONOMIC_ZONES } from '../lib/RankingEngine';
import { PRIORITY_CONFIG } from './PrioritiesBoard';
import PrioritiesBoard from './PrioritiesBoard';
import EconomicZoneWidget from './EconomicZoneWidget';
import { usePrioritiesPanelAutoToggle } from '../hooks/usePrioritiesPanelAutoToggle';
import { usePrefs, prefsActions } from '../store/prefsStore';
import ZoneDropdown from './ZoneDropdown';
import ZoneIcon from './ZoneIcon';

/**
 * Calculate percentage contribution of each priority
 * Only calculates for priorities with non-zero values to optimize performance
 */
function calculatePercentages(priorities) {
  // Filter only active priorities for faster calculation
  const activeEntries = PRIORITY_CONFIG
    .map(config => ({ key: config.key, value: Math.abs(priorities[config.key] || 0) }))
    .filter(entry => entry.value > 0);
  
  if (activeEntries.length === 0) return {};
  
  const total = activeEntries.reduce((sum, entry) => sum + entry.value, 0);
  if (total === 0) return {};
  
  const percentages = {};
  activeEntries.forEach(({ key, value }) => {
    percentages[key] = Math.round((value / total) * 100);
  });
  
  return percentages;
}

/**
 * Compact priority icon for collapsed state
 * Responsive sizing: small at <340px, progressively larger at wider breakpoints
 */
function CompactPriorityIcon({ config, value }) {
  const isReversed = value < 0;
  const Icon = isReversed ? config.negativeIcon : config.positiveIcon;
  const currentIconColor = isReversed ? config.negativeIconColor : config.iconColor;

  return (
    <Icon 
      size={16}
      className={currentIconColor}
    />
  );
}

/**
 * Compact zone indicator for collapsed state
 * Responsive sizing: width only, height stays fixed
 */
function CompactZoneIcon({ zoneId }) {
  return (
    <ZoneIcon zoneId={zoneId} size={14} className="min-[340px]:w-[14px] min-[340px]:h-[14px] min-[480px]:w-4 min-[480px]:h-4" />
  );
}

/**
 * Compact icons row - reusable component for collapsed view
 */
function CompactIconsRow({ activePriorities, displayed, selectedZone, className = '' }) {
  return (
    <div className={`flex items-center gap-0.5 min-[340px]:gap-0.5 min-[480px]:gap-1 overflow-x-auto overflow-y-visible hide-scrollbar pt-2 ${className}`}>
      {activePriorities.length > 0 ? (
        activePriorities.map(config => (
          <CompactPriorityIcon
            key={config.key}
            config={config}
            value={displayed[config.key]}
          />
        ))
      ) : (
        <span className="text-xs text-surface-400 italic">No priorities set</span>
      )}
      {selectedZone && <CompactZoneIcon zoneId={selectedZone} />}
    </div>
  );
}

/**
 * Main Priorities Panel Component
 * Optimized with separate hooks and components
 */
export default function PrioritiesPanel({ 
  onExpandedChange,
  scrollableElement = null,
}) {
  const displayed = usePrefs((s) => s.uiPriorities);
  const selectedZone = usePrefs((s) => s.prefs.selectedZone);
  const isDark = usePrefs((s) => s.prefs.theme) !== 'light';
  const viewMode = usePrefs((s) => s.prefs.viewMode);

  const prefersReducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [zoneAnchorEl, setZoneAnchorEl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  // Handle pointer up for drag end - commit immediately
  useEffect(() => {
    if (!isDragging) return;
    
    const handlePointerUp = () => {
      setIsDragging(false);
      prefsActions.flushPriorities();
    };
    
    // Use capture phase to ensure we catch the event before it bubbles
    window.addEventListener('pointerup', handlePointerUp, { once: true, capture: true });
    return () => {
      // Cleanup is automatic with { once: true }, but we ensure it's removed
      window.removeEventListener('pointerup', handlePointerUp, { capture: true });
    };
  }, [isDragging]);

  // Notify parent of expanded state change
  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  // Scroll-based auto collapse + pull-down auto expand (no timer pause)
  usePrioritiesPanelAutoToggle({
    scrollableElement,
    isExpanded,
    setExpanded: setIsExpanded,
  });

  // Dropdown handlers
  const closeDropdown = () => {
    setIsZoneDropdownOpen(false);
    setZoneAnchorEl(null);
  };
  
  const handleZoneButtonClick = (event) => {
    setZoneAnchorEl(event.currentTarget);
    setIsZoneDropdownOpen((wasOpen) => !wasOpen);
  };

  const activePriorities = useMemo(
    () => PRIORITY_CONFIG.filter((config) => displayed[config.key] !== 0),
    [displayed],
  );
  const allPrioritiesZero = useMemo(
    () => Object.values(displayed).every((v) => v === 0),
    [displayed],
  );
  const percentages = useMemo(() => calculatePercentages(displayed), [displayed]);

  // Handlers
  const handleDragStart = () => {
    if (!isDragging) setIsDragging(true);
  };

  const handleSliderChange = (key, value) => {
    prefsActions.updateUiPriorities((prev) => ({ ...(prev || {}), [key]: value }));
  };
  
  const handleToggleReverse = (key) => {
    prefsActions.updateUiPriorities((prev) => {
      const currentValue = prev?.[key] ?? 0;
      const newValue = currentValue === 0 ? -5 : -currentValue;
      return { ...(prev || {}), [key]: newValue };
    });
    prefsActions.flushPriorities();
  };

  const handleReset = () => {
    const resetPriorities = Object.fromEntries(
      PRIORITY_CONFIG.map(config => [config.key, 0])
    );
    setIsDragging(false);
    prefsActions.setUiPriorities(resetPriorities);
    prefsActions.flushPriorities();
  };

  const handleToggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  // Measure content height for animation (avoid `height: auto` issues under desktop CSS zoom).
  // Measure only when expanded (element is visible) for accurate measurement.
  useLayoutEffect(() => {
    if (!isExpanded) {
      // When collapsed, don't measure (keep previous height for animation)
      return;
    }
    
    const el = contentRef.current;
    if (!el) return;

    const measure = () => {
      // Use offsetHeight which includes padding (matching what motion.div will animate)
      const h = Math.max(0, Math.ceil(el.offsetHeight));
      setContentHeight(h);
    };

    // Measure after layout
    const timer = requestAnimationFrame(() => {
      requestAnimationFrame(measure);
    });

    // Track size changes while expanded
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }

    window.addEventListener('resize', measure, { passive: true });
    return () => {
      cancelAnimationFrame(timer);
      window.removeEventListener('resize', measure);
      if (ro) ro.disconnect();
    };
    // NOTE: we intentionally do NOT depend on `displayed` (slider values) here.
    // Slider value updates are frequent during drag; the panel height doesn't
    // normally change with values, so measuring each time is wasted work.
  }, [isExpanded, viewMode]);

  return (
    <div className="bg-white dark:bg-surface-800 border-b border-surface-300/50 dark:border-surface-700/50">
      {/* Header - always visible */}
      <div className="px-4 py-2 relative overflow-visible">
        {isExpanded ? (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_260px] gap-4 items-center">
            {/* Left header: priorities */}
            <div className="flex items-center justify-between gap-2 pr-10 sm:pr-0">
              <h2 className="font-display font-semibold text-lg text-surface-800 dark:text-surface-100 whitespace-nowrap">
                My Priorities
              </h2>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 
                             hover:text-surface-700 dark:hover:text-surface-200 
                             hover:bg-surface-200/50 dark:hover:bg-surface-700/50 
                             rounded-lg transition-colors whitespace-nowrap"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Right header: map */}
            <div className="hidden sm:flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-surface-800 dark:text-surface-100">
                Economic Zone
              </h2>
            </div>
          </div>
        ) : (
          <div className="pr-0 min-[480px]:pr-12">
            {/* Mobile layout: title and arrow in one row, icons below */}
            <div className="min-[480px]:hidden">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="font-display font-semibold text-sm text-surface-800 dark:text-surface-100 whitespace-nowrap">
                  My Priorities
                </h2>
                <button
                  onClick={handleExpand}
                  className="p-1.5 rounded-lg hover:bg-surface-200/50 dark:hover:bg-surface-700/50 transition-colors flex-shrink-0"
                  aria-label="Expand panels"
                >
                  <ChevronDown
                    size={18}
                    className="text-surface-500 dark:text-surface-300 transition-transform duration-300"
                  />
                </button>
              </div>
              <button
                onClick={handleExpand}
                className="w-full hover:opacity-80 transition-opacity"
              >
                <CompactIconsRow
                  activePriorities={activePriorities}
                  displayed={displayed}
                  selectedZone={selectedZone}
                  className="flex"
                />
              </button>
            </div>
            {/* Desktop layout: title and icons in one row */}
            <button
              onClick={handleExpand}
              className="hidden min-[480px]:flex items-baseline gap-3 hover:opacity-80 transition-opacity"
            >
              <h2 className="font-display font-semibold text-lg text-surface-800 dark:text-surface-100 whitespace-nowrap">
                My Priorities
              </h2>
              <CompactIconsRow
                activePriorities={activePriorities}
                displayed={displayed}
                selectedZone={selectedZone}
                className="flex"
              />
            </button>
          </div>
        )}

        {/* Persistent toggle arrow: absolute for expanded state and >= 480px collapsed state */}
        <button
          onClick={isExpanded ? handleToggleExpanded : handleExpand}
          className={`absolute right-2 p-2 rounded-lg hover:bg-surface-200/50 dark:hover:bg-surface-700/50 transition-colors z-10 ${
            isExpanded 
              ? 'top-2' 
              : 'hidden min-[480px]:block top-1/2 min-[480px]:-translate-y-1/2'
          }`}
          aria-label={isExpanded ? 'Collapse panels' : 'Expand panels'}
        >
          <ChevronDown
            size={20}
            className={`text-surface-500 dark:text-surface-300 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Main content - height animation (0 <-> auto) */}
      <motion.div
        className="overflow-hidden"
        initial={false}
        animate={isExpanded ? { height: contentHeight, opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{
          height: prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
          opacity: prefersReducedMotion ? { duration: 0 } : { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
        }}
        style={{
          willChange: 'height, opacity',
          pointerEvents: isExpanded ? 'auto' : 'none',
        }}
        aria-hidden={!isExpanded}
      >
        <div ref={contentRef} className="px-4 pb-2.5">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <PrioritiesBoard
              priorityConfig={PRIORITY_CONFIG}
              displayed={displayed}
              percentages={percentages}
              allPrioritiesZero={allPrioritiesZero}
              handleSliderChange={handleSliderChange}
              handleDragStart={handleDragStart}
              handleToggleReverse={handleToggleReverse}
              isDark={isDark}
            />
            <EconomicZoneWidget
              selectedZone={selectedZone}
              onZoneChange={(zoneId) => prefsActions.setPref({ selectedZone: zoneId })}
              handleZoneButtonClick={handleZoneButtonClick}
              isZoneDropdownOpen={isZoneDropdownOpen}
            />
          </div>
        </div>
      </motion.div>

      <ZoneDropdown
        open={isZoneDropdownOpen}
        anchorEl={zoneAnchorEl}
        selectedZone={selectedZone}
        onSelectZone={(zoneId) => prefsActions.setPref({ selectedZone: zoneId })}
        onClose={closeDropdown}
        clickCapture
      />
    </div>
  );
}
