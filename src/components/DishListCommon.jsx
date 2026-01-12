import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import PriceUnitToggle from './PriceUnitToggle';

/**
 * Stats summary bar with integrated search
 * Shared between DishList and DishGrid
 */
export function StatsBar({ 
  totalDishes, 
  filteredCount, 
  priceUnit, 
  onPriceUnitChange,
  searchQuery,
  onSearchChange
}) {
  return (
    <div className="space-y-0.5 xs:space-y-2">
      <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-3 text-sm text-surface-500 dark:text-surface-400">
        {/* Search bar */}
        <div className="relative flex-1 min-w-0">
          <Search 
            size={13} 
            className="absolute left-2 xs:left-3 top-1/2 -translate-y-1/2 text-surface-400 xs:w-4 xs:h-4 sm:w-[18px] sm:h-[18px]" 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search dishes..."
            className="w-full pl-7 xs:pl-9 sm:pl-10 pr-6 xs:pr-8 sm:pr-10 py-1 xs:py-2 sm:py-2.2 rounded-lg xs:rounded-xl
                       bg-white/80 dark:bg-surface-800/80 
                       border border-surface-300/50 dark:border-surface-700/50
                       text-xs xs:text-sm text-surface-800 dark:text-surface-100 
                       placeholder:text-surface-400 dark:placeholder:text-surface-500
                       focus:outline-none focus:border-food-500/50
                       transition-colors shadow-sm dark:shadow-none leading-tight"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 xs:right-3 top-1/2 -translate-y-1/2 
                         text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
            >
              <X size={11} className="xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
        
        {/* Right: Price per */}
        <div className="flex items-center justify-between xs:justify-end gap-2 whitespace-nowrap">
          <span className="text-[10px] xs:text-xs font-semibold text-surface-500 dark:text-surface-400">
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
 * Shared between DishList and DishGrid
 */
export function EmptyState({ hasSearch }) {
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
 * Loading skeleton shown while ranking data is being computed (worker).
 */
export function LoadingState({ variant = 'list' }) {
  const count = variant === 'grid' ? 12 : 10;
  return (
    <div className="py-6 px-1">
      <div className="space-y-3">
        <div className="h-4 w-40 rounded bg-surface-200/80 dark:bg-surface-800/80 animate-pulse" />
        <div className={variant === 'grid' ? 'grid grid-cols-1 min-[440px]:grid-cols-2 min-[660px]:grid-cols-3 gap-3' : 'space-y-2'}>
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-surface-300/40 dark:border-surface-700/40 bg-white/70 dark:bg-surface-900/40 p-3 animate-pulse"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-surface-200 dark:bg-surface-800" />
                  <div className="h-2.5 w-1/2 rounded bg-surface-200/70 dark:bg-surface-800/70" />
                </div>
                <div className="h-10 w-10 rounded-xl bg-surface-200 dark:bg-surface-800" />
              </div>
              <div className="mt-3 flex gap-2">
                <div className="h-5 w-16 rounded-lg bg-surface-200/70 dark:bg-surface-800/70" />
                <div className="h-5 w-16 rounded-lg bg-surface-200/70 dark:bg-surface-800/70" />
                <div className="h-5 w-16 rounded-lg bg-surface-200/70 dark:bg-surface-800/70" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Error state shown if the ranking worker fails.
 */
export function ErrorState({ message = 'Failed to compute ranking.', onRetry }) {
  return (
    <div className="py-10 px-4 text-center">
      <div className="mx-auto max-w-md space-y-3">
        <div className="text-sm font-semibold text-rose-600 dark:text-rose-300">
          Ranking error
        </div>
        <div className="text-xs text-surface-600 dark:text-surface-300 break-words">
          {message}
        </div>
        {typeof onRetry === 'function' && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-xl
                       bg-white/80 dark:bg-surface-800/80
                       border border-surface-300/50 dark:border-surface-700/50
                       text-sm font-semibold text-surface-700 dark:text-surface-200
                       hover:bg-white dark:hover:bg-surface-800 transition-colors shadow-sm dark:shadow-none"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

