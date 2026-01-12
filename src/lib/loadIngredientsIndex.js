import { buildIngredientIndex } from './RankingEngine.js';

let cached = null;
let inFlight = null;

/**
 * Lazy-load `ingredients.json` and build an ingredient index Map.
 * This keeps the initial bundle smaller and avoids blocking first paint.
 */
export async function loadIngredientsIndex() {
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = import('../../ingredients.json')
    .then((m) => m.default)
    .then((ingredients) => {
      const ingredientIndex = buildIngredientIndex(ingredients);
      cached = { ingredients, ingredientIndex };
      return cached;
    })
    .finally(() => {
      // keep cached; allow retry if it failed
      inFlight = null;
    });

  return inFlight;
}


