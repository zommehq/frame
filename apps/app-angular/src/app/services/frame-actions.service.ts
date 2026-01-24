import { Injectable, inject } from "@angular/core";
import { Router } from "@angular/router";
import { FrameSDKService, frameSDK } from "@zomme/frame-angular";

/**
 * Service to register functions that the parent shell can call.
 *
 * These functions are exposed via frameSDK.register() and can be called
 * from the parent using frame.actionName() syntax.
 *
 * @remarks
 * ## Why FrameSDKService.sdkAvailable instead of isStandaloneMode()?
 *
 * This service uses `FrameSDKService.sdkAvailable` (not the deprecated
 * `isStandaloneMode()` function) to check if we should register actions.
 * This ensures consistency with React and Vue implementations.
 *
 * **Benefits over isStandaloneMode():**
 * - Consistent pattern across all frameworks (React, Vue, Angular)
 * - Reactive (Observable available if needed: `sdkAvailable$`)
 * - Semantic clarity: "is SDK available?" vs "is NOT standalone?"
 * - Proper dependency injection (testable, mockable)
 *
 * **Why sdkAvailable instead of isInitialized?**
 * - `isInitialized = true` even in standalone mode (initialization attempted)
 * - `sdkAvailable = true` only when connected to parent frame
 * - This prevents registering actions when there's no parent to call them
 *
 * @example
 * ```typescript
 * // In parent shell:
 * const stats = await frame.getStats();
 * await frame.refreshData();
 * await frame.navigateTo('/settings');
 * ```
 */
@Injectable({ providedIn: "root" })
export class FrameActionsService {
  private router = inject(Router);
  private frameSDKService = inject(FrameSDKService);
  private unregister?: () => void;

  /**
   * Register all actions with the parent shell.
   * Only registers if SDK is connected (not standalone mode).
   *
   * We check sdkAvailable (not isStandaloneMode) because:
   * - `sdkAvailable = true` only when connected to parent frame
   * - Consistent pattern across React, Vue, and Angular
   * - Reactive state available if needed (`sdkAvailable$`)
   */
  register(): void {
    // Don't register if SDK not connected to parent (standalone mode)
    //
    // We use frameSDKService.sdkAvailable instead of the deprecated
    // isStandaloneMode() function for consistency with other frameworks.
    if (!this.frameSDKService.sdkAvailable) return;

    this.unregister = frameSDK.register({
      getStats: () => this.getStats(),
      navigateTo: (path: string) => this.navigateTo(path),
      refreshData: () => this.refreshData(),
    });
  }

  /**
   * Cleanup registered actions.
   * Called automatically on app destroy.
   */
  cleanup(): void {
    this.unregister?.();
  }

  /**
   * Get current app stats
   */
  private getStats() {
    return {
      currentRoute: this.router.url,
      theme: document.body.className || "light",
      timestamp: Date.now(),
    };
  }

  /**
   * Navigate to a specific route
   */
  private async navigateTo(path: string) {
    await this.router.navigateByUrl(path);
    return {
      navigatedTo: path,
      timestamp: Date.now(),
    };
  }

  /**
   * Refresh data in the app
   */
  private async refreshData() {
    // Simulate async refresh operation
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      refreshedAt: Date.now(),
      success: true,
    };
  }
}
