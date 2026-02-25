import { Clock, DollarSign, Flame, Info, AlertTriangle } from '../icons/lucide';
import { formatTime } from './dishCardUtils';
import EditableScoreBreakdown from './EditableScoreBreakdown';
import { useTranslation } from 'react-i18next';

export default function OverviewSlide({ 
  dish, ingredients, unavailableIngredients, missingIngredients, missingPrices, priorities,
  rankingMeta, isOptimized, onApplyOverridesPatch, onResetAll, onEditingChange, isDark, priceUnit,
}) {
  const { t } = useTranslation();
  const hasUnavailableIngredients = unavailableIngredients?.length > 0;
  const hasDataWarnings = missingIngredients?.length > 0 || missingPrices?.length > 0;

  // Get price unit label
  const priceUnitLabel = priceUnit === 'per1kg' ? '/Kg' : priceUnit === 'per1000kcal' ? '/Kcal' : '/serving';

  return (
    <div className="space-y-3 sm:space-y-4">
      {hasUnavailableIngredients && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2.5 sm:p-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-300 mb-1 sm:mb-2">
            <Info size={14} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-semibold">{t('slides.overview.cannotPrepare')}</span>
          </div>
          <div className="text-xs sm:text-sm text-surface-600 dark:text-surface-300">
            {unavailableIngredients.map((ing, idx) => (
              <span key={idx} className="font-mono">{ing.displayName ?? ing.name} ({ing.grams}{t('slides.gramsUnit')}){idx < unavailableIngredients.length - 1 ? ', ' : ''}</span>
            ))}
          </div>
        </div>
      )}

      {hasDataWarnings && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 sm:p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300 mb-1 sm:mb-2">
            <AlertTriangle size={14} className="sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-semibold">{t('slides.overview.dataWarnings')}</span>
          </div>
          <div className="text-xs sm:text-sm text-surface-600 dark:text-surface-300">
            {missingIngredients?.length > 0 && <div>{t('slides.overview.missing')} {missingIngredients.join(', ')}</div>}
            {missingPrices?.length > 0 && <div>{t('slides.overview.noCosts')} {missingPrices.join(', ')}</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-1.5 sm:p-3 text-center">
          <Clock size={12} className="mx-auto text-cyan-500 mb-0.5 sm:w-4 sm:h-4" />
          <div className="text-[10px] sm:text-xs text-surface-500">{t('slides.overview.time')}</div>
          <div className="text-xs sm:text-base font-semibold text-surface-700 dark:text-surface-200">{formatTime(dish?.time ?? 0)}</div>
        </div>
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-1.5 sm:p-3 text-center">
          <DollarSign size={12} className="mx-auto text-emerald-500 mb-0.5 sm:w-4 sm:h-4" />
          <div className="text-[10px] sm:text-xs text-surface-500">{t('slides.overview.cost')}{priceUnitLabel}</div>
          <div className="text-xs sm:text-base font-semibold text-surface-700 dark:text-surface-200">${(dish?.cost ?? 0).toFixed(2)}</div>
        </div>
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-1.5 sm:p-3 text-center">
          <Flame size={12} className="mx-auto text-orange-500 mb-0.5 sm:w-4 sm:h-4" />
          <div className="text-[10px] sm:text-xs text-surface-500">{t('slides.overview.calories')}</div>
          <div className="text-xs sm:text-base font-semibold text-surface-700 dark:text-surface-200">{dish?.calories ?? 0}</div>
        </div>
      </div>

      {ingredients?.length > 0 && (
        <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5 sm:p-4">
          <h4 className="text-xs sm:text-sm font-semibold text-surface-700 dark:text-surface-200 mb-1.5 sm:mb-3">{t('slides.overview.ingredients')}</h4>
          <div className="grid grid-cols-2 gap-x-3 sm:gap-x-6 gap-y-0.5 sm:gap-y-1.5">
            {ingredients.map((ing, idx) => (
              <div key={idx} className="text-[11px] sm:text-sm text-surface-600 dark:text-surface-300 flex justify-between">
                <span className="truncate pr-1">{ing.displayName ?? ing.name}</span>
                <span className="text-surface-500 font-mono">{ing.g}{t('slides.gramsUnit')}</span>
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
    </div>
  );
}

