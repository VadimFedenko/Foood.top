import { useEffect, useState, useRef, lazy, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Heart,
  Leaf,
  FileText,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useIsMobile } from '../lib/useIsMobile';
import { getScoreColor } from './dishCardUtils';
import { prefsActions, usePrefs } from '../store/prefsStore';
import { loadIngredientsIndex } from '../lib/loadIngredientsIndex';

// Lazy load slide components for code splitting
const OverviewSlide = lazy(() => import('./OverviewSlide'));
const IndexMapSlide = lazy(() => import('./IndexMapSlide'));
const TimeSlide = lazy(() => import('./TimeSlide'));
const HealthSlide = lazy(() => import('./HealthSlide'));
const EthicsSlide = lazy(() => import('./EthicsSlide'));

// Slide overlay colors matching the hero header
const SLIDE_OVERLAY_COLORS = [
  'rgba(255,145,48,0.85)', // Overview (orange - food-500)
  'rgba(6,78,59,0.85)', // Index Map
  'rgba(22,78,99,0.85)', // Time
  'rgba(136,19,55,0.85)', // Health
  'rgba(63,98,18,0.85)', // Ethics
];

/**
 * Slide navigation tabs with auto-scroll to active tab
 * Completely reworked for mobile - better touch interactions
 */
function SlideNavigation({ slides, currentSlide, onSlideChange, isMobile, disabled = false }) {
  // Get the overlay color for the current slide
  const getSlideColor = (idx) => SLIDE_OVERLAY_COLORS[idx] || SLIDE_OVERLAY_COLORS[0];
  const containerRef = useRef(null);
  const buttonRefs = useRef([]);
  
  // Improved auto-scroll for mobile with better centering
  useEffect(() => {
    if (buttonRefs.current[currentSlide] && containerRef.current) {
      const button = buttonRefs.current[currentSlide];
      const container = containerRef.current;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollLeft = container.scrollLeft;
      
      // Center the active button on mobile, otherwise just scroll into view
      if (isMobile) {
        const targetScroll = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
        container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
      } else {
        // Desktop: scroll into view with padding
        if (buttonLeft < scrollLeft) {
          container.scrollTo({ left: buttonLeft - 8, behavior: 'smooth' });
        } else if (buttonLeft + buttonWidth > scrollLeft + containerWidth) {
          container.scrollTo({ left: buttonLeft + buttonWidth - containerWidth + 8, behavior: 'smooth' });
        }
      }
    }
  }, [currentSlide, isMobile]);
  
  if (isMobile) {
    // Mobile: Full-width scrollable tabs with snap scrolling
    return (
      <div 
        ref={containerRef}
        className="flex items-center gap-1.5 overflow-x-auto py-2 px-2 snap-x snap-mandatory hide-scrollbar"
        style={{ 
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {slides.map((slide, idx) => {
          const Icon = slide.icon;
          const isActive = idx === currentSlide;
          const slideColor = getSlideColor(idx);
          
          return (
            <button
              key={slide.id}
              ref={(el) => { buttonRefs.current[idx] = el; }}
              onClick={() => {
                if (disabled) return;
                onSlideChange(idx);
              }}
              disabled={disabled}
              className={`
                flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 flex-shrink-0 snap-start
                min-w-[90px]
                ${isActive 
                  ? 'text-white shadow-md scale-105' 
                  : 'bg-surface-200/50 dark:bg-surface-700/50 text-surface-600 dark:text-surface-400 active:bg-surface-300 dark:active:bg-surface-600 active:scale-95'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed active:scale-100' : ''}
              `}
              style={{ 
                touchAction: 'manipulation',
                ...(isActive && { backgroundColor: slideColor })
              }}
            >
              <Icon size={14} />
              <span>{slide.label}</span>
            </button>
          );
        })}
      </div>
    );
  }
  
  // Desktop: Original design but refined
  return (
    <div 
      ref={containerRef}
      className="flex items-center gap-1 overflow-x-auto py-1 px-1"
      style={{ scrollbarWidth: 'thin', msOverflowStyle: '-ms-autohiding-scrollbar' }}
    >
      {slides.map((slide, idx) => {
        const Icon = slide.icon;
        const isActive = idx === currentSlide;
        const slideColor = getSlideColor(idx);
        
        return (
          <button
            key={slide.id}
            ref={(el) => { buttonRefs.current[idx] = el; }}
            onClick={() => {
              if (disabled) return;
              onSlideChange(idx);
            }}
            disabled={disabled}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-200 flex-shrink-0 whitespace-nowrap
              ${isActive 
                ? 'text-white border border-white/20' 
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-200/30 dark:hover:bg-surface-700/30'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent' : ''}
            `}
            style={isActive ? { backgroundColor: slideColor } : {}}
          >
            <Icon size={14} />
            <span>{slide.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Hero image header with gradient overlay
 */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function HeroHeader({
  dish,
  onClose,
  isMobile,
  heroHeightPx,
  heroCollapsedPx,
  heroExpandedPx,
  heroMode,
  setHeroMode,
  setHeroHeightPx,
}) {
  // Show small placeholder immediately; render big image above it once loaded (no transitions).
  const smallSrc = dish?.originalDish?.img_s || dish?.img_s;
  const bigSrc = dish?.originalDish?.img_b || dish?.img_b;
  const [bigLoaded, setBigLoaded] = useState(false);

  useEffect(() => {
    setBigLoaded(false);
  }, [smallSrc, bigSrc]);
  const scoreColors = getScoreColor(dish?.score ?? 50);

  const isExpanded = heroMode === 'expanded';
  
  return (
    <div
      className={`relative overflow-hidden rounded-t-xl flex-shrink-0 ${!isMobile ? 'h-48' : ''}`}
      style={{
        height: isMobile ? `${heroHeightPx}px` : undefined,
      }}
    >
      {/* Always keep a non-empty background to avoid black flashes */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-700 to-surface-900" />

      {/* Small image (placeholder) */}
      {smallSrc && (
        <img
          src={smallSrc}
          alt={dish?.name || ''}
          className="absolute inset-0 w-full h-full object-cover"
          decoding="async"
          loading="eager"
          draggable={false}
        />
      )}

      {/* Big image (shown only after it loads). Keep it in DOM so loading starts immediately. */}
      {bigSrc && (
        <img
          src={bigSrc}
          alt={dish?.name || ''}
          className="absolute inset-0 w-full h-full object-cover"
          decoding="async"
          loading="eager"
          fetchpriority="high"
          draggable={false}
          onLoad={() => setBigLoaded(true)}
          onError={() => setBigLoaded(false)}
          style={{ opacity: bigLoaded ? 1 : 0 }}
        />
      )}
      
      <div
        className="absolute inset-0 transition-[background] duration-300"
        style={{
          top: '-1px',
          left: 0,
          right: 0,
          bottom: '-1px',
          background: isExpanded && isMobile
            ? 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 15%, rgba(0,0,0,0.2) 30%, transparent 50%)'
            : 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.3), transparent)'
        }}
      />
      
      <button
        onClick={onClose}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full bg-black/30 text-white/90 hover:bg-black/50 transition-colors ${!isMobile ? 'backdrop-blur-sm' : ''}`}
      >
        <X size={20} />
      </button>

      {isMobile && (
        <div className="absolute top-2 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <div className="w-10 h-1 rounded-full bg-white/35" />
        </div>
      )}
      
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-end justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-lg sm:text-xl text-white truncate drop-shadow-lg">
              {dish?.name}
            </h2>
            <p
              className={[
                'text-white/80 text-xs sm:text-sm mt-0.5 drop-shadow leading-snug',
                isExpanded ? 'line-clamp-none max-h-40 overflow-auto pr-1 custom-scrollbar' : 'line-clamp-1',
              ].join(' ')}
            >
              {dish?.description || dish?.originalDish?.desc}
            </p>
          </div>
          
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${scoreColors.bg} ${scoreColors.glow} shadow-lg`}>
            <span className="text-lg font-display font-bold text-white">{dish?.score ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Dish Modal Component
 */
export default function DishModal({ 
  dish, 
  isOpen, 
  onClose, 
  priorities = {},
  isOptimized = false,
  analysisVariants = null,
  rankingMeta = null,
  priceUnit = 'serving',
}) {
  const isMobile = useIsMobile();
  const theme = usePrefs((s) => s.prefs.theme);
  const isDark = theme !== 'light';
  const overrides = usePrefs((s) => s.prefs.overrides);
  const userSelectedZone = usePrefs((s) => s.prefs.selectedZone);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const contentScrollRef = useRef(null);
  const modalContainerRef = useRef(null);
  const [isEditingScores, setIsEditingScores] = useState(false);

  // Lazily loaded ingredients DB/index (only needed for some slides).
  const [loadedIngredientIndex, setLoadedIngredientIndex] = useState(null);
  const [ingredientsLoadState, setIngredientsLoadState] = useState('idle'); // 'idle' | 'loading' | 'ready' | 'error'

  // Mobile-only: resizable hero header (collapsed/expanded)
  const heroCollapsedPx = 160; // Tailwind h-40
  const [heroExpandedPx, setHeroExpandedPx] = useState(460);
  const [heroHeightPx, setHeroHeightPx] = useState(heroCollapsedPx);
  const [heroMode, setHeroMode] = useState('collapsed'); // 'collapsed' | 'expanded'
  
  // Batch save from EditableScoreBreakdown "Save" button to avoid multiple
  // store writes/ranking recomputes in a tight loop.
  //
  // IMPORTANT: ranking engine expects { taste/health/ethics/price/calories/satiety/time }
  // or their *Mul variants (tasteMul, priceMul, timeMul, ...). EditableScoreBreakdown
  // produces *Mul patches, so we persist those keys directly.
  const handleApplyOverridesPatch = useCallback((patch) => {
    if (!dish?.id) return;
    if (!patch || typeof patch !== 'object') return;

    const current = overrides?.[dish.id] || {};
    const next = { ...current, ...patch };
    prefsActions.setOverrideForDish(dish.id, next);
  }, [dish?.id, overrides]);
  
  const handleResetAll = () => {
    if (!dish?.id) return;
    prefsActions.setOverrideForDish(dish.id, {});
  };
  
  // Slides - removed "Scores" slide
  const slides = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'index-map', label: 'Index Map', icon: MapIcon },
    { id: 'time', label: 'Time', icon: Clock },
    { id: 'health', label: 'Health', icon: Heart },
    { id: 'ethics', label: 'Ethics', icon: Leaf },
  ];
  
  useEffect(() => {
    if (isOpen) setCurrentSlide(0);
  }, [isOpen]);

  // Only load heavy ingredient DB when the modal is open AND a slide needs it.
  useEffect(() => {
    const slideNeedsIngredients = currentSlide === 1 || currentSlide === 3 || currentSlide === 4;
    if (!isOpen || !slideNeedsIngredients) return;
    if (loadedIngredientIndex) return;

    let cancelled = false;
    setIngredientsLoadState('loading');
    loadIngredientsIndex()
      .then(({ ingredientIndex }) => {
        if (cancelled) return;
        setLoadedIngredientIndex(ingredientIndex);
        setIngredientsLoadState('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setIngredientsLoadState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [currentSlide, isOpen, loadedIngredientIndex, ingredientsLoadState]);

  useEffect(() => {
    if (!isMobile) return;
    const calcExpanded = () => {
      const h = typeof window !== 'undefined' ? window.innerHeight : 740;
      // ~62% of viewport, but keep sane bounds for tiny/huge screens
      return clamp(Math.round(h * 0.62), 320, 560);
    };

    const apply = () => {
      const next = calcExpanded();
      setHeroExpandedPx(next);
    };

    apply();
    const handleResize = () => apply();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  useEffect(() => {
    if (!isOpen) return;
    // Reset to collapsed each time the modal opens (mobile)
    if (isMobile) {
      setHeroMode('collapsed');
      setHeroHeightPx(heroCollapsedPx);
    }
  }, [isOpen, isMobile]);
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.overflowX = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.body.style.overflowX = '';
    }
    return () => { 
      document.body.style.overflow = '';
      document.body.style.overflowX = '';
    };
  }, [isOpen]);
  
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!isEditingScores) onClose();
        return;
      }
      if (isEditingScores) return;
      if (e.key === 'ArrowLeft') setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
      if (e.key === 'ArrowRight') setCurrentSlide((prev) => (prev + 1) % slides.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditingScores, onClose, slides.length]);
  
  // Touch handlers for slide navigation (horizontal swipes)
  // Keep touch tracking in a ref to avoid re-rendering the whole modal on every touchmove.
  const slideSwipeRef = useRef({
    touchStartX: null,
    touchEndX: null,
    touchStartY: null,
    touchEndY: null,
  });
  const minSwipeDistance = 50;

  const onTouchStart = (e) => { 
    if (isEditingScores) return;
    const t = e.targetTouches?.[0];
    if (!t) return;
    slideSwipeRef.current.touchEndX = null;
    slideSwipeRef.current.touchEndY = null;
    slideSwipeRef.current.touchStartX = t.clientX;
    slideSwipeRef.current.touchStartY = t.clientY;
  };
  const onTouchMove = (e) => { 
    if (isEditingScores) return;
    const t = e.targetTouches?.[0];
    if (!t) return;
    slideSwipeRef.current.touchEndX = t.clientX;
    slideSwipeRef.current.touchEndY = t.clientY;
  };
  const onTouchEnd = () => {
    if (isEditingScores) return;
    const { touchStartX, touchEndX, touchStartY, touchEndY } = slideSwipeRef.current;
    if (touchStartX == null || touchEndX == null || touchStartY == null || touchEndY == null) return;
    const distanceX = touchStartX - touchEndX;
    const distanceY = Math.abs(touchStartY - touchEndY);
    
    // Only process horizontal swipe if it's more horizontal than vertical
    if (Math.abs(distanceX) > distanceY && Math.abs(distanceX) > minSwipeDistance) {
      if (distanceX > minSwipeDistance) setCurrentSlide((prev) => (prev + 1) % slides.length);
      if (distanceX < -minSwipeDistance) setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }
  };

  // Touch handlers for modal/header gestures (vertical swipes) - work anywhere on modal
  const modalDragRef = useRef({
    startY: 0,
    startX: 0,
    currentY: 0,
    currentX: 0,
    startHeight: 0,
    startMode: heroMode,
    dragging: false,
    isVertical: false,
    startTouchY: 0, // Touch position relative to modal
    contentScrollTop: 0, // Scroll position of content at start
  });

  const onModalTouchStart = (e) => {
    if (!isMobile) return;
    if (isEditingScores) return;
    const t = e.targetTouches?.[0];
    if (!t) return;

    // Get modal element to calculate relative position
    const modalElement = e.currentTarget;
    const modalRect = modalElement.getBoundingClientRect();
    const touchYRelative = t.clientY - modalRect.top;
    
    // Get scroll position of content
    const contentScrollTop = contentScrollRef.current?.scrollTop || 0;

    modalDragRef.current = {
      startY: t.clientY,
      startX: t.clientX,
      currentY: t.clientY,
      currentX: t.clientX,
      startHeight: heroHeightPx,
      startMode: heroMode,
      dragging: true,
      isVertical: false,
      startTouchY: touchYRelative,
      contentScrollTop: contentScrollTop,
    };
  };

  const onModalTouchMove = (e) => {
    if (!isMobile) return;
    if (isEditingScores) return;
    if (!modalDragRef.current.dragging) return;
    const t = e.targetTouches?.[0];
    if (!t) return;

    const dy = t.clientY - modalDragRef.current.startY;
    const dx = Math.abs(t.clientX - modalDragRef.current.startX);
    
    // Update current positions
    modalDragRef.current.currentY = t.clientY;
    modalDragRef.current.currentX = t.clientX;
    
    // Determine if this is a vertical gesture (dy > dx) after minimum movement
    if (!modalDragRef.current.isVertical && Math.abs(dy) > 15) {
      modalDragRef.current.isVertical = Math.abs(dy) > dx * 0.8; // Stricter threshold
    }

    // Only handle vertical gestures for header/modal control
    // Only prevent default and update if we've determined it's a vertical gesture
    if (modalDragRef.current.isVertical) {
      // React/browsers may attach touch listeners as passive; avoid warnings and
      // only call preventDefault when the event is actually cancelable.
      if (e.cancelable) e.preventDefault(); // Prevent scrolling during drag
      const next = clamp(modalDragRef.current.startHeight + dy, heroCollapsedPx, heroExpandedPx);
      setHeroHeightPx(next);
    }
  };

  const onModalTouchEnd = () => {
    if (!isMobile) return;
    if (isEditingScores) return;
    if (!modalDragRef.current.dragging) return;

    // Use currentY instead of heroHeightPx for more accurate calculation
    const dy = modalDragRef.current.currentY - modalDragRef.current.startY;
    const dx = Math.abs(modalDragRef.current.currentX - modalDragRef.current.startX);
    const threshold = 80; // Increased threshold - need more deliberate swipe

    // Check if this was a vertical gesture (either already determined or check now)
    const isVerticalGesture = modalDragRef.current.isVertical || (Math.abs(dy) > 15 && Math.abs(dy) > dx * 0.8);

    // Only process if this was a vertical gesture
    if (isVerticalGesture) {
      // Swipe down: expand header
      if (dy > threshold) {
        setHeroMode('expanded');
        setHeroHeightPx(heroExpandedPx);
        modalDragRef.current.dragging = false;
        modalDragRef.current.isVertical = false;
        return;
      }

      // Swipe up: collapse header OR close modal
      if (dy < -threshold) {
        if (modalDragRef.current.startMode === 'expanded') {
          setHeroMode('collapsed');
          setHeroHeightPx(heroCollapsedPx);
        } else {
          // Close modal only if:
          // 1. Touch started in lower part of modal (bottom 200px)
          // 2. Content is scrolled to top (or very close)
          const modalHeight = modalContainerRef.current?.getBoundingClientRect().height || 0;
          const isInLowerArea = modalDragRef.current.startTouchY > (modalHeight - 200);
          const isContentAtTop = modalDragRef.current.contentScrollTop <= 5;
          
          if (isInLowerArea && isContentAtTop) {
            onClose?.();
          }
        }
        modalDragRef.current.dragging = false;
        modalDragRef.current.isVertical = false;
        return;
      }

      // Otherwise: snap to nearest
      const mid = (heroCollapsedPx + heroExpandedPx) / 2;
      if (heroHeightPx >= mid) {
        setHeroMode('expanded');
        setHeroHeightPx(heroExpandedPx);
      } else {
        setHeroMode('collapsed');
        setHeroHeightPx(heroCollapsedPx);
      }
    }

    modalDragRef.current.dragging = false;
    modalDragRef.current.isVertical = false;
  };
  
  const ingredients = dish?.originalDish?.ingredients || [];
  const ingredientIndex = loadedIngredientIndex;
  const unavailableIngredients = dish?.unavailableIngredients || [];
  const missingIngredients = dish?.missingIngredients || [];
  const missingPrices = dish?.missingPrices || [];
  
  if (!dish) return null;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isEditingScores ? undefined : onClose}
            className={`fixed inset-0 z-50 ${
              isMobile && isDark 
                ? 'bg-white/5' 
                : 'bg-black/60'
            } ${!isMobile ? 'backdrop-blur-sm' : ''}`}
          />
          
          <motion.div
            ref={modalContainerRef}
            initial={{ opacity: 0, scale: 0.95, x: isMobile ? 0 : '-50%', y: isMobile ? 0 : '-50%' }}
            animate={{ opacity: 1, scale: 1, x: isMobile ? 0 : '-50%', y: isMobile ? 0 : '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: isMobile ? 0 : '-50%', y: isMobile ? 0 : '-50%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              fixed z-50 bg-white dark:bg-surface-900 shadow-2xl overflow-hidden flex flex-col
              ${isMobile 
                ? 'inset-x-2 top-4 bottom-4 rounded-xl' 
                : 'left-1/2 top-1/2 w-full max-w-2xl h-[56vh] rounded-xl'
              }
            `}
            onTouchStart={onModalTouchStart}
            onTouchMove={onModalTouchMove}
            onTouchEnd={onModalTouchEnd}
            onTouchCancel={onModalTouchEnd}
          >
            <HeroHeader 
              dish={dish}
              onClose={onClose}
              isMobile={isMobile}
              heroHeightPx={isMobile ? heroHeightPx : undefined}
              heroCollapsedPx={heroCollapsedPx}
              heroExpandedPx={heroExpandedPx}
              heroMode={heroMode}
              setHeroMode={setHeroMode}
              setHeroHeightPx={setHeroHeightPx}
            />
            
            <div className="border-b border-surface-200 dark:border-surface-700 flex-shrink-0 relative">
              {isEditingScores && (
                <div className="absolute inset-0 z-10 pointer-events-none">
                  <div className="absolute inset-0 bg-white/35 dark:bg-black/25 backdrop-blur-[1px]" />
                </div>
              )}
              {isMobile ? (
                // Mobile: Tabs only, no arrows (swipe gestures handle navigation)
                <SlideNavigation 
                  slides={slides} 
                  currentSlide={currentSlide} 
                  onSlideChange={setCurrentSlide}
                  isMobile={isMobile}
                  disabled={isEditingScores}
                />
              ) : (
                // Desktop: Tabs with arrows
                <div className="flex items-center justify-between px-2">
                  <button
                    onClick={() => {
                      if (isEditingScores) return;
                      setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
                    }}
                    disabled={isEditingScores}
                    className={`p-1.5 rounded-lg text-surface-500 hover:bg-surface-200/50 dark:hover:bg-surface-700/50 flex-shrink-0 transition-colors ${isEditingScores ? 'opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent' : ''}`}
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  
                  <SlideNavigation 
                    slides={slides} 
                    currentSlide={currentSlide} 
                    onSlideChange={setCurrentSlide}
                    isMobile={isMobile}
                    disabled={isEditingScores}
                  />
                  
                  <button
                    onClick={() => {
                      if (isEditingScores) return;
                      setCurrentSlide((prev) => (prev + 1) % slides.length);
                    }}
                    disabled={isEditingScores}
                    className={`p-1.5 rounded-lg text-surface-500 hover:bg-surface-200/50 dark:hover:bg-surface-700/50 flex-shrink-0 transition-colors ${isEditingScores ? 'opacity-50 cursor-not-allowed hover:bg-transparent dark:hover:bg-transparent' : ''}`}
                    aria-label="Next slide"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
            
            <div 
              ref={contentScrollRef}
              className={`flex-1 overflow-x-hidden p-4 ${isEditingScores ? 'overflow-y-hidden' : 'overflow-y-auto'}`}
              style={isEditingScores ? { touchAction: 'none' } : undefined}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Suspense fallback={<div className="flex items-center justify-center h-32 text-surface-500">Loading...</div>}>
                    {currentSlide === 0 && (
                      <OverviewSlide
                        dish={dish}
                        ingredients={ingredients}
                        unavailableIngredients={unavailableIngredients}
                        missingIngredients={missingIngredients}
                        missingPrices={missingPrices}
                        priorities={priorities}
                        rankingMeta={rankingMeta}
                        isOptimized={isOptimized}
                        onApplyOverridesPatch={handleApplyOverridesPatch}
                        onResetAll={handleResetAll}
                        onEditingChange={setIsEditingScores}
                        isDark={isDark}
                        priceUnit={priceUnit}
                      />
                    )}
                    {currentSlide === 1 && (
                      <IndexMapSlide 
                        dish={dish} 
                        ingredientIndex={ingredientIndex} 
                        isMobile={isMobile} 
                        priceUnit={priceUnit} 
                        defaultSelectedZone={userSelectedZone} 
                      />
                    )}
                    {currentSlide === 2 && (
                      <TimeSlide 
                        dish={dish} 
                        isOptimized={isOptimized} 
                      />
                    )}
                    {currentSlide === 3 && (
                      <HealthSlide 
                        dish={dish} 
                        ingredients={ingredients} 
                        ingredientIndex={ingredientIndex} 
                      />
                    )}
                    {currentSlide === 4 && (
                      <EthicsSlide 
                        dish={dish} 
                        ingredients={ingredients} 
                        ingredientIndex={ingredientIndex} 
                      />
                    )}
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </div>
            
            <div className={`flex justify-center gap-2 py-2 border-t border-surface-200/50 dark:border-surface-700/50 flex-shrink-0 ${isEditingScores ? 'opacity-50' : ''}`}>
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    if (isEditingScores) return;
                    setCurrentSlide(idx);
                  }}
                  disabled={isEditingScores}
                  className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? 'bg-food-500 w-5' : 'bg-surface-400 dark:bg-surface-600 w-1.5'}`}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
