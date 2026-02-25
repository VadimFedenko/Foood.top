import { analyzeAllDishesVariants, buildIngredientIndex, scoreAndSortDishes } from '../lib/RankingEngine.js';

let dataUrls = {
  dishesUrl: null,
  ingredientsUrl: null,
};

let dishesData = null;
let ingredientIndex = null;

let cached = {
  zoneId: null,
  overridesKey: null,
  tasteScoreMethod: null,
  analysisVariants: null,
};

function defaultUrlFromWorkerLocation(fileName) {
  // In production, worker is served from `/assets/...`, so `../fileName` resolves to `/<fileName>`.
  // In dev, this may not work reliably, so we prefer URLs passed from the main thread via `init`.
  try {
    return new URL(`../${fileName}`, self.location.href).toString();
  } catch {
    return fileName;
  }
}

async function fetchJson(url) {
  const res = await fetch(url, { cache: 'force-cache' });
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
  return await res.json();
}

async function ensureDataLoaded() {
  if (dishesData && ingredientIndex) return;

  const dishesUrl = dataUrls.dishesUrl || defaultUrlFromWorkerLocation('dishes.json');
  const ingredientsUrl = dataUrls.ingredientsUrl || defaultUrlFromWorkerLocation('ingredients.json');

  const [dishes, ingredients] = await Promise.all([
    dishesData ? Promise.resolve(dishesData) : fetchJson(dishesUrl),
    ingredientIndex ? Promise.resolve(null) : fetchJson(ingredientsUrl),
  ]);

  if (!dishesData) dishesData = dishes;
  if (!ingredientIndex) ingredientIndex = buildIngredientIndex(ingredients);
}

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

self.onmessage = async (e) => {
  const msg = e?.data || {};

  if (msg?.type === 'init') {
    const next = msg?.dataUrls || {};
    dataUrls = {
      dishesUrl: typeof next.dishesUrl === 'string' ? next.dishesUrl : dataUrls.dishesUrl,
      ingredientsUrl: typeof next.ingredientsUrl === 'string' ? next.ingredientsUrl : dataUrls.ingredientsUrl,
    };
    if (msg?.preload) {
      try {
        await ensureDataLoaded();
      } catch {
        // ignore preload errors; compute will surface error to UI
      }
    }
    return;
  }

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
    await ensureDataLoaded();
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
      // Total number of dishes available in the current ranking variant
      totalDishes: Array.isArray(base.analyzed) ? base.analyzed.length : 0,
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


