# Dish Ranking System Architecture

## Overview

The ranking system works in two stages:
1. **Heavy analysis** (executed rarely) — calculation of base metrics for all dishes
2. **Light calculation** (executed frequently) — weighting and sorting by user priorities

## Key Optimization: Pre-calculated Variants

Instead of recalculating all metrics on every change of `priceUnit` or `timeMode`, the system calculates base metrics **once** and then creates **6 pre-calculated variants**:

- **Time modes**: `normal` | `optimized` (2 variants)
- **Price units**: `serving` | `per1kg` | `per1000kcal` (3 variants)
- **Total**: 2 × 3 = **6 variants**

Switching between variants is simply selecting from the pre-calculated cache, without recalculation.

### When Recalculation Occurs

Heavy analysis (`analyzeAllDishesVariants`) runs **only** when:
- `selectedZone` changes (ingredient prices change)
- `overrides` change (user modified dish values)
- `dishes` / `ingredients` dataset changes

Switching `priceUnit` or `isOptimized` **does not trigger** recalculation — it simply selects a different variant from the cache.

## Stage 1: Static Analysis (`analyzeDishStatic`)

For each dish, **mode-independent** metrics are calculated:

### Base Metrics (independent of timeMode/priceUnit)
- `health` — health index (0-10), weighted by ingredient proportions and cooking method coefficients
- `ethics` — ethics index (0-10), weighted by ingredient proportions
- `calories` — total calories from ingredients
- `weight` — total net weight in grams
- `kcalPer100g` — calories per 100g
- `satiety` — satiety index
- `baseTaste` — base taste (0-10) from dish data

### Time (depends on mode, but both variants are pre-calculated)
- `baseTimeNormal` — time in normal mode (`prep_t + cook_t`)
- `baseTimeOptimized` — time in optimized mode (`prep_t_optimized + cook_t_optimized`)
- `passiveTimeHours` — passive cooking time (affects speed score via penalty)

### Price Calculation

Price calculation uses **yield ratios** to account for waste:
- **Gross Weight** = Net Weight / `yield_ratio` (what you need to buy)
- **Item Cost** = (Gross Weight / 1000) × Price per kg
- **Total Cost** = Sum of all ingredient costs

All 3 price unit variants are pre-calculated:
- `prices.serving` — price per serving (with overrides)
- `prices.per1kg` — price per 1kg (with overrides)
- `prices.per1000kcal` — price per 1000 kcal (with overrides)

### Economic Zones

The system supports **11 economic zones** with zone-specific ingredient pricing:
- Eastern Europe, Western Europe, Northern Import, Mediterranean
- North America, Latin America, Asia (Rice Belt), Developed Asia
- MENA Region, Oceania, Sub-Saharan Africa

If an ingredient price is missing for a zone, the system falls back to `west_eu_industrial` prices. Ingredients marked as `null` in a zone are considered unavailable.

### Ingredient Matching

Ingredient names are normalized for matching:
- Case-insensitive
- Space normalization around commas and parentheses
- Diacritics removal (e.g., "sautéed" → "sauteed")

An ingredient index (Map) is built once for O(1) lookups instead of O(n) array searches.

### Cooking Method Health Impact

Cooking methods affect health scores via coefficients:
- `raw`, `fermented`: 1.0-1.1 (healthiest)
- `steamed`, `boiled`: 0.97-0.98
- `baked`, `roasted`, `grilled`, `fried`: 0.92-0.94
- `deep_fried`: 0.7 (least healthy)

Health score = weighted average of (ingredient health_index × cooking_coefficient).

### Applying Overrides

Overrides support two formats:
- **Legacy absolute**: `{ taste: 8.5 }` — absolute value
- **Multiplier**: `{ tasteMul: 1.1 }` — multiplier from base value

**Priority**: if a multiplier exists, the absolute value is ignored.

Supported overrides:
- `taste` / `tasteMul`
- `health` / `healthMul`
- `ethics` / `ethicsMul`
- `price` / `priceMul`
- `time` / `timeMul` (applies to both normal and optimized)
- `calories` / `caloriesMul`
- `satiety` / `satietyMul`

## Stage 2: Pre-calculation of Independent Metrics Normalization

After static analysis, but before creating variants, normalization is calculated for metrics that **do not depend on the variant** (timeMode/priceUnit):

- `taste`, `health`, `ethics` — direct normalization (clamp to 0-10)
- `satiety`, `lowCalorie` — percentile ranking (depends on distribution, but values are the same across all variants)

These normalized values are stored in `normalizedBaseStatic` and reused across all 6 variants.

## Stage 3: Variant Materialization (`materializeVariant`)

From static analysis, 6 variants are created:

```javascript
const variant = {
  ...staticDish,
  time: useOptimizedTime ? staticDish.timeOptimized : staticDish.timeNormal,
  cost: staticDish.prices[priceUnit],
  normalizedBase: {
    // Reuse pre-computed independent metrics
    taste: staticDish.normalizedBaseStatic.taste,
    health: staticDish.normalizedBaseStatic.health,
    ethics: staticDish.normalizedBaseStatic.ethics,
    satiety: staticDish.normalizedBaseStatic.satiety,
    lowCalorie: staticDish.normalizedBaseStatic.lowCalorie,
    // Compute variant-dependent metrics
    cheapness: normalizeCostToCheapness(cost, minCost, maxCost),
    speed: normalizeTimeToSpeed(time, minTime, maxTime),
  }
}
```

## Stage 4: Metrics Normalization (0-10 Scale)

All metrics are normalized to a unified **0-10** scale, where:
- **10** = best value
- **0** = worst value

### Normalization Methods

#### 1. Direct Normalization (taste, health, ethics)
Already in the 0-10 range, simply clamped:
```javascript
normalized = clamp(value, 0, 10)
```

#### 2. Logarithmic Normalization (cheapness)
For price, a logarithmic scale is used (to avoid distortions from outliers):
```javascript
logMin = log(minCost)
logMax = log(maxCost)
logCost = log(cost)
score = 10 * (logMax - logCost) / (logMax - logMin)
```
**10** = cheapest, **0** = most expensive.

#### 3. Percentile Normalization (speed, satiety, lowCalorie)
**Percentile ranking** is used — relative position in the dataset:
```javascript
percentile = position_in_sorted_array / (total - 1)
score = percentile * 10  // if higherIsBetter
score = (1 - percentile) * 10  // if lower is better
```

This provides more stable results than min/max scaling, especially in the presence of outliers.

#### 4. Passive Time Penalty (speed)
After percentile normalization of active time, a penalty for `passive_t_hours` is applied to `speed`:

| Passive Time | Penalty |
|--------------|---------|
| 0.5-1 hour   | -1 point |
| 1-4 hours    | -1.5 points |
| 4-24 hours   | -2 points |
| 24+ hours    | -3 points |

The penalty is applied **before** the final clamp(0, 10).

## Stage 5: Final Score Calculation (`calculateFinalScore`)

### Formula

```
For each active priority:
  baseScore = normalizedBase[key]  // 0-10
  appliedScore = (priority < 0) ? (10 - baseScore) : baseScore
  points = (appliedScore / 10) * |priority|
  
maxPoints = sum(|priority|)
finalScore = (sum(points) / maxPoints) * 100
```

### Negative Priorities

If `priority < 0`, the criterion is **inverted**:
- `health: -10` means "want **unhealthy**"
- `baseScore: 8/10` → `appliedScore: 2/10` (10 - 8)

## Stage 6: Sorting (`scoreAndSortDishes`)

Dishes are sorted by:
1. **`scoreRaw`** (descending) — final score without rounding
2. **`name`** (ascending) — for stability when scores are equal

**Filtering**: Dishes with unavailable ingredients in the selected zone are excluded from ranking.

## Data Flow in the Application

```
App.jsx
  ├─ analyzeAllDishesVariants()  // Heavy analysis (only on zone/overrides change)
  │   ├─ buildIngredientIndex()    // O(1) lookup map
  │   ├─ analyzeDishStatic()        // For each dish
  │   │   ├─ calculateDishCost()     // With yield ratios
  │   │   ├─ calculateDishHealth()   // With cooking coefficients
  │   │   ├─ calculateDishCalories()
  │   │   └─ calculateDishEthics()
  │   │
  │   ├─ Normalization of independent metrics (once)
  │   │   ├─ taste, health, ethics (clamp)
  │   │   └─ satiety, lowCalorie (percentile ranking)
  │   │
  │   └─ materializeVariant()    // Creating 6 variants
  │       └─ Normalization of variant-dependent metrics (for each variant)
  │           ├─ cheapness (logarithmic, depends on cost)
  │           └─ speed (percentile + passive penalty, depends on time)
  │
  └─ scoreAndSortDishes()         // Light calculation (on priorities change)
      ├─ calculateFinalScore()    // For each dish
      └─ sort()                    // Sort by scoreRaw, then name
```

## Performance Optimizations

### 1. Variant Caching
- 6 variants are pre-calculated once
- Switching `priceUnit` / `timeMode` = O(1) selection from cache

### 2. Normalization Optimization
- Normalization of independent metrics (`taste`, `health`, `ethics`, `satiety`, `lowCalorie`) is calculated **once** after static analysis
- Normalization of variant-dependent metrics (`cheapness`, `speed`) is calculated for each variant (6 times)
- **Result**: instead of 6×7 = 42 normalizations, 1×5 + 6×2 = 17 normalizations are performed

### 3. Ingredient Index
- Ingredients are indexed in a Map for O(1) lookups instead of O(n) array searches
- Built once and reused across all dish analyses

### 4. Separation of Heavy and Light
- Heavy analysis: only on data changes (zone, overrides, dataset)
- Light calculation: only on priority changes

### 5. Draft Overrides in UI
- When editing in a card, local `draftOverrides` is used
- Commit to global `overrides` happens with debounce (**250ms**)
- This prevents recalculation on every tick when holding a button

### 6. Frozen Ranking
- When a dish card is expanded, the dish order is "frozen"
- This prevents dish "jumping" when priorities change during viewing
- Frozen dishes are updated with new values but maintain their positions
- Frozen ranking is cleared when priorities, zone, priceUnit, or optimized toggle changes

## UI Components

### PrioritiesPanel
- Collapsible audio-mixer style vertical sliders
- Draft state during slider drag to avoid expensive re-renders
- Auto-collapses when scrolling down, expands when scrolling to top
- Economic zone selector with world map widget

### DishCard
- Compact view with expandable details via `InfoSlider`
- Shows score, metrics, cost breakdown
- Allows editing overrides with debounced commits
- Auto-scrolls to top when expanded

### InfoSlider
- Detailed dish information panel
- Shows ingredient breakdown, cost details, time breakdown
- Metric indicators with visual feedback

## Data Format

### Overrides (localStorage: `bfe_overrides`)
```javascript
{
  "Dish Name": {
    "tasteMul": 1.05,      // +5% from base taste
    "priceMul": 0.95,      // -5% from base price
    "timeMul": 1.1,        // +10% time
    // or legacy:
    "taste": 8.5,         // absolute value
    "price": 12.50        // absolute value
  }
}
```

### Priorities (localStorage: `bfe_priorities`)
```javascript
{
  "taste": 10,        // Maximum taste priority
  "health": 5,        // Medium health priority
  "cheapness": 0,     // Price doesn't matter
  "speed": -5,        // Want slow (inverted)
  "satiety": 0,
  "lowCalorie": 0,
  "ethics": 0
}
```

### Other Persisted State
- `bfe_zone` — selected economic zone
- `bfe_optimized` — whether to use optimized time mode
- `bfe_price_unit` — selected price unit
- `bfe_theme` — light/dark theme preference

## Files

- `src/lib/ranking/engine.js` — core ranking logic (main implementation)
- `src/lib/RankingEngine.js` — backwards-compatibility barrel export
- `src/App.jsx` — orchestration of analysis and calculation
- `src/components/DishCard.jsx` — UI for dish display and override editing
- `src/components/dishCard/InfoSlider.jsx` — detailed dish information panel
- `src/components/PrioritiesPanel.jsx` — UI for changing priorities and zone
- `src/lib/persist.js` — localStorage helpers
