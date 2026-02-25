import { useMemo, useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '../lib/motion';
import { ChevronDown, ChevronUp } from '../icons/lucide';
import { ECONOMIC_ZONES } from '../lib/RankingEngine';
import { PRIORITY_CONFIG } from './PrioritiesBoard';
import PrioritiesBoard from './PrioritiesBoard';
import EconomicZoneWidget from './EconomicZoneWidget';
import { usePrioritiesPanelAutoToggle } from '../hooks/usePrioritiesPanelAutoToggle';
import { usePrefs, prefsActions } from '../store/prefsStore';
import { userPresetsActions } from '../store/userPresetsStore';
import ZoneDropdown from './ZoneDropdown';
import ZoneIcon from './ZoneIcon';
import { useIsMobile } from '../lib/useIsMobile';

const SavePresetModal = lazy(() => import('./SavePresetModal'));

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
    <div className={`flex items-center gap-0.5 min-[340px]:gap-0.5 min-[480px]:gap-1 overflow-x-auto overflow-y-visible hide-scrollbar ${className}`}>
      {activePriorities.length > 0 && activePriorities.map(config => (
        <CompactPriorityIcon
          key={config.key}
          config={config}
          value={displayed[config.key]}
        />
      ))}
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
  onDraggingChange,
  scrollableElement = null,
}) {
  const { t } = useTranslation();
  const displayed = usePrefs((s) => s.uiPriorities);
  const selectedZone = usePrefs((s) => s.prefs.selectedZone);
  const isOptimized = usePrefs((s) => s.prefs.isOptimized);
  const priceUnit = usePrefs((s) => s.prefs.priceUnit);
  const tasteScoreMethod = usePrefs((s) => s.prefs.tasteScoreMethod);
  const isDark = usePrefs((s) => s.prefs.theme) !== 'light';
  const viewMode = usePrefs((s) => s.prefs.viewMode);
  const isMobile = useIsMobile();

  const prefersReducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [zoneAnchorEl, setZoneAnchorEl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Handle pointer up for drag end - commit immediately
  useEffect(() => {
    if (!isDragging) return;
    
    const handlePointerUp = () => {
      setIsDragging(false);
      onDraggingChange?.(false);
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
    disableScrollLock: isMobile,
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

  // Handlers - memoized to prevent PrioritiesBoard re-renders on isExpanded toggle
  const handleDragStart = useCallback(() => {
    setIsDragging((wasDragging) => {
      if (!wasDragging) {
        onDraggingChange?.(true);
        return true;
      }
      return wasDragging;
    });
  }, [onDraggingChange]);

  const handleSliderChange = useCallback((key, value) => {
    prefsActions.updateUiPriorities((prev) => ({ ...(prev || {}), [key]: value }));
  }, []);
  
  const handleToggleReverse = useCallback((key) => {
    prefsActions.updateUiPriorities((prev) => {
      const currentValue = prev?.[key] ?? 0;
      const newValue = currentValue === 0 ? -5 : -currentValue;
      return { ...(prev || {}), [key]: newValue };
    });
    prefsActions.flushPriorities();
  }, []);

  const handleReset = () => {
    const resetPriorities = Object.fromEntries(
      PRIORITY_CONFIG.map(config => [config.key, 0])
    );
    setIsDragging(false);
    onDraggingChange?.(false);
    prefsActions.setUiPriorities(resetPriorities);
    prefsActions.flushPriorities();
  };

  const handleSavePreset = (presetName) => {
    // Capture the in-UI priorities even if the user is mid-drag.
    const settings = {
      priorities: displayed,
      priceUnit,
      isOptimized,
      tasteScoreMethod,
      selectedZone,
    };

    const newPreset = userPresetsActions.addPreset({ name: presetName, settings });
    if (newPreset) {
      // Make it the active preset immediately (keeps current settings, but tracks currentPresetId).
      prefsActions.applyPreset(newPreset);
    }
    setIsSaveModalOpen(false);
  };

  const handleToggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  return (
    <div className="bg-white dark:bg-surface-800 border-b border-surface-300/50 dark:border-surface-700/50">
      {/* Header - always visible */}
      {isExpanded ? (
        <div className="px-4 py-2 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(240px,1fr)_260px] gap-4 items-center">
            {/* Left header: priorities */}
            <div className="flex items-center justify-between gap-2 pr-10 md:pr-0 min-w-0">
              <h2 className="font-display font-semibold text-sm min-[480px]:text-lg text-surface-800 dark:text-surface-100 whitespace-nowrap">
                {t('priorities.title')}
              </h2>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsSaveModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 
                             hover:text-surface-700 dark:hover:text-surface-200 
                             hover:bg-surface-200/50 dark:hover:bg-surface-700/50 
                             rounded-lg transition-colors whitespace-nowrap"
                >
                  {t('priorities.save')}
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs font-medium text-surface-500 dark:text-surface-400 
                             hover:text-surface-700 dark:hover:text-surface-200 
                             hover:bg-surface-200/50 dark:hover:bg-surface-700/50 
                             rounded-lg transition-colors whitespace-nowrap"
                >
                  {t('priorities.reset')}
                </button>
              </div>
            </div>

            {/* Right header: map */}
            <div className="hidden md:flex items-center justify-between min-w-0">
              <h2 className="font-display font-semibold text-lg text-surface-800 dark:text-surface-100 truncate">
                {t('zones.title')}
              </h2>
            </div>
          </div>

          {/* Persistent toggle arrow: absolute for expanded state */}
          <button
            onClick={handleToggleExpanded}
            className="absolute right-2 top-2 p-2 rounded-lg hover:bg-surface-200/50 dark:hover:bg-surface-700/50 transition-colors z-10"
            aria-label="Collapse panels"
          >
            <ChevronDown
              size={20}
              className="text-surface-500 dark:text-surface-300 transition-transform duration-300 rotate-180"
            />
          </button>
        </div>
      ) : (
        <button
          onClick={handleExpand}
          className="w-full px-4 py-2 relative overflow-visible text-left hover:bg-surface-100/50 dark:hover:bg-surface-700/30 transition-colors cursor-pointer"
          aria-label="Expand panels"
        >
          <div className="pr-0 min-[480px]:pr-12">
            {/* Mobile layout: title, icons, and arrow in one row */}
            <div className="min-[480px]:hidden flex items-center gap-2 min-w-0">
              <h2 className="font-display font-semibold text-sm text-surface-800 dark:text-surface-100 whitespace-nowrap flex-shrink-0">
                {t('priorities.title')}
              </h2>
              <div className="flex-1 min-w-0">
                <CompactIconsRow
                  activePriorities={activePriorities}
                  displayed={displayed}
                  selectedZone={selectedZone}
                  className="flex"
                />
              </div>
              <div className="p-1.5 rounded-lg flex-shrink-0 pointer-events-none">
                <ChevronDown
                  size={18}
                  className="text-surface-500 dark:text-surface-300 transition-transform duration-300"
                />
              </div>
            </div>
            {/* Desktop layout: title and icons in one row */}
            <div className="hidden min-[480px]:flex items-baseline gap-3">
              <h2 className="font-display font-semibold text-lg text-surface-800 dark:text-surface-100 whitespace-nowrap">
                {t('priorities.title')}
              </h2>
              <CompactIconsRow
                activePriorities={activePriorities}
                displayed={displayed}
                selectedZone={selectedZone}
                className="flex"
              />
            </div>
          </div>

          {/* Persistent toggle arrow: absolute for >= 480px collapsed state */}
          <div className="hidden min-[480px]:block absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg pointer-events-none z-10">
            <ChevronDown
              size={20}
              className="text-surface-500 dark:text-surface-300 transition-transform duration-300"
            />
          </div>
        </button>
      )}

      {/* Main content - CSS-driven collapse/expand to avoid JS layout reads (prevents forced reflow). */}
      <div
        className="grid overflow-hidden"
        style={{
          gridTemplateRows: isExpanded ? '1fr' : '0fr',
          transitionProperty: 'grid-template-rows',
          transitionDuration: prefersReducedMotion ? '0ms' : '350ms',
          transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          willChange: 'grid-template-rows',
          pointerEvents: isExpanded ? 'auto' : 'none',
        }}
        aria-hidden={!isExpanded}
      >
        {/* min-h-0 is critical so the child can actually collapse inside the grid row */}
        <div className="min-h-0 overflow-hidden">
          <div className="px-4 pb-2.5">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <PrioritiesBoard
                priorityConfig={PRIORITY_CONFIG}
                displayed={displayed}
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
        </div>
      </div>

      <ZoneDropdown
        open={isZoneDropdownOpen}
        anchorEl={zoneAnchorEl}
        selectedZone={selectedZone}
        onSelectZone={(zoneId) => prefsActions.setPref({ selectedZone: zoneId })}
        onClose={closeDropdown}
        clickCapture
      />

      {isSaveModalOpen && (
        <Suspense fallback={null}>
          <SavePresetModal
            open={isSaveModalOpen}
            onCancel={() => setIsSaveModalOpen(false)}
            onSave={handleSavePreset}
          />
        </Suspense>
      )}
    </div>
  );
}
