import { SVG_MAP_PATHS, SVG_MAP_VIEWBOX } from '../data/mapPaths';

/**
 * Hook returning pre-extracted SVG map data (no fetch, no DOMParser).
 */
export function useSvgMap() {
  return {
    viewBox: SVG_MAP_VIEWBOX,
    paths: SVG_MAP_PATHS,
    isLoading: false,
  };
}

