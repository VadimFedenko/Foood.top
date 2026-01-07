import { useEffect, useState } from 'react';

// Module-level cache so we don't repeatedly fetch/parse the same SVG.
// (Especially useful under React.StrictMode dev double-mount behavior.)
let cachedSvgData = null;
let cachedSvgPromise = null;

/**
 * Hook to load and parse SVG map file
 * Returns viewBox and paths extracted from the SVG
 */
export function useSvgMap() {
  const [svgData, setSvgData] = useState({ viewBox: '0 0 1000 500', paths: {} });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    // Fast-path: serve from cache.
    if (cachedSvgData) {
      setSvgData(cachedSvgData);
      setIsLoading(false);
      return () => { isActive = false; };
    }

    // De-dup concurrent loads (do not abort shared promise; just ignore result on unmount).
    if (!cachedSvgPromise) {
      cachedSvgPromise = (async () => {
        const response = await fetch('/map.svg');
        const svgText = await response.text();
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');

        const svgElement = svgDoc.querySelector('svg');
        const viewBox = svgElement?.getAttribute('viewBox') || '0 0 1000 500';

        const paths = {};
        const pathElements = svgDoc.querySelectorAll('path[id]');
        pathElements.forEach((path) => {
          const zoneId = path.getAttribute('id');
          const d = path.getAttribute('d');
          if (zoneId && d) {
            paths[zoneId] = d;
          }
        });

        const data = { viewBox, paths };
        cachedSvgData = data;
        return data;
      })().finally(() => {
        cachedSvgPromise = null;
      });
    }

    (async () => {
      try {
        const data = cachedSvgData ?? await cachedSvgPromise;
        if (!isActive) return;
        setSvgData(data);
      } catch (error) {
        if (!isActive) return;
        console.error('Failed to load SVG map:', error);
      } finally {
        if (isActive) setIsLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, []);

  return { ...svgData, isLoading };
}

