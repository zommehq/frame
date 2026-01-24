import { frameSDK, useFrameSDK } from "@zomme/frame-react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Hook to register frame actions that the parent shell can call
 *
 * Registers functions with frameSDK that can be invoked from the parent:
 * - **getStats()** - Returns current app statistics
 * - **navigateTo(path)** - Navigates to a specific route
 * - **refreshData()** - Triggers data refresh operation
 *
 * @remarks
 * ## Why sdkAvailable instead of isInitialized?
 *
 * This hook uses `sdkAvailable` (not `isInitialized`) to determine when
 * to register actions. This is critical because:
 *
 * - `isInitialized = true` even in standalone mode (initialization attempted)
 * - `sdkAvailable = true` only when connected to parent frame
 *
 * Using `sdkAvailable` ensures actions are only registered when there's
 * an actual parent to call them, preventing unnecessary registrations in
 * standalone mode.
 *
 * ## React StrictMode Compatibility
 *
 * This hook is compatible with React.StrictMode. During development:
 * 1. Effect runs first time → registers functions
 * 2. StrictMode cleanup → unregisters functions (cleanup function called)
 * 3. Effect runs second time → registers functions again
 * 4. Final state: functions properly registered ✅
 *
 * The `register()` method is idempotent - it safely overwrites previous
 * registrations using a Map internally.
 *
 * @example
 * ```tsx
 * function App() {
 *   useFrameActions(); // Register actions
 *   return <div>...</div>;
 * }
 * ```
 */
export function useFrameActions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sdkAvailable } = useFrameSDK();

  useEffect(() => {
    // Don't register if SDK not connected to parent (standalone mode)
    //
    // We check sdkAvailable (not frameSDK.isInitialized) because:
    // - isInitialized = true even in standalone mode (initialization attempted)
    // - sdkAvailable = true only when connected to parent frame
    //
    // This prevents registering actions when there's no parent to call them.
    if (!sdkAvailable) {
      return;
    }

    const unregister = frameSDK.register({
      /**
       * Get current app statistics
       */
      getStats: () => ({
        currentRoute: location.pathname,
        theme: document.body.className || "light",
        timestamp: Date.now(),
      }),

      /**
       * Navigate to a specific route
       */
      navigateTo: async (path: string) => {
        navigate(path);
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
    return unregister;
  }, [sdkAvailable, navigate, location.pathname]);
}
