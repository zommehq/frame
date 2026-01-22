import { frameSDK } from "@zomme/frame/sdk";
import { watch } from "vue";
import type { Router } from "vue-router";

/**
 * Options for router synchronization
 */
export interface RouterSyncOptions {
  /**
   * Timeout in milliseconds to wait before resetting navigation flag
   * @default 100
   */
  timeout?: number;
}

/**
 * Setup automatic router synchronization between Vue Router and parent shell
 *
 * This function handles bidirectional routing:
 * - Watches frameSDK.props.pathname changes and navigates the Vue router
 * - Emits 'navigate' events to parent when Vue router navigates
 *
 * @param router - Vue Router instance
 * @param options - Optional configuration
 * @returns Cleanup function to remove listeners
 *
 * @example
 * ```typescript
 * import { createRouter } from 'vue-router';
 * import { setupRouterSync } from '@zomme/frame-vue';
 *
 * const router = createRouter({
 *   history: createWebHistory(),
 *   routes: [...]
 * });
 *
 * // Setup bidirectional sync
 * setupRouterSync(router);
 *
 * const app = createApp(App);
 * app.use(router);
 * app.mount('#app');
 * ```
 *
 * @example
 * ```typescript
 * // With custom timeout
 * setupRouterSync(router, { timeout: 150 });
 * ```
 *
 * @example
 * ```typescript
 * // With cleanup
 * const cleanup = setupRouterSync(router);
 *
 * // Later, when you want to stop syncing
 * cleanup();
 * ```
 */
export function setupRouterSync(router: Router, options: RouterSyncOptions = {}): () => void {
  const { timeout = 100 } = options;

  // Flag to prevent emit loop when navigation comes from parent
  let isSyncingFromParent = false;
  let isInitialNavigation = true;

  // Watch pathname prop from parent shell (reactive)
  const stopWatch = watch(
    () => frameSDK.props.pathname,
    (newPathname) => {
      if (!newPathname) return;

      const path = newPathname.startsWith("/") ? newPathname : `/${newPathname}`;

      // Skip if already on this path
      if (router.currentRoute.value.path === path) {
        return;
      }

      isSyncingFromParent = true;
      router.replace(path).finally(() => {
        setTimeout(() => {
          isSyncingFromParent = false;
        }, timeout);
      });
    },
    { immediate: false }, // Don't trigger on initial render
  );

  // Emit navigation events to parent when route changes
  const unregisterRouterHook = router.afterEach((to: any) => {
    // Skip emitting event for initial navigation
    if (isInitialNavigation) {
      isInitialNavigation = false;
      return;
    }

    // Skip if navigation was triggered by parent
    if (isSyncingFromParent) {
      return;
    }

    frameSDK.emit("navigate", { path: to.path, replace: false, state: to.meta });
  });

  // Return cleanup function
  return () => {
    stopWatch();
    unregisterRouterHook();
  };
}
