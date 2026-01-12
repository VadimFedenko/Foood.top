import { motion } from 'framer-motion';
import { Leaf, Skull, Frown } from 'lucide-react';
import { getEthicsColor } from './dishCardUtils';
import { normalizeIngredientName } from '../lib/RankingEngine';

function getEthicsIcon(index) {
  if (index < 2) return Skull;
  if (index < 4) return Frown;
  return Leaf;
}

export default function EthicsSlide({ dish, ingredients, ingredientIndex }) {
  if (!ingredients?.length || !ingredientIndex) {
    return <div className="flex items-center justify-center h-40 text-surface-500 text-sm">No ingredient data available</div>;
  }

  const ingredientsWithEthics = ingredients
    .map((ing) => {
      const ingData = ingredientIndex.get(normalizeIngredientName(ing.name));
      const ethicsIndex = ingData?.ethics_index;
      if (ethicsIndex === null || ethicsIndex === undefined) return null;
      return {
        name: ing.name,
        grams: ing.g,
        ethicsIndex,
        ethicsReason: ingData?.ethics_reason ?? 'No ethics data available for this ingredient.',
      };
    })
    .filter(Boolean);

  const ethicsColors = getEthicsColor(dish?.ethics ?? 5);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-2.5 bg-surface-100/80 dark:bg-surface-800/80 rounded-lg">
        <div className="flex items-center gap-2">
          <Leaf size={16} className={ethicsColors.text} />
          <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">{dish?.name} Ethics Breakdown</span>
        </div>
        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold text-white ${ethicsColors.badge}`}>
          Overall {(dish?.ethics ?? 5).toFixed(1)}/10
        </div>
      </div>

      <div className="space-y-1 overflow-y-auto overflow-x-hidden pr-1">
        {ingredientsWithEthics.map((ing, idx) => {
          const colors = getEthicsColor(ing.ethicsIndex ?? 5);
          const Icon = getEthicsIcon(ing.ethicsIndex ?? 5);

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`rounded-lg p-2 border ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon size={12} className={`${colors.text} flex-shrink-0`} />
                  <span className="font-semibold text-surface-800 dark:text-surface-100 text-xs">
                    {ing.grams}g {ing.name}
                  </span>
                </div>
                {ing.ethicsIndex !== null && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white flex-shrink-0 ${colors.badge}`}>
                    {ing.ethicsIndex}/10
                  </span>
                )}
              </div>
              <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed">
                {ing.ethicsReason}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

