import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, X, Check, Sparkles } from 'lucide-react';
import { useIsMobile } from '../lib/useIsMobile';
import { useOnClickOutside } from '../hooks/useOnClickOutside';

/**
 * Preset option card for the selector
 */
function PresetOption({ preset, isSelected, onSelect }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => onSelect(preset)}
      className={`
        w-full text-left rounded-xl border px-4 py-3 transition-colors
        ${
          isSelected
            ? 'bg-food-500/15 border-food-500/50 text-surface-900 dark:text-surface-100'
            : 'bg-white/60 dark:bg-surface-800/60 border-surface-300/60 dark:border-surface-700/60 text-surface-800 dark:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-700/60'
        }
        active:scale-[0.99]
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold leading-snug">{preset.name}</div>
          {preset.description && (
            <div className="mt-1 text-xs text-surface-500 dark:text-surface-400 leading-snug">
              {preset.description}
            </div>
          )}
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

/**
 * Desktop dropdown for presets
 */
function PresetDropdown({ open, anchorEl, presets, currentPreset, onClose, onSelectPreset }) {
  const dropdownRef = useRef(null);

  let position = null;
  if (open && anchorEl?.getBoundingClientRect) {
    const r = anchorEl.getBoundingClientRect();
    const width = Math.max(280, r.width);
    
    // Position below the anchor element
    let left = r.left;
    const viewportWidth = window.innerWidth;
    
    // Ensure dropdown doesn't overflow right edge
    if (left + width > viewportWidth - 16) {
      left = viewportWidth - width - 16;
    }
    
    position = { top: r.bottom + 4, left, width };
  }

  useOnClickOutside({
    enabled: open && !!anchorEl,
    insideRefs: [anchorEl, dropdownRef],
    onOutside: onClose,
    clickCapture: false,
    closeOnScroll: true,
    scrollTarget: typeof window !== 'undefined' ? window : null,
    scrollCapture: true,
    ignoreScrollInsideRefs: [dropdownRef],
  });

  if (!open || !position) return null;

  return createPortal(
    <motion.div
      ref={dropdownRef}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="fixed bg-white dark:bg-surface-800 rounded-xl border border-surface-300 dark:border-surface-700 shadow-xl z-[100] overflow-hidden"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-food-500" />
          <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">
            Choose Preset
          </span>
        </div>
      </div>
      
      {/* Preset list */}
      <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
        <div className="space-y-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => {
                onSelectPreset?.(preset);
                onClose?.();
              }}
              className={`
                w-full px-3 py-3 text-left rounded-lg flex items-start gap-3 transition-colors
                ${
                  currentPreset?.id === preset.id
                    ? 'bg-food-500/15 text-surface-900 dark:text-surface-100'
                    : 'text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700'
                }
              `}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{preset.name}</div>
                {preset.description && (
                  <div className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 leading-snug">
                    {preset.description}
                  </div>
                )}
              </div>
              {currentPreset?.id === preset.id && (
                <Check size={16} className="text-food-500 flex-shrink-0 mt-0.5" />
              )}
            </button>
          ))}
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

/**
 * Mobile modal for presets
 */
function PresetModal({ open, presets, currentPreset, onClose, onSelectPreset }) {
  const closeBtnRef = useRef(null);
  const isMobile = useIsMobile();

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Focus close button on open
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => closeBtnRef.current?.focus?.(), 0);
    return () => clearTimeout(t);
  }, [open]);

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

          {/* Modal panel - top sheet on mobile, centered on desktop */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Choose Preset"
            className={`
              ${isMobile 
                ? 'absolute top-0 left-0 right-0 rounded-b-2xl border-b border-surface-300/60 dark:border-surface-700/60'
                : 'absolute top-1/2 left-1/2 w-full max-w-md rounded-2xl border border-surface-300/60 dark:border-surface-700/60'
              }
              bg-white dark:bg-surface-900
              shadow-2xl
              ${isMobile ? 'max-h-[70vh]' : 'max-h-[80vh]'}
              overflow-hidden
            `}
            initial={isMobile ? { y: -24, opacity: 0 } : { scale: 0.95, opacity: 0, x: '-50%', y: '-50%' }}
            animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1, x: '-50%', y: '-50%' }}
            exit={isMobile ? { y: -24, opacity: 0 } : { scale: 0.95, opacity: 0, x: '-50%', y: '-50%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`px-4 ${isMobile ? 'pt-4 pb-2' : 'pt-4 pb-3'} flex items-center justify-between`} style={isMobile ? { paddingTop: 'calc(16px + var(--safe-area-inset-top))' } : {}}>
              <div className="min-w-0 flex items-center gap-2">
                <Sparkles size={18} className="text-food-500" />
                <div className="text-base font-bold text-surface-900 dark:text-surface-100">
                  Choose Preset
                </div>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-100/80 dark:bg-surface-800/80 border border-surface-300/50 dark:border-surface-700/50 hover:bg-surface-200/80 dark:hover:bg-surface-700/80 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div
              className={`px-4 ${isMobile ? 'pb-4' : 'pb-6'} overflow-y-auto custom-scrollbar`}
              style={isMobile ? { paddingBottom: 'calc(16px + var(--safe-area-inset-bottom))' } : {}}
            >
              <div className="text-xs text-surface-500 dark:text-surface-400 mb-3 leading-snug">
                Select a preset to apply predefined priority settings and configurations.
              </div>
              <div role="radiogroup" aria-label="Presets" className="space-y-2">
                {presets.map((preset) => (
                  <PresetOption
                    key={preset.id}
                    preset={preset}
                    isSelected={currentPreset?.id === preset.id}
                    onSelect={(p) => {
                      onSelectPreset?.(p);
                      onClose?.();
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Main PresetSelector component
 * Shows dropdown on desktop, modal on mobile
 */
export default function PresetSelector({ 
  presets = [], 
  currentPreset = null, 
  onSelectPreset 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const isMobile = useIsMobile();

  const handleClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const displayName = currentPreset?.name || 'Select Preset';
  const displayDescription = currentPreset?.description || 'Choose a configuration';

  return (
    <>
      {/* Trigger button - the logo/title area */}
      <button
        ref={buttonRef}
        onClick={handleClick}
        className="text-left hover:opacity-80 transition-opacity cursor-pointer min-w-0 flex-1 group"
        title="Click to choose a preset"
      >
        <div className="flex items-center gap-1">
          <h1 className="font-display font-bold text-lg text-surface-900 dark:text-surface-100 truncate">
            {displayName}
          </h1>
          <ChevronDown 
            size={16} 
            className={`text-surface-400 dark:text-surface-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </div>
        <p className="text-[10px] text-surface-500 dark:text-surface-400 uppercase tracking-wider truncate">
          {displayDescription}
        </p>
      </button>

      {/* Selector - modal on mobile, dropdown on desktop */}
      {isMobile ? (
        <PresetModal
          open={isOpen}
          presets={presets}
          currentPreset={currentPreset}
          onClose={handleClose}
          onSelectPreset={onSelectPreset}
        />
      ) : (
        <AnimatePresence>
          {isOpen && (
            <PresetDropdown
              open={isOpen}
              anchorEl={buttonRef.current}
              presets={presets}
              currentPreset={currentPreset}
              onClose={handleClose}
              onSelectPreset={onSelectPreset}
            />
          )}
        </AnimatePresence>
      )}
    </>
  );
}

