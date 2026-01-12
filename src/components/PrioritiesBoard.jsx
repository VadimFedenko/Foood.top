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
    color: 'from-orange-300 to-orange-500',
    colorDark: 'from-orange-500 to-orange-400',
    negativeColor: 'from-rose-300 to-rose-500',
    negativeColorDark: 'from-rose-500 to-rose-400',
    iconColor: 'text-orange-400',
    negativeIconColor: 'text-rose-400',
    description: 'Flavor & enjoyment'
  },
  { 
    key: 'health', 
    positiveLabel: 'Healthy',
    negativeLabel: 'Junky',
    positiveIcon: Heart, 
    negativeIcon: Skull,
    color: 'from-red-300 to-red-500',
    colorDark: 'from-red-500 to-red-400',
    negativeColor: 'from-purple-300 to-purple-500',
    negativeColorDark: 'from-purple-500 to-purple-400',
    iconColor: 'text-red-400',
    negativeIconColor: 'text-purple-400',
    description: 'Nutritional value'
  },
  { 
    key: 'cheapness', 
    positiveLabel: 'Cheap',
    negativeLabel: 'Costly',
    positiveIcon: DollarSign, 
    negativeIcon: Banknote,
    color: 'from-emerald-300 to-emerald-500',
    colorDark: 'from-emerald-500 to-emerald-400',
    negativeColor: 'from-amber-300 to-amber-500',
    negativeColorDark: 'from-amber-500 to-amber-400',
    iconColor: 'text-emerald-400',
    negativeIconColor: 'text-amber-400',
    description: 'Lower cost'
  },
  { 
    key: 'speed', 
    positiveLabel: 'Speedy',
    negativeLabel: 'Timey',
    positiveIcon: Timer, 
    negativeIcon: Hourglass,
    color: 'from-blue-300 to-blue-500',
    colorDark: 'from-blue-500 to-blue-400',
    negativeColor: 'from-indigo-300 to-indigo-500',
    negativeColorDark: 'from-indigo-500 to-indigo-400',
    iconColor: 'text-blue-400',
    negativeIconColor: 'text-indigo-400',
    description: 'Quick to make'
  },
  { 
    key: 'lowCalorie', 
    positiveLabel: 'Low-Cal',
    negativeLabel: 'High-Cal',
    positiveIcon: Flame, 
    negativeIcon: Zap,
    color: 'from-purple-300 to-purple-500',
    colorDark: 'from-purple-500 to-purple-400',
    negativeColor: 'from-orange-300 to-red-500',
    negativeColorDark: 'from-orange-500 to-red-400',
    iconColor: 'text-purple-400',
    negativeIconColor: 'text-orange-400',
    description: 'Lower kcal/100g'
  },
  { 
    key: 'ethics', 
    positiveLabel: 'Ethical',
    negativeLabel: 'Unethical',
    positiveIcon: Leaf, 
    negativeIcon: AlertTriangle,
    color: 'from-lime-300 to-green-500',
    colorDark: 'from-lime-500 to-green-400',
    negativeColor: 'from-red-300 to-red-600',
    negativeColorDark: 'from-red-600 to-red-500',
    iconColor: 'text-lime-400',
    negativeIconColor: 'text-red-400',
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
    <div className="flex-1 bg-white/60 dark:bg-surface-800/80 rounded-xl p-1.5 sm:p-2 border border-surface-300/50 dark:border-surface-700/50 shadow-sm dark:shadow-none flex flex-col">
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
        <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-300/90 text-center">
            💡 Adjust the sliders above to rank dishes by your preferences. 
            All dishes currently show a neutral score (50).
          </p>
        </div>
      )}
    </div>
  );
}

export { PRIORITY_CONFIG };

