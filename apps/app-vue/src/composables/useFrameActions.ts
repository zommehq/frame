import { frameSDK, useFrameSDK } from "@zomme/frame-vue";
import { onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

/**
 * Composable to register frame actions that the parent shell can call
 *
 * Registers functions with frameSDK that can be invoked from the parent:
 * - **getStats()** - Returns current app statistics
 * - **navigateTo(path)** - Navigates to a specific route
 * - **refreshData()** - Triggers data refresh operation
 *
 * @remarks
 * ## Why sdkAvailable instead of isInitialized?
 *
 * This composable watches `sdkAvailable` (not `isInitialized`) to determine
 * when to register actions. This is critical because:
 *
 * - `isInitialized = true` even in standalone mode (initialization attempted)
 * - `sdkAvailable = true` only when connected to parent frame
 *
 * Using `sdkAvailable` ensures actions are only registered when there's
 * an actual parent to call them, preventing unnecessary registrations in
 * standalone mode.
 *
 * ## Watch with immediate: true
 *
 * The `watch` uses `immediate: true` to ensure registration happens as soon
 * as the SDK becomes available, even if it was already available before this
 * composable was called. This handles both scenarios:
 *
 * 1. **SDK available first**: Composable called after SDK initialized
 *    → `immediate: true` triggers registration immediately
 *
 * 2. **Composable first**: Composable called before SDK initialized
 *    → Watch triggers when `sdkAvailable` changes to `true`
 *
 * ## Vue Reactivity Compatibility
 *
 * This composable is fully compatible with Vue's reactivity system.
 * The `sdkAvailable` ref is watched reactively, so if the SDK state
 * changes (though rare), actions will be re-registered automatically.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useFrameActions } from './composables/useFrameActions';
 *
 * useFrameActions(); // Register actions
 * </script>
 * ```
 */
export function useFrameActions() {
  const router = useRouter();
  const route = useRoute();
  const { sdkAvailable } = useFrameSDK();

  let unregister: (() => void) | undefined;

  // Watch for SDK availability and register when ready
  //
  // We use sdkAvailable (not isInitialized) because:
  // - isInitialized = true even in standalone mode (initialization attempted)
  // - sdkAvailable = true only when connected to parent frame
  //
  // This prevents registering actions when there's no parent to call them.
  const stopWatch = watch(
    sdkAvailable,
    (available) => {
      // Don't register if SDK not available (standalone mode)
      if (!available) return;

      // Unregister previous if exists (cleanup from previous registration)
      if (unregister) {
        unregister();
      }

      unregister = frameSDK.register({
        /**
         * Get current app statistics
         */
        getStats: () => ({
          currentRoute: route.path,
          theme: document.body.className || "light",
          timestamp: Date.now(),
        }),

        /**
         * Navigate to a specific route
         */
        navigateTo: async (path: string) => {
          await router.push(path);
          return {
            navigatedTo: path,
            timestamp: Date.now(),
          };
        },

        /**
         * Refresh app data
         */
        refreshData: async () => {
          // Simulate async refresh operation
          await new Promise((resolve) => setTimeout(resolve, 300));
          return {
            refreshedAt: Date.now(),
            success: true,
          };
        },
      });
    },
    { immediate: true }, // Register immediately if SDK already available
  );

  // Cleanup on unmount
  onUnmounted(() => {
    stopWatch();
    unregister?.();
  });
}
