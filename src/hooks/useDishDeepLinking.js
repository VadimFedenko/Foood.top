import { useCallback, useEffect, useRef } from 'react';

function getDishIdFromUrl(paramName = 'dish') {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get(paramName);
  } catch {
    return null;
  }
}

function buildUrlWithParam(paramName, value) {
  const url = new URL(window.location.href);
  if (value === null || value === undefined || value === '') {
    url.searchParams.delete(paramName);
  } else {
    url.searchParams.set(paramName, value);
  }
  return url;
}

function findDishById(dishes, dishId) {
  if (!dishId) return null;
  return dishes?.find((d) => d?.id === dishId) ?? null;
}

/**
 * Keeps `selectedDish` in sync with `?dish=<id>` query param.
 * - Open: pushState `?dish=...`
 * - Close: back() if modal was opened via pushState; otherwise replaceState to clear the param
 * - Initial load with ?dish: inject a "base" history entry without ?dish so Back closes the modal
 * - Back/Forward: popstate updates selectedDish based on the URL
 */
export function useDishDeepLinking({
  dishes,
  selectedDish,
  setSelectedDish,
  paramName = 'dish',
}) {
  const didInitRef = useRef(false);

  const openDish = useCallback(
    (dish) => {
      if (!dish?.id) return;

      setSelectedDish(dish);

      const nextUrl = buildUrlWithParam(paramName, dish.id);
      window.history.pushState({ dishModal: true, dishId: dish.id }, '', nextUrl);
    },
    [paramName, setSelectedDish]
  );

  const closeDish = useCallback(() => {
    // Close immediately for UI responsiveness; popstate (if any) will just re-apply the same state.
    setSelectedDish(null);

    const currentDishId = getDishIdFromUrl(paramName);
    if (!currentDishId) return;

    // If we created a modal history entry, go back to the base URL (without ?dish).
    if (window.history.state?.dishModal) {
      window.history.back();
      return;
    }

    // Direct deep-link (no modal history state): just remove the param in-place.
    const baseUrl = buildUrlWithParam(paramName, null);
    window.history.replaceState(window.history.state ?? null, '', baseUrl);
  }, [paramName, setSelectedDish]);

  // Initial load: if URL already has ?dish=..., open it (once dishes are available).
  useEffect(() => {
    if (didInitRef.current) return;
    if (!dishes || dishes.length === 0) return;

    const dishId = getDishIdFromUrl(paramName);
    if (!dishId) {
      didInitRef.current = true;
      return;
    }

    const dish = findDishById(dishes, dishId);
    if (!dish) {
      // Bad/unknown id: clean up URL (no reload) and continue.
      const baseUrl = buildUrlWithParam(paramName, null);
      window.history.replaceState(window.history.state ?? null, '', baseUrl);
      didInitRef.current = true;
      return;
    }

    // If there is no modal state in history, inject a base entry so Back closes the modal.
    if (!window.history.state?.dishModal && !window.history.state?.dishModalBase) {
      const dishUrl = buildUrlWithParam(paramName, dishId);
      const baseUrl = buildUrlWithParam(paramName, null);
      window.history.replaceState({ dishModalBase: true }, '', baseUrl);
      window.history.pushState({ dishModal: true, dishId }, '', dishUrl);
    }

    setSelectedDish(dish);
    didInitRef.current = true;
  }, [dishes, paramName, setSelectedDish]);

  // Back/Forward: sync state from URL.
  useEffect(() => {
    const onPopState = () => {
      const dishId = getDishIdFromUrl(paramName);
      const nextDish = dishId ? findDishById(dishes, dishId) : null;

      // Avoid extra re-renders when nothing changed.
      const currId = selectedDish?.id ?? null;
      const nextId = nextDish?.id ?? null;
      if (currId === nextId) return;

      setSelectedDish(nextDish);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [dishes, paramName, selectedDish?.id, setSelectedDish]);

  return { openDish, closeDish };
}


