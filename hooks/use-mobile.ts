import * as React from "react";

const MOBILE_BREAKPOINT = 768;

const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

/** The server has no viewport, so it always renders the desktop layout. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Subscribes to the mobile breakpoint.
 *
 * `useSyncExternalStore` is used rather than an effect that calls setState, so
 * the first client render already has the correct value and there is no
 * cascading re-render.
 */
export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
