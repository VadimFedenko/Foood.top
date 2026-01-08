import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import DishCard from './DishCard';
import PriceUnitToggle from './PriceUnitToggle';
import { useIsMobile } from '../lib/useIsMobile';

/**
 * Stats summary bar with integrated search
 */
function StatsBar({ 
  totalDishes, 
  filteredCount, 
  allPrioritiesZero = false, 
  priceUnit, 
  onPriceUnitChange,
  searchQuery,
  onSearchChange
}) {
  return (
      <div className="space-y-2">
      <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 px-1 text-sm text-surface-500 dark:text-surface-400 min-h-[28px]">
        {/* Search bar */}
        <div className="relative flex-1 min-w-0">
          <Search 
            size={16} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 sm:w-[18px] sm:h-[18px]" 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search dishes..."
            className="w-full pl-9 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.2 rounded-xl
                       bg-white/80 dark:bg-surface-800/80 
                       border border-surface-300/50 dark:border-surface-700/50
                       text-sm text-surface-800 dark:text-surface-100 
                       placeholder:text-surface-400 dark:placeholder:text-surface-500
                       focus:outline-none focus:border-food-500/50
                       transition-colors shadow-sm dark:shadow-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 
                         text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
            >
              <X size={14} className="sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
        
        {/* Right: Price per */}
        <div className="flex items-center justify-between xs:justify-end gap-2 whitespace-nowrap">
          <span className="text-xs font-semibold text-surface-500 dark:text-surface-400">
            Price per
          </span>
          <PriceUnitToggle 
            priceUnit={priceUnit} 
            onPriceUnitChange={onPriceUnitChange} 
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state when no dishes match
 */
function EmptyState({ hasSearch }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 px-4"
    >
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-200 dark:bg-surface-800 
                      flex items-center justify-center">
        <Search size={24} className="text-surface-500" />
      </div>
      <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-200 mb-2">
        {hasSearch ? 'No dishes found' : 'No dishes available'}
      </h3>
      <p className="text-surface-500 dark:text-surface-400 text-sm">
        {hasSearch 
          ? 'Try adjusting your search query' 
          : 'Check that your data files are loaded correctly'
        }
      </p>
    </motion.div>
  );
}

/**
 * Main Dish List Component
 * Displays a scrollable, filterable list of ranked dishes
 */
export default function DishList({ 
  dishes, 
  overrides, 
  onOverrideChange, 
  allPrioritiesZero = false, 
  ingredientIndex,
  priceUnit = 'serving',
  onPriceUnitChange,
  priorities = {},
  isOptimized = false,
  expandedDish,
  onExpandedDishChange,
  analysisVariants = null
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const reduceMotion = useReducedMotion();

  // Mobile gets a smaller initial render budget to avoid heavy DOM + layout work.
  const isMobile = useIsMobile();
  const pageSize = isMobile ? 50 : 200;
  // Always start at 50 on mobile (or 200 on desktop); keep in sync with detection changes.
  const [visibleCount, setVisibleCount] = useState(() => pageSize);

  // Filter dishes by search query
  const filteredDishes = useMemo(() => {
    if (!searchQuery.trim()) return dishes;
    
    const query = searchQuery.toLowerCase();
    return dishes.filter(dish => 
      dish.name.toLowerCase().includes(query) ||
      dish.description?.toLowerCase().includes(query)
    );
  }, [dishes, searchQuery]);

  // Reset pagination when search changes or when the dataset changes.
  useEffect(() => {
    setVisibleCount(pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, dishes, pageSize]);

  const visibleDishes = useMemo(() => {
    return filteredDishes.slice(0, visibleCount);
  }, [filteredDishes, visibleCount]);

  const handleToggle = (dishName) => {
    onExpandedDishChange(expandedDish === dishName ? null : dishName);
  };

  const useLiteList = reduceMotion;
  const remaining = Math.max(0, filteredDishes.length - visibleCount);

  return (
    <div className="flex flex-col h-full">
      {/* Search and stats */}
      <div className="px-4 pt-2.5 pb-1.5 space-y-2 border-b border-surface-200/50 dark:border-surface-800/50">
        <StatsBar 
          totalDishes={dishes.length} 
          filteredCount={filteredDishes.length}
          allPrioritiesZero={allPrioritiesZero}
          priceUnit={priceUnit}
          onPriceUnitChange={onPriceUnitChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Dish list */}
      <div className="flex-1 overflow-y-auto px-4 pt-0 pb-4">
        {filteredDishes.length === 0 ? (
          <EmptyState hasSearch={!!searchQuery} />
        ) : (
          <>
            {useLiteList ? (
              <div className="space-y-3">
                {visibleDishes.map((dish) => (
                  <div key={dish.name}>
                    <DishCard
                      dish={dish}
                      isExpanded={expandedDish === dish.name}
                      onToggle={() => handleToggle(dish.name)}
                      onOverrideChange={onOverrideChange}
                      overrides={overrides[dish.name] || {}}
                      ingredientIndex={ingredientIndex}
                      priceUnit={priceUnit}
                      priorities={priorities}
                      isOptimized={isOptimized}
                      analysisVariants={analysisVariants}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <motion.div className="space-y-3">
                <AnimatePresence mode="sync">
                  {visibleDishes.map((dish) => (
                    <motion.div
                      key={dish.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                    >
                      <DishCard
                        dish={dish}
                        isExpanded={expandedDish === dish.name}
                        onToggle={() => handleToggle(dish.name)}
                        onOverrideChange={onOverrideChange}
                        overrides={overrides[dish.name] || {}}
                        ingredientIndex={ingredientIndex}
                        priceUnit={priceUnit}
                        priorities={priorities}
                        isOptimized={isOptimized}
                        analysisVariants={analysisVariants}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}

            {remaining > 0 && (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + pageSize)}
                className="w-full mt-4 py-3 rounded-xl
                           bg-white/80 dark:bg-surface-800/80
                           border border-surface-300/50 dark:border-surface-700/50
                           text-sm font-semibold text-surface-700 dark:text-surface-200
                           hover:bg-white dark:hover:bg-surface-800
                           transition-colors shadow-sm dark:shadow-none"
              >
                Show more ({remaining} left)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}



