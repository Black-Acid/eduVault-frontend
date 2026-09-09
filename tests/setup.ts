import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { resetNavigationMocks } from "./next-mocks";

/**
 * Test environment setup.
 *
 * Fixtures used by these tests live in tests/fixtures.ts. They exist only here
 * - no fixture is ever imported by production code.
 */

// The App Router hooks need a router context that jsdom cannot provide.
vi.mock("next/navigation", async () => {
  const { routerMock, navigationState } = await import("./next-mocks");

  return {
    useRouter: () => routerMock,
    usePathname: () => navigationState.pathname,
    useSearchParams: () => navigationState.searchParams,
    redirect: vi.fn(),
    notFound: vi.fn(),
  };
});

// next/link renders a plain anchor so hrefs stay assertable.
vi.mock("next/link", async () => {
  const React = await import("react");

  return {
    default: ({
      children,
      href,
      ...props
    }: {
      children?: React.ReactNode;
      href: string | { pathname?: string };
    } & Record<string, unknown>) =>
      React.createElement(
        "a",
        { href: typeof href === "string" ? href : (href?.pathname ?? "#"), ...props },
        children,
      ),
  };
});

afterEach(() => {
  cleanup();
  resetNavigationMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  // Keeps expected error paths from cluttering the test output while still
  // letting individual tests assert on logging if they need to.
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});
