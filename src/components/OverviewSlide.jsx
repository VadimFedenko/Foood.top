import { Clock, DollarSign, Flame, Info, AlertTriangle } from 'lucide-react';
import { formatTime } from './dishCardUtils';
import EditableScoreBreakdown from './EditableScoreBreakdown';

export default function OverviewSlide({ 
  dish, ingredients, unavailableIngredients, missingIngredients, missingPrices, priorities,
  rankingMeta, isOptimized, onApplyOverridesPatch, onResetAll, onEditingChange, isDark, priceUnit,
}) {
  const hasUnavailableIngredients = unavailableIngredients?.length > 0;
  const hasDataWarnings = missingIngredients?.length > 0 || missingPrices?.length > 0;

  // Get price unit label
  const priceUnitLabel = priceUnit === 'per1kg' ? '/kg' : priceUnit === 'per1000kcal' ? '/kkcal' : '/serving';

  return (
    <div className="space-y-3">
      {hasUnavailableIngredients && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2.5">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300 mb-1">
            <Info size={12} />
            <span className="text-xs font-semibold">Cannot be prepared in your region</span>
          </div>
          <div className="text-xs text-surface-600 dark:text-surface-300">
            {unavailableIngredients.map((ing, idx) => (
              <span key={idx} className="font-mono">{ing.name} ({ing.grams}g){idx < unavailableIngredients.length - 1 ? ', ' : ''}</span>
            ))}
          </div>
        </div>
      )}

      {hasDataWarnings && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300 mb-1">
            <AlertTriangle size={12} />
            <span className="text-xs font-semibold">Data warnings</span>
          </div>
          <div className="text-xs text-surface-600 dark:text-surface-300">
            {missingIngredients?.length > 0 && <div>Missing: {missingIngredients.join(', ')}</div>}
            {missingPrices?.length > 0 && <div>No prices: {missingPrices.join(', ')}</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2 text-center">
          <Clock size={14} className="mx-auto text-cyan-500 mb-0.5" />
          <div className="text-[10px] text-surface-500">Time</div>
          <div className="text-sm font-semibold text-surface-700 dark:text-surface-200">{formatTime(dish?.time ?? 0)}</div>
        </div>
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2 text-center">
          <DollarSign size={14} className="mx-auto text-emerald-500 mb-0.5" />
          <div className="text-[10px] text-surface-500">Cost{priceUnitLabel}</div>
          <div className="text-sm font-semibold text-surface-700 dark:text-surface-200">${(dish?.cost ?? 0).toFixed(2)}</div>
        </div>
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2 text-center">
          <Flame size={14} className="mx-auto text-orange-500 mb-0.5" />
          <div className="text-[10px] text-surface-500">Calories</div>
          <div className="text-sm font-semibold text-surface-700 dark:text-surface-200">{dish?.calories ?? 0}</div>
        </div>
      </div>

      {ingredients?.length > 0 && (
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5">
          <h4 className="text-xs font-semibold text-surface-700 dark:text-surface-200 mb-1.5">Ingredients</h4>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="text-[11px] text-surface-600 dark:text-surface-300 flex justify-between">
                <span className="truncate pr-1">{ing.name}</span>
                <span className="text-surface-500 font-mono">{ing.g}g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <EditableScoreBreakdown
        dish={dish}
        priorities={priorities}
        rankingMeta={rankingMeta}
        isOptimized={isOptimized}
        priceUnit={priceUnit}
        onApplyOverridesPatch={onApplyOverridesPatch}
        onResetAll={onResetAll}
        onEditingChange={onEditingChange}
        isDark={isDark}
      />

      {dish?.optimizedComment && (
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5 border-l-2 border-food-500">
          <p className="text-[10px] text-surface-500 mb-0.5 font-medium">💡 Optimization Tip</p>
          <p className="text-xs text-surface-600 dark:text-surface-300">{dish.optimizedComment}</p>
        </div>
      )}
    </div>
  );
}

