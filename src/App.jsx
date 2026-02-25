import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { usePrefs } from './store/prefsStore';
import i18n from './i18n/i18n';

import MainAppShell from './components/MainAppShell';

const Guide = lazy(() => import('./components/Guide.jsx'));

/**
 * Main Application Component
 */
export default function App({ needsGuide = false }) {
  const theme = usePrefs((s) => s.prefs.theme);
  const language = usePrefs((s) => s.prefs.language);
  const isDark = theme !== 'light';
  const hasSeenOnboarding = usePrefs((s) => s.prefs.hasSeenOnboarding);

  const shouldShowGuide = useMemo(() => needsGuide && !hasSeenOnboarding, [needsGuide, hasSeenOnboarding]);
  const [mountGuide, setMountGuide] = useState(false);

  // Apply theme class to document
  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    // Allow transitions after initial theme is resolved to avoid startup flicker
    document.documentElement.classList.remove('theme-preload');
  }, [isDark]);

  // Keep i18n language in sync with preferences.
  useEffect(() => {
    const next = language === 'ru' ? 'ru' : language === 'ua' ? 'ua' : 'en';
    if (i18n.language !== next) i18n.changeLanguage(next);
    document.documentElement.lang = next;
  }, [language]);

  // De-prioritize guide: start loading it only after the app has committed a frame.
  useEffect(() => {
    if (!shouldShowGuide) {
      setMountGuide(false);
      return;
    }
    let raf = requestAnimationFrame(() => setMountGuide(true));
    return () => cancelAnimationFrame(raf);
  }, [shouldShowGuide]);

  return (
    <>
      <MainAppShell />
      {mountGuide && shouldShowGuide && (
        <Suspense fallback={null}>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'auto' }}
            aria-modal
            role="dialog"
          >
            <Guide />
          </div>
        </Suspense>
      )}
    </>
  );
}


