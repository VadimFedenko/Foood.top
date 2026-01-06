import { useEffect, useState } from 'react';

/**
 * Best-effort mobile detector for UX/perf decisions.
 * We intentionally treat "coarse pointer / no hover" devices as mobile,
 * even if CSS px width is large (some phones/tablets, desktop touchscreens).
 */
export function useIsMobile() {
  const get = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;

    const byWidth = window.matchMedia('(max-width: 639px)').matches;
    const byPointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    return byWidth || byPointer;
  };

  const [isMobile, setIsMobile] = useState(get);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mqWidth = window.matchMedia('(max-width: 639px)');
    const mqPointer = window.matchMedia('(hover: none) and (pointer: coarse)');

    const onChange = () => setIsMobile(get());

    // Safari fallback: addListener/removeListener
    if (mqWidth.addEventListener) {
      mqWidth.addEventListener('change', onChange);
      mqPointer.addEventListener('change', onChange);
      return () => {
        mqWidth.removeEventListener('change', onChange);
        mqPointer.removeEventListener('change', onChange);
      };
    }

    mqWidth.addListener(onChange);
    mqPointer.addListener(onChange);
    return () => {
      mqWidth.removeListener(onChange);
      mqPointer.removeListener(onChange);
    };
  }, []);

  return isMobile;
}


