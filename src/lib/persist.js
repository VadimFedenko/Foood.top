/**
 * persist.js
 * Small, reusable localStorage helpers for this app.
 */

export const STORAGE_KEYS = {
  PRIORITIES: 'bfe_priorities',
  OVERRIDES: 'bfe_overrides',
  ZONE: 'bfe_zone',
  OPTIMIZED: 'bfe_optimized',
  PRICE_UNIT: 'bfe_price_unit',
  THEME: 'bfe_theme',
};

export function readJson(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    console.warn(`Failed to read JSON from localStorage (${key}):`, e);
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to write JSON to localStorage (${key}):`, e);
  }
}

export function readString(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (e) {
    console.warn(`Failed to read string from localStorage (${key}):`, e);
    return fallback;
  }
}

export function writeString(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch (e) {
    console.warn(`Failed to write string to localStorage (${key}):`, e);
  }
}





