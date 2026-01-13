import { analyzeAllDishesVariants, buildIngredientIndex, scoreAndSortDishes } from '../lib/RankingEngine.js';
import dishesData from '../../dishes.json';
import ingredientsData from '../../ingredients.json';

const ingredientIndex = buildIngredientIndex(ingredientsData);

let cached = {
  zoneId: null,
  overridesKey: null,
  tasteScoreMethod: null,
  analysisVariants: null,
};

function safeStringify(value) {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return String(Date.now());
  }
}

function ensureAnalysis(zoneId, overrides, tasteScoreMethod = 'taste_score') {
  const overridesKey = safeStringify(overrides ?? {});
  if (cached.analysisVariants && cached.zoneId === zoneId && cached.overridesKey === overridesKey && cached.tasteScoreMethod === tasteScoreMethod) {
    return cached.analysisVariants;
  }

  const analysisVariants = analyzeAllDishesVariants(
    dishesData,
    ingredientIndex,
    zoneId,
    overrides ?? {},
    tasteScoreMethod
  );

  cached = { zoneId, overridesKey, tasteScoreMethod, analysisVariants };
  return analysisVariants;
}

self.onmessage = (e) => {
  const msg = e?.data || {};
  if (msg?.type !== 'compute') return;

  const seq = msg.seq;
  const {
    selectedZone,
    overrides,
    isOptimized,
    priceUnit,
    priorities,
    tasteScoreMethod,
  } = msg.payload || {};

  try {
    const analysisVariants = ensureAnalysis(selectedZone, overrides, tasteScoreMethod || 'taste_score');
    const key = `${isOptimized ? 'optimized' : 'normal'}:${priceUnit || 'serving'}`;
    const base = analysisVariants?.variants?.[key] || { analyzed: [], datasetStats: {} };
    const rankedDishes = scoreAndSortDishes(base.analyzed || [], base.datasetStats || {}, priorities || {});

    const rankingMeta = {
      key,
      datasetStats: base.datasetStats || {},
      dists: {
        speedValuesSorted: base?.dists?.speedValuesSorted || [],
        speedHigherIsBetter: base?.dists?.speedHigherIsBetter ?? false,
        lowCalorieValuesSorted: analysisVariants?.meta?.lowCalorieValuesSorted || [],
        lowCalorieHigherIsBetter: analysisVariants?.meta?.lowCalorieHigherIsBetter ?? false,
        satietyValuesSorted: analysisVariants?.meta?.satietyValuesSorted || [],
        satietyHigherIsBetter: analysisVariants?.meta?.satietyHigherIsBetter ?? true,
      },
    };

    self.postMessage({ type: 'result', seq, rankedDishes, rankingMeta });
  } catch (err) {
    self.postMessage({
      type: 'error',
      seq,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};


