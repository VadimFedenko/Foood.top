import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import DishCardSimple from './DishCardSimple';
import { StatsBar, EmptyState } from './DishListCommon';
import { LoadingState, ErrorState } from './DishListCommon';
import { usePrefs, prefsActions } from '../store/prefsStore';
import { useDishDeepLinking } from '../hooks/useDishDeepLinking';
import { useIsMobile } from '../lib/useIsMobile';

const DishModal = lazy(() => import('./DishModal'));

/**
 * Main Dish List Component
 * Displays a scrollable, filterable list of ranked dishes
 */
export default function DishList({ 
  dishes, 
  analysisVariants = null,
  rankingMeta = null,
  isLoading = false,
  error = null,
  onRetry = null,
  onScrollContainerChange = null,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDish, setSelectedDish] = useState(null);
  const [hasOpenedModal, setHasOpenedModal] = useState(false);
  const priceUnit = usePrefs((s) => s.prefs.priceUnit);
  const isOptimized = usePrefs((s) => s.prefs.isOptimized);
  const priorities = usePrefs((s) => s.computationPriorities);

  // Keep the initial render budget small on all devices to avoid heavy DOM + layout work.
  // This also keeps the priorities panel expand/collapse animation smooth on desktop.
  const pageSize = 50;
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

  const visibleDishes = filteredDishes.slice(0, visibleCount);

  const { openDish, closeDish } = useDishDeepLinking({
    dishes,
    selectedDish,
    setSelectedDish,
    paramName: 'dish',
  });

  // Keep selected dish object fresh when the ranked list recomputes (e.g. after overrides Save).
  useEffect(() => {
    const id = selectedDish?.id;
    if (!id) return;
    const next = dishes?.find((d) => d?.id === id) ?? null;
    if (next && next !== selectedDish) setSelectedDish(next);
  }, [dishes, selectedDish, selectedDish?.id]);
  
  const handleResetOverrides = (dishId) => {
    prefsActions.setOverrideForDish(dishId, {});
  };

  const remaining = Math.max(0, filteredDishes.length - visibleCount);
  const isModalOpen = selectedDish !== null;
  const isMobile = useIsMobile();

  const setScrollContainerEl = useCallback(
    (el) => {
      onScrollContainerChange?.(el);
    },
    [onScrollContainerChange],
  );

  // Lazy-load modal code only when it is first needed (open or deeplink).
  useEffect(() => {
    if (isModalOpen && !hasOpenedModal) setHasOpenedModal(true);
  }, [isModalOpen, hasOpenedModal]);

  return (
    <div className="flex flex-col h-full">
      {/* Search and stats */}
      <div className="px-4 pt-2.5 pb-1.5 space-y-2 border-b border-surface-200/50 dark:border-surface-800/50">
        <StatsBar 
          totalDishes={dishes.length} 
          filteredCount={filteredDishes.length}
          priceUnit={priceUnit}
          onPriceUnitChange={(u) => prefsActions.setPref({ priceUnit: u })}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Dish list - hide only on mobile when modal is open */}
      {!(isModalOpen && isMobile) && (
        <div ref={setScrollContainerEl} className="flex-1 overflow-y-auto px-4 pt-0 pb-4">
          {isLoading && dishes.length === 0 ? (
            <LoadingState variant="list" />
          ) : error && dishes.length === 0 ? (
            <ErrorState message={error} onRetry={onRetry} />
          ) : filteredDishes.length === 0 ? (
            <EmptyState hasSearch={!!searchQuery} />
          ) : (
            <>
              <div className="space-y-1.5">
                {visibleDishes.map((dish) => (
                  <div key={dish.id}>
                    <DishCardSimple
                      dish={dish}
                      onClick={() => openDish(dish)}
                      onResetOverrides={handleResetOverrides}
                      priceUnit={priceUnit}
                    />
                  </div>
                ))}
              </div>

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
      )}
      
      {/* Dish Modal */}
      {hasOpenedModal && (
        <Suspense fallback={null}>
          <DishModal
            dish={selectedDish}
            isOpen={selectedDish !== null}
            onClose={closeDish}
            priorities={priorities}
            isOptimized={isOptimized}
            analysisVariants={analysisVariants}
            rankingMeta={rankingMeta}
            priceUnit={priceUnit}
          />
        </Suspense>
      )}
    </div>
  );
}
