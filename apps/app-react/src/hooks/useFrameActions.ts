import { frameSDK } from "@zomme/frame-react";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Hook to register frame actions that the parent shell can call
 *
 * Registers functions with frameSDK that can be invoked from the parent:
 * - getStats() - Returns current app stats
 * - navigateTo(path) - Navigates to a specific route
 * - refreshData() - Triggers data refresh
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

  useEffect(() => {
    // Don't register if SDK not initialized (standalone mode)
    if (!frameSDK.isInitialized) {
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
  }, [navigate, location.pathname]);
}
