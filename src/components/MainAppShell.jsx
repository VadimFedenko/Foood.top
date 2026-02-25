import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { LazyMotion, domAnimation, m } from '../lib/motion';
import Header from './Header';
import { usePrefs } from '../store/prefsStore';

import PrioritiesPanel from './PrioritiesPanel';
import DishGrid from './DishGrid';

const DishList = lazy(() => import('./DishList'));

function MainFallback() {
  return (
    <div className="p-4 text-sm text-surface-500 dark:text-surface-400">
      Loading...
    </div>
  );
}

export default function MainAppShell() {
  const selectedZone = usePrefs((s) => s.prefs.selectedZone);
  const overrides = usePrefs((s) => s.prefs.overrides);
  const isOptimized = usePrefs((s) => s.prefs.isOptimized);
  const priceUnit = usePrefs((s) => s.prefs.priceUnit);
  const viewMode = usePrefs((s) => s.prefs.viewMode);
  const tasteScoreMethod = usePrefs((s) => s.prefs.tasteScoreMethod);
  const computationPriorities = usePrefs((s) => s.computationPriorities);

  // We only need the setter for PrioritiesPanel callbacks.
  const [, setIsPrioritiesExpanded] = useState(true);

  // Explicit scroll container element for the priorities auto-toggle logic.
  const [scrollableElement, setScrollableElement] = useState(null);

  // Ranking data computed in a worker to keep first paint + interactions snappy.
  const workerRef = useRef(null);
  const seqRef = useRef(0);
  const [rankedDishes, setRankedDishes] = useState([]);
  const [rankingMeta, setRankingMeta] = useState(null);
  const [rankingStatus, setRankingStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [rankingError, setRankingError] = useState(null);
  const lastPayloadRef = useRef(null);
  const pendingRankingUpdateRef = useRef(null); // { type:'result'|'error', seq, rankedDishes, rankingMeta, message }
  const isUserDraggingRef = useRef(false);

  // Create worker once.
  useEffect(() => {
    const w = new Worker(new URL('../workers/rankingWorker.js', import.meta.url), { type: 'module' });
    workerRef.current = w;

    // Provide absolute URLs for static JSON so the worker can fetch in both dev and prod.
    try {
      const dishesUrl = new URL('dishes.json', document.baseURI).toString();
      const ingredientsUrl = new URL('ingredients.json', document.baseURI).toString();
      w.postMessage({ type: 'init', dataUrls: { dishesUrl, ingredientsUrl }, preload: true });
    } catch {
      // ignore; worker has a production-only fallback
    }

    const onMessage = (e) => {
      const msg = e?.data || {};
      if (!msg || typeof msg !== 'object') return;

      // Drop stale results.
      if (msg.seq !== seqRef.current) return;

      if (msg.type === 'result') {
        if (isUserDraggingRef.current) {
          pendingRankingUpdateRef.current = {
            type: 'result',
            seq: msg.seq,
            rankedDishes: Array.isArray(msg.rankedDishes) ? msg.rankedDishes : [],
            rankingMeta: msg.rankingMeta || null,
            message: null,
          };
          return;
        }
        setRankedDishes(Array.isArray(msg.rankedDishes) ? msg.rankedDishes : []);
        setRankingMeta(msg.rankingMeta || null);
        setRankingStatus('ready');
        setRankingError(null);
      }

      if (msg.type === 'error') {
        if (isUserDraggingRef.current) {
          pendingRankingUpdateRef.current = {
            type: 'error',
            seq: msg.seq,
            rankedDishes: null,
            rankingMeta: null,
            message: msg.message || 'Ranking worker error',
          };
          return;
        }
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

  const handleDraggingChange = (dragging) => {
    isUserDraggingRef.current = !!dragging;
    if (dragging) return;
    const pending = pendingRankingUpdateRef.current;
    if (!pending) return;
    if (pending.seq !== seqRef.current) {
      pendingRankingUpdateRef.current = null;
      return;
    }
    pendingRankingUpdateRef.current = null;
    if (pending.type === 'result') {
      setRankedDishes(pending.rankedDishes || []);
      setRankingMeta(pending.rankingMeta || null);
      setRankingStatus('ready');
      setRankingError(null);
    } else {
      setRankingStatus('error');
      setRankingError(pending.message || 'Ranking worker error');
    }
  };

  // Recompute ranking whenever inputs change (computation itself runs off-main-thread).
  useEffect(() => {
    const w = workerRef.current;
    if (!w) return;

    // While user is dragging on mobile, avoid UI "loading" flicker + list churn.
    if (!isUserDraggingRef.current) {
      setRankingStatus('loading');
      setRankingError(null);
    }

    const payload = {
      selectedZone,
      overrides,
      isOptimized,
      priceUnit,
      priorities: computationPriorities,
      tasteScoreMethod,
    };
    lastPayloadRef.current = payload;

    const seq = (seqRef.current || 0) + 1;
    seqRef.current = seq;

    w.postMessage({
      type: 'compute',
      seq,
      payload,
    });
  }, [selectedZone, overrides, isOptimized, priceUnit, computationPriorities, tasteScoreMethod]);

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

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-surface-100 dark:bg-surface-900 pattern-grid transition-colors duration-300">
        <div
          className="mx-auto w-full max-w-[960px] flex flex-col h-screen
                        border-x border-surface-300/50 dark:border-surface-700/50
                        shadow-2xl shadow-black/10 dark:shadow-black/30
                        bg-white dark:bg-surface-900 lg:bg-white/50 lg:dark:bg-transparent transition-colors duration-300"
        >
          <div className="sticky top-0 z-50">
            <Header />
          </div>

          <div className="sticky z-40 top-[73px]">
            <PrioritiesPanel
              onExpandedChange={setIsPrioritiesExpanded}
              onDraggingChange={handleDraggingChange}
              scrollableElement={scrollableElement}
            />
          </div>

          <m.main
            className="flex-1 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Suspense fallback={<MainFallback />}>
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
            </Suspense>
          </m.main>

          <div
            className="bg-white dark:bg-surface-900 transition-colors duration-300"
            style={{ height: 'var(--safe-area-inset-bottom)' }}
          />
        </div>
      </div>
    </LazyMotion>
  );
}
