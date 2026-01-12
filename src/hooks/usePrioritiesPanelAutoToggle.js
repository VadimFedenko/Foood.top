import { useEffect, useRef } from 'react';

/**
 * Fast, low-complexity auto toggle for Priorities panel.
 *
 * Goals:
 * - Collapse when user scrolls content down (once content is not at top)
 * - Expand when panel is collapsed and user "pulls down" at the top
 * - No timers/debounces in the gesture itself (removes perceived pause)
 * - Attach event listeners once per scrollable element; use refs for state
 */
export function usePrioritiesPanelAutoToggle({
  scrollableElement,
  isExpanded,
  setExpanded,
  collapseScrollTopThreshold = 30,
  topThresholdPx = 2,
  wheelExpandAccumThreshold = 40,
  touchExpandPullThreshold = 24,
}) {
  const stateRef = useRef({ isExpanded });
  const callbacksRef = useRef({ setExpanded });

  const lastScrollTopRef = useRef(0);
  const lockedScrollTopRef = useRef(null);
  const wheelUpAccumRef = useRef(0);
  const touchStartYRef = useRef(null);
  const touchStartYExpandedRef = useRef(null);

  useEffect(() => {
    stateRef.current = { isExpanded };
  }, [isExpanded]);

  useEffect(() => {
    callbacksRef.current = { setExpanded };
  }, [setExpanded]);

  useEffect(() => {
    const el = scrollableElement;
    if (!el) return;

    const isAtTop = () => el.scrollTop <= topThresholdPx;

    const expand = () => {
      const { isExpanded: expanded } = stateRef.current;
      if (expanded) return;
      // While expanded, we lock the scroll position so a "scroll gesture"
      // doesn't move the list; it should only expand/collapse the panel.
      lockedScrollTopRef.current = el.scrollTop;
      callbacksRef.current.setExpanded(true);
    };

    const collapse = () => {
      const { isExpanded: expanded } = stateRef.current;
      if (!expanded) return;
      lockedScrollTopRef.current = null;
      touchStartYExpandedRef.current = null;
      callbacksRef.current.setExpanded(false);
    };

    const onScroll = () => {
      const current = el.scrollTop;
      const prev = lastScrollTopRef.current;
      const delta = current - prev;

      // If the panel is expanded, do not allow the list to scroll at all.
      // This also covers cases like dragging the scrollbar thumb or keyboard scroll.
      if (stateRef.current.isExpanded) {
        const locked =
          lockedScrollTopRef.current == null ? prev : lockedScrollTopRef.current;
        if (current !== locked) {
          el.scrollTop = locked;
        }
        lastScrollTopRef.current = locked;
        // Collapse only on a downward scroll attempt. Scrolling upward while expanded
        // should not collapse the panel (otherwise it loops on "wheel up").
        if (current > locked) collapse();
        return;
      }

      lastScrollTopRef.current = current;

      // Any downward scrolling cancels wheel-accumulated "pull down" intent.
      if (delta > 0) wheelUpAccumRef.current = 0;

      if (stateRef.current.isExpanded && current > collapseScrollTopThreshold) {
        collapse();
      }
    };

    const onWheel = (e) => {
      if (stateRef.current.isExpanded) {
        // Consume wheel so the list doesn't move while expanded.
        if (e.cancelable) e.preventDefault();
        lockedScrollTopRef.current =
          lockedScrollTopRef.current == null ? el.scrollTop : lockedScrollTopRef.current;
        // Collapse only on downward intent (scrolling content down).
        // If user wheels up (pulling content up), keep panel open to avoid open/close loop.
        if (e.deltaY > 0) collapse();
        return;
      }
      if (!isAtTop()) {
        wheelUpAccumRef.current = 0;
        return;
      }

      if (e.deltaY < 0) {
        wheelUpAccumRef.current += Math.abs(e.deltaY);
        if (wheelUpAccumRef.current >= wheelExpandAccumThreshold) {
          wheelUpAccumRef.current = 0;
          expand();
        }
      } else {
        wheelUpAccumRef.current = 0;
      }
    };

    const onTouchStart = (e) => {
      if (stateRef.current.isExpanded) {
        // Track gesture direction while expanded so we can collapse only on swipe-up.
        touchStartYExpandedRef.current = e.touches[0].clientY;
        touchStartYRef.current = null;
        return;
      }
      touchStartYExpandedRef.current = null;
      touchStartYRef.current = isAtTop() ? e.touches[0].clientY : null;
    };

    const onTouchMove = (e) => {
      if (stateRef.current.isExpanded) {
        // Consume the gesture so the list doesn't move while expanded.
        if (e.cancelable) e.preventDefault();
        lockedScrollTopRef.current =
          lockedScrollTopRef.current == null ? el.scrollTop : lockedScrollTopRef.current;
        touchStartYRef.current = null;

        // Collapse only on swipe-up (finger moving up -> content would scroll down).
        if (touchStartYExpandedRef.current == null) {
          touchStartYExpandedRef.current = e.touches[0].clientY;
          return;
        }
        const dy = e.touches[0].clientY - touchStartYExpandedRef.current;
        // Small threshold to avoid accidental collapse from tiny jitters.
        if (dy <= -8) collapse();
        return;
      }
      if (touchStartYRef.current == null) return;
      if (!isAtTop()) return;

      const dy = e.touches[0].clientY - touchStartYRef.current;
      if (dy >= touchExpandPullThreshold) {
        touchStartYRef.current = null;
        expand();
      }
    };

    const onTouchEnd = () => {
      touchStartYRef.current = null;
      touchStartYExpandedRef.current = null;
    };

    lastScrollTopRef.current = el.scrollTop;
    el.addEventListener('scroll', onScroll, { passive: true });
    // Must be non-passive so we can preventDefault and stop the list from moving
    // while priorities panel is expanded.
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    // Must be non-passive so we can preventDefault when expanded.
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [
    scrollableElement,
    collapseScrollTopThreshold,
    topThresholdPx,
    wheelExpandAccumThreshold,
    touchExpandPullThreshold,
  ]);
}


