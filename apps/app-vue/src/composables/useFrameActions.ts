import { frameSDK } from "@zomme/frame-vue";
import { onMounted, onUnmounted } from "vue";
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

  onMounted(() => {
    // Don't register if SDK not initialized (standalone mode)
    if (!frameSDK.props.value) return;

    const unregister = frameSDK.register({
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

    // Cleanup on unmount
    onUnmounted(unregister);
  });
}
