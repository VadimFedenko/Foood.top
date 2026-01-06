import { useEffect, useRef } from 'react';
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
  getEthicsColor,
  getHealthColor,
  getPriceUnitLabel,
  getScoreColor,
} from './dishCardUtils';

/**
 * Main Dish Card Component
 * Compact view with expandable details
 */
export default function DishCard({ dish, isExpanded, onToggle, onOverrideChange, overrides = {}, ingredientIndex, priceUnit = 'serving', priorities = {} }) {
  const cardRef = useRef(null);
  const scoreColors = getScoreColor(dish.score);
  const reduceMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const lite = isMobile || reduceMotion;

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

  // Calculate effective values (with overrides)
  const effectiveTaste = overrides.taste ?? dish.taste;
  const effectiveTime = overrides.time ?? dish.time;
  
  // Get the price for the selected unit
  const effectivePrice = dish.prices?.[priceUnit] ?? dish.cost;
  const kcalPer100g = (dish?.weight ?? 0) > 0 && (dish?.calories ?? 0) > 0
    ? ((dish.calories / dish.weight) * 100)
    : 0;

  const handleResetOverrides = () => {
    onOverrideChange(dish.name, {});
  };

  const hasAnyOverride = Object.keys(overrides).length > 0;
  const priceUnitLabel = getPriceUnitLabel(priceUnit);
  const missingIngredients = dish.missingIngredients || [];
  const missingPrices = dish.missingPrices || [];
  const unavailableIngredients = dish.unavailableIngredients || [];

  // Get original ingredients from dish data
  const ingredients = dish.originalDish?.ingredients || [];

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const updateOverrides = (patch) => onOverrideChange(dish.name, { ...overrides, ...patch });

  // Handlers for metric adjustments
  const handleTasteChange = (delta) => {
    updateOverrides({ taste: clamp(effectiveTaste + delta, 0, 10) });
  };

  const handleTimeChange = (delta) => {
    updateOverrides({ time: Math.max(1, effectiveTime + delta) });
  };

  const handlePriceChange = (delta) => {
    // Always modify the base price (per serving)
    const basePrice = dish.prices?.serving ?? dish.baseCost ?? dish.cost;
    updateOverrides({ price: Math.max(0.1, basePrice + delta) });
  };

  return (
    <motion.div
      ref={cardRef}
      layout={!lite}
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
        className="w-full p-4 flex items-center gap-3 text-left cursor-pointer"
      >
        {/* Score Badge */}
        <motion.div
          layout={lite ? false : 'position'}
          className={`
            flex-shrink-0 w-12 h-12 rounded-xl
            flex items-center justify-center
            ${scoreColors.bg} ${scoreColors.glow}
          `}
        >
          <span className="text-lg font-display font-bold text-white">
            {dish.score}
          </span>
        </motion.div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Name and indicators row */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-surface-800 dark:text-surface-100 truncate">
              {dish.name}
            </h3>
            {hasAnyOverride && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
                Modified
              </span>
            )}
          </div>
          
          {/* Metric indicators row */}
          <div className="flex items-center mt-1.5 gap-6 flex-wrap">
            <MetricIndicator
              icon={Utensils}
              value={effectiveTaste}
              format={(v) => v.toFixed(1)}
              isEditing={isExpanded}
              onIncrement={() => handleTasteChange(0.1)}
              onDecrement={() => handleTasteChange(-0.1)}
              isOverridden={overrides.taste !== undefined}
              isAtMin={effectiveTaste <= 0}
              isAtMax={effectiveTaste >= 10}
            />
            <MetricIndicator
              icon={Heart}
              value={dish.health}
              format={(v) => v.toFixed(1)}
            />
            <MetricIndicator
              icon={DollarSign}
              value={effectivePrice}
              format={(v) => `$${v.toFixed(2)}`}
              isEditing={isExpanded && priceUnit === 'serving'}
              onIncrement={() => handlePriceChange(0.5)}
              onDecrement={() => handlePriceChange(-0.5)}
              isOverridden={overrides.price !== undefined}
              isAtMin={effectivePrice <= 0.1}
            />
            <MetricIndicator
              icon={Clock}
              value={effectiveTime}
              format={formatTime}
              isEditing={isExpanded}
              onIncrement={() => handleTimeChange(5)}
              onDecrement={() => handleTimeChange(-5)}
              isOverridden={overrides.time !== undefined}
              isAtMin={effectiveTime <= 1}
            />
            <MetricIndicator
              icon={Flame}
              value={kcalPer100g}
              format={(v) => `${v.toFixed(0)}kcal/100g`}
            />
            <MetricIndicator
              icon={Leaf}
              value={dish.ethics}
              format={(v) => v.toFixed(1)}
            />
          </div>
        </div>

        {/* Reset button (when expanded and has overrides) */}
        {isExpanded && hasAnyOverride && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleResetOverrides();
            }}
            className="flex-shrink-0 p-2 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors"
            title="Reset modifications"
          >
            <RotateCcw size={16} />
          </button>
        )}

        {/* Expand icon */}
        <ChevronDown 
          size={20} 
          className={`
            flex-shrink-0 text-surface-400 transition-transform
            ${isExpanded ? 'rotate-180' : ''}
          `}
        />
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
                liteMotion={true}
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

                {/* Info Slider (Overview / Index Map / Health / Ethics) */}
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
                  liteMotion={false}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
