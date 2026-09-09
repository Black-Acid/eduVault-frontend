import { vi } from "vitest";

/**
 * Shared handles for the `next/navigation` mocks installed in tests/setup.ts.
 *
 * Component tests assert against these to check where a flow navigates to.
 */

export const routerMock = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

export const navigationState = {
  pathname: "/",
  searchParams: new URLSearchParams(),
};

export function resetNavigationMocks(): void {
  routerMock.push.mockReset();
  routerMock.replace.mockReset();
  routerMock.refresh.mockReset();
  routerMock.back.mockReset();
  routerMock.forward.mockReset();
  routerMock.prefetch.mockReset();
  navigationState.pathname = "/";
  navigationState.searchParams = new URLSearchParams();
}
