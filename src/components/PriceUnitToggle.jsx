import { motion } from 'framer-motion';
import { Scale, Flame, UtensilsCrossed } from 'lucide-react';

/**
 * Price unit options with icons and labels
 * Order: 1000kcal, 1kg, Serving
 */
const PRICE_UNIT_OPTIONS = [
  { 
    id: 'per1000kcal', 
    label: '1000kcal', 
    shortLabel: '1000kcal',
    icon: Flame,
    description: 'Price per 1000 calories',
    color: 'from-rose-400 to-pink-500',
  },
  { 
    id: 'per1kg', 
    label: '1kg', 
    shortLabel: '1kg',
    icon: Scale,
    description: 'Price per 1 kilogram',
    color: 'from-emerald-400 to-teal-500',
  },
  { 
    id: 'serving', 
    label: 'Serving', 
    shortLabel: 'srv',
    icon: UtensilsCrossed,
    description: 'Price per serving',
    color: 'from-amber-400 to-orange-500',
  },
];

/**
 * Price Unit Toggle Component
 * A beautiful segmented control for switching price display units
 */
export default function PriceUnitToggle({ priceUnit, onPriceUnitChange }) {
  return (
    <div className="relative flex items-center bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-0.5 border border-surface-300/50 dark:border-surface-700/50">
      {/* Options */}
      {PRICE_UNIT_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = priceUnit === option.id;
        
        return (
          <button
            key={option.id}
            onClick={() => onPriceUnitChange(option.id)}
            className={`
              relative flex items-center justify-center gap-1
              w-10 sm:w-[88px] py-1 px-0 sm:px-2 rounded-md
              text-xs font-semibold
              transition-colors duration-200
              ${isSelected 
                ? 'text-food-600 dark:text-food-300' 
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
              }
            `}
            title={option.description}
            aria-label={option.description}
          >
            {/* Animated background indicator (auto-sizes to the selected button) */}
            {isSelected && (
              <motion.div
                layoutId="price-unit-indicator"
                className="absolute inset-0 rounded-md bg-gradient-to-r from-food-500/30 to-food-600/30 border border-food-500/40"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}

            <span className="relative z-10 flex items-center justify-center gap-1">
            <Icon 
              size={12}
              className={`transition-transform duration-200 ${isSelected ? 'scale-110' : ''}`} 
            />
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden sr-only">{option.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

