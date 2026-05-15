import { useCallback, useEffect, useRef } from "react";

/**
 * Touch-only long-press hook. On devices with a fine pointer (mouse) the
 * returned handlers are no-ops, so desktop hover/click behavior is untouched.
 *
 * Behavior on coarse pointers (touch):
 *  - pointer down starts a timer
 *  - movement > moveTolerance, pointer cancel/leave, or pointer up before
 *    threshold cancels the long-press; if pointer up came first we fire onTap
 *  - reaching threshold fires onLongPress and suppresses the trailing
 *    synthetic click that iOS/Android emit after a long-press
 */
export function useLongPress<T extends HTMLElement = HTMLElement>(opts: {
  onLongPress: (e: React.PointerEvent<T>) => void;
  onTap?: (e: React.PointerEvent<T>) => void;
  threshold?: number;
  moveTolerance?: number;
  /** When true, the hook will not arm even on coarse pointers. */
  disabled?: boolean;
}) {
  const { onLongPress, onTap, threshold = 500, moveTolerance = 8, disabled = false } = opts;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);
  const suppressClickRef = useRef(false);

  // Stable refs so consumers don't have to memoize callbacks.
  const onLongPressRef = useRef(onLongPress);
  const onTapRef = useRef(onTap);
  useEffect(() => { onLongPressRef.current = onLongPress; }, [onLongPress]);
  useEffect(() => { onTapRef.current = onTap; }, [onTap]);

  const isCoarse = useCallback(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(pointer: coarse)").matches;
  }, []);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  if (disabled || !isCoarse()) {
    // Return no handlers on desktop or when disabled — desktop click/hover
    // path is completely untouched.
    return {} as Record<string, (e: React.PointerEvent<T>) => void> & {
      onClickCapture?: (e: React.MouseEvent<T>) => void;
    };
  }

  return {
    onPointerDown: (e: React.PointerEvent<T>) => {
      if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
      firedRef.current = false;
      suppressClickRef.current = false;
      startRef.current = { x: e.clientX, y: e.clientY };
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        suppressClickRef.current = true;
        timerRef.current = null;
        onLongPressRef.current(e);
      }, threshold);
    },
    onPointerMove: (e: React.PointerEvent<T>) => {
      if (!startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (dx * dx + dy * dy > moveTolerance * moveTolerance) {
        cancel();
      }
    },
    onPointerUp: (e: React.PointerEvent<T>) => {
      const armed = timerRef.current !== null;
      cancel();
      if (armed && !firedRef.current && (e.pointerType === "touch" || e.pointerType === "pen")) {
        suppressClickRef.current = true;
        onTapRef.current?.(e);
      }
    },
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    // Swallow the synthetic click that follows touch sequences so we don't
    // double-fire (long-press fires its own action; tap fires onTap on
    // pointerup).
    onClickCapture: (e: React.MouseEvent<T>) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
}