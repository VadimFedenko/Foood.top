import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Frown,
  Heart,
  Info,
  Leaf,
  Map,
  Skull,
  AlertTriangle,
  FileText,
  ArrowDown,
  Zap,
  Timer,
} from 'lucide-react';
import { ECONOMIC_ZONES, calculateDishCost, getCookingCoef, normalizeIngredientName, getPassiveTimePenalty } from '../../lib/RankingEngine';
import EconomicZonesSvgMap from '../EconomicZonesSvgMap';
import { getCookingEffect, getCookingLabel, getEthicsColor, getHealthColor, getPriceColor } from '../dishCardUtils';

/**
 * Get ethics icon based on index (0-10)
 */
function getEthicsIcon(index) {
  if (index < 2) return Skull; // Red - skull
  if (index < 4) return Frown; // Orange - sad face
  return Leaf; // Green/Lime/Amber - leaf
}

/**
 * Score breakdown bar
 */
function ScoreBar({ label, value, maxValue = 10, color }) {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-surface-500 dark:text-surface-400 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-mono text-surface-600 dark:text-surface-300 w-8 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

/**
 * Ingredients list in two columns
 */
function IngredientsList({ ingredients }) {
  if (!ingredients || ingredients.length === 0) return null;
  
  // Split into two columns
  const midpoint = Math.ceil(ingredients.length / 2);
  const leftColumn = ingredients.slice(0, midpoint);
  const rightColumn = ingredients.slice(midpoint);
  
  return (
    <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-3">
      <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-2">
        Ingredients
      </h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="space-y-1">
          {leftColumn.map((ing, idx) => (
            <div key={idx} className="text-xs text-surface-600 dark:text-surface-300 flex justify-between">
              <span className="truncate pr-2">{ing.name}</span>
              <span className="text-surface-500 font-mono">{ing.g}g</span>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          {rightColumn.map((ing, idx) => (
            <div key={idx} className="text-xs text-surface-600 dark:text-surface-300 flex justify-between">
              <span className="truncate pr-2">{ing.name}</span>
              <span className="text-surface-500 font-mono">{ing.g}g</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Overview Slide - Main information about the dish
 */
function OverviewSlide({ 
  dish, 
  priorities,
  unavailableIngredients,
  missingIngredients,
  missingPrices,
}) {
  const hasUnavailableIngredients = unavailableIngredients && unavailableIngredients.length > 0;
  const hasDataWarnings = (missingIngredients && missingIngredients.length > 0) || (missingPrices && missingPrices.length > 0);
  const ingredients = dish?.originalDish?.ingredients || [];

  return (
    <div className="space-y-4">
      {/* Unavailable ingredients notification */}
      {hasUnavailableIngredients && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-300 mb-2">
            <Info size={14} />
            <span className="text-xs font-semibold">Dish cannot be prepared in your region</span>
          </div>
          <div className="space-y-1 text-xs text-surface-300">
            {unavailableIngredients.map((ing, idx) => (
              <div key={idx}>
                <span className="font-semibold text-blue-300">Unavailable ingredient:</span>{' '}
                <span className="font-mono">{ing.name} ({ing.grams} g)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data warnings */}
      {hasDataWarnings && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-300 mb-2">
            <AlertTriangle size={14} />
            <span className="text-xs font-semibold">Data warnings</span>
          </div>
          <div className="space-y-1 text-xs text-surface-300">
            {missingIngredients && missingIngredients.length > 0 && (
              <div>
                <span className="font-semibold text-amber-300">Missing ingredients:</span>{' '}
                <span className="font-mono">{missingIngredients.join(', ')}</span>
              </div>
            )}
            {missingPrices && missingPrices.length > 0 && (
              <div>
                <span className="font-semibold text-amber-300">Missing prices:</span>{' '}
                <span className="font-mono">{missingPrices.join(', ')}</span>
              </div>
            )}
            <div className="text-[11px] text-surface-400">
              Rankings may be less accurate for this dish.
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      {dish?.description && (
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-3">
          <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
            {dish.description}
          </p>
        </div>
      )}

      {/* Ingredients List */}
      <IngredientsList ingredients={ingredients} />

      {/* Score Breakdown */}
      <div>
        <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-200 mb-3">
          Score Breakdown
        </h4>
        <div className="space-y-2 bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-3">
          {(() => {
            // Get normalized values from normalizedMetrics
            const normalized = dish?.normalizedMetrics || {};
            
            // Define all metrics with their labels and colors
            const allMetrics = [
              { key: 'taste', label: 'Taste', color: 'bg-food-500' },
              { key: 'health', label: 'Health', color: 'bg-red-500' },
              { key: 'cheapness', label: 'Budget', color: 'bg-emerald-400' },
              { key: 'speed', label: 'Speed', color: 'bg-cyan-500' },
              { key: 'lowCalorie', label: 'Low-Cal', color: 'bg-purple-500' },
              { key: 'ethics', label: 'Ethics', color: 'bg-lime-500' },
            ];
            
            // Filter to only show active metrics (with non-zero priority)
            const activeMetrics = allMetrics.filter(metric => {
              return priorities && priorities[metric.key] !== undefined && priorities[metric.key] !== 0;
            });
            
            return activeMetrics.map(metric => {
              // Get normalized value (0-10) from normalizedMetrics or fallback to raw value clamped to 0-10
              let normalizedValue = normalized[metric.key];
              
              // If normalized value is not available, fallback to raw value (clamped to 0-10)
              if (normalizedValue === undefined || normalizedValue === null) {
                if (metric.key === 'taste') {
                  normalizedValue = Math.min(10, Math.max(0, dish?.taste ?? 5));
                } else if (metric.key === 'health') {
                  normalizedValue = Math.min(10, Math.max(0, dish?.health ?? 5));
                } else if (metric.key === 'satiety') {
                  normalizedValue = 5;
                } else if (metric.key === 'ethics') {
                  normalizedValue = Math.min(10, Math.max(0, dish?.ethics ?? 5));
                } else {
                  normalizedValue = 5;
                }
              }
              
              // Ensure value is in 0-10 range
              normalizedValue = Math.min(10, Math.max(0, normalizedValue));
              
              return (
                <ScoreBar 
                  key={metric.key}
                  label={metric.label} 
                  value={normalizedValue} 
                  color={metric.color}
                />
              );
            });
          })()}
        </div>
      </div>

      {/* Optimized cooking comment */}
      {dish?.optimizedComment && (
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-3 border-l-2 border-food-500">
          <p className="text-xs text-surface-500 dark:text-surface-400 mb-1 font-medium">Optimization Tip</p>
          <p className="text-sm text-surface-600 dark:text-surface-300">
            {dish.optimizedComment}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Ethics Breakdown Slide
 */
function EthicsBreakdownSlide({ dishName, dishEthics, ingredients, ingredientIndex, liteMotion = false }) {
  if (!ingredients || ingredients.length === 0 || !ingredientIndex) {
    return (
      <div className="flex items-center justify-center h-48 text-surface-500 dark:text-surface-500 text-sm">
        No ingredient data available
      </div>
    );
  }

  // Get ethics info for each ingredient
  const ingredientsWithEthics = ingredients.map((ing) => {
    const ingData = ingredientIndex.get(normalizeIngredientName(ing.name));
    return {
      name: ing.name,
      grams: ing.g,
      ethicsIndex: ingData?.ethics_index ?? null,
      ethicsReason: ingData?.ethics_reason ?? 'No ethics data available for this ingredient.',
    };
  });

  const ethicsColors = getEthicsColor(dishEthics ?? 5);

  return (
    <div className="space-y-2">
      {/* Header: Dish Name + Ethics Breakdown + Total Ethics Score */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-surface-300/50 dark:border-surface-700/50">
        <div className="flex items-center gap-2">
          <Leaf size={14} className={ethicsColors.text} />
          <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">
            {dishName} Ethics Breakdown
          </span>
        </div>
        {dishEthics !== null && dishEthics !== undefined && (
          <div
            className={`
              px-2.5 py-1 rounded-lg text-xs font-bold text-white
              ${ethicsColors.badge}
            `}
          >
            Overall {dishEthics.toFixed(1)}/10
          </div>
        )}
      </div>

      {/* Ingredients list */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
        {ingredientsWithEthics.map((ing, idx) => {
          const colors = getEthicsColor(ing.ethicsIndex ?? 5);
          const Icon = getEthicsIcon(ing.ethicsIndex ?? 5);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: liteMotion ? 0 : (idx * 0.05) }}
              className={`
                rounded-lg p-2 border flex items-center gap-3
                ${colors.bg} ${colors.border}
              `}
            >
              {/* Left: ingredient name and grams - fixed width */}
              <div className="flex items-center gap-1.5 flex-shrink-0 w-32">
                <Icon size={12} className={colors.text} />
                <span className="font-semibold text-surface-800 dark:text-surface-100 text-xs whitespace-nowrap truncate">
                  {ing.grams}g of {ing.name}
                </span>
              </div>

              {/* Center: ethics reason */}
              <p className="text-xs text-surface-600 dark:text-surface-300 flex-1 truncate">
                {ing.ethicsReason}
              </p>

              {/* Right: ethics score */}
              {ing.ethicsIndex !== null && (
                <div
                  className={`
                    px-2.5 py-1 rounded-full text-sm font-bold text-white flex-shrink-0
                    ${colors.badge}
                  `}
                >
                  {ing.ethicsIndex}/10
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Health Breakdown Slide
 */
function HealthBreakdownSlide({ dishName, dishHealth, ingredients, ingredientIndex, liteMotion = false }) {
  if (!ingredients || ingredients.length === 0 || !ingredientIndex) {
    return (
      <div className="flex items-center justify-center h-48 text-surface-500 dark:text-surface-500 text-sm">
        No ingredient data available
      </div>
    );
  }

  // Get health info for each ingredient with cooking impact
  // Filter out ingredients where health_index is null (excluded from health calculation)
  const ingredientsWithHealth = ingredients
    .map((ing) => {
      const ingData = ingredientIndex.get(normalizeIngredientName(ing.name));
      const baseHealth = ingData?.health_index;
      // Skip ingredients with null health_index
      if (baseHealth === null || baseHealth === undefined) {
        return null;
      }
      const cookingCoef = getCookingCoef(ing.state);
      const adjustedHealth = Math.min(10, Math.max(0, baseHealth * cookingCoef));
      const cookingEffect = getCookingEffect(cookingCoef);

      return {
        name: ing.name,
        grams: ing.g,
        state: ing.state,
        baseHealth,
        adjustedHealth,
        cookingCoef,
        cookingLabel: getCookingLabel(ing.state),
        cookingEffect,
      };
    })
    .filter((ing) => ing !== null);

  // Sort by contribution (weight * health) for visual hierarchy
  const sortedIngredients = [...ingredientsWithHealth].sort((a, b) => (b.grams * b.adjustedHealth) - (a.grams * a.adjustedHealth));

  const healthColors = getHealthColor(dishHealth ?? 5);

  return (
    <div className="space-y-2">
      {/* Header: Dish Name + Health Breakdown + Total Health Score */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-surface-300/50 dark:border-surface-700/50">
        <div className="flex items-center gap-2">
          <Heart size={14} className={healthColors.text} />
          <span className="text-sm font-semibold text-surface-800 dark:text-surface-100">
            {dishName} Health Breakdown
          </span>
        </div>
        {dishHealth !== null && dishHealth !== undefined && (
          <div
            className={`
              px-2.5 py-1 rounded-lg text-xs font-bold text-white
              ${healthColors.badge}
            `}
          >
            Overall {dishHealth.toFixed(1)}/10
          </div>
        )}
      </div>

      {/* Health legend - compact on mobile */}
      <div className="flex items-center justify-center text-[9px] sm:text-[10px] text-surface-500 dark:text-surface-500 px-1 mb-2 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">Excellent</span>
            <span className="sm:hidden">9-10</span>
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-lime-500" />
            <span className="hidden sm:inline">Good</span>
            <span className="sm:hidden">7-8</span>
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500" />
            <span className="hidden sm:inline">Moderate</span>
            <span className="sm:hidden">5-6</span>
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500" />
            <span className="hidden sm:inline">Low</span>
            <span className="sm:hidden">3-4</span>
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500" />
            <span className="hidden sm:inline">Very Low</span>
            <span className="sm:hidden">0-2</span>
          </span>
        </div>
      </div>

      {/* Ingredients list */}
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
        {sortedIngredients.map((ing, idx) => {
          const colors = getHealthColor(ing.adjustedHealth);
          const healthPercent = (ing.adjustedHealth / 10) * 100;
          const hasImpact = ing.cookingCoef !== 1.0;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: liteMotion ? 0 : (idx * 0.04) }}
              className={`
                rounded-lg p-2.5 border
                ${colors.bg} ${colors.border}
              `}
            >
              {/* Top row: ingredient name, cooking method, scores */}
              <div className="flex items-center gap-2 mb-1.5">
                {/* Ingredient info */}
                <div className="flex items-center gap-1.5 flex-shrink-0 min-w-0 flex-1">
                  <Heart size={11} className={colors.text} />
                  <span className="font-semibold text-surface-800 dark:text-surface-100 text-xs truncate">
                    {ing.grams}g {ing.name}
                  </span>
                </div>

                {/* Cooking method pill */}
                <div
                  className={`
                    px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0
                    ${hasImpact ? 'bg-surface-200/60 dark:bg-surface-700/60 border border-surface-300/50 dark:border-surface-600/50' : 'bg-surface-200/40 dark:bg-surface-800/40'}
                    ${ing.cookingEffect.color}
                  `}
                >
                  {ing.cookingLabel}
                  {hasImpact && (
                    <span className="ml-1 opacity-75">
                      {ing.cookingEffect.icon}
                    </span>
                  )}
                </div>

                {/* Health score badge */}
                <div
                  className={`
                    px-2 py-0.5 rounded-full text-[11px] font-bold text-white flex-shrink-0
                    ${colors.badge}
                  `}
                >
                  {ing.adjustedHealth.toFixed(1)}
                </div>
              </div>

              {/* Health bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-surface-300/60 dark:bg-surface-800/60 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${colors.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${healthPercent}%` }}
                    transition={{
                      duration: liteMotion ? 0.2 : 0.5,
                      delay: liteMotion ? 0 : (idx * 0.04),
                      ease: 'easeOut',
                    }}
                  />
                </div>

                {/* Cooking impact indicator */}
                {hasImpact && (
                  <span className={`text-[9px] ${ing.cookingEffect.color} flex-shrink-0`}>
                    {ing.cookingCoef > 1 ? '+' : ''}
                    {((ing.cookingCoef - 1) * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer: cooking impact legend */}
      <div className="pt-2 border-t border-surface-300/30 dark:border-surface-700/30">
        <div className="flex items-center justify-center gap-2 sm:gap-4 text-[8px] sm:text-[9px] text-surface-500 dark:text-surface-500 flex-wrap">
          <span className="hidden sm:inline">Cooking impact:</span>
          <span className="flex items-center gap-0.5 sm:gap-1">
            <span className="text-emerald-500 dark:text-emerald-400">+</span> Enhances
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1">
            <span className="text-teal-500 dark:text-teal-400">≈</span> Preserves
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1">
            <span className="text-amber-500 dark:text-amber-400">−</span> Reduces
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Index Map Slide - Big Mac Index style price visualization with ingredient breakdown
 */
function IndexMapSlide({ dish, ingredientIndex, liteMotion = false }) {
  const [hoveredZone, setHoveredZone] = useState(null);

  // Calculate prices and breakdowns for all zones
  // Lazy computation: only calculate when component is mounted (i.e., slide is active)
  const { zonePrices, zoneBreakdowns } = useMemo(() => {
    if (!dish?.originalDish || !ingredientIndex) return { zonePrices: {}, zoneBreakdowns: {} };

    const prices = {};
    const breakdowns = {};
    for (const zoneId of Object.keys(ECONOMIC_ZONES)) {
      const result = calculateDishCost(dish.originalDish, zoneId, ingredientIndex);
      // Check if dish is available in this zone
      if (result.unavailableIngredients && result.unavailableIngredients.length > 0) {
        prices[zoneId] = null; // Unavailable
        breakdowns[zoneId] = null;
      } else {
        prices[zoneId] = result.totalCost;
        breakdowns[zoneId] = result.breakdown;
      }
    }
    return { zonePrices: prices, zoneBreakdowns: breakdowns };
  }, [dish?.originalDish, ingredientIndex]);

  // Calculate min/max for color scale (only available zones)
  const { minPrice, maxPrice, avgPrice } = useMemo(() => {
    const availablePrices = Object.entries(zonePrices)
      .filter(([, price]) => price !== null && price > 0)
      .map(([zoneId, price]) => ({ zoneId, price }));

    if (availablePrices.length === 0) {
      return { minPrice: 0, maxPrice: 0, avgPrice: 0 };
    }

    const prices = availablePrices.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

    return {
      minPrice: min,
      maxPrice: max,
      avgPrice: avg,
    };
  }, [zonePrices]);

  // Calculate average cost per ingredient across all zones (for comparison)
  const avgIngredientCosts = useMemo(() => {
    const avgCosts = {};
    const validZones = Object.entries(zoneBreakdowns).filter(([, b]) => b !== null);
    if (validZones.length === 0) return avgCosts;

    // Get ingredient names from first valid breakdown
    const firstBreakdown = validZones[0][1];
    for (const ing of firstBreakdown) {
      const costs = validZones
        .map(([, breakdown]) => breakdown.find((i) => i.name === ing.name)?.cost ?? 0)
        .filter((c) => c > 0);
      if (costs.length > 0) {
        avgCosts[ing.name] = costs.reduce((a, b) => a + b, 0) / costs.length;
      }
    }
    return avgCosts;
  }, [zoneBreakdowns]);

  const priceSpread = maxPrice > 0 && minPrice > 0 ? (((maxPrice - minPrice) / minPrice) * 100).toFixed(0) : 0;

  // Custom functions for price-based coloring
  const getZoneFill = (zoneId) => getPriceColor(zonePrices[zoneId], minPrice, maxPrice).fill;
  const getZoneOpacity = (zoneId, selectedZone, isHovered) => (isHovered ? 1 : 0.85);
  const getZoneStroke = (zoneId, isHovered) => (isHovered ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)');
  const getZoneStrokeWidth = (zoneId, isHovered) => (isHovered ? 1.5 : 0.5);

  const getTooltipContent = (zoneId, zoneData) => {
    const price = zonePrices[zoneId];
    const colorData = getPriceColor(price, minPrice, maxPrice);
    return {
      ...zoneData,
      price,
      priceColor: price === null ? 'text-surface-500' : colorData.text,
    };
  };

  // Get current zone data for breakdown panel
  const currentZone = hoveredZone ? ECONOMIC_ZONES[hoveredZone] : null;
  const currentPrice = hoveredZone ? zonePrices[hoveredZone] : null;
  const currentBreakdown = hoveredZone ? zoneBreakdowns[hoveredZone] : null;

  // Sort breakdown by cost (descending) and limit to show top contributors
  const sortedBreakdown = useMemo(() => {
    if (!currentBreakdown || currentBreakdown.length === 0) return [];
    return [...currentBreakdown].filter((item) => item.cost > 0).sort((a, b) => b.cost - a.cost);
  }, [currentBreakdown]);

  // Calculate totals for percentage
  const totalCost = useMemo(() => {
    return sortedBreakdown.reduce((sum, item) => sum + item.cost, 0);
  }, [sortedBreakdown]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 min-h-[220px]">
      {/* Left: Map */}
      <div className="w-full sm:flex-shrink-0 sm:w-[380px] relative">
        {/* Map container */}
        <div className="rounded-md overflow-hidden">
          <EconomicZonesSvgMap
            hoveredZone={hoveredZone}
            onHoveredZoneChange={setHoveredZone}
            zoom={1.25}
            className="w-full h-full"
            svgStyle={{ height: '300px' }}
            ariaLabel="Price index map"
            getZoneFill={getZoneFill}
            getZoneOpacity={getZoneOpacity}
            getZoneStroke={getZoneStroke}
            getZoneStrokeWidth={getZoneStrokeWidth}
            getTooltipContent={getTooltipContent}
            transformOffset="245 25"
            backgroundFill="rgba(15, 23, 42, 0.5)"
            containerClassName="w-full h-full"
            showTooltip={true}
          />
        </div>

        {/* Color legend */}
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-surface-500 dark:text-surface-500 px-0.5">
          <span className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded" style={{ background: 'rgb(34, 197, 94)' }} />
            Cheap
          </span>
          <div
            className="flex-1 h-1 mx-2 rounded-full"
            style={{
              background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(250, 204, 21), rgb(249, 115, 22), rgb(239, 68, 68))',
            }}
          />
          <span className="flex items-center gap-1">
            Expensive
            <div className="w-2.5 h-2.5 rounded" style={{ background: 'rgb(239, 68, 68)' }} />
          </span>
        </div>
      </div>

      {/* Right: Ingredient Breakdown or Default Stats */}
      <div className="flex-1 flex flex-col min-w-0">
        {hoveredZone && currentZone && currentBreakdown ? (
          // Show ingredient breakdown when hovering
          <>
            {/* Header with zone info */}
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-surface-300/50 dark:border-surface-700/50">
              <div className="flex items-center gap-2">
                <span className="text-sm">{currentZone.emoji}</span>
                <span className="text-xs font-semibold text-surface-800 dark:text-surface-100">{currentZone.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {avgPrice > 0 && currentPrice !== null && (
                  <span
                    className={`text-[10px] font-mono ${
                      currentPrice < avgPrice ? 'text-emerald-400' : currentPrice > avgPrice ? 'text-rose-400' : 'text-surface-400'
                    }`}
                  >
                    {currentPrice < avgPrice ? '' : '+'}
                    {(((currentPrice - avgPrice) / avgPrice) * 100).toFixed(0)}% vs avg
                  </span>
                )}
                <span className={`text-sm font-bold font-mono ${getPriceColor(currentPrice, minPrice, maxPrice).text}`}>
                  ${currentPrice?.toFixed(2) ?? 'N/A'}
                </span>
              </div>
            </div>

            {/* Ingredient breakdown - limited to ~10 rows to fit in 11 lines total with header */}
            <div className="flex-1 space-y-0.5 overflow-hidden">
              {sortedBreakdown.slice(0, 10).map((item, idx) => {
                const percentage = totalCost > 0 ? (item.cost / totalCost) * 100 : 0;
                const avgCost = avgIngredientCosts[item.name] ?? 0;
                const diffFromAvg = avgCost > 0 ? ((item.cost - avgCost) / avgCost) * 100 : null;

                // Color based on percentage contribution
                const barColor =
                  percentage >= 25 ? 'bg-rose-500' : percentage >= 15 ? 'bg-amber-500' : percentage >= 8 ? 'bg-emerald-500' : 'bg-teal-500';

                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: liteMotion ? 0 : (idx * 0.02) }}
                    className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-surface-200/30 dark:bg-surface-800/30"
                  >
                    {/* Ingredient name */}
                    <span className="text-[10px] text-surface-600 dark:text-surface-300 flex-1 truncate min-w-0">{item.name}</span>

                    {/* Price bar - visual representation of percentage */}
                    <div className="w-16 h-1.5 bg-surface-300/50 dark:bg-surface-700/50 rounded-full overflow-hidden flex-shrink-0">
                      <motion.div
                        className={`h-full rounded-full ${barColor}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                        transition={{
                          duration: liteMotion ? 0.15 : 0.3,
                          delay: liteMotion ? 0 : (idx * 0.02),
                        }}
                      />
                    </div>

                    {/* Percentage */}
                    <span className="text-[9px] font-mono text-surface-500 dark:text-surface-400 w-7 text-right flex-shrink-0">
                      {percentage.toFixed(0)}%
                    </span>

                    {/* Diff from average */}
                    {diffFromAvg !== null && (
                      <span
                        className={`text-[9px] font-mono w-9 text-right flex-shrink-0 ${
                          diffFromAvg < -5 ? 'text-emerald-400' : diffFromAvg > 5 ? 'text-rose-400' : 'text-surface-500'
                        }`}
                      >
                        {diffFromAvg > 0 ? '+' : ''}
                        {diffFromAvg.toFixed(0)}%
                      </span>
                    )}

                    {/* Cost */}
                    <span className="text-[10px] font-bold font-mono text-surface-700 dark:text-surface-200 w-11 text-right flex-shrink-0">
                      ${item.cost.toFixed(2)}
                    </span>
                  </motion.div>
                );
              })}

              {/* Show "more" indicator if there are more ingredients */}
              {sortedBreakdown.length > 10 && (
                <div className="text-[9px] text-surface-500 dark:text-surface-500 text-center pt-0.5">
                  +{sortedBreakdown.length - 10} more (
                  {(((totalCost - sortedBreakdown.slice(0, 10).reduce((s, i) => s + i.cost, 0)) / totalCost) * 100).toFixed(0)}%)
                </div>
              )}
            </div>
          </>
        ) : (
          // Default view: show summary stats and hint
          <>
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-surface-300/50 dark:border-surface-700/50">
              <div className="flex items-center gap-2">
                <Map size={13} className="text-food-500 dark:text-food-400" />
                <span className="text-xs font-semibold text-surface-800 dark:text-surface-100 truncate">{dish?.name} Price Index</span>
              </div>
              {priceSpread > 0 && (
                <div className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {priceSpread}% spread
                </div>
              )}
            </div>

            {/* Summary stats */}
            <div className="space-y-2 flex-1">
              {/* Key stats in a grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface-200/40 dark:bg-surface-800/40 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-surface-500 dark:text-surface-400 mb-0.5">Cheapest</div>
                  <div className="text-sm font-bold text-emerald-500 dark:text-emerald-400">${minPrice.toFixed(2)}</div>
                </div>
                <div className="bg-surface-200/40 dark:bg-surface-800/40 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-surface-500 dark:text-surface-400 mb-0.5">Average</div>
                  <div className="text-sm font-bold text-surface-700 dark:text-surface-200">${avgPrice.toFixed(2)}</div>
                </div>
                <div className="bg-surface-200/40 dark:bg-surface-800/40 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-surface-500 dark:text-surface-400 mb-0.5">Most Expensive</div>
                  <div className="text-sm font-bold text-rose-500 dark:text-rose-400">${maxPrice.toFixed(2)}</div>
                </div>
              </div>

              {/* Top 3 cheapest/expensive zones */}
              <div className="grid grid-cols-2 gap-2">
                {/* Cheapest zones */}
                <div className="bg-emerald-500/10 dark:bg-emerald-500/10 rounded-lg p-2 border border-emerald-500/20">
                  <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Cheapest Zones</div>
                  {Object.entries(zonePrices)
                    .filter(([, p]) => p !== null)
                    .sort((a, b) => a[1] - b[1])
                    .slice(0, 3)
                    .map(([zoneId, price], idx) => (
                      <div key={zoneId} className="flex items-center gap-1 text-[10px] text-surface-600 dark:text-surface-300">
                        <span>{idx + 1}.</span>
                        <span>{ECONOMIC_ZONES[zoneId]?.emoji}</span>
                        <span className="truncate flex-1">{ECONOMIC_ZONES[zoneId]?.name}</span>
                        <span className="font-mono font-semibold text-emerald-500">${price.toFixed(2)}</span>
                      </div>
                    ))}
                </div>

                {/* Expensive zones */}
                <div className="bg-rose-500/10 dark:bg-rose-500/10 rounded-lg p-2 border border-rose-500/20">
                  <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 mb-1">Expensive Zones</div>
                  {Object.entries(zonePrices)
                    .filter(([, p]) => p !== null)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([zoneId, price], idx) => (
                      <div key={zoneId} className="flex items-center gap-1 text-[10px] text-surface-600 dark:text-surface-300">
                        <span>{idx + 1}.</span>
                        <span>{ECONOMIC_ZONES[zoneId]?.emoji}</span>
                        <span className="truncate flex-1">{ECONOMIC_ZONES[zoneId]?.name}</span>
                        <span className="font-mono font-semibold text-rose-500">${price.toFixed(2)}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Hint */}
              <div className="flex items-center justify-center gap-2 pt-1 text-[10px] text-surface-500 dark:text-surface-500">
                <Info size={12} />
                <span>Hover over a region to see ingredient cost breakdown</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Helper: Get time speed description based on percentile
 */
function getTimeDescription(percentile) {
  if (percentile >= 90) return 'extremely fast';
  if (percentile >= 70) return 'quite fast';
  if (percentile >= 40) return 'typical for dishes';
  if (percentile >= 20) return 'moderately long';
  return 'quite lengthy';
}

/**
 * Helper: Format passive time for display
 */
function formatPassiveTime(hours) {
  if (hours < 1) {
    return `${Math.round(hours * 60)} minutes`;
  }
  if (hours === 1) {
    return '1 hour';
  }
  return `${hours} hours`;
}

/**
 * Time Slide - Detailed cooking time breakdown and analysis
 */
function TimeSlide({ dish, isOptimized = false, liteMotion = false, analysisVariants = null, priceUnit = 'serving' }) {
  const dishName = dish?.name || 'This dish';
  
  // Normal cooking times
  const prepTimeNormal = dish?.prepTimeNormal ?? 0;
  const cookTimeNormal = dish?.cookTimeNormal ?? 0;
  const totalTimeNormal = prepTimeNormal + cookTimeNormal;
  
  // Optimized cooking times
  const prepTimeOptimized = dish?.prepTimeOptimized ?? prepTimeNormal;
  const cookTimeOptimized = dish?.cookTimeOptimized ?? cookTimeNormal;
  const totalTimeOptimized = prepTimeOptimized + cookTimeOptimized;
  
  // Passive time (same for both modes)
  const passiveTimeHours = dish?.passiveTimeHours ?? 0;
  const passivePenalty = getPassiveTimePenalty(passiveTimeHours);
  
  // Speed scores and percentiles
  const speedScoreBeforePenalty = dish?.speedScoreBeforePenalty ?? 5;
  const speedPercentile = dish?.speedPercentile ?? 50;
  const finalSpeedScore = dish?.normalizedBase?.speed ?? 5;
  
  // Calculate prep/cook changes for optimized mode
  const prepReduction = prepTimeNormal - prepTimeOptimized;
  const cookReduction = cookTimeNormal - cookTimeOptimized;
  const prepChanged = prepReduction !== 0;
  const cookChanged = cookReduction !== 0;
  
  // Comment for optimization
  const optimizedComment = dish?.optimizedComment || '';
  
  // Determine if optimization is beneficial
  // Compare normal percentile among normal dishes vs optimized percentile among optimized dishes
  // For now we use the current percentile as a proxy
  const timeReduction = totalTimeNormal - totalTimeOptimized;
  const percentReduction = totalTimeNormal > 0 ? Math.round((timeReduction / totalTimeNormal) * 100) : 0;
  const isGoodForOptimization = percentReduction >= 30;
  
  const timeDescription = getTimeDescription(speedPercentile);

  // Calculate scores for both modes
  // Get score from the appropriate variant
  let standardCookingScore = finalSpeedScore;
  let timeOptimizedScore = finalSpeedScore;
  
  if (analysisVariants?.variants) {
    // Get normal mode score
    const normalKey = `normal:${priceUnit}`;
    const normalVariant = analysisVariants.variants[normalKey];
    if (normalVariant?.analyzed) {
      const normalDish = normalVariant.analyzed.find(d => d.name === dishName);
      if (normalDish?.normalizedBase?.speed !== undefined) {
        standardCookingScore = normalDish.normalizedBase.speed;
      }
    }
    
    // Get optimized mode score
    const optimizedKey = `optimized:${priceUnit}`;
    const optimizedVariant = analysisVariants.variants[optimizedKey];
    if (optimizedVariant?.analyzed) {
      const optimizedDish = optimizedVariant.analyzed.find(d => d.name === dishName);
      if (optimizedDish?.normalizedBase?.speed !== undefined) {
        timeOptimizedScore = optimizedDish.normalizedBase.speed;
      }
    }
  } else {
    // Fallback: if we don't have variants, use current score
    // Standard Cooking: if we're in normal mode, use current score; otherwise estimate
    standardCookingScore = isOptimized
      ? Math.max(0, Math.min(10, speedScoreBeforePenalty + passivePenalty))
      : finalSpeedScore;
    
    // Time-Optimized: if we're in optimized mode, use current score; otherwise estimate
    timeOptimizedScore = isOptimized
      ? finalSpeedScore
      : Math.max(0, Math.min(10, speedScoreBeforePenalty + passivePenalty));
  }

  return (
    <div className="space-y-4">
      {/* Standard Cooking Section */}
      <div className="bg-surface-200/40 dark:bg-surface-700/40 rounded-lg p-3 border border-surface-300/30 dark:border-surface-600/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Timer size={14} className="text-surface-600 dark:text-surface-300" />
            <span className="text-xs font-semibold text-surface-700 dark:text-surface-200 uppercase tracking-wide">
              Standard Cooking
            </span>
          </div>
          <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
            Score: {standardCookingScore.toFixed(1)}/10
          </div>
        </div>
        
        <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed mb-3">
          <span className="font-semibold text-surface-800 dark:text-surface-100">{dishName}</span> requires{' '}
          <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">{prepTimeNormal} min</span> of active preparation
          {cookTimeNormal > 0 ? (
            <>
              , and another{' '}
              <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">{cookTimeNormal} min</span> of active cooking
            </>
          ) : (
            <>, but requires no active cooking/heat treatment</>
          )}.
        </p>

        <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed mb-3">
          Total active time is{' '}
          <span className="font-mono font-semibold text-surface-800 dark:text-surface-100">{totalTimeNormal} min</span>, which is{' '}
          <span className={`font-semibold ${speedPercentile >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
            {timeDescription}
          </span>.
        </p>

        {/* Percentile visualization */}
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5 mb-3">
          <div className="flex items-center justify-between text-xs text-surface-500 dark:text-surface-400 mb-1.5">
            <span>Slowest</span>
            <span>Active Time Percentile</span>
            <span>Fastest</span>
          </div>
          <div className="relative h-2 bg-surface-300/60 dark:bg-surface-700/60 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${speedPercentile}%` }}
              transition={{ duration: liteMotion ? 0.2 : 0.6, ease: 'easeOut' }}
            />
          </div>
          <div className="flex items-center justify-center mt-1.5">
            <span className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400">
              {speedPercentile}th percentile — faster than {speedPercentile}% of dishes
            </span>
          </div>
        </div>

        <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
          Based on this, the dish receives an active speed score of{' '}
          <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">≈{speedScoreBeforePenalty.toFixed(1)}/10</span>.
        </p>

        {/* Passive time penalty section */}
        {passiveTimeHours > 0 && (
          <div className="mt-3 pt-3 border-t border-surface-300/30 dark:border-surface-600/30">
            <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
              However, this dish also requires{' '}
              <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                {formatPassiveTime(passiveTimeHours)}
              </span>{' '}
              of passive cooking time (e.g., marinating, rising, slow cooking), which applies a{' '}
              <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                {passivePenalty} point
              </span>{' '}
              penalty.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-surface-500 dark:text-surface-400">Final speed score:</span>
              <span className="font-mono font-bold text-lg text-cyan-600 dark:text-cyan-400">
                {finalSpeedScore.toFixed(1)}/10
              </span>
              <span className="text-xs text-surface-400 dark:text-surface-500">
                ({speedScoreBeforePenalty.toFixed(1)} {passivePenalty} = {finalSpeedScore.toFixed(1)})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Optimized Cooking Section */}
      {(prepChanged || cookChanged) && (
        <div className="bg-emerald-500/10 dark:bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-emerald-500 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                Time-Optimized Approach
              </span>
            </div>
            <div className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              Score: {timeOptimizedScore.toFixed(1)}/10
            </div>
          </div>

          <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed mb-3">
            Time can be reduced by adapting restaurant/café practices and batch preparation. Here's an idea for{' '}
            <span className="text-surface-600 dark:text-surface-300">{dishName}</span>:
          </p>

          {/* Optimization comment */}
          {optimizedComment && (
            <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5 mb-3 border-l-2 border-emerald-500">
              <p className="text-xs text-surface-600 dark:text-surface-300 italic">
                "{optimizedComment}"
              </p>
            </div>
          )}

          {/* Time comparison */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Prep time */}
            <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5">
              <div className="text-[10px] text-surface-500 dark:text-surface-400 mb-1">Preparation</div>
              {prepChanged ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-surface-800 dark:text-surface-100">
                    {prepTimeOptimized} min
                  </span>
                  <span className="flex items-center text-emerald-500 dark:text-emerald-400 text-xs">
                    <ArrowDown size={12} />
                    {prepReduction} min
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-surface-800 dark:text-surface-100">
                    {prepTimeOptimized} min
                  </span>
                  <span className="text-xs text-surface-400 dark:text-surface-500">unchanged</span>
                </div>
              )}
            </div>

            {/* Cook time */}
            <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5">
              <div className="text-[10px] text-surface-500 dark:text-surface-400 mb-1">Cooking</div>
              {cookChanged ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-surface-800 dark:text-surface-100">
                    {cookTimeOptimized} min
                  </span>
                  <span className="flex items-center text-emerald-500 dark:text-emerald-400 text-xs">
                    <ArrowDown size={12} />
                    {cookReduction} min
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-surface-800 dark:text-surface-100">
                    {cookTimeOptimized} min
                  </span>
                  <span className="text-xs text-surface-400 dark:text-surface-500">unchanged</span>
                </div>
              )}
            </div>
          </div>

          {/* Optimization effectiveness assessment */}
          <div className={`rounded-lg p-2.5 ${isGoodForOptimization ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            {isGoodForOptimization ? (
              <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                <span className="font-semibold">Great for optimization!</span> This dish benefits significantly from batch preparation, 
                with a <span className="font-mono font-semibold">{percentReduction}%</span> time reduction 
                ({totalTimeNormal} min → {totalTimeOptimized} min).
              </p>
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                <span className="font-semibold">Limited optimization potential.</span> While some time can be saved, 
                this dish doesn't benefit as much from batch preparation 
                ({percentReduction > 0 ? `only ${percentReduction}% reduction` : 'no significant change'}).
              </p>
            )}
          </div>

        </div>
      )}

      {/* No optimization available message */}
      {!prepChanged && !cookChanged && (
        <div className="bg-surface-200/40 dark:bg-surface-700/40 rounded-lg p-3 border border-surface-300/30 dark:border-surface-600/30">
          <div className="flex items-center gap-2 mb-2">
            <Info size={14} className="text-surface-500 dark:text-surface-400" />
            <span className="text-xs font-semibold text-surface-600 dark:text-surface-300">
              Optimization Note
            </span>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            This dish doesn't have significant time optimization opportunities — the standard cooking method is already efficient.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Carousel/Slider for dish info slides
 */
export default function InfoSlider({ 
  dish, 
  dishName, 
  dishHealth, 
  dishEthics, 
  ingredients, 
  ingredientIndex,
  priorities = {},
  unavailableIngredients = [],
  missingIngredients = [],
  missingPrices = [],
  isOptimized = false,
  liteMotion = false,
  analysisVariants = null,
  priceUnit = 'serving',
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'index-map', label: 'Index Map', icon: Map },
    { id: 'time', label: 'Time', icon: Clock },
    { id: 'health', label: 'Health', icon: Heart },
    { id: 'ethics', label: 'Ethics', icon: Leaf },
  ];

  const goToSlide = (index) => setCurrentSlide(index);
  const goNext = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const goPrev = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  // Swipe handling
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) goNext();
    if (isRightSwipe) goPrev();
  };

  return (
    <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg overflow-hidden">
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-2 border-b border-surface-300/50 dark:border-surface-700/50">
        {/* Left arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="p-1 sm:p-1.5 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-200/50 dark:hover:bg-surface-700/50 transition-colors flex-shrink-0"
        >
          <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>

        {/* Tab indicators */}
        <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto hide-scrollbar">
          {slides.map((slide, idx) => {
            const Icon = slide.icon;
            const isActive = idx === currentSlide;
            return (
              <button
                key={slide.id}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(idx);
                }}
                className={`
                  flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium
                  transition-all duration-200 flex-shrink-0
                  ${isActive 
                    ? 'bg-food-500/20 text-food-600 dark:text-food-400 border border-food-500/30' 
                    : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-200/30 dark:hover:bg-surface-700/30'
                  }
                `}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{slide.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="p-1 sm:p-1.5 rounded-lg text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 hover:bg-surface-200/50 dark:hover:bg-surface-700/50 transition-colors flex-shrink-0"
        >
          <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      </div>

      {/* Slide content */}
      <div className="p-4 relative overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        {liteMotion ? (
          <div>
            {currentSlide === 0 && (
              <OverviewSlide 
                dish={dish}
                priorities={priorities}
                unavailableIngredients={unavailableIngredients}
                missingIngredients={missingIngredients}
                missingPrices={missingPrices}
              />
            )}
            {currentSlide === 1 && <IndexMapSlide dish={dish} ingredientIndex={ingredientIndex} liteMotion={true} />}
            {currentSlide === 2 && <TimeSlide dish={dish} isOptimized={isOptimized} liteMotion={true} analysisVariants={analysisVariants} priceUnit={priceUnit} />}
            {currentSlide === 3 && (
              <HealthBreakdownSlide
                dishName={dishName}
                dishHealth={dishHealth}
                ingredients={ingredients}
                ingredientIndex={ingredientIndex}
                liteMotion={true}
              />
            )}
            {currentSlide === 4 && (
              <EthicsBreakdownSlide
                dishName={dishName}
                dishEthics={dishEthics}
                ingredients={ingredients}
                ingredientIndex={ingredientIndex}
                liteMotion={true}
              />
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentSlide === 0 && (
                <OverviewSlide 
                  dish={dish}
                  priorities={priorities}
                  unavailableIngredients={unavailableIngredients}
                  missingIngredients={missingIngredients}
                  missingPrices={missingPrices}
                />
              )}
              {currentSlide === 1 && <IndexMapSlide dish={dish} ingredientIndex={ingredientIndex} liteMotion={false} />}
              {currentSlide === 2 && <TimeSlide dish={dish} isOptimized={isOptimized} liteMotion={false} analysisVariants={analysisVariants} priceUnit={priceUnit} />}
              {currentSlide === 3 && (
                <HealthBreakdownSlide
                  dishName={dishName}
                  dishHealth={dishHealth}
                  ingredients={ingredients}
                  ingredientIndex={ingredientIndex}
                  liteMotion={false}
                />
              )}
              {currentSlide === 4 && (
                <EthicsBreakdownSlide
                  dishName={dishName}
                  dishEthics={dishEthics}
                  ingredients={ingredients}
                  ingredientIndex={ingredientIndex}
                  liteMotion={false}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2 pb-3">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(idx);
            }}
            className={`
              w-2 h-2 rounded-full transition-all duration-200
              ${idx === currentSlide ? 'bg-food-500 w-6' : 'bg-surface-400 dark:bg-surface-600 hover:bg-surface-500'}
            `}
          />
        ))}
      </div>
    </div>
  );
}




