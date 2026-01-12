import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { ECONOMIC_ZONES } from '../lib/RankingEngine';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import ZoneIcon from './ZoneIcon';

export default function ZoneDropdown({
  open,
  anchorEl,
  selectedZone,
  onClose,
  onSelectZone,
  width,
  narrow,
  clickCapture = false,
  className = 'fixed bg-white dark:bg-surface-800 rounded-lg border border-surface-300 dark:border-surface-700 shadow-lg z-[100] max-h-64 overflow-y-auto',
}) {
  const dropdownRef = useRef(null);

  let position = null;
  if (open && anchorEl?.getBoundingClientRect) {
    const r = anchorEl.getBoundingClientRect();
    const w = width ?? r.width;

    let left = r.left;
    if (narrow && typeof window !== 'undefined') {
      const sw = window.innerWidth;
      const bp = narrow.breakpoint ?? 640;
      if (sw < bp) {
        const padRight = narrow.alignRightPadding ?? 16;
        const minLeft = narrow.minLeftPadding ?? 16;
        left = Math.max(minLeft, sw - w - padRight);
      }
    }

    position = { top: r.bottom + 4, left, width: w };
  }

  useOnClickOutside({
    enabled: open && !!anchorEl,
    insideRefs: [anchorEl, dropdownRef],
    onOutside: onClose,
    clickCapture,
    closeOnScroll: true,
    scrollTarget: typeof window !== 'undefined' ? window : null,
    scrollCapture: true,
    ignoreScrollInsideRefs: [dropdownRef],
  });

  if (!open || !position) return null;

  return createPortal(
    <div
      ref={dropdownRef}
      className={className}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
      }}
    >
      {Object.entries(ECONOMIC_ZONES).map(([zoneId, zone]) => (
        <button
          key={zoneId}
          onClick={() => {
            onSelectZone?.(zoneId);
            onClose?.();
          }}
          className={`
            w-full px-3 py-2 text-left text-sm flex items-center gap-2
            transition-colors
            ${
              selectedZone === zoneId
                ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                : 'text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700'
            }
          `}
        >
          <ZoneIcon zoneId={zoneId} size={18} />
          <span className="flex-1">{zone.name}</span>
          {selectedZone === zoneId && <span className="text-blue-500">✓</span>}
        </button>
      ))}
    </div>,
    document.body
  );
}


