// Shared utility functions for dish-related components.

const HEALTH_STEPS = [
  {
    min: 8,
    value: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', badge: 'bg-emerald-500', bar: 'bg-emerald-500' },
  },
  {
    min: 6,
    value: { bg: 'bg-lime-500/20', border: 'border-lime-500/40', text: 'text-lime-400', badge: 'bg-lime-500', bar: 'bg-lime-500' },
  },
  {
    min: 4,
    value: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', badge: 'bg-amber-500', bar: 'bg-amber-500' },
  },
  {
    min: 2,
    value: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', badge: 'bg-orange-500', bar: 'bg-orange-500' },
  },
  {
    min: -Infinity,
    value: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400', badge: 'bg-red-500', bar: 'bg-red-500' },
  },
];

const ETHICS_STEPS = [
  { min: 8, value: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400', badge: 'bg-emerald-500' } },
  { min: 6, value: { bg: 'bg-lime-500/20', border: 'border-lime-500/40', text: 'text-lime-400', badge: 'bg-lime-500' } },
  { min: 4, value: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400', badge: 'bg-amber-500' } },
  { min: 2, value: { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-400', badge: 'bg-orange-500' } },
  { min: -Infinity, value: { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-400', badge: 'bg-rose-500' } },
];

const SCORE_STEPS = [
  { min: 75, value: { bg: 'bg-emerald-500', text: 'text-emerald-400', glow: 'glow-green' } },
  { min: 50, value: { bg: 'bg-amber-500', text: 'text-amber-400', glow: '' } },
  { min: 25, value: { bg: 'bg-orange-500', text: 'text-orange-400', glow: '' } },
  { min: -Infinity, value: { bg: 'bg-rose-500', text: 'text-rose-400', glow: 'glow-red' } },
];


function pickByMin(value, steps) {
  for (const s of steps) if (value >= s.min) return s.value;
  return steps[steps.length - 1]?.value;
}

/**
 * Get health color based on index (0-10)
 */
export function getHealthColor(index) {
  return pickByMin(index, HEALTH_STEPS);
}

export function getEthicsColor(index) {
  return pickByMin(index, ETHICS_STEPS);
}

/**
 * Get score color based on value (0-100)
 */
export function getScoreColor(score) {
  return pickByMin(score, SCORE_STEPS);
}

export function formatCurrency(value) {
  return `$${value.toFixed(2)}`;
}

export function formatTime(minutes) {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
}

export function getCookingLabel(state) {
  if (!state) return 'Raw';
  return state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
}

export function getCookingEffect(coef) {
  if (coef >= 1.05) return { text: 'Enhances nutrition', color: 'text-emerald-400', icon: '+' };
  if (coef >= 0.98) return { text: 'Preserves nutrition', color: 'text-teal-400', icon: '≈' };
  if (coef >= 0.85) return { text: 'Slight nutrient loss', color: 'text-amber-400', icon: '−' };
  if (coef >= 0.7) return { text: 'Moderate impact', color: 'text-orange-400', icon: '↓' };
  return { text: 'Significant impact', color: 'text-rose-400', icon: '↓↓' };
}

/**
 * Get price-based color for zone (green=cheap, red=expensive)
 * Similar to Big Mac Index visualization
 */
export function getPriceColor(price, minPrice, maxPrice) {
  if (price === null || price === undefined || price === 0) {
    return { fill: '#374151', text: 'text-surface-500', label: 'N/A' }; // Gray for unavailable
  }

  // Normalize price to 0-1 range
  const range = maxPrice - minPrice;
  const normalized = range > 0 ? (price - minPrice) / range : 0.5;

  // Color gradient: green (cheap) -> yellow -> orange -> red (expensive)
  let r, g, b;
  if (normalized < 0.33) {
    // Green to Yellow
    const t = normalized / 0.33;
    r = Math.round(34 + (250 - 34) * t);
    g = Math.round(197 + (204 - 197) * t);
    b = Math.round(94 + (21 - 94) * t);
  } else if (normalized < 0.66) {
    // Yellow to Orange
    const t = (normalized - 0.33) / 0.33;
    r = Math.round(250 + (249 - 250) * t);
    g = Math.round(204 + (115 - 204) * t);
    b = Math.round(21 + (22 - 21) * t);
  } else {
    // Orange to Red
    const t = (normalized - 0.66) / 0.34;
    r = Math.round(249 + (239 - 249) * t);
    g = Math.round(115 + (68 - 115) * t);
    b = Math.round(22 + (68 - 22) * t);
  }

  const fill = `rgb(${r}, ${g}, ${b})`;
  const textColor = normalized < 0.5 ? 'text-emerald-400' : normalized < 0.75 ? 'text-amber-400' : 'text-rose-400';

  return { fill, text: textColor, label: `$${price.toFixed(2)}` };
}

export function getPriceUnitLabel(priceUnit) {
  if (priceUnit === 'per1kg') return '/kg';
  if (priceUnit === 'per1000kcal') return '/kkcal';
  return '';
}


