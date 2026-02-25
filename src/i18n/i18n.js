import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// No static imports of locale JSON — we load only the current language at init
// to avoid parsing ~850KB of JSON on the main thread before first paint.

function detectBrowserLanguage() {
  if (typeof navigator === 'undefined') return null;

  const candidates =
    (navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage]
    ) || [];

  const supported = ['en', 'ru', 'ua'];

  for (const l of candidates) {
    if (!l) continue;
    const base = String(l).toLowerCase().split('-')[0]; // 'ru-RU' -> 'ru'
    if (supported.includes(base)) return base;
  }

  return null;
}

function readInitialLanguage() {
  try {
    const raw = localStorage.getItem('bfe_prefs_v2');
    const prefs = raw ? JSON.parse(raw) : null;
    const lng = prefs?.language;
    if (lng === 'ru' || lng === 'ua' || lng === 'en') {
      return lng;
    }
  } catch {
    // ignore
  }

  const detected = detectBrowserLanguage();
  if (detected) return detected;

  return null;
}

const supportedLngs = ['en', 'ru', 'ua'];

/**
 * Load translation + dishes + ingredients for one language (dynamic import).
 * Used at init (current language only) and when switching language.
 */
export async function loadLanguageResources(lng) {
  if (!supportedLngs.includes(lng)) {
    lng = 'en';
  }
  const [translation, dishes, ingredients] = await Promise.all([
    import(`./locales/${lng}.json`),
    import(`./locales/data/dishes.${lng}.json`),
    import(`./locales/data/ingredients.${lng}.json`),
  ]);
  return {
    translation: translation.default,
    dishes: dishes.default,
    ingredients: ingredients.default,
  };
}

/** Already-loaded languages (so we don't re-fetch when switching back). */
const loadedLngs = new Set();

/**
 * Initialize i18n: load only the current language's resources, then init.
 * Call this before rendering the app. Other languages load on demand when user switches.
 */
export async function initI18n() {
  const lng = readInitialLanguage() || 'en';

  const resources = await loadLanguageResources(lng);
  loadedLngs.add(lng);

  i18n.use(initReactI18next).init({
    resources: {
      [lng]: resources,
    },
    lng,
    fallbackLng: 'en',
    defaultNS: 'translation',
    interpolation: { escapeValue: false },
  });

  // Load English in background for fallback when current language is not en
  if (lng !== 'en' && !loadedLngs.has('en')) {
    loadLanguageResources('en').then((r) => {
      loadedLngs.add('en');
      i18n.addResourceBundle('en', 'translation', r.translation);
      i18n.addResourceBundle('en', 'dishes', r.dishes);
      i18n.addResourceBundle('en', 'ingredients', r.ingredients);
    });
  }

  // When user switches language, load that language's resources if not yet loaded
  i18n.on('languageChanged', (nextLng) => {
    if (loadedLngs.has(nextLng)) return;
    loadLanguageResources(nextLng).then((r) => {
      loadedLngs.add(nextLng);
      i18n.addResourceBundle(nextLng, 'translation', r.translation);
      i18n.addResourceBundle(nextLng, 'dishes', r.dishes);
      i18n.addResourceBundle(nextLng, 'ingredients', r.ingredients);
    });
  });

  return i18n;
}

export default i18n;
