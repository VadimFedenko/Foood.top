import { useSyncExternalStore } from 'react';

// Single-key persistence to reduce plumbing/prop-drilling across the app.
const STORAGE_KEY = 'bfe_prefs_v2';

const DEFAULT_PRIORITIES = {
  taste: 10,
  health: 10,
  cheapness: 10,
  speed: 10,
  satiety: 0,
  lowCalorie: 0,
  ethics: 0,
};

const DEFAULT_PREFS = {
  priorities: DEFAULT_PRIORITIES,
  overrides: {},
  selectedZone: 'west_eu_industrial',
  isOptimized: true,
  priceUnit: 'per1000kcal',
  theme: 'dark',
  viewMode: 'grid', // 'list' or 'grid'
};

function readJsonSafe(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJsonSafe(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function mergeDefaults(stored) {
  if (!stored || typeof stored !== 'object') return DEFAULT_PREFS;
  const merged = {
    ...DEFAULT_PREFS,
    ...stored,
    priorities: { ...DEFAULT_PRIORITIES, ...(stored.priorities || {}) },
    overrides: stored.overrides && typeof stored.overrides === 'object' ? stored.overrides : {},
  };
  // Treat null/undefined (or otherwise invalid values) as "missing" and fall back to defaults.
  merged.selectedZone = merged.selectedZone || DEFAULT_PREFS.selectedZone;
  merged.priceUnit = merged.priceUnit || DEFAULT_PREFS.priceUnit;
  merged.theme = merged.theme || DEFAULT_PREFS.theme;
  merged.isOptimized =
    typeof merged.isOptimized === 'boolean' ? merged.isOptimized : DEFAULT_PREFS.isOptimized;
  merged.viewMode = merged.viewMode === 'grid' ? 'grid' : 'list';
  return merged;
}

// Minimal migration from legacy keys (bfe_*) to a single JSON payload.
function loadInitialPrefs() {
  const direct = readJsonSafe(STORAGE_KEY);
  if (direct) {
    const merged = mergeDefaults(direct);
    // If some defaults were missing/invalid in storage, persist the fixed object once.
    if (
      direct.selectedZone == null ||
      direct.priceUnit == null ||
      direct.theme == null ||
      typeof direct.isOptimized !== 'boolean'
    ) {
      writeJsonSafe(STORAGE_KEY, merged);
    }
    return merged;
  }

  const legacyPriorities = readJsonSafe('bfe_priorities');
  const legacyOverrides = readJsonSafe('bfe_overrides');
  const legacyZone = (() => {
    try {
      return localStorage.getItem('bfe_zone');
    } catch {
      return null;
    }
  })();
  const legacyOptimized = (() => {
    try {
      const v = localStorage.getItem('bfe_optimized');
      return v == null ? null : JSON.parse(v);
    } catch {
      return null;
    }
  })();
  const legacyPriceUnit = (() => {
    try {
      return localStorage.getItem('bfe_price_unit');
    } catch {
      return null;
    }
  })();
  const legacyTheme = (() => {
    try {
      return localStorage.getItem('bfe_theme');
    } catch {
      return null;
    }
  })();

  const migrated = mergeDefaults({
    priorities: legacyPriorities || undefined,
    overrides: legacyOverrides || undefined,
    selectedZone: legacyZone || undefined,
    isOptimized: typeof legacyOptimized === 'boolean' ? legacyOptimized : undefined,
    priceUnit: legacyPriceUnit || undefined,
    theme: legacyTheme || undefined,
  });

  // Write once so future loads are single-read.
  writeJsonSafe(STORAGE_KEY, migrated);
  return migrated;
}

function createPrefsStore() {
  let state = {
    prefs: loadInitialPrefs(),
    // UI updates can be frequent; computation updates are throttled.
    uiPriorities: null,
    computationPriorities: null,
  };
  state.uiPriorities = state.prefs.priorities;
  state.computationPriorities = state.prefs.priorities;

  const listeners = new Set();

  const emit = () => {
    for (const l of listeners) l();
  };

  // Debounced persistence.
  let persistTimer = 0;
  const schedulePersist = () => {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = 0;
      writeJsonSafe(STORAGE_KEY, state.prefs);
    }, 300);
  };

  // Throttled computation commit (no per-frame busy loop).
  const MIN_COMPUTE_INTERVAL_MS = 500;
  let pendingCompute = null;
  let lastComputeTs = 0;
  let computeRaf = 0;
  let computeTimer = 0;

  const runCompute = (ts) => {
    computeRaf = 0;
    lastComputeTs = ts;
    if (!pendingCompute) return;
    const p = pendingCompute;
    pendingCompute = null;
    if (state.computationPriorities !== p) {
      state.computationPriorities = p;
      emit();
    }
  };

  const scheduleCompute = (priorities) => {
    pendingCompute = priorities;
    if (computeRaf || computeTimer) return;

    const now = performance.now();
    const wait = Math.max(0, MIN_COMPUTE_INTERVAL_MS - (now - lastComputeTs));
    if (wait > 0) {
      computeTimer = setTimeout(() => {
        computeTimer = 0;
        computeRaf = requestAnimationFrame(runCompute);
      }, wait);
      return;
    }

    computeRaf = requestAnimationFrame(runCompute);
  };

  const flushCompute = () => {
    if (computeTimer) {
      clearTimeout(computeTimer);
      computeTimer = 0;
    }
    if (computeRaf) {
      cancelAnimationFrame(computeRaf);
      computeRaf = 0;
    }
    const p = pendingCompute || state.uiPriorities;
    pendingCompute = null;
    lastComputeTs = performance.now();
    if (state.computationPriorities !== p) {
      state.computationPriorities = p;
      emit();
    }
  };

  const setPrefs = (nextPrefs) => {
    state.prefs = nextPrefs;
    schedulePersist();
    emit();
  };

  return {
    // subscription
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState() {
      return state;
    },

    // actions
    setPref(patch) {
      const next = { ...state.prefs, ...(patch || {}) };
      setPrefs(next);
    },

    setUiPriorities(priorities) {
      const p = priorities || DEFAULT_PRIORITIES;
      if (state.uiPriorities !== p) state.uiPriorities = p;
      if (state.prefs.priorities !== p) state.prefs = { ...state.prefs, priorities: p };
      schedulePersist();
      scheduleCompute(p);
      emit();
    },

    flushPriorities() {
      flushCompute();
    },

    setOverrideForDish(dishId, newOverrides) {
      const prev = state.prefs.overrides || {};
      const next = { ...prev };

      if (!newOverrides || Object.keys(newOverrides).length === 0) {
        delete next[dishId];
      } else {
        next[dishId] = newOverrides;
      }

      if (next !== prev) {
        setPrefs({ ...state.prefs, overrides: next });
      }
    },
  };
}

export const prefsStore = createPrefsStore();

export const prefsActions = {
  setPref: (patch) => prefsStore.setPref(patch),
  setUiPriorities: (p) => prefsStore.setUiPriorities(p),
  updateUiPriorities: (updater) => {
    const current = prefsStore.getState().uiPriorities;
    const next = typeof updater === 'function' ? updater(current) : current;
    prefsStore.setUiPriorities(next);
  },
  flushPriorities: () => prefsStore.flushPriorities(),
  setOverrideForDish: (dishId, o) => prefsStore.setOverrideForDish(dishId, o),
};

export function usePrefs(selector) {
  return useSyncExternalStore(
    prefsStore.subscribe,
    () => selector(prefsStore.getState()),
    () => selector(prefsStore.getState()),
  );
}

export { DEFAULT_PRIORITIES, DEFAULT_PREFS };


