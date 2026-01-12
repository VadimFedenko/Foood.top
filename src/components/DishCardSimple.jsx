import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  DollarSign, 
  Utensils, 
  Heart,
  Flame,
  Leaf,
  RotateCcw,
} from 'lucide-react';
import {
  formatTime,
  getScoreColor,
} from './dishCardUtils';
import { useIsMobile } from '../lib/useIsMobile';

/**
 * Compact metric display for card header
 */
function MetricBadge({ icon: Icon, value, format, isOverridden = false, compact = false }) {
  const iconColor = isOverridden ? 'text-amber-500 dark:text-amber-400' : 'text-surface-600 dark:text-surface-400';
  const textColor = isOverridden ? 'text-amber-600 dark:text-amber-300' : 'text-surface-500 dark:text-surface-400';
  
  if (compact) {
    return (
      <div className="flex items-center gap-0.5 text-[10px]">
        <Icon size={10} className={iconColor} />
        <span className={`font-mono ${textColor} leading-none`}>
          {format(value)}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1 text-xs">
      <Icon size={12} className={iconColor} />
      <span className={`font-mono ${textColor}`}>
        {format(value)}
      </span>
    </div>
  );
}

/**
 * Simplified Dish Card Component
 * Click to open modal - no expansion logic
 */
export default function DishCardSimple({ 
  dish, 
  onClick, 
  onResetOverrides,
  priceUnit = 'serving',
}) {
  const scoreColors = getScoreColor(dish.score);
  const isMobile = useIsMobile();
  
  const hasAnyOverride = useMemo(() => {
    const o = dish?.hasOverrides;
    if (!o || typeof o !== 'object') return false;
    return Object.values(o).some(Boolean);
  }, [dish]);

  const values = useMemo(() => {
    const calories = dish?.calories ?? 0;
    const weight = dish?.weight ?? 0;
    const calPerG = weight > 0 && calories > 0
      ? ((calories / weight) * 1000 / 100)
      : 0;
    return {
      taste: dish?.taste ?? 0,
      health: dish?.health ?? 0,
      ethics: dish?.ethics ?? 0,
      time: dish?.time ?? 0,
      price: dish?.prices?.[priceUnit] ?? dish?.cost ?? 0,
      calPerG,
    };
  }, [dish, priceUnit]);
  
  const handleResetClick = (e) => {
    e.stopPropagation();
    onResetOverrides?.(dish.id);
  };
  
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`
        bg-white/70 dark:bg-surface-800/60 rounded-xl border transition-all
        border-surface-300/50 dark:border-surface-700/50 
        hover:border-food-500/30 hover:shadow-md
        cursor-pointer shadow-sm dark:shadow-none
      `}
    >
      <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
        {/* Score Badge */}
        <div
          className={`
            flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl
            flex items-center justify-center
            ${scoreColors.bg} ${scoreColors.glow}
          `}
        >
          <span className="text-base sm:text-lg font-display font-bold text-white">
            {dish.score}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-nowrap mb-1.5">
            <h3 className="font-display font-semibold text-surface-800 dark:text-surface-100 truncate text-sm sm:text-base flex-1 min-w-0">
              {dish.name}
            </h3>
            
            {/* Reset button */}
            {hasAnyOverride && (
              <button
                onClick={handleResetClick}
                className="flex-shrink-0 p-1 rounded-lg text-amber-500 hover:bg-amber-500/10 transition-colors"
                title="Reset modifications"
              >
                <RotateCcw size={isMobile ? 12 : 14} />
              </button>
            )}
            
            {/* Modified indicator */}
            {hasAnyOverride && !isMobile && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium flex-shrink-0">
                Modified
              </span>
            )}
          </div>
          
          {/* Metric indicators */}
          <div className="grid grid-cols-3 mobile:flex gap-x-3 gap-y-1 mobile:gap-4">
            <MetricBadge
              icon={Utensils}
              value={values.taste}
              format={(v) => v.toFixed(1)}
              isOverridden={!!dish?.hasOverrides?.taste}
              compact={isMobile}
            />
            <MetricBadge
              icon={Heart}
              value={values.health}
              format={(v) => v.toFixed(1)}
              isOverridden={!!dish?.hasOverrides?.health}
              compact={isMobile}
            />
            <MetricBadge
              icon={DollarSign}
              value={values.price}
              format={(v) => v.toFixed(2)}
              isOverridden={!!dish?.hasOverrides?.price}
              compact={isMobile}
            />
            <MetricBadge
              icon={Clock}
              value={values.time}
              format={(v) => formatTime(Math.round(v))}
              isOverridden={!!dish?.hasOverrides?.time}
              compact={isMobile}
            />
            <MetricBadge
              icon={Flame}
              value={values.calPerG}
              format={(v) => `${Math.round(v)}cal/g`}
              isOverridden={!!dish?.hasOverrides?.calories}
              compact={isMobile}
            />
            <MetricBadge
              icon={Leaf}
              value={values.ethics}
              format={(v) => v.toFixed(1)}
              isOverridden={!!dish?.hasOverrides?.ethics}
              compact={isMobile}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

