import { 
  Utensils, 
  Heart, 
  DollarSign, 
  Timer, 
  Flame, 
  Leaf,
  Cookie,
  Skull,
  Banknote,
  Hourglass,
  Zap,
  AlertTriangle
} from 'lucide-react';
import PrioritySlider from './PrioritySlider';

const PRIORITY_CONFIG = [
  { 
    key: 'taste', 
    positiveLabel: 'Tasty',
    negativeLabel: 'Niche',
    positiveIcon: Utensils, 
    negativeIcon: Cookie,
    color: 'from-amber-400 via-orange-500 to-orange-600',
    colorDark: 'from-amber-500 via-orange-500 to-orange-600',
    negativeColor: 'from-rose-400 via-rose-500 to-rose-600',
    negativeColorDark: 'from-rose-500 via-rose-500 to-rose-600',
    iconColor: 'text-amber-500',
    negativeIconColor: 'text-rose-500',
    description: 'Flavor & enjoyment'
  },
  { 
    key: 'health', 
    positiveLabel: 'Healthy',
    negativeLabel: 'Junky',
    positiveIcon: Heart, 
    negativeIcon: Skull,
    color: 'from-rose-400 via-red-500 to-red-600',
    colorDark: 'from-rose-500 via-red-500 to-red-600',
    negativeColor: 'from-purple-400 via-purple-500 to-purple-600',
    negativeColorDark: 'from-purple-500 via-purple-500 to-purple-600',
    iconColor: 'text-rose-500',
    negativeIconColor: 'text-purple-500',
    description: 'Nutritional value'
  },
  { 
    key: 'cheapness', 
    positiveLabel: 'Cheap',
    negativeLabel: 'Costly',
    positiveIcon: DollarSign, 
    negativeIcon: Banknote,
    color: 'from-emerald-400 via-emerald-500 to-emerald-600',
    colorDark: 'from-emerald-500 via-emerald-500 to-emerald-600',
    negativeColor: 'from-amber-400 via-amber-500 to-amber-600',
    negativeColorDark: 'from-amber-500 via-amber-500 to-amber-600',
    iconColor: 'text-emerald-500',
    negativeIconColor: 'text-amber-500',
    description: 'Lower cost'
  },
  { 
    key: 'speed', 
    positiveLabel: 'Fast',
    negativeLabel: 'Timey',
    positiveIcon: Timer, 
    negativeIcon: Hourglass,
    color: 'from-blue-400 via-blue-500 to-blue-600',
    colorDark: 'from-blue-500 via-blue-500 to-blue-600',
    negativeColor: 'from-indigo-400 via-indigo-500 to-indigo-600',
    negativeColorDark: 'from-indigo-500 via-indigo-500 to-indigo-600',
    iconColor: 'text-blue-500',
    negativeIconColor: 'text-indigo-500',
    description: 'Quick to make'
  },
  { 
    key: 'lowCalorie', 
    positiveLabel: 'Low-Cal',
    negativeLabel: 'High-Cal',
    positiveIcon: Flame, 
    negativeIcon: Zap,
    color: 'from-violet-400 via-purple-500 to-purple-600',
    colorDark: 'from-violet-500 via-purple-500 to-purple-600',
    negativeColor: 'from-orange-400 via-orange-500 to-red-600',
    negativeColorDark: 'from-orange-500 via-orange-500 to-red-600',
    iconColor: 'text-violet-500',
    negativeIconColor: 'text-orange-500',
    description: 'Lower kcal/100g'
  },
  { 
    key: 'ethics', 
    positiveLabel: 'Ethical',
    negativeLabel: 'Unethical',
    positiveIcon: Leaf, 
    negativeIcon: AlertTriangle,
    color: 'from-lime-400 via-green-500 to-emerald-600',
    colorDark: 'from-lime-500 via-green-500 to-emerald-600',
    negativeColor: 'from-red-400 via-red-500 to-red-700',
    negativeColorDark: 'from-red-500 via-red-500 to-red-700',
    iconColor: 'text-lime-500',
    negativeIconColor: 'text-red-500',
    description: 'Ethical sourcing'
  },
];

/**
 * Priorities board content - sliders and hint
 * Note: Inline callbacks are acceptable here since PrioritySlider uses local state
 * during drag and only commits to store on pointerup, minimizing re-render impact
 */
export default function PrioritiesBoard({ 
  priorityConfig,
  displayed, 
  percentages, 
  allPrioritiesZero, 
  handleSliderChange, 
  handleDragStart, 
  handleToggleReverse, 
  isDark 
}) {
  return (
    <div className="flex-1 bg-white dark:bg-surface-800 rounded-xl p-1.5 sm:p-2 border border-surface-300/50 dark:border-surface-700/50 flex flex-col">
      {/* Sliders grid */}
      <div className="flex justify-around items-start gap-0 sm:gap-0 overflow-x-auto hide-scrollbar">
        {priorityConfig.map(config => (
          <PrioritySlider
            key={config.key}
            config={config}
            value={displayed[config.key]}
            percentage={percentages[config.key]}
            onChange={(val) => handleSliderChange(config.key, val)}
            onDragStart={handleDragStart}
            onToggleReverse={() => handleToggleReverse(config.key)}
            isDark={isDark}
          />
        ))}
      </div>
      
      {/* Hint when all priorities are zero */}
      {allPrioritiesZero && (
        <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-300 text-center">
            💡 Adjust the sliders above to rank dishes by your preferences. 
            All dishes currently show a neutral score (50).
          </p>
        </div>
      )}
    </div>
  );
}

export { PRIORITY_CONFIG };

