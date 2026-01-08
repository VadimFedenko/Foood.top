import { useEffect, useMemo, useState } from 'react';
import { readJson, readString, writeJson, writeString } from './persist';

function isPlainObject(v) {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Minimal persisted-state hook.
 * - Initializes from localStorage (once)
 * - Writes to localStorage on change
 * - Optionally merges stored object into default object (handy for versioned prefs)
 */
export function useLocalStorageState(key, defaultValue, { mergeDefaults = false } = {}) {
  const isString = typeof defaultValue === 'string';

  const initial = useMemo(() => {
    if (typeof window === 'undefined') return defaultValue;

    if (isString) {
      return readString(key, defaultValue);
    }

    const stored = readJson(key, defaultValue);
    if (mergeDefaults && isPlainObject(defaultValue) && isPlainObject(stored)) {
      return { ...defaultValue, ...stored };
    }
    return stored;
  }, [defaultValue, isString, key, mergeDefaults]);

  const [state, setState] = useState(initial);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isString) {
      writeString(key, state);
    } else {
      writeJson(key, state);
    }
  }, [isString, key, state]);

  return [state, setState];
}






