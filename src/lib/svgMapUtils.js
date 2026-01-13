/**
 * Common utilities for SVG map transformations
 */

/**
 * Parse viewBox string into object
 */
export function parseViewBox(vb) {
  const parts = String(vb).trim().split(/\s+/).map((n) => Number(n));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n))) return { x: 0, y: 0, w: 1000, h: 500 };
  const [x, y, w, h] = parts;
  return { x, y, w, h };
}

/**
 * Generate centered scale transform for SVG
 */
export function centeredScaleTransform(viewBox, zoom) {
  const { x, y, w, h } = parseViewBox(viewBox);
  const cx = x + w / 2;
  const cy = y + h / 2;
  return `translate(${cx} ${cy}) scale(${zoom}) translate(${-cx} ${-cy})`;
}














