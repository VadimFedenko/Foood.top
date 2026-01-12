import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Header from './components/Header';
import PrioritiesPanel from './components/PrioritiesPanel';
import DishList from './components/DishList';
import DishGrid from './components/DishGrid';
import { usePrefs, prefsActions } from './store/prefsStore';

/**
 * Main Application Component
 */
export default function App() {
  // Preferences (centralized store)
  const selectedZone = usePrefs((s) => s.prefs.selectedZone);
  const overrides = usePrefs((s) => s.prefs.overrides);
  const isOptimized = usePrefs((s) => s.prefs.isOptimized);
  const priceUnit = usePrefs((s) => s.prefs.priceUnit);
  const theme = usePrefs((s) => s.prefs.theme);
  const viewMode = usePrefs((s) => s.prefs.viewMode);
  const computationPriorities = usePrefs((s) => s.computationPriorities);
  const isDark = theme !== 'light';
  
  // Note: Modal state is now managed inside DishList component
  
  // Track priorities panel expanded state
  const [isPrioritiesExpanded, setIsPrioritiesExpanded] = useState(true);

  // Explicit scroll container element for the priorities auto-toggle logic.
  // This avoids PrioritiesPanel needing DOM querySelector/MutationObserver.
  const [scrollableElement, setScrollableElement] = useState(null);
  
  // Shady feature: Worst Food Ever mode
  const [isWorstMode, setIsWorstMode] = useState(false);

  // Ranking data computed in a worker to keep first paint + interactions snappy.
  const workerRef = useRef(null);
  const seqRef = useRef(0);
  const [rankedDishes, setRankedDishes] = useState([]);
  const [rankingMeta, setRankingMeta] = useState(null);
  const [rankingStatus, setRankingStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [rankingError, setRankingError] = useState(null);
  const lastPayloadRef = useRef(null);
  

  // Apply theme class to document
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    // Allow transitions after initial theme is resolved to avoid startup flicker
    document.documentElement.classList.remove('theme-preload');
  }, [isDark]);

  // Create worker once.
  useEffect(() => {
    const w = new Worker(new URL('./workers/rankingWorker.js', import.meta.url), { type: 'module' });
    workerRef.current = w;

    const onMessage = (e) => {
      const msg = e?.data || {};
      if (!msg || typeof msg !== 'object') return;

      // Drop stale results.
      if (msg.seq !== seqRef.current) return;

      if (msg.type === 'result') {
        setRankedDishes(Array.isArray(msg.rankedDishes) ? msg.rankedDishes : []);
        setRankingMeta(msg.rankingMeta || null);
        setRankingStatus('ready');
        setRankingError(null);
      }

      if (msg.type === 'error') {
        setRankingStatus('error');
        setRankingError(msg.message || 'Ranking worker error');
      }
    };

    w.addEventListener('message', onMessage);
    w.addEventListener('error', (err) => {
      setRankingStatus('error');
      setRankingError(err?.message || 'Worker crashed');
    });

    return () => {
      w.removeEventListener('message', onMessage);
      w.terminate();
      workerRef.current = null;
    };
  }, []);

  // Recompute ranking whenever inputs change (computation itself runs off-main-thread).
  useEffect(() => {
    const w = workerRef.current;
    if (!w) return;

    setRankingStatus('loading');
    setRankingError(null);

    const payload = {
      selectedZone,
      overrides,
      isOptimized,
      priceUnit,
      priorities: computationPriorities,
    };
    lastPayloadRef.current = payload;

    const seq = (seqRef.current || 0) + 1;
    seqRef.current = seq;

    w.postMessage({
      type: 'compute',
      seq,
      payload,
    });
  }, [selectedZone, overrides, isOptimized, priceUnit, computationPriorities]);

  const retryRanking = () => {
    const w = workerRef.current;
    const payload = lastPayloadRef.current;
    if (!w || !payload) return;

    setRankingStatus('loading');
    setRankingError(null);
    const seq = (seqRef.current || 0) + 1;
    seqRef.current = seq;
    w.postMessage({ type: 'compute', seq, payload });
  };


  // Shady feature: Toggle Worst Food Ever mode and set fixed priority values
  const handleWorstModeToggle = () => {
    setIsWorstMode(prev => {
      const newMode = !prev;
      
      // Invert the sign of active priorities and flush so ranking updates immediately.
      prefsActions.updateUiPriorities((current) => {
        const updated = {};
        Object.keys(current || {}).forEach((key) => {
          const value = current[key];
          const absValue = Math.abs(value);
          updated[key] = value === 0 ? 0 : (newMode ? -absValue : absValue);
        });
        return updated;
      });
      prefsActions.flushPriorities();
      
      return newMode;
    });
  };

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
            isWorstMode={isWorstMode}
            onWorstModeToggle={handleWorstModeToggle}
            isPrioritiesExpanded={isPrioritiesExpanded}
          />
        </div>

        {/* Sticky Priorities Panel - lower z-index, will stick below header when scrolling */}
        <div
          className={`sticky z-40 ${
            !isPrioritiesExpanded ? 'top-0 min-[480px]:top-[73px]' : 'top-[73px]'
          }`}
        >
          <PrioritiesPanel
            onExpandedChange={setIsPrioritiesExpanded}
            scrollableElement={scrollableElement}
          />
        </div>

        {/* Main Content Area */}
        <motion.main 
          className="flex-1 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {viewMode === 'grid' ? (
            <DishGrid
              dishes={rankedDishes}
              rankingMeta={rankingMeta}
              isLoading={rankingStatus === 'loading'}
              error={rankingStatus === 'error' ? rankingError : null}
              onRetry={retryRanking}
              onScrollContainerChange={setScrollableElement}
            />
          ) : (
            <DishList
              dishes={rankedDishes}
              rankingMeta={rankingMeta}
              isLoading={rankingStatus === 'loading'}
              error={rankingStatus === 'error' ? rankingError : null}
              onRetry={retryRanking}
              onScrollContainerChange={setScrollableElement}
            />
          )}
        </motion.main>

        {/* Bottom safe area for mobile (iOS) */}
        <div 
          className="bg-white dark:bg-surface-900 transition-colors duration-300" 
          style={{ height: 'var(--safe-area-inset-bottom)' }}
        />
      </div>
    </div>
  );
}


