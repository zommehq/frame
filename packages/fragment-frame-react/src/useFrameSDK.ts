import { frameSDK } from "@zomme/fragment-frame/sdk";
import type { PropChanges } from "@zomme/fragment-frame/types";
import { useCallback, useEffect, useState } from "react";

/**
 * React hook for using the Fragment Frame SDK
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
 */
export function useFrameSDK<T = Record<string, unknown>>() {
  const [props, setProps] = useState<T>({} as T);
  const [isReady, setIsReady] = useState(false);
  const [sdkAvailable, setSdkAvailable] = useState(true);

  useEffect(() => {
    frameSDK
      .initialize()
      .then(() => {
        setProps(frameSDK.props as T);
        setIsReady(true);
        setSdkAvailable(true);
      })
      .catch((error) => {
        console.warn("FrameSDK not available, running in standalone mode", error);
        setIsReady(true);
        setSdkAvailable(false);
      });

    return () => {
      if (sdkAvailable) {
        frameSDK.cleanup();
      }
    };
  }, [sdkAvailable]);

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
   *
   * @param handler - Callback receiving all property changes
   * @returns Cleanup function to unwatch
   *
   * @example
   * ```tsx
   * // Watch all properties
   * useEffect(() => {
   *   return watch((changes) => {
   *     Object.entries(changes).forEach(([prop, [newVal, oldVal]]) => {
   *       console.log(`${prop} changed from ${oldVal} to ${newVal}`);
   *     });
   *   });
   * }, [watch]);
   * ```
   */
  const watch = useCallback((handler: (changes: PropChanges<T>) => void): (() => void) => {
    const wrappedHandler = (changes: PropChanges<T>) => {
      // Update local state with new values
      setProps((prev) => {
        const updates = Object.fromEntries(
          Object.entries(changes).map(([key, tuple]) => {
            const value = tuple as any;
            return [key, value?.[0]];
          }),
        );
        return { ...prev, ...updates };
      });
      handler(changes);
    };

    return frameSDK.watch(wrappedHandler as any);
  }, []);

  /**
   * Watch for specific property changes with modern API
   *
   * @param propNames - Array of property names to watch
   * @param handler - Callback receiving specified property changes
   * @returns Cleanup function to unwatch
   *
   * @example
   * ```tsx
   * // Watch specific properties
   * useEffect(() => {
   *   return watchProps(['theme', 'user'], (changes) => {
   *     if ('theme' in changes) {
   *       const [newTheme, oldTheme] = changes.theme;
   *       applyTheme(newTheme);
   *     }
   *   });
   * }, [watchProps]);
   * ```
   */
  const watchProps = useCallback(
    <K extends keyof T>(
      propNames: K[],
      handler: (changes: PropChanges<T, K>) => void,
    ): (() => void) => {
      const wrappedHandler = (changes: PropChanges<T, K>) => {
        // Update local state with new values
        setProps((prev) => {
          const updates = Object.fromEntries(
            Object.entries(changes).map(([key, tuple]) => {
              const value = tuple as any;
              return [key, value?.[0]];
            }),
          );
          return { ...prev, ...updates };
        });
        handler(changes);
      };

      return frameSDK.watch(propNames as string[], wrappedHandler as any);
    },
    [],
  );

  return { emit, isReady, on, props, sdkAvailable, watch, watchProps };
}
