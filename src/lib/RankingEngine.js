/**
 * RankingEngine.js
 *
 * Backwards-compatibility barrel.
 * The actual implementation lives in `src/lib/ranking/engine.js`.
 *
 * This keeps existing imports working while we split the engine by responsibility.
 */

export * from './ranking/engine.js';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

// Economic zones available in the system (must match ingredients.json keys)
export const ECONOMIC_ZONES = {
  east_euro_agrarian: { name: 'Eastern Europe', emoji: '🌾', color: '#4ade80' }, // Bright green for agrarian region
  west_eu_industrial: { name: 'Western Europe', emoji: '🏭', color: '#3b82f6' }, // Blue for industrial region
  northern_import: { name: 'Northern Import', emoji: '❄️', color: '#a78bfa' }, // Purple for northern regions
  mediterranean: { name: 'Mediterranean', emoji: '🌊', color: '#06b6d4' }, // Cyan for Mediterranean
  north_american: { name: 'North America', emoji: '🗽', color: '#f59e0b' }, // Orange for North America
  latam_agrarian: { name: 'Latin America', emoji: '🌿', color: '#22c55e' }, // Green for Latin America (differs from Eastern Europe)
  asian_rice_labor: { name: 'Asia (Rice Belt)', emoji: '🍚', color: '#ef4444' }, // Red for Asian rice belt
  developed_asia: { name: 'Developed Asia', emoji: '🏯', color: '#ec4899' }, // Pink for developed Asia
  mena_arid: { name: 'MENA Region', emoji: '🏜️', color: '#f97316' }, // Orange-brown for arid region
  oceanic: { name: 'Oceania', emoji: '🦘', color: '#14b8a6' }, // Cyan for Oceania (differs from Mediterranean)
  subsaharan_subsistence: { name: 'Sub-Saharan Africa', emoji: '🌍', color: '#eab308' }, // Yellow for Africa
};

// Default fallback zone when specific zone price is missing
const FALLBACK_ZONE = 'west_eu_industrial';

// Cooking method health penalty coefficients
// Higher values = healthier preparation methods
export const COOKING_STATE_COEFS = {
  raw: 1.0,
  fermented: 1.1,
  steamed: 0.98,
  boiled: 0.97,
  baked: 0.94,
  roasted: 0.93,
  grilled: 0.92,
  fried: 0.92,
  deep_fried: 0.7,
  // Additional states that might appear in data
  // NOTE: dishes.json contains a lot of "prep-like" states (chopped, sliced, etc).
  // We treat them as neutral (≈raw) unless there's a clear reason to penalize.
  melted: 0.9,
  toasted: 0.8,
  cooked: 0.8,
  simmered: 0.8,
  stewed: 0.8,
  braised: 0.75,
  battered: 0.6,
  warmed: 0.9,
  heated: 0.9,
  marinated: 1.0,
  pickled: 1.05,
  infused: 1.0,
  soaked: 1.0,
  fresh: 1.0,
  dry: 1.0,
  // Prep states (no real cooking impact)
  chopped: 1.0,
  sliced: 1.0,
  minced: 1.0,
  grated: 1.0,
  julienned: 1.0,
  ground: 1.0,
  mixed: 1.0,
  pasted: 1.0,
  blanched: 0.9,
  default: 0.85,      // Fallback for unknown states
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Safely parse a cooking state to its coefficient
 * @param {string} state - The cooking state from recipe
 * @returns {number} The health coefficient for this cooking method
 */
function getCookingCoef(state) {
  if (!state) return COOKING_STATE_COEFS.default;
  // Normalize: lowercase, trim, and strip diacritics (e.g. "sautéed" -> "sauteed")
  const normalized = state
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  // Common aliases
  const alias = {
    sauteed: 'sauteed',
  };

  const key = alias[normalized] ?? normalized;
  if (key === 'sauteed') return 0.75;
  return COOKING_STATE_COEFS[key] ?? COOKING_STATE_COEFS.default;
}

/**
 * Normalize ingredient name for matching (case-insensitive, space normalization)
 * Normalizes spaces around commas and parentheses to handle variations like:
 * "Seafood Mix (mussels,shrimp,clams)" vs "Seafood Mix (mussels, shrimp, clams)"
 * @param {string} name - Ingredient name
 * @returns {string} Normalized name
 */
function normalizeIngredientName(name) {
  if (!name) return '';
  
  // Convert to lowercase and trim
  let normalized = name.toLowerCase().trim();
  
  // Normalize spaces around commas: remove all spaces around comma, then add one space after
  // This handles: "word,word", "word, word", "word ,word", "word , word" -> all become "word, word"
  normalized = normalized.replace(/\s*,\s*/g, ', ');
  
  // Normalize spaces inside parentheses: ensure consistent spacing
  // Handle content inside parentheses separately to normalize commas there too
  normalized = normalized.replace(/\(([^)]+)\)/g, (match, content) => {
    // Normalize spaces around commas inside parentheses
    const normalizedContent = content.replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim();
    return `(${normalizedContent})`;
  });
  
  // Normalize multiple spaces to single space (final pass)
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
}

/**
 * Build an index map for O(1) ingredient lookups
 * @param {Array} ingredientsDb - The ingredients database array
 * @returns {Map<string, Object>} Map of normalized name -> ingredient object
 */
export function buildIngredientIndex(ingredientsDb) {
  const index = new Map();
  if (!ingredientsDb) return index;
  
  for (const ing of ingredientsDb) {
    if (ing.ingredient) {
      const key = normalizeIngredientName(ing.ingredient);
      // Store both normalized and original for potential fallback
      index.set(key, ing);
    }
  }
  return index;
}

/**
 * Find an ingredient in the database (case-insensitive match with space normalization)
 * Supports both array (legacy) and Map (optimized) lookups
 * @param {string} name - Ingredient name from recipe
 * @param {Array|Map} ingredientsDb - The ingredients database or index Map
 * @returns {Object|null} The matched ingredient or null
 */
function findIngredient(name, ingredientsDb) {
  if (!name || !ingredientsDb) return null;
  const searchName = normalizeIngredientName(name);
  
  // If it's a Map (optimized path), use O(1) lookup
  if (ingredientsDb instanceof Map) {
    return ingredientsDb.get(searchName) || null;
  }
  
  // Legacy array path (O(n) lookup) with normalization
  return ingredientsDb.find(ing => 
    normalizeIngredientName(ing.ingredient) === searchName
  ) || null;
}

// ============================================================================
// COST CALCULATION
// ============================================================================

/**
 * Calculate the total cost of a dish based on gross weight and zone pricing.
 * 
 * Formula:
 * 1. For each ingredient: Gross Weight = Net Weight / yield_ratio
 * 2. Item Cost = (Gross Weight / 1000) * Price_per_kg
 * 3. Sum all ingredient costs
 * 
 * @param {Object} dish - The dish object from dishes.json
 * @param {string} zoneId - The economic zone ID
 * @param {Array} ingredientsDb - The ingredients database
 * @returns {Object} { totalCost, breakdown, missingIngredients }
 */
export function calculateDishCost(dish, zoneId, ingredientsDb) {
  const breakdown = [];
  const missingIngredients = [];
  const missingPrices = [];
  const unavailableIngredients = [];
  let totalCost = 0;

  if (!dish?.ingredients || !ingredientsDb) {
    return { totalCost: 0, breakdown: [], missingIngredients: [], missingPrices: [], unavailableIngredients: [] };
  }

  for (const item of dish.ingredients) {
    const ingredient = findIngredient(item.name, ingredientsDb);
    
    if (!ingredient) {
      missingIngredients.push(item.name);
      continue;
    }

    // Get yield ratio (default to 1.0 if missing)
    const yieldRatioRaw = ingredient.technical_specs?.yield_ratio;
    // Yield ratio should be in (0, 1]; clamp to avoid division by 0 / negative / extreme values
    const yieldRatio = isFiniteNumber(yieldRatioRaw)
      ? clamp(yieldRatioRaw, 0.05, 1.0)
      : 1.0;
    
    // Calculate gross weight (what we need to buy)
    const netWeight = isFiniteNumber(item.g) ? item.g : 0;
    const grossWeight = netWeight > 0 ? (netWeight / yieldRatio) : 0;

    // Get price for zone
    const zonePrice = ingredient.prices?.[zoneId];
    
    // Check if ingredient is unavailable in this zone (price is null)
    if (zonePrice === null) {
      unavailableIngredients.push({
        name: item.name,
        grams: netWeight,
      });
      breakdown.push({
        name: item.name,
        state: item.state,
        netWeight,
        grossWeight,
        yieldRatio,
        pricePerKg: null,
        cost: 0,
      });
      continue;
    }

    // Get price with fallback if price is missing or invalid in selected zone
    let pricePerKg = zonePrice;
    if (!pricePerKg || pricePerKg <= 0) {
      pricePerKg = ingredient.prices?.[FALLBACK_ZONE] || 0;
    }

    // Calculate item cost
    const itemCost = pricePerKg > 0 ? ((grossWeight / 1000) * pricePerKg) : 0;
    totalCost += itemCost;

    // Only add to missingPrices if price is missing everywhere (data error)
    if (!pricePerKg || pricePerKg <= 0) {
      missingPrices.push(item.name);
    }

    breakdown.push({
      name: item.name,
      state: item.state,
      netWeight,
      grossWeight,
      yieldRatio,
      pricePerKg,
      cost: itemCost,
    });
  }

  return {
    totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimals
    breakdown,
    missingIngredients,
    missingPrices,
    unavailableIngredients,
  };
}

// ============================================================================
// HEALTH CALCULATION
// ============================================================================

/**
 * Calculate weighted health index for a dish.
 * Each ingredient's health_index is multiplied by its cooking method coefficient
 * and weighted by the ingredient's proportion (by weight) in the dish.
 * 
 * @param {Object} dish - The dish object
 * @param {Array} ingredientsDb - The ingredients database
 * @returns {number} Health score 0-10
 */
export function calculateDishHealth(dish, ingredientsDb) {
  if (!dish?.ingredients?.length || !ingredientsDb) return 5; // Neutral default

  let totalWeight = 0;
  let weightedHealthSum = 0;

  for (const item of dish.ingredients) {
    const ingredient = findIngredient(item.name, ingredientsDb);
    const weight = item.g || 0;
    
    if (!ingredient || weight <= 0) continue;

    // Skip ingredients with null health_index (they should not be included in health calculation)
    if (ingredient.health_index === null) continue;

    const baseHealth = ingredient.health_index ?? 5;
    const cookingCoef = getCookingCoef(item.state);
    
    // Apply cooking penalty/bonus to health score
    const adjustedHealth = Math.min(10, Math.max(0, baseHealth * cookingCoef));
    
    weightedHealthSum += adjustedHealth * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 5;
  return Math.round((weightedHealthSum / totalWeight) * 10) / 10;
}

// ============================================================================
// CALORIES CALCULATION
// ============================================================================

/**
 * Calculate total calories for a dish.
 * Uses the net weight from the recipe and cal_per_g from ingredients.
 * 
 * @param {Object} dish - The dish object
 * @param {Array} ingredientsDb - The ingredients database
 * @returns {number} Total calories
 */
export function calculateDishCalories(dish, ingredientsDb) {
  if (!dish?.ingredients?.length || !ingredientsDb) return 0;

  let totalCalories = 0;

  for (const item of dish.ingredients) {
    const ingredient = findIngredient(item.name, ingredientsDb);
    if (!ingredient) continue;

    const netWeight = item.g || 0;
    const calPerGram = ingredient.cal_per_g ?? 0;
    
    totalCalories += netWeight * calPerGram;
  }

  return Math.round(totalCalories);
}

// ============================================================================
// WEIGHT CALCULATION
// ============================================================================

/**
 * Calculate total net weight of a dish (sum of all ingredient grams).
 * This is the final weight of the prepared dish.
 * 
 * @param {Object} dish - The dish object
 * @returns {number} Total weight in grams
 */
export function calculateDishWeight(dish) {
  if (!dish?.ingredients?.length) return 0;

  let totalWeight = 0;
  for (const item of dish.ingredients) {
    totalWeight += item.g || 0;
  }

  return Math.round(totalWeight);
}

// ============================================================================
// PRICE UNIT CONVERSION
// ============================================================================

/**
 * Available price display units
 */
export const PRICE_UNITS = {
  serving: { id: 'serving', label: 'Serving', shortLabel: 'srv' },
  per1kg: { id: 'per1kg', label: '1kg', shortLabel: '1kg' },
  per1000kcal: { id: 'per1000kcal', label: '1000kcal', shortLabel: 'kcal' },
};

/**
 * Convert dish cost to specified unit.
 * 
 * Formulas:
 * - serving: original cost (no conversion)
 * - per1kg: cost / (weight / 1000) = cost * 1000 / weight
 * - per1000kcal: cost / (calories / 1000)
 * 
 * @param {number} cost - Total dish cost
 * @param {number} weight - Total dish weight in grams
 * @param {number} calories - Total dish calories
 * @param {string} unit - Price unit ('serving', 'per1kg', 'per1000kcal')
 * @returns {number} Converted price
 */
export function convertPriceToUnit(cost, weight, calories, unit) {
  if (!isFiniteNumber(cost) || cost <= 0) return 0;

  switch (unit) {
    case 'per1kg':
      // Price per 1 kilogram (1000 grams)
      if (!isFiniteNumber(weight) || weight <= 0) return cost;
      return (cost * 1000) / weight;
    
    case 'per1000kcal':
      // Price per 1000 kcal
      if (!isFiniteNumber(calories) || calories <= 0) return cost;
      return cost / (calories / 1000);
    
    case 'serving':
    default:
      // Original price per serving
      return cost;
  }
}

// ============================================================================
// ETHICS CALCULATION
// ============================================================================

/**
 * Calculate weighted ethics index for a dish.
 * Similar to health calculation but uses ethics_index.
 * 
 * @param {Object} dish - The dish object
 * @param {Array} ingredientsDb - The ingredients database
 * @returns {number} Ethics score 0-10
 */
export function calculateDishEthics(dish, ingredientsDb) {
  if (!dish?.ingredients?.length || !ingredientsDb) return 5;

  let totalWeight = 0;
  let weightedEthicsSum = 0;

  for (const item of dish.ingredients) {
    const ingredient = findIngredient(item.name, ingredientsDb);
    const weight = item.g || 0;
    
    if (!ingredient || weight <= 0) continue;

    const ethics = ingredient.ethics_index ?? 5;
    weightedEthicsSum += ethics * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 5;
  return Math.round((weightedEthicsSum / totalWeight) * 10) / 10;
}

// ============================================================================
// TIME CALCULATION
// ============================================================================

/**
 * Calculate total cooking time for a dish.
 * 
 * @param {Object} dish - The dish object
 * @param {boolean} useOptimized - Whether to use optimized times
 * @returns {number} Total time in minutes
 */
export function calculateDishTime(dish, useOptimized = false) {
  if (useOptimized) {
    const prep = dish.prep_t_optimized ?? dish.prep_t ?? 0;
    const cook = dish.cook_t_optimized ?? dish.cook_t ?? 0;
    return prep + cook;
  }

  const prep = dish.prep_t ?? 0;
  const cook = dish.cook_t ?? 0;
  return prep + cook || 30; // Default 30 mins if both are 0
}

// ============================================================================
// COMPLETE DISH ANALYSIS
// ============================================================================

/**
 * Analyze a dish and return all computed metrics.
 * This is the main entry point for getting complete dish data.
 * 
 * @param {Object} dish - The dish object
 * @param {string} zoneId - Economic zone ID
 * @param {Array} ingredientsDb - The ingredients database
 * @param {boolean} useOptimizedTime - Whether to use optimized cooking times
 * @param {Object} overrides - User overrides from localStorage { taste, time, price }
 * @param {string} priceUnit - Price unit for ranking ('serving', 'per1kg', 'per1000kcal')
 * @returns {Object} Complete dish analysis with all metrics
 */
export function analyzeDish(dish, zoneId, ingredientsDb, useOptimizedTime = false, overrides = {}, priceUnit = 'serving') {
  const costResult = calculateDishCost(dish, zoneId, ingredientsDb);
  const health = calculateDishHealth(dish, ingredientsDb);
  const calories = calculateDishCalories(dish, ingredientsDb);
  const weight = calculateDishWeight(dish);
  const kcalPer100g = (isFiniteNumber(calories) && calories > 0 && isFiniteNumber(weight) && weight > 0)
    ? (calories / weight) * 100
    : 0;
  const ethics = calculateDishEthics(dish, ingredientsDb);
  const time = calculateDishTime(dish, useOptimizedTime);

  // Extract taste and satiety from dish (with overrides)
  const taste = overrides.taste ?? dish.taste_score ?? 5;
  const satiety = dish.satiety_index ?? 5;
  
  // Base cost (per serving)
  const baseCost = overrides.price ?? costResult.totalCost;
  
  // Calculate per-unit prices (for display)
  const costPerServing = baseCost;
  const costPer1kg = convertPriceToUnit(baseCost, weight, calories, 'per1kg');
  const costPer1000kcal = convertPriceToUnit(baseCost, weight, calories, 'per1000kcal');
  
  // The "cost" used for ranking depends on the selected price unit
  const rankingCost = convertPriceToUnit(baseCost, weight, calories, priceUnit);
  
  const finalTime = overrides.time ?? time;

  return {
    name: dish.dish || dish.name,
    description: dish.desc || '',
    
    // Raw metrics
    cost: rankingCost, // Used for ranking - depends on selected unit
    baseCost: costPerServing, // Original cost per serving
    health,
    calories,
    weight, // Total weight in grams
    kcalPer100g, // Calories density
    ethics,
    time: finalTime,
    taste,
    satiety,
    
    // Per-unit prices for display
    prices: {
      serving: costPerServing,
      per1kg: costPer1kg,
      per1000kcal: costPer1000kcal,
    },
    
    // Cost breakdown for detailed view
    costBreakdown: costResult.breakdown,
    missingIngredients: costResult.missingIngredients,
    missingPrices: costResult.missingPrices,
    unavailableIngredients: costResult.unavailableIngredients,
    
    // Original dish data for reference
    originalDish: dish,
    
    // Track which values have been overridden
    hasOverrides: {
      taste: overrides.taste !== undefined,
      time: overrides.time !== undefined,
      price: overrides.price !== undefined,
    },
    
    // Time breakdown
    prepTime: useOptimizedTime 
      ? (dish.prep_t_optimized ?? dish.prep_t ?? 0)
      : (dish.prep_t ?? 0),
    cookTime: useOptimizedTime
      ? (dish.cook_t_optimized ?? dish.cook_t ?? 0)
      : (dish.cook_t ?? 0),
    optimizedComment: dish.comment || '',
  };
}

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Percentile normalizer used where "relative position in dataset" is what user expects:
 * - speed (time): relative "faster than X%" feeling (robust vs outliers)
 * - satiety: relative "top X%" feeling
 * - lowCalorie: relative "lowest calories" feeling
 */

function mean(values) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stddev(values, mu) {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + (v - mu) * (v - mu), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function quantileFromSorted(sorted, q) {
  if (!sorted.length) return 0;
  if (q <= 0) return sorted[0];
  if (q >= 1) return sorted[sorted.length - 1];
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  const a = sorted[base];
  const b = sorted[Math.min(base + 1, sorted.length - 1)];
  return a + (b - a) * rest;
}

function buildDistributionStats(valuesSorted) {
  const mu = mean(valuesSorted);
  const sigma = stddev(valuesSorted, mu);
  return {
    count: valuesSorted.length,
    min: valuesSorted.length ? valuesSorted[0] : 0,
    max: valuesSorted.length ? valuesSorted[valuesSorted.length - 1] : 0,
    mean: mu,
    stddev: sigma,
    quantiles: {
      p01: quantileFromSorted(valuesSorted, 0.01),
      p05: quantileFromSorted(valuesSorted, 0.05),
      p10: quantileFromSorted(valuesSorted, 0.10),
      p25: quantileFromSorted(valuesSorted, 0.25),
      p50: quantileFromSorted(valuesSorted, 0.50),
      p75: quantileFromSorted(valuesSorted, 0.75),
      p90: quantileFromSorted(valuesSorted, 0.90),
      p95: quantileFromSorted(valuesSorted, 0.95),
      p99: quantileFromSorted(valuesSorted, 0.99),
    },
  };
}

function buildPercentileScoreMap(values, { higherIsBetter = true } = {}) {
  const finite = values.filter(isFiniteNumber);
  const valuesSorted = [...finite].sort((a, b) => a - b);
  const stats = buildDistributionStats(valuesSorted);

  // If we have <2 valid points, percentile is undefined; treat as neutral.
  if (valuesSorted.length < 2) {
    return {
      valuesSorted,
      stats,
      scoreMap: new Map(),
      scoreForValue: (v) => (isFiniteNumber(v) ? 5 : 5),
    };
  }

  // Lower/upper bound helpers for fallback percentile computation
  function lowerBound(arr, x) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  function upperBound(arr, x) {
    let lo = 0, hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (arr[mid] <= x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  // Build avg-rank per unique value
  const scoreMap = new Map();
  let i = 0;
  const n = valuesSorted.length;
  while (i < n) {
    const v = valuesSorted[i];
    let j = i;
    while (j + 1 < n && valuesSorted[j + 1] === v) j++;
    const avgIdx = (i + j) / 2;
    const basePercentile = avgIdx / (n - 1); // 0..1 (worst..best) for ascending
    const percentile = higherIsBetter ? basePercentile : (1 - basePercentile);
    const score = clamp(percentile * 10, 0, 10);
    scoreMap.set(v, score);
    i = j + 1;
  }

  return {
    valuesSorted,
    stats,
    scoreMap,
    scoreForValue: (v) => {
      if (!isFiniteNumber(v)) return 5;
      // Fast path: exact match (most cases for dataset-driven values).
      const direct = scoreMap.get(v);
      if (direct !== undefined) return direct;

      // Standardized fallback: compute percentile for any numeric value (including unseen floats).
      // Uses rank interpolation between nearest neighbors to avoid hard step jumps.
      const n = valuesSorted.length;
      if (n < 2) return 5;

      if (v <= valuesSorted[0]) return higherIsBetter ? 0 : 10;
      if (v >= valuesSorted[n - 1]) return higherIsBetter ? 10 : 0;

      const lo = lowerBound(valuesSorted, v);
      const hi = upperBound(valuesSorted, v);

      let idx;
      if (lo < hi) {
        // v exists in array (shouldn't happen if map missed due to float-key mismatch, but handle anyway)
        idx = (lo + (hi - 1)) / 2;
      } else {
        // v between (lo-1) and lo
        const a = valuesSorted[lo - 1];
        const b = valuesSorted[lo];
        const t = b === a ? 0.5 : (v - a) / (b - a);
        idx = (lo - 1) + clamp(t, 0, 1);
      }

      const basePercentile = idx / (n - 1); // 0..1 (worst..best) for ascending
      const percentile = higherIsBetter ? basePercentile : (1 - basePercentile);
      return clamp(percentile * 10, 0, 10);
    },
  };
}

function isValidForDistribution(value, { requirePositive = false } = {}) {
  if (!isFiniteNumber(value)) return false;
  if (requirePositive) return value > 0;
  return true;
}

function normalizeRaw10(value, fallback = 5) {
  return clamp(isFiniteNumber(value) ? value : fallback, 0, 10);
}

// Cheapness: 10 = cheapest, 0 = most expensive (log-scaled, deterministic).
function normalizeCostToCheapness(cost, minCost, maxCost) {
  if (!isFiniteNumber(cost) || cost <= 0) return 5;
  if (!isFiniteNumber(minCost) || !isFiniteNumber(maxCost)) return 5;
  if (minCost <= 0 || maxCost <= 0) return 5;
  if (minCost >= maxCost) return 5;

  const logMin = Math.log(minCost);
  const logMax = Math.log(maxCost);
  const logCost = Math.log(cost);
  if (logMax === logMin) return 5;

  // cheapest -> 10, expensive -> 0
  const score = 10 * (logMax - logCost) / (logMax - logMin);
  return clamp(score, 0, 10);
}

// Speed: 10 = fastest (lowest minutes), 0 = slowest (highest minutes), deterministic.
function normalizeTimeToSpeed(time, minTime, maxTime) {
  if (!isFiniteNumber(time) || time <= 0) return 5;
  if (!isFiniteNumber(minTime) || !isFiniteNumber(maxTime)) return 5;
  if (minTime <= 0 || maxTime <= 0) return 5;
  if (minTime >= maxTime) return 5;

  const score = 10 * (maxTime - time) / (maxTime - minTime);
  return clamp(score, 0, 10);
}

// ============================================================================
// FINAL SCORING ENGINE
// ============================================================================

/**
 * Priority weights interface:
 * - taste: -10 to +10 (positive = want high taste)
 * - health: -10 to +10 (positive = want healthy)
 * - cheapness: -10 to +10 (positive = want cheap, so we INVERT price score)
 * - speed: -10 to +10 (positive = want fast, so we INVERT time score)
 * - satiety: -10 to +10 (positive = want filling)
 * - lowCalorie: -10 to +10 (positive = want low calories, so we INVERT)
 * - ethics: -10 to +10 (positive = want ethical)
 */

/**
 * Calculate final weighted score for a dish.
 * 
 * New strict model (predictable):
 * - Every criterion is normalized via dataset percentiles to a 0..10 score BEFORE ranking.
 * - Priority sign does NOT create negative points; it only reverses the criterion:
 *   applied = 10 - base (e.g. 9 -> 1, 8 -> 2).
 * - Each criterion contributes points on a 0..|priority| scale:
 *   points = (applied/10) * |priority|
 * - maxPoints = sum(|priority|)
 * - finalScore = (sum(points) / maxPoints) * 100
 * 
 * @param {Object} dishAnalysis - Output from analyzeDish()
 * @param {Object} priorities - User priority weights { taste, health, cheapness, speed, satiety, lowCalorie, ethics }
 * @param {Object} datasetStats - { minPrice, maxPrice, minCalories, maxCalories }
 * @returns {Object} { score, breakdown }
 */
export function calculateFinalScore(dishAnalysis, priorities, datasetStats) {
  const base = dishAnalysis.normalizedBase ?? {};

  // If no weights are active, return neutral score (legacy behavior in UI)
  const activeKeys = Object.keys(priorities || {}).filter((k) => (priorities?.[k] ?? 0) !== 0);
  if (activeKeys.length === 0) {
    return {
      score: 50,
      scoreRaw: 50,
      normalized: base,
      contributions: {},
      breakdown: {},
    };
  }

  let maxPoints = 0;
  let pointsSum = 0;

  const breakdown = {};
  const contributions = {};
  const normalizedApplied = {};

  const rawValuesByKey = {
    taste: dishAnalysis.taste,
    health: dishAnalysis.health,
    cheapness: dishAnalysis.cost,
    speed: dishAnalysis.time,
    satiety: dishAnalysis.satiety,
    lowCalorie: dishAnalysis.kcalPer100g,
    ethics: dishAnalysis.ethics,
  };

  for (const key of activeKeys) {
    // Priorities must be strictly within [-10..10]
    const w = clamp(priorities?.[key] ?? 0, -10, 10);
    if (!w) continue;

    const wAbs = Math.abs(w);
    maxPoints += wAbs;

    // Base normalized score is always 0..10 where higher is better for positive priority.
    const baseScore = clamp(isFiniteNumber(base[key]) ? base[key] : 5, 0, 10);

    // Negative priority means "rank the opposite": 9/10 -> 1/10, 8/10 -> 2/10, etc.
    const appliedScore = w < 0 ? (10 - baseScore) : baseScore;
    const points = (appliedScore / 10) * wAbs;
    pointsSum += points;

    normalizedApplied[key] = appliedScore;
    contributions[key] = points; // points on [0..|w|]
    breakdown[key] = {
      value: rawValuesByKey[key],
      normalizedBase: baseScore,
      normalizedApplied: appliedScore,
      weight: w,
      points,
      maxPoints: wAbs,
    };
  }

  const score01 = maxPoints > 0 ? (pointsSum / maxPoints) : 0.5;
  const scoreRaw = clamp(score01 * 100, 0, 100);
  const finalScore = Math.round(scoreRaw);

  return {
    score: finalScore,
    scoreRaw,
    normalized: { ...base, applied: normalizedApplied },
    contributions,
    breakdown,
  };
}

// ============================================================================
// BATCH PROCESSING
// ============================================================================

/**
 * Analyze all dishes (heavy computation).
 * This computes base metrics that don't depend on priorities.
 * Call this once when dishes/ingredients/zone/overrides/priceUnit change.
 * 
 * @param {Array} dishes - Array of dish objects
 * @param {Array|Map} ingredients - Ingredients array or pre-built index Map
 * @param {string} zoneId - Economic zone ID
 * @param {boolean} useOptimizedTime - Whether to use optimized times
 * @param {Object} allOverrides - Map of dish name -> overrides
 * @param {string} priceUnit - Price unit for ranking ('serving', 'per1kg', 'per1000kcal')
 * @returns {Object} { analyzed: Array, datasetStats: Object }
 */
export function analyzeAllDishesBase(dishes, ingredients, zoneId, useOptimizedTime = false, allOverrides = {}, priceUnit = 'serving') {
  // Build index if we got an array (for backward compat)
  const ingredientIndex = ingredients instanceof Map 
    ? ingredients 
    : buildIngredientIndex(ingredients);

  // Analyze all dishes
  const analyzed = dishes.map(dish => {
    const dishName = dish.dish || dish.name;
    const overrides = allOverrides[dishName] || {};
    return analyzeDish(dish, zoneId, ingredientIndex, useOptimizedTime, overrides, priceUnit);
  });

  // STRICT normalization rules:
  // - Every criterion entering scoring MUST be in [0..10]
  // - Percentiles are allowed for: speed(time), satiety, lowCalorie
  // - Everything else is deterministic (min/max scaling or raw 0..10 indices)

  // Deterministic ranges (dataset min/max)
  const costs = analyzed.map(d => d.cost).filter(c => isFiniteNumber(c) && c > 0);
  const times = analyzed.map(d => d.time).filter(t => isFiniteNumber(t) && t > 0);
  const calories = analyzed.map(d => d.calories).filter(c => isFiniteNumber(c) && c > 0);
  const kcalPer100gVals = analyzed.map(d => d.kcalPer100g).filter(v => isFiniteNumber(v) && v > 0);
  const satietyVals = analyzed.map(d => d.satiety).filter(isFiniteNumber);

  const datasetStats = {
    minCost: costs.length ? Math.min(...costs) : 1,
    maxCost: costs.length ? Math.max(...costs) : 100,
    minTime: times.length ? Math.min(...times) : 1,
    maxTime: times.length ? Math.max(...times) : 120,
    minCalories: calories.length ? Math.min(...calories) : 100,
    maxCalories: calories.length ? Math.max(...calories) : 2000,
    minKcalPer100g: kcalPer100gVals.length ? Math.min(...kcalPer100gVals) : 10,
    maxKcalPer100g: kcalPer100gVals.length ? Math.max(...kcalPer100gVals) : 600,
  };

  // Percentile maps (for criteria where relative ranking is more stable than min/max scaling)
  // NOTE: For speed(time) lower is better.
  const speedDist = buildPercentileScoreMap(times, { higherIsBetter: false });
  const satietyDist = buildPercentileScoreMap(satietyVals, { higherIsBetter: true });
  const lowCalorieDist = buildPercentileScoreMap(kcalPer100gVals, { higherIsBetter: false });

  const analyzedWithNorm = analyzed.map((d) => {
    const normalizedBase = {
      taste: normalizeRaw10(d.taste, 5),
      health: normalizeRaw10(d.health, 5),
      ethics: normalizeRaw10(d.ethics, 5),
      cheapness: normalizeCostToCheapness(d.cost, datasetStats.minCost, datasetStats.maxCost),
      // Using percentiles avoids the "one super-long recipe makes everyone 10/10 fast" effect.
      speed: clamp(isFiniteNumber(d.time) ? speedDist.scoreForValue(d.time) : 5, 0, 10),
      satiety: clamp(isFiniteNumber(d.satiety) ? satietyDist.scoreForValue(d.satiety) : 5, 0, 10),
      lowCalorie: clamp(isFiniteNumber(d.kcalPer100g) ? lowCalorieDist.scoreForValue(d.kcalPer100g) : 5, 0, 10),
    };
    return { ...d, normalizedBase };
  });

  return { analyzed: analyzedWithNorm, datasetStats };
}

/**
 * Score and sort pre-analyzed dishes (lightweight computation).
 * Call this when only priorities change — no need to re-analyze dishes.
 * 
 * @param {Array} analyzedDishes - Output from analyzeAllDishesBase().analyzed
 * @param {Object} datasetStats - Output from analyzeAllDishesBase().datasetStats
 * @param {Object} priorities - User priority weights
 * @returns {Array} Sorted array of { ...dishAnalysis, score, scoreBreakdown }
 */
export function scoreAndSortDishes(analyzedDishes, datasetStats, priorities) {
  const scored = analyzedDishes
    .filter(dish => !dish.unavailableIngredients?.length)
    .map(dishAnalysis => {
      const scoreResult = calculateFinalScore(dishAnalysis, priorities, datasetStats);
      return {
        ...dishAnalysis,
        score: scoreResult.score,
        scoreRaw: scoreResult.scoreRaw ?? scoreResult.score,
        scoreBreakdown: scoreResult.breakdown,
        normalizedMetrics: scoreResult.normalized,
      };
    });

  // Sort by RAW score (no rounding ties), then name for stability
  scored.sort((a, b) => {
    const d = (b.scoreRaw ?? b.score) - (a.scoreRaw ?? a.score);
    if (d) return d;
    const an = String(a.name ?? a.dish ?? '');
    const bn = String(b.name ?? b.dish ?? '');
    return an.localeCompare(bn);
  });

  return scored;
}

/**
 * Process all dishes and return sorted rankings.
 * Legacy convenience function that combines analysis + scoring.
 * For better performance, use analyzeAllDishesBase + scoreAndSortDishes separately.
 * 
 * @param {Array} dishes - Array of dish objects
 * @param {Array} ingredients - Array of ingredient objects
 * @param {string} zoneId - Economic zone ID
 * @param {Object} priorities - User priority weights
 * @param {boolean} useOptimizedTime - Whether to use optimized times
 * @param {Object} allOverrides - Map of dish name -> overrides
 * @param {string} priceUnit - Price unit for ranking ('serving', 'per1kg', 'per1000kcal')
 * @returns {Array} Sorted array of { ...dishAnalysis, score, scoreBreakdown }
 */
export function rankAllDishes(dishes, ingredients, zoneId, priorities, useOptimizedTime = false, allOverrides = {}, priceUnit = 'serving') {
  const { analyzed, datasetStats } = analyzeAllDishesBase(
    dishes, 
    ingredients, 
    zoneId, 
    useOptimizedTime, 
    allOverrides,
    priceUnit
  );
  
  return scoreAndSortDishes(analyzed, datasetStats, priorities);
}
