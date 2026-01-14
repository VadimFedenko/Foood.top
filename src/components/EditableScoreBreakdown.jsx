import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Utensils,
  Heart,
  Clock,
  DollarSign,
  Flame,
  Leaf,
  X,
  RotateCcw,
  Edit3,
  Check,
} from 'lucide-react';
import { formatTime } from './dishCardUtils';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function isFiniteNumber(n) {
  return Number.isFinite(n);
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function safeMulFromAbs({ abs, base }) {
  if (!isFiniteNumber(abs)) return null;
  if (!isFiniteNumber(base) || base === 0) return abs === 0 ? 0 : 1;
  return abs / base;
}

function valueForScoreFromSorted(valuesSorted, higherIsBetter, score10) {
  const s = clamp(score10, 0, 10);
  if (!Array.isArray(valuesSorted) || valuesSorted.length < 2) return null;
  const n = valuesSorted.length;

  const p = s / 10; // 0..1
  const basePercentile = higherIsBetter ? p : (1 - p); // ascending percentile (0..1)
  const idx = clamp(basePercentile * (n - 1), 0, n - 1);

  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const t = idx - lo;
  const a = valuesSorted[lo];
  const b = valuesSorted[hi];
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) return null;
  return a + (b - a) * t;
}

function invertCheapnessToCost(score10, minCost, maxCost) {
  const s = clamp(score10, 0, 10);
  if (!isFiniteNumber(minCost) || !isFiniteNumber(maxCost)) return null;
  if (minCost <= 0 || maxCost <= 0) return null;
  if (minCost >= maxCost) return null;

  const logMin = Math.log(minCost);
  const logMax = Math.log(maxCost);
  // cheapness: 10 = cheapest, 0 = expensive
  const logCost = logMax - (s / 10) * (logMax - logMin);
  return Math.exp(logCost);
}

function inverseConvertPriceToUnit(costInUnit, weight, calories, unit) {
  const c = isFiniteNumber(costInUnit) ? Math.max(0, costInUnit) : 0;
  const w = isFiniteNumber(weight) ? weight : 0;
  const kcal = isFiniteNumber(calories) ? calories : 0;

  if (unit === 'serving') return c;
  if (unit === 'per1kg') return w > 0 ? (c * w / 1000) : c;
  if (unit === 'per1000kcal') return kcal > 0 ? (c * kcal / 1000) : c;
  return c;
}

/**
 * Horizontal score slider component for editing mode
 */
function ScoreSlider({ 
  label, 
  icon: Icon, 
  value, 
  rightLabel,
  onChange, 
  isModified = false,
  color = 'food',
  isDark = false,
  isActive = true,
  disabled = false,
}) {
  const percentage = ((value) / 10) * 100;
  
  const gradientColors = {
    food: isDark ? 'from-food-400 to-food-300' : 'from-food-300 to-food-200',
    cyan: isDark ? 'from-cyan-400 to-cyan-300' : 'from-cyan-300 to-cyan-200',
    emerald: isDark ? 'from-emerald-400 to-emerald-300' : 'from-emerald-300 to-emerald-200',
    rose: isDark ? 'from-rose-400 to-rose-300' : 'from-rose-300 to-rose-200',
    amber: isDark ? 'from-amber-400 to-amber-300' : 'from-amber-300 to-amber-200',
    purple: isDark ? 'from-purple-400 to-purple-300' : 'from-purple-300 to-purple-200',
    lime: isDark ? 'from-lime-400 to-lime-300' : 'from-lime-300 to-lime-200',
  };
  
  const gradientColor = gradientColors[color] || gradientColors.food;
  
  // Inactive: gray text, colorless bar, disabled input
  // Active: slightly grayish white text
  const iconColor = !isActive 
    ? 'text-surface-400 dark:text-surface-500' 
    : (isModified ? 'text-amber-500' : 'text-surface-100 dark:text-surface-200');
  const labelColor = !isActive
    ? 'text-surface-400 dark:text-surface-500'
    : (isModified ? 'text-amber-600 dark:text-amber-400' : 'text-surface-100 dark:text-surface-200');
  const barFillColor = !isActive
    ? 'bg-surface-300 dark:bg-surface-600'
    : (isModified ? 'from-amber-500 to-amber-400' : gradientColor);
  const thumbColor = !isActive
    ? 'bg-surface-400 dark:bg-surface-500 border-white/50'
    : (isModified ? 'bg-amber-500 border-white' : `bg-gradient-to-b ${gradientColor} border-white/90`);
  const valueColor = !isActive
    ? 'text-surface-400 dark:text-surface-500'
    : (isModified ? 'text-amber-600 dark:text-amber-400' : 'text-surface-700 dark:text-surface-200');
  
  return (
    <div className={`flex items-center gap-2 py-1.5 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-1.5 w-16 sm:w-20 flex-shrink-0">
        <Icon size={14} className={iconColor} />
        <span className={`text-xs font-medium truncate ${labelColor}`}>
          {label}
        </span>
      </div>
      
      <div className="flex-1 relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-surface-300 dark:bg-surface-700 overflow-hidden">
          <motion.div
            className={`absolute left-0 top-0 bottom-0 ${!isActive ? barFillColor : `bg-gradient-to-r ${barFillColor}`}`}
            initial={false}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'tween', duration: 0.1 }}
          />
        </div>
        
        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled || !isActive}
          className={`absolute inset-0 w-full opacity-0 z-10 touch-pan-x ${disabled || !isActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        />
        
        <motion.div
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-md pointer-events-none border-2 ${thumbColor}`}
          initial={false}
          animate={{ left: `calc(${percentage}% - 8px)` }}
          transition={{ type: 'tween', duration: 0.1 }}
        />
      </div>
      
      <div className={`w-16 text-right font-mono text-[11px] font-medium ${valueColor}`}>
        {rightLabel ?? value.toFixed(1)}
      </div>
    </div>
  );
}

/**
 * Score bar for display mode
 */
function ScoreBar({ label, icon: Icon, value, maxValue = 10, color, isModified = false, isActive = true }) {
  const percentage = (value / maxValue) * 100;
  
  // Inactive: gray text, colorless bar
  // Active: slightly grayish white text, brighter colors
  const iconColor = !isActive 
    ? 'text-surface-400 dark:text-surface-500' 
    : (isModified ? 'text-amber-500' : 'text-surface-100 dark:text-surface-200');
  const labelColor = !isActive
    ? 'text-surface-400 dark:text-surface-500'
    : (isModified ? 'text-amber-600 dark:text-amber-400' : 'text-surface-100 dark:text-surface-200');
  const barColor = !isActive
    ? 'bg-surface-300 dark:bg-surface-600'
    : (isModified ? 'bg-amber-500' : color);
  const valueColor = !isActive
    ? 'text-surface-400 dark:text-surface-500'
    : (isModified ? 'text-amber-600 dark:text-amber-400' : 'text-surface-600 dark:text-surface-300');
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 w-16 sm:w-20 flex-shrink-0">
        <Icon size={14} className={iconColor} />
        <span className={`text-xs ${labelColor}`}>{label}</span>
      </div>
      <div className="flex-1 h-1.5 bg-surface-300 dark:bg-surface-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className={`text-xs font-mono w-8 text-right ${valueColor}`}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

/**
 * Editable Score Breakdown component with Edit/Save/Cancel
 */
export default function EditableScoreBreakdown({ 
  dish, 
  priorities,
  rankingMeta = null,
  isOptimized = false,
  priceUnit = 'serving',
  onApplyOverridesPatch,
  onResetAll,
  onEditingChange,
  isDark = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftScores, setDraftScores] = useState({});
  const [initialScores, setInitialScores] = useState({});

  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  const unitLabel =
    priceUnit === 'per1kg' ? '/kg' : priceUnit === 'per1000kcal' ? '/kkcal' : '/serving';

  const currentScoreByKey = useMemo(() => {
    const n = dish?.normalizedMetrics || {};
    return {
      taste: isFiniteNumber(n.taste) ? n.taste : (dish?.taste ?? 5),
      health: isFiniteNumber(n.health) ? n.health : (dish?.health ?? 5),
      ethics: isFiniteNumber(n.ethics) ? n.ethics : (dish?.ethics ?? 5),
      speed: isFiniteNumber(n.speed) ? n.speed : 5,
      cheapness: isFiniteNumber(n.cheapness) ? n.cheapness : 5,
      lowCalorie: isFiniteNumber(n.lowCalorie) ? n.lowCalorie : 5,
      satiety: isFiniteNumber(n.satiety) ? n.satiety : (dish?.normalizedBase?.satiety ?? 5),
    };
  }, [dish]);
  
  const metrics = [
    { key: 'taste', label: 'Taste', icon: Utensils, color: 'bg-food-300', sliderColor: 'food' },
    { key: 'health', label: 'Health', icon: Heart, color: 'bg-emerald-300', sliderColor: 'emerald' },
    { key: 'speed', label: 'Speed', icon: Clock, color: 'bg-cyan-300', sliderColor: 'cyan' },
    { key: 'cheapness', label: 'Budget', icon: DollarSign, color: 'bg-lime-300', sliderColor: 'lime' },
    { key: 'lowCalorie', label: 'Low-Cal', icon: Flame, color: 'bg-purple-300', sliderColor: 'purple' },
    { key: 'ethics', label: 'Ethics', icon: Leaf, color: 'bg-amber-300', sliderColor: 'amber' },
  ];
  
  // Show all metrics, but mark which are active (priority !== 0)
  const metricsWithActive = metrics.map(m => ({
    ...m,
    isActive: priorities && priorities[m.key] !== undefined && priorities[m.key] !== 0,
  }));
  
  const activeMetrics = metricsWithActive.filter(m => m.isActive);

  const hasModifications = useMemo(() => {
    const o = dish?.hasOverrides;
    if (!o || typeof o !== 'object') return false;
    return Object.values(o).some(Boolean);
  }, [dish]);
  
  const handleStartEdit = () => {
    // Initialize draft for all metrics (including inactive ones for display)
    const draft = {};
    metricsWithActive.forEach(m => {
      draft[m.key] = currentScoreByKey[m.key] ?? 5;
    });
    setInitialScores(draft);
    setDraftScores(draft);
    setIsEditing(true);
  };
  
  const handleSave = () => {
    if (typeof onApplyOverridesPatch !== 'function') {
      setIsEditing(false);
      return;
    }

    const dists = rankingMeta?.dists || {};
    const datasetStats = rankingMeta?.datasetStats || {};

    const baseTaste = dish?.baseTaste ?? dish?.taste ?? 5;
    const baseHealth = dish?.baseHealth ?? dish?.health ?? 5;
    const baseEthics = dish?.baseEthics ?? dish?.ethics ?? 5;
    const baseTime = (isOptimized ? dish?.baseTimeOptimized : dish?.baseTimeNormal) ?? dish?.time ?? 30;
    const basePriceServing = dish?.basePriceServing ?? dish?.prices?.serving ?? dish?.baseCost ?? 0;
    const baseCalories = dish?.baseCalories ?? dish?.calories ?? 0;
    const baseSatiety = dish?.baseSatiety ?? dish?.satiety ?? 5;
    const weight = dish?.weight ?? 0;

    const speedPenalty = isFiniteNumber(dish?.speedPenalty) ? dish.speedPenalty : 0;

    // Predict calories first (low-cal edit affects per1000kcal conversion for cheapness).
    const lowCalScore = isFiniteNumber(draftScores.lowCalorie) ? draftScores.lowCalorie : null;
    const kcalPer100gTarget = lowCalScore == null
      ? null
      : valueForScoreFromSorted(dists.lowCalorieValuesSorted, dists.lowCalorieHigherIsBetter, lowCalScore);
    const caloriesTarget = kcalPer100gTarget != null && isFiniteNumber(weight) && weight > 0
      ? Math.max(0, (kcalPer100gTarget * weight) / 100)
      : null;
    const caloriesMul = caloriesTarget != null ? safeMulFromAbs({ abs: caloriesTarget, base: baseCalories }) : null;
    const predictedCalories = caloriesMul != null ? Math.max(0, baseCalories * caloriesMul) : (dish?.calories ?? baseCalories ?? 0);

    const patch = {};
    const changed = (k) => Math.abs((draftScores[k] ?? 0) - (initialScores[k] ?? 0)) > 0.05;

    if (draftScores.taste != null && changed('taste')) {
      const mul = safeMulFromAbs({ abs: clamp(draftScores.taste, 0, 10), base: baseTaste });
      if (mul != null) patch.tasteMul = round1(Math.max(0, mul));
    }
    if (draftScores.health != null && changed('health')) {
      const mul = safeMulFromAbs({ abs: clamp(draftScores.health, 0, 10), base: baseHealth });
      if (mul != null) patch.healthMul = round1(Math.max(0, mul));
    }
    if (draftScores.ethics != null && changed('ethics')) {
      const mul = safeMulFromAbs({ abs: clamp(draftScores.ethics, 0, 10), base: baseEthics });
      if (mul != null) patch.ethicsMul = round1(Math.max(0, mul));
    }

    if (draftScores.speed != null && changed('speed')) {
      const desiredFinal = clamp(draftScores.speed, 0, 10);
      const desiredBase = clamp(desiredFinal - speedPenalty, 0, 10);
      const timeTarget = valueForScoreFromSorted(dists.speedValuesSorted, dists.speedHigherIsBetter, desiredBase);
      if (timeTarget != null) {
        const mul = safeMulFromAbs({ abs: Math.max(1, timeTarget), base: baseTime });
        if (mul != null) patch.timeMul = round1(Math.max(0, mul));
      }
    }

    if (draftScores.lowCalorie != null && changed('lowCalorie')) {
      if (caloriesMul != null) patch.caloriesMul = round1(Math.max(0, caloriesMul));
    }

    if (draftScores.satiety != null && changed('satiety')) {
      const satietyTarget = valueForScoreFromSorted(dists.satietyValuesSorted, dists.satietyHigherIsBetter, clamp(draftScores.satiety, 0, 10));
      if (satietyTarget != null) {
        const mul = safeMulFromAbs({ abs: Math.max(0, satietyTarget), base: baseSatiety });
        if (mul != null) patch.satietyMul = round1(Math.max(0, mul));
      }
    }

    if (draftScores.cheapness != null && changed('cheapness')) {
      const desiredCostInUnit = invertCheapnessToCost(draftScores.cheapness, datasetStats.minCost, datasetStats.maxCost);
      if (desiredCostInUnit != null) {
        const serving = inverseConvertPriceToUnit(desiredCostInUnit, weight, predictedCalories, priceUnit);
        const mul = safeMulFromAbs({ abs: Math.max(0.01, serving), base: basePriceServing });
        if (mul != null) patch.priceMul = round1(Math.max(0, mul));
      }
    }

    if (Object.keys(patch).length > 0) onApplyOverridesPatch(patch);
    setIsEditing(false);
  };
  
  const handleCancel = () => {
    setDraftScores({});
    setInitialScores({});
    setIsEditing(false);
  };
  
  const handleDraftChange = (key, value) => {
    setDraftScores(prev => ({ ...prev, [key]: value }));
  };

  const previewByKey = useMemo(() => {
    const dists = rankingMeta?.dists || {};
    const datasetStats = rankingMeta?.datasetStats || {};

    const baseTime = (isOptimized ? dish?.baseTimeOptimized : dish?.baseTimeNormal) ?? dish?.time ?? 30;
    const speedPenalty = isFiniteNumber(dish?.speedPenalty) ? dish.speedPenalty : 0;

    const basePriceServing = dish?.basePriceServing ?? dish?.prices?.serving ?? dish?.baseCost ?? 0;
    const baseCalories = dish?.baseCalories ?? dish?.calories ?? 0;
    const weight = dish?.weight ?? 0;

    const lowCalScore = isFiniteNumber(draftScores.lowCalorie) ? draftScores.lowCalorie : currentScoreByKey.lowCalorie;
    const kcalPer100gTarget = valueForScoreFromSorted(dists.lowCalorieValuesSorted, dists.lowCalorieHigherIsBetter, lowCalScore);
    const caloriesTarget = kcalPer100gTarget != null && isFiniteNumber(weight) && weight > 0
      ? Math.max(0, (kcalPer100gTarget * weight) / 100)
      : null;
    const caloriesMul = caloriesTarget != null ? safeMulFromAbs({ abs: caloriesTarget, base: baseCalories }) : null;
    const predictedCalories = caloriesMul != null ? Math.max(0, baseCalories * caloriesMul) : (dish?.calories ?? baseCalories ?? 0);

    const cheapScore = isFiniteNumber(draftScores.cheapness) ? draftScores.cheapness : currentScoreByKey.cheapness;
    const desiredCostInUnit = invertCheapnessToCost(cheapScore, datasetStats.minCost, datasetStats.maxCost);
    const desiredServing = desiredCostInUnit != null ? inverseConvertPriceToUnit(desiredCostInUnit, weight, predictedCalories, priceUnit) : null;
    const priceMul = desiredServing != null ? safeMulFromAbs({ abs: Math.max(0.01, desiredServing), base: basePriceServing }) : null;
    const predictedCostInUnit = priceMul != null
      ? (() => {
        const serving = basePriceServing * priceMul;
        if (priceUnit === 'per1kg') return (weight > 0 ? (serving * 1000 / weight) : serving);
        if (priceUnit === 'per1000kcal') return (predictedCalories > 0 ? (serving * 1000 / predictedCalories) : serving);
        return serving;
      })()
      : (dish?.cost ?? 0);

    const speedScore = isFiniteNumber(draftScores.speed) ? draftScores.speed : currentScoreByKey.speed;
    const desiredBase = clamp(speedScore - speedPenalty, 0, 10);
    const timeTarget = valueForScoreFromSorted(dists.speedValuesSorted, dists.speedHigherIsBetter, desiredBase);
    const timeMul = timeTarget != null ? safeMulFromAbs({ abs: Math.max(1, timeTarget), base: baseTime }) : null;
    const predictedTime = timeMul != null ? Math.max(1, baseTime * timeMul) : (dish?.time ?? 0);

    return {
      taste: `${(draftScores.taste ?? currentScoreByKey.taste).toFixed(1)}/10`,
      health: `${(draftScores.health ?? currentScoreByKey.health).toFixed(1)}/10`,
      ethics: `${(draftScores.ethics ?? currentScoreByKey.ethics).toFixed(1)}/10`,
      speed: formatTime(Math.round(predictedTime)),
      cheapness: `$${predictedCostInUnit.toFixed(2)}${unitLabel}`,
      lowCalorie: kcalPer100gTarget != null ? `${Math.round(kcalPer100gTarget)} kcal/100g` : `${Math.round(dish?.kcalPer100g ?? 0)} kcal/100g`,
      satiety: (() => {
        const s = isFiniteNumber(draftScores.satiety) ? draftScores.satiety : currentScoreByKey.satiety;
        const satietyTarget = valueForScoreFromSorted(dists.satietyValuesSorted, dists.satietyHigherIsBetter, s);
        if (satietyTarget != null) return satietyTarget.toFixed(1);
        return (dish?.satiety ?? 0).toFixed?.(1) ?? String(dish?.satiety ?? 0);
      })(),
    };
  }, [currentScoreByKey, dish, draftScores, isOptimized, priceUnit, rankingMeta, unitLabel]);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-surface-700 dark:text-surface-200">
          Score Breakdown
        </h4>
        <div className="flex items-center gap-2">
          {hasModifications && !isEditing && (
            <button
              onClick={onResetAll}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium
                         text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
            >
              <RotateCcw size={10} />
              Reset
            </button>
          )}
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                           text-surface-600 dark:text-surface-400 bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600"
              >
                <X size={12} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                           text-white bg-food-500 hover:bg-food-600"
              >
                <Check size={12} />
                Save
              </button>
            </>
          ) : (
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                         text-food-600 dark:text-food-400 bg-food-500/10 hover:bg-food-500/20"
              disabled={activeMetrics.length === 0}
            >
              <Edit3 size={12} />
              Edit
            </button>
          )}
        </div>
      </div>
      
      <div className="space-y-1 bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-3">
        {isEditing ? (
          <>
            {metricsWithActive.map(metric => {
              // In Edit mode, all sliders become active regardless of priorities.
              const isActive = true;
              return (
                <ScoreSlider
                  key={metric.key}
                  label={metric.label}
                  icon={metric.icon}
                  value={draftScores[metric.key] ?? currentScoreByKey[metric.key] ?? 5}
                  rightLabel={previewByKey?.[metric.key]}
                  onChange={(val) => handleDraftChange(metric.key, val)}
                  isModified={Math.abs((draftScores[metric.key] ?? 0) - (initialScores[metric.key] ?? 0)) > 0.05}
                  color={metric.sliderColor}
                  isDark={isDark}
                  isActive={isActive}
                  disabled={false}
                />
              );
            })}
            <p className="text-[10px] text-surface-500 dark:text-surface-400 mt-2 pt-2 border-t border-surface-200 dark:border-surface-700">
              Edit target scores (0–10). Right side shows the corresponding raw units; on Save we compute the needed multipliers.
            </p>
          </>
        ) : (
          metricsWithActive.map(metric => {
            const displayValue = currentScoreByKey[metric.key] ?? 5;
            const key = metric.key;
            const isModified =
              key === 'taste' ? !!dish?.hasOverrides?.taste :
              key === 'health' ? !!dish?.hasOverrides?.health :
              key === 'ethics' ? !!dish?.hasOverrides?.ethics :
              key === 'speed' ? !!dish?.hasOverrides?.time :
              key === 'cheapness' ? (!!dish?.hasOverrides?.price || (priceUnit === 'per1000kcal' && !!dish?.hasOverrides?.calories)) :
              key === 'lowCalorie' ? !!dish?.hasOverrides?.calories :
              false;
            
            return (
              <ScoreBar 
                key={metric.key}
                label={metric.label}
                icon={metric.icon}
                value={Math.min(10, Math.max(0, displayValue))}
                color={metric.color}
                isModified={isModified}
                isActive={metric.isActive}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

