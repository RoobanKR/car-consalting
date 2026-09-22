'use client';
import { useRef } from 'react';
import type { TouchEvent } from 'react';

/**
 * Horizontal swipe detection for photo galleries.
 *
 * `onSwipe` receives 1 for a swipe towards the left (show the next photo) and -1
 * for a swipe towards the right. A gesture only counts when it travels far enough
 * AND is more horizontal than vertical, so scrolling the page down through a card
 * never flips its photo by accident.
 *
 * `swiped` stays true for the rest of the gesture so a card wrapped in a link can
 * cancel the click that a browser may fire after the finger lifts.
 */
export function useSwipe(onSwipe: (direction: 1 | -1) => void, threshold = 40) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const handlers = {
    onTouchStart(event: TouchEvent) {
      const touch = event.changedTouches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
      swiped.current = false;
    },
    onTouchEnd(event: TouchEvent) {
      const origin = start.current;
      start.current = null;
      if (!origin) return;
      const touch = event.changedTouches[0];
      const travelledX = touch.clientX - origin.x;
      const travelledY = touch.clientY - origin.y;
      if (Math.abs(travelledX) < threshold || Math.abs(travelledX) <= Math.abs(travelledY)) return;
      swiped.current = true;
      onSwipe(travelledX < 0 ? 1 : -1);
    }
  };

  return { handlers, swiped };
}
