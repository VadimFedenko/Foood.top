import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import PrioritiesPanel from './components/PrioritiesPanel';
import DishList from './components/DishList';
import { 
  buildIngredientIndex,
  analyzeAllDishesVariants,
  scoreAndSortDishes,
  calculateFinalScore,
} from './lib/RankingEngine';
import { STORAGE_KEYS } from './lib/persist';
import { useLocalStorageState } from './lib/useLocalStorageState';

// Import the JSON data
// Note: Vite handles JSON imports natively
import dishesData from '../dishes.json';
import ingredientsData from '../ingredients.json';

/**
 * Default priority values
 */
const DEFAULT_PRIORITIES = {
  taste: 10,
  health: 10,
  cheapness: 10,
  speed: 10,
  satiety: 0,
  lowCalorie: 0,
  ethics: 0,
};

/**
 * Main Application Component
 */
export default function App() {
  // User preferences (persisted to localStorage)
  const [priorities, setPriorities] = useLocalStorageState(
    STORAGE_KEYS.PRIORITIES,
    DEFAULT_PRIORITIES,
    { mergeDefaults: true }
  );
  const [overrides, setOverrides] = useLocalStorageState(STORAGE_KEYS.OVERRIDES, {});
  const [selectedZone, setSelectedZone] = useLocalStorageState(STORAGE_KEYS.ZONE, 'west_eu_industrial');
  const [isOptimized, setIsOptimized] = useLocalStorageState(STORAGE_KEYS.OPTIMIZED, true);
  const [priceUnit, setPriceUnit] = useLocalStorageState(STORAGE_KEYS.PRICE_UNIT, 'per1000kcal');
  const [theme, setTheme] = useLocalStorageState(STORAGE_KEYS.THEME, 'dark');
  const isDark = theme !== 'light';
  
  // Track expanded dish cards to prevent re-ranking when cards are open
  const [expandedDish, setExpandedDish] = useState(null);
  
  // Shady feature: Worst Food Ever mode
  const [isWorstMode, setIsWorstMode] = useState(false);
  
  // Store frozen ranked dishes when cards are expanded
  const frozenRankedDishesRef = useRef(null);
  
  // Protection against rapid clicks during sorting
  const isProcessingRef = useRef(false);
  const processingTimeoutRef = useRef(null);

  // Apply theme class to document
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // Check if all priorities are zero
  const allPrioritiesZero = useMemo(() => {
    return Object.values(priorities).every(v => v === 0);
  }, [priorities]);

  // Build ingredient index once for O(1) lookups
  const ingredientIndex = useMemo(() => {
    return buildIngredientIndex(ingredientsData);
  }, []);

  // Heavy computation: analyze all dishes ONCE per (zone + overrides).
  // Then materialize the 2x3 variants (timeMode x priceUnit) without re-analyzing.
  const analysisVariants = useMemo(() => {
    return analyzeAllDishesVariants(
      dishesData,
      ingredientIndex,
      selectedZone,
      overrides
    );
  }, [ingredientIndex, selectedZone, overrides]);

  const analysisBase = useMemo(() => {
    const key = `${isOptimized ? 'optimized' : 'normal'}:${priceUnit}`;
    return analysisVariants?.variants?.[key] ?? { analyzed: [], datasetStats: {} };
  }, [analysisVariants, isOptimized, priceUnit]);

  // Lightweight computation: score and sort (runs when priorities change)
  // FREEZE: If cards are expanded, don't re-rank (keep previous order)
  const rankedDishes = useMemo(() => {
    if (!analysisBase.analyzed.length) return [];
    
    // If cards are expanded, update values but preserve order
    if (expandedDish !== null && frozenRankedDishesRef.current) {
      // Create a map of new analyzed dishes by name for quick lookup
      const analyzedMap = new Map(analysisBase.analyzed.map(d => [d.name, d]));
      
      // Update frozen dishes with new values while preserving order
      const updatedFrozen = frozenRankedDishesRef.current.map(frozenDish => {
        const updatedAnalysis = analyzedMap.get(frozenDish.name);
        if (!updatedAnalysis) return frozenDish;
        
        // Re-score with updated analysis but keep the dish in its current position
        const scoreResult = calculateFinalScore(
          updatedAnalysis,
          priorities,
          analysisBase.datasetStats
        );
        
        return {
          ...updatedAnalysis,
          score: scoreResult.score,
          scoreRaw: scoreResult.scoreRaw ?? scoreResult.score,
          scoreBreakdown: scoreResult.breakdown,
          normalizedMetrics: scoreResult.normalized,
        };
      });
      
      return updatedFrozen;
    }
    
    // Calculate new ranking
    const newRanked = scoreAndSortDishes(
      analysisBase.analyzed,
      analysisBase.datasetStats,
      priorities
    );
    
    // Update frozen reference
    frozenRankedDishesRef.current = newRanked;
    
    return newRanked;
  }, [analysisBase, priorities, expandedDish]);

  // Close expanded cards when priorities, zone, priceUnit, or optimized toggle changes
  useEffect(() => {
    if (expandedDish !== null) {
      setExpandedDish(null);
      frozenRankedDishesRef.current = null; // Clear frozen ranking to allow re-ranking
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priorities, selectedZone, priceUnit, isOptimized]);

  // Handlers
  const handlePrioritiesChange = useCallback((newPriorities) => {
    setPriorities(newPriorities);
  }, []);

  const handleOverrideChange = useCallback((dishName, newOverrides) => {
    setOverrides(prev => {
      // If overrides are empty, remove the entry
      if (Object.keys(newOverrides).length === 0) {
        const { [dishName]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [dishName]: newOverrides,
      };
    });
    // Note: When cards are expanded, we still update overrides but don't re-rank
    // The frozen ranking will be used instead
  }, []);

  const handleZoneChange = useCallback((zoneId) => {
    setSelectedZone(zoneId);
  }, []);

  const handleOptimizedToggle = useCallback(() => {
    // Prevent rapid clicks during processing
    if (isProcessingRef.current) {
      return;
    }
    
    isProcessingRef.current = true;
    setIsOptimized(prev => !prev);
    
    // Reset processing flag after a short delay
    // This prevents multiple rapid clicks while sorting is in progress
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    processingTimeoutRef.current = setTimeout(() => {
      isProcessingRef.current = false;
      processingTimeoutRef.current = null;
    }, 300);
  }, []);

  // Safety: clear pending timers on unmount.
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
    };
  }, []);

  const handlePriceUnitChange = useCallback((newPriceUnit) => {
    setPriceUnit(newPriceUnit);
  }, []);

  const handleThemeToggle = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  // Shady feature: Toggle Worst Food Ever mode and set fixed priority values
  const handleWorstModeToggle = useCallback(() => {
    setIsWorstMode(prev => {
      const newMode = !prev;
      
      // Set priorities to fixed values based on mode
      setPriorities(currentPriorities => {
        const updated = {};
        Object.keys(currentPriorities).forEach(key => {
          const value = currentPriorities[key];
          const absValue = Math.abs(value);
          // If switching to worst mode, set negative values (niche, junky, etc.)
          // If switching to best mode, set positive values (tasty, healthy, etc.)
          // Preserve absolute value, only change sign based on mode
          updated[key] = value === 0 ? 0 : (newMode ? -absValue : absValue);
        });
        return updated;
      });
      
      return newMode;
    });
  }, [setPriorities]);

  return (
    <div className="min-h-screen bg-surface-100 dark:bg-surface-900 pattern-grid transition-colors duration-300">
      {/* Centered container - max width for desktop, full width on mobile */}
      <div className="mx-auto w-full max-w-[960px] flex flex-col h-screen 
                      border-x border-surface-300/50 dark:border-surface-700/50 
                      shadow-2xl shadow-black/10 dark:shadow-black/30 
                      bg-white dark:bg-surface-900 lg:bg-white/50 lg:dark:bg-transparent transition-colors duration-300">
        {/* Sticky Header - highest z-index for dropdowns */}
        <div className="sticky top-0 z-50">
          <Header
            isOptimized={isOptimized}
            onOptimizedToggle={handleOptimizedToggle}
            isDark={isDark}
            onThemeToggle={handleThemeToggle}
            isWorstMode={isWorstMode}
            onWorstModeToggle={handleWorstModeToggle}
            selectedZone={selectedZone}
            onZoneChange={handleZoneChange}
          />
        </div>

        {/* Sticky Priorities Panel - lower z-index, will stick below header when scrolling */}
        <div className="sticky top-[73px] z-40">
          <PrioritiesPanel
            priorities={priorities}
            onPrioritiesChange={handlePrioritiesChange}
            selectedZone={selectedZone}
            onZoneChange={handleZoneChange}
            expandedDish={expandedDish}
            onCollapseExpandedDish={() => setExpandedDish(null)}
          />
        </div>

        {/* Main Content Area */}
        <motion.main 
          className="flex-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <DishList
            dishes={rankedDishes}
            overrides={overrides}
            onOverrideChange={handleOverrideChange}
            allPrioritiesZero={allPrioritiesZero}
            ingredientIndex={ingredientIndex}
            priceUnit={priceUnit}
            onPriceUnitChange={handlePriceUnitChange}
            priorities={priorities}
            isOptimized={isOptimized}
            expandedDish={expandedDish}
            onExpandedDishChange={setExpandedDish}
            analysisVariants={analysisVariants}
          />
        </motion.main>

        {/* Bottom safe area for mobile */}
        <div className="h-safe-area-inset-bottom bg-white dark:bg-surface-900 transition-colors duration-300" />
      </div>
    </div>
  );
}


