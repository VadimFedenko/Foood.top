import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { usePrefs, prefsActions } from '../store/prefsStore';
import { ECONOMIC_ZONES } from '../lib/RankingEngine';
import ZoneIcon from './ZoneIcon';

function CookingModeOption({ value, isSelected, title, description, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => onSelect(value)}
      className={`
        w-full text-left rounded-xl border px-4 py-3 transition-colors
        ${
          isSelected
            ? 'bg-food-500/15 border-food-500/50 text-surface-900 dark:text-surface-100'
            : 'bg-white/60 dark:bg-surface-800/60 border-surface-300/60 dark:border-surface-700/60 text-surface-800 dark:text-surface-100'
        }
        active:scale-[0.99]
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold leading-snug">{title}</div>
          <div className="mt-1 text-xs text-surface-500 dark:text-surface-400 leading-snug">
            {description}
          </div>
        </div>
        <div
          className={`
            mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0
            ${isSelected ? 'border-food-500/70' : 'border-surface-300 dark:border-surface-600'}
          `}
          aria-hidden="true"
        >
          {isSelected ? <div className="w-2.5 h-2.5 rounded-full bg-food-500" /> : null}
        </div>
      </div>
    </button>
  );
}

function ZoneOption({ zoneId, zone, isSelected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => onSelect(zoneId)}
      className={`
        w-full text-left rounded-xl border px-4 py-3 transition-colors
        ${
          isSelected
            ? 'bg-blue-500/15 border-blue-500/50 text-surface-900 dark:text-surface-100'
            : 'bg-white/60 dark:bg-surface-800/60 border-surface-300/60 dark:border-surface-700/60 text-surface-800 dark:text-surface-100'
        }
        active:scale-[0.99]
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <ZoneIcon zoneId={zoneId} size={18} />
          <span className="text-sm font-semibold truncate">{zone.name}</span>
        </div>
        <div
          className={`
            w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0
            ${isSelected ? 'border-blue-500/70' : 'border-surface-300 dark:border-surface-600'}
          `}
          aria-hidden="true"
        >
          {isSelected ? <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> : null}
        </div>
      </div>
    </button>
  );
}

export default function SettingsSheet({ open, onClose }) {
  const isOptimized = usePrefs((s) => s.prefs.isOptimized);
  const selectedZone = usePrefs((s) => s.prefs.selectedZone);
  const tasteScoreMethod = usePrefs((s) => s.prefs.tasteScoreMethod);
  const closeBtnRef = useRef(null);

  // Lock background scroll while sheet is open (mobile UX).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Focus close button on open.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => closeBtnRef.current?.focus?.(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const setMode = (mode) => {
    prefsActions.setPref({ isOptimized: mode === 'optimized' });
  };

  const setZone = (zoneId) => {
    prefsActions.setPref({ selectedZone: zoneId });
  };

  const setTasteScoreMethod = (method) => {
    prefsActions.setPref({ tasteScoreMethod: method });
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[200]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Bottom sheet */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            className={`
              absolute bottom-0 left-0 right-0
              bg-white dark:bg-surface-900
              border-t border-surface-300/60 dark:border-surface-700/60
              rounded-t-2xl shadow-2xl
              max-h-[85vh] overflow-hidden
            `}
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="pt-2 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-surface-300/70 dark:bg-surface-700/70" />
            </div>

            {/* Header */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-base font-bold text-surface-900 dark:text-surface-100">
                  Settings
                </div>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-100/80 dark:bg-surface-800/80 border border-surface-300/50 dark:border-surface-700/50"
                aria-label="Close settings"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div
              className="px-4 pb-4 overflow-y-auto custom-scrollbar"
              style={{ paddingBottom: 'calc(16px + var(--safe-area-inset-bottom))' }}
            >
              <div className="mt-3 space-y-6">
                {/* Cooking time mode */}
                <div>
                  <div className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-2">
                    Cooking time mode
                  </div>
                  <div role="radiogroup" aria-label="Cooking time mode" className="space-y-2">
                    <CookingModeOption
                      value="normal"
                      isSelected={!isOptimized}
                      title="Normal cooking"
                      description="Cooking speed is based on typical recipe times."
                      onSelect={setMode}
                    />
                    <CookingModeOption
                      value="optimized"
                      isSelected={isOptimized}
                      title="Time optimized"
                      description="Many dishes can be prepared much faster using batching and professional kitchen techniques. This mode applies these optimized timings."
                      onSelect={setMode}
                    />
                  </div>
                </div>

                {/* Taste score method */}
                <div>
                  <div className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-2">
                    Taste Score as
                  </div>
                  <div role="radiogroup" aria-label="Taste score method" className="space-y-2">
                    <CookingModeOption
                      value="taste_score"
                      isSelected={tasteScoreMethod === 'taste_score'}
                      title="AI Polarization Analysis"
                      description="Uses taste_score as the taste parameter."
                      onSelect={setTasteScoreMethod}
                    />
                    <CookingModeOption
                      value="sentiment_score"
                      isSelected={tasteScoreMethod === 'sentiment_score'}
                      title="Amazon/Yelp Sentiment Analysis"
                      description="Uses sentiment_score as the taste parameter."
                      onSelect={setTasteScoreMethod}
                    />
                  </div>
                </div>

                {/* Economic zone */}
                <div>
                  <div className="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-2">
                    Economic zone
                  </div>
                  <div className="text-xs text-surface-500 dark:text-surface-400 mb-3 leading-snug">
                    Select an economic zone. This is used to calculate the local cost of preparing the dish in the selected region.
                  </div>
                  <div role="radiogroup" aria-label="Economic zone" className="space-y-2 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                    {Object.entries(ECONOMIC_ZONES).map(([zoneId, zone]) => (
                      <ZoneOption
                        key={zoneId}
                        zoneId={zoneId}
                        zone={zone}
                        isSelected={selectedZone === zoneId}
                        onSelect={setZone}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}


