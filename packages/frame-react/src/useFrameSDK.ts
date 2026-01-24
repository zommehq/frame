import { frameSDK } from "@zomme/frame/sdk";
import type { PropChanges } from "@zomme/frame/types";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

// Global state for prop synchronization
const listeners: Set<() => void> = new Set();
let currentProps: Record<string, unknown> = {};
let globalWatcherSetup = false;

function setupGlobalWatcher() {
  if (globalWatcherSetup) return;
  globalWatcherSetup = true;

  // Initialize with current SDK props
  currentProps = { ...frameSDK.props };

  // Watch for all prop changes from SDK
  frameSDK.watch(() => {
    // Update currentProps with new values
    currentProps = { ...frameSDK.props };
    // Notify all subscribers
    for (const listener of listeners) {
      listener();
    }
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot<T>(): T {
  return currentProps as T;
}

/**
 * React hook for using the Frame SDK
 *
 * @template T - Type of props from parent
 * @returns SDK utilities and state
 *
 * @example
 * ```tsx
 * function MyApp() {
 *   const { props, emit, on, isReady } = useFrameSDK<{ user: User }>();
 *
 *   useEffect(() => {
 *     const cleanup = on('route-change', (data) => {
 *       console.log('Route changed:', data);
 *     });
 *     return cleanup;
 *   }, [on]);
 *
 *   return <div>User: {props.user?.name}</div>;
 * }
 * ```
 *
 * @remarks
 * ## Understanding sdkAvailable vs isInitialized
 *
 * **sdkAvailable** (USE THIS):
 * - `true` when SDK successfully connected to parent frame
 * - `false` when running in standalone mode OR not initialized
 * - Use this to guard SDK operations (emit, register, etc.)
 * - Reactive - triggers re-renders when it changes
 *
 * **isInitialized** (INTERNAL):
 * - `true` when SDK initialization completed (success OR failure)
 * - `true` even in standalone mode (initialization was attempted)
 * - Internal SDK flag - prefer `sdkAvailable` in your components
 *
 * ### Standalone Mode
 * When running outside a parent frame:
 * ```
 * sdkAvailable = false  ✅ Use this
 * isInitialized = true  ⚠️ Don't use - misleading
 * ```
 *
 * ### Connected Mode
 * When running inside a parent frame:
 * ```
 * sdkAvailable = true   ✅ Use this
 * isInitialized = true  ⚠️ Don't use - redundant
 * ```
 *
 * ### React StrictMode Compatibility
 * This hook is compatible with React.StrictMode in development.
 * The SDK's `initialize()` is idempotent and safe to call multiple times.
 */
export function useFrameSDK<T = Record<string, unknown>>() {
  // Check if SDK was already initialized (e.g., in main.tsx)
  const alreadyInitialized = frameSDK.isInitialized;

  // Setup global watcher if SDK is initialized
  if (alreadyInitialized && !globalWatcherSetup) {
    setupGlobalWatcher();
  }

  // Use useSyncExternalStore for proper React 18 concurrent mode support
  const props = useSyncExternalStore(
    subscribe,
    () => getSnapshot<T>(),
    () => getSnapshot<T>(), // Server snapshot (same as client for this use case)
  );

  // Track ready state with useState for reactivity
  const [isReady, setIsReady] = useState(alreadyInitialized);
  const [sdkAvailable, setSdkAvailable] = useState(alreadyInitialized);

  useEffect(() => {
    // Skip if already initialized
    if (frameSDK.isInitialized) {
      if (!globalWatcherSetup) {
        setupGlobalWatcher();
        // Trigger re-render after setup
        for (const listener of listeners) {
          listener();
        }
      }
      setIsReady(true);
      setSdkAvailable(true);
      return;
    }

    frameSDK
      .initialize()
      .then(() => {
        setupGlobalWatcher();
        setIsReady(true);
        setSdkAvailable(true);
        // Trigger re-render after initialization
        for (const listener of listeners) {
          listener();
        }
      })
      .catch((error) => {
        console.warn("FrameSDK not available, running in standalone mode", error);
        setIsReady(true);
        setSdkAvailable(false);
      });
  }, []);

  const emit = useCallback(
    (event: string, data?: unknown) => {
      if (sdkAvailable) {
        frameSDK.emit(event, data);
      }
    },
    [sdkAvailable],
  );

  const on = useCallback((event: string, handler: (data: unknown) => void) => {
    return frameSDK.on(event, handler);
  }, []);

  /**
   * Watch for property changes with modern API
   */
  const watch = useCallback((handler: (changes: PropChanges<T>) => void): (() => void) => {
    return frameSDK.watch(handler as any);
  }, []);

  /**
   * Watch for specific property changes with modern API
   */
  const watchProps = useCallback(
    <K extends keyof T>(
      propNames: K[],
      handler: (changes: PropChanges<T, K>) => void,
    ): (() => void) => {
      return frameSDK.watch(propNames as string[], handler as any);
    },
    [],
  );

  return { emit, isReady, on, props, sdkAvailable, watch, watchProps };
}
