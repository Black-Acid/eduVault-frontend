"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

export function PageTransitionLoader() {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = React.useState(false);
  const pendingNavigationRef = React.useRef<number | null>(null);
  const targetPathRef = React.useRef<string | null>(null);
  const startedAtRef = React.useRef<number>(0);
  const minimumVisibleMs = 1200;

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest("a[href]") as HTMLAnchorElement | null;

      if (!link || link.target && link.target !== "_self" || link.hasAttribute("download")) {
        return;
      }

      let nextUrl: URL;

      try {
        nextUrl = new URL(link.href);
      } catch {
        return;
      }

      if (nextUrl.origin !== window.location.origin) {
        return;
      }

      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;

      if (currentPath === nextPath) {
        return;
      }

      event.preventDefault();

      targetPathRef.current = nextPath;
      startedAtRef.current = Date.now();

      if (pendingNavigationRef.current) {
        window.clearTimeout(pendingNavigationRef.current);
      }

      setVisible(true);

      pendingNavigationRef.current = window.setTimeout(() => {
        router.push(nextPath);
      }, 220);
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);

      if (pendingNavigationRef.current) {
        window.clearTimeout(pendingNavigationRef.current);
      }
    };
  }, [router]);

  React.useEffect(() => {
    if (!visible || targetPathRef.current !== pathname) {
      return;
    }

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(minimumVisibleMs - elapsed, 0);

    const timeout = window.setTimeout(() => {
      setVisible(false);
      targetPathRef.current = null;
    }, remaining);

    return () => window.clearTimeout(timeout);
  }, [pathname, visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-lg">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl border border-white/15 bg-white/12 px-8 py-10 text-center text-white shadow-2xl shadow-slate-950/35">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold tracking-tight">Loading page</p>
          <p className="text-sm text-white/70">
            Please wait while we switch views and load data.
          </p>
        </div>
      </div>
    </div>
  );
}