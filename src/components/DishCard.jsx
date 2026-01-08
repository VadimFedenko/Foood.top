import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Clock, 
  DollarSign, 
  Utensils, 
  ChevronDown,
  Heart,
  RotateCcw,
  Flame,
  Leaf,
} from 'lucide-react';
import InfoSlider from './dishCard/InfoSlider';
import MetricIndicator from './dishCard/MetricIndicator';
import { useIsMobile } from '../lib/useIsMobile';
import {
  formatTime,
  getScoreColor,
} from './dishCardUtils';

/**
 * Hook to check if window width is less than a given breakpoint
 */
function useMediaQuery(maxWidth) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(`(max-width: ${maxWidth}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mq = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const onChange = () => setMatches(mq.matches);

    if (mq.addEventListener) {
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    }

    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, [maxWidth]);

  return matches;
}

function useIsNarrow() {
  return useMediaQuery(339);
}

function useIsVeryNarrow() {
  return useMediaQuery(379);
}

function useIsModerateNarrow() {
  return useMediaQuery(419);
}

/**
 * Main Dish Card Component
 * Compact view with expandable details
 */
export default function DishCard({ dish, isExpanded, onToggle, onOverrideChange, overrides = {}, ingredientIndex, priceUnit = 'serving', priorities = {}, isOptimized = false, analysisVariants = null }) {
  const cardRef = useRef(null);
  const scoreColors = getScoreColor(dish.score);
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const isNarrow = useIsNarrow();
  const isVeryNarrow = useIsVeryNarrow();
  const isModerateNarrow = useIsModerateNarrow();
  const lite = isMobile || reduceMotion;

  const [draftOverrides, setDraftOverrides] = useState(overrides);
  const draftRef = useRef(draftOverrides);
  const commitTimerRef = useRef(null);
  const localEditingRef = useRef(false);

  useEffect(() => { draftRef.current = draftOverrides; }, [draftOverrides]);

  // Safety: never leave debounced commit timers running after unmount.
  useEffect(() => {
    return () => {
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Sync external overrides when not actively editing this card
    if (!localEditingRef.current) {
      setDraftOverrides(overrides);
    }
  }, [overrides]);

  useEffect(() => {
    if (!isExpanded) {
      localEditingRef.current = false;
      if (commitTimerRef.current) {
        clearTimeout(commitTimerRef.current);
        commitTimerRef.current = null;
      }
      setDraftOverrides(overrides);
    }
  }, [isExpanded, overrides]);

  // Auto-scroll to top of card when expanded
  useEffect(() => {
    if (isExpanded && cardRef.current) {
      if (lite) {
        cardRef.current?.scrollIntoView({
          behavior: 'auto',
          block: 'start',
        });
        return;
      }

      // Wait for closing animation of previous card (250ms) + layout recalculation
      // Use a delay that accounts for both the animation and layout updates
      const timeoutId = setTimeout(() => {
        cardRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 350); // Delay to allow previous card to close (250ms) + buffer for layout recalculation
      
      return () => clearTimeout(timeoutId);
    }
  }, [isExpanded, lite]);

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const sanitizeOverrides = (o) => {
    const next = { ...(o || {}) };
    const eps = 1e-6;

    // If multiplier exists, drop legacy absolute
    if (next.tasteMul !== undefined) delete next.taste;
    if (next.priceMul !== undefined) delete next.price;
    if (next.timeMul !== undefined) delete next.time;
    if (next.healthMul !== undefined) delete next.health;
    if (next.ethicsMul !== undefined) delete next.ethics;
    if (next.caloriesMul !== undefined) delete next.calories;

    // Drop near-default multipliers
    for (const k of ['tasteMul', 'priceMul', 'timeMul', 'healthMul', 'ethicsMul', 'caloriesMul']) {
      if (Number.isFinite(next[k]) && Math.abs(next[k] - 1) < eps) delete next[k];
    }

    return next;
  };

  const scheduleCommit = (nextOverrides) => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      localEditingRef.current = false;
      onOverrideChange(dish.name, sanitizeOverrides(nextOverrides));
    }, 250);
  };

  const commitNow = () => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    localEditingRef.current = false;
    onOverrideChange(dish.name, sanitizeOverrides(draftRef.current));
  };

  const updateDraft = (patch) => {
    localEditingRef.current = true;
    setDraftOverrides((prev) => {
      const next = sanitizeOverrides({ ...(prev || {}), ...(patch || {}) });
      // Keep ref in sync immediately (important for quick tap -> pointerup -> commitNow)
      draftRef.current = next;
      scheduleCommit(next);
      return next;
    });
  };

  // Baselines (pre-override) computed by engine
  const baseTaste = dish.baseTaste ?? dish.taste ?? 5;
  const basePriceServing = dish.basePriceServing ?? dish.baseCost ?? dish.prices?.serving ?? 0;
  const baseTimeCurrentMode = isOptimized ? (dish.baseTimeOptimized ?? dish.time ?? 30) : (dish.baseTimeNormal ?? dish.time ?? 30);
  const baseHealth = dish.baseHealth ?? dish.health ?? 5;
  const baseEthics = dish.baseEthics ?? dish.ethics ?? 5;
  const baseCalories = dish.baseCalories ?? dish.calories ?? 0;

  // Effective values (apply draft overrides in-card without forcing global re-analysis each tick)
  const effectiveTaste = (() => {
    if (Number.isFinite(draftOverrides?.taste)) return clamp(draftOverrides.taste, 0, 10);
    if (Number.isFinite(draftOverrides?.tasteMul)) return clamp(baseTaste * draftOverrides.tasteMul, 0, 10);
    return dish.taste;
  })();

  const effectiveTime = (() => {
    if (Number.isFinite(draftOverrides?.time)) return Math.max(1, draftOverrides.time);
    if (Number.isFinite(draftOverrides?.timeMul)) {
      const base = isOptimized ? (dish.baseTimeOptimized ?? dish.time ?? 30) : (dish.baseTimeNormal ?? dish.time ?? 30);
      return Math.max(1, base * draftOverrides.timeMul);
    }
    return dish.time;
  })();

  const effectiveBasePriceServing = (() => {
    if (Number.isFinite(draftOverrides?.price)) return Math.max(0.01, draftOverrides.price);
    if (Number.isFinite(draftOverrides?.priceMul)) return Math.max(0.01, basePriceServing * draftOverrides.priceMul);
    return dish.prices?.serving ?? dish.baseCost ?? dish.cost ?? 0;
  })();

  const convertPrice = (servingCost) => {
    const weight = dish?.weight ?? 0;
    const calories = dish?.calories ?? 0;
    if (!Number.isFinite(servingCost) || servingCost <= 0) return 0;

    if (priceUnit === 'per1kg') {
      if (!Number.isFinite(weight) || weight <= 0) return servingCost;
      return (servingCost * 1000) / weight;
    }
    if (priceUnit === 'per1000kcal') {
      if (!Number.isFinite(calories) || calories <= 0) return servingCost;
      return servingCost / (calories / 1000);
    }
    return servingCost;
  };

  const effectivePrice = convertPrice(effectiveBasePriceServing);

  const effectiveHealth = (() => {
    if (Number.isFinite(draftOverrides?.health)) return clamp(draftOverrides.health, 0, 10);
    if (Number.isFinite(draftOverrides?.healthMul)) return clamp(baseHealth * draftOverrides.healthMul, 0, 10);
    return dish.health;
  })();

  const effectiveEthics = (() => {
    if (Number.isFinite(draftOverrides?.ethics)) return clamp(draftOverrides.ethics, 0, 10);
    if (Number.isFinite(draftOverrides?.ethicsMul)) return clamp(baseEthics * draftOverrides.ethicsMul, 0, 10);
    return dish.ethics;
  })();

  const effectiveCalories = (() => {
    if (Number.isFinite(draftOverrides?.calories)) return Math.max(0, Math.round(draftOverrides.calories));
    if (Number.isFinite(draftOverrides?.caloriesMul)) return Math.max(0, Math.round(baseCalories * draftOverrides.caloriesMul));
    return dish.calories ?? 0;
  })();

  const calPerG = (dish?.weight ?? 0) > 0 && (dish?.calories ?? 0) > 0
    ? ((effectiveCalories / dish.weight) * 1000 / 100) // Convert kcal to cal and divide by 100 to get per gram
    : 0;

  const handleResetOverrides = () => {
    onOverrideChange(dish.name, {});
  };

  const hasAnyOverride = Object.keys(draftOverrides || {}).length > 0;
  const missingIngredients = dish.missingIngredients || [];
  const missingPrices = dish.missingPrices || [];
  const unavailableIngredients = dish.unavailableIngredients || [];

  // Get original ingredients from dish data
  const ingredients = dish.originalDish?.ingredients || [];

  const stepPct = 0.01;

  const bumpMul = (currentMul, pctDelta) => {
    const m = Number.isFinite(currentMul) ? currentMul : 1;
    return m * (1 + pctDelta);
  };

  const handleTasteChangePct = (pctDelta) => {
    const current = draftRef.current || {};
    if (Number.isFinite(baseTaste) && baseTaste > 0) {
      const currentMul = Number.isFinite(current.tasteMul)
        ? current.tasteMul
        : (Number.isFinite(current.taste) ? (current.taste / baseTaste) : 1);
      updateDraft({ tasteMul: bumpMul(currentMul, pctDelta) });
      return;
    }
    const effective = Number.isFinite(current.taste) ? current.taste : (Number.isFinite(current.tasteMul) ? baseTaste * current.tasteMul : dish.taste);
    updateDraft({ taste: clamp(effective * (1 + pctDelta), 0, 10) });
  };

  const handleTimeChangePct = (pctDelta) => {
    const current = draftRef.current || {};
    if (Number.isFinite(baseTimeCurrentMode) && baseTimeCurrentMode > 0) {
      const currentMul = Number.isFinite(current.timeMul)
        ? current.timeMul
        : (Number.isFinite(current.time) ? (current.time / baseTimeCurrentMode) : 1);
      updateDraft({ timeMul: bumpMul(currentMul, pctDelta) });
      return;
    }
    const effective = Number.isFinite(current.time) ? current.time : (Number.isFinite(current.timeMul) ? baseTimeCurrentMode * current.timeMul : dish.time);
    updateDraft({ time: Math.max(1, effective * (1 + pctDelta)) });
  };

  const handlePriceChangePct = (pctDelta) => {
    const current = draftRef.current || {};
    if (Number.isFinite(basePriceServing) && basePriceServing > 0) {
      const currentMul = Number.isFinite(current.priceMul)
        ? current.priceMul
        : (Number.isFinite(current.price) ? (current.price / basePriceServing) : 1);
      updateDraft({ priceMul: bumpMul(currentMul, pctDelta) });
      return;
    }
    const effective = Number.isFinite(current.price) ? current.price : (Number.isFinite(current.priceMul) ? basePriceServing * current.priceMul : basePriceServing);
    updateDraft({ price: Math.max(0.01, effective * (1 + pctDelta)) });
  };

  const handleHealthChangePct = (pctDelta) => {
    const current = draftRef.current || {};
    if (Number.isFinite(baseHealth) && baseHealth > 0) {
      const currentMul = Number.isFinite(current.healthMul)
        ? current.healthMul
        : (Number.isFinite(current.health) ? (current.health / baseHealth) : 1);
      updateDraft({ healthMul: bumpMul(currentMul, pctDelta) });
      return;
    }
    const effective = Number.isFinite(current.health) ? current.health : (Number.isFinite(current.healthMul) ? baseHealth * current.healthMul : dish.health);
    updateDraft({ health: clamp(effective * (1 + pctDelta), 0, 10) });
  };

  const handleEthicsChangePct = (pctDelta) => {
    const current = draftRef.current || {};
    if (Number.isFinite(baseEthics) && baseEthics > 0) {
      const currentMul = Number.isFinite(current.ethicsMul)
        ? current.ethicsMul
        : (Number.isFinite(current.ethics) ? (current.ethics / baseEthics) : 1);
      updateDraft({ ethicsMul: bumpMul(currentMul, pctDelta) });
      return;
    }
    const effective = Number.isFinite(current.ethics) ? current.ethics : (Number.isFinite(current.ethicsMul) ? baseEthics * current.ethicsMul : dish.ethics);
    updateDraft({ ethics: clamp(effective * (1 + pctDelta), 0, 10) });
  };

  const handleCaloriesChangePct = (pctDelta) => {
    const current = draftRef.current || {};
    if (Number.isFinite(baseCalories) && baseCalories > 0) {
      const currentMul = Number.isFinite(current.caloriesMul)
        ? current.caloriesMul
        : (Number.isFinite(current.calories) ? (current.calories / baseCalories) : 1);
      updateDraft({ caloriesMul: bumpMul(currentMul, pctDelta) });
      return;
    }
    const effective = Number.isFinite(current.calories) ? current.calories : (Number.isFinite(current.caloriesMul) ? baseCalories * current.caloriesMul : dish.calories ?? 0);
    updateDraft({ calories: Math.max(0, effective * (1 + pctDelta)) });
  };

  return (
    <motion.div
      ref={cardRef}
      layout={false}
      className={`
        bg-white/70 dark:bg-surface-800/60 rounded-xl border transition-colors shadow-sm dark:shadow-none
        ${isExpanded 
          ? 'border-food-500/30' 
          : 'border-surface-300/50 dark:border-surface-700/50 hover:border-surface-400 dark:hover:border-surface-600'
        }
      `}
    >
      {/* Header (Always visible) */}
      <div
        onClick={onToggle}
        className="w-full p-3 sm:p-4 flex items-center gap-2 sm:gap-3 text-left cursor-pointer"
      >
        {/* Score Badge - shown on desktop or when collapsed on mobile */}
        <motion.div
          layout={lite ? false : 'position'}
          className={`
            ${isExpanded ? 'hidden sm:flex' : 'flex'} flex-shrink-0 ${isVeryNarrow ? 'w-8 h-8' : 'w-10 h-10'} sm:w-12 sm:h-12 rounded-xl
            items-center justify-center
            ${scoreColors.bg} ${scoreColors.glow}
          `}
        >
          <span className={`${isVeryNarrow ? 'text-sm' : 'text-base'} sm:text-lg font-display font-bold text-white`}>
            {dish.score}
          </span>
        </motion.div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Name, Score badge (mobile only when expanded), Reset button, Modified indicator, and expand arrow - all on one line */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap">
            {/* Score Badge - shown only on mobile (<640px) when expanded, inline with name */}
            {isExpanded && (
              <motion.div
                layout={lite ? false : 'position'}
                className={`
                  flex sm:hidden flex-shrink-0 w-7 h-7 rounded-lg
                  items-center justify-center
                  ${scoreColors.bg} ${scoreColors.glow}
                `}
              >
                <span className="text-xs font-display font-bold text-white">
                  {dish.score}
                </span>
              </motion.div>
            )}
            <h3 className="font-display font-semibold text-surface-800 dark:text-surface-100 truncate text-sm sm:text-base flex-1 min-w-0">
              {dish.name}
            </h3>
            {/* Reset button - always shown when has overrides, positioned before Modified text */}
            {hasAnyOverride && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetOverrides();
                }}
                className="flex-shrink-0 p-1 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors"
                title="Reset modifications"
              >
                <RotateCcw size={isVeryNarrow ? 12 : isModerateNarrow ? 14 : 16} />
              </button>
            )}
            {/* Modified indicator - text on wider screens, hidden on narrow screens */}
            {hasAnyOverride && !isModerateNarrow && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
                Modified
              </span>
            )}
            {/* Expand icon - moved here to be on same line */}
            <ChevronDown 
              size={isVeryNarrow ? 16 : 20} 
              className={`
                flex-shrink-0 text-surface-400 transition-transform
                ${isExpanded ? 'rotate-180' : ''}
              `}
            />
          </div>
          
          {/* Metric indicators - responsive grid */}
          {/* Mobile: 2 rows x 3 cols, Desktop: single row */}
          <div className={`
            mt-1.5 
            ${isExpanded 
              ? 'grid grid-cols-3 mobile:flex mobile:flex-wrap gap-x-3 gap-y-1.5 mobile:gap-4' 
              : 'grid grid-cols-3 mobile:flex gap-x-4 gap-y-1 mobile:gap-6'
            }
          `}>
            <MetricIndicator
              icon={Utensils}
              value={effectiveTaste}
              format={(v) => v.toFixed(1)}
              isEditing={isExpanded}
              onIncrement={() => handleTasteChangePct(stepPct)}
              onDecrement={() => handleTasteChangePct(-stepPct)}
              onEditEnd={commitNow}
              isOverridden={draftOverrides.taste !== undefined || draftOverrides.tasteMul !== undefined}
              isAtMin={effectiveTaste <= 0}
              isAtMax={effectiveTaste >= 10}
              compact={!isExpanded && isMobile}
            />
            <MetricIndicator
              icon={Heart}
              value={effectiveHealth}
              format={(v) => v.toFixed(1)}
              isEditing={isExpanded}
              onIncrement={() => handleHealthChangePct(stepPct)}
              onDecrement={() => handleHealthChangePct(-stepPct)}
              onEditEnd={commitNow}
              isOverridden={draftOverrides.health !== undefined || draftOverrides.healthMul !== undefined}
              isAtMin={effectiveHealth <= 0}
              isAtMax={effectiveHealth >= 10}
              compact={!isExpanded && isMobile}
            />
            <MetricIndicator
              icon={DollarSign}
              value={effectivePrice}
              format={(v) => v.toFixed(2)}
              isEditing={isExpanded}
              onIncrement={() => handlePriceChangePct(stepPct)}
              onDecrement={() => handlePriceChangePct(-stepPct)}
              onEditEnd={commitNow}
              isOverridden={draftOverrides.price !== undefined || draftOverrides.priceMul !== undefined}
              isAtMin={effectiveBasePriceServing <= 0.01}
              compact={!isExpanded && isMobile}
            />
            <MetricIndicator
              icon={Clock}
              value={effectiveTime}
              format={(v) => (isExpanded ? `${v.toFixed(1)}m` : formatTime(Math.round(v)))}
              isEditing={isExpanded}
              onIncrement={() => handleTimeChangePct(stepPct)}
              onDecrement={() => handleTimeChangePct(-stepPct)}
              onEditEnd={commitNow}
              isOverridden={draftOverrides.time !== undefined || draftOverrides.timeMul !== undefined}
              isAtMin={effectiveTime <= 1}
              compact={!isExpanded && isMobile}
            />
            <MetricIndicator
              icon={Flame}
              value={calPerG}
              format={(v) => isNarrow ? `${Math.round(v)}` : `${Math.round(v)}cal/g`}
              isEditing={isExpanded}
              onIncrement={() => handleCaloriesChangePct(stepPct)}
              onDecrement={() => handleCaloriesChangePct(-stepPct)}
              onEditEnd={commitNow}
              isOverridden={draftOverrides.calories !== undefined || draftOverrides.caloriesMul !== undefined}
              isAtMin={effectiveCalories <= 0}
              compact={!isExpanded && isMobile}
            />
            <MetricIndicator
              icon={Leaf}
              value={effectiveEthics}
              format={(v) => v.toFixed(1)}
              isEditing={isExpanded}
              onIncrement={() => handleEthicsChangePct(stepPct)}
              onDecrement={() => handleEthicsChangePct(-stepPct)}
              onEditEnd={commitNow}
              isOverridden={draftOverrides.ethics !== undefined || draftOverrides.ethicsMul !== undefined}
              isAtMin={effectiveEthics <= 0}
              isAtMax={effectiveEthics >= 10}
              compact={!isExpanded && isMobile}
            />
          </div>
        </div>

      </div>

      {/* Expanded Details */}
      {lite ? (
        isExpanded ? (
          <div className="overflow-hidden">
            <div className="px-4 pb-4">
              {/* Divider */}
              <div className="h-px bg-surface-300 dark:bg-surface-700 mb-4" />

              <InfoSlider 
                dish={dish}
                dishName={dish.name}
                dishHealth={dish.health}
                dishEthics={dish.ethics}
                ingredients={ingredients}
                ingredientIndex={ingredientIndex}
                priorities={priorities}
                unavailableIngredients={unavailableIngredients}
                missingIngredients={missingIngredients}
                missingPrices={missingPrices}
                isOptimized={isOptimized}
                liteMotion={true}
                analysisVariants={analysisVariants}
                priceUnit={priceUnit}
              />
            </div>
          </div>
        ) : null
      ) : (
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                {/* Divider */}
                <div className="h-px bg-surface-300 dark:bg-surface-700 mb-4" />

                {/* Info Slider (Overview / Index Map / Time / Health / Ethics) */}
                <InfoSlider 
                  dish={dish}
                  dishName={dish.name}
                  dishHealth={dish.health}
                  dishEthics={dish.ethics}
                  ingredients={ingredients}
                  ingredientIndex={ingredientIndex}
                  priorities={priorities}
                  unavailableIngredients={unavailableIngredients}
                  missingIngredients={missingIngredients}
                  missingPrices={missingPrices}
                  isOptimized={isOptimized}
                  liteMotion={false}
                  analysisVariants={analysisVariants}
                  priceUnit={priceUnit}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
