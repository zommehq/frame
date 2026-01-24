import { frameSDK, useFrameSDK } from "@zomme/frame-vue";
import { onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

/**
 * Composable to register frame actions that the parent shell can call
 *
 * Registers functions with frameSDK that can be invoked from the parent:
 * - getStats() - Returns current app stats
 * - navigateTo(path) - Navigates to a specific route
 * - refreshData() - Triggers data refresh
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
  const stopWatch = watch(
    sdkAvailable,
    (available) => {
      // Don't register if SDK not available (standalone mode)
      if (!available) return;

      // Unregister previous if exists
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
    { immediate: true },
  );

  // Cleanup on unmount
  onUnmounted(() => {
    stopWatch();
    unregister?.();
  });
}
