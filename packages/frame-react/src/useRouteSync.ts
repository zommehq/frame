import { frameSDK } from "@zomme/frame/sdk";
import { useEffect, useRef } from "react";
import { useFrameSDK } from "./useFrameSDK";

/**
 * Options for route synchronization
 */
export interface RouteSyncOptions {
  /**
   * Timeout in milliseconds to wait before resetting navigation flag
   * @default 100
   */
  timeout?: number;
}

/**
 * Hook for automatic route synchronization between router and parent shell
 *
 * This hook handles bidirectional routing in a router-agnostic way:
 * - Observes frameSDK.props.pathname changes and calls navigate function
 * - Emits 'navigate' events to parent when route changes
 *
 * Works with any React router (react-router, tanstack-router, wouter, etc.)
 *
 * @param getCurrentPath - Function that returns the current pathname
 * @param navigate - Function to navigate to a new path
 * @param options - Optional configuration
 *
 * @example
 * ```tsx
 * // With react-router-dom
 * import { useLocation, useNavigate } from 'react-router-dom';
 * import { useRouteSync } from '@zomme/frame-react';
 *
 * function App() {
 *   const location = useLocation();
 *   const navigate = useNavigate();
 *
 *   useRouteSync(
 *     () => location.pathname,
 *     (path) => navigate(path, { replace: true })
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With TanStack Router
 * import { useRouter } from '@tanstack/react-router';
 * import { useRouteSync } from '@zomme/frame-react';
 *
 * function App() {
 *   const router = useRouter();
 *
 *   useRouteSync(
 *     () => router.state.location.pathname,
 *     (path) => router.navigate({ to: path })
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom timeout
 * useRouteSync(
 *   () => location.pathname,
 *   navigate,
 *   { timeout: 150 }
 * );
 * ```
 */
export function useRouteSync(
  getCurrentPath: () => string,
  navigate: (path: string) => void,
  options: RouteSyncOptions = {},
): void {
  const { timeout = 100 } = options;
  const { props } = useFrameSDK();

  // Flag to track shell navigation state
  const isNavigatingFromShell = useRef(false);

  // Get current path
  const currentPath = getCurrentPath();

  // Initialize lastEmittedPath SYNCHRONOUSLY on first render
  // This prevents emitting the initial path to the shell
  const lastEmittedPath = useRef<string>(currentPath);

  // Watch pathname prop from parent shell (reactive via useEffect)
  useEffect(() => {
    const pathname = props.pathname as string | undefined;

    // Skip if pathname hasn't changed or is undefined
    if (!pathname || pathname === currentPath) return;

    // Set flag to prevent emitting navigate back to shell
    isNavigatingFromShell.current = true;
    navigate(pathname);

    // Update lastEmittedPath
    lastEmittedPath.current = pathname;

    // Reset flag after navigation completes
    const timeoutId = setTimeout(() => {
      isNavigatingFromShell.current = false;
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, [props.pathname, currentPath, navigate, timeout]);

  // Emit navigation events to parent when route changes
  useEffect(() => {
    // Skip if path hasn't changed (avoid duplicate emissions)
    if (currentPath === lastEmittedPath.current) {
      return;
    }

    // Skip if this navigation came from the shell
    if (isNavigatingFromShell.current) {
      return;
    }

    // Update lastEmittedPath and emit to parent
    lastEmittedPath.current = currentPath;
    frameSDK.emit("navigate", { path: currentPath, replace: false, state: {} });
  }, [currentPath]);
}
